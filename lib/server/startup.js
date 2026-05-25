const runOnboardedBootSequence = ({
  ensureManagedExecDefaults,
  ensureUsageTrackerPluginConfig,
  doSyncPromptFiles,
  reloadEnv,
  syncChannelConfig,
  readEnvFile,
  ensureGatewayProxyConfig,
  resolveSetupUrl,
  startGateway,
  startDenchWebRuntime,
  watchdog,
  gmailWatchService,
}) => {
  try {
    ensureManagedExecDefaults();
  } catch (error) {
    console.error(
      `[alphaclaw] Failed to ensure managed exec defaults on boot: ${error.message}`,
    );
  }
  try {
    ensureUsageTrackerPluginConfig();
  } catch (error) {
    console.error(
      `[alphaclaw] Failed to ensure usage-tracker plugin config on boot: ${error.message}`,
    );
  }
  doSyncPromptFiles();
  reloadEnv();
  syncChannelConfig(readEnvFile());
  ensureGatewayProxyConfig(resolveSetupUrl());
  startGateway();
  startDenchWebRuntime?.({ reason: "boot" })?.catch?.((error) => {
    console.error(
      `[alphaclaw] Failed to start DenchClaw web runtime on boot: ${error.message}`,
    );
  });
  watchdog.start();
  gmailWatchService.start();
};

module.exports = {
  runOnboardedBootSequence,
};
