const {
  kDefaultDays,
  kDayMs,
  kUtcTimeZone,
  coerceInt,
  toDayKey,
  toTimeZoneDayKey,
  getPeriodRange,
  getUsageMetricsFromEventRow,
  parseAgentAndSourceFromSessionRef,
} = require("./shared");

const getAgentCostDistribution = ({
  eventsRows = [],
  startDay = "",
  timeZone = kUtcTimeZone,
}) => {
  const byAgent = new Map();
  const ensureAgentBucket = (agent) => {
    if (byAgent.has(agent)) return byAgent.get(agent);
    const bucket = {
      agent,
      inputTokens: 0,
      outputTokens: 0,
      cacheReadTokens: 0,
      cacheWriteTokens: 0,
      totalTokens: 0,
      totalCost: 0,
      turnCount: 0,
      sourceBreakdown: {
        chat: {
          source: "chat",
          inputTokens: 0,
          outputTokens: 0,
          cacheReadTokens: 0,
          cacheWriteTokens: 0,
          totalTokens: 0,
          totalCost: 0,
          turnCount: 0,
        },
        hooks: {
          source: "hooks",
          inputTokens: 0,
          outputTokens: 0,
          cacheReadTokens: 0,
          cacheWriteTokens: 0,
          totalTokens: 0,
          totalCost: 0,
          turnCount: 0,
        },
        cron: {
          source: "cron",
          inputTokens: 0,
          outputTokens: 0,
          cacheReadTokens: 0,
          cacheWriteTokens: 0,
          totalTokens: 0,
          totalCost: 0,
          turnCount: 0,
        },
      },
    };
    byAgent.set(agent, bucket);
    return bucket;
  };

  for (const eventRow of eventsRows) {
    const timestamp = coerceInt(eventRow.timestamp);
    const dayKey = timeZone === kUtcTimeZone
      ? toDayKey(timestamp)
      : toTimeZoneDayKey(timestamp, timeZone);
    if (dayKey < startDay) continue;

    const metrics = getUsageMetricsFromEventRow(eventRow);
    const sessionRef = String(eventRow.session_key || eventRow.session_id || "");
    const { agent, source } = parseAgentAndSourceFromSessionRef(sessionRef);
    const agentBucket = ensureAgentBucket(agent);
    const sourceBucket = agentBucket.sourceBreakdown[source];

    agentBucket.inputTokens += metrics.inputTokens;
    agentBucket.outputTokens += metrics.outputTokens;
    agentBucket.cacheReadTokens += metrics.cacheReadTokens;
    agentBucket.cacheWriteTokens += metrics.cacheWriteTokens;
    agentBucket.totalTokens += metrics.totalTokens;
    agentBucket.totalCost += metrics.totalCost;
    agentBucket.turnCount += 1;

    sourceBucket.inputTokens += metrics.inputTokens;
    sourceBucket.outputTokens += metrics.outputTokens;
    sourceBucket.cacheReadTokens += metrics.cacheReadTokens;
    sourceBucket.cacheWriteTokens += metrics.cacheWriteTokens;
    sourceBucket.totalTokens += metrics.totalTokens;
    sourceBucket.totalCost += metrics.totalCost;
    sourceBucket.turnCount += 1;
  }

  const agents = Array.from(byAgent.values())
    .map((bucket) => ({
      agent: bucket.agent,
      inputTokens: bucket.inputTokens,
      outputTokens: bucket.outputTokens,
      cacheReadTokens: bucket.cacheReadTokens,
      cacheWriteTokens: bucket.cacheWriteTokens,
      totalTokens: bucket.totalTokens,
      totalCost: bucket.totalCost,
      turnCount: bucket.turnCount,
      sourceBreakdown: ["chat", "hooks", "cron"].map(
        (source) => bucket.sourceBreakdown[source],
      ),
    }))
    .sort((a, b) => b.totalCost - a.totalCost);

  return {
    agents,
    totals: agents.reduce(
      (acc, agentBucket) => {
        acc.totalCost += Number(agentBucket.totalCost || 0);
        acc.totalTokens += Number(agentBucket.totalTokens || 0);
        acc.turnCount += Number(agentBucket.turnCount || 0);
        return acc;
      },
      { totalCost: 0, totalTokens: 0, turnCount: 0 },
    ),
  };
};

