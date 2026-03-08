const {
  createOnboardingService,
  getImportedPlaceholderReview,
} = require("../onboarding");
const path = require("path");
const { scanWorkspace } = require("../onboarding/import/import-scanner");
const {
  detectSecrets,
  extractPreFillValues,
} = require("../onboarding/import/secret-detector");
const {
  promoteCloneToTarget,
  alignHookTransforms,
  applySecretExtraction,
  canonicalizeConfigEnvRefs,
  isValidTempDir,
} = require("../onboarding/import/import-applier");
const { cleanupTempClone } = require("../onboarding/github");

const sanitizeOnboardingError = (error) => {
  const raw = [error?.stderr, error?.stdout, error?.message]
    .filter((value) => typeof value === "string" && value.trim())
    .join("\n");
  const redacted = String(raw || "Onboarding failed")
    .replace(/sk-[^\s"]+/g, "***")
    .replace(/ghp_[^\s"]+/g, "***")
    .replace(/github_pat_[^\s"]+/g, "***")
    .replace(/(?:token|api[_-]?key)["'\s:=]+[^\s"']+/gi, (match) =>
      match.replace(/[^\s"':=]+$/g, "***"),
    );
  const lower = redacted.toLowerCase();
  if (
    lower.includes("heap out of memory") ||
    lower.includes("allocation failed") ||
    lower.includes("fatal error: ineffective mark-compacts")
  ) {
    return "Onboarding ran out of memory. Please retry, and if it persists increase instance memory.";
  }
  if (
    lower.includes("permission denied") ||
    lower.includes("denied to") ||
    lower.includes("permission to") ||
    lower.includes("insufficient") ||
    lower.includes("not accessible by integration") ||
    lower.includes("could not read from remote repository") ||
    lower.includes("repository not found")
  ) {
    return "GitHub access failed. Verify your token permissions and workspace repo, then try again.";
  }
  if (
    lower.includes("already exists") &&
    (lower.includes("repo") || lower.includes("repository"))
  ) {
    return "Repository setup failed because the target repo already exists or is unavailable.";
  }
  if (
    lower.includes("invalid api key") ||
    lower.includes("invalid_api_key") ||
    lower.includes("unauthorized") ||
    lower.includes("authentication failed") ||
    lower.includes("invalid token")
  ) {
    return "Model provider authentication failed. Check your API key/token and try again.";
  }
  if (
    lower.includes("etimedout") ||
    lower.includes("econnreset") ||
    lower.includes("enotfound") ||
    lower.includes("network") ||
    lower.includes("timed out")
  ) {
    return "Network error during onboarding. Please retry in a minute.";
  }
  if (lower.includes("command failed: openclaw onboard")) {
    return "Onboarding command failed. Please verify credentials and try again.";
  }
  return redacted.slice(0, 300);
};

const registerOnboardingRoutes = ({
  app,
  fs,
  constants,
  shellCmd,
  gatewayEnv,
  readEnvFile,
  writeEnvFile,
  reloadEnv,
  isOnboarded,
  resolveGithubRepoUrl,
  resolveModelProvider,
  hasCodexOauthProfile,
  authProfiles,
  ensureGatewayProxyConfig,
  getBaseUrl,
  startGateway,
}) => {
  // Keep mutating onboarding routes marker-gated so in-progress imports
  // can promote files before the final completion marker is written.
  const hasExplicitOnboardingMarker = () =>
    fs.existsSync(constants.kOnboardingMarkerPath);

  const onboardingService = createOnboardingService({
    fs,
    constants,
    shellCmd,
    gatewayEnv,
    readEnvFile,
    writeEnvFile,
    reloadEnv,
    resolveGithubRepoUrl,
    resolveModelProvider,
    hasCodexOauthProfile,
    authProfiles,
    ensureGatewayProxyConfig,
    getBaseUrl,
    startGateway,
  });

  const kEnvVarNamePattern = /^[A-Z_][A-Z0-9_]*$/;
  const validateApprovedSecrets = ({ approvedSecrets = [], scannedSecrets = [] }) => {
    if (!Array.isArray(approvedSecrets)) return { ok: true, secrets: [] };
    const scannedByFingerprint = new Map(
      scannedSecrets.map((secret) => [
        [
          String(secret?.configPath || ""),
          String(secret?.file || ""),
          String(secret?.value || ""),
        ].join("\u0000"),
        secret,
      ]),
    );
    const secrets = [];
    for (const approvedSecret of approvedSecrets) {
      const fingerprint = [
        String(approvedSecret?.configPath || ""),
        String(approvedSecret?.file || ""),
        String(approvedSecret?.value || ""),
      ].join("\u0000");
      const scannedSecret = scannedByFingerprint.get(fingerprint);
      const envVarName = String(approvedSecret?.suggestedEnvVar || "").trim();
      if (!scannedSecret || !envVarName || !kEnvVarNamePattern.test(envVarName)) {
        return {
          ok: false,
          error: "Invalid approved secrets payload",
        };
      }
      secrets.push({
        ...scannedSecret,
        suggestedEnvVar: envVarName,
      });
    }
    return { ok: true, secrets };
  };

  app.get("/api/onboard/status", (req, res) => {
    res.json({ onboarded: hasExplicitOnboardingMarker() });
  });

  app.post("/api/onboard", async (req, res) => {
    if (hasExplicitOnboardingMarker())
      return res.json({ ok: false, error: "Already onboarded" });

    try {
      const { vars, modelKey, importMode } = req.body;
      const result = await onboardingService.completeOnboarding({
        req,
        vars,
        modelKey,
        importMode: !!importMode,
      });
      res.status(result.status).json(result.body);
    } catch (err) {
      console.error("[onboard] Error:", err);
      res.status(500).json({ ok: false, error: sanitizeOnboardingError(err) });
    }
  });

  app.post("/api/onboard/github/verify", async (req, res) => {
    if (hasExplicitOnboardingMarker()) {
      return res.json({ ok: false, error: "Already onboarded" });
    }

    try {
      const githubRepoInput = String(req.body?.repo || "").trim();
      const githubToken = String(req.body?.token || "").trim();
      const mode = String(req.body?.mode || "new").trim();
      if (!githubRepoInput || !githubToken) {
        return res.status(400).json({
          ok: false,
          error: "GitHub token and workspace repo are required",
        });
      }

      const result = await onboardingService.verifyGithubSetup({
        githubRepoInput,
        githubToken,
        mode,
        resolveGithubRepoUrl,
      });
      if (!result.ok) {
        return res
          .status(result.status || 400)
          .json({ ok: false, error: result.error });
      }
      return res.json({
        ok: true,
        repoExists: result.repoExists || false,
        repoIsEmpty: result.repoIsEmpty || false,
        tempDir: result.tempDir || null,
      });
    } catch (err) {
      console.error("[onboard] GitHub verify error:", err);
      return res
        .status(500)
        .json({ ok: false, error: sanitizeOnboardingError(err) });
    }
  });
  app.post("/api/onboard/import/scan", async (req, res) => {
    if (hasExplicitOnboardingMarker()) {
      return res.json({ ok: false, error: "Already onboarded" });
    }

    try {
      const tempDir = String(req.body?.tempDir || "").trim();
      if (!tempDir || !isValidTempDir(tempDir)) {
        return res
          .status(400)
          .json({ ok: false, error: "Invalid temp directory" });
      }
      if (!fs.existsSync(tempDir)) {
        return res
          .status(400)
          .json({ ok: false, error: "Temp directory not found" });
      }

      const scan = scanWorkspace({ fs, baseDir: tempDir });
      if (!scan.sourceLayout?.supported) {
        cleanupTempClone(tempDir);
        return res.status(400).json({
          ok: false,
          error: scan.sourceLayout?.error || "Unsupported import source layout",
        });
      }

      const secrets = detectSecrets({
        fs,
        baseDir: tempDir,
        configFiles: scan.gatewayConfig.files,
        envFiles: scan.envFiles.files,
      });
      const preFill = extractPreFillValues({
        fs,
        baseDir: tempDir,
        configFiles: scan.gatewayConfig.files,
      });

      return res.json({ ok: true, ...scan, secrets, preFill });
    } catch (err) {
      console.error("[onboard] Import scan error:", err);
      return res
        .status(500)
        .json({ ok: false, error: sanitizeOnboardingError(err) });
    }
  });

  app.post("/api/onboard/import/apply", async (req, res) => {
    if (hasExplicitOnboardingMarker()) {
      return res.json({ ok: false, error: "Already onboarded" });
    }

    try {
      const tempDir = String(req.body?.tempDir || "").trim();
      const approvedSecrets = Array.isArray(req.body?.approvedSecrets)
        ? req.body.approvedSecrets
        : [];
      const skipSecretExtraction = !!req.body?.skipSecretExtraction;
      const githubToken = String(req.body?.githubToken || "").trim();
      const githubRepoInput = String(req.body?.githubRepo || "").trim();

      if (!tempDir || !isValidTempDir(tempDir)) {
        return res
          .status(400)
          .json({ ok: false, error: "Invalid temp directory" });
      }
      if (!fs.existsSync(tempDir)) {
        return res
          .status(400)
          .json({ ok: false, error: "Temp directory not found" });
      }

      const scan = scanWorkspace({ fs, baseDir: tempDir });
      if (!scan.sourceLayout?.supported) {
        cleanupTempClone(tempDir);
        return res.status(400).json({
          ok: false,
          error: scan.sourceLayout?.error || "Unsupported import source layout",
        });
      }

      let envVars = [];
      const scannedSecrets = detectSecrets({
        fs,
        baseDir: tempDir,
        configFiles: scan.gatewayConfig.files,
        envFiles: scan.envFiles.files,
      });
      const approvedSecretValidation = validateApprovedSecrets({
        approvedSecrets,
        scannedSecrets,
      });
      if (!approvedSecretValidation.ok) {
        return res.status(400).json({
          ok: false,
          error: approvedSecretValidation.error,
        });
      }
      if (!skipSecretExtraction && approvedSecrets.length > 0) {
        const extraction = applySecretExtraction({
          fs,
          baseDir: tempDir,
          approvedSecrets: approvedSecretValidation.secrets,
        });
        envVars = extraction.envVars;
      }
      const canonicalization = canonicalizeConfigEnvRefs({
        fs,
        baseDir: tempDir,
        configFiles: scan.gatewayConfig.files,
        envVars,
      });
      envVars = canonicalization.envVars;

      const configFiles = Array.isArray(scan.gatewayConfig?.files)
        ? scan.gatewayConfig.files
        : ["openclaw.json"].filter((f) => fs.existsSync(path.join(tempDir, f)));
      const transformAlignment = alignHookTransforms({
        fs,
        baseDir: tempDir,
        configFiles,
      });

      const preFill = extractPreFillValues({
        fs,
        baseDir: tempDir,
        configFiles,
      });

      const promoteTargetDir =
        scan.sourceLayout.kind === "workspace-only"
          ? constants.WORKSPACE_DIR
          : constants.OPENCLAW_DIR;
      const promoteResult = promoteCloneToTarget({
        fs,
        tempDir,
        targetDir: promoteTargetDir,
        sourceSubdir: scan.sourceLayout.promoteSourceSubdir || "",
        cleanupBootstrap: scan.sourceLayout.kind === "full-openclaw-root",
      });
      if (!promoteResult.ok) {
        return res.status(500).json({ ok: false, error: promoteResult.error });
      }

      const existing = typeof readEnvFile === "function" ? readEnvFile() : [];
      const merged = [...existing];
      if (githubToken) {
        const tokenIdx = merged.findIndex((v) => v.key === "GITHUB_TOKEN");
        if (tokenIdx >= 0) {
          merged[tokenIdx] = { key: "GITHUB_TOKEN", value: githubToken };
        } else {
          merged.push({ key: "GITHUB_TOKEN", value: githubToken });
        }
      }
      if (githubRepoInput) {
        const normalizedRepo = resolveGithubRepoUrl(githubRepoInput);
        const repoIdx = merged.findIndex(
          (v) => v.key === "GITHUB_WORKSPACE_REPO",
        );
        if (repoIdx >= 0) {
          merged[repoIdx] = {
            key: "GITHUB_WORKSPACE_REPO",
            value: normalizedRepo,
          };
        } else {
          merged.push({
            key: "GITHUB_WORKSPACE_REPO",
            value: normalizedRepo,
          });
        }
      }
      for (const newVar of envVars) {
        const idx = merged.findIndex((v) => v.key === newVar.key);
        if (idx >= 0) {
          merged[idx] = newVar;
        } else {
          merged.push(newVar);
        }
      }
      if (githubToken || githubRepoInput || envVars.length > 0) {
        writeEnvFile(merged);
        reloadEnv();
      }
      const systemVars =
        constants.kSystemVars instanceof Set ? constants.kSystemVars : new Set();
      const placeholderReview = getImportedPlaceholderReview({
        fs,
        openclawDir: constants.OPENCLAW_DIR,
        envVars: merged,
        systemVars,
        normalizeConfig: true,
      });

      return res.json({
        ok: true,
        preFill,
        placeholderReview,
        sourceLayout: scan.sourceLayout,
        envVarsImported: envVars.length,
        canonicalizedEnvRefs: canonicalization.rewrittenRefs,
        transformsAligned: transformAlignment.alignedCount,
      });
    } catch (err) {
      console.error("[onboard] Import apply error:", err);
      cleanupTempClone(req.body?.tempDir);
      return res
        .status(500)
        .json({ ok: false, error: sanitizeOnboardingError(err) });
    }
  });
};

module.exports = { registerOnboardingRoutes };
