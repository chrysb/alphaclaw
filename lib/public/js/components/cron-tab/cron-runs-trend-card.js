import { h } from "https://esm.sh/preact";
import { useEffect, useMemo, useState } from "https://esm.sh/preact/hooks";
import htm from "https://esm.sh/htm";
import { SegmentedControl } from "../segmented-control.js";
import { Tooltip } from "../tooltip.js";
import { formatCost } from "./cron-helpers.js";

const html = htm.bind(h);

const kRange7d = "7d";
const kRange30d = "30d";

const kRanges = [
  { label: "7d", value: kRange7d },
  { label: "30d", value: kRange30d },
];

const startOfLocalDayMs = (valueMs) => {
  const dateValue = new Date(valueMs);
  dateValue.setHours(0, 0, 0, 0);
  return dateValue.getTime();
};

const addLocalDaysMs = (valueMs, dayCount = 0) => {
  const dateValue = new Date(valueMs);
  dateValue.setDate(dateValue.getDate() + Number(dayCount || 0));
  return dateValue.getTime();
};

const getBucketConfig = (range = kRange7d) => {
  if (range === kRange30d) {
    return {
      bucketCount: 30,
      bucketMs: 24 * 60 * 60 * 1000,
      formatLabel: (valueMs) => new Date(valueMs).toLocaleDateString([], { month: "numeric", day: "numeric" }),
      showLabel: (_, index, total) => index % 5 === 0 || index === total - 1,
      alignToLocalDay: true,
    };
  }
  return {
    bucketCount: 7,
    bucketMs: 24 * 60 * 60 * 1000,
    formatLabel: (valueMs) =>
      new Date(valueMs).toLocaleDateString([], {
        weekday: "short",
        month: "numeric",
        day: "numeric",
      }),
    showLabel: () => true,
    alignToLocalDay: true,
  };
};

