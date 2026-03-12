const path = require("path");
const { buildSecretReplacements } = require("../helpers");

const kUsageTrackerPluginPath = path.resolve(
  __dirname,
  "..",
  "..",
  "plugin",
  "usage-tracker",
);
const kDefaultToolsProfile = "full";
const kBootstrapExtraFiles = [
  "hooks/bootstrap/AGENTS.md",
  "hooks/bootstrap/TOOLS.md",
];

const buildOnboardArgs = ({
  varMap,
  selectedProvider,
  hasCodexOauth,
  workspaceDir,
}) => {
  const openclawGatewayToken =
    varMap.OPENCLAW_GATEWAY_TOKEN || process.env.OPENCLAW_GATEWAY_TOKEN || "";
  const anthropicToken = varMap.ANTHROPIC_TOKEN || "";
  const anthropicApiKey = varMap.ANTHROPIC_API_KEY || "";
  const openaiApiKey = varMap.OPENAI_API_KEY || "";
  const geminiApiKey = varMap.GEMINI_API_KEY || "";
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
    openclawGatewayToken,
    "--no-install-daemon",
    "--skip-health",
    "--workspace",
    workspaceDir,
  ];

  if (
    selectedProvider === "openai-codex" &&
    openaiApiKey
  ) {
    onboardArgs.push(
      "--auth-choice",
      "openai-api-key",
      "--openai-api-key",
      openaiApiKey,
    );
  } else if (selectedProvider === "openai-codex" && hasCodexOauth) {
    onboardArgs.push("--auth-choice", "skip");
  } else if (
    (selectedProvider === "anthropic" || !selectedProvider) &&
    anthropicToken
  ) {
    onboardArgs.push(
      "--auth-choice",
      "token",
      "--token-provider",
      "anthropic",
      "--token",
      anthropicToken,
    );
  } else if (
    (selectedProvider === "anthropic" || !selectedProvider) &&
    anthropicApiKey
  ) {
    onboardArgs.push(
      "--auth-choice",
      "apiKey",
      "--anthropic-api-key",
      anthropicApiKey,
    );
  } else if (
    (selectedProvider === "openai" || !selectedProvider) &&
    openaiApiKey
  ) {
    onboardArgs.push(
      "--auth-choice",
      "openai-api-key",
      "--openai-api-key",
      openaiApiKey,
    );
  } else if (
    (selectedProvider === "google" || !selectedProvider) &&
    geminiApiKey
  ) {
    onboardArgs.push(
      "--auth-choice",
      "gemini-api-key",
      "--gemini-api-key",
      geminiApiKey,
    );
  } else if (anthropicToken) {
    onboardArgs.push(
      "--auth-choice",
      "token",
      "--token-provider",
      "anthropic",
      "--token",
      anthropicToken,
    );
  } else if (anthropicApiKey) {
    onboardArgs.push(
      "--auth-choice",
      "apiKey",
      "--anthropic-api-key",
      anthropicApiKey,
    );
  } else if (openaiApiKey) {
    onboardArgs.push(
      "--auth-choice",
      "openai-api-key",
      "--openai-api-key",
      openaiApiKey,
    );
  } else if (geminiApiKey) {
    onboardArgs.push(
      "--auth-choice",
      "gemini-api-key",
      "--gemini-api-key",
      geminiApiKey,
    );
  } else if (hasCodexOauth) {
    onboardArgs.push("--auth-choice", "skip");
  }

  return onboardArgs;
};

const ensurePluginAllowed = (cfg, pluginKey) => {
  if (!cfg.plugins.allow.includes(pluginKey)) {
    cfg.plugins.allow.push(pluginKey);
  }
};

const ensureManagedConfigShell = (cfg) => {
  if (!cfg.channels) cfg.channels = {};
  if (!cfg.plugins) cfg.plugins = {};
  if (!Array.isArray(cfg.plugins.allow)) cfg.plugins.allow = [];
  if (!cfg.plugins.load) cfg.plugins.load = {};
  if (!Array.isArray(cfg.plugins.load.paths)) cfg.plugins.load.paths = [];
  if (!cfg.plugins.entries) cfg.plugins.entries = {};
  if (!cfg.commands) cfg.commands = {};
  if (!cfg.tools) cfg.tools = {};
  if (!cfg.hooks) cfg.hooks = {};
  if (!cfg.hooks.internal) cfg.hooks.internal = {};
  if (!cfg.hooks.internal.entries) cfg.hooks.internal.entries = {};
  cfg.commands.restart = true;
  cfg.tools.profile = kDefaultToolsProfile;
  cfg.hooks.internal.enabled = true;
  cfg.hooks.internal.entries["bootstrap-extra-files"] = {
    ...(cfg.hooks.internal.entries["bootstrap-extra-files"] || {}),
    enabled: true,
    paths: kBootstrapExtraFiles,
  };
};

const getSafeImportedDmPolicy = (channelConfig = {}) => {
  if (
    channelConfig?.dmPolicy === "allowlist" &&
    (!Array.isArray(channelConfig?.allowFrom) ||
      channelConfig.allowFrom.length === 0)
  ) {
    return "pairing";
  }
  return channelConfig?.dmPolicy || "pairing";
};

