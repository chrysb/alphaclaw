const { runOnboardedBootSequence } = require("../../lib/server/startup");

describe("server/startup", () => {
  it("syncs gateway proxy config with the resolved setup URL before startup", () => {
    const callOrder = [];
    const ensureManagedExecDefaults = vi.fn(() =>
      callOrder.push("ensureManagedExecDefaults"),
    );
    const ensureUsageTrackerPluginConfig = vi.fn(() =>
      callOrder.push("ensureUsageTrackerPluginConfig"),
    );
    const ensureWebhookMappingIds = vi.fn(() => {
      callOrder.push("ensureWebhookMappingIds");
      return { changed: false, updatedIds: [] };
    });
    const doSyncPromptFiles = vi.fn(() => callOrder.push("doSyncPromptFiles"));
    const reloadEnv = vi.fn(() => callOrder.push("reloadEnv"));
    const readEnvFile = vi.fn(() => {
      callOrder.push("readEnvFile");
      return [{ key: "OPENAI_API_KEY", value: "sk-test" }];
    });
    const syncChannelConfig = vi.fn(() => callOrder.push("syncChannelConfig"));
    const resolveSetupUrl = vi.fn(() => {
      callOrder.push("resolveSetupUrl");
      return "https://setup.example.com";
    });
    const ensureGatewayProxyConfig = vi.fn(() => callOrder.push("ensureGatewayProxyConfig"));
    const startGateway = vi.fn(() => callOrder.push("startGateway"));
    const watchdog = {
      start: vi.fn(() => callOrder.push("watchdog.start")),
    };
    const gmailWatchService = {
      start: vi.fn(() => callOrder.push("gmailWatchService.start")),
    };

    runOnboardedBootSequence({
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
    });

    expect(ensureGatewayProxyConfig).toHaveBeenCalledWith("https://setup.example.com");
    expect(callOrder).toEqual([
      "ensureManagedExecDefaults",
      "ensureUsageTrackerPluginConfig",
      "ensureWebhookMappingIds",
      "doSyncPromptFiles",
      "reloadEnv",
      "readEnvFile",
      "syncChannelConfig",
      "resolveSetupUrl",
      "ensureGatewayProxyConfig",
      "startGateway",
      "watchdog.start",
      "gmailWatchService.start",
    ]);
  });

  const createBootDeps = (overrides = {}) => ({
    ensureManagedExecDefaults: vi.fn(),
    ensureUsageTrackerPluginConfig: vi.fn(),
    ensureWebhookMappingIds: vi.fn(() => ({ changed: false, updatedIds: [] })),
    doSyncPromptFiles: vi.fn(),
    reloadEnv: vi.fn(),
    syncChannelConfig: vi.fn(),
    readEnvFile: vi.fn(() => []),
    ensureGatewayProxyConfig: vi.fn(),
    resolveSetupUrl: vi.fn(() => "https://setup.example.com"),
    startGateway: vi.fn(),
    watchdog: { start: vi.fn() },
    gmailWatchService: { start: vi.fn() },
    ...overrides,
  });

  it("logs and continues when the ensure steps fail", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const deps = createBootDeps({
      ensureManagedExecDefaults: vi.fn(() => {
        throw new Error("exec defaults broke");
      }),
      ensureUsageTrackerPluginConfig: vi.fn(() => {
        throw new Error("usage tracker broke");
      }),
      ensureWebhookMappingIds: vi.fn(() => {
        throw new Error("webhook ids broke");
      }),
    });

    runOnboardedBootSequence(deps);

    expect(errorSpy).toHaveBeenCalledWith(
      "[alphaclaw] Failed to ensure managed exec defaults on boot: exec defaults broke",
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "[alphaclaw] Failed to ensure usage-tracker plugin config on boot: usage tracker broke",
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "[alphaclaw] Failed to ensure webhook mapping IDs on boot: webhook ids broke",
    );
    // Boot still proceeds through the remaining steps.
    expect(deps.startGateway).toHaveBeenCalled();
    expect(deps.watchdog.start).toHaveBeenCalled();
    expect(deps.gmailWatchService.start).toHaveBeenCalled();
  });

  it("logs the updated webhook mapping ids when the mapping changed", () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const deps = createBootDeps({
      ensureWebhookMappingIds: vi.fn(() => ({
        changed: true,
        updatedIds: ["gmail", "stripe"],
      })),
    });

    runOnboardedBootSequence(deps);

    expect(logSpy).toHaveBeenCalledWith(
      "[alphaclaw] Added IDs to webhook mappings: gmail, stripe",
    );
  });
});
