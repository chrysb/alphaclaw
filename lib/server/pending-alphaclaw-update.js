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

  try {
    installManagedAlphaclawRuntime({
      execSyncImpl,
      fsModule,
      runtimeDir: installDir,
      spec,
    });
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
