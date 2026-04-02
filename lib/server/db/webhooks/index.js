const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { DatabaseSync } = require("node:sqlite");
const { createSchema } = require("./schema");

let db = null;
let pruneTimer = null;

const kDefaultRequestLimit = 50;
const kMaxRequestLimit = 200;
const kPruneIntervalMs = 12 * 60 * 60 * 1000;
const kHealthSummaryWindow = 25;

const ensureDb = () => {
  if (!db) throw new Error("Webhooks DB not initialized");
  return db;
};

const initWebhooksDb = ({ rootDir, pruneDays = 30 }) => {
  const dbDir = path.join(rootDir, "db");
  fs.mkdirSync(dbDir, { recursive: true });
  const dbPath = path.join(dbDir, "webhooks.db");
  db = new DatabaseSync(dbPath);
  createSchema(db);
  pruneOldEntries(pruneDays);
  if (pruneTimer) clearInterval(pruneTimer);
  pruneTimer = setInterval(() => {
    try {
      pruneOldEntries(pruneDays);
    } catch (err) {
      console.error("[webhooks-db] prune error:", err.message);
    }
  }, kPruneIntervalMs);
  if (typeof pruneTimer.unref === "function") pruneTimer.unref();
  return { path: dbPath };
};

const parseJsonText = (value) => {
  if (typeof value !== "string" || !value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const generateOauthCallbackId = () => crypto.randomBytes(16).toString("hex");

const toOauthCallbackModel = (row) => {
  if (!row) return null;
  return {
    callbackId: String(row.callback_id || ""),
    hookName: String(row.hook_name || ""),
    createdAt: row.created_at || null,
    rotatedAt: row.rotated_at || null,
    lastUsedAt: row.last_used_at || null,
  };
};

const toRequestModel = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    hookName: row.hook_name,
    method: row.method || "",
    headers: parseJsonText(row.headers) || {},
    payload: row.payload || "",
    payloadTruncated: !!row.payload_truncated,
    payloadSize: Number(row.payload_size || 0),
    sourceIp: row.source_ip || "",
    gatewayStatus: row.gateway_status == null ? null : Number(row.gateway_status),
    gatewayBody: row.gateway_body || "",
    createdAt: row.created_at,
    status:
      row.gateway_status >= 200 && row.gateway_status < 300 ? "success" : "error",
  };
};

const insertRequest = ({
  hookName,
  method,
  headers,
  payload,
  payloadTruncated,
  payloadSize,
  sourceIp,
  gatewayStatus,
  gatewayBody,
}) => {
  const database = ensureDb();
  const stmt = database.prepare(`
    INSERT INTO webhook_requests (
      hook_name,
      method,
      headers,
      payload,
      payload_truncated,
      payload_size,
      source_ip,
      gateway_status,
      gateway_body
    ) VALUES (
      $hook_name,
      $method,
      $headers,
      $payload,
      $payload_truncated,
      $payload_size,
      $source_ip,
      $gateway_status,
      $gateway_body
    )
  `);
  const info = stmt.run({
    $hook_name: hookName,
    $method: method || "",
    $headers: JSON.stringify(headers || {}),
    $payload: payload || "",
    $payload_truncated: payloadTruncated ? 1 : 0,
    $payload_size: Number(payloadSize || 0),
    $source_ip: sourceIp || "",
    $gateway_status:
      Number.isFinite(Number(gatewayStatus)) ? Number(gatewayStatus) : null,
    $gateway_body: gatewayBody || "",
  });
  return Number(info.lastInsertRowid || 0);
};

const resolveStatusWhereClause = (status) => {
  if (status === "success") return "AND gateway_status >= 200 AND gateway_status < 300";
  if (status === "error")
    return "AND (gateway_status IS NULL OR gateway_status < 200 OR gateway_status >= 300)";
  return "";
};

