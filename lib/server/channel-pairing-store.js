const fs = require("fs");
const path = require("path");
const { DatabaseSync } = require("node:sqlite");

const kStateDatabasePath = path.join("state", "openclaw.sqlite");
const kAllowTable = "channel_pairing_allow_entries";
const kRequestTable = "channel_pairing_requests";

const normalizeChannel = (value) => String(value || "").trim().toLowerCase();
const normalizeAccountId = (value) =>
  String(value || "").trim().toLowerCase() || "default";

const tableExists = (db, tableName) =>
  !!db
    .prepare(
      "SELECT 1 AS present FROM sqlite_master WHERE type = 'table' AND name = ?",
    )
    .get(tableName);

const openPairingDatabase = ({
  fsImpl = fs,
  openclawDir,
  readOnly = true,
  DatabaseSyncImpl = DatabaseSync,
}) => {
  const databasePath = path.join(openclawDir, kStateDatabasePath);
  if (!fsImpl.existsSync(databasePath)) return null;
  try {
    const db = new DatabaseSyncImpl(databasePath, { readOnly });
    db.exec("PRAGMA busy_timeout = 5000");
    if (!tableExists(db, kAllowTable) || !tableExists(db, kRequestTable)) {
      db.close();
      return null;
    }
    return db;
  } catch {
    return null;
  }
};

const readChannelAllowFromByAccount = ({
  fsImpl = fs,
  openclawDir,
  channel,
  DatabaseSyncImpl = DatabaseSync,
}) => {
  const safeChannel = normalizeChannel(channel);
  if (!safeChannel) return null;
  const db = openPairingDatabase({
    fsImpl,
    openclawDir,
    readOnly: true,
    DatabaseSyncImpl,
  });
  if (!db) return null;
  try {
    const rows = db
      .prepare(
        `SELECT account_id, entry FROM ${kAllowTable} ` +
          "WHERE channel_key = ? ORDER BY account_id, sort_order, entry",
      )
      .all(safeChannel);
    const entriesByAccount = new Map();
    for (const row of rows) {
      const accountId = normalizeAccountId(row.account_id);
      const entries = entriesByAccount.get(accountId) || [];
      entries.push(String(row.entry));
      entriesByAccount.set(accountId, entries);
    }
    return entriesByAccount;
  } finally {
    db.close();
  }
};

const readPendingChannelPairings = ({
  fsImpl = fs,
  openclawDir,
  channel,
  DatabaseSyncImpl = DatabaseSync,
}) => {
  const safeChannel = normalizeChannel(channel);
  if (!safeChannel) return null;
  const db = openPairingDatabase({
    fsImpl,
    openclawDir,
    readOnly: true,
    DatabaseSyncImpl,
  });
  if (!db) return null;
  try {
    return db
      .prepare(
        `SELECT account_id, request_id, code, created_at, last_seen_at, meta_json ` +
          `FROM ${kRequestTable} WHERE channel_key = ? ` +
          "ORDER BY created_at, account_id, request_id",
      )
      .all(safeChannel)
      .map((row) => ({
        id: String(row.request_id || "").trim(),
        code: String(row.code || "").trim(),
        createdAt: String(row.created_at || "").trim(),
        lastSeenAt: String(row.last_seen_at || "").trim(),
        meta: {
          ...(() => {
            try {
              const parsed = JSON.parse(String(row.meta_json || "{}"));
              return parsed && typeof parsed === "object" ? parsed : {};
            } catch {
              return {};
            }
          })(),
          accountId: normalizeAccountId(row.account_id),
        },
      }));
  } finally {
    db.close();
  }
};

const removePendingChannelPairing = ({
  fsImpl = fs,
  openclawDir,
  channel,
  code,
  accountId,
  DatabaseSyncImpl = DatabaseSync,
}) => {
  const safeChannel = normalizeChannel(channel);
  const safeCode = String(code || "").trim().toUpperCase();
  if (!safeChannel || !safeCode) return false;
  const db = openPairingDatabase({
    fsImpl,
    openclawDir,
    readOnly: false,
    DatabaseSyncImpl,
  });
  if (!db) return null;
  try {
    const safeAccountId = String(accountId || "").trim().toLowerCase();
    const result = safeAccountId
      ? db
          .prepare(
            `DELETE FROM ${kRequestTable} ` +
              "WHERE channel_key = ? AND account_id = ? AND upper(code) = ?",
          )
          .run(safeChannel, normalizeAccountId(safeAccountId), safeCode)
      : db
          .prepare(
            `DELETE FROM ${kRequestTable} WHERE channel_key = ? AND upper(code) = ?`,
          )
          .run(safeChannel, safeCode);
    return Number(result.changes || 0) > 0;
  } finally {
    db.close();
  }
};

const removeChannelAccountPairingState = ({
  fsImpl = fs,
  openclawDir,
  channel,
  accountId,
  DatabaseSyncImpl = DatabaseSync,
}) => {
  const safeChannel = normalizeChannel(channel);
  if (!safeChannel) return false;
  const db = openPairingDatabase({
    fsImpl,
    openclawDir,
    readOnly: false,
    DatabaseSyncImpl,
  });
  if (!db) return null;
  const safeAccountId = normalizeAccountId(accountId);
  try {
    db.exec("BEGIN IMMEDIATE");
    const requestResult = db
      .prepare(
        `DELETE FROM ${kRequestTable} WHERE channel_key = ? AND account_id = ?`,
      )
      .run(safeChannel, safeAccountId);
    const allowResult = db
      .prepare(
        `DELETE FROM ${kAllowTable} WHERE channel_key = ? AND account_id = ?`,
      )
      .run(safeChannel, safeAccountId);
    db.exec("COMMIT");
    return Number(requestResult.changes || 0) + Number(allowResult.changes || 0) > 0;
  } catch (error) {
    try {
      db.exec("ROLLBACK");
    } catch {}
    throw error;
  } finally {
    db.close();
  }
};

const clearChannelPairingState = ({
  fsImpl = fs,
  openclawDir,
  DatabaseSyncImpl = DatabaseSync,
}) => {
  const db = openPairingDatabase({
    fsImpl,
    openclawDir,
    readOnly: false,
    DatabaseSyncImpl,
  });
  if (!db) return null;
  try {
    db.exec("BEGIN IMMEDIATE");
    const requestResult = db.prepare(`DELETE FROM ${kRequestTable}`).run();
    const allowResult = db.prepare(`DELETE FROM ${kAllowTable}`).run();
    db.exec("COMMIT");
    return Number(requestResult.changes || 0) + Number(allowResult.changes || 0);
  } catch (error) {
    try {
      db.exec("ROLLBACK");
    } catch {}
    throw error;
  } finally {
    db.close();
  }
};

module.exports = {
  kStateDatabasePath,
  readChannelAllowFromByAccount,
  readPendingChannelPairings,
  removePendingChannelPairing,
  removeChannelAccountPairingState,
  clearChannelPairingState,
};
