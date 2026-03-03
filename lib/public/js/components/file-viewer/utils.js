export const parsePathSegments = (inputPath) =>
  String(inputPath || "")
    .split("/")
    .map((part) => part.trim())
    .filter(Boolean);

export const clampSelectionIndex = (value, maxValue) => {
  const numericValue = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(numericValue)) return 0;
  return Math.max(0, Math.min(maxValue, numericValue));
};
