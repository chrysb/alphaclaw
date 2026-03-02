export const parseFrontmatter = (markdown) => {
  const value = String(markdown || "");
  if (!(value.startsWith("---\n") || value === "---")) {
    return { entries: [], body: value };
  }
  const lines = value.split("\n");
  if (lines[0] !== "---") {
    return { entries: [], body: value };
  }
  const closingFenceIndex = lines.findIndex(
    (line, index) => index > 0 && line === "---",
  );
  if (closingFenceIndex === -1) {
    return { entries: [], body: value };
  }
  const frontmatterLines = lines.slice(1, closingFenceIndex);
  const bodyLines = lines.slice(closingFenceIndex + 1);
  const entries = frontmatterLines
    .map((line) => {
      const separatorIndex = line.indexOf(":");
      if (separatorIndex <= 0) return null;
      const key = line.slice(0, separatorIndex).trim();
      const rawValue = line.slice(separatorIndex + 1).trim();
      if (!key) return null;
      return { key, rawValue };
    })
    .filter((entry) => entry !== null);
  return {
    entries,
    body: bodyLines.join("\n").replace(/^\n+/, ""),
  };
};

export const formatFrontmatterValue = (rawValue) => {
  const trimmedValue = String(rawValue || "").trim();
  if (!trimmedValue) return trimmedValue;
  if (
    (trimmedValue.startsWith("{") && trimmedValue.endsWith("}")) ||
    (trimmedValue.startsWith("[") && trimmedValue.endsWith("]"))
  ) {
    try {
      const parsedValue = JSON.parse(trimmedValue);
      return JSON.stringify(parsedValue, null, 2);
    } catch {
      return trimmedValue;
    }
  }
  return trimmedValue;
};
