export const kProtectedBrowsePaths = new Set([
  "openclaw.json",
  "devices/paired.json",
]);

export const kLockedBrowsePaths = new Set([
  "hooks/bootstrap/agents.md",
  "hooks/bootstrap/tools.md",
  "skills/control-ui/skill.md",
  ".alphaclaw/hourly-git-sync.sh",
  ".alphaclaw/.cli-device-auto-approved",
]);

export const normalizeBrowsePolicyPath = (inputPath) =>
  String(inputPath || "")
    .replaceAll("\\", "/")
    .replace(/^\.\/+/, "")
    .replace(/^\/+/, "")
    .trim()
    .toLowerCase();

export const matchesBrowsePolicyPath = (policyPathSet, normalizedPath) => {
  const safeNormalizedPath = String(normalizedPath || "").trim();
  if (!safeNormalizedPath) return false;
  for (const policyPath of policyPathSet) {
    if (
      safeNormalizedPath === policyPath ||
      safeNormalizedPath.endsWith(`/${policyPath}`)
    ) {
      return true;
    }
  }
  return false;
};
