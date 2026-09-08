const childProcess = require("child_process");
const fs = require("fs");
const path = require("path");
const {
  compareVersionParts,
  normalizeOpenclawVersion,
} = require("./helpers");

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
  const original = fsImpl.readFileSync(configPath, "utf8");
  const config = JSON.parse(original);
  const configVersion = normalizeOpenclawVersion(
    config?.meta?.lastTouchedVersion,
  );
  const installedVersion = normalizeOpenclawVersion(
    resolvedPackageInfo.pkg.version,
  );
  if (
    !configVersion ||
    !installedVersion ||
    compareVersionParts(installedVersion, configVersion) <= 0
  ) {
    return { ran: false, changed: false, reason: "current-config" };
  }

  const cliPath = resolveOpenclawCliPath(resolvedPackageInfo);
  try {
    execFileSyncImpl(
      process.execPath,
      [cliPath, "doctor", "--fix", "--non-interactive", "--yes"],
      {
        env: {
          ...env,
          OPENCLAW_CONFIG_PATH: configPath,
          OPENCLAW_STATE_DIR: resolvedStateDir,
        },
        stdio,
        timeout: 150_000,
      },
    );
    const migrated = fsImpl.readFileSync(configPath, "utf8");
    JSON.parse(migrated);
    return {
      ran: true,
      changed: migrated !== original,
      fromVersion: configVersion,
      toVersion: installedVersion,
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
  resolveOpenclawCliPath,
  runOpenclawDoctorPreflight,
};
