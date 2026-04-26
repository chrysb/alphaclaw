const fs = require("fs");
const {
  readOpenclawConfig,
  resolveOpenclawConfigPath,
  writeOpenclawConfig,
} = require("./openclaw-config");

class MalformedOpenclawConfigError extends Error {
  constructor(configPath) {
    super(
      `Refusing to overwrite ${configPath}: file exists but could not be parsed as JSON. Inspect or restore it before changing agent defaults.`,
    );
    this.code = "MALFORMED_OPENCLAW_CONFIG";
  }
}

const kThinkingLevels = Object.freeze(["off", "low", "medium", "high"]);
const kDefaultThinkingLevel = "medium";
const kDefaultDreamingEnabled = false;

const isThinkingLevel = (value) =>
  typeof value === "string" && kThinkingLevels.includes(value);

const normalizeAgentDefaults = (rawConfig = {}) => {
  const config =
    rawConfig && typeof rawConfig === "object" && !Array.isArray(rawConfig)
      ? rawConfig
      : {};
  const raw =
    config.agentDefaults &&
    typeof config.agentDefaults === "object" &&
    !Array.isArray(config.agentDefaults)
      ? config.agentDefaults
      : {};
  return {
    thinking: isThinkingLevel(raw.thinking) ? raw.thinking : kDefaultThinkingLevel,
    dreaming: typeof raw.dreaming === "boolean" ? raw.dreaming : kDefaultDreamingEnabled,
  };
};

const readAgentDefaults = ({ fsModule = fs, openclawDir } = {}) => {
  const config = readOpenclawConfig({
    fsModule,
    openclawDir,
    fallback: {},
  });
  return normalizeAgentDefaults(config);
};

const writeAgentDefaults = ({
  fsModule = fs,
  openclawDir,
  thinking,
  dreaming,
} = {}) => {
  const configPath = resolveOpenclawConfigPath({ openclawDir });
  const exists =
    typeof fsModule.existsSync === "function"
      ? fsModule.existsSync(configPath)
      : null;
  const config = readOpenclawConfig({
    fsModule,
    openclawDir,
    fallback: exists === true ? null : {},
  });
  if (exists === true && config === null) {
    throw new MalformedOpenclawConfigError(configPath);
  }
  const safeConfig =
    config && typeof config === "object" && !Array.isArray(config) ? config : {};
  const before = JSON.stringify(safeConfig.agentDefaults || null);
  const next = normalizeAgentDefaults(safeConfig);
  if (typeof thinking === "string") {
    if (!isThinkingLevel(thinking)) {
      throw new Error(
        `thinking must be one of: ${kThinkingLevels.join(", ")}`,
      );
    }
    next.thinking = thinking;
  }
  if (typeof dreaming === "boolean") {
    next.dreaming = dreaming;
  }
  safeConfig.agentDefaults = next;
  const after = JSON.stringify(safeConfig.agentDefaults);
  const changed = before !== after;
  if (changed) {
    writeOpenclawConfig({
      fsModule,
      openclawDir,
      config: safeConfig,
      spacing: 2,
    });
  }
  return { changed, agentDefaults: next };
};

module.exports = {
  MalformedOpenclawConfigError,
  kThinkingLevels,
  kDefaultThinkingLevel,
  kDefaultDreamingEnabled,
  isThinkingLevel,
  normalizeAgentDefaults,
  readAgentDefaults,
  writeAgentDefaults,
};
