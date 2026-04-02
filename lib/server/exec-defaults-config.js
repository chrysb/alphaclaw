const fs = require("fs");
const path = require("path");
const {
  readOpenclawConfig,
  resolveOpenclawConfigPath,
  writeOpenclawConfig,
} = require("./openclaw-config");

const kManagedExecApprovalsDefaults = Object.freeze({
  security: "full",
  ask: "off",
  askFallback: "full",
});

const kManagedOpenclawExecDefaults = Object.freeze({
  security: "full",
  strictInlineEval: false,
});

const resolveExecApprovalsConfigPath = ({ openclawDir }) =>
  path.join(openclawDir, "exec-approvals.json");

const readExecApprovalsConfig = ({
  fsModule = fs,
  openclawDir,
  fallback = { version: 1 },
} = {}) => {
  const filePath = resolveExecApprovalsConfigPath({ openclawDir });
  try {
    const parsed = JSON.parse(fsModule.readFileSync(filePath, "utf8"));
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed
      : fallback;
  } catch {
    return fallback;
  }
};

const writeExecApprovalsConfig = ({
  fsModule = fs,
  openclawDir,
  file = {},
  spacing = 2,
} = {}) => {
  const filePath = resolveExecApprovalsConfigPath({ openclawDir });
  fsModule.mkdirSync(path.dirname(filePath), { recursive: true });
  fsModule.writeFileSync(filePath, JSON.stringify(file, null, spacing) + "\n", "utf8");
  return filePath;
};

const hasOwn = (obj, key) =>
  !!obj && typeof obj === "object" && Object.prototype.hasOwnProperty.call(obj, key);

const ensureManagedExecApprovalsDefaults = (rawFile = {}) => {
  const file =
    rawFile && typeof rawFile === "object" && !Array.isArray(rawFile) ? rawFile : {};
  const before = JSON.stringify(file);
  if (!Number.isInteger(file.version)) file.version = 1;
  if (!file.defaults || typeof file.defaults !== "object" || Array.isArray(file.defaults)) {
    file.defaults = {};
  }
  if (!file.agents || typeof file.agents !== "object" || Array.isArray(file.agents)) {
    file.agents = {};
  }
  const defaults = file.defaults;
  if (!String(defaults.security || "").trim()) {
    defaults.security = kManagedExecApprovalsDefaults.security;
  }
  if (!String(defaults.ask || "").trim()) {
    defaults.ask = kManagedExecApprovalsDefaults.ask;
  }
  if (!String(defaults.askFallback || "").trim()) {
    defaults.askFallback = kManagedExecApprovalsDefaults.askFallback;
  }
  return {
    file,
    changed: JSON.stringify(file) !== before,
  };
};

const ensureManagedOpenclawExecDefaults = (rawConfig = {}) => {
  const config =
    rawConfig && typeof rawConfig === "object" && !Array.isArray(rawConfig) ? rawConfig : {};
  const before = JSON.stringify(config);
  if (!config.tools || typeof config.tools !== "object" || Array.isArray(config.tools)) {
    config.tools = {};
  }
  if (
    !config.tools.exec ||
    typeof config.tools.exec !== "object" ||
    Array.isArray(config.tools.exec)
  ) {
    config.tools.exec = {};
  }
  const exec = config.tools.exec;
  if (!String(exec.security || "").trim()) {
    exec.security = kManagedOpenclawExecDefaults.security;
  }
  if (!hasOwn(exec, "strictInlineEval")) {
    exec.strictInlineEval = kManagedOpenclawExecDefaults.strictInlineEval;
  }
  return {
    config,
    changed: JSON.stringify(config) !== before,
  };
};

const ensureManagedExecDefaults = ({ fsModule = fs, openclawDir } = {}) => {
  let openclawChanged = false;
  let approvalsChanged = false;

  const openclawConfigPath = resolveOpenclawConfigPath({ openclawDir });
  const openclawExists =
    typeof fsModule.existsSync === "function" ? fsModule.existsSync(openclawConfigPath) : null;
  if (openclawExists !== false) {
    const cfg = readOpenclawConfig({
      fsModule,
      openclawDir,
      fallback: openclawExists === true ? null : {},
    });
    if (cfg && typeof cfg === "object" && !Array.isArray(cfg)) {
      const ensuredConfig = ensureManagedOpenclawExecDefaults(cfg);
      if (ensuredConfig.changed) {
        writeOpenclawConfig({
          fsModule,
          openclawDir,
          config: ensuredConfig.config,
          spacing: 2,
        });
        openclawChanged = true;
      }
    }
  }

  const approvalsPath = resolveExecApprovalsConfigPath({ openclawDir });
  const approvalsExists =
    typeof fsModule.existsSync === "function" ? fsModule.existsSync(approvalsPath) : null;
  const approvals = readExecApprovalsConfig({
    fsModule,
    openclawDir,
    fallback: approvalsExists === true ? null : { version: 1 },
  });
  if (approvals && typeof approvals === "object" && !Array.isArray(approvals)) {
    const ensuredApprovals = ensureManagedExecApprovalsDefaults(approvals);
    if (ensuredApprovals.changed || approvalsExists === false) {
      writeExecApprovalsConfig({
        fsModule,
        openclawDir,
        file: ensuredApprovals.file,
        spacing: 2,
      });
      approvalsChanged = true;
    }
  }

  return {
    changed: openclawChanged || approvalsChanged,
    openclawChanged,
    approvalsChanged,
  };
};

module.exports = {
  kManagedExecApprovalsDefaults,
  kManagedOpenclawExecDefaults,
  resolveExecApprovalsConfigPath,
  readExecApprovalsConfig,
  writeExecApprovalsConfig,
  ensureManagedExecApprovalsDefaults,
  ensureManagedOpenclawExecDefaults,
  ensureManagedExecDefaults,
};
