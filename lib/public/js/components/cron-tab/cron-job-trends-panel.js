import { h } from "https://esm.sh/preact";
import { useEffect, useMemo, useRef, useState } from "https://esm.sh/preact/hooks";
import htm from "https://esm.sh/htm";
import { formatCost, formatTokenCount } from "./cron-helpers.js";
import { formatChartBucketLabel, formatDurationCompactMs } from "../../lib/format.js";
import { SegmentedControl } from "../segmented-control.js";

const html = htm.bind(h);
const kMetricOutcomes = "outcomes";
const kMetricTokens = "tokens";
const kMetricDuration = "duration";
const kMetricCost = "cost";
const kRange24h = "24h";
const kRange7d = "7d";
const kRange30d = "30d";
const kRangeOptions = [
  { label: "24h", value: kRange24h },
  { label: "7d", value: kRange7d },
  { label: "30d", value: kRange30d },
];
const kMetricOptions = [
  { label: "outcomes", value: kMetricOutcomes },
  { label: "tokens", value: kMetricTokens },
  { label: "duration", value: kMetricDuration },
  { label: "cost", value: kMetricCost },
];
const buildChartData = ({
  trends = null,
  metric = kMetricOutcomes,
  selectedBucketKey = "",
} = {}) => {
  const points = Array.isArray(trends?.points) ? trends.points : [];
  const range = String(trends?.range || kRange7d);
  const labels = points.map((point) =>
    formatChartBucketLabel(point.startMs, {
      range,
      valueType: "epoch-ms",
    }));
  const dimAlpha = "0.22";
  const fullAlpha = "0.86";
  const isDimmed = (index) =>
    selectedBucketKey && String(points[index]?.key || "") !== selectedBucketKey;
  if (metric === kMetricOutcomes) {
    return {
      labels,
      datasets: [
        {
          label: "ok",
          data: points.map((point) => Number(point?.ok || 0)),
          stack: "outcomes",
          backgroundColor: points.map((_, index) =>
            `rgba(34,255,170,${isDimmed(index) ? dimAlpha : fullAlpha})`),
          borderColor: points.map((_, index) =>
            `rgba(34,255,170,${isDimmed(index) ? "0.35" : "1"})`),
          borderWidth: 1,
          borderRadius: 0,
          borderSkipped: false,
        },
        {
          label: "error",
          data: points.map((point) => Number(point?.error || 0)),
          stack: "outcomes",
          backgroundColor: points.map((_, index) =>
            `rgba(255,74,138,${isDimmed(index) ? dimAlpha : fullAlpha})`),
          borderColor: points.map((_, index) =>
            `rgba(255,74,138,${isDimmed(index) ? "0.35" : "1"})`),
          borderWidth: 1,
          borderRadius: 0,
          borderSkipped: false,
        },
        {
          label: "skipped",
          data: points.map((point) => Number(point?.skipped || 0)),
          stack: "outcomes",
          backgroundColor: points.map((_, index) =>
            `rgba(255,214,64,${isDimmed(index) ? dimAlpha : fullAlpha})`),
          borderColor: points.map((_, index) =>
            `rgba(255,214,64,${isDimmed(index) ? "0.35" : "1"})`),
          borderWidth: 1,
          borderRadius: 0,
          borderSkipped: false,
        },
      ],
    };
  }
  const valueByPoint = points.map((point) => {
    if (metric === kMetricTokens) return Number(point?.totalTokens || 0);
    if (metric === kMetricCost) return Number(point?.totalCost || 0);
    return Number(point?.avgDurationMs || 0);
  });
  return {
    labels,
    datasets: [
      {
        label:
          metric === kMetricTokens
            ? "tokens"
            : metric === kMetricCost
              ? "cost"
              : "avg duration",
        data: valueByPoint,
        backgroundColor: points.map((_, index) =>
          metric === kMetricTokens
            ? `rgba(34,211,238,${isDimmed(index) ? dimAlpha : "0.72"})`
            : metric === kMetricCost
              ? `rgba(167,139,250,${isDimmed(index) ? dimAlpha : "0.72"})`
              : `rgba(148,163,184,${isDimmed(index) ? dimAlpha : "0.72"})`),
        borderColor: points.map((_, index) =>
          metric === kMetricTokens
            ? `rgba(34,211,238,${isDimmed(index) ? "0.35" : "1"})`
            : metric === kMetricCost
              ? `rgba(167,139,250,${isDimmed(index) ? "0.35" : "1"})`
              : `rgba(148,163,184,${isDimmed(index) ? "0.35" : "1"})`),
        borderWidth: 1,
        borderRadius: 0,
        borderSkipped: false,
      },
    ],
  };
};

