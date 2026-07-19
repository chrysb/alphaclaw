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

module.exports = { ensurePluginsShell, ensurePluginAllowed };
