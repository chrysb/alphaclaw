import {
  formatDurationCompactMs,
  formatInteger,
  formatLocaleDateTimeWithTodayTime,
  formatUsd,
} from "../../lib/format.js";

export const kAllCronJobsRouteKey = "__all__";

const kWeekdayLabelByCronValue = {
  "0": "Sun",
  "1": "Mon",
  "2": "Tue",
  "3": "Wed",
  "4": "Thu",
  "5": "Fri",
  "6": "Sat",
  "7": "Sun",
};

const formatHourMinute = ({ hourField, minuteField }) => {
  const hour = Number.parseInt(String(hourField || ""), 10);
  const minute = Number.parseInt(String(minuteField || ""), 10);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return "";
  const normalizedHour = ((hour % 24) + 24) % 24;
  const suffix = normalizedHour >= 12 ? "pm" : "am";
  const twelveHour = normalizedHour % 12 === 0 ? 12 : normalizedHour % 12;
  const paddedMinute = String(minute).padStart(2, "0");
  return `${twelveHour}:${paddedMinute}${suffix}`;
};

const formatHourOnly = (hourField) => {
  const hour = Number.parseInt(String(hourField || ""), 10);
  if (!Number.isFinite(hour)) return "";
  const normalizedHour = ((hour % 24) + 24) % 24;
  const suffix = normalizedHour >= 12 ? "pm" : "am";
  const twelveHour = normalizedHour % 12 === 0 ? 12 : normalizedHour % 12;
  return `${twelveHour}${suffix}`;
};

const formatHourRange = (hourRangeField = "") => {
  const match = String(hourRangeField || "").match(/^(\d{1,2})-(\d{1,2})$/);
  if (!match) return "";
  const startHour = formatHourOnly(match[1]);
  const endHour = formatHourOnly(match[2]);
  if (!startHour || !endHour) return "";
  return `${startHour}-${endHour}`;
};

const humanizeCronExpression = (expr = "") => {
  const fields = String(expr || "").trim().split(/\s+/);
  if (fields.length < 5) return "";
  const [minuteField, hourField, dayOfMonthField, monthField, dayOfWeekField] = fields;

  if (
    dayOfMonthField === "*" &&
    monthField === "*" &&
    dayOfWeekField === "*" &&
    hourField === "*" &&
    /^\*\/\d+$/.test(minuteField)
  ) {
    return `Every ${minuteField.slice(2)}m`;
  }

  if (
    dayOfMonthField === "*" &&
    monthField === "*" &&
    dayOfWeekField === "*" &&
    minuteField === "0" &&
    /^\*\/\d+$/.test(hourField)
  ) {
    return `Every ${hourField.slice(2)}h`;
  }

  const formattedTime = formatHourMinute({ hourField, minuteField });
  if (
    dayOfMonthField === "*" &&
    monthField === "*" &&
    dayOfWeekField === "1-5" &&
    /^\*\/\d+$/.test(minuteField) &&
    /^\d{1,2}-\d{1,2}$/.test(hourField)
  ) {
    const minutesStep = minuteField.slice(2);
    const hourRange = formatHourRange(hourField);
    if (hourRange) {
      return `Every ${minutesStep}m, ${hourRange} weekdays`;
    }
  }

  if (
    dayOfMonthField === "*" &&
    monthField === "*" &&
    dayOfWeekField === "1-5" &&
    formattedTime
  ) {
    return `Weekdays at ${formattedTime}`;
  }

  if (
    dayOfMonthField === "*" &&
    monthField === "*" &&
    /^([0-7])(,[0-7])*$/.test(dayOfWeekField) &&
    formattedTime
  ) {
    const dayLabels = dayOfWeekField
      .split(",")
      .map((value) => kWeekdayLabelByCronValue[value] || value)
      .join(", ");
    return `Every ${dayLabels} at ${formattedTime}`;
  }

  if (
    dayOfMonthField === "*" &&
    monthField === "*" &&
    dayOfWeekField === "*" &&
    formattedTime
  ) {
    return `Daily at ${formattedTime}`;
  }

  if (
    /^\d{1,2}$/.test(dayOfMonthField) &&
    monthField === "*" &&
    dayOfWeekField === "*" &&
    formattedTime
  ) {
    const dayOfMonth = Number.parseInt(dayOfMonthField, 10);
    if (Number.isFinite(dayOfMonth) && dayOfMonth >= 1 && dayOfMonth <= 31) {
      return `Monthly on day ${dayOfMonth} at ${formattedTime}`;
    }
  }

  return "";
};

const normalizeTimeZoneName = (value = "") => String(value || "").trim().toLowerCase();

const getClientTimeZone = () => {
  try {
    return Intl?.DateTimeFormat?.().resolvedOptions?.().timeZone || "";
  } catch {
    return "";
  }
};

