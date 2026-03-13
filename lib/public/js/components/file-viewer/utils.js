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

export const countTextLines = (content) => {
  const text = String(content || "");
  if (!text) return 1;
  return text.split(/\r\n|\r|\n/).length;
};

export const shouldUseSimpleEditorMode = ({
  contentLength = 0,
  lineCount = 1,
  charThreshold = 250000,
  lineThreshold = 5000,
}) =>
  Number(contentLength) > Number(charThreshold) ||
  Number(lineCount) > Number(lineThreshold);
