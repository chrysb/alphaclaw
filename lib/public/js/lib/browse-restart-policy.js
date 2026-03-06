const kBrowseRestartRequiredRules = [
  { type: "file", path: "openclaw.json" },
  { type: "directory", path: "hooks/transforms" },
];

const normalizeRestartRulePath = (value) =>
  String(value || "")
    .trim()
    .replace(/^\/+|\/+$/g, "");

const matchesBrowseRestartRequiredRule = (path, rule) => {
  const normalizedPath = normalizeRestartRulePath(path);
  if (!normalizedPath) return false;
  if (!rule || typeof rule !== "object") return false;
  const type = String(rule.type || "").toLowerCase();
  const targetPath = normalizeRestartRulePath(rule.path);
  if (!targetPath) return false;
  if (type === "directory") {
    return normalizedPath === targetPath || normalizedPath.startsWith(`${targetPath}/`);
  }
  if (type === "file") {
    return normalizedPath === targetPath;
  }
  return false;
};

export const shouldRequireRestartForBrowsePath = (path) =>
  kBrowseRestartRequiredRules.some((rule) => matchesBrowseRestartRequiredRule(path, rule));
