import { h } from "https://esm.sh/preact";
import { useMemo, useState } from "https://esm.sh/preact/hooks";
import htm from "https://esm.sh/htm";
import { SegmentedControl } from "../segmented-control.js";
import { Badge } from "../badge.js";
import {
  formatCost,
  formatTokenCount,
  getCronRunEstimatedCost,
  getCronRunTotalTokens,
} from "./cron-helpers.js";

const html = htm.bind(h);

const kRange24h = "24h";
const kRange7d = "7d";
const kRange30d = "30d";
const kRangeOptions = [
  { label: "24h", value: kRange24h },
  { label: "7d", value: kRange7d },
  { label: "30d", value: kRange30d },
];
const kRangeWindowMsByValue = {
  [kRange24h]: 24 * 60 * 60 * 1000,
  [kRange7d]: 7 * 24 * 60 * 60 * 1000,
  [kRange30d]: 30 * 24 * 60 * 60 * 1000,
};
const kTopListLimit = 3;
const kBadgeToneByInsight = {
  "Token hungry": "warning",
  "Potentially wasteful": "danger",
  "Most expensive": "accent",
};
const kWastefulMinRuns = 10;
const kTokenHungryMinAvgTokensPerRun = 100000;
const kTokenHungryMinRuns = 3;
const formatRunCountLabel = (count = 0) => {
  const safeCount = Number(count || 0);
  const countLabel = formatTokenCount(safeCount);
  return `${countLabel} ${safeCount === 1 ? "run" : "runs"}`;
};

const readDeliveryMode = (job = null) =>
  String(job?.delivery?.mode || job?.deliveryMode || "none")
    .trim()
    .toLowerCase();

const sortDescBy = (items = [], selectors = []) =>
  [...items].sort((left, right) => {
    for (const selector of selectors) {
      const leftValue = Number(selector(left) || 0);
      const rightValue = Number(selector(right) || 0);
      if (leftValue === rightValue) continue;
      return rightValue - leftValue;
    }
    return String(left?.jobName || "").localeCompare(
      String(right?.jobName || ""),
    );
  });

const buildInsightMetrics = ({
  jobs = [],
  bulkRunsByJobId = {},
  rangeValue = kRange7d,
}) => {
  const nowMs = Date.now();
  const windowMs = Number(
    kRangeWindowMsByValue[rangeValue] || kRangeWindowMsByValue[kRange7d],
  );
  const cutoffMs = nowMs - windowMs;
  const metricsByJobId = jobs.reduce((accumulator, job) => {
    const jobId = String(job?.id || "");
    if (!jobId) return accumulator;
    accumulator[jobId] = {
      jobId,
      jobName: String(job?.name || jobId),
      runCount: 0,
      totalTokens: 0,
      totalCost: 0,
      hasCostData: false,
      hasDelivery: readDeliveryMode(job) !== "none",
    };
    return accumulator;
  }, {});

  Object.entries(bulkRunsByJobId || {}).forEach(([jobIdValue, runResult]) => {
    const jobId = String(jobIdValue || "");
    if (!jobId) return;
    if (!metricsByJobId[jobId]) {
      metricsByJobId[jobId] = {
        jobId,
        jobName: jobId,
        runCount: 0,
        totalTokens: 0,
        totalCost: 0,
        hasCostData: false,
        hasDelivery: false,
      };
    }
    const entries = Array.isArray(runResult?.entries) ? runResult.entries : [];
    entries.forEach((entry) => {
      const timestampMs = Number(entry?.ts || 0);
      if (
        !Number.isFinite(timestampMs) ||
        timestampMs < cutoffMs ||
        timestampMs > nowMs
      ) {
        return;
      }
      metricsByJobId[jobId].runCount += 1;
      metricsByJobId[jobId].totalTokens += Number(getCronRunTotalTokens(entry) || 0);
      const estimatedCost = getCronRunEstimatedCost(entry);
      if (estimatedCost != null) {
        metricsByJobId[jobId].hasCostData = true;
        metricsByJobId[jobId].totalCost += Number(estimatedCost || 0);
      }
    });
  });

  return Object.values(metricsByJobId).map((entry) => ({
    ...entry,
    avgTokensPerRun:
      entry.runCount > 0 ? Math.round(entry.totalTokens / entry.runCount) : 0,
    avgCostPerRun: entry.runCount > 0 ? entry.totalCost / entry.runCount : 0,
  }));
};

