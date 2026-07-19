const path = require("path");
const { readOpenclawConfig, writeOpenclawConfig } = require("./openclaw-config");
const {
  migrateLegacyTelegramStreamingConfig,
} = require("./openclaw-config-migrations");
const { ensureCodexRuntimePlugin } = require("./codex-runtime-config");
const { ensurePluginsShell, ensurePluginAllowed } = require("./plugin-config");

const kUsageTrackerPluginPath = path.resolve(
  __dirname,
  "..",
  "plugin",
  "usage-tracker",
);
// Matches any `.../lib/plugin/usage-tracker` load path regardless of where the
// AlphaClaw package was installed (npm scope dir, git alias dir, version bumps).
const kUsageTrackerPluginPathPattern = /[\\/]plugin[\\/]usage-tracker[\\/]?$/;

const kConversationAccessHookPolicyKey = "allowConversationAccess";
const kChannelPluginIds = ["telegram", "discord", "slack", "whatsapp"];
const kDefaultDiscordGroupPolicy = "disabled";

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

// Remove usage-tracker plugin paths left behind by a previous install location
// (e.g. a prior `@chrysb/alphaclaw` npm install at `/app/node_modules/@chrysb/alphaclaw/...`
// after switching to a git dependency installed at `/app/node_modules/alphaclaw/...`).
// Only the current `__dirname`-resolved path is valid; any other entry pointing at a
// `.../plugin/usage-tracker` dir is dead and makes OpenClaw reject the whole config.
const pruneStaleUsageTrackerPaths = (cfg = {}) => {
  ensurePluginsShell(cfg);
  const paths = cfg.plugins.load.paths;
  const filtered = paths.filter(
    (entry) =>
      entry === kUsageTrackerPluginPath ||
      !kUsageTrackerPluginPathPattern.test(String(entry || "")),
  );
  if (filtered.length === paths.length) return false;
  cfg.plugins.load.paths = filtered;
  return true;
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
  if (ensureCodexRuntimePlugin(cfg)) changed = true;
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
  // Migrate configs written by a previous install location before reconciling,
  // so the canonical path is the only usage-tracker entry that remains.
  const prunedStale = pruneStaleUsageTrackerPaths(cfg);
  const migrated = migrateLegacyTelegramStreamingConfig(cfg);
  const changed = reconcileManagedPluginConfig(cfg) || prunedStale || migrated;
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
  pruneStaleUsageTrackerPaths,
  ensureUsageTrackerPluginEntry,
  reconcileDiscordGroupPolicy,
  reconcileEnabledChannelPlugins,
  reconcileManagedPluginConfig,
  ensureUsageTrackerPluginConfig,
};
