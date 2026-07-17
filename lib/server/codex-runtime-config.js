const {
  ensurePluginsShell,
  ensurePluginAllowed,
} = require("./plugin-config");

const modelUsesCodexRuntime = (modelKey, modelConfig) => {
  const runtimeId = String(modelConfig?.agentRuntime?.id || "").trim();
  if (runtimeId === "codex") return true;
  if (runtimeId === "openclaw") return false;
  return String(modelKey || "").startsWith("openai/gpt-");
};

const configUsesCodexRuntime = (cfg = {}) => {
  const scopes = [
    cfg.agents?.defaults || {},
    ...(Array.isArray(cfg.agents?.list) ? cfg.agents.list : []),
  ];
  return scopes.some((scope) => {
    const configuredModels = scope.models || {};
    if (
      Object.entries(configuredModels).some(([modelKey, modelConfig]) =>
        modelUsesCodexRuntime(modelKey, modelConfig),
      )
    ) {
      return true;
    }
    const primary = String(scope.model?.primary || "").trim();
    return (
      !!primary && modelUsesCodexRuntime(primary, configuredModels[primary])
    );
  });
};

const ensureCodexRuntimePlugin = (cfg = {}) => {
  if (!configUsesCodexRuntime(cfg)) return false;
  const before = JSON.stringify(cfg.plugins || {});
  ensurePluginsShell(cfg);
  ensurePluginAllowed({ cfg, pluginKey: "codex" });
  const existingEntry = cfg.plugins.entries.codex;
  cfg.plugins.entries.codex = {
    ...(existingEntry && typeof existingEntry === "object" ? existingEntry : {}),
    enabled: true,
  };
  return JSON.stringify(cfg.plugins) !== before;
};

module.exports = {
  configUsesCodexRuntime,
  ensureCodexRuntimePlugin,
  modelUsesCodexRuntime,
};
