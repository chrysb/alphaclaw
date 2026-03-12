const {
  kDefaultSessionLimit,
  kMaxSessionLimit,
  coerceInt,
  clampInt,
  getUsageMetricsFromEventRow,
} = require("./shared");

const getSessionsList = ({
  database,
  limit = kDefaultSessionLimit,
} = {}) => {
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
    const eventRows = database
      .prepare(`
        SELECT
          model,
          input_tokens,
          output_tokens,
          cache_read_tokens,
          cache_write_tokens,
          total_tokens
        FROM usage_events
        WHERE COALESCE(NULLIF(session_key, ''), NULLIF(session_id, '')) = $sessionRef
      `)
      .all({ $sessionRef: row.session_ref });
    let totalCost = 0;
    const modelTokenTotals = new Map();
    for (const eventRow of eventRows) {
      const metrics = getUsageMetricsFromEventRow(eventRow);
      totalCost += metrics.totalCost;
      const model = String(eventRow.model || "");
      modelTokenTotals.set(model, (modelTokenTotals.get(model) || 0) + metrics.totalTokens);
    }
    const dominantModel = Array.from(modelTokenTotals.entries())
      .sort((a, b) => b[1] - a[1])[0]?.[0] || "";
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

const getSessionDetail = ({ database, sessionId }) => {
  const safeSessionRef = String(sessionId || "").trim();
  if (!safeSessionRef) return null;
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

  const modelEvents = database
    .prepare(`
      SELECT
        provider,
        model,
        input_tokens,
        output_tokens,
        cache_read_tokens,
        cache_write_tokens,
        total_tokens
      FROM usage_events
      WHERE COALESCE(NULLIF(session_key, ''), NULLIF(session_id, '')) = $sessionRef
    `)
    .all({ $sessionRef: safeSessionRef });
  const byProviderModel = new Map();
  for (const eventRow of modelEvents) {
    const provider = String(eventRow.provider || "unknown");
    const model = String(eventRow.model || "unknown");
    const mapKey = `${provider}\u0000${model}`;
    if (!byProviderModel.has(mapKey)) {
      byProviderModel.set(mapKey, {
        provider,
        model,
        turnCount: 0,
        inputTokens: 0,
        outputTokens: 0,
        cacheReadTokens: 0,
        cacheWriteTokens: 0,
        totalTokens: 0,
        totalCost: 0,
        inputCost: 0,
        outputCost: 0,
        cacheReadCost: 0,
        cacheWriteCost: 0,
        pricingFound: false,
      });
    }
    const aggregate = byProviderModel.get(mapKey);
    const metrics = getUsageMetricsFromEventRow(eventRow);
    aggregate.turnCount += 1;
    aggregate.inputTokens += metrics.inputTokens;
    aggregate.outputTokens += metrics.outputTokens;
    aggregate.cacheReadTokens += metrics.cacheReadTokens;
    aggregate.cacheWriteTokens += metrics.cacheWriteTokens;
    aggregate.totalTokens += metrics.totalTokens;
    aggregate.totalCost += metrics.totalCost;
    aggregate.inputCost += metrics.inputCost;
    aggregate.outputCost += metrics.outputCost;
    aggregate.cacheReadCost += metrics.cacheReadCost;
    aggregate.cacheWriteCost += metrics.cacheWriteCost;
    aggregate.pricingFound = aggregate.pricingFound || metrics.pricingFound;
  }
  const modelRows = Array.from(byProviderModel.values()).sort(
    (a, b) => b.totalTokens - a.totalTokens,
  );

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
  const totalCost = modelRows.reduce(
    (sum, modelRow) => sum + Number(modelRow.totalCost || 0),
    0,
  );

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
    totalCost,
    modelBreakdown: modelRows,
    toolUsage: toolRows,
  };
};

module.exports = {
  getSessionsList,
  getSessionDetail,
};
