const fs = require("fs");
const path = require("path");

const { kRootDir } = require("./constants");
const {
  compareVersionParts,
  normalizeOpenclawVersion,
} = require("./helpers");
const {
  computePackageFingerprint,
  isPackageRootSymlink,
  packLocalPackageForInstall,
  resolvePackageRootFromEntryPath,
} = require("./package-fingerprint");

const getManagedOpenclawRuntimeDir = ({ rootDir = kRootDir } = {}) =>
  path.join(rootDir, ".openclaw-runtime");

const getBundledOpenclawPackageRoot = ({
  fsModule = fs,
  resolveImpl = require.resolve,
} = {}) =>
  resolvePackageRootFromEntryPath({
    fsModule,
    entryPath: resolveImpl("openclaw"),
  });

const getManagedOpenclawPackageRoot = ({ runtimeDir } = {}) =>
  path.join(
    runtimeDir || getManagedOpenclawRuntimeDir(),
    "node_modules",
    "openclaw",
  );

const getManagedOpenclawBinDir = ({ runtimeDir } = {}) =>
  path.join(
    runtimeDir || getManagedOpenclawRuntimeDir(),
    "node_modules",
    ".bin",
  );

const getManagedOpenclawBinPath = ({ runtimeDir } = {}) =>
  path.join(getManagedOpenclawBinDir({ runtimeDir }), "openclaw");

const getManagedOpenclawPackageJsonPath = ({ runtimeDir } = {}) =>
  path.join(
    getManagedOpenclawPackageRoot({ runtimeDir }),
    "package.json",
  );

const ensureManagedOpenclawRuntimeProject = ({
  fsModule = fs,
  runtimeDir,
} = {}) => {
  const resolvedRuntimeDir = runtimeDir || getManagedOpenclawRuntimeDir();
  const packageJsonPath = path.join(resolvedRuntimeDir, "package.json");
  fsModule.mkdirSync(resolvedRuntimeDir, { recursive: true });
  if (!fsModule.existsSync(packageJsonPath)) {
    fsModule.writeFileSync(
      packageJsonPath,
      JSON.stringify(
        {
          name: "alphaclaw-openclaw-runtime",
          private: true,
        },
        null,
        2,
      ),
    );
  }
  return {
    runtimeDir: resolvedRuntimeDir,
    packageJsonPath,
  };
};

const readManagedOpenclawRuntimeVersion = ({
  fsModule = fs,
  runtimeDir,
} = {}) => {
  try {
    const pkg = JSON.parse(
      fsModule.readFileSync(
        getManagedOpenclawPackageJsonPath({ runtimeDir }),
        "utf8",
      ),
    );
    return normalizeOpenclawVersion(pkg?.version || "");
  } catch {
    return null;
  }
};

const readBundledOpenclawVersion = ({
  fsModule = fs,
  resolveImpl = require.resolve,
} = {}) => {
  try {
    const packageRoot = getBundledOpenclawPackageRoot({
      fsModule,
      resolveImpl,
    });
    if (!packageRoot) return null;
    const pkg = JSON.parse(
      fsModule.readFileSync(path.join(packageRoot, "package.json"), "utf8"),
    );
    return normalizeOpenclawVersion(pkg?.version || "");
  } catch {
    return null;
  }
};

const shellQuote = (value) =>
  `'${String(value || "").replace(/'/g, `'\"'\"'`)}'`;

const applyManagedOpenclawPatch = ({
  execSyncImpl,
  fsModule = fs,
  logger = console,
  runtimeDir,
  version,
  alphaclawRoot = path.resolve(__dirname, "..", ".."),
} = {}) => {
  const normalizedVersion = normalizeOpenclawVersion(version);
  if (!normalizedVersion) return false;
  const patchesDir = path.join(alphaclawRoot, "patches");
  const patchFileName = `openclaw+${normalizedVersion}.patch`;
  const patchFilePath = path.join(patchesDir, patchFileName);
  if (!fsModule.existsSync(patchFilePath)) {
    return false;
  }

  const runtimePatchDirName = ".alphaclaw-patches";
  const runtimePatchDirPath = path.join(runtimeDir, runtimePatchDirName);
  try {
    if (fsModule.existsSync(runtimePatchDirPath)) {
      fsModule.rmSync(runtimePatchDirPath, { recursive: true, force: true });
    }
  } catch {}
  fsModule.symlinkSync(patchesDir, runtimePatchDirPath);

  const patchPackageMain = require.resolve("patch-package/dist/index.js", {
    paths: [alphaclawRoot],
  });
  logger.log(
    `[alphaclaw] Applying bundled OpenClaw patch for ${normalizedVersion}...`,
  );
  execSyncImpl(
    `${shellQuote(process.execPath)} ${shellQuote(patchPackageMain)} --patch-dir ${shellQuote(runtimePatchDirName)}`,
    {
      cwd: runtimeDir,
      stdio: "inherit",
      timeout: 120000,
    },
  );
  return true;
};

