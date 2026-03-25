const fs = require("fs");
const path = require("path");
const { parseJsonValueFromNoisyOutput } = require("./utils/json");
const { deriveCostBreakdown } = require("./cost-utils");

const kCronStoreFile = "jobs.json";
const kCronRunsDir = "runs";
const kMaxRunsLimit = 200;
const kDefaultRunsLimit = 20;
const kDayMs = 24 * 60 * 60 * 1000;
const kTrendRange24h = "24h";
const kTrendRange7d = "7d";
const kTrendRange30d = "30d";

const toFiniteNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const sanitizeCronJobId = (jobId = "") => {
  const trimmed = String(jobId || "").trim();
  if (!trimmed) throw new Error("Job id is required");
  if (trimmed.includes("/") || trimmed.includes("\\") || trimmed.includes("\0")) {
    throw new Error("Invalid job id");
  }
  return trimmed;
};

const normalizeRunStatus = (value = "all") => {
  const normalized = String(value || "all").trim().toLowerCase();
  if (["ok", "error", "skipped", "all"].includes(normalized)) return normalized;
  return "all";
};

const normalizeDeliveryStatus = (value = "all") => {
  const normalized = String(value || "all").trim().toLowerCase();
  if (
    ["delivered", "not-delivered", "unknown", "not-requested", "all"].includes(
      normalized,
    )
  ) {
    return normalized;
  }
  return "all";
};

