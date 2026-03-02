const normalizeGitSyncFilePath = (requestedFilePath) => {
  const rawPath = String(requestedFilePath || "").trim();
  if (!rawPath) return "";
  return rawPath.replace(/\\/g, "/").replace(/^\.\/+/, "");
};

const validateGitSyncFilePath = (normalizedFilePath) => {
  if (!normalizedFilePath) return { ok: true };
  if (
    normalizedFilePath.startsWith("/") ||
    normalizedFilePath.startsWith("../") ||
    normalizedFilePath.includes("/../")
  ) {
    return {
      ok: false,
      error: "[alphaclaw] --file must stay within /data/.openclaw",
    };
  }
  return { ok: true };
};

module.exports = {
  normalizeGitSyncFilePath,
  validateGitSyncFilePath,
};
