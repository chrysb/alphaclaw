const fs = require("fs");
const os = require("os");
const path = require("path");

const {
  ensureUsageTrackerPluginConfig,
  ensureUsageTrackerPluginEntry,
  kUsageTrackerPluginPath,
} = require("../../lib/server/usage-tracker-config");

const createTempOpenclawDir = () =>
  fs.mkdtempSync(path.join(os.tmpdir(), "alphaclaw-usage-tracker-test-"));

describe("server/usage-tracker-config", () => {
  it("adds conversation access while preserving supported hook policy", () => {
    const cfg = {
      plugins: {
        allow: ["memory-core"],
        load: { paths: [] },
        entries: {
          "usage-tracker": {
            enabled: false,
            hooks: {
              allowPromptInjection: false,
            },
          },
        },
      },
    };

    const changed = ensureUsageTrackerPluginEntry(cfg);

    expect(changed).toBe(true);
    expect(cfg.plugins.allow).toEqual(["memory-core", "usage-tracker"]);
    expect(cfg.plugins.load.paths).toContain(kUsageTrackerPluginPath);
    expect(cfg.plugins.entries["usage-tracker"]).toEqual({
      enabled: true,
      hooks: {
        allowPromptInjection: false,
        allowConversationAccess: true,
      },
    });
  });

  it("forces conversation access policy when an older alphaclaw config has it missing or false", () => {
    const cfg = {
      plugins: {
        allow: ["usage-tracker"],
        load: { paths: [kUsageTrackerPluginPath] },
        entries: {
          "usage-tracker": {
            enabled: true,
            hooks: {
              allowPromptInjection: false,
              allowConversationAccess: false,
            },
          },
        },
      },
    };

    const changed = ensureUsageTrackerPluginEntry(cfg);

    expect(changed).toBe(true);
    expect(cfg.plugins.entries["usage-tracker"].hooks).toEqual({
      allowPromptInjection: false,
      allowConversationAccess: true,
    });
  });

  it("repairs existing openclaw configs on boot for older alphaclaw installs", () => {
    const openclawDir = createTempOpenclawDir();
    const configPath = path.join(openclawDir, "openclaw.json");
    fs.writeFileSync(
      configPath,
      JSON.stringify(
        {
          plugins: {
            allow: ["usage-tracker"],
            load: { paths: [kUsageTrackerPluginPath] },
            entries: {
              "usage-tracker": { enabled: true },
            },
          },
        },
        null,
        2,
      ),
      "utf8",
    );

    const changed = ensureUsageTrackerPluginConfig({ fsModule: fs, openclawDir });

    expect(changed).toBe(true);
    const next = JSON.parse(fs.readFileSync(configPath, "utf8"));
    expect(next.plugins.entries["usage-tracker"].hooks).toEqual({
      allowConversationAccess: true,
    });
  });

  it("persists the Telegram streaming migration during boot reconciliation", () => {
    const openclawDir = createTempOpenclawDir();
    const configPath = path.join(openclawDir, "openclaw.json");
    fs.writeFileSync(
      configPath,
      JSON.stringify({ channels: { telegram: { streaming: true } } }),
      "utf8",
    );

    expect(ensureUsageTrackerPluginConfig({ fsModule: fs, openclawDir })).toBe(true);

    const next = JSON.parse(fs.readFileSync(configPath, "utf8"));
    expect(next.channels.telegram.streaming).toEqual({ mode: "partial" });
  });
});
