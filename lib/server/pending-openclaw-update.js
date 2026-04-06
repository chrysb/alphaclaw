const path = require("path");

const {
  installManagedOpenclawRuntime,
} = require("./openclaw-runtime");

const buildPendingOpenclawInstallSpec = (marker = {}) => {
  const explicitSpec = String(marker?.spec || "").trim();
  if (explicitSpec) {
    return explicitSpec;
  }
  const targetVersion = String(marker?.to || "").trim() || "latest";
  return `openclaw@${targetVersion}`;
};

const applyPendingOpenclawUpdate = ({
  execSyncImpl,
  fsModule,
  installDir,
  logger = console,
  markerPath,
}) => {
  if (!fsModule.existsSync(markerPath)) {
    return {
      attempted: false,
      installed: false,
      spec: "",
    };
  }

  let marker = {};
  try {
    marker = JSON.parse(fsModule.readFileSync(markerPath, "utf8"));
  } catch {
    marker = {};
  }

  const spec = buildPendingOpenclawInstallSpec(marker);
  logger.log(`[alphaclaw] Pending OpenClaw update detected, installing ${spec}...`);

  const resolvedInstallDir = path.resolve(String(installDir || ""));
  const installParentDir = path.dirname(resolvedInstallDir);
  const tempInstallDir = fsModule.mkdtempSync(
    path.join(installParentDir, `${path.basename(resolvedInstallDir)}-pending-`),
  );

  try {
    installManagedOpenclawRuntime({
      execSyncImpl,
      fsModule,
      logger,
      runtimeDir: tempInstallDir,
      spec,
    });
    try {
      fsModule.rmSync(resolvedInstallDir, { recursive: true, force: true });
    } catch {}
    fsModule.renameSync(tempInstallDir, resolvedInstallDir);
    fsModule.unlinkSync(markerPath);
    logger.log("[alphaclaw] OpenClaw update applied successfully");
    return {
      attempted: true,
      installed: true,
      spec,
    };
  } catch (error) {
    logger.log(`[alphaclaw] OpenClaw update install failed: ${error.message}`);
    try {
      fsModule.rmSync(tempInstallDir, { recursive: true, force: true });
    } catch {}
    try {
      fsModule.unlinkSync(markerPath);
    } catch {}
    return {
      attempted: true,
      installed: false,
      spec,
      error,
    };
  }
};

module.exports = {
  applyPendingOpenclawUpdate,
  buildPendingOpenclawInstallSpec,
};
