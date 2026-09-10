const childProcess = require("child_process");
const fs = require("fs");
const path = require("path");
const { DatabaseSync } = require("node:sqlite");
const {
  compareVersionParts,
  normalizeOpenclawVersion,
} = require("./helpers");

const kManagedExecApprovalsStub = Object.freeze({
  version: 1,
  defaults: Object.freeze({
    security: "full",
    ask: "off",
    askFallback: "full",
  }),
  agents: Object.freeze({}),
});

const hasOnlyKeys = (value, expectedKeys) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const keys = Object.keys(value).sort();
  return (
    keys.length === expectedKeys.length &&
    keys.every((key, index) => key === expectedKeys[index])
  );
};

const isManagedExecApprovalsStub = (value) =>
  hasOnlyKeys(value, ["agents", "defaults", "version"]) &&
  value.version === kManagedExecApprovalsStub.version &&
  hasOnlyKeys(value.defaults, ["ask", "askFallback", "security"]) &&
  value.defaults.security === kManagedExecApprovalsStub.defaults.security &&
  value.defaults.ask === kManagedExecApprovalsStub.defaults.ask &&
  value.defaults.askFallback === kManagedExecApprovalsStub.defaults.askFallback &&
  hasOnlyKeys(value.agents, []);

const isPlainObject = (value) =>
  !!value && typeof value === "object" && !Array.isArray(value);

const kExecSecurityValues = new Set(["deny", "allowlist", "full"]);
const kExecAskValues = new Set(["off", "on-miss", "always"]);

const isOptionalEnum = (value, allowed) =>
  value === undefined || (typeof value === "string" && allowed.has(value));

const isOptionalString = (value) =>
  value === undefined || typeof value === "string";

const isOptionalFiniteNumber = (value, { nonnegative = false } = {}) =>
  value === undefined ||
  (typeof value === "number" &&
    Number.isFinite(value) &&
    (!nonnegative || value >= 0));

const isValidExecAllowlistEntry = (entry) => {
  if (typeof entry === "string") return entry.trim().length > 0;
  return (
    isPlainObject(entry) &&
    typeof entry.pattern === "string" &&
    entry.pattern.trim().length > 0 &&
    isOptionalString(entry.id) &&
    isOptionalString(entry.source) &&
    isOptionalString(entry.commandText) &&
    isOptionalString(entry.argPattern) &&
    isOptionalFiniteNumber(entry.lastUsedAt) &&
    isOptionalString(entry.lastUsedCommand) &&
    isOptionalString(entry.lastResolvedPath)
  );
};

const isValidMcpToolGrant = (grant) =>
  isPlainObject(grant) &&
  typeof grant.server === "string" &&
  grant.server.trim().length > 0 &&
  typeof grant.tool === "string" &&
  grant.tool.trim().length > 0 &&
  grant.source === "allow-always" &&
  typeof grant.addedAt === "number" &&
  Number.isFinite(grant.addedAt) &&
  grant.addedAt >= 0 &&
  isOptionalFiniteNumber(grant.lastUsedAt, { nonnegative: true });

const isValidExecApprovalPolicy = (value, { allowAllowlist = false } = {}) => {
  if (!isPlainObject(value)) return false;
  if (
    !isOptionalEnum(value.security, kExecSecurityValues) ||
    !isOptionalEnum(value.ask, kExecAskValues) ||
    !isOptionalEnum(value.askFallback, kExecSecurityValues) ||
    (value.autoAllowSkills !== undefined &&
      typeof value.autoAllowSkills !== "boolean")
  ) {
    return false;
  }
  if (allowAllowlist && value.allowlist !== undefined) {
    if (
      !Array.isArray(value.allowlist) ||
      !value.allowlist.every(isValidExecAllowlistEntry)
    ) {
      return false;
    }
  }
  if (allowAllowlist && value.mcpTools !== undefined) {
    if (
      !Array.isArray(value.mcpTools) ||
      !value.mcpTools.every(isValidMcpToolGrant)
    ) {
      return false;
    }
  }
  return true;
};

const isValidExecApprovalsPolicy = (value) => {
  if (!isPlainObject(value) || value.version !== 1) return false;
  if (
    value.socket !== undefined &&
    (!isPlainObject(value.socket) ||
      (value.socket.path !== undefined && typeof value.socket.path !== "string") ||
      (value.socket.token !== undefined && typeof value.socket.token !== "string"))
  ) {
    return false;
  }
  if (
    value.defaults !== undefined &&
    !isValidExecApprovalPolicy(value.defaults)
  ) {
    return false;
  }
  if (value.agents !== undefined) {
    if (
      !isPlainObject(value.agents) ||
      Object.hasOwn(value.agents, "__proto__")
    ) {
      return false;
    }
    if (
      !Object.values(value.agents).every((agent) =>
        isValidExecApprovalPolicy(agent, { allowAllowlist: true }),
      )
    ) {
      return false;
    }
  }
  return true;
};

