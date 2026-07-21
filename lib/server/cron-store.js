const fs = require("fs");
const path = require("path");
const { DatabaseSync } = require("node:sqlite");

const kCronStoreFile = "jobs.json";
const kOpenclawStateDbPath = path.join("state", "openclaw.sqlite");

const readJsonFile = (filePath) => {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
};

const parseJsonObject = (value, fallback = {}) => {
  try {
    const parsed = JSON.parse(String(value || ""));
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed
      : fallback;
  } catch {
    return fallback;
  }
};

const normalizeJobs = (storeValue) => {
  if (!storeValue || typeof storeValue !== "object") return [];
  if (!Array.isArray(storeValue.jobs)) return [];
  return storeValue.jobs
    .filter((job) => job && typeof job === "object")
    .map((job) => ({
      ...job,
      id: String(job.id || "").trim(),
      name: String(job.name || "").trim(),
      enabled: job.enabled !== false,
      state: job.state && typeof job.state === "object" ? job.state : {},
      payload: job.payload && typeof job.payload === "object" ? job.payload : {},
      delivery: job.delivery && typeof job.delivery === "object" ? job.delivery : {},
      schedule: job.schedule && typeof job.schedule === "object" ? job.schedule : {},
    }))
    .filter((job) => job.id);
};

const applyProjectedStateValue = ({ state, row, column, property, transform }) => {
  if (row[column] == null) return;
  state[property] = transform ? transform(row[column]) : Number(row[column]);
};

const readStateFromSqliteRow = (row) => {
  const state = parseJsonObject(row.state_json, {});
  const numericColumns = [
    ["next_run_at_ms", "nextRunAtMs"],
    ["running_at_ms", "runningAtMs"],
    ["last_run_at_ms", "lastRunAtMs"],
    ["last_duration_ms", "lastDurationMs"],
    ["consecutive_errors", "consecutiveErrors"],
    ["consecutive_skipped", "consecutiveSkipped"],
    ["schedule_error_count", "scheduleErrorCount"],
    ["last_failure_alert_at_ms", "lastFailureAlertAtMs"],
  ];
  numericColumns.forEach(([column, property]) => {
    applyProjectedStateValue({ state, row, column, property });
  });

  const stringColumns = [
    ["last_run_status", "lastRunStatus"],
    ["last_error", "lastError"],
    ["last_delivery_status", "lastDeliveryStatus"],
    ["last_delivery_error", "lastDeliveryError"],
  ];
  stringColumns.forEach(([column, property]) => {
    applyProjectedStateValue({
      state,
      row,
      column,
      property,
      transform: (value) => String(value),
    });
  });
  applyProjectedStateValue({
    state,
    row,
    column: "last_delivered",
    property: "lastDelivered",
    transform: (value) => Number(value) !== 0,
  });
  return state;
};

const readJobFromSqliteRow = (row) => {
  const job = parseJsonObject(row.job_json, null);
  if (!job) return null;
  const updatedAtMs = Number(row.runtime_updated_at_ms ?? row.updated_at);
  return {
    ...job,
    ...(Number.isFinite(updatedAtMs) ? { updatedAtMs } : {}),
    state: readStateFromSqliteRow(row),
  };
};

const readSqliteCronStore = ({ openclawDir, legacyStorePath }) => {
  const databasePath = path.join(openclawDir, kOpenclawStateDbPath);
  if (!fs.existsSync(databasePath)) return null;

  const db = new DatabaseSync(databasePath, { readOnly: true });
  try {
    const table = db
      .prepare("SELECT 1 AS present FROM sqlite_master WHERE type = 'table' AND name = ?")
      .get("cron_jobs");
    if (!table) return null;

    const rows = db
      .prepare(
        "SELECT * FROM cron_jobs WHERE store_key = ? " +
          "ORDER BY sort_order ASC, updated_at ASC, job_id ASC",
      )
      .all(path.resolve(legacyStorePath));
    const jobs = rows.map(readJobFromSqliteRow).filter(Boolean);
    return {
      storePath: databasePath,
      version: 1,
      jobs: normalizeJobs({ jobs }),
    };
  } finally {
    db.close();
  }
};

const readCronStore = ({ openclawDir }) => {
  const cronDir = path.join(openclawDir, "cron");
  const legacyStorePath = path.join(cronDir, kCronStoreFile);
  const sqliteStore = readSqliteCronStore({ openclawDir, legacyStorePath });
  if (sqliteStore) return sqliteStore;

  return {
    storePath: legacyStorePath,
    version: 1,
    jobs: normalizeJobs(readJsonFile(legacyStorePath)),
  };
};

module.exports = {
  readCronStore,
};
