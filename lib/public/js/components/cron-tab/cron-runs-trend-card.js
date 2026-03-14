import { h } from "https://esm.sh/preact";
import { useEffect, useMemo, useRef, useState } from "https://esm.sh/preact/hooks";
import htm from "https://esm.sh/htm";
import { formatChartBucketLabel } from "../../lib/format.js";
import { SegmentedControl } from "../segmented-control.js";
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

const kRanges = [
  { label: "24h", value: kRange24h },
  { label: "7d", value: kRange7d },
  { label: "30d", value: kRange30d },
];
const kMetricOutcomes = "outcomes";
const kMetricTokens = "tokens";
const kMetricCost = "cost";
const kMetricOptions = [
  { label: "outcomes", value: kMetricOutcomes },
  { label: "tokens", value: kMetricTokens },
  { label: "cost", value: kMetricCost },
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
  if (range === kRange24h) {
    return {
      bucketCount: 24,
      bucketMs: 60 * 60 * 1000,
      formatLabel: (valueMs) =>
        formatChartBucketLabel(valueMs, { range: kRange24h, valueType: "epoch-ms" }),
      showLabel: (_, index, total) => index % 3 === 0 || index === total - 1,
      alignToLocalDay: false,
    };
  }
  if (range === kRange30d) {
    return {
      bucketCount: 30,
      bucketMs: 24 * 60 * 60 * 1000,
      formatLabel: (valueMs) =>
        formatChartBucketLabel(valueMs, { range: kRange30d, valueType: "epoch-ms" }),
      showLabel: (_, index, total) => index % 5 === 0 || index === total - 1,
      alignToLocalDay: true,
    };
  }
  return {
    bucketCount: 7,
    bucketMs: 24 * 60 * 60 * 1000,
      formatLabel: (valueMs) =>
        formatChartBucketLabel(valueMs, { range: kRange7d, valueType: "epoch-ms" }),
    showLabel: () => true,
    alignToLocalDay: true,
  };
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
      totalTokens: 0,
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
      points[bucketIndex].totalTokens += getCronRunTotalTokens(entry);
      const estimatedCost = getCronRunEstimatedCost(entry);
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
  initialRange = kRange24h,
  selectedBucketFilter = null,
  onBucketFilterChange = () => {},
}) => {
  const chartCanvasRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const [metric, setMetric] = useState(kMetricOutcomes);
  const [range, setRange] = useState(
    initialRange === kRange30d
      ? kRange30d
      : initialRange === kRange7d
        ? kRange7d
        : kRange24h,
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
  const selectedPointIndex = useMemo(
    () => trend.points.findIndex((point) => point.key === selectedBucketKey),
    [selectedBucketKey, trend.points],
  );

  const chartData = useMemo(() => {
    const dimAlpha = "0.22";
    const fullAlpha = "0.86";
    const isDimmed = (index) => selectedPointIndex >= 0 && selectedPointIndex !== index;
    const labels = trend.points.map((point) => (point.showLabel ? point.label : ""));
    if (metric === kMetricOutcomes) {
      return {
        labels,
        datasets: [
          {
            label: "ok",
            data: trend.points.map((point) => Number(point.ok || 0)),
            stack: "outcomes",
            backgroundColor: trend.points.map((_, index) =>
              `rgba(34,255,170,${isDimmed(index) ? dimAlpha : fullAlpha})`),
            borderColor: trend.points.map((_, index) =>
              `rgba(34,255,170,${isDimmed(index) ? "0.35" : "1"})`),
            borderWidth: 1,
            borderRadius: 0,
            borderSkipped: false,
          },
          {
            label: "error",
            data: trend.points.map((point) => Number(point.error || 0)),
            stack: "outcomes",
            backgroundColor: trend.points.map((_, index) =>
              `rgba(255,74,138,${isDimmed(index) ? dimAlpha : fullAlpha})`),
            borderColor: trend.points.map((_, index) =>
              `rgba(255,74,138,${isDimmed(index) ? "0.35" : "1"})`),
            borderWidth: 1,
            borderRadius: 0,
            borderSkipped: false,
          },
          {
            label: "skipped",
            data: trend.points.map((point) => Number(point.skipped || 0)),
            stack: "outcomes",
            backgroundColor: trend.points.map((_, index) =>
              `rgba(255,214,64,${isDimmed(index) ? dimAlpha : fullAlpha})`),
            borderColor: trend.points.map((_, index) =>
              `rgba(255,214,64,${isDimmed(index) ? "0.35" : "1"})`),
            borderWidth: 1,
            borderRadius: 0,
            borderSkipped: false,
          },
        ],
      };
    }
    const datasetLabel = metric === kMetricTokens ? "tokens" : "cost";
    return {
      labels,
      datasets: [
        {
          label: datasetLabel,
          data: trend.points.map((point) =>
            metric === kMetricTokens
              ? Number(point.totalTokens || 0)
              : Number(point.totalCost || 0)),
          backgroundColor: trend.points.map((_, index) =>
            metric === kMetricTokens
              ? `rgba(34,211,238,${isDimmed(index) ? dimAlpha : "0.72"})`
              : `rgba(167,139,250,${isDimmed(index) ? dimAlpha : "0.72"})`),
          borderColor: trend.points.map((_, index) =>
            metric === kMetricTokens
              ? `rgba(34,211,238,${isDimmed(index) ? "0.35" : "1"})`
              : `rgba(167,139,250,${isDimmed(index) ? "0.35" : "1"})`),
          borderWidth: 1,
          borderRadius: 0,
          borderSkipped: false,
        },
      ],
    };
  }, [metric, selectedPointIndex, trend.points]);

  useEffect(() => {
    const canvas = chartCanvasRef.current;
    const Chart = window.Chart;
    if (!canvas || !Chart) return;
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
      chartInstanceRef.current = null;
    }
    const getBucketFilter = (index) => {
      const selectedPoint = trend.points[index];
      if (!selectedPoint) return null;
      return {
        key: selectedPoint.key,
        label: selectedPoint.label,
        range,
        startMs: Number(selectedPoint.startMs || 0),
        endMs: Number(selectedPoint.endMs || 0),
      };
    };
    chartInstanceRef.current = new Chart(canvas, {
      type: "bar",
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        animation: false,
        onHover: (event, elements) => {
          const target = event?.native?.target;
          if (!target || !target.style) return;
          target.style.cursor = Array.isArray(elements) && elements.length > 0
            ? "pointer"
            : "default";
        },
        onClick: (_event, elements) => {
          const index = Number(elements?.[0]?.index);
          if (!Number.isFinite(index)) return;
          const nextFilter = getBucketFilter(index);
          if (!nextFilter) return;
          if (nextFilter.key === selectedBucketKey) {
            onBucketFilterChange(null);
            return;
          }
          onBucketFilterChange(nextFilter);
        },
        scales: {
          x: {
            stacked: metric === kMetricOutcomes,
            grid: { color: "rgba(148,163,184,0.08)" },
            ticks: {
              color: "rgba(156,163,175,1)",
              maxRotation: 0,
              autoSkip: false,
            },
          },
          y: {
            stacked: metric === kMetricOutcomes,
            beginAtZero: true,
            grid: { color: "rgba(148,163,184,0.12)" },
            ticks: {
              precision: metric === kMetricCost ? undefined : 0,
              color: "rgba(156,163,175,1)",
              callback: (value) =>
                metric === kMetricCost
                  ? formatCost(Number(value || 0))
                  : formatTokenCount(Number(value || 0)),
            },
          },
        },
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              color: "rgba(209,213,219,1)",
              boxWidth: 10,
              boxHeight: 10,
            },
          },
          tooltip: {
            callbacks: {
              title: (items) => String(items?.[0]?.label || ""),
              label: (context) => {
                const value = Number(context.parsed.y || 0);
                if (metric === kMetricCost) {
                  return `${context.dataset.label}: ${formatCost(value)}`;
                }
                return `${context.dataset.label}: ${formatTokenCount(value)}`;
              },
              footer: (items) => {
                const index = Number(items?.[0]?.dataIndex);
                const point = trend.points[index];
                if (!point) return "";
                const costLabel =
                  point.costCount > 0 ? `~${formatCost(point.totalCost)}` : "—";
                const tokensLabel = formatTokenCount(point.totalTokens || 0);
                return `runs: ${point.total}\ntokens: ${tokensLabel}\ncost: ${costLabel}`;
              },
            },
          },
        },
      },
    });
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [chartData, metric, onBucketFilterChange, range, selectedBucketKey, trend.points]);

  return html`
    <section class="bg-surface border border-border rounded-xl p-4 space-y-3">
      <div class="flex items-center justify-between gap-2">
        <h3 class="card-label cron-calendar-title">Trends</h3>
        <div class="flex items-center gap-2">
          <${SegmentedControl}
            options=${kMetricOptions}
            value=${metric}
            onChange=${setMetric}
          />
          <${SegmentedControl}
            options=${kRanges}
            value=${range}
            onChange=${setRange}
          />
        </div>
      </div>
      <div class="h-40">
        <canvas ref=${chartCanvasRef}></canvas>
      </div>
    </section>
  `;
};
