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

module.exports = {
  resolveOpenclawConfigPath,
  readOpenclawConfig,
  writeOpenclawConfig,
};