const getDailySummary = ({
  database,
  days = kDefaultDays,
  timeZone = kUtcTimeZone,
} = {}) => {
  const { now, safeDays, startDay, timeZone: normalizedTimeZone } = getPeriodRange(
    days,
    timeZone,
  );
  const lookbackMs = now - (safeDays + 2) * kDayMs;
  const eventsRows = database
    .prepare(`
      SELECT
        timestamp,
        session_id,
        session_key,
        provider,
        model,
        input_tokens,
        output_tokens,
        cache_read_tokens,
        cache_write_tokens,
        total_tokens
      FROM usage_events
      WHERE timestamp >= $lookbackMs
      ORDER BY timestamp ASC
    `)
    .all({ $lookbackMs: lookbackMs });
  const byDateModel = new Map();
  const byDateSource = new Map();
  const byDateAgent = new Map();
  for (const eventRow of eventsRows) {
    const timestamp = coerceInt(eventRow.timestamp);
    const dayKey = normalizedTimeZone === kUtcTimeZone
      ? toDayKey(timestamp)
      : toTimeZoneDayKey(timestamp, normalizedTimeZone);
    if (dayKey < startDay) continue;
    const sessionRef = String(eventRow.session_key || eventRow.session_id || "");
    const { agent, source } = parseAgentAndSourceFromSessionRef(sessionRef);
    const model = String(eventRow.model || "unknown");
    const mapKey = `${dayKey}\u0000${model}`;
    if (!byDateModel.has(mapKey)) {
      byDateModel.set(mapKey, {
        date: dayKey,
        model,
        provider: String(eventRow.provider || "unknown"),
        inputTokens: 0,
        outputTokens: 0,
        cacheReadTokens: 0,
        cacheWriteTokens: 0,
        totalTokens: 0,
        turnCount: 0,
        totalCost: 0,
        inputCost: 0,
        outputCost: 0,
        cacheReadCost: 0,
        cacheWriteCost: 0,
        pricingFound: false,
      });
    }
    const aggregate = byDateModel.get(mapKey);
    const metrics = getUsageMetricsFromEventRow(eventRow);
    aggregate.inputTokens += metrics.inputTokens;
    aggregate.outputTokens += metrics.outputTokens;
    aggregate.cacheReadTokens += metrics.cacheReadTokens;
    aggregate.cacheWriteTokens += metrics.cacheWriteTokens;
    aggregate.totalTokens += metrics.totalTokens;
    aggregate.turnCount += 1;
    aggregate.totalCost += metrics.totalCost;
    aggregate.inputCost += metrics.inputCost;
    aggregate.outputCost += metrics.outputCost;
    aggregate.cacheReadCost += metrics.cacheReadCost;
    aggregate.cacheWriteCost += metrics.cacheWriteCost;
    aggregate.pricingFound = aggregate.pricingFound || metrics.pricingFound;
    if (!aggregate.provider && eventRow.provider) {
      aggregate.provider = String(eventRow.provider || "unknown");
    }

    const sourceMapKey = `${dayKey}\u0000${source}`;
    if (!byDateSource.has(sourceMapKey)) {
      byDateSource.set(sourceMapKey, {
        source,
        date: dayKey,
        inputTokens: 0,
        outputTokens: 0,
        cacheReadTokens: 0,
        cacheWriteTokens: 0,
        totalTokens: 0,
        turnCount: 0,
        totalCost: 0,
      });
    }
    const sourceAggregate = byDateSource.get(sourceMapKey);
    sourceAggregate.inputTokens += metrics.inputTokens;
    sourceAggregate.outputTokens += metrics.outputTokens;
    sourceAggregate.cacheReadTokens += metrics.cacheReadTokens;
    sourceAggregate.cacheWriteTokens += metrics.cacheWriteTokens;
    sourceAggregate.totalTokens += metrics.totalTokens;
    sourceAggregate.turnCount += 1;
    sourceAggregate.totalCost += metrics.totalCost;

    const agentMapKey = `${dayKey}\u0000${agent}`;
    if (!byDateAgent.has(agentMapKey)) {
      byDateAgent.set(agentMapKey, {
        agent,
        date: dayKey,
        inputTokens: 0,
        outputTokens: 0,
        cacheReadTokens: 0,
        cacheWriteTokens: 0,
        totalTokens: 0,
        turnCount: 0,
        totalCost: 0,
      });
    }
    const agentAggregate = byDateAgent.get(agentMapKey);
    agentAggregate.inputTokens += metrics.inputTokens;
    agentAggregate.outputTokens += metrics.outputTokens;
    agentAggregate.cacheReadTokens += metrics.cacheReadTokens;
    agentAggregate.cacheWriteTokens += metrics.cacheWriteTokens;
    agentAggregate.totalTokens += metrics.totalTokens;
    agentAggregate.turnCount += 1;
    agentAggregate.totalCost += metrics.totalCost;
  }
  const enriched = Array.from(byDateModel.values()).sort((a, b) => {
    if (a.date === b.date) return b.totalTokens - a.totalTokens;
    return a.date.localeCompare(b.date);
  });
  const costByAgent = getAgentCostDistribution({
    eventsRows,
    startDay,
    timeZone: normalizedTimeZone,
  });
  const byDate = new Map();
  for (const row of enriched) {
    if (!byDate.has(row.date)) byDate.set(row.date, []);
    byDate.get(row.date).push({
      model: row.model,
      provider: row.provider,
      inputTokens: row.inputTokens,
      outputTokens: row.outputTokens,
      cacheReadTokens: row.cacheReadTokens,
      cacheWriteTokens: row.cacheWriteTokens,
      totalTokens: row.totalTokens,
      turnCount: row.turnCount,
      totalCost: row.totalCost,
      inputCost: row.inputCost,
      outputCost: row.outputCost,
      cacheReadCost: row.cacheReadCost,
      cacheWriteCost: row.cacheWriteCost,
      pricingFound: row.pricingFound,
    });
  }
  const byDateSourceRows = new Map();
  for (const row of byDateSource.values()) {
    if (!byDateSourceRows.has(row.date)) byDateSourceRows.set(row.date, []);
    byDateSourceRows.get(row.date).push({
      source: row.source,
      inputTokens: row.inputTokens,
      outputTokens: row.outputTokens,
      cacheReadTokens: row.cacheReadTokens,
      cacheWriteTokens: row.cacheWriteTokens,
      totalTokens: row.totalTokens,
      turnCount: row.turnCount,
      totalCost: row.totalCost,
    });
  }
  for (const rows of byDateSourceRows.values()) {
    rows.sort((left, right) => {
      if (right.totalTokens !== left.totalTokens) {
        return right.totalTokens - left.totalTokens;
      }
      return String(left.source || "").localeCompare(String(right.source || ""));
    });
  }
  const byDateAgentRows = new Map();
  for (const row of byDateAgent.values()) {
    if (!byDateAgentRows.has(row.date)) byDateAgentRows.set(row.date, []);
    byDateAgentRows.get(row.date).push({
      agent: row.agent,
      inputTokens: row.inputTokens,
      outputTokens: row.outputTokens,
      cacheReadTokens: row.cacheReadTokens,
      cacheWriteTokens: row.cacheWriteTokens,
      totalTokens: row.totalTokens,
      turnCount: row.turnCount,
      totalCost: row.totalCost,
    });
  }
  for (const rows of byDateAgentRows.values()) {
    rows.sort((left, right) => {
      if (right.totalTokens !== left.totalTokens) {
        return right.totalTokens - left.totalTokens;
      }
      return String(left.agent || "").localeCompare(String(right.agent || ""));
    });
  }
  const daily = [];
  const totals = {
    inputTokens: 0,
    outputTokens: 0,
    cacheReadTokens: 0,
    cacheWriteTokens: 0,
    totalTokens: 0,
    totalCost: 0,
    turnCount: 0,
    modelCount: 0,
  };
  for (const [date, modelRows] of byDate.entries()) {
    const aggregate = modelRows.reduce(
      (acc, row) => ({
        inputTokens: acc.inputTokens + row.inputTokens,
        outputTokens: acc.outputTokens + row.outputTokens,
        cacheReadTokens: acc.cacheReadTokens + row.cacheReadTokens,
        cacheWriteTokens: acc.cacheWriteTokens + row.cacheWriteTokens,
        totalTokens: acc.totalTokens + row.totalTokens,
        totalCost: acc.totalCost + row.totalCost,
        turnCount: acc.turnCount + row.turnCount,
      }),
      {
        inputTokens: 0,
        outputTokens: 0,
        cacheReadTokens: 0,
        cacheWriteTokens: 0,
        totalTokens: 0,
        totalCost: 0,
        turnCount: 0,
      },
    );
    daily.push({
      date,
      ...aggregate,
      models: modelRows,
      sources: byDateSourceRows.get(date) || [],
      agents: byDateAgentRows.get(date) || [],
    });
    totals.inputTokens += aggregate.inputTokens;
    totals.outputTokens += aggregate.outputTokens;
    totals.cacheReadTokens += aggregate.cacheReadTokens;
    totals.cacheWriteTokens += aggregate.cacheWriteTokens;
    totals.totalTokens += aggregate.totalTokens;
    totals.totalCost += aggregate.totalCost;
    totals.turnCount += aggregate.turnCount;
    totals.modelCount += modelRows.length;
  }
  return {
    updatedAt: Date.now(),
    days: safeDays,
    timeZone: normalizedTimeZone,
    daily,
    totals,
    costByAgent,
  };
};

module.exports = {
  getDailySummary,
};
