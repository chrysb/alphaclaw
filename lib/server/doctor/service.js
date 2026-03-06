const fs = require("fs");
const path = require("path");
const { buildDoctorPrompt } = require("./prompt");
const { normalizeDoctorResult } = require("./normalize");
const { calculateWorkspaceDelta, computeWorkspaceSnapshot } = require("./workspace-fingerprint");
const {
  kDoctorEngine,
  kDoctorMeaningfulChangeScoreThreshold,
  kDoctorPromptVersion,
  kDoctorRunStatus,
  kDoctorRunTimeoutMs,
  kDoctorStaleThresholdMs,
} = require("./constants");

const kMaxSnippetLines = 20;

const shellEscapeArg = (value) => {
  const safeValue = String(value || "");
  return `'${safeValue.replace(/'/g, `'\\''`)}'`;
};

const hasValidIsoTime = (value) => {
  const timestamp = Date.parse(String(value || ""));
  return Number.isFinite(timestamp);
};

const formatElapsedSince = (isoTime) => {
  if (!hasValidIsoTime(isoTime)) return "the last scan";
  const elapsedMs = Math.max(0, Date.now() - Date.parse(isoTime));
  const elapsedMinutes = Math.max(1, Math.round(elapsedMs / 60000));
  if (elapsedMinutes < 60) {
    return `${elapsedMinutes} minute${elapsedMinutes === 1 ? "" : "s"} ago`;
  }
  const elapsedHours = Math.round(elapsedMinutes / 60);
  if (elapsedHours < 24) {
    return `${elapsedHours} hour${elapsedHours === 1 ? "" : "s"} ago`;
  }
  const elapsedDays = Math.round(elapsedHours / 24);
  return `${elapsedDays} day${elapsedDays === 1 ? "" : "s"} ago`;
};

const readFileSnippet = (rootDir, relativePath, startLine, endLine) => {
  try {
    const fullPath = path.join(rootDir, String(relativePath || ""));
    const content = fs.readFileSync(fullPath, "utf-8");
    const lines = content.split("\n");
    const start = Math.max(0, (startLine || 1) - 1);
    const end = endLine && endLine >= startLine ? Math.min(lines.length, endLine) : start + 1;
    const cappedEnd = Math.min(end, start + kMaxSnippetLines);
    return {
      text: lines.slice(start, cappedEnd).join("\n"),
      startLine: start + 1,
      endLine: start + (cappedEnd - start),
      truncated: cappedEnd < end,
      totalFileLines: lines.length,
    };
  } catch {
    return null;
  }
};

const captureEvidenceSnippets = (cards, rootDir) => {
  for (const card of cards) {
    if (!Array.isArray(card.evidence)) continue;
    for (const item of card.evidence) {
      if (!item || item.type !== "path" || !item.path || !item.startLine) continue;
      const snippet = readFileSnippet(rootDir, item.path, item.startLine, item.endLine);
      if (snippet) item.snippet = snippet;
    }
  }
};

const buildDoctorSessionKey = (runId) => `agent:main:doctor:${Number(runId || 0)}`;
const buildDoctorSessionId = (runId) => buildDoctorSessionKey(runId);
const buildDoctorIdempotencyKey = (runId) => `doctor-run-${Number(runId || 0)}`;

const createDoctorService = ({
  clawCmd,
  listDoctorRuns,
  listDoctorCards,
  getInitialWorkspaceBaseline,
  setInitialWorkspaceBaseline,
  createDoctorRun,
  completeDoctorRun,
  insertDoctorCards,
  getDoctorRun,
  getDoctorCardsByRunId,
  getDoctorCard,
  updateDoctorCardStatus,
  workspaceRoot,
  managedRoot,
  protectedPaths = [],
  lockedPaths = [],
}) => {
  const state = {
    activeRunId: 0,
    activeRunPromise: null,
    snapshotCache: null,
  };

  const getLatestCompletedRun = () =>
    listDoctorRuns({ limit: 25 }).find((run) => run.status === kDoctorRunStatus.completed) || null;

  const getCurrentWorkspaceSnapshot = () => {
    const now = Date.now();
    if (state.snapshotCache && now - state.snapshotCache.computedAt < 5000) {
      return state.snapshotCache.snapshot;
    }
    const snapshot = computeWorkspaceSnapshot(workspaceRoot);
    state.snapshotCache = {
      computedAt: now,
      snapshot,
    };
    return snapshot;
  };

  const getOrCreateInitialBaseline = () => {
    const existingBaseline = getInitialWorkspaceBaseline?.();
    if (existingBaseline?.fingerprint && existingBaseline?.manifest) {
      return existingBaseline;
    }
    const snapshot = getCurrentWorkspaceSnapshot();
    const nextBaseline = {
      fingerprint: snapshot.fingerprint,
      manifest: snapshot.manifest,
      capturedAt: new Date().toISOString(),
    };
    return setInitialWorkspaceBaseline?.(nextBaseline) || nextBaseline;
  };

  const cloneRunCards = ({ sourceRunId, targetRunId }) => {
    const sourceCards = getDoctorCardsByRunId(sourceRunId);
    insertDoctorCards({
      runId: targetRunId,
      cards: sourceCards,
    });
  };

  const buildStatus = () => {
    const recentRuns = listDoctorRuns({ limit: 10 });
    const latestRun = recentRuns[0] || null;
    const latestCompletedRun =
      recentRuns.find((run) => run.status === kDoctorRunStatus.completed) || null;
    const lastRunAt =
      latestCompletedRun?.completedAt || latestCompletedRun?.startedAt || null;
    const lastRunAgeMs = hasValidIsoTime(lastRunAt) ? Date.now() - Date.parse(lastRunAt) : null;
    const stale = lastRunAgeMs == null || lastRunAgeMs >= kDoctorStaleThresholdMs;
    const baselineRun = latestCompletedRun;
    const initialBaseline = !baselineRun ? getOrCreateInitialBaseline() : null;
    const currentSnapshot = baselineRun || initialBaseline ? getCurrentWorkspaceSnapshot() : null;
    const baselineManifest =
      baselineRun?.workspaceManifest && typeof baselineRun.workspaceManifest === "object"
        ? baselineRun.workspaceManifest
        : initialBaseline?.manifest && typeof initialBaseline.manifest === "object"
          ? initialBaseline.manifest
          : null;
    const hasManifestBaseline = !!baselineManifest;
    const delta =
      hasManifestBaseline && currentSnapshot
        ? calculateWorkspaceDelta({
            previousManifest: baselineManifest,
            currentManifest: currentSnapshot.manifest,
          })
        : {
            addedFilesCount: 0,
            removedFilesCount: 0,
            modifiedFilesCount: 0,
            changedFilesCount: 0,
            deltaScore: 0,
            changedPaths: [],
          };
    const hasMeaningfulChanges =
      !!latestCompletedRun &&
      delta.deltaScore >= kDoctorMeaningfulChangeScoreThreshold;
    return {
      activeRunId: state.activeRunId || 0,
      runInProgress: !!state.activeRunPromise,
      lastRunAt,
      lastRunAgeMs,
      needsInitialRun: !latestCompletedRun,
      stale,
      changeSummary: {
        ...delta,
        hasBaseline: hasManifestBaseline,
        baselineSource: baselineRun ? "last_run" : initialBaseline ? "initial_install" : "none",
        hasMeaningfulChanges,
      },
      latestRun,
    };
  };

  const executeDoctorRun = async (runId) => {
    try {
      const allCards = listDoctorCards();
      const resolvedCards = allCards
        .filter((card) => card.status === "dismissed" || card.status === "fixed")
        .map((card) => ({
          status: card.status,
          title: card.title || "",
          category: card.category || "",
        }));
      const prompt = buildDoctorPrompt({
        workspaceRoot,
        managedRoot,
        protectedPaths,
        lockedPaths,
        resolvedCards,
        promptVersion: kDoctorPromptVersion,
      });
      const gatewayTimeoutMs = kDoctorRunTimeoutMs + 30000;
      const gatewayParams = {
        agentId: "main",
        idempotencyKey: buildDoctorIdempotencyKey(runId),
        message: prompt,
        sessionKey: buildDoctorSessionKey(runId),
        thinking: "medium",
        timeout: Math.round(kDoctorRunTimeoutMs / 1000),
      };
      const result = await clawCmd(
        `gateway call agent --expect-final --json --timeout ${gatewayTimeoutMs} --params ${shellEscapeArg(
          JSON.stringify(gatewayParams),
        )}`,
        {
          quiet: true,
          timeoutMs: gatewayTimeoutMs,
        },
      );
      if (!result?.ok) {
        throw new Error(result?.stderr || "Doctor analysis command failed");
      }
      const stdoutText = String(result.stdout || "");
      const stderrText = String(result.stderr || "");
      let normalizedResult = null;
      try {
        normalizedResult = normalizeDoctorResult(stdoutText);
      } catch (error) {
        console.error(
          `[doctor] run ${runId} normalize failed: ${error.message || "Unknown error"}`,
        );
        console.error(`[doctor] run ${runId} stdout begin`);
        console.error(stdoutText || "(empty)");
        console.error(`[doctor] run ${runId} stdout end`);
        console.error(`[doctor] run ${runId} stderr begin`);
        console.error(stderrText || "(empty)");
        console.error(`[doctor] run ${runId} stderr end`);
        throw error;
      }
      captureEvidenceSnippets(normalizedResult.cards, workspaceRoot);
      insertDoctorCards({
        runId,
        cards: normalizedResult.cards,
      });
      completeDoctorRun({
        id: runId,
        status: kDoctorRunStatus.completed,
        summary: normalizedResult.summary,
        rawResult: normalizedResult.rawPayload,
      });
    } catch (error) {
      completeDoctorRun({
        id: runId,
        status: kDoctorRunStatus.failed,
        error: error.message || "Doctor run failed",
      });
    } finally {
      state.activeRunId = 0;
      state.activeRunPromise = null;
    }
  };

  const runDoctor = () => {
    if (state.activeRunPromise) {
      return {
        ok: false,
        alreadyRunning: true,
        runId: state.activeRunId || 0,
        status: buildStatus(),
        error: "Doctor run already in progress",
      };
    }
    const workspaceSnapshot = getCurrentWorkspaceSnapshot();
    const workspaceFingerprint = workspaceSnapshot.fingerprint;
    const latestCompletedRun = getLatestCompletedRun();
    if (
      latestCompletedRun &&
      latestCompletedRun.workspaceFingerprint &&
      latestCompletedRun.workspaceFingerprint === workspaceFingerprint
    ) {
      const runId = createDoctorRun({
        status: kDoctorRunStatus.completed,
        engine: kDoctorEngine.deterministicReuse,
        workspaceRoot,
        workspaceFingerprint,
        workspaceManifest: workspaceSnapshot.manifest,
        promptVersion: kDoctorPromptVersion,
        reusedFromRunId: latestCompletedRun.id,
      });
      cloneRunCards({
        sourceRunId: latestCompletedRun.id,
        targetRunId: runId,
      });
      const summary = `No workspace changes since last scan (${formatElapsedSince(
        latestCompletedRun.completedAt || latestCompletedRun.startedAt,
      )}). Same findings apply.`;
      completeDoctorRun({
        id: runId,
        status: kDoctorRunStatus.completed,
        summary,
        rawResult: latestCompletedRun.rawResult,
      });
      return {
        ok: true,
        runId,
        reusedPreviousRun: true,
        sourceRunId: latestCompletedRun.id,
        status: buildStatus(),
      };
    }
    const runId = createDoctorRun({
      status: kDoctorRunStatus.running,
      engine: kDoctorEngine.gatewayAgent,
      workspaceRoot,
      workspaceFingerprint,
      workspaceManifest: workspaceSnapshot.manifest,
      promptVersion: kDoctorPromptVersion,
    });
    state.activeRunId = runId;
    state.activeRunPromise = executeDoctorRun(runId);
    return {
      ok: true,
      runId,
      status: buildStatus(),
    };
  };

  const importDoctorResult = ({
    rawOutput,
    engine = kDoctorEngine.manualImport,
  } = {}) => {
    const normalizedRawOutput = String(rawOutput || "");
    if (!normalizedRawOutput.trim()) {
      throw new Error("Doctor import requires raw output");
    }
    const normalizedResult = normalizeDoctorResult(normalizedRawOutput);
    captureEvidenceSnippets(normalizedResult.cards, workspaceRoot);
    const workspaceSnapshot = getCurrentWorkspaceSnapshot();
    const runId = createDoctorRun({
      status: kDoctorRunStatus.completed,
      engine,
      workspaceRoot,
      workspaceFingerprint: workspaceSnapshot.fingerprint,
      workspaceManifest: workspaceSnapshot.manifest,
      promptVersion: kDoctorPromptVersion,
    });
    insertDoctorCards({
      runId,
      cards: normalizedResult.cards,
    });
    completeDoctorRun({
      id: runId,
      status: kDoctorRunStatus.completed,
      summary: normalizedResult.summary,
      rawResult: normalizedResult.rawPayload,
    });
    return {
      ok: true,
      runId,
      run: getDoctorRun(runId),
    };
  };

  const requestCardFix = async ({
    cardId,
    sessionId = "",
    replyChannel = "",
    replyTo = "",
    prompt = "",
  } = {}) => {
    const card = getDoctorCard(cardId);
    if (!card) throw new Error("Doctor card not found");
    const resolvedPrompt = String(prompt || card.fixPrompt || "").trim();
    if (!resolvedPrompt) throw new Error("Doctor card does not include a fix prompt");
    let command = `agent --agent main --message ${shellEscapeArg(resolvedPrompt)}`;
    const trimmedSessionId = String(sessionId || "").trim();
    const trimmedReplyChannel = String(replyChannel || "").trim();
    const trimmedReplyTo = String(replyTo || "").trim();
    if (trimmedReplyChannel && trimmedReplyTo) {
      command +=
        ` --deliver --reply-channel ${shellEscapeArg(trimmedReplyChannel)}` +
        ` --reply-to ${shellEscapeArg(trimmedReplyTo)}`;
    } else if (trimmedSessionId) {
      command += ` --session-id ${shellEscapeArg(trimmedSessionId)}`;
    }
    const result = await clawCmd(command, {
      quiet: true,
      timeoutMs: kDoctorRunTimeoutMs,
    });
    if (!result?.ok) {
      throw new Error(result?.stderr || "Could not send Doctor fix request");
    }
    return {
      ok: true,
      stdout: result.stdout || "",
      card,
    };
  };

  const setCardStatus = ({ cardId, status }) => {
    const updatedCard = updateDoctorCardStatus({
      id: cardId,
      status,
    });
    if (!updatedCard) throw new Error("Doctor card not found");
    return updatedCard;
  };

  return {
    buildStatus,
    runDoctor,
    importDoctorResult,
    listDoctorRuns,
    listDoctorCards,
    getDoctorRun,
    getDoctorCardsByRunId,
    requestCardFix,
    setCardStatus,
    getDoctorCard,
  };
};

module.exports = {
  buildDoctorIdempotencyKey,
  buildDoctorSessionKey,
  buildDoctorSessionId,
  createDoctorService,
};
