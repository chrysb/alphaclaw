import { h } from "https://esm.sh/preact";
import { useEffect, useMemo, useState } from "https://esm.sh/preact/hooks";
import htm from "https://esm.sh/htm";
import { Tooltip } from "../tooltip.js";
import { formatCost, formatTokenCount } from "./cron-helpers.js";
import { formatCronScheduleLabel } from "./cron-helpers.js";
import {
  buildTokenTierByJobId,
  classifyRepeatingJobs,
  expandJobsToRollingSlots,
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

const buildCellKey = (dayKey, hourOfDay) => `${String(dayKey || "")}:${hourOfDay}`;
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
  if (mappedStatus === "error") return `${tierClassName} cron-calendar-slot-error`;
  if (mappedStatus === "skipped") return `${tierClassName} cron-calendar-slot-skipped`;
  return `${tierClassName} cron-calendar-slot-past`;
};

const renderLegend = () => html`
  <div class="cron-calendar-legend">
    <span class="cron-calendar-legend-label">Token intensity</span>
    <span class="cron-calendar-legend-pill cron-calendar-slot-tier-unknown">No usage</span>
    <span class="cron-calendar-legend-pill cron-calendar-slot-tier-low">Low</span>
    <span class="cron-calendar-legend-pill cron-calendar-slot-tier-medium">Medium</span>
    <span class="cron-calendar-legend-pill cron-calendar-slot-tier-high">High</span>
    <span class="cron-calendar-legend-pill cron-calendar-slot-tier-very-high">Very high</span>
  </div>
`;

const kNowRefreshMs = 60 * 1000;

const buildJobTooltipText = ({
  jobName = "",
  job = null,
  usage = {},
  latestRun = null,
  scheduledAtMs = 0,
  scheduledStatus = "",
} = {}) => {
  const runCount = Number(usage?.runCount || 0);
  const totalTokens = Number(usage?.totalTokens || 0);
  const totalCost = Number(usage?.totalCost || 0);
  const avgTokensPerRun = runCount > 0
    ? Number(usage?.avgTokensPerRun || Math.round(totalTokens / runCount))
    : 0;
  const avgCostPerRun = runCount > 0 ? totalCost / runCount : 0;

  const lines = [
    String(jobName || "Job"),
    `Avg tokens/run: ${runCount > 0 ? formatTokenCount(avgTokensPerRun) : "—"}`,
    `Avg cost/run: ${runCount > 0 ? formatCost(avgCostPerRun) : "—"}`,
    `Total cost: ${formatCost(totalCost)}`,
  ];

  if (runCount <= 0) {
    lines.push("Runs: none yet");
  } else {
    lines.push(`Runs: ${formatTokenCount(runCount)}`);
  }

  if (latestRun?.status) {
    lines.push(
      `Latest run: ${latestRun.status} (${new Date(Number(latestRun.ts || 0)).toLocaleString()})`,
    );
  } else {
    lines.push("Latest run: none");
  }
  if (Number(job?.state?.runningAtMs || 0) > 0) {
    lines.push(`Current run: active (${new Date(Number(job.state.runningAtMs)).toLocaleString()})`);
  }

  if (scheduledAtMs > 0) {
    const slotLabel = new Date(scheduledAtMs).toLocaleString();
    const slotState = scheduledStatus || (scheduledAtMs <= Date.now() ? "past" : "upcoming");
    lines.push(`Slot: ${slotState} (${slotLabel})`);
  }
  return lines.join("\n");
};