const retireManagedExecApprovalsStub = ({
  stateDir,
  fsImpl = fs,
  DatabaseSyncImpl = DatabaseSync,
  now = Date.now,
} = {}) => {
  if (!stateDir) return { retired: false, reason: "missing-state-dir" };
  const sourcePath = path.join(stateDir, "exec-approvals.json");
  const databasePath = path.join(stateDir, "state", "openclaw.sqlite");
  if (!fsImpl.existsSync(sourcePath) || !fsImpl.existsSync(databasePath)) {
    return { retired: false, reason: "missing-source-or-database" };
  }
  try {
    if (!fsImpl.lstatSync(sourcePath).isFile()) {
      return { retired: false, reason: "source-not-regular-file" };
    }
    const legacy = JSON.parse(fsImpl.readFileSync(sourcePath, "utf8"));
    if (!isManagedExecApprovalsStub(legacy)) {
      return { retired: false, reason: "legacy-policy-not-managed-stub" };
    }

    let db;
    try {
      db = new DatabaseSyncImpl(databasePath, { readOnly: true });
      const row = db
        .prepare(
          "SELECT raw_json FROM exec_approvals_config WHERE config_key = 'current'",
        )
        .get();
      const canonical = row?.raw_json ? JSON.parse(row.raw_json) : null;
      if (!isValidExecApprovalsPolicy(canonical)) {
        return { retired: false, reason: "missing-valid-canonical-policy" };
      }
    } finally {
      db?.close();
    }

    const archivePath = `${sourcePath}.alphaclaw-retired-${Number(now())}`;
    fsImpl.renameSync(sourcePath, archivePath);
    return { retired: true, sourcePath, archivePath };
  } catch {
    return { retired: false, reason: "inspection-failed" };
  }
};

const findOpenclawPackage = ({
  resolveEntry = () => require.resolve("openclaw"),
} = {}) => {
  let dir = path.dirname(resolveEntry());
  while (dir !== path.dirname(dir)) {
    const packagePath = path.join(dir, "package.json");
    if (fs.existsSync(packagePath)) {
      const pkg = JSON.parse(fs.readFileSync(packagePath, "utf8"));
      if (pkg.name === "openclaw") return { dir, pkg };
    }
    dir = path.dirname(dir);
  }
  throw new Error("Could not resolve the installed OpenClaw package");
};

const resolveOpenclawCliPath = (packageInfo) => {
  const bin = packageInfo.pkg.bin;
  const relativePath = typeof bin === "string" ? bin : bin?.openclaw;
  if (!relativePath) {
    throw new Error("The installed OpenClaw package does not expose its CLI");
  }
  return path.join(packageInfo.dir, relativePath);
};

const runOpenclawDoctorPreflight = ({
  configPath,
  stateDir,
  env = process.env,
  fsImpl = fs,
  execFileSyncImpl = childProcess.execFileSync,
  packageInfo,
  stdio = "inherit",
} = {}) => {
  if (!configPath || !fsImpl.existsSync(configPath)) {
    return { ran: false, changed: false, reason: "missing-config" };
  }

  const resolvedPackageInfo = packageInfo || findOpenclawPackage();
  const resolvedStateDir = stateDir || path.dirname(configPath);
  const retiredManagedExecApprovals = retireManagedExecApprovalsStub({
    stateDir: resolvedStateDir,
    fsImpl,
  });
  const hasLegacyStateMigration = [
    path.join(resolvedStateDir, "exec-approvals.json"),
    path.join(resolvedStateDir, "exec-approvals.json.doctor-importing"),
  ].some((filePath) => fsImpl.existsSync(filePath));
  const original = fsImpl.readFileSync(configPath, "utf8");
  const config = JSON.parse(original);
  const configVersion = normalizeOpenclawVersion(
    config?.meta?.lastTouchedVersion,
  );
  const installedVersion = normalizeOpenclawVersion(
    resolvedPackageInfo.pkg.version,
  );
  if (
    !installedVersion ||
    (configVersion &&
      compareVersionParts(installedVersion, configVersion) <= 0 &&
      !hasLegacyStateMigration)
  ) {
    return {
      ran: false,
      changed: false,
      reason: retiredManagedExecApprovals.retired
        ? "retired-managed-exec-approvals"
        : "current-config",
      ...(retiredManagedExecApprovals.retired
        ? { retiredManagedExecApprovals }
        : {}),
    };
  }

  const cliPath = resolveOpenclawCliPath(resolvedPackageInfo);
  const commandEnv = {
    ...env,
    OPENCLAW_CONFIG_PATH: configPath,
    OPENCLAW_STATE_DIR: resolvedStateDir,
  };
  try {
    execFileSyncImpl(
      process.execPath,
      [cliPath, "doctor", "--fix", "--non-interactive", "--yes"],
      {
        env: commandEnv,
        stdio,
        timeout: 150_000,
      },
    );
    const migrated = fsImpl.readFileSync(configPath, "utf8");
    JSON.parse(migrated);
    execFileSyncImpl(
      process.execPath,
      [cliPath, "config", "validate", "--json"],
      {
        env: commandEnv,
        stdio: "ignore",
        timeout: 30_000,
      },
    );
    return {
      ran: true,
      changed: migrated !== original,
      fromVersion: configVersion || "unknown",
      toVersion: installedVersion,
      ...(retiredManagedExecApprovals.retired
        ? { retiredManagedExecApprovals }
        : {}),
    };
  } catch (error) {
    fsImpl.writeFileSync(configPath, original, "utf8");
    throw new Error(
      `OpenClaw config migration failed; restored the original config: ${error.message}`,
    );
  }
};

module.exports = {
  findOpenclawPackage,
  isValidExecApprovalsPolicy,
  isManagedExecApprovalsStub,
  retireManagedExecApprovalsStub,
  resolveOpenclawCliPath,
  runOpenclawDoctorPreflight,
};
