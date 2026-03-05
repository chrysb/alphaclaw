const path = require("path");

const normalizeRelativePath = (inputPath) => {
  const rawPath = String(inputPath || "").trim();
  if (!rawPath) return "";
  return rawPath.replace(/\\/g, "/").replace(/^\/+/, "");
};

const normalizePolicyPath = (inputPath) =>
  String(inputPath || "")
    .replace(/\\/g, "/")
    .replace(/^\.\/+/, "")
    .replace(/^\/+/, "")
    .trim()
    .toLowerCase();

const resolveSafePath = (inputPath, kRootResolved, kRootWithSep, kRootDisplayName) => {
  const relativePath = normalizeRelativePath(inputPath);
  const absolutePath = path.resolve(kRootResolved, relativePath);
  const isInsideRoot =
    absolutePath === kRootResolved || absolutePath.startsWith(kRootWithSep);
  if (!isInsideRoot) {
    return { ok: false, error: `Path must stay within ${kRootDisplayName}` };
  }
  return { ok: true, relativePath, absolutePath };
};

const toRelativePath = (absolutePath, kRootResolved) => {
  const relative = path.relative(kRootResolved, absolutePath);
  return relative === "" ? "" : relative.split(path.sep).join("/");
};

const matchesPolicyPath = (policyPathSet, normalizedPath) => {
  const safeNormalizedPath = String(normalizedPath || "").trim();
  if (!safeNormalizedPath) return false;
  for (const policyPath of policyPathSet) {
    if (
      safeNormalizedPath === policyPath ||
      safeNormalizedPath.endsWith(`/${policyPath}`) ||
      safeNormalizedPath.startsWith(`${policyPath}/`) ||
      safeNormalizedPath.includes(`/${policyPath}/`)
    ) {
      return true;
    }
  }
  return false;
};

module.exports = {
  normalizeRelativePath,
  normalizePolicyPath,
  resolveSafePath,
  toRelativePath,
  matchesPolicyPath,
};