const getRequests = (hookName, { limit, offset, status = "all" } = {}) => {
  const database = ensureDb();
  const safeLimit = Math.max(
    1,
    Math.min(Number.parseInt(String(limit || kDefaultRequestLimit), 10) || kDefaultRequestLimit, kMaxRequestLimit),
  );
  const safeOffset = Math.max(0, Number.parseInt(String(offset || 0), 10) || 0);
  const statusClause = resolveStatusWhereClause(status);
  const rows = database
    .prepare(`
      SELECT
        id,
        hook_name,
        method,
        headers,
        payload,
        payload_truncated,
        payload_size,
        source_ip,
        gateway_status,
        gateway_body,
        created_at
      FROM webhook_requests
      WHERE hook_name = $hook_name
      ${statusClause}
      ORDER BY created_at DESC
      LIMIT $limit
      OFFSET $offset
    `)
    .all({
      $hook_name: hookName,
      $limit: safeLimit,
      $offset: safeOffset,
    });
  return rows.map(toRequestModel);
};

const getRequestById = (hookName, id) => {
  const database = ensureDb();
  const row = database
    .prepare(`
      SELECT
        id,
        hook_name,
        method,
        headers,
        payload,
        payload_truncated,
        payload_size,
        source_ip,
        gateway_status,
        gateway_body,
        created_at
      FROM webhook_requests
      WHERE hook_name = $hook_name
        AND id = $id
      LIMIT 1
    `)
    .get({
      $hook_name: hookName,
      $id: Number.parseInt(String(id || 0), 10) || 0,
    });
  return toRequestModel(row);
};

const getHookSummaries = () => {
  const database = ensureDb();
  const rows = database
    .prepare(`
      WITH ranked_requests AS (
        SELECT
          hook_name,
          created_at,
          gateway_status,
          ROW_NUMBER() OVER (
            PARTITION BY hook_name
            ORDER BY created_at DESC, id DESC
          ) AS row_num
        FROM webhook_requests
      ),
      overall_counts AS (
        SELECT
          hook_name,
          MAX(created_at) AS last_received,
          COUNT(*) AS total_count,
          SUM(CASE WHEN gateway_status >= 200 AND gateway_status < 300 THEN 1 ELSE 0 END) AS success_count,
          SUM(CASE WHEN gateway_status IS NULL OR gateway_status < 200 OR gateway_status >= 300 THEN 1 ELSE 0 END) AS error_count
        FROM webhook_requests
        GROUP BY hook_name
      ),
      recent_counts AS (
        SELECT
          hook_name,
          COUNT(*) AS recent_total_count,
          SUM(CASE WHEN gateway_status >= 200 AND gateway_status < 300 THEN 1 ELSE 0 END) AS recent_success_count,
          SUM(CASE WHEN gateway_status IS NULL OR gateway_status < 200 OR gateway_status >= 300 THEN 1 ELSE 0 END) AS recent_error_count
        FROM ranked_requests
        WHERE row_num <= $health_window
        GROUP BY hook_name
      )
      SELECT
        overall_counts.hook_name,
        overall_counts.last_received,
        overall_counts.total_count,
        overall_counts.success_count,
        overall_counts.error_count,
        COALESCE(recent_counts.recent_total_count, 0) AS recent_total_count,
        COALESCE(recent_counts.recent_success_count, 0) AS recent_success_count,
        COALESCE(recent_counts.recent_error_count, 0) AS recent_error_count
      FROM overall_counts
      LEFT JOIN recent_counts
        ON recent_counts.hook_name = overall_counts.hook_name
    `)
    .all({ $health_window: kHealthSummaryWindow });
  return rows.map((row) => ({
    hookName: row.hook_name,
    lastReceived: row.last_received || null,
    totalCount: Number(row.total_count || 0),
    successCount: Number(row.success_count || 0),
    errorCount: Number(row.error_count || 0),
    recentTotalCount: Number(row.recent_total_count || 0),
    recentSuccessCount: Number(row.recent_success_count || 0),
    recentErrorCount: Number(row.recent_error_count || 0),
    healthWindowSize: kHealthSummaryWindow,
  }));
};

const deleteRequestsByHook = (hookName) => {
  const database = ensureDb();
  const result = database
    .prepare(`
      DELETE FROM webhook_requests
      WHERE hook_name = $hook_name
    `)
    .run({
      $hook_name: String(hookName || ""),
    });
  return Number(result.changes || 0);
};

