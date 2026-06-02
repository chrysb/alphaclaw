const path = require("path");
const { readOpenclawConfig, writeOpenclawConfig } = require("./openclaw-config");

const kUsageTrackerPluginPath = path.resolve(
  __dirname,
  "..",
  "plugin",
  "usage-tracker",
);
const kConversationAccessHookPolicyKey = "allowConversationAccess";
const kChannelPluginIds = ["telegram", "discord", "slack", "whatsapp"];
const kDefaultDiscordGroupPolicy = "disabled";

const ensurePluginsShell = (cfg = {}) => {
  if (!cfg.plugins || typeof cfg.plugins !== "object") cfg.plugins = {};
  if (!Array.isArray(cfg.plugins.allow)) cfg.plugins.allow = [];
  if (!cfg.plugins.load || typeof cfg.plugins.load !== "object") {
    cfg.plugins.load = {};
  }
  if (!Array.isArray(cfg.plugins.load.paths)) cfg.plugins.load.paths = [];
  if (!cfg.plugins.entries || typeof cfg.plugins.entries !== "object") {
    cfg.plugins.entries = {};
  }
};

const ensurePluginAllowed = ({ cfg = {}, pluginKey = "" }) => {
  const normalizedPluginKey = String(pluginKey || "").trim();
  if (!normalizedPluginKey) return;
  ensurePluginsShell(cfg);
  if (!cfg.plugins.allow.includes(normalizedPluginKey)) {
    cfg.plugins.allow.push(normalizedPluginKey);
  }
};

const buildUsageTrackerHookPolicy = ({ existingHooks = {} } = {}) => {
  const hooks = {};
  if (typeof existingHooks.allowPromptInjection === "boolean") {
    hooks.allowPromptInjection = existingHooks.allowPromptInjection;
  }
  hooks[kConversationAccessHookPolicyKey] = true;
  return hooks;
};

const ensureUsageTrackerPluginEntry = (cfg = {}) => {
  const before = JSON.stringify(cfg);
  ensurePluginAllowed({ cfg, pluginKey: "usage-tracker" });
  if (!cfg.plugins.load.paths.includes(kUsageTrackerPluginPath)) {
    cfg.plugins.load.paths.push(kUsageTrackerPluginPath);
  }
  const existingEntry =
    cfg.plugins.entries["usage-tracker"] &&
    typeof cfg.plugins.entries["usage-tracker"] === "object"
      ? cfg.plugins.entries["usage-tracker"]
      : {};
  const existingHooks =
    existingEntry.hooks && typeof existingEntry.hooks === "object"
      ? existingEntry.hooks
      : {};
  const hooks = buildUsageTrackerHookPolicy({
    existingHooks,
  });
  const nextEntry = {
    ...existingEntry,
    enabled: true,
  };
  if (Object.keys(hooks).length > 0) {
    nextEntry.hooks = hooks;
  } else {
    delete nextEntry.hooks;
  }
  cfg.plugins.entries["usage-tracker"] = nextEntry;
  return JSON.stringify(cfg) !== before;
};

const hasDiscordGuildAllowlist = (discordConfig = {}) => {
  const guilds = discordConfig.guilds;
  return !!guilds && typeof guilds === "object" && Object.keys(guilds).length > 0;
};

const reconcileDiscordGroupPolicy = (cfg = {}) => {
  const discord = cfg.channels?.discord;
  if (!discord || typeof discord !== "object" || discord.enabled === false) {
    return false;
  }
  if (hasDiscordGuildAllowlist(discord)) return false;
  if (discord.groupPolicy !== "allowlist") return false;
  discord.groupPolicy = kDefaultDiscordGroupPolicy;
  return true;
};

const reconcileEnabledChannelPlugins = (cfg = {}) => {
  ensurePluginsShell(cfg);
  let changed = false;
  for (const pluginKey of kChannelPluginIds) {
    const channelConfig = cfg.channels?.[pluginKey];
    if (!channelConfig || typeof channelConfig !== "object") continue;
    if (channelConfig.enabled !== true) continue;
    const allowBefore = cfg.plugins.allow.length;
    ensurePluginAllowed({ cfg, pluginKey });
    if (cfg.plugins.allow.length > allowBefore) changed = true;
    const existingEntry = cfg.plugins.entries[pluginKey];
    if (!existingEntry || existingEntry.enabled !== true) {
      cfg.plugins.entries[pluginKey] = {
        ...(existingEntry && typeof existingEntry === "object" ? existingEntry : {}),
        enabled: true,
      };
      changed = true;
    }
  }
  return changed;
};

const reconcileManagedPluginConfig = (cfg = {}) => {
  let changed = ensureUsageTrackerPluginEntry(cfg);
  if (reconcileEnabledChannelPlugins(cfg)) changed = true;
  if (reconcileDiscordGroupPolicy(cfg)) changed = true;
  return changed;
};

const ensureUsageTrackerPluginConfig = ({ fsModule, openclawDir }) => {
  const cfg = readOpenclawConfig({
    fsModule,
    openclawDir,
    fallback: {},
  });
  const changed = reconcileManagedPluginConfig(cfg);
  if (!changed) return false;
  writeOpenclawConfig({
    fsModule,
    openclawDir,
    config: cfg,
    spacing: 2,
  });
  return true;
};

module.exports = {
  kUsageTrackerPluginPath,
  kDefaultDiscordGroupPolicy,
  ensurePluginsShell,
  ensurePluginAllowed,
  ensureUsageTrackerPluginEntry,
  reconcileDiscordGroupPolicy,
  reconcileEnabledChannelPlugins,
  reconcileManagedPluginConfig,
  ensureUsageTrackerPluginConfig,
};
