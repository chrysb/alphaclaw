const createSchema = (database) => {
  database.exec(`
    CREATE TABLE IF NOT EXISTS watchdog_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_type TEXT NOT NULL,
      source TEXT NOT NULL,
      status TEXT NOT NULL,
      details TEXT,
      correlation_id TEXT,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
    );
  `);
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_watchdog_events_ts
    ON watchdog_events(created_at DESC);
  `);
};

module.exports = {
  createSchema,
};