export const CronJobTrendsPanel = ({
  trends = null,
  range = kRange7d,
  onChangeRange = () => {},
  selectedBucketFilter = null,
  onChangeSelectedBucketFilter = () => {},
}) => {
  const chartCanvasRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const [metric, setMetric] = useState(kMetricOutcomes);
  const points = useMemo(
    () =>
      Array.isArray(trends?.points)
        ? trends.points.map((point, index) => ({
          ...point,
          key: String(point?.key || `point:${index}:${point?.startMs || 0}`),
        }))
        : [],
    [trends?.points],
  );
  const selectedBucketKey = useMemo(() => {
    if (!selectedBucketFilter) return "";
    const matchingPoint = points.find(
      (point) =>
        Number(point.startMs) === Number(selectedBucketFilter.startMs) &&
        Number(point.endMs) === Number(selectedBucketFilter.endMs),
    );
    return matchingPoint?.key || "";
  }, [points, selectedBucketFilter]);
  const hasData = useMemo(
    () =>
      points.some(
        (point) =>
          Number(point?.totalRuns || 0) > 0 ||
          Number(point?.totalTokens || 0) > 0 ||
          Number(point?.totalCost || 0) > 0 ||
          Number(point?.avgDurationMs || 0) > 0,
      ),
    [points],
  );
  const chartData = useMemo(
    () => buildChartData({ trends: { ...trends, points }, metric, selectedBucketKey }),
    [metric, points, selectedBucketKey, trends],
  );
  useEffect(() => {
    const canvas = chartCanvasRef.current;
    const Chart = window.Chart;
    if (!canvas || !Chart) return;
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
      chartInstanceRef.current = null;
    }
    const getBucketFilter = (index) => {
      const selectedPoint = points[index];
      if (!selectedPoint) return null;
      return {
        key: selectedPoint.key,
        label: formatChartBucketLabel(selectedPoint.startMs, {
          range,
          valueType: "epoch-ms",
        }),
        startMs: Number(selectedPoint.startMs || 0),
        endMs: Number(selectedPoint.endMs || 0),
        range,
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
            onChangeSelectedBucketFilter(null);
            return;
          }
          onChangeSelectedBucketFilter(nextFilter);
        },
        scales: {
          x: {
            stacked: metric === kMetricOutcomes,
            grid: { color: "rgba(148,163,184,0.08)" },
            ticks: {
              color: "rgba(156,163,175,1)",
              maxRotation: 0,
              autoSkip: true,
            },
          },
          y: {
            stacked: metric === kMetricOutcomes,
            beginAtZero: true,
            grid: { color: "rgba(148,163,184,0.12)" },
            ticks: {
              precision: metric === kMetricCost ? undefined : 0,
              color: "rgba(156,163,175,1)",
              callback: (value) => {
                const numericValue = Number(value || 0);
                if (metric === kMetricCost) return formatCost(numericValue);
                if (metric === kMetricDuration) {
                  return numericValue > 0 ? formatDurationCompactMs(numericValue) : "0";
                }
                return formatTokenCount(numericValue);
              },
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
                if (metric === kMetricDuration) {
                  return `${context.dataset.label}: ${value > 0 ? formatDurationCompactMs(value) : "—"}`;
                }
                return `${context.dataset.label}: ${formatTokenCount(value)}`;
              },
              footer: (items) => {
                const index = Number(items?.[0]?.dataIndex);
                const point = points[index];
                if (!point) return "";
                const runsLabel = `runs: ${formatTokenCount(point.totalRuns || 0)}`;
                const tokensLabel = `tokens: ${formatTokenCount(point.totalTokens || 0)}`;
                const costLabel = `cost: ${formatCost(point.totalCost || 0)}`;
                return `${runsLabel}\n${tokensLabel}\n${costLabel}`;
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
  }, [
    chartData,
    metric,
    onChangeSelectedBucketFilter,
    points,
    range,
    selectedBucketKey,
    trends?.bucket,
  ]);
  return html`
    <section class="bg-surface border border-border rounded-xl p-4 space-y-3">
      <div class="flex items-center justify-between gap-2">
        <h3 class="card-label card-label-bright">Trends</h3>
        <div class="flex items-center gap-2">
          <${SegmentedControl}
            options=${kMetricOptions}
            value=${metric}
            onChange=${setMetric}
          />
          <${SegmentedControl}
            options=${kRangeOptions}
            value=${range}
            onChange=${onChangeRange}
          />
        </div>
      </div>
      ${hasData
        ? html`
            <div class="h-44">
              <canvas ref=${chartCanvasRef}></canvas>
            </div>
          `
        : html`<div class="text-xs text-gray-500">No run data in this window yet.</div>`}
    </section>
  `;
};