const readJsonFile = (filePath) => {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
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

const readCronStore = ({ cronDir }) => {
  const storePath = path.join(cronDir, kCronStoreFile);
  const parsed = readJsonFile(storePath);
  return {
    storePath,
    version: 1,
    jobs: normalizeJobs(parsed),
  };
};

const sortJobs = (jobs = [], { sortBy = "nextRunAtMs", sortDir = "asc" } = {}) => {
  const direction = String(sortDir || "asc").toLowerCase() === "desc" ? -1 : 1;
  const readSortable = (job) => {
    if (sortBy === "name") return String(job?.name || "").toLowerCase();
    if (sortBy === "updatedAtMs") return toFiniteNumber(job?.updatedAtMs, 0);
    return toFiniteNumber(job?.state?.nextRunAtMs, Number.MAX_SAFE_INTEGER);
  };
  return [...jobs].sort((a, b) => {
    const aValue = readSortable(a);
    const bValue = readSortable(b);
    if (aValue === bValue) return 0;
    return aValue > bValue ? direction : -direction;
  });
};

const paginate = (items = [], { limit = 200, offset = 0 } = {}) => {
  const safeLimit = Math.max(1, Math.min(200, Number.parseInt(String(limit), 10) || 200));
  const safeOffset = Math.max(0, Number.parseInt(String(offset), 10) || 0);
  const total = items.length;
  const entries = items.slice(safeOffset, safeOffset + safeLimit);
  const nextOffset = safeOffset + entries.length;
  return {
    entries,
    total,
    offset: safeOffset,
    limit: safeLimit,
    hasMore: nextOffset < total,
    nextOffset: nextOffset < total ? nextOffset : null,
  };
};

const parseRunLogLine = (line, jobId) => {
  if (!line) return null;
  try {
    const value = JSON.parse(line);
    if (!value || typeof value !== "object") return null;
    if (String(value.action || "") !== "finished") return null;
    if (String(value.jobId || "") !== jobId) return null;
    const ts = toFiniteNumber(value.ts, 0);
    if (!ts) return null;
    return {
      ts,
      jobId,
      action: "finished",
      status: value.status,
      error: value.error,
      summary: value.summary,
      delivered:
        typeof value.delivered === "boolean" ? value.delivered : undefined,
      deliveryStatus: value.deliveryStatus,
      deliveryError: value.deliveryError,
      sessionId: value.sessionId,
      sessionKey: value.sessionKey,
      runAtMs: value.runAtMs,
      durationMs: value.durationMs,
      nextRunAtMs: value.nextRunAtMs,
      model: value.model,
      provider: value.provider,
      usage:
        value.usage && typeof value.usage === "object" ? value.usage : undefined,
    };
  } catch {
    return null;
  }
};

const readTokenValue = (source = {}, keys = []) => {
  for (const key of keys) {
    const numericValue = Number(source?.[key]);
    if (Number.isFinite(numericValue) && numericValue >= 0) {
      return numericValue;
    }
  }
  return 0;
};

const enrichRunEntryEstimatedCost = (entry = {}) => {
  const usage = entry?.usage;
  if (!usage || typeof usage !== "object") return entry;
  const existingEstimatedCost = Number(
    usage?.estimatedCost ?? usage?.estimated_cost ?? entry?.estimatedCost ?? entry?.estimated_cost,
  );
  if (Number.isFinite(existingEstimatedCost) && existingEstimatedCost >= 0) {
    return {
      ...entry,
      estimatedCost: existingEstimatedCost,
      usage: {
        ...usage,
        estimatedCost: existingEstimatedCost,
      },
    };
  }
  const inputTokens = readTokenValue(usage, ["input_tokens", "inputTokens"]);
  const outputTokens = readTokenValue(usage, ["output_tokens", "outputTokens"]);
  const cacheReadTokens = readTokenValue(usage, ["cache_read_tokens", "cacheReadTokens"]);
  const cacheWriteTokens = readTokenValue(usage, ["cache_write_tokens", "cacheWriteTokens"]);
  if (inputTokens <= 0 && outputTokens <= 0 && cacheReadTokens <= 0 && cacheWriteTokens <= 0) {
    return entry;
  }
  const model = String(entry?.model || usage?.model || "").trim();
  if (!model) return entry;
  const breakdown = deriveCostBreakdown({
    inputTokens,
    outputTokens,
    cacheReadTokens,
    cacheWriteTokens,
    provider: String(entry?.provider || "").trim(),
    model,
  });
  if (!breakdown.pricingFound) {
    return {
      ...entry,
      usage: {
        ...usage,
        pricingFound: false,
      },
    };
  }
  return {
    ...entry,
    estimatedCost: breakdown.totalCost,
    usage: {
      ...usage,
      estimatedCost: breakdown.totalCost,
      pricingFound: true,
    },
  };
};

const readJobRuns = ({
  runsDir,
  jobId,
  limit = kDefaultRunsLimit,
  offset = 0,
  status = "all",
  deliveryStatus = "all",
  sortDir = "desc",
  query = "",
}) => {
  const safeJobId = sanitizeCronJobId(jobId);
  const runLogPath = path.join(runsDir, `${safeJobId}.jsonl`);
  const raw = fs.existsSync(runLogPath) ? fs.readFileSync(runLogPath, "utf8") : "";
  const lines = String(raw || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const entries = lines
    .map((line) => parseRunLogLine(line, safeJobId))
    .filter(Boolean);

  const normalizedStatus = normalizeRunStatus(status);
  const normalizedDeliveryStatus = normalizeDeliveryStatus(deliveryStatus);
  const queryText = String(query || "").trim().toLowerCase();

  const filtered = entries.filter((entry) => {
    if (normalizedStatus !== "all" && String(entry.status || "") !== normalizedStatus) {
      return false;
    }
    const entryDelivery = String(entry.deliveryStatus || "not-requested");
    if (
      normalizedDeliveryStatus !== "all" &&
      entryDelivery !== normalizedDeliveryStatus
    ) {
      return false;
    }
    if (!queryText) return true;
    const searchable = [
      String(entry.summary || ""),
      String(entry.error || ""),
      String(entry.model || ""),
      String(entry.provider || ""),
    ]
      .join(" ")
      .toLowerCase();
    return searchable.includes(queryText);
  });

  filtered.sort((a, b) => {
    if (sortDir === "asc") return a.ts - b.ts;
    return b.ts - a.ts;
  });

  const page = paginate(filtered, {
    limit: Math.max(1, Math.min(kMaxRunsLimit, Number.parseInt(String(limit), 10) || kDefaultRunsLimit)),
    offset,
  });
  return {
    runLogPath,
    entries: page.entries,
    total: page.total,
    offset: page.offset,
    limit: page.limit,
    hasMore: page.hasMore,
    nextOffset: page.nextOffset,
  };
};

const readJobDurationStats = ({ runsDir, jobId, sinceMs = 0 }) => {
  const safeJobId = sanitizeCronJobId(jobId);
  const runLogPath = path.join(runsDir, `${safeJobId}.jsonl`);
  const raw = fs.existsSync(runLogPath) ? fs.readFileSync(runLogPath, "utf8") : "";
  const lines = String(raw || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const safeSinceMs = toFiniteNumber(sinceMs, 0);
  let totalDurationMs = 0;
  let sampleCount = 0;
  for (const line of lines) {
    const entry = parseRunLogLine(line, safeJobId);
    if (!entry) continue;
    if (safeSinceMs > 0 && toFiniteNumber(entry.ts, 0) < safeSinceMs) continue;
    const durationMs = toFiniteNumber(entry.durationMs, -1);
    if (!Number.isFinite(durationMs) || durationMs < 0) continue;
    totalDurationMs += durationMs;
    sampleCount += 1;
  }
  return {
    totalDurationMs,
    sampleCount,
    avgDurationMs: sampleCount > 0 ? Math.round(totalDurationMs / sampleCount) : 0,
  };
};
const startOfLocalDayMs = (valueMs) => {
  const dateValue = new Date(toFiniteNumber(valueMs, 0));
  dateValue.setHours(0, 0, 0, 0);
  return dateValue.getTime();
};
const addLocalDaysMs = (valueMs, dayCount = 0) => {
  const dateValue = new Date(toFiniteNumber(valueMs, 0));
  dateValue.setDate(dateValue.getDate() + Number(dayCount || 0));
  return dateValue.getTime();
};
const readRunEntryTotalTokens = (entry = {}) => {
  const usage = entry?.usage && typeof entry.usage === "object" ? entry.usage : {};
  const componentCandidates = [
    usage?.input_tokens,
    usage?.inputTokens,
    usage?.output_tokens,
    usage?.outputTokens,
    usage?.cache_read_tokens,
    usage?.cacheReadTokens,
    usage?.cache_write_tokens,
    usage?.cacheWriteTokens,
  ];
  const componentTotal = componentCandidates.reduce((sum, candidate) => {
    const numericValue = Number(candidate);
    if (!Number.isFinite(numericValue) || numericValue < 0) return sum;
    return sum + numericValue;
  }, 0);
  if (componentTotal > 0) return componentTotal;
  const fallbackCandidates = [
    usage?.total_tokens,
    usage?.totalTokens,
    entry?.total_tokens,
    entry?.totalTokens,
  ];
  for (const candidate of fallbackCandidates) {
    const numericValue = Number(candidate);
    if (Number.isFinite(numericValue) && numericValue >= 0) return numericValue;
  }
  return 0;
};
const readRunEntryEstimatedCost = (entry = {}) => {
  const usage = entry?.usage && typeof entry.usage === "object" ? entry.usage : {};
  const candidates = [
    entry?.estimatedCost,
    entry?.estimated_cost,
    usage?.estimatedCost,
    usage?.estimated_cost,
    usage?.totalCost,
    usage?.total_cost,
    usage?.costUsd,
    usage?.cost,
  ];
  for (const candidate of candidates) {
    const numericValue = Number(candidate);
    if (Number.isFinite(numericValue) && numericValue >= 0) return numericValue;
  }
  return null;
};
const getJobTrends = ({
  runsDir,
  jobId,
  sinceMs = 0,
  nowMs = Date.now(),
  range = kTrendRange7d,
}) => {
  const safeJobId = sanitizeCronJobId(jobId);
  const runLogPath = path.join(runsDir, `${safeJobId}.jsonl`);
  const raw = fs.existsSync(runLogPath) ? fs.readFileSync(runLogPath, "utf8") : "";
  const lines = String(raw || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const safeNowMs = toFiniteNumber(nowMs, Date.now());
  const safeSinceMs = toFiniteNumber(sinceMs, 0);
  const normalizedRange = (() => {
    const rawValue = String(range || kTrendRange7d).trim().toLowerCase();
    if (rawValue === kTrendRange24h) return kTrendRange24h;
    if (rawValue === kTrendRange30d) return kTrendRange30d;
    return kTrendRange7d;
  })();
  const rangeConfig = normalizedRange === kTrendRange24h
    ? {
      bucketCount: 24,
      bucketMs: 60 * 60 * 1000,
      alignToLocalDay: false,
    }
    : normalizedRange === kTrendRange30d
      ? {
        bucketCount: 30,
        bucketMs: kDayMs,
        alignToLocalDay: true,
      }
      : {
        bucketCount: 7,
        bucketMs: kDayMs,
        alignToLocalDay: true,
      };
  const windowStartMs = safeSinceMs > 0
    ? (rangeConfig.alignToLocalDay ? startOfLocalDayMs(safeSinceMs) : safeSinceMs)
    : rangeConfig.alignToLocalDay
      ? addLocalDaysMs(startOfLocalDayMs(safeNowMs), -(rangeConfig.bucketCount - 1))
      : safeNowMs - rangeConfig.bucketCount * rangeConfig.bucketMs;
  const windowEndMs = safeNowMs;
  const pointsByDayStartMs = new Map();
  for (let index = 0; index < rangeConfig.bucketCount; index += 1) {
    const bucketStartMs = rangeConfig.alignToLocalDay
      ? addLocalDaysMs(windowStartMs, index)
      : windowStartMs + index * rangeConfig.bucketMs;
    const bucketEndMs = index === rangeConfig.bucketCount - 1
      ? windowEndMs
      : rangeConfig.alignToLocalDay
        ? addLocalDaysMs(windowStartMs, index + 1)
        : windowStartMs + (index + 1) * rangeConfig.bucketMs;
    pointsByDayStartMs.set(bucketStartMs, {
      startMs: bucketStartMs,
      endMs: bucketEndMs,
      ok: 0,
      error: 0,
      skipped: 0,
      totalRuns: 0,
      totalTokens: 0,
      totalCost: 0,
      costSamples: 0,
      totalDurationMs: 0,
      durationSamples: 0,
    });
  }
  for (const line of lines) {
    const parsedEntry = parseRunLogLine(line, safeJobId);
    if (!parsedEntry) continue;
    const entry = enrichRunEntryEstimatedCost(parsedEntry);
    const timestampMs = toFiniteNumber(entry.ts, 0);
    if (timestampMs <= 0 || timestampMs < windowStartMs || timestampMs > windowEndMs) {
      continue;
    }
    const bucketKey = rangeConfig.alignToLocalDay
      ? startOfLocalDayMs(timestampMs)
      : windowStartMs +
        Math.floor((timestampMs - windowStartMs) / rangeConfig.bucketMs) * rangeConfig.bucketMs;
    const point = pointsByDayStartMs.get(bucketKey);
    if (!point) continue;
    point.totalRuns += 1;
    const status = String(entry?.status || "").trim().toLowerCase();
    if (status === "ok" || status === "error" || status === "skipped") {
      point[status] += 1;
    }
    point.totalTokens += readRunEntryTotalTokens(entry);
    const estimatedCost = readRunEntryEstimatedCost(entry);
    if (estimatedCost != null) {
      point.totalCost += estimatedCost;
      point.costSamples += 1;
    }
    const durationMs = toFiniteNumber(entry?.durationMs, -1);
    if (Number.isFinite(durationMs) && durationMs >= 0) {
      point.totalDurationMs += durationMs;
      point.durationSamples += 1;
    }
  }
  const points = Array.from(pointsByDayStartMs.values()).map((point) => ({
    ...point,
    avgDurationMs: point.durationSamples > 0
      ? Math.round(point.totalDurationMs / point.durationSamples)
      : 0,
  }));
  return {
    sinceMs: windowStartMs,
    nowMs: windowEndMs,
    bucket: rangeConfig.alignToLocalDay ? "day" : "hour",
    range: normalizedRange,
    points,
  };
};

const shellEscapeArg = (value) => `'${String(value || "").replace(/'/g, `'\\''`)}'`;
const normalizeRoutingField = (value) => String(value || "").trim().toLowerCase();

const parseCommandJson = (rawOutput) => {
  const parsed = parseJsonValueFromNoisyOutput(rawOutput);
  if (parsed && typeof parsed === "object") return parsed;
  return null;
};

const createCronService = ({
  clawCmd,
  OPENCLAW_DIR,
  getSessionUsageByKeyPattern,
}) => {
  const cronDir = path.join(OPENCLAW_DIR, "cron");
  const runsDir = path.join(cronDir, kCronRunsDir);

  const listJobs = ({ sortBy = "nextRunAtMs", sortDir = "asc" } = {}) => {
    const store = readCronStore({ cronDir });
    const jobs = sortJobs(store.jobs, { sortBy, sortDir });
    return {
      storePath: store.storePath,
      jobs,
    };
  };

  const getStatus = () => {
    const { storePath, jobs } = listJobs({ sortBy: "nextRunAtMs", sortDir: "asc" });
    const enabledJobs = jobs.filter((job) => job.enabled !== false);
    const nextWakeAtMs = enabledJobs.reduce((lowestValue, job) => {
      const candidate = toFiniteNumber(job?.state?.nextRunAtMs, 0);
      if (!candidate) return lowestValue;
      if (!lowestValue) return candidate;
      return Math.min(lowestValue, candidate);
    }, 0);
    return {
      enabled: true,
      storePath,
      jobs: jobs.length,
      enabledJobs: enabledJobs.length,
      nextWakeAtMs: nextWakeAtMs || null,
    };
  };

  const runCommand = async (command, { timeoutMs = 30000 } = {}) => {
    const baseOptions = { quiet: true, timeoutMs };
    const result = await clawCmd(command, baseOptions);
    if (!result?.ok) {
      const message = String(result?.stderr || result?.stdout || "Command failed").trim();
      throw new Error(message || "Command failed");
    }
    return {
      raw: result.stdout || "",
      parsed: parseCommandJson(result.stdout || ""),
    };
  };

  const runJobNow = async (jobId) => {
    const safeJobId = sanitizeCronJobId(jobId);
    const command = `cron run ${shellEscapeArg(safeJobId)}`;
    return runCommand(command, { timeoutMs: 600000 });
  };

  const setJobEnabled = async ({ jobId, enabled }) => {
    const safeJobId = sanitizeCronJobId(jobId);
    const action = enabled ? "enable" : "disable";
    const command = `cron ${action} ${shellEscapeArg(safeJobId)}`;
    return runCommand(command, { timeoutMs: 60000 });
  };

  const updateJobPrompt = async ({ jobId, message }) => {
    const safeJobId = sanitizeCronJobId(jobId);
    const command = `cron edit ${shellEscapeArg(safeJobId)} --message ${shellEscapeArg(message || "")}`;
    return runCommand(command, { timeoutMs: 60000 });
  };

  const updateJobRouting = async ({
    jobId,
    sessionTarget,
    wakeMode,
    deliveryMode,
    deliveryChannel,
    deliveryTo,
  }) => {
    const safeJobId = sanitizeCronJobId(jobId);
    const normalizedSessionTarget = normalizeRoutingField(sessionTarget);
    const normalizedWakeMode = normalizeRoutingField(wakeMode);
    const normalizedDeliveryMode = normalizeRoutingField(deliveryMode);
    const commandParts = ["cron", "edit", shellEscapeArg(safeJobId)];

    if (normalizedSessionTarget) {
      if (normalizedSessionTarget !== "main" && normalizedSessionTarget !== "isolated") {
        throw new Error("sessionTarget must be main or isolated");
      }
      commandParts.push("--session", shellEscapeArg(normalizedSessionTarget));
    }

    if (normalizedWakeMode) {
      if (normalizedWakeMode !== "now" && normalizedWakeMode !== "next-heartbeat") {
        throw new Error("wakeMode must be now or next-heartbeat");
      }
      commandParts.push("--wake", shellEscapeArg(normalizedWakeMode));
    }

    if (normalizedDeliveryMode) {
      if (normalizedDeliveryMode === "announce") commandParts.push("--announce");
      else if (normalizedDeliveryMode === "none") commandParts.push("--no-deliver");
      else throw new Error("deliveryMode must be announce or none");
    }

    const normalizedDeliveryChannel = String(deliveryChannel || "").trim();
    const normalizedDeliveryTo = String(deliveryTo || "").trim();
    if (normalizedDeliveryChannel) {
      commandParts.push("--channel", shellEscapeArg(normalizedDeliveryChannel));
    }
    if (normalizedDeliveryTo) {
      commandParts.push("--to", shellEscapeArg(normalizedDeliveryTo));
    }

    if (commandParts.length <= 3) {
      throw new Error("At least one routing field is required");
    }

    return runCommand(commandParts.join(" "), { timeoutMs: 60000 });
  };

  const getJobRuns = ({
    jobId,
    limit = kDefaultRunsLimit,
    offset = 0,
    status = "all",
    deliveryStatus = "all",
    sortDir = "desc",
    query = "",
  }) => {
    const runs = readJobRuns({
      runsDir,
      jobId,
      limit,
      offset,
      status,
      deliveryStatus,
      sortDir,
      query,
    });
    return {
      ...runs,
      entries: runs.entries.map((entry) => enrichRunEntryEstimatedCost(entry)),
    };
  };

  const getJobUsage = ({ jobId, sinceMs = 0 }) => {
    const safeJobId = sanitizeCronJobId(jobId);
    const keyPattern = `%:cron:${safeJobId}%`;
    const usage = getSessionUsageByKeyPattern({
      keyPattern,
      sinceMs: toFiniteNumber(sinceMs, 0),
    });
    const durationStats = readJobDurationStats({
      runsDir,
      jobId: safeJobId,
      sinceMs: toFiniteNumber(sinceMs, 0),
    });
    const totals =
      usage?.totals && typeof usage.totals === "object"
        ? usage.totals
        : {};
    return {
      ...usage,
      totals: {
        ...totals,
        totalDurationMs: durationStats.totalDurationMs,
        durationSamples: durationStats.sampleCount,
        avgDurationMs: durationStats.avgDurationMs,
      },
    };
  };

  const getBulkJobUsage = ({ sinceMs = 0 } = {}) => {
    const { jobs } = listJobs({ sortBy: "name", sortDir: "asc" });
    const safeSinceMs = toFiniteNumber(sinceMs, 0);
    const byJobId = {};
    jobs.forEach((job) => {
      const usage = getJobUsage({ jobId: job.id, sinceMs: safeSinceMs }) || {};
      const totals = usage?.totals || {};
      const runCount = toFiniteNumber(totals.runCount, 0);
      const totalTokens = toFiniteNumber(totals.totalTokens, 0);
      const totalCost = toFiniteNumber(totals.totalCost, 0);
      byJobId[job.id] = {
        totalTokens,
        totalCost,
        runCount,
        avgTokensPerRun: runCount > 0 ? Math.round(totalTokens / runCount) : 0,
      };
    });
    return {
      sinceMs: safeSinceMs,
      byJobId,
    };
  };

  const getBulkJobRuns = ({
    sinceMs = 0,
    limitPerJob = kDefaultRunsLimit,
    status = "all",
    deliveryStatus = "all",
    sortDir = "desc",
    query = "",
  } = {}) => {
    const { jobs } = listJobs({ sortBy: "name", sortDir: "asc" });
    const safeSinceMs = toFiniteNumber(sinceMs, 0);
    const safeLimitPerJob = Math.max(
      1,
      Math.min(kMaxRunsLimit, Number.parseInt(String(limitPerJob), 10) || kDefaultRunsLimit),
    );
    const byJobId = {};
    jobs.forEach((job) => {
      const runs = getJobRuns({
        jobId: job.id,
        limit: safeLimitPerJob,
        offset: 0,
        status,
        deliveryStatus,
        sortDir,
        query,
      });
      const filteredEntries = safeSinceMs > 0
        ? runs.entries.filter((entry) => toFiniteNumber(entry?.ts, 0) >= safeSinceMs)
        : runs.entries;
      byJobId[job.id] = {
        entries: filteredEntries,
        total: filteredEntries.length,
      };
    });
    return {
      sinceMs: safeSinceMs,
      byJobId,
    };
  };
  const getJobRunTrends = ({ jobId, sinceMs = 0, range = kTrendRange7d }) =>
    getJobTrends({
      runsDir,
      jobId,
      sinceMs: toFiniteNumber(sinceMs, 0),
      range,
    });

  return {
    listJobs,
    getStatus,
    runJobNow,
    setJobEnabled,
    updateJobPrompt,
    updateJobRouting,
    getJobRuns,
    getJobUsage,
    getJobRunTrends,
    getBulkJobUsage,
    getBulkJobRuns,
  };
};

module.exports = {
  createCronService,
};