const getEstimatedCostForEntry = (entry = {}) => {
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

const buildTrendData = ({ bulkRunsByJobId = {}, nowMs = Date.now(), range = kRange7d } = {}) => {
  const config = getBucketConfig(range);
  const safeNowMs = Number.isFinite(Number(nowMs)) ? Number(nowMs) : Date.now();
  const baseStartMs = config.alignToLocalDay
    ? addLocalDaysMs(startOfLocalDayMs(safeNowMs), -(config.bucketCount - 1))
    : safeNowMs - config.bucketCount * config.bucketMs;
  const points = Array.from({ length: config.bucketCount }, (_, index) => {
    const startMs = config.alignToLocalDay
      ? addLocalDaysMs(baseStartMs, index)
      : baseStartMs + index * config.bucketMs;
    const endMs = index === config.bucketCount - 1
      ? safeNowMs
      : config.alignToLocalDay
        ? addLocalDaysMs(baseStartMs, index + 1)
        : baseStartMs + (index + 1) * config.bucketMs;
    return {
      key: `trend-point-${index}`,
      startMs,
      endMs,
      ok: 0,
      error: 0,
      skipped: 0,
      totalCost: 0,
      costCount: 0,
    };
  });
  const dayKeyToIndex = config.alignToLocalDay
    ? new Map(
        points.map((point, index) => [startOfLocalDayMs(point.startMs), index]),
      )
    : null;
  const windowStartMs = points[0]?.startMs || baseStartMs;

  Object.values(bulkRunsByJobId || {}).forEach((runResult) => {
    const entries = Array.isArray(runResult?.entries) ? runResult.entries : [];
    entries.forEach((entry) => {
      const timestampMs = Number(entry?.ts || 0);
      if (!Number.isFinite(timestampMs) || timestampMs < windowStartMs || timestampMs > safeNowMs) return;
      const status = String(entry?.status || "").trim().toLowerCase();
      if (!["ok", "error", "skipped"].includes(status)) return;
      const bucketIndex = config.alignToLocalDay
        ? dayKeyToIndex?.get(startOfLocalDayMs(timestampMs))
        : Math.floor((timestampMs - windowStartMs) / config.bucketMs);
      if (!Number.isFinite(Number(bucketIndex))) return;
      if (bucketIndex < 0 || bucketIndex >= config.bucketCount) return;
      points[bucketIndex][status] += 1;
      const estimatedCost = getEstimatedCostForEntry(entry);
      if (estimatedCost != null) {
        points[bucketIndex].totalCost += estimatedCost;
        points[bucketIndex].costCount += 1;
      }
    });
  });

  const normalizedPoints = points.map((point, index) => {
    const total = point.ok + point.error + point.skipped;
    return {
      ...point,
      total,
      label: config.formatLabel(point.startMs),
      showLabel: config.showLabel(point, index, points.length),
    };
  });

  return {
    points: normalizedPoints,
    maxTotal: Math.max(1, ...normalizedPoints.map((point) => point.total)),
  };
};

export const CronRunsTrendCard = ({
  bulkRunsByJobId = {},
  initialRange = kRange7d,
  selectedBucketFilter = null,
  onBucketFilterChange = () => {},
}) => {
  const [range, setRange] = useState(
    initialRange === kRange30d ? kRange30d : kRange7d,
  );
  const trend = useMemo(
    () => buildTrendData({ bulkRunsByJobId, nowMs: Date.now(), range }),
    [bulkRunsByJobId, range],
  );
  useEffect(() => {
    onBucketFilterChange(null);
  }, [range, onBucketFilterChange]);
  const selectedBucketKey = useMemo(() => {
    if (!selectedBucketFilter) return "";
    if (selectedBucketFilter.range !== range) return "";
    const matchingPoint = trend.points.find(
      (point) =>
        Number(point.startMs) === Number(selectedBucketFilter.startMs) &&
        Number(point.endMs) === Number(selectedBucketFilter.endMs),
    );
    return matchingPoint?.key || "";
  }, [range, selectedBucketFilter, trend.points]);

  return html`
    <section class="bg-surface border border-border rounded-xl p-4 space-y-3">
      <div class="flex items-center justify-between gap-2">
        <h3 class="card-label cron-calendar-title">Run Outcome Trend</h3>
        <${SegmentedControl}
          options=${kRanges}
          value=${range}
          onChange=${setRange}
        />
      </div>
      <div
        class="cron-runs-trend-bars"
        style=${{ "--cron-runs-trend-columns": String(trend.points.length || 1) }}
      >
        ${trend.points.map((point) => {
          const isSelected = selectedBucketKey === point.key;
          const isDimmed = !!selectedBucketKey && !isSelected;
          const totalHeightPercent = (point.total / trend.maxTotal) * 100;
          const okHeightPercent = point.total > 0 ? (point.ok / point.total) * 100 : 0;
          const errorHeightPercent = point.total > 0 ? (point.error / point.total) * 100 : 0;
          const skippedHeightPercent = point.total > 0 ? (point.skipped / point.total) * 100 : 0;
          const tooltipText = [
            `${point.label}`,
            `ok: ${point.ok}`,
            `error: ${point.error}`,
            `skipped: ${point.skipped}`,
            `total: ${point.total}`,
            `cost: ${point.costCount > 0 ? `~${formatCost(point.totalCost)}` : "—"}`,
          ].join("\n");
          return html`
            <${Tooltip}
              text=${tooltipText}
              widthClass="w-40"
              tooltipClassName="whitespace-pre-line"
              triggerClassName="inline-flex justify-center w-full"
            >
              <div
                class=${`cron-runs-trend-col ${isSelected ? "is-selected" : ""} ${isDimmed ? "is-dimmed" : ""}`}
                role="button"
                tabindex="0"
                onClick=${() => {
                  if (isSelected) {
                    onBucketFilterChange(null);
                    return;
                  }
                  onBucketFilterChange({
                    key: point.key,
                    label: point.label,
                    range,
                    startMs: Number(point.startMs || 0),
                    endMs: Number(point.endMs || 0),
                  });
                }}
                onKeyDown=${(event) => {
                  if (event.key !== "Enter" && event.key !== " ") return;
                  event.preventDefault();
                  if (isSelected) {
                    onBucketFilterChange(null);
                    return;
                  }
                  onBucketFilterChange({
                    key: point.key,
                    label: point.label,
                    range,
                    startMs: Number(point.startMs || 0),
                    endMs: Number(point.endMs || 0),
                  });
                }}
              >
                <div class="cron-runs-trend-track">
                  <div class="cron-runs-trend-bar" style=${{ height: `${totalHeightPercent}%` }}>
                    <div
                      class="cron-runs-trend-segment-skipped"
                      style=${{ height: `${skippedHeightPercent}%` }}
                    ></div>
                    <div
                      class="cron-runs-trend-segment-error"
                      style=${{ height: `${errorHeightPercent}%` }}
                    ></div>
                    <div
                      class="cron-runs-trend-segment-ok"
                      style=${{ height: `${okHeightPercent}%` }}
                    ></div>
                  </div>
                </div>
                <span class="cron-runs-trend-label">${point.showLabel ? point.label : ""}</span>
              </div>
            </${Tooltip}>
          `;
        })}
      </div>
      <div class="cron-runs-trend-legend">
        <span class="cron-runs-trend-legend-item">
          <span class="cron-runs-trend-legend-dot is-ok"></span>
          ok
        </span>
        <span class="cron-runs-trend-legend-item">
          <span class="cron-runs-trend-legend-dot is-error"></span>
          error
        </span>
        <span class="cron-runs-trend-legend-item">
          <span class="cron-runs-trend-legend-dot is-skipped"></span>
          skipped
        </span>
      </div>
    </section>
  `;
};
