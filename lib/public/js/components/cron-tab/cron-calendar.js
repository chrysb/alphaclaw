import { h } from "https://esm.sh/preact";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "https://esm.sh/preact/hooks";
import htm from "https://esm.sh/htm";
import { Tooltip } from "../tooltip.js";
import { ModalShell } from "../modal-shell.js";
import { CloseIcon } from "../icons.js";
import {
  formatCost,
  formatCronScheduleLabel,
  formatTokenCount,
  getCronRunEstimatedCost,
  getCronRunTotalTokens,
} from "./cron-helpers.js";
import {
  classifyRepeatingJobs,
  expandJobsToRollingSlots,
  getUpcomingSlots,
  mapRunStatusesToSlots,
} from "./cron-calendar-helpers.js";

const html = htm.bind(h);

const formatHourLabel = (hourOfDay) => {
  const dateValue = new Date();
  dateValue.setHours(hourOfDay, 0, 0, 0);
  return dateValue.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
};

const buildCellKey = (dayKey, hourOfDay) =>
  `${String(dayKey || "")}:${hourOfDay}`;
const toLocalDayKey = (valueMs) => {
  const dateValue = new Date(valueMs);
  const year = dateValue.getFullYear();
  const month = String(dateValue.getMonth() + 1).padStart(2, "0");
  const day = String(dateValue.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const slotStateClassName = ({
  isPast = false,
  mappedStatus = "",
  tokenTier = "low",
} = {}) => {
  const tierClassNameByKey = {
    unknown: "cron-calendar-slot-tier-unknown",
    low: "cron-calendar-slot-tier-low",
    medium: "cron-calendar-slot-tier-medium",
    high: "cron-calendar-slot-tier-high",
    "very-high": "cron-calendar-slot-tier-very-high",
    disabled: "cron-calendar-slot-tier-disabled",
  };
  const tierClassName = tierClassNameByKey[tokenTier] || tierClassNameByKey.low;
  if (!isPast) return `${tierClassName} cron-calendar-slot-upcoming`;
  if (mappedStatus === "ok") return `${tierClassName} cron-calendar-slot-ok`;
  if (mappedStatus === "error")
    return `${tierClassName} cron-calendar-slot-error`;
  if (mappedStatus === "skipped")
    return `${tierClassName} cron-calendar-slot-skipped`;
  return `${tierClassName} cron-calendar-slot-past`;
};

const renderLegend = () => html`
  <div class="cron-calendar-legend">
    <span class="cron-calendar-legend-label">Token intensity</span>
    <span class="cron-calendar-legend-pill cron-calendar-slot-tier-low"
      >Low</span
    >
    <span class="cron-calendar-legend-pill cron-calendar-slot-tier-medium"
      >Medium</span
    >
    <span class="cron-calendar-legend-pill cron-calendar-slot-tier-high"
      >High</span
    >
    <span class="cron-calendar-legend-pill cron-calendar-slot-tier-very-high"
      >Very high</span
    >
  </div>
`;

const kNowRefreshMs = 60 * 1000;
const kRunWindow7dMs = 7 * 24 * 60 * 60 * 1000;
const kSlotRunToleranceMs = 45 * 60 * 1000;
const kUnknownTier = "unknown";

const formatUpcomingTime = (timestampMs) => {
  const dateValue = new Date(timestampMs);
  return dateValue.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
};

const buildRunSummaryByJobId = ({
  runsByJobId = {},
  nowMs = Date.now(),
} = {}) => {
  const cutoffMs = Number(nowMs || Date.now()) - kRunWindow7dMs;
  return Object.entries(runsByJobId || {}).reduce(
    (accumulator, [jobId, runResult]) => {
      const entries = Array.isArray(runResult?.entries)
        ? runResult.entries
        : [];
      const recentEntries = entries.filter((entry) => {
        const timestampMs = Number(entry?.ts || 0);
        return (
          Number.isFinite(timestampMs) &&
          timestampMs >= cutoffMs &&
          timestampMs <= nowMs
        );
      });
      const runCount = recentEntries.length;
      const totalTokens = recentEntries.reduce(
        (sum, entry) => sum + Number(getCronRunTotalTokens(entry) || 0),
        0,
      );
      const totalCost = recentEntries.reduce((sum, entry) => {
        const cost = getCronRunEstimatedCost(entry);
        return sum + Number(cost == null ? 0 : cost);
      }, 0);
      accumulator[String(jobId || "")] = {
        runCount,
        totalTokens,
        totalCost,
        avgTokensPerRun: runCount > 0 ? Math.round(totalTokens / runCount) : 0,
        avgCostPerRun: runCount > 0 ? totalCost / runCount : 0,
      };
      return accumulator;
    },
    {},
  );
};

const mapRunsToSlots = ({
  slots = [],
  runsByJobId = {},
  nowMs = Date.now(),
} = {}) => {
  const runsBySlotKey = {};
  const consumedRunTimestampsByJobId = {};
  const runEntriesByJobId = Object.entries(runsByJobId || {}).reduce(
    (accumulator, [jobId, runResult]) => {
      const entries = Array.isArray(runResult?.entries)
        ? runResult.entries
        : [];
      const normalizedEntries = entries
        .map((entry) => ({ ...entry, ts: Number(entry?.ts || 0) }))
        .filter((entry) => Number.isFinite(entry.ts) && entry.ts > 0)
        .sort((left, right) => left.ts - right.ts);
      accumulator[String(jobId || "")] = normalizedEntries;
      return accumulator;
    },
    {},
  );
  slots.forEach((slot) => {
    if (Number(slot?.scheduledAtMs || 0) > nowMs) return;
    const jobId = String(slot?.jobId || "");
    const runEntries = runEntriesByJobId[jobId] || [];
    if (runEntries.length === 0) return;
    const consumedSet = consumedRunTimestampsByJobId[jobId] || new Set();
    consumedRunTimestampsByJobId[jobId] = consumedSet;
    let nearestEntry = null;
    let nearestDeltaMs = Number.MAX_SAFE_INTEGER;
    runEntries.forEach((entry) => {
      if (consumedSet.has(entry.ts)) return;
      const deltaMs = Math.abs(entry.ts - Number(slot?.scheduledAtMs || 0));
      if (deltaMs > kSlotRunToleranceMs) return;
      if (deltaMs < nearestDeltaMs) {
        nearestDeltaMs = deltaMs;
        nearestEntry = entry;
      }
    });
    if (!nearestEntry) return;
    consumedSet.add(nearestEntry.ts);
    runsBySlotKey[String(slot?.key || "")] = nearestEntry;
  });
  return runsBySlotKey;
};

const buildTierThresholds = (values = []) => {
  const sortedValues = values
    .map((value) => Number(value || 0))
    .filter((value) => Number.isFinite(value) && value > 0)
    .sort((left, right) => left - right);
  if (sortedValues.length === 0) return null;
  const percentileAt = (indexRatio = 0) => {
    const index = Math.min(
      sortedValues.length - 1,
      Math.floor((sortedValues.length - 1) * indexRatio),
    );
    return sortedValues[Math.max(0, index)];
  };
  return {
    q1: percentileAt(0.25),
    q2: percentileAt(0.5),
    p90: percentileAt(0.9),
  };
};

const classifyTokenTier = ({
  enabled = true,
  tokenValue = 0,
  thresholds = null,
} = {}) => {
  if (!enabled) return "disabled";
  const safeValue = Number(tokenValue || 0);
  if (!Number.isFinite(safeValue) || safeValue <= 0 || !thresholds)
    return kUnknownTier;
  if (safeValue <= thresholds.q1) return "low";
  if (safeValue <= thresholds.q2) return "medium";
  if (safeValue <= thresholds.p90) return "high";
  return "very-high";
};

const buildJobTooltipText = ({
  jobName = "",
  job = null,
  runSummary7d = {},
  slotRun = null,
  latestRun = null,
  scheduledAtMs = 0,
  scheduledStatus = "",
  nowMs = Date.now(),
} = {}) => {
  const isPastSlot =
    Number(scheduledAtMs || 0) > 0 && Number(scheduledAtMs || 0) <= nowMs;
  const runCount7d = Number(runSummary7d?.runCount || 0);
  const avgTokensPerRun7d = Number(runSummary7d?.avgTokensPerRun || 0);
  const avgCostPerRun7d = Number(runSummary7d?.avgCostPerRun || 0);
  const slotRunTokens = getCronRunTotalTokens(slotRun || {});
  const slotRunCost = getCronRunEstimatedCost(slotRun || {});
  const slotRunStatus = String(slotRun?.status || "")
    .trim()
    .toLowerCase();

  const lines = [String(jobName || "Job")];
  if (isPastSlot) {
    lines.push(
      `Run tokens: ${slotRun ? formatTokenCount(slotRunTokens) : "—"}`,
    );
    lines.push(
      `Run cost: ${slotRunCost == null ? "—" : formatCost(slotRunCost)}`,
    );
    lines.push(`Run status: ${slotRunStatus || scheduledStatus || "unknown"}`);
    if (slotRun?.ts) {
      lines.push(
        `Run time: ${new Date(Number(slotRun.ts || 0)).toLocaleString()}`,
      );
    }
  } else {
    lines.push(
      `Avg tokens/run (last 7d): ${runCount7d > 0 ? formatTokenCount(avgTokensPerRun7d) : "—"}`,
    );
    lines.push(
      `Avg cost/run (last 7d): ${runCount7d > 0 ? formatCost(avgCostPerRun7d) : "—"}`,
    );
    lines.push(
      `Runs (last 7d): ${runCount7d > 0 ? formatTokenCount(runCount7d) : "none"}`,
    );
  }

  if (!isPastSlot && latestRun?.status) {
    lines.push(
      `Latest run: ${latestRun.status} (${new Date(Number(latestRun.ts || 0)).toLocaleString()})`,
    );
  } else if (!isPastSlot) {
    lines.push("Latest run: none");
  }
  if (Number(job?.state?.runningAtMs || 0) > 0) {
    lines.push(
      `Current run: active (${new Date(Number(job.state.runningAtMs)).toLocaleString()})`,
    );
  }

  if (scheduledAtMs > 0) {
    const slotLabel = new Date(scheduledAtMs).toLocaleString();
    const slotState =
      scheduledStatus || (scheduledAtMs <= Date.now() ? "past" : "upcoming");
    lines.push(`Slot: ${slotState} (${slotLabel})`);
  }
  return lines.join("\n");
};

export const CronCalendar = ({
  jobs = [],
  runsByJobId = {},
  onSelectJob = () => {},
}) => {
  const [calendarLightboxOpen, setCalendarLightboxOpen] = useState(false);
  const [showNoisyUpcoming, setShowNoisyUpcoming] = useState(false);

  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNowMs(Date.now());
    }, kNowRefreshMs);
    return () => {
      window.clearInterval(intervalId);
    };
  }, []);
  const todayDayKey = toLocalDayKey(nowMs);
  const nowDateValue = useMemo(() => new Date(nowMs), [nowMs]);
  const currentHourOfDay = nowDateValue.getHours();
  const currentMinuteProgress = nowDateValue.getMinutes() / 60;
  const { repeatingJobs, scheduledJobs } = useMemo(
    () => classifyRepeatingJobs(jobs),
    [jobs],
  );
  const timeline = useMemo(
    () => expandJobsToRollingSlots({ jobs: scheduledJobs, nowMs }),
    [scheduledJobs, nowMs],
  );
  const statusBySlotKey = useMemo(
    () =>
      mapRunStatusesToSlots({
        slots: timeline.slots,
        bulkRunsByJobId: runsByJobId,
        nowMs,
      }),
    [timeline.slots, runsByJobId, nowMs],
  );
  const jobById = useMemo(
    () =>
      jobs.reduce((accumulator, job) => {
        const jobId = String(job?.id || "");
        if (jobId) accumulator[jobId] = job;
        return accumulator;
      }, {}),
    [jobs],
  );
  const latestRunByJobId = useMemo(
    () =>
      Object.entries(runsByJobId || {}).reduce(
        (accumulator, [jobId, runResult]) => {
          const entries = Array.isArray(runResult?.entries)
            ? runResult.entries
            : [];
          const latest = entries
            .filter((entry) => Number(entry?.ts || 0) > 0)
            .sort(
              (left, right) => Number(right?.ts || 0) - Number(left?.ts || 0),
            )[0];
          accumulator[jobId] = latest || null;
          return accumulator;
        },
        {},
      ),
    [runsByJobId],
  );
  const runSummary7dByJobId = useMemo(
    () => buildRunSummaryByJobId({ runsByJobId, nowMs }),
    [runsByJobId, nowMs],
  );
  const runBySlotKey = useMemo(
    () => mapRunsToSlots({ slots: timeline.slots, runsByJobId, nowMs }),
    [timeline.slots, runsByJobId, nowMs],
  );
  const slotTierThresholds = useMemo(() => {
    const values = [];
    timeline.slots.forEach((slot) => {
      const job = jobById[slot.jobId] || null;
      if (!job || job.enabled === false) return;
      const isPastSlot = Number(slot?.scheduledAtMs || 0) <= nowMs;
      if (isPastSlot) {
        const slotRunTokens = getCronRunTotalTokens(runBySlotKey[slot.key] || {});
        if (slotRunTokens > 0) values.push(slotRunTokens);
        return;
      }
      const projectedAvgTokens = Number(
        runSummary7dByJobId[slot.jobId]?.avgTokensPerRun || 0,
      );
      if (projectedAvgTokens > 0) values.push(projectedAvgTokens);
    });
    repeatingJobs.forEach((job) => {
      const jobId = String(job?.id || "");
      const projectedAvgTokens = Number(
        runSummary7dByJobId[jobId]?.avgTokensPerRun || 0,
      );
      if (projectedAvgTokens > 0) values.push(projectedAvgTokens);
    });
    return buildTierThresholds(values);
  }, [
    jobById,
    nowMs,
    repeatingJobs,
    runBySlotKey,
    runSummary7dByJobId,
    timeline.slots,
  ]);
  const getSlotTokenTier = useCallback(
    (slot = null) => {
      const jobId = String(slot?.jobId || "");
      const job = jobById[jobId] || null;
      const enabled = job?.enabled !== false;
      const isPastSlot = Number(slot?.scheduledAtMs || 0) <= nowMs;
      if (isPastSlot) {
        const slotRunTokens = getCronRunTotalTokens(
          runBySlotKey[String(slot?.key || "")] || {},
        );
        return classifyTokenTier({
          enabled,
          tokenValue: slotRunTokens,
          thresholds: slotTierThresholds,
        });
      }
      const projectedAvgTokens = Number(
        runSummary7dByJobId[jobId]?.avgTokensPerRun || 0,
      );
      return classifyTokenTier({
        enabled,
        tokenValue: projectedAvgTokens,
        thresholds: slotTierThresholds,
      });
    },
    [jobById, nowMs, runBySlotKey, runSummary7dByJobId, slotTierThresholds],
  );
  const getJobProjectedTier = useCallback(
    (jobId = "") => {
      const job = jobById[jobId] || null;
      return classifyTokenTier({
        enabled: job?.enabled !== false,
        tokenValue: Number(runSummary7dByJobId[jobId]?.avgTokensPerRun || 0),
        thresholds: slotTierThresholds,
      });
    },
    [jobById, runSummary7dByJobId, slotTierThresholds],
  );

  const upcomingSlotsPreview = useMemo(
    () => getUpcomingSlots({ slots: timeline.slots, nowMs, limit: 3 }),
    [timeline.slots, nowMs],
  );
  const noisyUpcomingItems = useMemo(() => {
    const windowEndMs = nowMs + 24 * 60 * 60 * 1000;
    return repeatingJobs
      .map((job) => {
        const jobId = String(job?.id || "");
        const nextRunAtMs = Number(job?.state?.nextRunAtMs || 0);
        if (!jobId || !Number.isFinite(nextRunAtMs) || nextRunAtMs <= nowMs) return null;
        if (nextRunAtMs > windowEndMs) return null;
        return {
          key: `noisy:${jobId}:${nextRunAtMs}`,
          jobId,
          jobName: String(job?.name || jobId),
          scheduledAtMs: nextRunAtMs,
        };
      })
      .filter(Boolean)
      .sort((left, right) => left.scheduledAtMs - right.scheduledAtMs);
  }, [repeatingJobs, nowMs]);
  const displayedUpcomingItems = useMemo(() => {
    if (!showNoisyUpcoming) return upcomingSlotsPreview;
    return [...upcomingSlotsPreview, ...noisyUpcomingItems].sort(
      (left, right) => Number(left?.scheduledAtMs || 0) - Number(right?.scheduledAtMs || 0),
    );
  }, [noisyUpcomingItems, showNoisyUpcoming, upcomingSlotsPreview]);

  const hourRows = useMemo(() => {
    const uniqueHours = new Set(timeline.slots.map((slot) => slot.hourOfDay));
    return [...uniqueHours].sort((left, right) => left - right);
  }, [timeline.slots]);

  const slotsByCellKey = useMemo(
    () =>
      timeline.slots.reduce((accumulator, slot) => {
        const cellKey = buildCellKey(slot.dayKey, slot.hourOfDay);
        const currentValue = accumulator[cellKey] || [];
        currentValue.push(slot);
        accumulator[cellKey] = currentValue;
        return accumulator;
      }, {}),
    [timeline.slots],
  );

  const renderCompactStrip = () => {
    return html`
      <div class="space-y-2">
        ${displayedUpcomingItems.length === 0
          ? html`<div class="text-xs text-gray-500 py-1">
              No upcoming jobs in the next 24 hours.
            </div>`
          : html`
              <div class="cron-calendar-compact-list">
                ${displayedUpcomingItems.map((slot) => {
                  const summary7d = runSummary7dByJobId[slot.jobId] || {};
                  const avgTokensPerRun = Number(summary7d?.avgTokensPerRun || 0);
                  const avgCostPerRun = Number(summary7d?.avgCostPerRun || 0);
                  const estimateLabel =
                    avgTokensPerRun > 0 || avgCostPerRun > 0
                      ? `Est. ${avgTokensPerRun > 0 ? `${formatTokenCount(avgTokensPerRun)} tk` : "— tk"} · ${avgCostPerRun > 0 ? formatCost(avgCostPerRun) : "—"}`
                      : "Est. —";
                  const tooltipText = buildJobTooltipText({
                    jobName: slot.jobName,
                    job: jobById[slot.jobId] || null,
                    runSummary7d: runSummary7dByJobId[slot.jobId] || {},
                    slotRun: runBySlotKey[slot.key] || null,
                    latestRun: latestRunByJobId[slot.jobId],
                    scheduledAtMs: slot.scheduledAtMs,
                    nowMs,
                  });
                  return html`
                    <${Tooltip}
                      text=${tooltipText}
                      widthClass="w-72"
                      tooltipClassName="whitespace-pre-line"
                      triggerClassName="block w-full"
                    >
                      <button
                        key=${slot.key}
                        type="button"
                        class=${`cron-calendar-compact-row ${slotStateClassName({
                          isPast: false,
                          mappedStatus: "",
                          tokenTier: getJobProjectedTier(slot.jobId),
                        })}`}
                        onClick=${() => onSelectJob(slot.jobId)}
                      >
                        <span class="cron-calendar-compact-main">
                          <span class="cron-calendar-compact-time"
                            >${formatUpcomingTime(slot.scheduledAtMs)}</span
                          >
                          <span class="cron-calendar-compact-name truncate"
                            >${slot.jobName}</span
                          >
                        </span>
                        <span class="cron-calendar-compact-estimate"
                          >${estimateLabel}</span
                        >
                      </button>
                    </${Tooltip}>
                  `;
                })}
              </div>
            `}
        <div class="flex items-center justify-between mt-2">
          ${
            noisyUpcomingItems.length > 0
              ? html`
                  <button
                    type="button"
                    class="ac-btn-ghost text-xs px-2.5 py-1 rounded-lg"
                    onClick=${() => setShowNoisyUpcoming((value) => !value)}
                  >
                    ${
                      showNoisyUpcoming
                        ? "Show fewer"
                        : `+${noisyUpcomingItems.length} noisy runs`
                    }
                  </button>
                `
              : html`<span></span>`
          }
          <${renderLegend} />
        </div>
      </div>
    `;
  };

  const renderFullGrid = () => html`
    <div class="space-y-3">
      ${hourRows.length === 0
        ? html`<div class="text-sm text-gray-500">
            No scheduled jobs in this rolling window.
          </div>`
        : html`
            <div class="cron-calendar-grid-wrap">
              <div class="cron-calendar-grid-header">
                <div class="cron-calendar-hour-cell cron-calendar-grid-corner"></div>
                ${timeline.days.map(
                  (day) => html`
                    <div
                      key=${day.dayKey}
                      class=${`cron-calendar-day-header ${day.dayKey === todayDayKey ? "is-today" : ""}`}
                    >
                      ${day.label}
                    </div>
                  `,
                )}
              </div>
              <div class="cron-calendar-grid-body">
                ${hourRows.map(
                  (hourOfDay) => html`
                    <div key=${hourOfDay} class="cron-calendar-grid-row">
                      <div class="cron-calendar-hour-cell">
                        ${formatHourLabel(hourOfDay)}
                      </div>
                      ${timeline.days.map((day) => {
                        const cellKey = buildCellKey(day.dayKey, hourOfDay);
                        const cellSlots = slotsByCellKey[cellKey] || [];
                        const visibleSlots = cellSlots.slice(0, 3);
                        const overflowCount = Math.max(
                          0,
                          cellSlots.length - visibleSlots.length,
                        );
                        return html`
                          <div
                            key=${cellKey}
                            class=${`cron-calendar-grid-cell ${day.dayKey === todayDayKey ? "is-today" : ""}`}
                          >
                            ${day.dayKey === todayDayKey &&
                            hourOfDay === currentHourOfDay
                              ? html`
                                  <div
                                    class="cron-calendar-now-indicator"
                                    style=${`top: ${Math.max(0, Math.min(100, currentMinuteProgress * 100))}%;`}
                                    aria-hidden="true"
                                  >
                                    <span class="cron-calendar-now-indicator-dot"></span>
                                  </div>
                                `
                              : null}
                            ${visibleSlots.map((slot) => {
                              const status = statusBySlotKey[slot.key] || "";
                              const isPast = slot.scheduledAtMs <= nowMs;
                              const tokenTier = getSlotTokenTier(slot);
                              const tooltipText = buildJobTooltipText({
                                jobName: slot.jobName,
                                job: jobById[slot.jobId] || null,
                                runSummary7d:
                                  runSummary7dByJobId[slot.jobId] || {},
                                slotRun: runBySlotKey[slot.key] || null,
                                latestRun: latestRunByJobId[slot.jobId],
                                scheduledAtMs: slot.scheduledAtMs,
                                scheduledStatus: status,
                                nowMs,
                              });
                              return html`
                              <${Tooltip}
                                text=${tooltipText}
                                widthClass="w-72"
                                tooltipClassName="whitespace-pre-line"
                                triggerClassName="inline-flex w-full"
                              >
                                <div
                                  key=${slot.key}
                                  class=${`cron-calendar-slot-chip ${slotStateClassName(
                                    {
                                      isPast,
                                      mappedStatus: status,
                                      tokenTier,
                                    },
                                  )}`}
                                  role="button"
                                  tabindex="0"
                                  onClick=${() => onSelectJob(slot.jobId)}
                                  onKeyDown=${(event) => {
                                    if (
                                      event.key !== "Enter" &&
                                      event.key !== " "
                                    )
                                      return;
                                    event.preventDefault();
                                    onSelectJob(slot.jobId);
                                  }}
                                >
                                  <span class="truncate">${slot.jobName}</span>
                                </div>
                              </${Tooltip}>
                            `;
                            })}
                            ${overflowCount > 0
                              ? html`<div class="cron-calendar-slot-overflow">
                                  +${overflowCount} more
                                </div>`
                              : null}
                          </div>
                        `;
                      })}
                    </div>
                  `,
                )}
              </div>
            </div>
          `}
      ${repeatingJobs.length > 0
        ? html`
            <div class="cron-calendar-repeating-strip">
              <div class="text-xs text-gray-500">Repeating</div>
              <div class="cron-calendar-repeating-list">
                ${repeatingJobs.map((job) => {
                  const jobId = String(job?.id || "");
                  const avgTokensPerRun = Number(
                    runSummary7dByJobId[jobId]?.avgTokensPerRun || 0,
                  );
                  const tooltipText = buildJobTooltipText({
                    jobName: job.name || job.id,
                    job,
                    runSummary7d: runSummary7dByJobId[jobId] || {},
                    slotRun: null,
                    latestRun: latestRunByJobId[jobId],
                    nowMs,
                  });
                  return html`
                    <${Tooltip}
                      text=${tooltipText}
                      widthClass="w-72"
                      tooltipClassName="whitespace-pre-line"
                      triggerClassName="inline-flex max-w-full"
                    >
                      <div
                        class=${`cron-calendar-repeating-pill ${slotStateClassName(
                          {
                            isPast: false,
                            mappedStatus: "",
                            tokenTier: getJobProjectedTier(jobId),
                          },
                        )}`}
                        role="button"
                        tabindex="0"
                        onClick=${() => onSelectJob(jobId)}
                        onKeyDown=${(event) => {
                          if (event.key !== "Enter" && event.key !== " ")
                            return;
                          event.preventDefault();
                          onSelectJob(jobId);
                        }}
                      >
                        <span class="truncate">${job.name || job.id}</span>
                        <span class="text-[10px] opacity-80">
                          ${formatCronScheduleLabel(job.schedule, {
                            includeTimeZoneWhenDifferent: true,
                          })}
                          ${
                            avgTokensPerRun > 0
                              ? ` | avg ${formatTokenCount(avgTokensPerRun)} tk`
                              : ""
                          }
                        </span>
                      </div>
                    </${Tooltip}>
                  `;
                })}
              </div>
            </div>
          `
        : null}
    </div>
  `;

  return html`
    <section class="bg-surface border border-border rounded-xl p-4 space-y-3">
      <div class="flex items-center justify-between gap-2">
        <h3 class="card-label card-label-bright">Up next</h3>
        <button
          type="button"
          class="ac-btn-secondary text-xs px-3 py-1.5 rounded-lg"
          onClick=${() => setCalendarLightboxOpen(true)}
        >
          Open calendar
        </button>
      </div>

      ${renderCompactStrip()}
    </section>
    <${ModalShell}
      visible=${calendarLightboxOpen}
      onClose=${() => setCalendarLightboxOpen(false)}
      panelClassName="cron-calendar-lightbox-panel"
    >
      <div class="flex items-center justify-between gap-2">
        <h3 class="card-label cron-calendar-title">Calendar</h3>
        <button
          type="button"
          class="cron-calendar-lightbox-close"
          onClick=${() => setCalendarLightboxOpen(false)}
          aria-label="Close expanded calendar"
        >
          <${CloseIcon} className="w-4 h-4" />
        </button>
      </div>
      <div class="flex items-center justify-center">
        <${renderLegend} />
      </div>
      <div class="cron-calendar-lightbox-body">
        ${renderFullGrid()}
      </div>
    </${ModalShell}>
  `;
};
