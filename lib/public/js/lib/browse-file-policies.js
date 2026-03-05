const kBrowseFilePoliciesUrl = new URL(
  "../../shared/browse-file-policies.json",
  import.meta.url,
);

let kBrowseFilePolicies = {
  protectedPaths: [],
  lockedPaths: [],
};
try {
  const policyResponse = await fetch(kBrowseFilePoliciesUrl);
  if (policyResponse.ok) {
    const policyJson = await policyResponse.json();
    if (policyJson && typeof policyJson === "object") {
      kBrowseFilePolicies = policyJson;
    }
  }
} catch {}

export const kProtectedBrowsePaths = new Set(
  Array.isArray(kBrowseFilePolicies?.protectedPaths)
    ? kBrowseFilePolicies.protectedPaths
    : [],
);

export const kLockedBrowsePaths = new Set(
  Array.isArray(kBrowseFilePolicies?.lockedPaths)
    ? kBrowseFilePolicies.lockedPaths
    : [],
);

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
      safeNormalizedPath.endsWith(`/${policyPath}`) ||
      safeNormalizedPath.startsWith(`${policyPath}/`) ||
      safeNormalizedPath.includes(`/${policyPath}/`)
    ) {
      return true;
    }
  }
  return false;
};
