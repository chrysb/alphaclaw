const fs = require("fs");
const path = require("path");
const { DatabaseSync } = require("node:sqlite");
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

const resolveExecApprovalsDatabasePath = ({ openclawDir }) =>
  path.join(openclawDir, "state", "openclaw.sqlite");

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
  const defaults =
    file.defaults && typeof file.defaults === "object" && !Array.isArray(file.defaults)
      ? file.defaults
      : null;
  const hasNonEmptyDefaults = !!defaults && Object.keys(defaults).length > 0;
  if (!hasNonEmptyDefaults) {
    if (!Number.isInteger(file.version)) file.version = 1;
    file.defaults = {
      security: kManagedExecApprovalsDefaults.security,
      ask: kManagedExecApprovalsDefaults.ask,
      askFallback: kManagedExecApprovalsDefaults.askFallback,
    };
    if (!file.agents || typeof file.agents !== "object" || Array.isArray(file.agents)) {
      file.agents = {};
    }
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
  if (!hasOwn(config.tools, "exec")) {
    config.tools.exec = {
      security: kManagedOpenclawExecDefaults.security,
      strictInlineEval: kManagedOpenclawExecDefaults.strictInlineEval,
    };
  }
  return {
    config,
    changed: JSON.stringify(config) !== before,
  };
};

const ensureManagedExecApprovalsSqliteDefaults = ({
  fsModule = fs,
  openclawDir,
  DatabaseSyncImpl = DatabaseSync,
} = {}) => {
  const databasePath = resolveExecApprovalsDatabasePath({ openclawDir });
  if (!fsModule.existsSync(databasePath)) return { handled: false, changed: false };
  let db;
  try {
    db = new DatabaseSyncImpl(databasePath);
    db.exec("PRAGMA busy_timeout = 5000");
    const table = db
      .prepare(
        "SELECT 1 AS present FROM sqlite_master " +
          "WHERE type = 'table' AND name = 'exec_approvals_config'",
      )
      .get();
    if (!table) return { handled: false, changed: false };

    const row = db
      .prepare(
        "SELECT raw_json FROM exec_approvals_config WHERE config_key = 'current'",
      )
      .get();
    let current = { version: 1 };
    if (row?.raw_json) {
      try {
        current = JSON.parse(row.raw_json);
      } catch {
        return { handled: true, changed: false };
      }
    }
    const ensured = ensureManagedExecApprovalsDefaults(current);
    if (!ensured.changed && row) return { handled: true, changed: false };

    const file = ensured.file;
    const agents =
      file.agents && typeof file.agents === "object" && !Array.isArray(file.agents)
        ? Object.values(file.agents)
        : [];
    const allowlistCount = agents.reduce(
      (total, agent) =>
        total + (Array.isArray(agent?.allowlist) ? agent.allowlist.length : 0),
      0,
    );
    db.prepare(
      "INSERT INTO exec_approvals_config " +
        "(config_key, raw_json, socket_path, has_socket_token, default_security, " +
        "default_ask, default_ask_fallback, auto_allow_skills, agent_count, " +
        "allowlist_count, updated_at_ms) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) " +
        "ON CONFLICT(config_key) DO UPDATE SET raw_json=excluded.raw_json, " +
        "socket_path=excluded.socket_path, has_socket_token=excluded.has_socket_token, " +
        "default_security=excluded.default_security, default_ask=excluded.default_ask, " +
        "default_ask_fallback=excluded.default_ask_fallback, " +
        "auto_allow_skills=excluded.auto_allow_skills, agent_count=excluded.agent_count, " +
        "allowlist_count=excluded.allowlist_count, updated_at_ms=excluded.updated_at_ms",
    ).run(
      "current",
      `${JSON.stringify(file, null, 2)}\n`,
      file.socket?.path || null,
      file.socket?.token ? 1 : 0,
      file.defaults?.security || null,
      file.defaults?.ask || null,
      file.defaults?.askFallback || null,
      typeof file.defaults?.autoAllowSkills === "boolean"
        ? file.defaults.autoAllowSkills
          ? 1
          : 0
        : null,
      agents.length,
      allowlistCount,
      Date.now(),
    );
    return { handled: true, changed: true };
  } catch {
    return { handled: false, changed: false };
  } finally {
    db?.close();
  }
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
  if (approvalsExists === false) {
    const sqliteResult = ensureManagedExecApprovalsSqliteDefaults({
      fsModule,
      openclawDir,
    });
    if (sqliteResult.handled) {
      approvalsChanged = sqliteResult.changed;
      return {
        changed: openclawChanged || approvalsChanged,
        openclawChanged,
        approvalsChanged,
      };
    }
  }
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
  resolveExecApprovalsDatabasePath,
  readExecApprovalsConfig,
  writeExecApprovalsConfig,
  ensureManagedExecApprovalsDefaults,
  ensureManagedOpenclawExecDefaults,
  ensureManagedExecApprovalsSqliteDefaults,
  ensureManagedExecDefaults,
};
