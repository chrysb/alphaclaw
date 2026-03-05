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

module.exports = {
  ensureSchema,
};