const renderInsightRow = ({
  title = "",
  rows = [],
  onSelectJob = () => {},
}) => {
  const badgeTone = kBadgeToneByInsight[title] || "neutral";
  const topRow = rows[0];
  const overflowRows = rows.slice(1);
  return html`
    <div class="rounded-lg border border-border bg-black/20 px-3 py-2 space-y-1.5">
      <button
        type="button"
        class="w-full text-left hover:brightness-110 transition"
        onClick=${() => onSelectJob(topRow.jobId)}
      >
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <div class="text-sm text-gray-100 truncate">${topRow.jobName}</div>
            <div class="text-xs text-gray-400 truncate mt-1">
              ${`${topRow.primaryLabel} · ${topRow.secondaryLabel}`}
            </div>
          </div>
          <div class="shrink-0 inline-flex items-center gap-1.5">
            <${Badge} tone=${badgeTone}>${title}</${Badge}>
          </div>
        </div>
      </button>
      ${
        overflowRows.length > 0
          ? html`
              <details class="group">
                <summary
                  class="list-none cursor-pointer text-[11px] text-gray-500 hover:text-gray-300"
                >
                  Show more
                </summary>
                <div class="mt-1.5 divide-y divide-border">
                  ${overflowRows.map(
                    (row, index) => html`
                      <button
                        key=${`${title}:${row.jobId}`}
                        type="button"
                        class="w-full text-left py-2 hover:brightness-110 transition"
                        onClick=${() => onSelectJob(row.jobId)}
                      >
                        <div class="flex items-start justify-between gap-3">
                          <div class="min-w-0">
                            <div class="text-sm text-gray-200 truncate">
                              ${row.jobName}
                            </div>
                            <div
                              class="text-[11px] text-gray-500 truncate mt-1"
                            >
                              ${`${row.primaryLabel} · ${row.secondaryLabel}`}
                            </div>
                          </div>
                          <div
                            class="text-[11px] uppercase tracking-wide text-gray-500"
                          >
                            #${index + 2}
                          </div>
                        </div>
                      </button>
                    `,
                  )}
                </div>
              </details>
            `
          : null
      }
    </div>
  `;
};

export const CronInsightsPanel = ({
  jobs = [],
  bulkRunsByJobId = {},
  onSelectJob = () => {},
}) => {
  const [rangeValue, setRangeValue] = useState(kRange7d);
  const metrics = useMemo(
    () => buildInsightMetrics({ jobs, bulkRunsByJobId, rangeValue }),
    [bulkRunsByJobId, jobs, rangeValue],
  );

  const tokenHungryRows = useMemo(
    () =>
      sortDescBy(
        metrics.filter(
          (entry) =>
            entry.runCount >= kTokenHungryMinRuns &&
            entry.avgTokensPerRun >= kTokenHungryMinAvgTokensPerRun,
        ),
        [(entry) => entry.avgTokensPerRun, (entry) => entry.totalTokens],
      )
        .slice(0, kTopListLimit)
        .map((entry) => ({
          ...entry,
          primaryLabel: `${formatTokenCount(entry.avgTokensPerRun)} avg tokens/run`,
          secondaryLabel: `${formatTokenCount(entry.totalTokens)} total tokens · ${formatRunCountLabel(entry.runCount)}`,
        })),
    [metrics],
  );

  const wastefulRows = useMemo(
    () =>
      sortDescBy(
        metrics.filter(
          (entry) =>
            entry.runCount >= kWastefulMinRuns &&
            entry.hasDelivery === false &&
            (entry.totalTokens > 0 || entry.totalCost > 0),
        ),
        [(entry) => entry.totalTokens, (entry) => entry.runCount],
      )
        .slice(0, kTopListLimit)
        .map((entry) => ({
          ...entry,
          primaryLabel: `${formatRunCountLabel(entry.runCount)} with no delivery`,
          secondaryLabel: `${formatTokenCount(entry.totalTokens)} total tokens${entry.hasCostData ? ` · ${formatCost(entry.totalCost)}` : ""}`,
        })),
    [metrics],
  );

  const expensiveRows = useMemo(
    () =>
      sortDescBy(
        metrics.filter((entry) => entry.runCount > 0 && entry.totalCost > 0),
        [(entry) => entry.totalCost, (entry) => entry.avgCostPerRun],
      )
        .slice(0, kTopListLimit)
        .map((entry) => ({
          ...entry,
          primaryLabel: `${formatCost(entry.totalCost)} total estimated cost`,
          secondaryLabel: `${formatCost(entry.avgCostPerRun)} avg/run · ${formatRunCountLabel(entry.runCount)}`,
        })),
    [metrics],
  );
  const insightRows = [
    { title: "Token hungry", rows: tokenHungryRows },
    { title: "Potentially wasteful", rows: wastefulRows },
    { title: "Most expensive", rows: expensiveRows },
  ].filter((group) => Array.isArray(group.rows) && group.rows.length > 0);
  if (insightRows.length === 0) return null;

  return html`
    <section class="bg-surface border border-border rounded-xl p-4 space-y-3">
      <div class="flex items-center justify-between gap-2">
        <h3 class="card-label cron-calendar-title">Insights</h3>
        <${SegmentedControl}
          options=${kRangeOptions}
          value=${rangeValue}
          onChange=${setRangeValue}
        />
      </div>

      <div class="grid grid-cols-1 gap-2">
        ${insightRows.map((group) =>
          renderInsightRow({
            title: group.title,
            rows: group.rows,
            onSelectJob,
          }))}
      </div>
    </section>
  `;
};
