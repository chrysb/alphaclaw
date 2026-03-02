const fs = require("fs");
const path = require("path");
const { DatabaseSync } = require("node:sqlite");

const kDefaultSessionLimit = 50;
const kMaxSessionLimit = 200;
const kDefaultDays = 30;
const kDefaultMaxPoints = 100;
const kMaxMaxPoints = 1000;
const kTokensPerMillion = 1_000_000;
const kGlobalModelPricing = {
  "claude-opus-4-6": { input: 15.0, output: 75.0 },
  "claude-sonnet-4-6": { input: 3.0, output: 15.0 },
  "claude-haiku-4-6": { input: 0.8, output: 4.0 },
  "gpt-5.1-codex": { input: 2.5, output: 10.0 },
  "gpt-5.3-codex": { input: 2.5, output: 10.0 },
  "gpt-4o": { input: 2.5, output: 10.0 },
  "gemini-3-pro-preview": { input: 1.25, output: 5.0 },
  "gemini-3-flash-preview": { input: 0.1, output: 0.4 },
  "gemini-2.0-flash": { input: 0.1, output: 0.4 },
};

let db = null;
let usageDbPath = "";

const coerceInt = (value, fallbackValue = 0) => {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) ? parsed : fallbackValue;
};

const clampInt = (value, minValue, maxValue, fallbackValue) =>
  Math.min(maxValue, Math.max(minValue, coerceInt(value, fallbackValue)));

const resolvePricing = (model) => {
  const normalized = String(model || "").toLowerCase();
  if (!normalized) return null;
  const exact = kGlobalModelPricing[normalized];
  if (exact) return exact;
  const matchKey = Object.keys(kGlobalModelPricing).find((key) =>
    normalized.includes(key),
  );
  return matchKey ? kGlobalModelPricing[matchKey] : null;
};

const deriveCostBreakdown = ({
  inputTokens = 0,
  outputTokens = 0,
  cacheReadTokens = 0,
  cacheWriteTokens = 0,
  model = "",
}) => {
  const pricing = resolvePricing(model);
  if (!pricing) {
    return {
      inputCost: 0,
      outputCost: 0,
      cacheReadCost: 0,
      cacheWriteCost: 0,
      totalCost: 0,
      pricingFound: false,
    };
  }
  const inputCost = (inputTokens / kTokensPerMillion) * pricing.input;
  const outputCost = (outputTokens / kTokensPerMillion) * pricing.output;
  const cacheReadCost = 0;
  const cacheWriteCost = (cacheWriteTokens / kTokensPerMillion) * pricing.input;
  return {
    inputCost,
    outputCost,
    cacheReadCost,
    cacheWriteCost,
    totalCost: inputCost + outputCost + cacheReadCost + cacheWriteCost,
    pricingFound: true,
  };
};

const ensureDb = () => {
  if (!db) throw new Error("Usage DB not initialized");
  return db;
};

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

const initUsageDb = ({ rootDir }) => {
  const dbDir = path.join(rootDir, "db");
  fs.mkdirSync(dbDir, { recursive: true });
  usageDbPath = path.join(dbDir, "usage.db");
  db = new DatabaseSync(usageDbPath);
  ensureSchema(db);
  return { path: usageDbPath };
};

const toDayKey = (timestampMs) => new Date(timestampMs).toISOString().slice(0, 10);

const getPeriodRange = (days) => {
  const now = Date.now();
  const safeDays = clampInt(days, 1, 3650, kDefaultDays);
  const startMs = now - safeDays * 24 * 60 * 60 * 1000;
  return { now, safeDays, startDay: toDayKey(startMs) };
};

const appendCostToRows = (rows) =>
  rows.map((row) => {
    const inputTokens = coerceInt(row.input_tokens);
    const outputTokens = coerceInt(row.output_tokens);
    const cacheReadTokens = coerceInt(row.cache_read_tokens);
    const cacheWriteTokens = coerceInt(row.cache_write_tokens);
    const totalTokens =
      coerceInt(row.total_tokens) ||
      inputTokens + outputTokens + cacheReadTokens + cacheWriteTokens;
    const cost = deriveCostBreakdown({
      inputTokens,
      outputTokens,
      cacheReadTokens,
      cacheWriteTokens,
      model: row.model,
    });
    return {
      ...row,
      inputTokens,
      outputTokens,
      cacheReadTokens,
      cacheWriteTokens,
      totalTokens,
      ...cost,
    };
  });

