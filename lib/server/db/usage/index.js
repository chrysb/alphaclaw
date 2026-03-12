const fs = require("fs");
const path = require("path");
const { DatabaseSync } = require("node:sqlite");
const { kGlobalModelPricing, deriveCostBreakdown } = require("../../cost-utils");
const { ensureSchema } = require("./schema");
const { getDailySummary } = require("./summary");
const { getSessionsList, getSessionDetail } = require("./sessions");
const { getSessionTimeSeries } = require("./timeseries");

let db = null;
let usageDbPath = "";

const ensureDb = () => {
  if (!db) throw new Error("Usage DB not initialized");
  return db;
};

const initUsageDb = ({ rootDir }) => {
  const dbDir = path.join(rootDir, "db");
  fs.mkdirSync(dbDir, { recursive: true });
  usageDbPath = path.join(dbDir, "usage.db");
  db = new DatabaseSync(usageDbPath);
  ensureSchema(db);
  return { path: usageDbPath };
};

const getSessionUsageByKeyPattern = ({ keyPattern = "", sinceMs = 0 } = {}) => {
  const database = ensureDb();
  const normalizedPattern = String(keyPattern || "").trim();
  if (!normalizedPattern) {
    return {
      totals: {
        inputTokens: 0,
        outputTokens: 0,
        cacheReadTokens: 0,
        cacheWriteTokens: 0,
        totalTokens: 0,
        totalCost: 0,
        eventCount: 0,
        runCount: 0,
      },
      modelBreakdown: [],
    };
  }

  const rows = database
    .prepare(
      `
        SELECT
          COALESCE(model, '') AS model,
          COALESCE(provider, '') AS provider,
          COUNT(*) AS event_count,
          COUNT(
            DISTINCT COALESCE(
              NULLIF(run_id, ''),
              NULLIF(session_key, ''),
              NULLIF(session_id, ''),
              printf('event:%d', id)
            )
          ) AS run_count,
          SUM(COALESCE(input_tokens, 0)) AS input_tokens,
          SUM(COALESCE(output_tokens, 0)) AS output_tokens,
          SUM(COALESCE(cache_read_tokens, 0)) AS cache_read_tokens,
          SUM(COALESCE(cache_write_tokens, 0)) AS cache_write_tokens,
          SUM(COALESCE(total_tokens, 0)) AS total_tokens
        FROM usage_events
        WHERE session_key LIKE $keyPattern
          AND ($sinceMs <= 0 OR timestamp >= $sinceMs)
        GROUP BY model, provider
        ORDER BY total_tokens DESC
      `,
    )
    .all({
      $keyPattern: normalizedPattern,
      $sinceMs: Number.isFinite(Number(sinceMs)) ? Number(sinceMs) : 0,
    });
  const totalsRow = database
    .prepare(
      `
        SELECT
          COUNT(*) AS event_count,
          COUNT(
            DISTINCT COALESCE(
              NULLIF(run_id, ''),
              NULLIF(session_key, ''),
              NULLIF(session_id, ''),
              printf('event:%d', id)
            )
          ) AS run_count
        FROM usage_events
        WHERE session_key LIKE $keyPattern
          AND ($sinceMs <= 0 OR timestamp >= $sinceMs)
      `,
    )
    .get({
      $keyPattern: normalizedPattern,
      $sinceMs: Number.isFinite(Number(sinceMs)) ? Number(sinceMs) : 0,
    }) || {};
  const modelBreakdown = rows.map((row) => {
    const inputTokens = Number(row.input_tokens || 0);
    const outputTokens = Number(row.output_tokens || 0);
    const cacheReadTokens = Number(row.cache_read_tokens || 0);
    const cacheWriteTokens = Number(row.cache_write_tokens || 0);
    const totalTokens = Number(row.total_tokens || 0);
    const costBreakdown = deriveCostBreakdown({
      inputTokens,
      outputTokens,
      cacheReadTokens,
      cacheWriteTokens,
      provider: String(row.provider || ""),
      model: String(row.model || ""),
    });
    return {
      model: String(row.model || ""),
      provider: String(row.provider || ""),
      eventCount: Number(row.event_count || 0),
      runCount: Number(row.run_count || 0),
      inputTokens,
      outputTokens,
      cacheReadTokens,
      cacheWriteTokens,
      totalTokens,
      totalCost: costBreakdown.totalCost,
      pricingFound: costBreakdown.pricingFound,
    };
  });

  const totals = modelBreakdown.reduce(
    (accumulator, row) => ({
      inputTokens: accumulator.inputTokens + row.inputTokens,
      outputTokens: accumulator.outputTokens + row.outputTokens,
      cacheReadTokens: accumulator.cacheReadTokens + row.cacheReadTokens,
      cacheWriteTokens: accumulator.cacheWriteTokens + row.cacheWriteTokens,
      totalTokens: accumulator.totalTokens + row.totalTokens,
      totalCost: accumulator.totalCost + row.totalCost,
      eventCount: accumulator.eventCount + row.eventCount,
      runCount: accumulator.runCount + row.runCount,
    }),
    {
      inputTokens: 0,
      outputTokens: 0,
      cacheReadTokens: 0,
      cacheWriteTokens: 0,
      totalTokens: 0,
      totalCost: 0,
      eventCount: 0,
      runCount: 0,
    },
  );
  totals.eventCount = Number(totalsRow.event_count || totals.eventCount || 0);
  totals.runCount = Number(totalsRow.run_count || 0);

  return { totals, modelBreakdown };
};

module.exports = {
  initUsageDb,
  getDailySummary: (options = {}) => getDailySummary({ database: ensureDb(), ...options }),
  getSessionsList: (options = {}) => getSessionsList({ database: ensureDb(), ...options }),
  getSessionDetail: (options = {}) => getSessionDetail({ database: ensureDb(), ...options }),
  getSessionTimeSeries: (options = {}) =>
    getSessionTimeSeries({ database: ensureDb(), ...options }),
  getSessionUsageByKeyPattern,
  kGlobalModelPricing,
};
