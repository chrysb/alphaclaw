const createSchema = (database) => {
  database.exec(`
    CREATE TABLE IF NOT EXISTS webhook_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hook_name TEXT NOT NULL,
      method TEXT,
      headers TEXT,
      payload TEXT,
      payload_truncated INTEGER DEFAULT 0,
      payload_size INTEGER,
      source_ip TEXT,
      gateway_status INTEGER,
      gateway_body TEXT,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
    );
  `);
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_webhook_requests_hook_ts
    ON webhook_requests(hook_name, created_at DESC);
  `);
};

module.exports = {
  createSchema,
};
