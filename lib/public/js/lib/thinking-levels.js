const kThinkingLevelLabelOverrides = {
  off: "Off",
  on: "On",
  minimal: "Minimal",
  low: "Low",
  medium: "Medium",
  high: "High",
  adaptive: "Adaptive",
  xhigh: "Extra high",
  max: "Maximum",
};

export const formatThinkingLevelLabel = (levelId = "") => {
  const normalized = String(levelId || "").trim().toLowerCase();
  if (!normalized) return "";
  if (kThinkingLevelLabelOverrides[normalized]) {
    return kThinkingLevelLabelOverrides[normalized];
  }
  return normalized
    .split(/[-_]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

export const formatInheritedThinkingLabel = (levelId = "") => {
  const label = formatThinkingLevelLabel(levelId);
  return label ? `Inherited: ${label}` : "Inherited";
};

export const shouldShowThinkingLevelSelect = (levels = []) => {
  const normalized = (Array.isArray(levels) ? levels : [])
    .map((entry) => String(entry?.id || entry || "").trim().toLowerCase())
    .filter(Boolean);
  if (normalized.length === 0) return false;
  return !(normalized.length === 1 && normalized[0] === "off");
};
