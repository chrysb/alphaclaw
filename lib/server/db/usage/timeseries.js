const {
  kDefaultMaxPoints,
  kMaxMaxPoints,
  coerceInt,
  clampInt,
  getUsageMetricsFromEventRow,
  downsamplePoints,
} = require("./shared");

const getSessionTimeSeries = ({
  database,
  sessionId,
  maxPoints = kDefaultMaxPoints,
}) => {
  const safeSessionRef = String(sessionId || "").trim();
  if (!safeSessionRef) return { sessionId: safeSessionRef, points: [] };
  const rows = database
    .prepare(`
      SELECT
        timestamp,
        session_key,
        session_id,
        model,
        input_tokens,
        output_tokens,
        cache_read_tokens,
        cache_write_tokens,
        total_tokens
      FROM usage_events
      WHERE COALESCE(NULLIF(session_key, ''), NULLIF(session_id, '')) = $sessionRef
      ORDER BY timestamp ASC
    `)
    .all({ $sessionRef: safeSessionRef });
  let cumulativeTokens = 0;
  let cumulativeCost = 0;
  const points = rows.map((row) => {
    const metrics = getUsageMetricsFromEventRow(row);
    cumulativeTokens += metrics.totalTokens;
    cumulativeCost += metrics.totalCost;
    return {
      timestamp: coerceInt(row.timestamp),
      sessionKey: String(row.session_key || ""),
      rawSessionId: String(row.session_id || ""),
      model: String(row.model || ""),
      inputTokens: metrics.inputTokens,
      outputTokens: metrics.outputTokens,
      cacheReadTokens: metrics.cacheReadTokens,
      cacheWriteTokens: metrics.cacheWriteTokens,
      totalTokens: metrics.totalTokens,
      cost: metrics.totalCost,
      cumulativeTokens,
      cumulativeCost,
    };
  });
  const safeMaxPoints = clampInt(maxPoints, 10, kMaxMaxPoints, kDefaultMaxPoints);
  return {
    sessionId: safeSessionRef,
    points: downsamplePoints(points, safeMaxPoints),
  };
};

module.exports = {
  getSessionTimeSeries,
};
