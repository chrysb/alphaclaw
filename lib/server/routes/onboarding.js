const { createOnboardingService } = require("../onboarding");
const { scanWorkspace } = require("../onboarding/import-scanner");
const { detectSecrets, extractPreFillValues } = require("../onboarding/secret-detector");
const {
  promoteCloneToWorkspace,
  alignHookTransforms,
  applySecretExtraction,
  isValidTempDir,
} = require("../onboarding/import-applier");
const { cleanupTempClone } = require("../onboarding/github");

const sanitizeOnboardingError = (error) => {
  const raw = [error?.stderr, error?.stdout, error?.message]
    .filter((value) => typeof value === "string" && value.trim())
    .join("\n");
  const redacted = String(raw || "Onboarding failed")
    .replace(/sk-[^\s"]+/g, "***")
    .replace(/ghp_[^\s"]+/g, "***")
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
        return res
          .status(400)
          .json({
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

      let envVars = [];
      if (!skipSecretExtraction && approvedSecrets.length > 0) {
        const extraction = applySecretExtraction({
          fs,
          baseDir: tempDir,
          approvedSecrets,
        });
        envVars = extraction.envVars;
      }

      const configFiles = ["openclaw.json", ".openclaw/openclaw.json"].filter((f) =>
        fs.existsSync(`${tempDir}/${f}`),
      );
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

      const promoteResult = promoteCloneToWorkspace({
        fs,
        tempDir,
        openclawDir: constants.OPENCLAW_DIR,
      });
      if (!promoteResult.ok) {
        return res
          .status(500)
          .json({ ok: false, error: promoteResult.error });
      }

      const existing = require("../env").readEnvFile();
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
        const repoIdx = merged.findIndex((v) => v.key === "GITHUB_WORKSPACE_REPO");
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

      return res.json({
        ok: true,
        preFill,
        envVarsImported: envVars.length,
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
