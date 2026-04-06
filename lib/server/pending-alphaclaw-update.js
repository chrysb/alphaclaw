const path = require("path");

const {
  installManagedAlphaclawRuntime,
} = require("./alphaclaw-runtime");

const buildPendingAlphaclawInstallSpec = (marker = {}) => {
  const explicitSpec = String(marker?.spec || "").trim();
  if (explicitSpec) {
    return explicitSpec;
  }
  const targetVersion = String(marker?.to || "").trim() || "latest";
  return `@chrysb/alphaclaw@${targetVersion}`;
};

const applyPendingAlphaclawUpdate = ({
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

  const spec = buildPendingAlphaclawInstallSpec(marker);
  logger.log(`[alphaclaw] Pending update detected, installing ${spec}...`);

  const resolvedInstallDir = path.resolve(String(installDir || ""));
  const installParentDir = path.dirname(resolvedInstallDir);
  const tempInstallDir = fsModule.mkdtempSync(
    path.join(installParentDir, `${path.basename(resolvedInstallDir)}-pending-`),
  );

  try {
    installManagedAlphaclawRuntime({
      execSyncImpl,
      fsModule,
      runtimeDir: tempInstallDir,
      spec,
    });
    try {
      fsModule.rmSync(resolvedInstallDir, { recursive: true, force: true });
    } catch {}
    fsModule.renameSync(tempInstallDir, resolvedInstallDir);
    fsModule.unlinkSync(markerPath);
    logger.log("[alphaclaw] Update applied successfully");
    return {
      attempted: true,
      installed: true,
      spec,
    };
  } catch (error) {
    logger.log(`[alphaclaw] Update install failed: ${error.message}`);
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
  applyPendingAlphaclawUpdate,
  buildPendingAlphaclawInstallSpec,
};
