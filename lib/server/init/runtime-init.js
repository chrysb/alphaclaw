const initializeServerRuntime = ({
  fs,
  constants,
  startEnvWatcher,
  attachGatewaySignalHandlers,
  cleanupStaleImportTempDirs,
  migrateManagedInternalFiles,
  isOnboarded,
  isReadOnlyOnboarding,
}) => {
  startEnvWatcher();
  attachGatewaySignalHandlers();
  cleanupStaleImportTempDirs();
  if (isOnboarded() && !isReadOnlyOnboarding({ fsModule: fs })) {
    migrateManagedInternalFiles({
      fs,
      openclawDir: constants.OPENCLAW_DIR,
    });
  }
};

const initializeServerDatabases = ({
  constants,
  initWebhooksDb,
  initWatchdogDb,
  initUsageDb,
  initDoctorDb,
}) => {
  initWebhooksDb({
    rootDir: constants.kRootDir,
    pruneDays: constants.kWebhookPruneDays,
  });
  initWatchdogDb({
    rootDir: constants.kRootDir,
    pruneDays: constants.kWatchdogLogRetentionDays,
  });
  initUsageDb({
    rootDir: constants.kRootDir,
  });
  initDoctorDb({
    rootDir: constants.kRootDir,
  });
};

module.exports = {
  initializeServerRuntime,
  initializeServerDatabases,
};
