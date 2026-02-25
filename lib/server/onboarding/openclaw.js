const buildOnboardArgs = ({ varMap, selectedProvider, hasCodexOauth, workspaceDir }) => {
  const onboardArgs = [
    "--non-interactive",
    "--accept-risk",
    "--flow",
    "quickstart",
    "--gateway-bind",
    "loopback",
    "--gateway-port",
    "18789",
    "--gateway-auth",
    "token",
    "--gateway-token",
    varMap.OPENCLAW_GATEWAY_TOKEN || process.env.OPENCLAW_GATEWAY_TOKEN || "",
    "--no-install-daemon",
    "--skip-health",
    "--workspace",
    workspaceDir,
  ];

  if (
    selectedProvider === "openai-codex" &&
    (varMap.OPENAI_API_KEY || process.env.OPENAI_API_KEY)
  ) {
    onboardArgs.push(
      "--auth-choice",
      "openai-api-key",
      "--openai-api-key",
      varMap.OPENAI_API_KEY || process.env.OPENAI_API_KEY,
    );
  } else if (selectedProvider === "openai-codex" && hasCodexOauth) {
    onboardArgs.push("--auth-choice", "skip");
  } else if (
    (selectedProvider === "anthropic" || !selectedProvider) &&
    (varMap.ANTHROPIC_TOKEN || process.env.ANTHROPIC_TOKEN)
  ) {
    onboardArgs.push(
      "--auth-choice",
      "token",
      "--token-provider",
      "anthropic",
      "--token",
      varMap.ANTHROPIC_TOKEN || process.env.ANTHROPIC_TOKEN,
    );
  } else if (
    (selectedProvider === "anthropic" || !selectedProvider) &&
    (varMap.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY)
  ) {
    onboardArgs.push(
      "--auth-choice",
      "apiKey",
      "--anthropic-api-key",
      varMap.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY,
    );
  } else if (
    (selectedProvider === "openai" || !selectedProvider) &&
    (varMap.OPENAI_API_KEY || process.env.OPENAI_API_KEY)
  ) {
    onboardArgs.push(
      "--auth-choice",
      "openai-api-key",
      "--openai-api-key",
      varMap.OPENAI_API_KEY || process.env.OPENAI_API_KEY,
    );
  } else if (
    (selectedProvider === "google" || !selectedProvider) &&
    (varMap.GEMINI_API_KEY || process.env.GEMINI_API_KEY)
  ) {
    onboardArgs.push(
      "--auth-choice",
      "gemini-api-key",
      "--gemini-api-key",
      varMap.GEMINI_API_KEY || process.env.GEMINI_API_KEY,
    );
  } else if (varMap.ANTHROPIC_TOKEN || process.env.ANTHROPIC_TOKEN) {
    onboardArgs.push(
      "--auth-choice",
      "token",
      "--token-provider",
      "anthropic",
      "--token",
      varMap.ANTHROPIC_TOKEN || process.env.ANTHROPIC_TOKEN,
    );
  } else if (varMap.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY) {
    onboardArgs.push(
      "--auth-choice",
      "apiKey",
      "--anthropic-api-key",
      varMap.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY,
    );
  } else if (varMap.OPENAI_API_KEY || process.env.OPENAI_API_KEY) {
    onboardArgs.push(
      "--auth-choice",
      "openai-api-key",
      "--openai-api-key",
      varMap.OPENAI_API_KEY || process.env.OPENAI_API_KEY,
    );
  } else if (varMap.GEMINI_API_KEY || process.env.GEMINI_API_KEY) {
    onboardArgs.push(
      "--auth-choice",
      "gemini-api-key",
      "--gemini-api-key",
      varMap.GEMINI_API_KEY || process.env.GEMINI_API_KEY,
    );
  } else if (hasCodexOauth) {
    onboardArgs.push("--auth-choice", "skip");
  }

  return onboardArgs;
};

const writeSanitizedOpenclawConfig = ({ fs, openclawDir, varMap }) => {
  const configPath = `${openclawDir}/openclaw.json`;
  const cfg = JSON.parse(fs.readFileSync(configPath, "utf8"));
  if (!cfg.channels) cfg.channels = {};
  if (!cfg.plugins) cfg.plugins = {};
  if (!cfg.plugins.entries) cfg.plugins.entries = {};
  if (!cfg.commands) cfg.commands = {};
  if (!cfg.hooks) cfg.hooks = {};
  if (!cfg.hooks.internal) cfg.hooks.internal = {};
  if (!cfg.hooks.internal.entries) cfg.hooks.internal.entries = {};
  cfg.commands.restart = true;
  cfg.hooks.internal.enabled = true;
  cfg.hooks.internal.entries["bootstrap-extra-files"] = {
    ...(cfg.hooks.internal.entries["bootstrap-extra-files"] || {}),
    enabled: true,
    paths: ["hooks/bootstrap/AGENTS.md", "hooks/bootstrap/TOOLS.md"],
  };

  if (varMap.TELEGRAM_BOT_TOKEN) {
    cfg.channels.telegram = {
      enabled: true,
      botToken: varMap.TELEGRAM_BOT_TOKEN,
      dmPolicy: "pairing",
      groupPolicy: "allowlist",
    };
    cfg.plugins.entries.telegram = { enabled: true };
    console.log("[onboard] Telegram configured");
  }
  if (varMap.DISCORD_BOT_TOKEN) {
    cfg.channels.discord = {
      enabled: true,
      token: varMap.DISCORD_BOT_TOKEN,
      dmPolicy: "pairing",
      groupPolicy: "allowlist",
    };
    cfg.plugins.entries.discord = { enabled: true };
    console.log("[onboard] Discord configured");
  }

  let content = JSON.stringify(cfg, null, 2);
  const replacements = [
    [process.env.OPENCLAW_GATEWAY_TOKEN, "${OPENCLAW_GATEWAY_TOKEN}"],
    [varMap.ANTHROPIC_API_KEY, "${ANTHROPIC_API_KEY}"],
    [varMap.ANTHROPIC_TOKEN, "${ANTHROPIC_TOKEN}"],
    [varMap.TELEGRAM_BOT_TOKEN, "${TELEGRAM_BOT_TOKEN}"],
    [varMap.DISCORD_BOT_TOKEN, "${DISCORD_BOT_TOKEN}"],
    [varMap.OPENAI_API_KEY, "${OPENAI_API_KEY}"],
    [varMap.GEMINI_API_KEY, "${GEMINI_API_KEY}"],
    [varMap.BRAVE_API_KEY, "${BRAVE_API_KEY}"],
  ];
  for (const [secret, envRef] of replacements) {
    if (secret && secret.length > 8) {
      content = content.split(secret).join(envRef);
    }
  }
  fs.writeFileSync(configPath, content);
  console.log("[onboard] Config sanitized");
};

module.exports = { buildOnboardArgs, writeSanitizedOpenclawConfig };
