import { h } from "https://esm.sh/preact";
import { useEffect, useMemo, useState } from "https://esm.sh/preact/hooks";
import htm from "https://esm.sh/htm";
import {
  buildCronOptimizationWarnings,
  formatTokenCount,
  getNextScheduledRunAcrossJobs,
} from "./cron-helpers.js";
import { CronCalendar } from "./cron-calendar.js";
import { CronRunsTrendCard } from "./cron-runs-trend-card.js";
import { CronRunHistoryPanel } from "./cron-run-history-panel.js";
import { CronInsightsPanel } from "./cron-insights-panel.js";
import { SummaryStatCard } from "../summary-stat-card.js";
import { ErrorWarningLineIcon } from "../icons.js";

const html = htm.bind(h);
const kRecentRunFetchLimit = 100;
const kRecentRunRowsLimit = 20;
const kRecentRunCollapseThreshold = 2;
const kTrendRange24h = "24h";
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

const flattenRecentRuns = ({ bulkRunsByJobId = {}, jobs = [], limit = 0 } = {}) => {
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
    .slice(0, Number(limit || 0) > 0 ? Number(limit || 0) : undefined);
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
        entries: streak,
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
  const range = String(params.get(kTrendQueryRangeKey) || kTrendRange24h);
  const label = String(params.get(kTrendQueryLabelKey) || "");
  const hasValidRange =
    range === kTrendRange24h || range === kTrendRange7d || range === kTrendRange30d;
  if (
    !Number.isFinite(startMs) ||
    !Number.isFinite(endMs) ||
    endMs <= startMs
  ) {
    return null;
  }
  return {
    startMs,
    endMs,
    range: hasValidRange ? range : kTrendRange24h,
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
      filterValue.range === kTrendRange30d
        ? kTrendRange30d
        : filterValue.range === kTrendRange7d
          ? kTrendRange7d
          : kTrendRange24h,
    );
    params.set(kTrendQueryLabelKey, String(filterValue.label || ""));
  }
  const nextQuery = params.toString();
  const nextHash = nextQuery ? `#${pathPart}?${nextQuery}` : `#${pathPart}`;
  const nextUrl = `${window.location.pathname}${window.location.search}${nextHash}`;
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
  const warnings = buildCronOptimizationWarnings(jobs, bulkRunsByJobId);
  const allRecentRuns = useMemo(
    () => flattenRecentRuns({ bulkRunsByJobId, jobs }),
    [bulkRunsByJobId, jobs],
  );
  const recentRunsForDisplay = useMemo(
    () => allRecentRuns.slice(0, kRecentRunFetchLimit),
    [allRecentRuns],
  );
  const timeFilteredRecentRuns = useMemo(() => {
    if (!selectedTrendBucketFilter) return recentRunsForDisplay;
    const startMs = Number(selectedTrendBucketFilter?.startMs || 0);
    const endMs = Number(selectedTrendBucketFilter?.endMs || 0);
    if (
      !Number.isFinite(startMs) ||
      !Number.isFinite(endMs) ||
      endMs <= startMs
    ) {
      return recentRunsForDisplay;
    }
    return allRecentRuns.filter((entry) => {
      const timestampMs = Number(entry?.ts || 0);
      return (
        Number.isFinite(timestampMs) &&
        timestampMs >= startMs &&
        timestampMs < endMs
      );
    });
  }, [allRecentRuns, recentRunsForDisplay, selectedTrendBucketFilter]);
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
  const initialTrendRange =
    selectedTrendBucketFilter?.range === kTrendRange30d
      ? kTrendRange30d
      : selectedTrendBucketFilter?.range === kTrendRange7d
        ? kTrendRange7d
        : kTrendRange24h;
  useEffect(() => {
    writeTrendFilterToHash(selectedTrendBucketFilter);
  }, [selectedTrendBucketFilter]);

  return html`
    <div class="cron-detail-scroll">
      <div class="cron-detail-content">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
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

        <${CronInsightsPanel}
          jobs=${jobs}
          bulkRunsByJobId=${bulkRunsByJobId}
          onSelectJob=${onSelectJob}
        />

        <${CronRunsTrendCard}
          bulkRunsByJobId=${bulkRunsByJobId}
          initialRange=${initialTrendRange}
          selectedBucketFilter=${selectedTrendBucketFilter}
          onBucketFilterChange=${setSelectedTrendBucketFilter}
        />

        <${CronRunHistoryPanel}
          entryCountLabel=${`${formatTokenCount(filteredRecentRuns.length)} entries`}
          primaryFilterOptions=${kRunStatusFilterOptions}
          primaryFilterValue=${recentRunStatusFilter}
          onChangePrimaryFilter=${setRecentRunStatusFilter}
          activeFilterLabel=${selectedTrendBucketFilter?.label || ""}
          onClearActiveFilter=${() => setSelectedTrendBucketFilter(null)}
          rows=${recentRunRows}
          variant="overview"
          onSelectJob=${onSelectJob}
          showOpenJobButton=${true}
        />
      </div>
    </div>
  `;
};