const shouldAppendTimeZone = ({
  scheduleTimeZone = "",
  includeTimeZone = false,
  includeTimeZoneWhenDifferent = false,
  clientTimeZone = "",
}) => {
  const normalizedScheduleTimeZone = normalizeTimeZoneName(scheduleTimeZone);
  if (!normalizedScheduleTimeZone) return false;
  if (includeTimeZone) return true;
  if (!includeTimeZoneWhenDifferent) return false;
  const normalizedClientTimeZone = normalizeTimeZoneName(
    clientTimeZone || getClientTimeZone(),
  );
  if (!normalizedClientTimeZone) return true;
  return normalizedClientTimeZone !== normalizedScheduleTimeZone;
};

export const formatCronScheduleLabel = (
  schedule = {},
  { includeTimeZone = false, includeTimeZoneWhenDifferent = false, clientTimeZone = "" } = {},
) => {
  const kind = String(schedule?.kind || "").trim();
  if (kind === "every") {
    const everyMs = Number(schedule?.everyMs || 0);
    if (everyMs > 0) return `Every ${formatDurationCompactMs(everyMs)}`;
    return "Every interval";
  }
  if (kind === "at") {
    return `At ${formatLocaleDateTimeWithTodayTime(schedule?.at, { fallback: "scheduled time" })}`;
  }
  if (kind === "cron") {
    const expr = String(schedule?.expr || "").trim();
    if (!expr) return "Cron";
    const humanized = humanizeCronExpression(expr);
    const tz = String(schedule?.tz || "").trim();
    const appendTimeZone = shouldAppendTimeZone({
      scheduleTimeZone: tz,
      includeTimeZone,
      includeTimeZoneWhenDifferent,
      clientTimeZone,
    });
    if (humanized) {
      return appendTimeZone ? `${humanized} (${tz})` : humanized;
    }
    return appendTimeZone ? `${expr} (${tz})` : expr;
  }
  const fallbackCronExpr = String(
    schedule?.expr || schedule?.cron || schedule?.cronExpr || "",
  ).trim();
  if (fallbackCronExpr) {
    const humanized = humanizeCronExpression(fallbackCronExpr);
    const tz = String(schedule?.tz || schedule?.timezone || "").trim();
    const appendTimeZone = shouldAppendTimeZone({
      scheduleTimeZone: tz,
      includeTimeZone,
      includeTimeZoneWhenDifferent,
      clientTimeZone,
    });
    if (humanized) {
      return appendTimeZone ? `${humanized} (${tz})` : humanized;
    }
    return appendTimeZone ? `${fallbackCronExpr} (${tz})` : fallbackCronExpr;
  }
  return "Unknown schedule";
};

export const formatRelativeMs = (targetMs, nowMs = Date.now()) => {
  const value = Number(targetMs || 0);
  if (!Number.isFinite(value) || value <= 0) return "—";
  const deltaMs = value - nowMs;
  const isFuture = deltaMs > 0;
  const absSeconds = Math.round(Math.abs(deltaMs) / 1000);
  if (absSeconds < 60) return isFuture ? "in <1m" : "just now";
  const absMinutes = Math.round(absSeconds / 60);
  if (absMinutes < 60) return isFuture ? `in ${absMinutes}m` : `${absMinutes}m ago`;
  const absHours = Math.round(absMinutes / 60);
  if (absHours < 24) return isFuture ? `in ${absHours}h` : `${absHours}h ago`;
  const absDays = Math.round(absHours / 24);
  return isFuture ? `in ${absDays}d` : `${absDays}d ago`;
};

export const formatRelativeCompact = (targetMs, nowMs = Date.now()) => {
  const value = Number(targetMs || 0);
  if (!Number.isFinite(value) || value <= 0) return "—";
  const deltaMs = Math.abs(value - nowMs);
  const totalSeconds = Math.max(0, Math.round(deltaMs / 1000));
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const totalMinutes = Math.round(totalSeconds / 60);
  if (totalMinutes < 60) return `${totalMinutes}m`;
  const totalHours = Math.round(totalMinutes / 60);
  if (totalHours < 24) return `${totalHours}h`;
  const totalDays = Math.round(totalHours / 24);
  if (totalDays < 30) return `${totalDays}d`;
  const totalMonths = Math.round(totalDays / 30);
  return `${totalMonths}mo`;
};

export const formatNextRunRelativeMs = (nextRunAtMs, nowMs = Date.now()) => {
  const value = Number(nextRunAtMs || 0);
  if (!Number.isFinite(value) || value <= 0) return "—";
  if (value >= nowMs) return formatRelativeMs(value, nowMs);
  const overdueDeltaMs = nowMs - value;
  if (overdueDeltaMs < 60 * 1000) return "due now";
  const overdueSeconds = Math.round(overdueDeltaMs / 1000);
  if (overdueSeconds < 60) return "overdue by <1m";
  const overdueMinutes = Math.round(overdueSeconds / 60);
  if (overdueMinutes < 60) return `overdue by ${overdueMinutes}m`;
  const overdueHours = Math.round(overdueMinutes / 60);
  if (overdueHours < 24) return `overdue by ${overdueHours}h`;
  const overdueDays = Math.round(overdueHours / 24);
  return `overdue by ${overdueDays}d`;
};

export const getCronJobHealth = (job = {}) => {
  if (job.enabled === false) return "disabled";
  if (job?.state?.runningAtMs) return "running";
  const lastStatus = String(job?.state?.lastStatus || job?.state?.lastRunStatus || "")
    .trim()
    .toLowerCase();
  if (lastStatus === "error") return "error";
  if (lastStatus === "ok") return "ok";
  return "unknown";
};

