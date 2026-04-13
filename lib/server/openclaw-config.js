const fs = require("fs");
const path = require("path");

const resolveOpenclawConfigPath = ({ openclawDir }) =>
  path.join(openclawDir, "openclaw.json");

const readOpenclawConfig = ({
  fsModule = fs,
  openclawDir,
  fallback = {},
} = {}) => {
  const configPath = resolveOpenclawConfigPath({ openclawDir });
  try {
    return JSON.parse(fsModule.readFileSync(configPath, "utf8"));
  } catch {
    return fallback;
  }
};

const writeOpenclawConfig = ({
  fsModule = fs,
  openclawDir,
  config = {},
  spacing = 2,
} = {}) => {
  const configPath = resolveOpenclawConfigPath({ openclawDir });
  fsModule.mkdirSync(path.dirname(configPath), { recursive: true });
  fsModule.writeFileSync(configPath, JSON.stringify(config, null, spacing));
  return configPath;
};

/**
 * Ensures every provider in openclaw.json has a `models` array.
 *
 * The OpenClaw gateway JSON-schema validator requires `models` to be an array
 * (even if empty) on every provider entry. When alphaclaw generates config for
 * self-hosted providers (ollama, lmstudio) it omits this key, causing a silent
 * schema-validation crash that manifests as a 30-second startup timeout.
 *
 * This function is a deep-clone-safe transform: it returns a new config object
 * and never mutates the input.
 *
 * @param {object} cfg - Raw parsed openclaw.json content
 * @returns {object}   - Sanitized copy
 */
const sanitizeOpenclawConfig = (cfg) => {
  const providers = cfg?.models?.providers;
  if (!providers || typeof providers !== "object") return cfg;
  return {
    ...cfg,
    models: {
      ...cfg.models,
      providers: Object.fromEntries(
        Object.entries(providers).map(([key, provider]) => [
          key,
          {
            ...provider,
            models: Array.isArray(provider.models) ? provider.models : [],
          },
        ]),
      ),
    },
  };
};

module.exports = {
  resolveOpenclawConfigPath,
  readOpenclawConfig,
  writeOpenclawConfig,
  sanitizeOpenclawConfig,
};