const applyFreshOnboardingChannels = ({ cfg, varMap }) => {
  if (varMap.TELEGRAM_BOT_TOKEN) {
    cfg.channels.telegram = {
      enabled: true,
      botToken: varMap.TELEGRAM_BOT_TOKEN,
      dmPolicy: "pairing",
      groupPolicy: "allowlist",
    };
    cfg.plugins.entries.telegram = { enabled: true };
    ensurePluginAllowed(cfg, "telegram");
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
    ensurePluginAllowed(cfg, "discord");
    console.log("[onboard] Discord configured");
  }
  if (varMap.SLACK_BOT_TOKEN && varMap.SLACK_APP_TOKEN) {
    cfg.channels.slack = {
      enabled: true,
      botToken: varMap.SLACK_BOT_TOKEN,
      appToken: varMap.SLACK_APP_TOKEN,
      mode: "socket",
      dmPolicy: "pairing",
      groupPolicy: "open",
    };
    cfg.plugins.entries.slack = { enabled: true };
    ensurePluginAllowed(cfg, "slack");
    console.log("[onboard] Slack configured");
  }
  if (!cfg.plugins.load.paths.includes(kUsageTrackerPluginPath)) {
    cfg.plugins.load.paths.push(kUsageTrackerPluginPath);
  }
  ensurePluginAllowed(cfg, "usage-tracker");
  cfg.plugins.entries["usage-tracker"] = { enabled: true };
};

const writeSanitizedOpenclawConfig = ({ fs, openclawDir, varMap }) => {
  const configPath = `${openclawDir}/openclaw.json`;
  const cfg = JSON.parse(fs.readFileSync(configPath, "utf8"));
  ensureManagedConfigShell(cfg);
  applyFreshOnboardingChannels({ cfg, varMap });

  let content = JSON.stringify(cfg, null, 2);
  const replacements = buildSecretReplacements(varMap, process.env);
  for (const [secret, envRef] of replacements) {
    if (secret) {
      // Only replace exact JSON string values so path substrings are never mutated.
      const secretJson = JSON.stringify(secret);
      content = content.replace(
        new RegExp(
          secretJson.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&"),
          "g",
        ),
        JSON.stringify(envRef),
      );
    }
  }
  fs.writeFileSync(configPath, content);
  console.log("[onboard] Config sanitized");
};

const writeManagedImportOpenclawConfig = ({ fs, openclawDir, varMap }) => {
  const configPath = `${openclawDir}/openclaw.json`;
  const cfg = JSON.parse(fs.readFileSync(configPath, "utf8"));
  ensureManagedConfigShell(cfg);

  if (!cfg.plugins.load.paths.includes(kUsageTrackerPluginPath)) {
    cfg.plugins.load.paths.push(kUsageTrackerPluginPath);
  }
  ensurePluginAllowed(cfg, "usage-tracker");
  cfg.plugins.entries["usage-tracker"] = {
    ...(cfg.plugins.entries["usage-tracker"] || {}),
    enabled: true,
  };

  if (varMap.TELEGRAM_BOT_TOKEN) {
    cfg.channels.telegram = {
      ...(cfg.channels.telegram || {}),
      enabled: true,
      botToken: "${TELEGRAM_BOT_TOKEN}",
      dmPolicy: getSafeImportedDmPolicy(cfg.channels.telegram),
      groupPolicy: cfg.channels.telegram?.groupPolicy || "allowlist",
    };
    cfg.plugins.entries.telegram = {
      ...(cfg.plugins.entries.telegram || {}),
      enabled: true,
    };
    ensurePluginAllowed(cfg, "telegram");
  }

  if (varMap.DISCORD_BOT_TOKEN) {
    cfg.channels.discord = {
      ...(cfg.channels.discord || {}),
      enabled: true,
      token: "${DISCORD_BOT_TOKEN}",
      dmPolicy: getSafeImportedDmPolicy(cfg.channels.discord),
      groupPolicy: cfg.channels.discord?.groupPolicy || "allowlist",
    };
    cfg.plugins.entries.discord = {
      ...(cfg.plugins.entries.discord || {}),
      enabled: true,
    };
    ensurePluginAllowed(cfg, "discord");
  }

  if (varMap.SLACK_BOT_TOKEN && varMap.SLACK_APP_TOKEN) {
    cfg.channels.slack = {
      ...(cfg.channels.slack || {}),
      enabled: true,
      botToken: "${SLACK_BOT_TOKEN}",
      appToken: "${SLACK_APP_TOKEN}",
      mode: cfg.channels.slack?.mode || "socket",
      dmPolicy: getSafeImportedDmPolicy(cfg.channels.slack),
      groupPolicy: cfg.channels.slack?.groupPolicy || "open",
    };
    cfg.plugins.entries.slack = {
      ...(cfg.plugins.entries.slack || {}),
      enabled: true,
    };
    ensurePluginAllowed(cfg, "slack");
  }

  fs.writeFileSync(configPath, JSON.stringify(cfg, null, 2));
};

module.exports = {
  buildOnboardArgs,
  writeManagedImportOpenclawConfig,
  writeSanitizedOpenclawConfig,
};