const installManagedOpenclawRuntime = ({
  execSyncImpl,
  fsModule = fs,
  logger = console,
  runtimeDir,
  spec,
  sourcePath,
  alphaclawRoot,
} = {}) => {
  const normalizedSourcePath = String(sourcePath || "").trim();
  const normalizedSpec = normalizedSourcePath
    ? normalizedSourcePath
    : String(spec || "").trim() || "openclaw@latest";
  ensureManagedOpenclawRuntimeProject({
    fsModule,
    runtimeDir,
  });
  let packedSource = null;
  try {
    const installTarget = normalizedSourcePath
      ? (() => {
          packedSource = packLocalPackageForInstall({
            execSyncImpl,
            fsModule,
            packageRoot: normalizedSourcePath,
            tempDirPrefix: "openclaw-runtime-pack-",
          });
          return packedSource.tarballPath;
        })()
      : normalizedSpec;
    execSyncImpl(
      `npm install ${shellQuote(installTarget)} --omit=dev --no-save --save=false --package-lock=false --prefer-online`,
      {
        cwd: runtimeDir,
        stdio: "inherit",
        timeout: 180000,
      },
    );
  } finally {
    packedSource?.cleanup?.();
  }
  const installedVersion = readManagedOpenclawRuntimeVersion({
    fsModule,
    runtimeDir,
  });
  applyManagedOpenclawPatch({
    execSyncImpl,
    fsModule,
    logger,
    runtimeDir,
    version: installedVersion,
    alphaclawRoot,
  });
  return {
    spec: normalizedSpec,
    version: installedVersion,
  };
};

const syncManagedOpenclawRuntimeWithBundled = ({
  execSyncImpl,
  fsModule = fs,
  logger = console,
  runtimeDir,
  resolveImpl,
  alphaclawRoot,
} = {}) => {
  const bundledPackageRoot = getBundledOpenclawPackageRoot({
    fsModule,
    resolveImpl,
  });
  const bundledVersion = readBundledOpenclawVersion({
    fsModule,
    resolveImpl,
  });
  if (!bundledVersion) {
    return {
      checked: false,
      synced: false,
      bundledVersion: null,
      runtimeVersion: readManagedOpenclawRuntimeVersion({ fsModule, runtimeDir }),
    };
  }

  const runtimeVersion = readManagedOpenclawRuntimeVersion({
    fsModule,
    runtimeDir,
  });
  const runtimePackageRoot = getManagedOpenclawPackageRoot({ runtimeDir });
  const runtimePackageRootIsSymlink = isPackageRootSymlink({
    fsModule,
    packageRoot: runtimePackageRoot,
  });
  const bundledFingerprint = computePackageFingerprint({
    fsModule,
    packageRoot: bundledPackageRoot,
  });
  const runtimeFingerprint = computePackageFingerprint({
    fsModule,
    packageRoot: runtimePackageRoot,
    packageJsonPath: getManagedOpenclawPackageJsonPath({ runtimeDir }),
  });
  if (runtimeVersion && compareVersionParts(runtimeVersion, bundledVersion) >= 0) {
    if (
      compareVersionParts(runtimeVersion, bundledVersion) > 0 ||
      (!runtimePackageRootIsSymlink &&
        (!bundledFingerprint || runtimeFingerprint === bundledFingerprint))
    ) {
      return {
        checked: true,
        synced: false,
        bundledVersion,
        runtimeVersion,
      };
    }
    logger.log(
      runtimePackageRootIsSymlink
        ? `[alphaclaw] Managed OpenClaw runtime ${runtimeVersion} is symlinked to the bundled package; refreshing runtime...`
        : `[alphaclaw] Managed OpenClaw runtime ${runtimeVersion} differs from bundled ${bundledVersion}; refreshing runtime...`,
    );
  } else {
    logger.log(
      runtimeVersion
        ? `[alphaclaw] Managed OpenClaw runtime ${runtimeVersion} is older than bundled ${bundledVersion}; syncing runtime...`
        : `[alphaclaw] Managed OpenClaw runtime missing; installing bundled OpenClaw ${bundledVersion}...`,
    );
  }

  const installResult = installManagedOpenclawRuntime({
    execSyncImpl,
    fsModule,
    logger,
    runtimeDir,
    sourcePath: bundledPackageRoot,
    alphaclawRoot,
  });
  return {
    checked: true,
    synced: true,
    bundledVersion,
    runtimeVersion: installResult.version || bundledVersion,
  };
};

const prependManagedOpenclawBinToPath = ({
  env = process.env,
  fsModule = fs,
  logger = console,
  runtimeDir,
} = {}) => {
  const resolvedRuntimeDir = runtimeDir || getManagedOpenclawRuntimeDir();
  const binDir = getManagedOpenclawBinDir({ runtimeDir: resolvedRuntimeDir });
  const binPath = getManagedOpenclawBinPath({ runtimeDir: resolvedRuntimeDir });
  if (!fsModule.existsSync(binPath)) {
    return false;
  }
  const currentEntries = String(env.PATH || "")
    .split(path.delimiter)
    .filter(Boolean);
  const nextEntries = [binDir, ...currentEntries.filter((entry) => entry !== binDir)];
  env.PATH = nextEntries.join(path.delimiter);
  logger.log(`[alphaclaw] Using managed OpenClaw runtime from ${resolvedRuntimeDir}`);
  return true;
};

module.exports = {
  applyManagedOpenclawPatch,
  ensureManagedOpenclawRuntimeProject,
  getBundledOpenclawPackageRoot,
  getManagedOpenclawBinDir,
  getManagedOpenclawBinPath,
  getManagedOpenclawPackageRoot,
  getManagedOpenclawPackageJsonPath,
  getManagedOpenclawRuntimeDir,
  installManagedOpenclawRuntime,
  prependManagedOpenclawBinToPath,
  readBundledOpenclawVersion,
  readManagedOpenclawRuntimeVersion,
  syncManagedOpenclawRuntimeWithBundled,
};
