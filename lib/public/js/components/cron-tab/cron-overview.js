import { h } from "https://esm.sh/preact";
import { useEffect, useMemo, useState } from "https://esm.sh/preact/hooks";
import htm from "https://esm.sh/htm";
import {
  buildCronOptimizationWarnings,
  formatCost,
  formatRelativeMs,
  formatTokenCount,
  getNextScheduledRunAcrossJobs,
} from "./cron-helpers.js";
import { CronCalendar } from "./cron-calendar.js";
import { CronRunsTrendCard } from "./cron-runs-trend-card.js";
import { SegmentedControl } from "../segmented-control.js";
import { SummaryStatCard } from "../summary-stat-card.js";
import { ErrorWarningLineIcon } from "../icons.js";
import {
  formatDurationCompactMs,
  formatLocaleDateTimeWithTodayTime,
} from "../../lib/format.js";

const html = htm.bind(h);
const kRecentRunFetchLimit = 100;
const kRecentRunRowsLimit = 20;
const kRecentRunCollapseThreshold = 5;
const kTrendRange7d = "7d";
const kTrendRange30d = "30d";
const kTrendQueryStartKey = "trendStart";
const kTrendQueryEndKey = "trendEnd";
const kTrendQueryRangeKey = "trendRange";
const kTrendQueryLabelKey = "trendLabel";

const kRunStatusFilterOptions = [
  { label: "all", value: "all" },
  { label: "ok", value: "ok" },
  { label: "error", value: "error" },
  { label: "skipped", value: "skipped" },
];

const warningClassName = (tone) => {
  if (tone === "error") return "border-red-900 bg-red-950/30 text-red-200";
  if (tone === "warning")
    return "border-yellow-900 bg-yellow-950/30 text-yellow-100";
  return "border-border bg-black/20 text-gray-200";
};

const formatWarningsAttentionText = (warnings = []) => {
  const errorCount = warnings.filter(
    (warning) => warning?.tone === "error",
  ).length;
  const warningCount = warnings.filter(
    (warning) => warning?.tone === "warning",
  ).length;
  const totalCount = errorCount + warningCount;
  if (totalCount <= 0) return "No warnings currently need your attention";
  const parts = [];
  if (errorCount > 0)
    parts.push(`${errorCount} error${errorCount === 1 ? "" : "s"}`);
  if (warningCount > 0)
    parts.push(`${warningCount} warning${warningCount === 1 ? "" : "s"}`);
  return `${parts.join(" and ")} may need your attention`;
};

const runStatusClassName = (status = "") => {
  const normalized = String(status || "")
    .trim()
    .toLowerCase();
  if (normalized === "ok") return "text-green-300";
  if (normalized === "error") return "text-red-300";
  if (normalized === "skipped") return "text-yellow-300";
  return "text-gray-400";
};

const formatRecentRunTimestamp = (timestampMs) =>
  formatLocaleDateTimeWithTodayTime(timestampMs, {
    fallback: "—",
    valueIsEpochMs: true,
  }).replace(
    /\s([AP])M\b/g,
    (_, marker) => `${String(marker || "").toLowerCase()}m`,
  );

const getRunEstimatedCost = (runEntry = {}) => {
  const usage = runEntry?.usage || {};
  const candidates = [
    usage?.estimatedCost,
    usage?.estimated_cost,
    usage?.totalCost,
    usage?.total_cost,
    usage?.costUsd,
    usage?.cost,
    runEntry?.estimatedCost,
    runEntry?.estimated_cost,
    runEntry?.totalCost,
    runEntry?.total_cost,
    runEntry?.costUsd,
    runEntry?.cost,
  ];
  for (const candidate of candidates) {
    const numericValue = Number(candidate);
    if (Number.isFinite(numericValue) && numericValue >= 0) return numericValue;
  }
  return null;
};

