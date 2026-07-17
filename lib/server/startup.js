const runOnboardedBootSequence = ({
  ensureManagedExecDefaults,
  ensureUsageTrackerPluginConfig,
  ensureWebhookMappingIds,
  doSyncPromptFiles,
  reloadEnv,
  syncChannelConfig,
  readEnvFile,
  ensureGatewayProxyConfig,
  resolveSetupUrl,
  startGateway,
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
  try {
    const result = ensureWebhookMappingIds();
    if (result?.changed) {
      console.log(
        `[alphaclaw] Added IDs to webhook mappings: ${result.updatedIds.join(", ")}`,
      );
    }
  } catch (error) {
    console.error(
      `[alphaclaw] Failed to ensure webhook mapping IDs on boot: ${error.message}`,
    );
  }
  doSyncPromptFiles();
  reloadEnv();
  syncChannelConfig(readEnvFile());
  ensureGatewayProxyConfig(resolveSetupUrl());
  startGateway();
  watchdog.start();
  gmailWatchService.start();
};

module.exports = {
  runOnboardedBootSequence,
};