const getDailySummary = ({ days = kDefaultDays } = {}) => {
  const database = ensureDb();
  const { safeDays, startDay } = getPeriodRange(days);
  const rows = database
    .prepare(`
      SELECT
        date,
        model,
        provider,
        input_tokens,
        output_tokens,
        cache_read_tokens,
        cache_write_tokens,
        total_tokens,
        turn_count
      FROM usage_daily
      WHERE date >= $startDay
      ORDER BY date ASC, total_tokens DESC
    `)
    .all({ $startDay: startDay });
  const enriched = appendCostToRows(rows);
  const byDate = new Map();
  for (const row of enriched) {
    if (!byDate.has(row.date)) byDate.set(row.date, []);
    byDate.get(row.date).push({
      model: row.model,
      provider: row.provider,
      inputTokens: row.inputTokens,
      outputTokens: row.outputTokens,
      cacheReadTokens: row.cacheReadTokens,
      cacheWriteTokens: row.cacheWriteTokens,
      totalTokens: row.totalTokens,
      turnCount: coerceInt(row.turn_count),
      totalCost: row.totalCost,
      inputCost: row.inputCost,
      outputCost: row.outputCost,
      cacheReadCost: row.cacheReadCost,
      cacheWriteCost: row.cacheWriteCost,
      pricingFound: row.pricingFound,
    });
  }
  const daily = [];
  const totals = {
    inputTokens: 0,
    outputTokens: 0,
    cacheReadTokens: 0,
    cacheWriteTokens: 0,
    totalTokens: 0,
    totalCost: 0,
    turnCount: 0,
    modelCount: 0,
  };
  for (const [date, modelRows] of byDate.entries()) {
    const aggregate = modelRows.reduce(
      (acc, row) => ({
        inputTokens: acc.inputTokens + row.inputTokens,
        outputTokens: acc.outputTokens + row.outputTokens,
        cacheReadTokens: acc.cacheReadTokens + row.cacheReadTokens,
        cacheWriteTokens: acc.cacheWriteTokens + row.cacheWriteTokens,
        totalTokens: acc.totalTokens + row.totalTokens,
        totalCost: acc.totalCost + row.totalCost,
        turnCount: acc.turnCount + row.turnCount,
      }),
      {
        inputTokens: 0,
        outputTokens: 0,
        cacheReadTokens: 0,
        cacheWriteTokens: 0,
        totalTokens: 0,
        totalCost: 0,
        turnCount: 0,
      },
    );
    daily.push({ date, ...aggregate, models: modelRows });
    totals.inputTokens += aggregate.inputTokens;
    totals.outputTokens += aggregate.outputTokens;
    totals.cacheReadTokens += aggregate.cacheReadTokens;
    totals.cacheWriteTokens += aggregate.cacheWriteTokens;
    totals.totalTokens += aggregate.totalTokens;
    totals.totalCost += aggregate.totalCost;
    totals.turnCount += aggregate.turnCount;
    totals.modelCount += modelRows.length;
  }
  return {
    updatedAt: Date.now(),
    days: safeDays,
    daily,
    totals,
  };
};

const getSessionsList = ({ limit = kDefaultSessionLimit } = {}) => {
  const database = ensureDb();
  const safeLimit = clampInt(limit, 1, kMaxSessionLimit, kDefaultSessionLimit);
  const rows = database
    .prepare(`
      SELECT
        COALESCE(NULLIF(session_key, ''), NULLIF(session_id, '')) AS session_ref,
        MAX(session_key) AS session_key,
        MAX(session_id) AS session_id,
        MIN(timestamp) AS first_activity_ms,
        MAX(timestamp) AS last_activity_ms,
        COUNT(*) AS turn_count,
        SUM(input_tokens) AS input_tokens,
        SUM(output_tokens) AS output_tokens,
        SUM(cache_read_tokens) AS cache_read_tokens,
        SUM(cache_write_tokens) AS cache_write_tokens,
        SUM(total_tokens) AS total_tokens
      FROM usage_events
      WHERE COALESCE(NULLIF(session_key, ''), NULLIF(session_id, '')) IS NOT NULL
      GROUP BY session_ref
      ORDER BY last_activity_ms DESC
      LIMIT $limit
    `)
    .all({ $limit: safeLimit });
  return rows.map((row) => {
    const modelRows = appendCostToRows(
      database
        .prepare(`
        SELECT
          model,
          SUM(input_tokens) AS input_tokens,
          SUM(output_tokens) AS output_tokens,
          SUM(cache_read_tokens) AS cache_read_tokens,
          SUM(cache_write_tokens) AS cache_write_tokens,
          SUM(total_tokens) AS total_tokens
        FROM usage_events
        WHERE COALESCE(NULLIF(session_key, ''), NULLIF(session_id, '')) = $sessionRef
        GROUP BY model
        ORDER BY total_tokens DESC
      `)
        .all({ $sessionRef: row.session_ref }),
    );
    const dominantModel = String(modelRows[0]?.model || "");
    const totalCost = modelRows.reduce(
      (sum, modelRow) => sum + Number(modelRow.totalCost || 0),
      0,
    );
    return {
      sessionId: row.session_ref,
      sessionKey: String(row.session_key || ""),
      rawSessionId: String(row.session_id || ""),
      firstActivityMs: coerceInt(row.first_activity_ms),
      lastActivityMs: coerceInt(row.last_activity_ms),
      durationMs: Math.max(
        0,
        coerceInt(row.last_activity_ms) - coerceInt(row.first_activity_ms),
      ),
      turnCount: coerceInt(row.turn_count),
      inputTokens: coerceInt(row.input_tokens),
      outputTokens: coerceInt(row.output_tokens),
      cacheReadTokens: coerceInt(row.cache_read_tokens),
      cacheWriteTokens: coerceInt(row.cache_write_tokens),
      totalTokens: coerceInt(row.total_tokens),
      totalCost,
      dominantModel,
    };
  });
};