const flattenRecentRuns = ({ bulkRunsByJobId = {}, jobs = [] } = {}) => {
  const jobNameById = jobs.reduce((accumulator, job) => {
    const jobId = String(job?.id || "");
    if (!jobId) return accumulator;
    accumulator[jobId] = String(job?.name || jobId);
    return accumulator;
  }, {});
  return Object.entries(bulkRunsByJobId || {})
    .flatMap(([jobId, runResult]) => {
      const entries = Array.isArray(runResult?.entries)
        ? runResult.entries
        : [];
      return entries.map((entry) => ({
        ...entry,
        jobId: String(jobId || ""),
        jobName: jobNameById[jobId] || String(jobId || ""),
      }));
    })
    .filter((entry) => Number(entry?.ts || 0) > 0)
    .sort((left, right) => Number(right?.ts || 0) - Number(left?.ts || 0))
    .slice(0, kRecentRunFetchLimit);
};

const buildCollapsedRunRows = (recentRuns = []) => {
  const rows = [];
  let index = 0;
  while (index < recentRuns.length && rows.length < kRecentRunRowsLimit) {
    const current = recentRuns[index];
    let streakEnd = index + 1;
    while (
      streakEnd < recentRuns.length &&
      String(recentRuns[streakEnd]?.jobId || "") ===
        String(current?.jobId || "")
    ) {
      streakEnd += 1;
    }
    const streak = recentRuns.slice(index, streakEnd);
    if (streak.length >= kRecentRunCollapseThreshold) {
      const statusCounts = streak.reduce((accumulator, runEntry) => {
        const status = String(runEntry?.status || "unknown");
        accumulator[status] = Number(accumulator[status] || 0) + 1;
        return accumulator;
      }, {});
      rows.push({
        type: "collapsed-group",
        jobId: String(current?.jobId || ""),
        jobName: String(current?.jobName || current?.jobId || ""),
        count: streak.length,
        newestTs: Number(streak[0]?.ts || 0),
        oldestTs: Number(streak[streak.length - 1]?.ts || 0),
        statusCounts,
      });
      index = streakEnd;
      continue;
    }
    for (const runEntry of streak) {
      if (rows.length >= kRecentRunRowsLimit) break;
      rows.push({
        type: "entry",
        entry: runEntry,
      });
    }
    index = streakEnd;
  }
  return rows;
};

const getHashRouteParts = () => {
  const rawHash = String(window.location.hash || "").replace(/^#/, "");
  const hashPath = rawHash || "/cron";
  const [pathPart, queryPart = ""] = hashPath.split("?");
  return {
    pathPart: pathPart || "/cron",
    params: new URLSearchParams(queryPart),
  };
};

const readTrendFilterFromHash = () => {
  const { params } = getHashRouteParts();
  const startMs = Number(params.get(kTrendQueryStartKey) || 0);
  const endMs = Number(params.get(kTrendQueryEndKey) || 0);
  const range = String(params.get(kTrendQueryRangeKey) || kTrendRange7d);
  const label = String(params.get(kTrendQueryLabelKey) || "");
  const hasValidRange = range === kTrendRange7d || range === kTrendRange30d;
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) {
    return null;
  }
  return {
    startMs,
    endMs,
    range: hasValidRange ? range : kTrendRange7d,
    label: label || "selected period",
  };
};

const writeTrendFilterToHash = (filterValue = null) => {
  const { pathPart, params } = getHashRouteParts();
  if (!filterValue) {
    params.delete(kTrendQueryStartKey);
    params.delete(kTrendQueryEndKey);
    params.delete(kTrendQueryRangeKey);
    params.delete(kTrendQueryLabelKey);
  } else {
    params.set(kTrendQueryStartKey, String(Number(filterValue.startMs || 0)));
    params.set(kTrendQueryEndKey, String(Number(filterValue.endMs || 0)));
    params.set(
      kTrendQueryRangeKey,
      filterValue.range === kTrendRange30d ? kTrendRange30d : kTrendRange7d,
    );
    params.set(kTrendQueryLabelKey, String(filterValue.label || ""));
  }
  const nextQuery = params.toString();
  const nextHash = nextQuery ? `#${pathPart}?${nextQuery}` : `#${pathPart}`;
  const nextUrl =
    `${window.location.pathname}${window.location.search}${nextHash}`;
  window.history.replaceState(window.history.state, "", nextUrl);
};

