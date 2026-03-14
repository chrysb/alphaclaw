const kIntegerFormatter = new Intl.NumberFormat("en-US");
const kCompactNumberFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});
const kUsdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 3,
});

const toDateValue = (
  value,
  { valueIsUnixSeconds = false, valueIsEpochMs = false } = {},
) => {
  if (value == null || value === "") return null;
  if (value instanceof Date) return value;
  if (valueIsUnixSeconds) return new Date(Number(value) * 1000);
  if (valueIsEpochMs) return new Date(Number(value));
  return new Date(value);
};

const isSameDay = (left, right) =>
  left.getFullYear() === right.getFullYear() &&
  left.getMonth() === right.getMonth() &&
  left.getDate() === right.getDate();

export const formatInteger = (value) =>
  kIntegerFormatter.format(Number(value || 0));

export const formatCompactNumber = (value) => {
  const numberValue = Number(value || 0);
  if (!Number.isFinite(numberValue)) return "0";
  if (Math.abs(numberValue) < 1000) return formatInteger(numberValue);
  return kCompactNumberFormatter.format(numberValue);
};

export const formatBytes = (value) => {
  const bytes = Number(value || 0);
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let unitIndex = 0;
  let nextValue = bytes;
  while (nextValue >= 1024 && unitIndex < units.length - 1) {
    nextValue /= 1024;
    unitIndex += 1;
  }
  const precision = nextValue >= 100 || unitIndex === 0 ? 0 : nextValue >= 10 ? 1 : 2;
  return `${nextValue.toFixed(precision)} ${units[unitIndex]}`;
};

export const formatUsd = (value) => kUsdFormatter.format(Number(value || 0));

export const formatLocaleDateTime = (
  value,
  { fallback = "—", valueIsUnixSeconds = false, valueIsEpochMs = false } = {},
) => {
  try {
    const dateValue = toDateValue(value, { valueIsUnixSeconds, valueIsEpochMs });
    if (!dateValue || Number.isNaN(dateValue.getTime())) return fallback;
    return dateValue.toLocaleString();
  } catch {
    return fallback;
  }
};

export const formatLocaleDateTimeWithTodayTime = (
  value,
  {
    fallback = "—",
    valueIsUnixSeconds = false,
    valueIsEpochMs = false,
  } = {},
) => {
  try {
    const dateValue = toDateValue(value, { valueIsUnixSeconds, valueIsEpochMs });
    if (!dateValue || Number.isNaN(dateValue.getTime())) return fallback;
    return isSameDay(dateValue, new Date())
      ? dateValue.toLocaleTimeString()
      : dateValue.toLocaleString();
  } catch {
    return fallback;
  }
};

export const formatDurationCompactMs = (value) => {
  const ms = Number(value || 0);
  if (!Number.isFinite(ms) || ms <= 0) return "0s";
  if (ms < 1000) return `${Math.round(ms)}ms`;
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes <= 0) return `${seconds}s`;
  return `${minutes}m ${seconds}s`;
};

const parseDayKeyToLocalDate = (dayKey = "") => {
  const rawValue = String(dayKey || "").trim();
  const match = rawValue.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const year = Number.parseInt(match[1], 10);
  const monthIndex = Number.parseInt(match[2], 10) - 1;
  const dayOfMonth = Number.parseInt(match[3], 10);
  if (
    !Number.isFinite(year) ||
    !Number.isFinite(monthIndex) ||
    !Number.isFinite(dayOfMonth)
  ) {
    return null;
  }
  return new Date(year, monthIndex, dayOfMonth);
};

export const formatChartBucketLabel = (
  value,
  { range = "7d", valueType = "epoch-ms" } = {},
) => {
  let dateValue = null;
  if (valueType === "day-key") {
    dateValue = parseDayKeyToLocalDate(value);
  } else if (valueType === "epoch-ms") {
    const numericValue = Number(value);
    dateValue = Number.isFinite(numericValue) ? new Date(numericValue) : null;
  } else {
    dateValue = toDateValue(value);
  }
  if (!dateValue || Number.isNaN(dateValue.getTime())) return String(value ?? "");
  const normalizedRange = String(range || "").trim().toLowerCase();
  if (normalizedRange === "24h") {
    return dateValue.toLocaleTimeString([], {
      hour: "numeric",
    });
  }
  if (normalizedRange === "7d") {
    return dateValue.toLocaleDateString([], {
      weekday: "short",
      month: "numeric",
      day: "numeric",
    });
  }
  return dateValue.toLocaleDateString([], {
    month: "numeric",
    day: "numeric",
  });
};
