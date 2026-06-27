const createSchema = (db) => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS login_throttle_states (
      state_key TEXT PRIMARY KEY,
      attempts INTEGER NOT NULL DEFAULT 0,
      window_start INTEGER NOT NULL,
      lock_until INTEGER NOT NULL DEFAULT 0,
      fail_streak INTEGER NOT NULL DEFAULT 0,
      last_seen_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_login_throttle_states_last_seen
      ON login_throttle_states(last_seen_at);
  `);
};

module.exports = { createSchema };
