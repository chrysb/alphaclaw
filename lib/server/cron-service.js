const fs = require("fs");
const path = require("path");
const { parseJsonValueFromNoisyOutput } = require("./utils/json");

const kCronStoreFile = "jobs.json";
const kCronRunsDir = "runs";
const kMaxRunsLimit = 200;
const kDefaultRunsLimit = 20;

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

const shellEscapeArg = (value) => `'${String(value || "").replace(/'/g, `'\\''`)}'`;

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
    const result = await clawCmd(command, { quiet: true, timeoutMs });
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
    const command = `cron run ${shellEscapeArg(safeJobId)} --json`;
    return runCommand(command, { timeoutMs: 600000 });
  };

  const setJobEnabled = async ({ jobId, enabled }) => {
    const safeJobId = sanitizeCronJobId(jobId);
    const action = enabled ? "enable" : "disable";
    const command = `cron ${action} ${shellEscapeArg(safeJobId)} --json`;
    return runCommand(command, { timeoutMs: 60000 });
  };

  const updateJobPrompt = async ({ jobId, message }) => {
    const safeJobId = sanitizeCronJobId(jobId);
    const command = `cron edit ${shellEscapeArg(safeJobId)} --message ${shellEscapeArg(message || "")} --json`;
    return runCommand(command, { timeoutMs: 60000 });
  };

  const getJobRuns = ({
    jobId,
    limit = kDefaultRunsLimit,
    offset = 0,
    status = "all",
    deliveryStatus = "all",
    sortDir = "desc",
    query = "",
  }) =>
    readJobRuns({
      runsDir,
      jobId,
      limit,
      offset,
      status,
      deliveryStatus,
      sortDir,
      query,
    });

  const getJobUsage = ({ jobId, sinceMs = 0 }) => {
    const safeJobId = sanitizeCronJobId(jobId);
    const keyPattern = `%:cron:${safeJobId}%`;
    return getSessionUsageByKeyPattern({
      keyPattern,
      sinceMs: toFiniteNumber(sinceMs, 0),
    });
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

  return {
    listJobs,
    getStatus,
    runJobNow,
    setJobEnabled,
    updateJobPrompt,
    getJobRuns,
    getJobUsage,
    getBulkJobUsage,
    getBulkJobRuns,
  };
};

module.exports = {
  createCronService,
};
