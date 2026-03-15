const kAnthropicSetupTokenPrefix = "sk-ant-oat01-";
const kAnthropicApiKeyPrefix = "sk-ant-api";

const validateAnthropicCredentialShape = (varMap) => {
  const anthropicToken = String(varMap.ANTHROPIC_TOKEN || "").trim();
  const anthropicApiKey = String(varMap.ANTHROPIC_API_KEY || "").trim();
  if (
    anthropicToken &&
    !anthropicToken.startsWith(kAnthropicSetupTokenPrefix)
  ) {
    return {
      ok: false,
      status: 400,
      error: `ANTHROPIC_TOKEN must start with ${kAnthropicSetupTokenPrefix}`,
    };
  }
  if (anthropicApiKey && !anthropicApiKey.startsWith(kAnthropicApiKeyPrefix)) {
    return {
      ok: false,
      status: 400,
      error: `ANTHROPIC_API_KEY must start with ${kAnthropicApiKeyPrefix}`,
    };
  }
  return { ok: true };
};

const validateOnboardingInput = ({
  vars,
  modelKey,
  resolveModelProvider,
  hasCodexOauthProfile,
  readOnlyMode = false,
}) => {
  const kMaxOnboardingVars = 64;
  const kMaxEnvKeyLength = 128;
  const kMaxEnvValueLength = 4096;
  if (!Array.isArray(vars)) {
    return { ok: false, status: 400, error: "Missing vars array" };
  }
  if (vars.length > kMaxOnboardingVars) {
    return {
      ok: false,
      status: 400,
      error: `Too many environment variables (max ${kMaxOnboardingVars})`,
    };
  }
  if (
    !readOnlyMode &&
    (!modelKey || typeof modelKey !== "string" || !modelKey.includes("/"))
  ) {
    return { ok: false, status: 400, error: "A model selection is required" };
  }

  for (const entry of vars) {
    const key = String(entry?.key || "");
    const value = String(entry?.value || "");
    if (!key) {
      return { ok: false, status: 400, error: "Each variable must include a key" };
    }
    if (key.length > kMaxEnvKeyLength) {
      return {
        ok: false,
        status: 400,
        error: `Variable key is too long: ${key.slice(0, 32)}...`,
      };
    }
    if (value.length > kMaxEnvValueLength) {
      return {
        ok: false,
        status: 400,
        error: `Value too long for ${key} (max ${kMaxEnvValueLength} chars)`,
      };
    }
  }

  const varMap = Object.fromEntries(vars.map((v) => [v.key, v.value]));
  const anthropicValidation = validateAnthropicCredentialShape(varMap);
  if (!anthropicValidation.ok) return anthropicValidation;
  const githubToken = String(varMap.GITHUB_TOKEN || "");
  const githubRepoInput = String(varMap.GITHUB_WORKSPACE_REPO || "").trim();
  const selectedProvider =
    modelKey && typeof modelKey === "string" ? resolveModelProvider(modelKey) : "";
  const hasCodexOauth = hasCodexOauthProfile();
  const hasAiByProvider = {
    anthropic: !!(varMap.ANTHROPIC_API_KEY || varMap.ANTHROPIC_TOKEN),
    openai: !!varMap.OPENAI_API_KEY,
    "openai-codex": !!hasCodexOauth,
    google: !!varMap.GEMINI_API_KEY,
  };
  const hasAnyAi = !!(
    varMap.ANTHROPIC_API_KEY ||
    varMap.ANTHROPIC_TOKEN ||
    varMap.OPENAI_API_KEY ||
    varMap.GEMINI_API_KEY ||
    hasCodexOauth
  );
  const hasAi =
    selectedProvider in hasAiByProvider
      ? hasAiByProvider[selectedProvider]
      : hasAnyAi;
  const hasGithub = !!(githubToken && githubRepoInput);
  const hasChannel = !!(varMap.TELEGRAM_BOT_TOKEN || varMap.DISCORD_BOT_TOKEN || (varMap.SLACK_BOT_TOKEN && varMap.SLACK_APP_TOKEN));

  if (!readOnlyMode && !hasAi) {
    if (selectedProvider === "openai-codex") {
      return {
        ok: false,
        status: 400,
        error: "Connect OpenAI Codex OAuth before continuing",
      };
    }
    return {
      ok: false,
      status: 400,
      error: `Missing credentials for selected provider "${selectedProvider}"`,
    };
  }
  if (!readOnlyMode && !hasGithub) {
    return {
      ok: false,
      status: 400,
      error: "GitHub token and workspace repo are required",
    };
  }
  if (
    readOnlyMode &&
    ((githubToken && !githubRepoInput) || (!githubToken && githubRepoInput))
  ) {
    return {
      ok: false,
      status: 400,
      error: "Provide both GitHub token and workspace repo, or leave both blank",
    };
  }
  if (!readOnlyMode && !hasChannel) {
    return {
      ok: false,
      status: 400,
      error: "At least one channel token is required",
    };
  }

  return {
    ok: true,
    data: {
      varMap,
      githubToken,
      githubRepoInput,
      selectedProvider,
      hasCodexOauth,
      readOnlyMode,
    },
  };
};

module.exports = { validateOnboardingInput };
