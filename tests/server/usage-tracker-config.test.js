const {
  ensureUsageTrackerPluginEntry,
  kUsageTrackerPluginPath,
} = require("../../lib/server/usage-tracker-config");

describe("server/usage-tracker-config", () => {
  it("replaces legacy alphaclaw usage-tracker paths with the canonical path", () => {
    const cfg = {
      plugins: {
        allow: [],
        load: {
          paths: [
            "/app/node_modules/@chrysb/alphaclaw/lib/plugin/usage-tracker",
            "/data/.alphaclaw-runtime/node_modules/@chrysb/alphaclaw/lib/plugin/usage-tracker",
            "/data/.alphaclaw-runtime/node_modules/@chrysb/alphaclaw/lib/plugin/usage-tracker/index.js",
            "/data/.alphaclaw-runtime/node_modules/@chrysb/alphaclaw/lib/plugin/usage-tracker/openclaw.plugin.json",
            "/custom/plugins/other-plugin",
          ],
        },
        entries: {},
      },
    };

    const changed = ensureUsageTrackerPluginEntry(cfg);

    expect(changed).toBe(true);
    expect(cfg.plugins.allow).toContain("usage-tracker");
    expect(cfg.plugins.load.paths).toEqual([
      "/custom/plugins/other-plugin",
      kUsageTrackerPluginPath,
    ]);
    expect(cfg.plugins.entries["usage-tracker"]).toEqual({ enabled: true });
  });

  it("is a no-op when the canonical usage-tracker path is already present", () => {
    const cfg = {
      plugins: {
        allow: ["usage-tracker"],
        load: { paths: [kUsageTrackerPluginPath] },
        entries: {
          "usage-tracker": { enabled: true },
        },
      },
    };

    const changed = ensureUsageTrackerPluginEntry(cfg);

    expect(changed).toBe(false);
    expect(cfg.plugins.load.paths).toEqual([kUsageTrackerPluginPath]);
  });
});
