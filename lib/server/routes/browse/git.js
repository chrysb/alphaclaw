const { execFile } = require("child_process");

const runGitCommand = (args, kRootResolved) =>
  new Promise((resolve) => {
    execFile(
      "git",
      args,
      { timeout: 10000, cwd: kRootResolved },
      (error, stdout, stderr) => {
        if (error) {
          return resolve({
            ok: false,
            error: String(
              stderr || stdout || error.message || "git command failed",
            ).trim(),
          });
        }
        return resolve({ ok: true, stdout: String(stdout || "") });
      },
    );
  });

const runGitCommandWithExitCode = (args, kRootResolved) =>
  new Promise((resolve) => {
    execFile(
      "git",
      args,
      { timeout: 10000, cwd: kRootResolved },
      (error, stdout, stderr) => {
        const safeStdout = String(stdout || "");
        const safeStderr = String(stderr || "");
        if (!error) {
          return resolve({
            ok: true,
            stdout: safeStdout,
            stderr: safeStderr,
            exitCode: 0,
          });
        }
        return resolve({
          ok: false,
          stdout: safeStdout,
          stderr: safeStderr,
          exitCode: Number.isInteger(error.code) ? error.code : 1,
          error: String(error.message || "git command failed"),
        });
      },
    );
  });

const parseGithubRepoSlug = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  return raw
    .replace(/^git@github\.com:/i, "")
    .replace(/^https:\/\/github\.com\//i, "")
    .replace(/\.git$/i, "")
    .trim();
};

const normalizeChangedPath = (rawPath) => {
  const value = String(rawPath || "").trim();
  if (!value) return "";
  if (value.includes(" -> ")) {
    const segments = value.split(" -> ");
    return String(segments[segments.length - 1] || "").trim();
  }
  return value;
};

const parseBranchTracking = (branchLine) => {
  const safeBranchLine = String(branchLine || "").trim();
  const withoutPrefix = safeBranchLine.replace(/^##\s*/, "");
  const [localBranchRaw = "", trackingRaw = ""] = withoutPrefix.split("...");
  const localBranch = localBranchRaw || "unknown";
  const trackingSegment = String(trackingRaw || "").trim();
  const upstreamBranch = trackingSegment.split(" [")[0]?.trim() || "";
  const hasUpstream = upstreamBranch.length > 0;
  const countsMatch = trackingSegment.match(/\[([^\]]+)\]/);
  const countsRaw = countsMatch?.[1] || "";
  const countParts = countsRaw
    .split(",")
    .map((part) => String(part || "").trim())
    .filter(Boolean);
  let aheadCount = 0;
  let behindCount = 0;
  let upstreamGone = false;
  countParts.forEach((part) => {
    const aheadMatch = part.match(/^ahead\s+(\d+)$/i);
    if (aheadMatch?.[1]) {
      aheadCount = Number.parseInt(aheadMatch[1], 10) || 0;
      return;
    }
    const behindMatch = part.match(/^behind\s+(\d+)$/i);
    if (behindMatch?.[1]) {
      behindCount = Number.parseInt(behindMatch[1], 10) || 0;
      return;
    }
    if (part.toLowerCase() === "gone") {
      upstreamGone = true;
    }
  });
  const syncState = !hasUpstream
    ? "no-upstream"
    : upstreamGone
      ? "upstream-gone"
      : aheadCount > 0 && behindCount > 0
        ? "diverged"
        : aheadCount > 0
          ? "ahead"
          : behindCount > 0
            ? "behind"
            : "up-to-date";
  return {
    branch: localBranch,
    upstreamBranch,
    hasUpstream,
    upstreamGone,
    aheadCount,
    behindCount,
    syncState,
  };
};

module.exports = {
  runGitCommand,
  runGitCommandWithExitCode,
  parseGithubRepoSlug,
  normalizeChangedPath,
  parseBranchTracking,
};
