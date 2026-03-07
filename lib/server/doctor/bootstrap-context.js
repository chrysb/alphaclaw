const fs = require("fs");
const path = require("path");

const kDoctorBootstrapMaxChars = 20000;
const kDoctorBootstrapTotalMaxChars = 150000;
const kDoctorBootstrapNearLimitRatio = 0.9;
const kDoctorContextTruncationGuidance =
  "OpenClaw trims oversized injected files by keeping the first 70%, keeping the last 20%, and cutting the middle 10% without a warning.";

const kDoctorRootContextFiles = [
  { path: "AGENTS.md", injectMode: "always" },
  { path: "SOUL.md", injectMode: "always" },
  { path: "TOOLS.md", injectMode: "always" },
  { path: "IDENTITY.md", injectMode: "always" },
  { path: "USER.md", injectMode: "always" },
  { path: "HEARTBEAT.md", injectMode: "always" },
  { path: "BOOTSTRAP.md", injectMode: "first_run_only" },
];

const kDoctorBootstrapExtraFiles = [
  { path: "hooks/bootstrap/AGENTS.md", injectMode: "always" },
  { path: "hooks/bootstrap/TOOLS.md", injectMode: "always" },
];

const kDoctorBootstrapContextFiles = [...kDoctorRootContextFiles, ...kDoctorBootstrapExtraFiles];

const readWorkspaceFileChars = (workspaceRoot, relativePath) => {
  const fullPath = path.join(workspaceRoot, relativePath);
  try {
    const content = fs.readFileSync(fullPath, "utf8");
    return {
      exists: true,
      chars: content.length,
    };
  } catch {
    return {
      exists: false,
      chars: 0,
    };
  }
};

const analyzeBootstrapContext = ({
  workspaceRoot = "",
  bootstrapMaxChars = kDoctorBootstrapMaxChars,
  bootstrapTotalMaxChars = kDoctorBootstrapTotalMaxChars,
} = {}) => {
  const files = kDoctorBootstrapContextFiles.map((spec) => {
    const fileState = readWorkspaceFileChars(workspaceRoot, spec.path);
    const rawChars = fileState.chars;
    const fileLimitChars = Math.min(rawChars, bootstrapMaxChars);
    const nearFileLimit = rawChars > 0 && rawChars >= Math.floor(bootstrapMaxChars * kDoctorBootstrapNearLimitRatio);
    return {
      ...spec,
      exists: fileState.exists,
      rawChars,
      fileLimitChars,
      injectedChars: 0,
      truncatedByFileLimit: rawChars > bootstrapMaxChars,
      truncatedByTotalLimit: false,
      truncated: rawChars > bootstrapMaxChars,
      nearFileLimit: nearFileLimit && rawChars <= bootstrapMaxChars,
      active: spec.injectMode === "always",
      reason: rawChars > bootstrapMaxChars ? "file_limit" : "",
    };
  });

  let injectedTotalChars = 0;
  for (const file of files) {
    if (!file.active || !file.exists) continue;
    const remainingChars = Math.max(0, bootstrapTotalMaxChars - injectedTotalChars);
    file.injectedChars = Math.min(file.fileLimitChars, remainingChars);
    file.truncatedByTotalLimit = file.fileLimitChars > file.injectedChars;
    file.truncated = file.truncatedByFileLimit || file.truncatedByTotalLimit;
    if (file.truncatedByFileLimit && file.truncatedByTotalLimit) {
      file.reason = "file_and_total_limit";
    } else if (file.truncatedByFileLimit) {
      file.reason = "file_limit";
    } else if (file.truncatedByTotalLimit) {
      file.reason = "total_limit";
    }
    injectedTotalChars += file.injectedChars;
  }

  const activeFiles = files.filter((file) => file.active && file.exists);
  const activeTruncatedFiles = activeFiles.filter((file) => file.truncated);
  const activeNearLimitFiles = activeFiles.filter((file) => file.nearFileLimit && !file.truncated);
  const inactiveTruncatedFiles = files.filter((file) => !file.active && file.exists && file.truncated);
  const hasTotalLimitTruncation = activeTruncatedFiles.some(
    (file) => file.reason === "total_limit" || file.reason === "file_and_total_limit",
  );

  return {
    bootstrapMaxChars,
    bootstrapTotalMaxChars,
    truncationGuidance: kDoctorContextTruncationGuidance,
    files,
    activeFiles,
    activeRawChars: activeFiles.reduce((sum, file) => sum + file.rawChars, 0),
    activeInjectedChars: activeFiles.reduce((sum, file) => sum + file.injectedChars, 0),
    hasActiveTruncation: activeTruncatedFiles.length > 0,
    hasActiveNearLimitFiles: activeNearLimitFiles.length > 0,
    hasActiveWarnings: activeTruncatedFiles.length > 0 || activeNearLimitFiles.length > 0,
    hasAnyTruncation: activeTruncatedFiles.length > 0 || inactiveTruncatedFiles.length > 0,
    activeTruncatedFiles,
    activeNearLimitFiles,
    inactiveTruncatedFiles,
    hasTotalLimitTruncation,
    totalLimitReached: injectedTotalChars >= bootstrapTotalMaxChars,
  };
};