const createOauthCallback = ({ hookName }) => {
  const database = ensureDb();
  const normalizedHookName = String(hookName || "").trim();
  if (!normalizedHookName) throw new Error("hookName is required");
  const callbackId = generateOauthCallbackId();
  database
    .prepare(`
      INSERT INTO oauth_callbacks (
        callback_id,
        hook_name
      ) VALUES (
        $callback_id,
        $hook_name
      )
    `)
    .run({
      $callback_id: callbackId,
      $hook_name: normalizedHookName,
    });
  const inserted = database
    .prepare(`
      SELECT
        callback_id,
        hook_name,
        created_at,
        rotated_at,
        last_used_at
      FROM oauth_callbacks
      WHERE callback_id = $callback_id
      LIMIT 1
    `)
    .get({ $callback_id: callbackId });
  return toOauthCallbackModel(inserted);
};

const getOauthCallbackByHook = (hookName) => {
  const database = ensureDb();
  const normalizedHookName = String(hookName || "").trim();
  if (!normalizedHookName) return null;
  const row = database
    .prepare(`
      SELECT
        callback_id,
        hook_name,
        created_at,
        rotated_at,
        last_used_at
      FROM oauth_callbacks
      WHERE hook_name = $hook_name
      LIMIT 1
    `)
    .get({ $hook_name: normalizedHookName });
  return toOauthCallbackModel(row);
};

const getOauthCallbackById = (callbackId) => {
  const database = ensureDb();
  const normalizedCallbackId = String(callbackId || "").trim();
  if (!normalizedCallbackId) return null;
  const row = database
    .prepare(`
      SELECT
        callback_id,
        hook_name,
        created_at,
        rotated_at,
        last_used_at
      FROM oauth_callbacks
      WHERE callback_id = $callback_id
      LIMIT 1
    `)
    .get({ $callback_id: normalizedCallbackId });
  return toOauthCallbackModel(row);
};

const rotateOauthCallback = (hookName) => {
  const database = ensureDb();
  const normalizedHookName = String(hookName || "").trim();
  if (!normalizedHookName) throw new Error("hookName is required");
  const existing = getOauthCallbackByHook(normalizedHookName);
  if (!existing) throw new Error("OAuth callback not found");
  const nextCallbackId = generateOauthCallbackId();
  database
    .prepare(`
      UPDATE oauth_callbacks
      SET
        callback_id = $callback_id,
        rotated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
      WHERE hook_name = $hook_name
    `)
    .run({
      $callback_id: nextCallbackId,
      $hook_name: normalizedHookName,
    });
  return getOauthCallbackById(nextCallbackId);
};

const deleteOauthCallback = (hookName) => {
  const database = ensureDb();
  const normalizedHookName = String(hookName || "").trim();
  if (!normalizedHookName) return 0;
  const result = database
    .prepare(`
      DELETE FROM oauth_callbacks
      WHERE hook_name = $hook_name
    `)
    .run({ $hook_name: normalizedHookName });
  return Number(result.changes || 0);
};

const markOauthCallbackUsed = (callbackId) => {
  const database = ensureDb();
  const normalizedCallbackId = String(callbackId || "").trim();
  if (!normalizedCallbackId) return 0;
  const result = database
    .prepare(`
      UPDATE oauth_callbacks
      SET last_used_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
      WHERE callback_id = $callback_id
    `)
    .run({ $callback_id: normalizedCallbackId });
  return Number(result.changes || 0);
};

const pruneOldEntries = (days = 30) => {
  const database = ensureDb();
  const safeDays = Math.max(1, Number.parseInt(String(days || 30), 10) || 30);
  const modifier = `-${safeDays} days`;
  const result = database
    .prepare(`
      DELETE FROM webhook_requests
      WHERE created_at < strftime('%Y-%m-%dT%H:%M:%fZ', 'now', $modifier)
    `)
    .run({ $modifier: modifier });
  return Number(result.changes || 0);
};

module.exports = {
  initWebhooksDb,
  insertRequest,
  getRequests,
  getRequestById,
  getHookSummaries,
  deleteRequestsByHook,
  createOauthCallback,
  getOauthCallbackByHook,
  getOauthCallbackById,
  rotateOauthCallback,
  deleteOauthCallback,
  markOauthCallbackUsed,
  pruneOldEntries,
};
