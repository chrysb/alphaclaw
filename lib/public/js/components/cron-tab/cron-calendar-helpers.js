const kMinuteMs = 60 * 1000;
const kHourMs = 60 * kMinuteMs;
const kDayMs = 24 * kHourMs;
const kRollingPastDays = 3;
const kRollingFutureDays = 3;

const toFiniteNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const startOfHourMs = (valueMs) => {
  const dateValue = new Date(toFiniteNumber(valueMs, Date.now()));
  dateValue.setMinutes(0, 0, 0);
  return dateValue.getTime();
};

const startOfDayMs = (valueMs) => {
  const dateValue = new Date(toFiniteNumber(valueMs, Date.now()));
  dateValue.setHours(0, 0, 0, 0);
  return dateValue.getTime();
};

const parseCronFields = (schedule = {}) => {
  const cronExpr = String(
    schedule?.expr || schedule?.cron || schedule?.cronExpr || "",
  ).trim();
  const fields = cronExpr.split(/\s+/);
  if (fields.length < 5) return null;
  const [minuteField, hourField, dayOfMonthField, monthField, dayOfWeekField] = fields;
  return {
    minuteField,
    hourField,
    dayOfMonthField,
    monthField,
    dayOfWeekField,
  };
};

const parseToken = (token = "", minValue = 0, maxValue = 0) => {
  if (/^\d+$/.test(token)) {
    const parsed = Number.parseInt(token, 10);
    if (Number.isFinite(parsed) && parsed >= minValue && parsed <= maxValue) return [parsed];
    return [];
  }
  const rangeMatch = token.match(/^(\d+)-(\d+)$/);
  if (rangeMatch) {
    const startValue = Number.parseInt(rangeMatch[1], 10);
    const endValue = Number.parseInt(rangeMatch[2], 10);
    if (!Number.isFinite(startValue) || !Number.isFinite(endValue)) return [];
    const safeStart = Math.max(minValue, Math.min(maxValue, startValue));
    const safeEnd = Math.max(minValue, Math.min(maxValue, endValue));
    if (safeStart > safeEnd) return [];
    return Array.from({ length: safeEnd - safeStart + 1 }, (_, index) => safeStart + index);
  }
  const stepMatch = token.match(/^\*\/(\d+)$/);
  if (stepMatch) {
    const step = Number.parseInt(stepMatch[1], 10);
    if (!Number.isFinite(step) || step <= 0) return [];
    const values = [];
    for (let value = minValue; value <= maxValue; value += step) values.push(value);
    return values;
  }
  if (token === "*") {
    return Array.from({ length: maxValue - minValue + 1 }, (_, index) => minValue + index);
  }
  return [];
};

const parseCronFieldSet = (field = "", minValue = 0, maxValue = 0) => {
  const raw = String(field || "").trim();
  if (!raw) return new Set();
  const tokens = raw.split(",").map((segment) => segment.trim()).filter(Boolean);
  const values = tokens.flatMap((token) => parseToken(token, minValue, maxValue));
  return new Set(values);
};

const buildCronMatcher = (cronFields = null) => {
  if (!cronFields) return null;
  return {
    minuteSet: parseCronFieldSet(cronFields.minuteField, 0, 59),
    hourSet: parseCronFieldSet(cronFields.hourField, 0, 23),
    dayOfMonthSet: parseCronFieldSet(cronFields.dayOfMonthField, 1, 31),
    monthSet: parseCronFieldSet(cronFields.monthField, 1, 12),
    dayOfWeekSet: parseCronFieldSet(cronFields.dayOfWeekField, 0, 7),
  };
};

