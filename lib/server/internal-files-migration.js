const path = require("path");

const kInternalDirName = ".alphaclaw";
const kHourlyGitSyncFileName = "hourly-git-sync.sh";
const kCliDeviceAutoApprovedFileName = ".cli-device-auto-approved";
const kOpenclawGitignoreHookEntries = [
  "!hooks/",
  "!hooks/transforms/",
  "!hooks/transforms/**",
];

const buildManagedPaths = ({ openclawDir, pathModule = path }) => {
  const internalDir = pathModule.join(openclawDir, kInternalDirName);
  return {
    internalDir,
    hourlyGitSyncPath: pathModule.join(internalDir, kHourlyGitSyncFileName),
    cliDeviceAutoApprovedPath: pathModule.join(
      internalDir,
      kCliDeviceAutoApprovedFileName,
    ),
    legacyHourlyGitSyncPath: pathModule.join(
      openclawDir,
      kHourlyGitSyncFileName,
    ),
    legacyCliDeviceAutoApprovedPath: pathModule.join(
      openclawDir,
      kCliDeviceAutoApprovedFileName,
    ),
  };
};

const moveFile = ({ fs, sourcePath, targetPath, mode }) => {
  try {
    fs.renameSync(sourcePath, targetPath);
    return true;
  } catch {
    fs.copyFileSync(sourcePath, targetPath);
    if (Number.isFinite(mode)) {
      fs.chmodSync(targetPath, mode);
    }
    fs.rmSync(sourcePath, { force: true });
    return true;
  }
};

const migrateManagedInternalFiles = ({
  fs,
  openclawDir,
  pathModule = path,
  logger = console,
}) => {
  const managedPaths = buildManagedPaths({ openclawDir, pathModule });
  fs.mkdirSync(managedPaths.internalDir, { recursive: true });

  const migrateOne = ({ sourcePaths, targetPath }) => {
    const existingSourcePath = sourcePaths.find((sourcePath) =>
      fs.existsSync(sourcePath),
    );
    if (fs.existsSync(targetPath)) {
      sourcePaths.forEach((sourcePath) => {
        if (sourcePath !== targetPath && fs.existsSync(sourcePath)) {
          fs.rmSync(sourcePath, { force: true });
        }
      });
      return;
    }
    if (!existingSourcePath) return;
    const sourceStats = fs.statSync(existingSourcePath);
    moveFile({
      fs,
      sourcePath: existingSourcePath,
      targetPath,
      mode: sourceStats.mode,
    });
    sourcePaths.forEach((sourcePath) => {
      if (
        sourcePath !== existingSourcePath &&
        sourcePath !== targetPath &&
        fs.existsSync(sourcePath)
      ) {
        fs.rmSync(sourcePath, { force: true });
      }
    });
  };

  try {
    const gitignorePath = pathModule.join(openclawDir, ".gitignore");
    if (fs.existsSync(gitignorePath)) {
      const raw = String(fs.readFileSync(gitignorePath, "utf8") || "");
      const existingLines = raw.split(/\r?\n/);
      const existingSet = new Set(existingLines.map((line) => line.trim()));
      const missing = kOpenclawGitignoreHookEntries.filter(
        (line) => !existingSet.has(line),
      );
      if (missing.length) {
        const separator = raw.endsWith("\n") || !raw.length ? "" : "\n";
        const next = `${raw}${separator}${missing.join("\n")}\n`;
        fs.writeFileSync(gitignorePath, next);
      }
    }
    migrateOne({
      sourcePaths: [managedPaths.legacyHourlyGitSyncPath],
      targetPath: managedPaths.hourlyGitSyncPath,
    });
    migrateOne({
      sourcePaths: [managedPaths.legacyCliDeviceAutoApprovedPath],
      targetPath: managedPaths.cliDeviceAutoApprovedPath,
    });
  } catch (error) {
    logger.error?.(
      `[alphaclaw] Failed to migrate internal managed files: ${error.message || String(error)}`,
    );
  }

  return managedPaths;
};

module.exports = {
  buildManagedPaths,
  migrateManagedInternalFiles,
};
