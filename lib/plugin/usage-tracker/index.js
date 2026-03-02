const fs = require("fs");
const os = require("os");
const path = require("path");
const { DatabaseSync } = require("node:sqlite");

const kPluginId = "usage-tracker";
const kFallbackRootDir = path.join(os.homedir(), ".alphaclaw");

const coerceCount = (value) => {
  const parsed = Number.parseInt(String(value ?? 0), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

const resolveRootDir = () =>
  process.env.ALPHACLAW_ROOT_DIR ||
  process.env.OPENCLAW_HOME ||
  process.env.OPENCLAW_ROOT_DIR ||
  kFallbackRootDir;

const safeAlterTable = (database, sql) => {
  try {
    database.exec(sql);
  } catch (err) {
    const message = String(err?.message || "").toLowerCase();
    if (!message.includes("duplicate column name")) throw err;
  }
};

const ensureSchema = (database) => {
  database.exec("PRAGMA journal_mode=WAL;");
  database.exec("PRAGMA synchronous=NORMAL;");
  database.exec("PRAGMA busy_timeout=5000;");
  database.exec(`
    CREATE TABLE IF NOT EXISTS usage_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp INTEGER NOT NULL,
      session_id TEXT,
      session_key TEXT,
      run_id TEXT,
      provider TEXT NOT NULL,
      model TEXT NOT NULL,
      input_tokens INTEGER NOT NULL DEFAULT 0,
      output_tokens INTEGER NOT NULL DEFAULT 0,
      cache_read_tokens INTEGER NOT NULL DEFAULT 0,
      cache_write_tokens INTEGER NOT NULL DEFAULT 0,
      total_tokens INTEGER NOT NULL DEFAULT 0
    );
  `);
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_usage_events_ts
    ON usage_events(timestamp DESC);
  `);
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_usage_events_session
    ON usage_events(session_id);
  `);
  safeAlterTable(
    database,
    "ALTER TABLE usage_events ADD COLUMN session_key TEXT;",
  );
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_usage_events_session_key
    ON usage_events(session_key);
  `);
  database.exec(`
    CREATE TABLE IF NOT EXISTS usage_daily (
      date TEXT NOT NULL,
      model TEXT NOT NULL,
      provider TEXT,
      input_tokens INTEGER NOT NULL DEFAULT 0,
      output_tokens INTEGER NOT NULL DEFAULT 0,
      cache_read_tokens INTEGER NOT NULL DEFAULT 0,
      cache_write_tokens INTEGER NOT NULL DEFAULT 0,
      total_tokens INTEGER NOT NULL DEFAULT 0,
      turn_count INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (date, model)
    );
  `);
  database.exec(`
    CREATE TABLE IF NOT EXISTS tool_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp INTEGER NOT NULL,
      session_id TEXT,
      session_key TEXT,
      tool_name TEXT NOT NULL,
      success INTEGER NOT NULL DEFAULT 1,
      duration_ms INTEGER
    );
  `);
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_tool_events_session
    ON tool_events(session_id);
  `);
  safeAlterTable(
    database,
    "ALTER TABLE tool_events ADD COLUMN session_key TEXT;",
  );
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_tool_events_session_key
    ON tool_events(session_key);
  `);
};

const createPlugin = () => {
  let database = null;
  let dbPath = "";
  let insertUsageEventStmt = null;
  let upsertUsageDailyStmt = null;
  let insertToolEventStmt = null;

  const getDatabase = () => {
    if (database) return database;
    const rootDir = resolveRootDir();
    const dbDir = path.join(rootDir, "db");
    fs.mkdirSync(dbDir, { recursive: true });
    dbPath = path.join(dbDir, "usage.db");
    database = new DatabaseSync(dbPath);
    ensureSchema(database);
    insertUsageEventStmt = database.prepare(`
      INSERT INTO usage_events (
        timestamp,
        session_id,
        session_key,
        run_id,
        provider,
        model,
        input_tokens,
        output_tokens,
        cache_read_tokens,
        cache_write_tokens,
        total_tokens
      ) VALUES (
        $timestamp,
        $session_id,
        $session_key,
        $run_id,
        $provider,
        $model,
        $input_tokens,
        $output_tokens,
        $cache_read_tokens,
        $cache_write_tokens,
        $total_tokens
      )
    `);
    upsertUsageDailyStmt = database.prepare(`
      INSERT INTO usage_daily (
        date,
        model,
        provider,
        input_tokens,
        output_tokens,
        cache_read_tokens,
        cache_write_tokens,
        total_tokens,
        turn_count
      ) VALUES (
        $date,
        $model,
        $provider,
        $input_tokens,
        $output_tokens,
        $cache_read_tokens,
        $cache_write_tokens,
        $total_tokens,
        1
      )
      ON CONFLICT(date, model) DO UPDATE SET
        provider = COALESCE(excluded.provider, usage_daily.provider),
        input_tokens = usage_daily.input_tokens + excluded.input_tokens,
        output_tokens = usage_daily.output_tokens + excluded.output_tokens,
        cache_read_tokens = usage_daily.cache_read_tokens + excluded.cache_read_tokens,
        cache_write_tokens = usage_daily.cache_write_tokens + excluded.cache_write_tokens,
        total_tokens = usage_daily.total_tokens + excluded.total_tokens,
        turn_count = usage_daily.turn_count + 1
    `);
    insertToolEventStmt = database.prepare(`
      INSERT INTO tool_events (
        timestamp,
        session_id,
        session_key,
        tool_name,
        success,
        duration_ms
      ) VALUES (
        $timestamp,
        $session_id,
        $session_key,
        $tool_name,
        $success,
        $duration_ms
      )
    `);
    return database;
  };

  const writeUsageEvent = (event, ctx, logger) => {
    const usage = event?.usage ?? {};
    const timestamp = Date.now();
    const date = new Date(timestamp).toISOString().slice(0, 10);
    const inputTokens = coerceCount(usage.input);
    const outputTokens = coerceCount(usage.output);
    const cacheReadTokens = coerceCount(usage.cacheRead);
    const cacheWriteTokens = coerceCount(usage.cacheWrite);
    const fallbackTotal = inputTokens + outputTokens + cacheReadTokens + cacheWriteTokens;
    const totalTokens = coerceCount(usage.total) || fallbackTotal;
    if (totalTokens <= 0) return;
    getDatabase();
    insertUsageEventStmt.run({
      $timestamp: timestamp,
      $session_id: String(event?.sessionId || ctx?.sessionId || ""),
      $session_key: String(ctx?.sessionKey || ""),
      $run_id: String(event?.runId || ""),
      $provider: String(event?.provider || "unknown"),
      $model: String(event?.model || "unknown"),
      $input_tokens: inputTokens,
      $output_tokens: outputTokens,
      $cache_read_tokens: cacheReadTokens,
      $cache_write_tokens: cacheWriteTokens,
      $total_tokens: totalTokens,
    });
    upsertUsageDailyStmt.run({
      $date: date,
      $model: String(event?.model || "unknown"),
      $provider: String(event?.provider || "unknown"),
      $input_tokens: inputTokens,
      $output_tokens: outputTokens,
      $cache_read_tokens: cacheReadTokens,
      $cache_write_tokens: cacheWriteTokens,
      $total_tokens: totalTokens,
    });
    if (logger?.debug) {
      logger.debug(
        `[${kPluginId}] usage event recorded model=${String(event?.model || "unknown")} total=${totalTokens}`,
      );
    }
  };

  const deriveToolSuccess = (event) => {
    const message = event?.message;
    if (!message || typeof message !== "object") {
      return event?.error ? 0 : 1;
    }
    if (message?.isError === true) return 0;
    if (message?.ok === false) return 0;
    if (typeof message?.error === "string" && message.error.trim()) return 0;
    return 1;
  };

  const writeToolEvent = (event, ctx) => {
    const toolName = String(event?.toolName || "").trim();
    if (!toolName) return;
    const sessionKey = String(ctx?.sessionKey || "").trim();
    const sessionId = String(ctx?.sessionId || "").trim();
    if (!sessionKey && !sessionId) return;
    getDatabase();
    insertToolEventStmt.run({
      $timestamp: Date.now(),
      $session_id: sessionId,
      $session_key: sessionKey,
      $tool_name: toolName,
      $success: deriveToolSuccess(event),
      $duration_ms: coerceCount(event?.durationMs) || null,
    });
  };

  return {
    id: kPluginId,
    name: "AlphaClaw Usage Tracker",
    description: "Captures LLM and tool usage into SQLite for Usage UI",
    register: (api) => {
      const logger = api?.logger;
      try {
        getDatabase();
        logger?.info?.(`[${kPluginId}] initialized db=${dbPath}`);
      } catch (err) {
        logger?.error?.(`[${kPluginId}] failed to initialize database: ${err?.message || err}`);
        return;
      }
      api.on("llm_output", (event, ctx) => {
        try {
          writeUsageEvent(event, ctx, logger);
        } catch (err) {
          logger?.error?.(`[${kPluginId}] llm_output write error: ${err?.message || err}`);
        }
      });
      api.on("tool_result_persist", (event, ctx) => {
        try {
          writeToolEvent(
            {
              ...event,
              toolName: String(event?.toolName || ctx?.toolName || ""),
              durationMs: event?.durationMs,
            },
            ctx,
          );
        } catch (err) {
          logger?.error?.(`[${kPluginId}] tool_result_persist write error: ${err?.message || err}`);
        }
        return {};
      });
    },
  };
};

const plugin = createPlugin();
module.exports = plugin;
module.exports.default = plugin;
