export const kColorPalette = [
  "#7dd3fc",
  "#22d3ee",
  "#fbbf24",
  "#34d399",
  "#fb7185",
  "#a78bfa",
  "#f472b6",
  "#60a5fa",
  "#4ade80",
  "#f97316",
];

export const kBadgeToneClass = {
  cyan: "border-cyan-400/30 text-cyan-300 bg-cyan-400/10",
  blue: "border-blue-400/30 text-blue-300 bg-blue-400/10",
  purple: "border-purple-400/30 text-purple-300 bg-purple-400/10",
  gray: "border-gray-400/30 text-gray-400 bg-gray-400/10",
};

export const kRangeOptions = [
  { label: "7d", value: 7 },
  { label: "30d", value: 30 },
  { label: "90d", value: 90 },
];

export const kDefaultUsageDays = 30;
export const kDefaultUsageMetric = "tokens";
export const kDefaultUsageBreakdown = "model";
export const kUsageDaysUiSettingKey = "usageDays";
export const kUsageMetricUiSettingKey = "usageMetric";
export const kUsageBreakdownUiSettingKey = "usageBreakdown";
export const kUsageSourceOrder = ["chat", "hooks", "cron"];

export const kUsageBreakdownOptions = [
  { label: "Model breakdown", value: "model" },
  { label: "Type breakdown", value: "source" },
  { label: "Agent breakdown", value: "agent" },
];