const getSessionDetail = ({ sessionId }) => {
  const safeSessionRef = String(sessionId || "").trim();
  if (!safeSessionRef) return null;
  const database = ensureDb();
  const summaryRow = database
    .prepare(`
      SELECT
        MAX(session_key) AS session_key,
        MAX(session_id) AS session_id,
        MIN(timestamp) AS first_activity_ms,
        MAX(timestamp) AS last_activity_ms,
        COUNT(*) AS turn_count,
        SUM(input_tokens) AS input_tokens,
        SUM(output_tokens) AS output_tokens,
        SUM(cache_read_tokens) AS cache_read_tokens,
        SUM(cache_write_tokens) AS cache_write_tokens,
        SUM(total_tokens) AS total_tokens
      FROM usage_events
      WHERE COALESCE(NULLIF(session_key, ''), NULLIF(session_id, '')) = $sessionRef
    `)
    .get({ $sessionRef: safeSessionRef });
  if (!summaryRow || !coerceInt(summaryRow.turn_count)) return null;

  const modelRows = appendCostToRows(
    database
      .prepare(`
        SELECT
          provider,
          model,
          COUNT(*) AS turn_count,
          SUM(input_tokens) AS input_tokens,
          SUM(output_tokens) AS output_tokens,
          SUM(cache_read_tokens) AS cache_read_tokens,
          SUM(cache_write_tokens) AS cache_write_tokens,
          SUM(total_tokens) AS total_tokens
        FROM usage_events
        WHERE COALESCE(NULLIF(session_key, ''), NULLIF(session_id, '')) = $sessionRef
        GROUP BY provider, model
        ORDER BY total_tokens DESC
      `)
      .all({ $sessionRef: safeSessionRef }),
  ).map((row) => ({
    provider: row.provider,
    model: row.model,
    turnCount: coerceInt(row.turn_count),
    inputTokens: row.inputTokens,
    outputTokens: row.outputTokens,
    cacheReadTokens: row.cacheReadTokens,
    cacheWriteTokens: row.cacheWriteTokens,
    totalTokens: row.totalTokens,
    totalCost: row.totalCost,
    inputCost: row.inputCost,
    outputCost: row.outputCost,
    cacheReadCost: row.cacheReadCost,
    cacheWriteCost: row.cacheWriteCost,
    pricingFound: row.pricingFound,
  }));

  const toolRows = database
    .prepare(`
      SELECT
        tool_name,
        COUNT(*) AS call_count,
        SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) AS success_count,
        SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) AS error_count,
        AVG(duration_ms) AS avg_duration_ms,
        MIN(duration_ms) AS min_duration_ms,
        MAX(duration_ms) AS max_duration_ms
      FROM tool_events
      WHERE COALESCE(NULLIF(session_key, ''), NULLIF(session_id, '')) = $sessionRef
      GROUP BY tool_name
      ORDER BY call_count DESC
    `)
    .all({ $sessionRef: safeSessionRef })
    .map((row) => {
      const callCount = coerceInt(row.call_count);
      const successCount = coerceInt(row.success_count);
      const errorCount = coerceInt(row.error_count);
      return {
        toolName: row.tool_name,
        callCount,
        successCount,
        errorCount,
        errorRate: callCount > 0 ? errorCount / callCount : 0,
        avgDurationMs: Number(row.avg_duration_ms || 0),
        minDurationMs: coerceInt(row.min_duration_ms),
        maxDurationMs: coerceInt(row.max_duration_ms),
      };
    });

  const firstActivityMs = coerceInt(summaryRow.first_activity_ms);
  const lastActivityMs = coerceInt(summaryRow.last_activity_ms);
  const summaryCost = appendCostToRows([
    {
      model: modelRows[0]?.model || "",
      input_tokens: summaryRow.input_tokens,
      output_tokens: summaryRow.output_tokens,
      cache_read_tokens: summaryRow.cache_read_tokens,
      cache_write_tokens: summaryRow.cache_write_tokens,
      total_tokens: summaryRow.total_tokens,
    },
  ])[0];

  return {
    sessionId: safeSessionRef,
    sessionKey: String(summaryRow.session_key || ""),
    rawSessionId: String(summaryRow.session_id || ""),
    firstActivityMs,
    lastActivityMs,
    durationMs: Math.max(0, lastActivityMs - firstActivityMs),
    turnCount: coerceInt(summaryRow.turn_count),
    inputTokens: coerceInt(summaryRow.input_tokens),
    outputTokens: coerceInt(summaryRow.output_tokens),
    cacheReadTokens: coerceInt(summaryRow.cache_read_tokens),
    cacheWriteTokens: coerceInt(summaryRow.cache_write_tokens),
    totalTokens: coerceInt(summaryRow.total_tokens),
    totalCost: summaryCost.totalCost,
    modelBreakdown: modelRows,
    toolUsage: toolRows,
  };
};