export const CronCalendar = ({
  jobs = [],
  usageByJobId = {},
  runsByJobId = {},
  onSelectJob = () => {},
}) => {
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
  const { repeatingJobs, scheduledJobs } = useMemo(
    () => classifyRepeatingJobs(jobs),
    [jobs],
  );
  const timeline = useMemo(
    () => expandJobsToRollingSlots({ jobs: scheduledJobs, nowMs }),
    [scheduledJobs, nowMs],
  );
  const statusBySlotKey = useMemo(
    () => mapRunStatusesToSlots({ slots: timeline.slots, bulkRunsByJobId: runsByJobId, nowMs }),
    [timeline.slots, runsByJobId, nowMs],
  );
  const tokenTierByJobId = useMemo(
    () => buildTokenTierByJobId({ jobs, usageByJobId }),
    [jobs, usageByJobId],
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
      Object.entries(runsByJobId || {}).reduce((accumulator, [jobId, runResult]) => {
        const entries = Array.isArray(runResult?.entries) ? runResult.entries : [];
        const latest = entries
          .filter((entry) => Number(entry?.ts || 0) > 0)
          .sort((left, right) => Number(right?.ts || 0) - Number(left?.ts || 0))[0];
        accumulator[jobId] = latest || null;
        return accumulator;
      }, {}),
    [runsByJobId],
  );

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

  return html`
    <section class="bg-surface border border-border rounded-xl p-4 space-y-3">
      <div class="flex items-center justify-between gap-2">
        <h3 class="card-label cron-calendar-title">Rolling 7-Day Schedule</h3>
        <${renderLegend} />
      </div>

      ${hourRows.length === 0
        ? html`<div class="text-sm text-gray-500">No scheduled jobs in this rolling window.</div>`
        : html`
            <div class="cron-calendar-grid-wrap">
              <div class="cron-calendar-grid-header">
                <div class="cron-calendar-hour-cell"></div>
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
                ${hourRows.map((hourOfDay) => html`
                  <div key=${hourOfDay} class="cron-calendar-grid-row">
                    <div class="cron-calendar-hour-cell">${formatHourLabel(hourOfDay)}</div>
                    ${timeline.days.map((day) => {
                      const cellKey = buildCellKey(day.dayKey, hourOfDay);
                      const cellSlots = slotsByCellKey[cellKey] || [];
                      const visibleSlots = cellSlots.slice(0, 3);
                      const overflowCount = Math.max(0, cellSlots.length - visibleSlots.length);
                      return html`
                        <div
                          key=${cellKey}
                          class=${`cron-calendar-grid-cell ${day.dayKey === todayDayKey ? "is-today" : ""}`}
                        >
                          ${visibleSlots.map((slot) => {
                            const status = statusBySlotKey[slot.key] || "";
                            const isPast = slot.scheduledAtMs <= nowMs;
                            const tokenTier = tokenTierByJobId[slot.jobId] || "unknown";
                            const usage = usageByJobId[slot.jobId] || {};
                            const tooltipText = buildJobTooltipText({
                              jobName: slot.jobName,
                              job: jobById[slot.jobId] || null,
                              usage,
                              latestRun: latestRunByJobId[slot.jobId],
                              scheduledAtMs: slot.scheduledAtMs,
                              scheduledStatus: status,
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
                                  class=${`cron-calendar-slot-chip ${slotStateClassName({
                                    isPast,
                                    mappedStatus: status,
                                    tokenTier,
                                  })}`}
                                  role="button"
                                  tabindex="0"
                                  onClick=${() => onSelectJob(slot.jobId)}
                                  onKeyDown=${(event) => {
                                    if (event.key !== "Enter" && event.key !== " ") return;
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
                            ? html`<div class="cron-calendar-slot-overflow">+${overflowCount} more</div>`
                            : null}
                        </div>
                      `;
                    })}
                  </div>
                `)}
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
                  const usage = usageByJobId[jobId] || {};
                  const avgTokensPerRun = Number(usage?.avgTokensPerRun || 0);
                  const tooltipText = buildJobTooltipText({
                    jobName: job.name || job.id,
                    job,
                    usage,
                    latestRun: latestRunByJobId[jobId],
                  });
                  return html`
                    <${Tooltip}
                      text=${tooltipText}
                      widthClass="w-72"
                      tooltipClassName="whitespace-pre-line"
                      triggerClassName="inline-flex max-w-full"
                    >
                      <div
                        class=${`cron-calendar-repeating-pill ${slotStateClassName({
                          isPast: false,
                          mappedStatus: "",
                          tokenTier: tokenTierByJobId[jobId] || "unknown",
                        })}`}
                        role="button"
                        tabindex="0"
                        onClick=${() => onSelectJob(jobId)}
                        onKeyDown=${(event) => {
                          if (event.key !== "Enter" && event.key !== " ") return;
                          event.preventDefault();
                          onSelectJob(jobId);
                        }}
                      >
                        <span class="truncate">${job.name || job.id}</span>
                        <span class="text-[10px] opacity-80">
                          ${formatCronScheduleLabel(job.schedule, {
                            includeTimeZoneWhenDifferent: true,
                          })}
                          ${avgTokensPerRun > 0
                            ? ` | avg ${formatTokenCount(avgTokensPerRun)} tk`
                            : ""}
                        </span>
                      </div>
                    </${Tooltip}>
                  `;
                })}
              </div>
            </div>
          `
        : null}
    </section>
  `;
};
