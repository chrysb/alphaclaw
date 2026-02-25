const { createOnboardingService } = require("../onboarding");

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
  writeEnvFile,
  reloadEnv,
  isOnboarded,
  resolveGithubRepoUrl,
  resolveModelProvider,
  hasCodexOauthProfile,
  ensureGatewayProxyConfig,
  getBaseUrl,
  startGateway,
}) => {
  const onboardingService = createOnboardingService({
    fs,
    constants,
    shellCmd,
    gatewayEnv,
    writeEnvFile,
    reloadEnv,
    resolveGithubRepoUrl,
    resolveModelProvider,
    hasCodexOauthProfile,
    ensureGatewayProxyConfig,
    getBaseUrl,
    startGateway,
  });

  app.get("/api/onboard/status", (req, res) => {
    res.json({ onboarded: isOnboarded() });
  });

  app.post("/api/onboard", async (req, res) => {
    if (isOnboarded())
      return res.json({ ok: false, error: "Already onboarded" });

    try {
      const { vars, modelKey } = req.body;
      const result = await onboardingService.completeOnboarding({
        req,
        vars,
        modelKey,
      });
      res.status(result.status).json(result.body);
    } catch (err) {
      console.error("[onboard] Error:", err);
      res.status(500).json({ ok: false, error: sanitizeOnboardingError(err) });
    }
  });
};

module.exports = { registerOnboardingRoutes };
