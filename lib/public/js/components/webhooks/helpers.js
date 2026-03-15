import {
  formatLocaleDateTime,
  formatLocaleDateTimeWithTodayTime,
} from "../../lib/format.js";

export const kNamePattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const kStatusFilters = ["all", "success", "error"];

export const formatDateTime = (value) => {
  return formatLocaleDateTime(value, { fallback: "—" });
};

export const formatLastReceived = (value) => {
  return formatLocaleDateTimeWithTodayTime(value, { fallback: "—" });
};

export const formatBytes = (size) => {
  const bytes = Number(size || 0);
  if (!Number.isFinite(bytes) || bytes <= 0) return "0B";
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
};

export const healthClassName = (health) => {
  if (health === "red") return "bg-red-500";
  if (health === "yellow") return "bg-yellow-500";
  return "bg-green-500";
};

export const getRequestStatusTone = (status) => {
  if (status === "success") {
    return {
      dotClass: "bg-green-500/90",
      textClass: "text-green-500/90",
    };
  }
  if (status === "error") {
    return {
      dotClass: "bg-red-500/90",
      textClass: "text-red-500/90",
    };
  }
  return {
    dotClass: "bg-gray-500/70",
    textClass: "text-gray-400",
  };
};

export const formatAgentFallbackName = (agentId = "") =>
  String(agentId || "")
    .trim()
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ") || "Main Agent";

export const jsonPretty = (value) => {
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return value;
    }
  }
  try {
    return JSON.stringify(value || {}, null, 2);
  } catch {
    return String(value || "");
  }
};

export const buildWebhookDebugMessage = ({
  hookName = "",
  webhook = null,
  request = null,
}) => {
  const hookPath =
    String(webhook?.path || "").trim() ||
    (hookName ? `/hooks/${hookName}` : "/hooks/unknown");
  const gatewayStatus =
    request?.gatewayStatus == null ? "n/a" : String(request.gatewayStatus);
  return [
    "Investigate this failed webhook request and share findings before fixing anything.",
    "Reply with your diagnosis first, including the likely root cause, any relevant risks, and what you would change if I approve a fix.",
    "",
    `Webhook: ${hookPath}`,
    `Request ID: ${String(request?.id || "unknown")}`,
    `Time: ${String(request?.createdAt || "unknown")}`,
    `Method: ${String(request?.method || "unknown")}`,
    `Source IP: ${String(request?.sourceIp || "unknown")}`,
    `Gateway status: ${gatewayStatus}`,
    `Transform path: ${String(webhook?.transformPath || "unknown")}`,
    `Payload truncated: ${request?.payloadTruncated ? "yes" : "no"}`,
    "",
    "Headers:",
    jsonPretty(request?.headers),
    "",
    "Payload:",
    jsonPretty(request?.payload),
    "",
    "Gateway response:",
    jsonPretty(request?.gatewayBody),
  ].join("\n");
};
