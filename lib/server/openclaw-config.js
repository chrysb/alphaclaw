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

module.exports = {
  resolveOpenclawConfigPath,
  readOpenclawConfig,
};