export const CronOverview = ({
  jobs = [],
  bulkUsageByJobId = {},
  bulkRunsByJobId = {},
  onSelectJob = () => {},
}) => {
  const [recentRunStatusFilter, setRecentRunStatusFilter] = useState("all");
  const [selectedTrendBucketFilter, setSelectedTrendBucketFilter] = useState(
    () => readTrendFilterFromHash(),
  );
  const enabledCount = jobs.filter((job) => job.enabled !== false).length;
  const disabledCount = jobs.length - enabledCount;
  const nextRunMs = getNextScheduledRunAcrossJobs(jobs);
  const warnings = buildCronOptimizationWarnings(jobs);
  const recentRuns = useMemo(
    () => flattenRecentRuns({ bulkRunsByJobId, jobs }),
    [bulkRunsByJobId, jobs],
  );
  const timeFilteredRecentRuns = useMemo(() => {
    if (!selectedTrendBucketFilter) return recentRuns;
    const startMs = Number(selectedTrendBucketFilter?.startMs || 0);
    const endMs = Number(selectedTrendBucketFilter?.endMs || 0);
    if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) {
      return recentRuns;
    }
    return recentRuns.filter((entry) => {
      const timestampMs = Number(entry?.ts || 0);
      return Number.isFinite(timestampMs) && timestampMs >= startMs && timestampMs < endMs;
    });
  }, [recentRuns, selectedTrendBucketFilter]);
  const filteredRecentRuns = useMemo(
    () =>
      timeFilteredRecentRuns.filter((entry) =>
        recentRunStatusFilter === "all"
          ? true
          : String(entry?.status || "")
              .trim()
              .toLowerCase() === recentRunStatusFilter,
      ),
    [recentRunStatusFilter, timeFilteredRecentRuns],
  );
  const recentRunRows = useMemo(
    () => buildCollapsedRunRows(filteredRecentRuns),
    [filteredRecentRuns],
  );
  const initialTrendRange = selectedTrendBucketFilter?.range === kTrendRange30d
    ? kTrendRange30d
    : kTrendRange7d;
  useEffect(() => {
    writeTrendFilterToHash(selectedTrendBucketFilter);
  }, [selectedTrendBucketFilter]);

  return html`
    <div class="cron-detail-scroll">
      <div class="cron-detail-content">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
          <${SummaryStatCard}
            title="Total jobs"
            value=${jobs.length}
            monospace=${true}
          />
          <${SummaryStatCard}
            title="Enabled"
            value=${enabledCount}
            monospace=${true}
          />
          <${SummaryStatCard}
            title="Disabled"
            value=${disabledCount}
            monospace=${true}
          />
          <${SummaryStatCard}
            title="Next scheduled run"
            value=${nextRunMs ? formatRelativeMs(nextRunMs) : "—"}
            valueClassName="text-sm font-medium text-gray-200 leading-snug"
          />
        </div>

        <section class="bg-surface border border-border rounded-xl px-4 py-3">
          <details class="group">
            <summary class="list-none cursor-pointer">
              <div class="flex items-center justify-between gap-2">
                <div class="inline-flex items-center gap-2 min-w-0">
                  <${ErrorWarningLineIcon}
                    className="w-4 h-4 text-yellow-300 shrink-0"
                  />
                  <div class="text-xs text-yellow-100 truncate">
                    ${formatWarningsAttentionText(warnings)}
                  </div>
                </div>
                <span
                  class="text-gray-400 text-xs transition-transform group-open:rotate-90"
                  >▸</span
                >
              </div>
            </summary>
            <div class="mt-3">
              ${warnings.length === 0
                ? html`<div class="text-xs text-gray-500">
                    No warnings right now.
                  </div>`
                : html`
                    <div class="space-y-2">
                      ${warnings.map(
                        (warning, index) => html`
                          <div
                            key=${`warning:${index}`}
                            class=${`rounded-xl border p-3 text-xs ${warningClassName(warning.tone)} ${warning?.jobId ? "cursor-pointer hover:brightness-110" : ""}`}
                            role=${warning?.jobId ? "button" : null}
                            tabindex=${warning?.jobId ? "0" : null}
                            onclick=${() => {
                              if (!warning?.jobId) return;
                              onSelectJob(warning.jobId);
                            }}
                            onKeyDown=${(event) => {
                              if (!warning?.jobId) return;
                              if (event.key !== "Enter" && event.key !== " ")
                                return;
                              event.preventDefault();
                              onSelectJob(warning.jobId);
                            }}
                          >
                            <div class="font-medium">${warning.title}</div>
                            <div class="mt-1 opacity-90">${warning.body}</div>
                          </div>
                        `,
                      )}
                    </div>
                  `}
            </div>
          </details>
        </section>

        <${CronCalendar}
          jobs=${jobs}
          usageByJobId=${bulkUsageByJobId}
          runsByJobId=${bulkRunsByJobId}
          onSelectJob=${onSelectJob}
        />

        <${CronRunsTrendCard}
          bulkRunsByJobId=${bulkRunsByJobId}
          initialRange=${initialTrendRange}
          selectedBucketFilter=${selectedTrendBucketFilter}
          onBucketFilterChange=${setSelectedTrendBucketFilter}
        />

        <section
          class="bg-surface border border-border rounded-xl p-4 space-y-3"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="inline-flex items-center gap-3">
              <h3 class="card-label card-label-bright">Run history</h3>
              <div class="text-xs text-gray-500">
                ${formatTokenCount(filteredRecentRuns.length)} entries
              </div>
            </div>
            <div class="shrink-0">
              <${SegmentedControl}
                options=${kRunStatusFilterOptions}
                value=${recentRunStatusFilter}
                onChange=${setRecentRunStatusFilter}
              />
            </div>
          </div>
          ${selectedTrendBucketFilter
            ? html`
                <div class="flex items-center">
                  <span class="inline-flex items-center gap-1.5 text-xs pl-2.5 pr-2 py-1 rounded-full border border-border text-gray-300 bg-black/20">
                    Filtered to ${selectedTrendBucketFilter.label}
                    <button
                      type="button"
                      class="text-gray-500 hover:text-gray-200 leading-none"
                      onclick=${() => setSelectedTrendBucketFilter(null)}
                      aria-label="Clear trend filter"
                    >
                      ×
                    </button>
                  </span>
                </div>
              `
            : null}
          ${recentRunRows.length === 0
            ? html`<div class="text-sm text-gray-500">No runs found.</div>`
            : html`
                <div class="ac-history-list">
                  ${recentRunRows.map((row, rowIndex) => {
                    if (row.type === "collapsed-group") {
                      const statusSummary = Object.entries(
                        row.statusCounts || {},
                      )
                        .map(([status, count]) => `${status}: ${count}`)
                        .join(" • ");
                      const timeRangeLabel = `[${formatRecentRunTimestamp(row.oldestTs)} - ${formatRecentRunTimestamp(row.newestTs)}]`;
                      return html`
                        <details
                          key=${`collapsed:${rowIndex}:${row.jobId}`}
                          class="ac-history-item"
                        >
                          <summary class="ac-history-summary">
                            <div class="ac-history-summary-row">
                              <span
                                class="inline-flex items-center gap-2 min-w-0"
                              >
                                <span
                                  class="ac-history-toggle shrink-0"
                                  aria-hidden="true"
                                  >▸</span
                                >
                                <span class="truncate text-xs text-gray-300">
                                  ${row.jobName} -
                                  ${formatTokenCount(row.count)} runs -
                                  ${timeRangeLabel}
                                </span>
                              </span>
                            </div>
                          </summary>
                          <div class="ac-history-body space-y-2 text-xs">
                            <div class="text-gray-500">
                              ${formatTokenCount(row.count)} consecutive runs
                              collapsed (${timeRangeLabel})
                            </div>
                            <div class="text-gray-500">
                              Statuses: ${statusSummary}
                            </div>
                            <div>
                              <button
                                type="button"
                                class="text-xs px-2 py-1 rounded border border-border text-gray-400 hover:text-gray-200"
                                onclick=${() => onSelectJob(row.jobId)}
                              >
                                Open ${row.jobName}
                              </button>
                            </div>
                          </div>
                        </details>
                      `;
                    }
                    const runEntry = row.entry || {};
                    const runStatus = String(runEntry?.status || "unknown");
                    const runUsage = runEntry?.usage || {};
                    const runInputTokens = Number(
                      runUsage?.input_tokens ?? runUsage?.inputTokens ?? 0,
                    );
                    const runOutputTokens = Number(
                      runUsage?.output_tokens ?? runUsage?.outputTokens ?? 0,
                    );
                    const runTokens = Number(
                      runUsage?.total_tokens ?? runUsage?.totalTokens ?? 0,
                    );
                    const runEstimatedCost = getRunEstimatedCost(runEntry);
                    const runTitle = String(runEntry?.jobName || "").trim();
                    const hasRunTitle = runTitle.length > 0;
                    return html`
                      <details
                        key=${`entry:${rowIndex}:${runEntry.ts}:${runEntry.jobId || ""}`}
                        class="ac-history-item"
                      >
                        <summary class="ac-history-summary">
                          <div class="ac-history-summary-row">
                            <span
                              class="inline-flex items-center gap-2 min-w-0"
                            >
                              <span
                                class="ac-history-toggle shrink-0"
                                aria-hidden="true"
                                >▸</span
                              >
                              ${hasRunTitle
                                ? html`
                                    <span
                                      class="inline-flex items-center gap-2 min-w-0"
                                    >
                                      <span class="truncate text-xs text-gray-300">
                                        ${runTitle}
                                      </span>
                                      <span class="text-xs text-gray-500 shrink-0">
                                        ${formatRecentRunTimestamp(runEntry.ts)}
                                      </span>
                                    </span>
                                  `
                                : html`
                                    <span class="truncate text-xs text-gray-300">
                                      ${runEntry.jobId} -
                                      ${formatRecentRunTimestamp(runEntry.ts)}
                                    </span>
                                  `}
                            </span>
                            <span
                              class="inline-flex items-center gap-3 shrink-0 text-xs"
                            >
                              <span class=${runStatusClassName(runStatus)}
                                >${runStatus}</span
                              >
                              <span class="text-gray-400"
                                >${formatDurationCompactMs(
                                  runEntry.durationMs,
                                )}</span
                              >
                              <span class="text-gray-400"
                                >${formatTokenCount(runTokens)} tk</span
                              >
                              <span class="text-gray-500"
                                >${runEstimatedCost == null
                                  ? "—"
                                  : `~${formatCost(runEstimatedCost)}`}</span
                              >
                            </span>
                          </div>
                        </summary>
                        <div class="ac-history-body space-y-2 text-xs">
                          ${runEntry.summary
                            ? html`<div>
                                <span class="text-gray-500">Summary:</span>
                                ${runEntry.summary}
                              </div>`
                            : null}
                          ${runEntry.error
                            ? html`<div class="text-red-300">
                                <span class="text-gray-500">Error:</span>
                                ${runEntry.error}
                              </div>`
                            : null}
                          <div class="ac-surface-inset rounded-lg p-2.5 space-y-1.5">
                            <div class="text-gray-500">
                              Model:
                              <span class="text-gray-300 font-mono"
                                >${runEntry.model || "—"}</span
                              >
                              ${runEntry.sessionKey
                                ? html` | Session:
                                    <span class="text-gray-300 font-mono"
                                      >${runEntry.sessionKey}</span
                                    >`
                                : null}
                            </div>
                            <div class="text-gray-500">
                              Usage:
                              <span class="text-gray-300"
                                >${formatTokenCount(runInputTokens)} in</span
                              >
                              <span class="text-gray-600">•</span>
                              <span class="text-gray-300"
                                >${formatTokenCount(runOutputTokens)} out</span
                              >
                              <span class="text-gray-600">•</span>
                              <span class="text-gray-300"
                                >${formatTokenCount(runTokens)} tk</span
                              >
                              <span class="text-gray-600">•</span>
                              <span class="text-gray-300"
                                >${runEstimatedCost == null
                                  ? "—"
                                  : `~${formatCost(runEstimatedCost)}`}</span
                              >
                            </div>
                          </div>
                          <div>
                            <button
                              type="button"
                              class="text-xs px-2 py-1 rounded border border-border text-gray-400 hover:text-gray-200"
                              onclick=${() => onSelectJob(runEntry.jobId)}
                            >
                              Open ${runEntry.jobName || runEntry.jobId}
                            </button>
                          </div>
                        </div>
                      </details>
                    `;
                  })}
                </div>
              `}
        </section>
      </div>
    </div>
  `;
};
