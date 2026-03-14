import { h } from "https://esm.sh/preact";
import { useEffect, useMemo, useRef, useState } from "https://esm.sh/preact/hooks";
import htm from "https://esm.sh/htm";
import {
  formatCronScheduleLabel,
  formatRelativeCompact,
  getCronJobHealth,
  getCronJobHealthClassName,
  kAllCronJobsRouteKey,
} from "./cron-helpers.js";

const html = htm.bind(h);
const kGroupOrder = ["daily", "weekly", "monthly", "other"];
const kGroupLabelByKey = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  other: "Other",
};
const kMinutesPerHour = 60;

const parseCronNumeric = (value = "") => {
  const parsed = Number.parseInt(String(value || "").trim(), 10);
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizeCronWeekday = (value) => {
  if (!Number.isFinite(value)) return null;
  const normalized = value === 7 ? 0 : value;
  return normalized >= 0 && normalized <= 6 ? normalized : null;
};

const parseCronWeekdayField = (field = "") => {
  const raw = String(field || "").trim().toLowerCase();
  if (!raw || raw === "*") return null;
  const segments = raw.split(",").map((segment) => segment.trim()).filter(Boolean);
  const weekdays = [];
  segments.forEach((segment) => {
    const rangeMatch = segment.match(/^(\d{1,2})-(\d{1,2})$/);
    if (rangeMatch) {
      const start = normalizeCronWeekday(parseCronNumeric(rangeMatch[1]));
      const end = normalizeCronWeekday(parseCronNumeric(rangeMatch[2]));
      if (start == null || end == null) return;
      if (start <= end) {
        for (let value = start; value <= end; value += 1) weekdays.push(value);
      } else {
        for (let value = start; value <= 6; value += 1) weekdays.push(value);
        for (let value = 0; value <= end; value += 1) weekdays.push(value);
      }
      return;
    }
    const single = normalizeCronWeekday(parseCronNumeric(segment));
    if (single != null) weekdays.push(single);
  });
  if (weekdays.length === 0) return null;
  return Math.min(...weekdays);
};
const parseCronWeekdayValues = (field = "") => {
  const raw = String(field || "").trim().toLowerCase();
  if (!raw || raw === "*") return [];
  const segments = raw.split(",").map((segment) => segment.trim()).filter(Boolean);
  const weekdays = new Set();
  segments.forEach((segment) => {
    const rangeMatch = segment.match(/^(\d{1,2})-(\d{1,2})$/);
    if (rangeMatch) {
      const start = normalizeCronWeekday(parseCronNumeric(rangeMatch[1]));
      const end = normalizeCronWeekday(parseCronNumeric(rangeMatch[2]));
      if (start == null || end == null) return;
      if (start <= end) {
        for (let value = start; value <= end; value += 1) weekdays.add(value);
      } else {
        for (let value = start; value <= 6; value += 1) weekdays.add(value);
        for (let value = 0; value <= end; value += 1) weekdays.add(value);
      }
      return;
    }
    const single = normalizeCronWeekday(parseCronNumeric(segment));
    if (single != null) weekdays.add(single);
  });
  return [...weekdays].sort((left, right) => left - right);
};
const isWeekdaysOnlyField = (field = "") => {
  const weekdayValues = parseCronWeekdayValues(field);
  if (weekdayValues.length !== 5) return false;
  return weekdayValues.join(",") === "1,2,3,4,5";
};

const parseCronMinuteOfDay = ({ minuteField = "", hourField = "" }) => {
  const minute = parseCronNumeric(minuteField);
  const hour = parseCronNumeric(hourField);
  if (minute == null || hour == null) return null;
  if (minute < 0 || minute > 59 || hour < 0 || hour > 23) return null;
  return hour * kMinutesPerHour + minute;
};

const parseCronFields = (schedule = {}) => {
  const cronExpr = String(
    schedule?.expr || schedule?.cron || schedule?.cronExpr || "",
  ).trim();
  const cronFields = cronExpr.split(/\s+/);
  if (cronFields.length < 5) return null;
  const [minuteField, hourField, dayOfMonthField, monthField, dayOfWeekField] = cronFields;
  return {
    minuteField,
    hourField,
    dayOfMonthField,
    monthField,
    dayOfWeekField,
  };
};

const getInternalSortMeta = (job = {}, groupKey = "other") => {
  const schedule = job?.schedule || {};
  const scheduleKind = String(schedule?.kind || "").trim().toLowerCase();
  const cronFields = parseCronFields(schedule);
  const minuteOfDay = cronFields
    ? parseCronMinuteOfDay({
        minuteField: cronFields.minuteField,
        hourField: cronFields.hourField,
      })
    : null;
  const nameKey = String(job?.name || job?.id || "").toLowerCase();
  if (groupKey === "daily") {
    if (scheduleKind === "every") {
      const everyMs = Number(schedule?.everyMs || Number.MAX_SAFE_INTEGER);
      return {
        groupRank: 0,
        primary: Number.isFinite(everyMs) ? everyMs : Number.MAX_SAFE_INTEGER,
        secondary: nameKey,
      };
    }
    if (
      cronFields &&
      cronFields.dayOfMonthField === "*" &&
      cronFields.monthField === "*" &&
      cronFields.dayOfWeekField === "*" &&
      minuteOfDay != null
    ) {
      return {
        groupRank: 1,
        primary: minuteOfDay,
        secondary: nameKey,
      };
    }
    if (
      cronFields &&
      cronFields.dayOfMonthField === "*" &&
      cronFields.monthField === "*" &&
      isWeekdaysOnlyField(cronFields.dayOfWeekField) &&
      minuteOfDay != null
    ) {
      return {
        groupRank: 2,
        primary: minuteOfDay,
        secondary: nameKey,
      };
    }
  }
  if (groupKey === "weekly" && cronFields) {
    const weekday = parseCronWeekdayField(cronFields.dayOfWeekField);
    return {
      groupRank: 0,
      primary: weekday == null ? Number.MAX_SAFE_INTEGER : weekday,
      secondary: minuteOfDay == null ? Number.MAX_SAFE_INTEGER : minuteOfDay,
      tertiary: nameKey,
    };
  }
  if (groupKey === "monthly" && cronFields) {
    const dayOfMonth = parseCronNumeric(cronFields.dayOfMonthField);
    return {
      groupRank: 0,
      primary: dayOfMonth == null ? Number.MAX_SAFE_INTEGER : dayOfMonth,
      secondary: minuteOfDay == null ? Number.MAX_SAFE_INTEGER : minuteOfDay,
      tertiary: nameKey,
    };
  }
  return {
    groupRank: 99,
    primary: Number.MAX_SAFE_INTEGER,
    secondary: Number.MAX_SAFE_INTEGER,
    tertiary: nameKey,
  };
};

const compareSortable = (left, right) => {
  if (left === right) return 0;
  return left > right ? 1 : -1;
};

const sortGroupItems = (items = [], groupKey = "other") =>
  [...items].sort((leftJob, rightJob) => {
    const leftMeta = getInternalSortMeta(leftJob, groupKey);
    const rightMeta = getInternalSortMeta(rightJob, groupKey);
    const rankResult = compareSortable(leftMeta.groupRank, rightMeta.groupRank);
    if (rankResult !== 0) return rankResult;
    const primaryResult = compareSortable(leftMeta.primary, rightMeta.primary);
    if (primaryResult !== 0) return primaryResult;
    const secondaryResult = compareSortable(leftMeta.secondary, rightMeta.secondary);
    if (secondaryResult !== 0) return secondaryResult;
    return compareSortable(leftMeta.tertiary, rightMeta.tertiary);
  });

const getScheduleGroupKey = (schedule = {}) => {
  const kind = String(schedule?.kind || "").trim().toLowerCase();
  if (kind === "every") {
    const everyMs = Number(schedule?.everyMs || 0);
    if (Number.isFinite(everyMs) && everyMs > 0) {
      if (everyMs <= 24 * 60 * 60 * 1000) return "daily";
      if (everyMs <= 7 * 24 * 60 * 60 * 1000) return "weekly";
      if (everyMs <= 31 * 24 * 60 * 60 * 1000) return "monthly";
    }
    return "other";
  }
  const cronExpr = String(
    schedule?.expr || schedule?.cron || schedule?.cronExpr || "",
  ).trim();
  const cronFields = cronExpr.split(/\s+/);
  if (cronFields.length >= 5) {
    const [, , dayOfMonthField, monthField, dayOfWeekField] = cronFields;
    if (
      dayOfMonthField === "*" &&
      monthField === "*" &&
      dayOfWeekField === "*"
    ) {
      return "daily";
    }
    if (
      dayOfMonthField === "*" &&
      monthField === "*" &&
      dayOfWeekField !== "*"
    ) {
      if (isWeekdaysOnlyField(dayOfWeekField)) return "daily";
      return "weekly";
    }
    if (dayOfMonthField !== "*" && monthField === "*") {
      return "monthly";
    }
  }
  return "other";
};

export const CronJobList = ({
  jobs = [],
  selectedRouteKey = kAllCronJobsRouteKey,
  onSelectAllJobs = () => {},
  onSelectJob = () => {},
}) => {
  const searchInputRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState("");
  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      searchInputRef.current?.focus();
    });
    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, []);
  const normalizedQuery = String(searchQuery || "").trim().toLowerCase();
  const filteredJobs = useMemo(() => {
    if (!normalizedQuery) return jobs;
    return jobs.filter((job) => {
      const name = String(job?.name || "").toLowerCase();
      const id = String(job?.id || "").toLowerCase();
      return name.includes(normalizedQuery) || id.includes(normalizedQuery);
    });
  }, [jobs, normalizedQuery]);
  const groupedJobs = useMemo(() => {
    const groups = {
      daily: [],
      weekly: [],
      monthly: [],
      other: [],
    };
    filteredJobs.forEach((job) => {
      const groupKey = getScheduleGroupKey(job?.schedule);
      if (!groups[groupKey]) groups.other.push(job);
      else groups[groupKey].push(job);
    });
    return {
      daily: sortGroupItems(groups.daily, "daily"),
      weekly: sortGroupItems(groups.weekly, "weekly"),
      monthly: sortGroupItems(groups.monthly, "monthly"),
      other: sortGroupItems(groups.other, "other"),
    };
  }, [filteredJobs]);

  return html`
    <div class="cron-list-panel-inner">
      <div class="cron-list-sticky-search">
        <input
          ref=${searchInputRef}
          type="text"
          value=${searchQuery}
          placeholder="Search cron jobs..."
          class="cron-list-search-input"
          onInput=${(event) => setSearchQuery(event.target.value)}
        />
      </div>
      <button
        type="button"
        class=${`cron-list-item cron-list-all ${selectedRouteKey === kAllCronJobsRouteKey ? "is-selected" : ""}`}
        onclick=${onSelectAllJobs}
      >
        <span class="cron-list-item-title">All Jobs</span>
        <span class="cron-list-item-subtitle">${jobs.length} total</span>
      </button>

      <div class="cron-list-items">
        ${kGroupOrder.map((groupKey) => {
          const groupItems = groupedJobs[groupKey] || [];
          if (groupItems.length === 0) return null;
          return html`
            <div key=${groupKey} class="cron-list-group">
              <div class="cron-list-group-header">${kGroupLabelByKey[groupKey] || "Other"}</div>
              <div class="cron-list-group-items">
                ${groupItems.map((job) => {
                  const health = getCronJobHealth(job);
                  const selected = selectedRouteKey === String(job.id || "");
                  return html`
                    <button
                      key=${job.id}
                      type="button"
                      class=${`cron-list-item ${selected ? "is-selected" : ""}`}
                      onclick=${() => onSelectJob(job.id)}
                    >
                      <span class="cron-list-item-row">
                        <span class="cron-list-item-title truncate">${job.name || job.id}</span>
                        <span class="cron-list-status-inline">
                          <span class="cron-list-last-run">
                            ${formatRelativeCompact(job?.state?.lastRunAtMs)}
                          </span>
                          <span
                            class=${`cron-list-health-dot ${getCronJobHealthClassName(health)}`}
                            title=${health}
                          ></span>
                        </span>
                      </span>
                      <span class="cron-list-item-subtitle">
                        ${formatCronScheduleLabel(job.schedule, {
                          includeTimeZoneWhenDifferent: true,
                        })}
                      </span>
                    </button>
                  `;
                })}
              </div>
            </div>
          `;
        })}
      </div>
      ${filteredJobs.length === 0
        ? html`
            <div class="text-xs text-gray-500 px-1 py-2">No cron jobs match your search.</div>
          `
        : null}
    </div>
  `;
};