const cronFieldMatches = (dateValue, cronMatcher = null) => {
  if (!cronMatcher) return false;
  const { minuteSet, hourSet, dayOfMonthSet, monthSet, dayOfWeekSet } = cronMatcher;

  const minute = dateValue.getMinutes();
  const hour = dateValue.getHours();
  const dayOfMonth = dateValue.getDate();
  const month = dateValue.getMonth() + 1;
  const dayOfWeek = dateValue.getDay();
  const dayOfWeekAliases = dayOfWeek === 0 ? [0, 7] : [dayOfWeek];

  const minuteMatches = minuteSet.size === 0 || minuteSet.has(minute);
  const hourMatches = hourSet.size === 0 || hourSet.has(hour);
  const dayOfMonthMatches = dayOfMonthSet.size === 0 || dayOfMonthSet.has(dayOfMonth);
  const monthMatches = monthSet.size === 0 || monthSet.has(month);
  const dayOfWeekMatches =
    dayOfWeekSet.size === 0 || dayOfWeekAliases.some((candidate) => dayOfWeekSet.has(candidate));

  return minuteMatches && hourMatches && dayOfMonthMatches && monthMatches && dayOfWeekMatches;
};

const toDayKey = (valueMs) => {
  const dateValue = new Date(valueMs);
  const year = dateValue.getFullYear();
  const month = String(dateValue.getMonth() + 1).padStart(2, "0");
  const day = String(dateValue.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const getRollingRange = ({
  nowMs = Date.now(),
  pastDays = kRollingPastDays,
  futureDays = kRollingFutureDays,
} = {}) => {
  const safeNowMs = toFiniteNumber(nowMs, Date.now());
  const safePastDays = Math.max(0, Number.parseInt(String(pastDays), 10) || kRollingPastDays);
  const safeFutureDays = Math.max(
    0,
    Number.parseInt(String(futureDays), 10) || kRollingFutureDays,
  );
  const rangeStartMs = startOfDayMs(safeNowMs - safePastDays * kDayMs);
  const rangeEndMs = startOfDayMs(safeNowMs + safeFutureDays * kDayMs) + kDayMs - 1;
  return {
    nowMs: safeNowMs,
    rangeStartMs,
    rangeEndMs,
    dayCount: safePastDays + safeFutureDays + 1,
  };
};

export const buildSlotKey = ({ jobId = "", scheduledAtMs = 0 } = {}) =>
  `${String(jobId || "")}:${toFiniteNumber(scheduledAtMs, 0)}`;

const isHighFrequencyCronJob = (job = {}) => {
  const scheduleKind = String(job?.schedule?.kind || "").trim().toLowerCase();
  if (scheduleKind !== "cron") return false;
  const cronFields = parseCronFields(job?.schedule || {});
  if (!cronFields) return false;
  if (cronFields.dayOfMonthField !== "*" || cronFields.monthField !== "*") return false;

  const minuteStepMatch = String(cronFields.minuteField || "").trim().match(/^\*\/(\d+)$/);
  const minuteSet = parseCronFieldSet(cronFields.minuteField, 0, 59);
  const hourSet = parseCronFieldSet(cronFields.hourField, 0, 23);
  const activeHoursPerDay = hourSet.size > 0 ? hourSet.size : 24;
  const runsPerHour = minuteSet.size > 0 ? minuteSet.size : 1;

  if (minuteStepMatch) {
    const stepMinutes = Number.parseInt(minuteStepMatch[1], 10);
    if (!Number.isFinite(stepMinutes) || stepMinutes <= 0) return false;
    // Treat frequent minute-step schedules over broad hour windows as "repeating/noisy".
    return stepMinutes <= 30 && activeHoursPerDay >= 4;
  }

  // Catch dense minute lists over broad hour windows, e.g. 0,15,30,45 6-13 * * 1-5.
  return runsPerHour >= 3 && activeHoursPerDay >= 4;
};

export const classifyRepeatingJobs = (jobs = []) => {
  const repeatingJobs = [];
  const scheduledJobs = [];
  jobs.forEach((job) => {
    const scheduleKind = String(job?.schedule?.kind || "").trim().toLowerCase();
    if (scheduleKind === "every" || isHighFrequencyCronJob(job)) repeatingJobs.push(job);
    else scheduledJobs.push(job);
  });
  return { repeatingJobs, scheduledJobs };
};

export const expandJobsToRollingSlots = ({
  jobs = [],
  nowMs = Date.now(),
  pastDays = kRollingPastDays,
  futureDays = kRollingFutureDays,
} = {}) => {
  const range = getRollingRange({ nowMs, pastDays, futureDays });
  const slots = [];
  const days = Array.from({ length: range.dayCount }, (_, offset) => {
    const dayStartMs = startOfDayMs(range.rangeStartMs + offset * kDayMs);
    return {
      dayStartMs,
      dayKey: toDayKey(dayStartMs),
      label: new Date(dayStartMs).toLocaleDateString([], {
        weekday: "short",
        month: "numeric",
        day: "numeric",
      }),
    };
  });

  jobs.forEach((job) => {
    const scheduleKind = String(job?.schedule?.kind || "").trim().toLowerCase();
    if (scheduleKind === "every") return;
    if (scheduleKind === "at") {
      const atMs = toFiniteNumber(job?.schedule?.at, 0);
      if (atMs < range.rangeStartMs || atMs > range.rangeEndMs) return;
      const slotMs = startOfHourMs(atMs);
      slots.push({
        key: buildSlotKey({ jobId: job.id, scheduledAtMs: atMs }),
        jobId: String(job?.id || ""),
        jobName: String(job?.name || job?.id || ""),
        scheduledAtMs: atMs,
        hourBucketMs: slotMs,
        dayKey: toDayKey(slotMs),
        hourOfDay: new Date(slotMs).getHours(),
      });
      return;
    }
    const cronFields = parseCronFields(job?.schedule || {});
    if (!cronFields) return;
    const cronMatcher = buildCronMatcher(cronFields);
    if (!cronMatcher) return;
    for (
      let tickMs = range.rangeStartMs;
      tickMs <= range.rangeEndMs;
      tickMs += kMinuteMs
    ) {
      const dateValue = new Date(tickMs);
      if (!cronFieldMatches(dateValue, cronMatcher)) continue;
      const hourBucketMs = startOfHourMs(tickMs);
      slots.push({
        key: buildSlotKey({ jobId: job.id, scheduledAtMs: tickMs }),
        jobId: String(job?.id || ""),
        jobName: String(job?.name || job?.id || ""),
        scheduledAtMs: tickMs,
        hourBucketMs,
        dayKey: toDayKey(tickMs),
        hourOfDay: dateValue.getHours(),
      });
    }
  });

  slots.sort((left, right) => left.scheduledAtMs - right.scheduledAtMs);
  return {
    range,
    days,
    slots,
  };
};

const normalizeRunStatus = (value = "") => {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "ok" || normalized === "error" || normalized === "skipped") {
    return normalized;
  }
  return "";
};

export const mapRunStatusesToSlots = ({
  slots = [],
  bulkRunsByJobId = {},
  nowMs = Date.now(),
  toleranceMs = 45 * kMinuteMs,
} = {}) => {
  const statusBySlotKey = {};
  const safeNowMs = toFiniteNumber(nowMs, Date.now());
  const safeToleranceMs = Math.max(0, toFiniteNumber(toleranceMs, 45 * kMinuteMs));

  const runEntriesByJobId = {};
  Object.entries(bulkRunsByJobId || {}).forEach(([jobId, runResult]) => {
    const entries = Array.isArray(runResult?.entries) ? runResult.entries : [];
    const normalizedEntries = entries
      .map((entry) => ({
        ts: toFiniteNumber(entry?.ts, 0),
        status: normalizeRunStatus(entry?.status),
      }))
      .filter((entry) => entry.ts > 0 && entry.status)
      .sort((left, right) => left.ts - right.ts);
    runEntriesByJobId[jobId] = normalizedEntries;
  });

  const consumedRunTimestampsByJobId = {};
  slots.forEach((slot) => {
    if (slot.scheduledAtMs > safeNowMs) return;
    const jobId = String(slot.jobId || "");
    const runEntries = runEntriesByJobId[jobId] || [];
    if (runEntries.length === 0) return;
    const consumedSet = consumedRunTimestampsByJobId[jobId] || new Set();
    consumedRunTimestampsByJobId[jobId] = consumedSet;

    let nearestEntry = null;
    let nearestDeltaMs = Number.MAX_SAFE_INTEGER;
    runEntries.forEach((entry) => {
      if (consumedSet.has(entry.ts)) return;
      const deltaMs = Math.abs(entry.ts - slot.scheduledAtMs);
      if (deltaMs > safeToleranceMs) return;
      if (deltaMs < nearestDeltaMs) {
        nearestDeltaMs = deltaMs;
        nearestEntry = entry;
      }
    });

    if (!nearestEntry) return;
    consumedSet.add(nearestEntry.ts);
    statusBySlotKey[slot.key] = nearestEntry.status;
  });

  return statusBySlotKey;
};

const readAvgTokens = (usageByJobId = {}, jobId = "") => {
  const usage = usageByJobId?.[jobId] || {};
  const avg = toFiniteNumber(
    usage.avgTokensPerRun,
    usage.runCount > 0 ? Math.round(toFiniteNumber(usage.totalTokens, 0) / usage.runCount) : 0,
  );
  return Math.max(0, avg);
};

export const kNext24hMs = 24 * kHourMs;

export const getUpcomingSlots = ({
  slots = [],
  nowMs = Date.now(),
  windowMs = kNext24hMs,
  limit = 12,
} = {}) => {
  const safeNowMs = toFiniteNumber(nowMs, Date.now());
  const cutoffMs = safeNowMs + toFiniteNumber(windowMs, kNext24hMs);
  return slots
    .filter((slot) => slot.scheduledAtMs > safeNowMs && slot.scheduledAtMs <= cutoffMs)
    .sort((left, right) => left.scheduledAtMs - right.scheduledAtMs)
    .slice(0, limit);
};

export const buildTokenTierByJobId = ({ jobs = [], usageByJobId = {} } = {}) => {
  const avgValues = jobs
    .filter((job) => job?.enabled !== false)
    .map((job) => readAvgTokens(usageByJobId, String(job?.id || "")))
    .filter((value) => value > 0)
    .sort((left, right) => left - right);

  if (avgValues.length === 0) {
    return jobs.reduce((accumulator, job) => {
      const jobId = String(job?.id || "");
      accumulator[jobId] = job?.enabled === false ? "disabled" : "unknown";
      return accumulator;
    }, {});
  }

  const percentileAt = (indexRatio) => {
    const index = Math.min(
      avgValues.length - 1,
      Math.floor((avgValues.length - 1) * indexRatio),
    );
    return avgValues[Math.max(0, index)];
  };
  const q1 = percentileAt(0.25);
  const q2 = percentileAt(0.5);
  const p90 = percentileAt(0.9);

  return jobs.reduce((accumulator, job) => {
    const jobId = String(job?.id || "");
    if (job?.enabled === false) {
      accumulator[jobId] = "disabled";
      return accumulator;
    }
    const avgTokens = readAvgTokens(usageByJobId, jobId);
    if (avgTokens <= 0) {
      accumulator[jobId] = "unknown";
      return accumulator;
    }
    if (avgTokens <= q1) {
      accumulator[jobId] = "low";
      return accumulator;
    }
    if (avgTokens <= q2) {
      accumulator[jobId] = "medium";
      return accumulator;
    }
    if (avgTokens <= p90) {
      accumulator[jobId] = "high";
      return accumulator;
    }
    accumulator[jobId] = "very-high";
    return accumulator;
  }, {});
};
