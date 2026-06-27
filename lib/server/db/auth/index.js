const fs = require("fs");
const path = require("path");
const { DatabaseSync } = require("node:sqlite");
const { createSchema } = require("./schema");

let db = null;

const ensureDb = () => {
  if (!db) throw new Error("Auth DB not initialized");
  return db;
};

const closeAuthDb = () => {
  if (!db) return;
  const database = db;
  db = null;
  database.close();
};

const initAuthDb = ({ rootDir }) => {
  closeAuthDb();
  const dbDir = path.join(rootDir, "db");
  fs.mkdirSync(dbDir, { recursive: true });
  const dbPath = path.join(dbDir, "auth.db");
  db = new DatabaseSync(dbPath);
  db.exec("PRAGMA busy_timeout = 5000");
  createSchema(db);
  return { path: dbPath };
};

const toStateModel = (row) => {
  if (!row) return null;
  return {
    attempts: Number(row.attempts || 0),
    windowStart: Number(row.window_start || 0),
    lockUntil: Number(row.lock_until || 0),
    failStreak: Number(row.fail_streak || 0),
    lastSeenAt: Number(row.last_seen_at || 0),
  };
};

const createLoginThrottleStore = () => ({
  get: (stateKey) => {
    const row = ensureDb()
      .prepare(
        `
          SELECT
            attempts,
            window_start,
            lock_until,
            fail_streak,
            last_seen_at
          FROM login_throttle_states
          WHERE state_key = $state_key
          LIMIT 1
        `,
      )
      .get({ $state_key: String(stateKey || "") });
    return toStateModel(row);
  },

  set: (stateKey, state) => {
    ensureDb()
      .prepare(
        `
          INSERT INTO login_throttle_states (
            state_key,
            attempts,
            window_start,
            lock_until,
            fail_streak,
            last_seen_at
          ) VALUES (
            $state_key,
            $attempts,
            $window_start,
            $lock_until,
            $fail_streak,
            $last_seen_at
          )
          ON CONFLICT(state_key) DO UPDATE SET
            attempts = excluded.attempts,
            window_start = excluded.window_start,
            lock_until = excluded.lock_until,
            fail_streak = excluded.fail_streak,
            last_seen_at = excluded.last_seen_at
        `,
      )
      .run({
        $state_key: String(stateKey || ""),
        $attempts: Number(state?.attempts || 0),
        $window_start: Number(state?.windowStart || 0),
        $lock_until: Number(state?.lockUntil || 0),
        $fail_streak: Number(state?.failStreak || 0),
        $last_seen_at: Number(state?.lastSeenAt || 0),
      });
  },

  delete: (stateKey) => {
    ensureDb()
      .prepare(
        `
          DELETE FROM login_throttle_states
          WHERE state_key = $state_key
        `,
      )
      .run({ $state_key: String(stateKey || "") });
  },

  entries: () =>
    ensureDb()
      .prepare(
        `
          SELECT
            state_key,
            attempts,
            window_start,
            lock_until,
            fail_streak,
            last_seen_at
          FROM login_throttle_states
        `,
      )
      .all()
      .map((row) => [String(row.state_key || ""), toStateModel(row)]),

  runExclusive: (callback) => {
    const database = ensureDb();
    database.exec("BEGIN IMMEDIATE");
    try {
      const result = callback();
      database.exec("COMMIT");
      return result;
    } catch (err) {
      try {
        database.exec("ROLLBACK");
      } catch {}
      throw err;
    }
  },
});

module.exports = {
  initAuthDb,
  closeAuthDb,
  createLoginThrottleStore,
};