const downsamplePoints = (points, maxPoints) => {
  if (points.length <= maxPoints) return points;
  const stride = Math.ceil(points.length / maxPoints);
  const sampled = [];
  for (let index = 0; index < points.length; index += stride) {
    sampled.push(points[index]);
  }
  const lastPoint = points[points.length - 1];
  if (sampled[sampled.length - 1]?.timestamp !== lastPoint.timestamp) {
    sampled.push(lastPoint);
  }
  return sampled;
};

const getSessionTimeSeries = ({ sessionId, maxPoints = kDefaultMaxPoints }) => {
  const safeSessionRef = String(sessionId || "").trim();
  if (!safeSessionRef) return { sessionId: safeSessionRef, points: [] };
  const database = ensureDb();
  const rows = database
    .prepare(`
      SELECT
        timestamp,
        session_key,
        session_id,
        model,
        input_tokens,
        output_tokens,
        cache_read_tokens,
        cache_write_tokens,
        total_tokens
      FROM usage_events
      WHERE COALESCE(NULLIF(session_key, ''), NULLIF(session_id, '')) = $sessionRef
      ORDER BY timestamp ASC
    `)
    .all({ $sessionRef: safeSessionRef });
  let cumulativeTokens = 0;
  let cumulativeCost = 0;
  const points = rows.map((row) => {
    const inputTokens = coerceInt(row.input_tokens);
    const outputTokens = coerceInt(row.output_tokens);
    const cacheReadTokens = coerceInt(row.cache_read_tokens);
    const cacheWriteTokens = coerceInt(row.cache_write_tokens);
    const totalTokens =
      coerceInt(row.total_tokens) ||
      inputTokens + outputTokens + cacheReadTokens + cacheWriteTokens;
    const cost = deriveCostBreakdown({
      inputTokens,
      outputTokens,
      cacheReadTokens,
      cacheWriteTokens,
      model: row.model,
    });
    cumulativeTokens += totalTokens;
    cumulativeCost += cost.totalCost;
    return {
      timestamp: coerceInt(row.timestamp),
      sessionKey: String(row.session_key || ""),
      rawSessionId: String(row.session_id || ""),
      model: String(row.model || ""),
      inputTokens,
      outputTokens,
      cacheReadTokens,
      cacheWriteTokens,
      totalTokens,
      cost: cost.totalCost,
      cumulativeTokens,
      cumulativeCost,
    };
  });
  const safeMaxPoints = clampInt(maxPoints, 10, kMaxMaxPoints, kDefaultMaxPoints);
  return {
    sessionId: safeSessionRef,
    points: downsamplePoints(points, safeMaxPoints),
  };
};

module.exports = {
  initUsageDb,
  getDailySummary,
  getSessionsList,
  getSessionDetail,
  getSessionTimeSeries,
  kGlobalModelPricing,
};