export const getCronJobHealthClassName = (health = "") => {
  if (health === "ok") return "bg-green-500";
  if (health === "error") return "bg-red-500";
  if (health === "running") return "bg-yellow-400";
  return "bg-gray-500";
};

export const formatTokenCount = (value) => formatInteger(Number(value || 0));
export const formatCost = (value) => formatUsd(Number(value || 0));
export const getCronRunTotalTokens = (entry = {}) => {
  const usage = entry?.usage || {};
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
  const totalCandidates = [
    usage?.total_tokens,
    usage?.totalTokens,
    entry?.total_tokens,
    entry?.totalTokens,
  ];
  for (const candidate of totalCandidates) {
    const numericValue = Number(candidate);
    if (Number.isFinite(numericValue) && numericValue >= 0) return numericValue;
  }
  return 0;
};
export const getCronRunEstimatedCost = (entry = {}) => {
  const usage = entry?.usage || {};
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
const hasHeartbeatOnlySummary = (job = {}) => {
  const state = job?.state || {};
  try {
    return String(JSON.stringify(state) || "")
      .toUpperCase()
      .includes("HEARTBEAT_OK");
  } catch {
    return false;
  }
};
const hasHeartbeatSummaryInLatestRun = ({
  jobId = "",
  bulkRunsByJobId = {},
} = {}) => {
  const safeJobId = String(jobId || "").trim();
  if (!safeJobId) return false;
  const entries = Array.isArray(bulkRunsByJobId?.[safeJobId]?.entries)
    ? bulkRunsByJobId[safeJobId].entries
    : [];
  if (entries.length === 0) return false;
  const latestEntry = entries.reduce((latestValue, candidate) =>
    Number(candidate?.ts || 0) > Number(latestValue?.ts || 0)
      ? candidate
      : latestValue);
  const summaryCandidates = [
    latestEntry?.summary,
    latestEntry?.result?.summary,
    latestEntry?.payload?.summary,
  ];
  return summaryCandidates.some((value) =>
    String(value || "")
      .toUpperCase()
      .includes("HEARTBEAT_OK"));
};
const getLatestRunStatus = ({
  job = {},
  jobId = "",
  bulkRunsByJobId = {},
} = {}) => {
  const safeJobId = String(jobId || "").trim();
  const entries = Array.isArray(bulkRunsByJobId?.[safeJobId]?.entries)
    ? bulkRunsByJobId[safeJobId].entries
    : [];
  const latestEntry = entries.length > 0
    ? entries.reduce((latestValue, candidate) =>
      Number(candidate?.ts || 0) > Number(latestValue?.ts || 0)
        ? candidate
        : latestValue)
    : null;
  const status = String(
    latestEntry?.status ||
    job?.state?.lastStatus ||
    job?.state?.lastRunStatus ||
    "",
  )
    .trim()
    .toLowerCase();
  return status;
};

export const buildCronOptimizationWarnings = (jobs = [], bulkRunsByJobId = {}) => {
  const warnings = [];
  jobs.forEach((job) => {
    const jobId = String(job?.id || "");
    const prompt = String(job?.payload?.message || "").toLowerCase();
    const deliveryMode = String(job?.delivery?.mode || "").toLowerCase();
    if (
      deliveryMode === "none" &&
      (prompt.includes("message tool") || prompt.includes("send to telegram"))
    ) {
      warnings.push({
        tone: "warning",
        jobId: String(job?.id || ""),
        title: `${job.name || job.id}: delivery mismatch`,
        body: "Job uses delivery.mode=none but prompt asks to send via message tool.",
      });
    }
    if (Number(job?.state?.consecutiveErrors || 0) >= 2) {
      warnings.push({
        tone: "error",
        jobId: String(job?.id || ""),
        title: `${job.name || job.id}: repeated errors`,
        body: `Consecutive errors: ${Number(job?.state?.consecutiveErrors || 0)}.`,
      });
    }
    const latestStatus = getLatestRunStatus({
      job,
      jobId,
      bulkRunsByJobId,
    });
    if (
      job?.state?.lastDelivered === false &&
      String(job?.state?.lastDeliveryStatus || "").trim().toLowerCase() === "not-delivered" &&
      latestStatus !== "ok" &&
      !hasHeartbeatOnlySummary(job) &&
      !hasHeartbeatSummaryInLatestRun({ jobId, bulkRunsByJobId })
    ) {
      warnings.push({
        tone: "warning",
        jobId,
        title: `${job.name || job.id}: not delivered`,
        body: "Latest run completed but was not delivered.",
      });
    }
  });
  return warnings.slice(0, 8);
};

export const getNextScheduledRunAcrossJobs = (jobs = []) => {
  const nextMs = jobs
    .filter((job) => job?.enabled !== false)
    .map((job) => Number(job?.state?.nextRunAtMs || 0))
    .filter((value) => Number.isFinite(value) && value > 0)
    .sort((left, right) => left - right)[0];
  return nextMs || null;
};