const formatChars = (value = 0) => `${Number(value || 0).toLocaleString()} chars`;

const buildBootstrapTruncationCards = (bootstrapContext = null) => {
  if (!bootstrapContext?.hasActiveTruncation) return [];

  const cards = bootstrapContext.activeTruncatedFiles
    .filter((file) => file.reason === "file_limit")
    .map((file) => ({
      priority: "P0",
      category: "project context",
      title: `${file.path} is being truncated in Project Context`,
      summary:
        `${file.path} is ${formatChars(file.rawChars)}, above the per-file Project Context limit ` +
        `of ${formatChars(bootstrapContext.bootstrapMaxChars)}. The agent is not seeing the full file.`,
      recommendation:
        `Move the most important rules to the top of ${file.path}, shorten or split low-priority content, ` +
        `and increase OpenClaw's bootstrap limits if this file legitimately needs more room. ` +
        kDoctorContextTruncationGuidance,
      evidence: [
        { type: "path", path: file.path },
        {
          type: "text",
          text:
            `Raw size: ${formatChars(file.rawChars)}. ` +
            `Per-file limit: ${formatChars(bootstrapContext.bootstrapMaxChars)}.`,
        },
      ],
      targetPaths: [{ path: file.path }],
      fixPrompt:
        `Reorganize ${file.path} so the most important instructions appear at the top and reduce unnecessary length. ` +
        `Do not change unrelated behavior.`,
      status: "open",
    }));

  const totalLimitedFiles = bootstrapContext.activeTruncatedFiles.filter(
    (file) => file.reason === "total_limit" || file.reason === "file_and_total_limit",
  );
  if (totalLimitedFiles.length > 0) {
    cards.unshift({
      priority: "P0",
      category: "project context",
      title: "Project Context total bootstrap limit is truncating injected files",
      summary:
        `Injected workspace guidance needs ${formatChars(bootstrapContext.activeRawChars)} raw across active ` +
        `Project Context files, exceeding the total bootstrap budget of ` +
        `${formatChars(bootstrapContext.bootstrapTotalMaxChars)}.`,
      recommendation:
        `Reduce total Project Context size across injected guidance files, keep critical instructions near the top, ` +
        `and raise OpenClaw's total bootstrap budget if the workspace legitimately needs more injected guidance. ` +
        kDoctorContextTruncationGuidance,
      evidence: totalLimitedFiles.map((file) => ({
        type: "text",
        text:
          `${file.path}: raw ${formatChars(file.rawChars)}, injected ${formatChars(file.injectedChars)} ` +
          `before the total limit stopped more content from being included.`,
      })),
      targetPaths: totalLimitedFiles.map((file) => ({ path: file.path })),
      fixPrompt:
        `Reduce the combined size of the affected Project Context files and keep the most important instructions near the top. ` +
        `Only edit the files listed in the finding.`,
      status: "open",
    });
  }

  return cards;
};

module.exports = {
  analyzeBootstrapContext,
  buildBootstrapTruncationCards,
  formatChars,
  kDoctorBootstrapContextFiles,
  kDoctorBootstrapExtraFiles,
  kDoctorBootstrapMaxChars,
  kDoctorBootstrapNearLimitRatio,
  kDoctorBootstrapTotalMaxChars,
  kDoctorContextTruncationGuidance,
  kDoctorRootContextFiles,
};
