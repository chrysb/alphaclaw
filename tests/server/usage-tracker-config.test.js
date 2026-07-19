const fs = require("fs");
const os = require("os");
const path = require("path");

const {
  ensureUsageTrackerPluginConfig,
  ensureUsageTrackerPluginEntry,
  pruneStaleUsageTrackerPaths,
  reconcileDiscordGroupPolicy,
  reconcileEnabledChannelPlugins,
  reconcileManagedPluginConfig,
  kDefaultDiscordGroupPolicy,
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

  it("prunes a usage-tracker path left by a previous install location", () => {
    const cfg = {
      plugins: {
        allow: [],
        load: {
          paths: [
            "/app/node_modules/@chrysb/alphaclaw/lib/plugin/usage-tracker",
            kUsageTrackerPluginPath,
            "/app/node_modules/some-other-plugin",
          ],
        },
        entries: {},
      },
    };

    const changed = pruneStaleUsageTrackerPaths(cfg);

    expect(changed).toBe(true);
    expect(cfg.plugins.load.paths).toEqual([
      kUsageTrackerPluginPath,
      "/app/node_modules/some-other-plugin",
    ]);
  });

  it("migrates a stale @chrysb usage-tracker path to the canonical path on boot", () => {
    const openclawDir = createTempOpenclawDir();
    const configPath = path.join(openclawDir, "openclaw.json");
    fs.writeFileSync(
      configPath,
      JSON.stringify(
        {
          plugins: {
            allow: ["usage-tracker"],
            load: {
              paths: [
                "/app/node_modules/@chrysb/alphaclaw/lib/plugin/usage-tracker",
              ],
            },
            entries: { "usage-tracker": { enabled: true } },
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
    expect(next.plugins.load.paths).toEqual([kUsageTrackerPluginPath]);
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

  it("repairs a missing Codex plugin allowlist entry during boot", () => {
    const openclawDir = createTempOpenclawDir();
    const configPath = path.join(openclawDir, "openclaw.json");
    fs.writeFileSync(
      configPath,
      JSON.stringify({
        agents: {
          defaults: {
            model: { primary: "openai/gpt-5.6-sol" },
            models: { "openai/gpt-5.6-sol": {} },
          },
        },
        plugins: { allow: ["telegram"], entries: {} },
      }),
      "utf8",
    );

    expect(ensureUsageTrackerPluginConfig({ fsModule: fs, openclawDir })).toBe(true);

    const next = JSON.parse(fs.readFileSync(configPath, "utf8"));
    expect(next.plugins.allow).toEqual(["telegram", "usage-tracker", "codex"]);
    expect(next.plugins.entries.codex).toEqual({ enabled: true });
  });

  it("keeps prune a no-op when only the canonical path is present", () => {
    const cfg = {
      plugins: {
        allow: [],
        load: { paths: [kUsageTrackerPluginPath] },
        entries: {},
      },
    };

    expect(pruneStaleUsageTrackerPaths(cfg)).toBe(false);
    expect(cfg.plugins.load.paths).toEqual([kUsageTrackerPluginPath]);
  });

  describe("reconcileDiscordGroupPolicy", () => {
    it("ignores missing or disabled discord channel configs", () => {
      expect(reconcileDiscordGroupPolicy({})).toBe(false);
      expect(
        reconcileDiscordGroupPolicy({ channels: { discord: "bad" } }),
      ).toBe(false);
      expect(
        reconcileDiscordGroupPolicy({
          channels: { discord: { enabled: false, groupPolicy: "allowlist" } },
        }),
      ).toBe(false);
    });

    it("keeps allowlist policy when a guild allowlist exists", () => {
      const cfg = {
        channels: {
          discord: {
            enabled: true,
            groupPolicy: "allowlist",
            guilds: { "123": {} },
          },
        },
      };
      expect(reconcileDiscordGroupPolicy(cfg)).toBe(false);
      expect(cfg.channels.discord.groupPolicy).toBe("allowlist");
    });

    it("keeps non-allowlist policies untouched", () => {
      const cfg = {
        channels: { discord: { enabled: true, groupPolicy: "open" } },
      };
      expect(reconcileDiscordGroupPolicy(cfg)).toBe(false);
      expect(cfg.channels.discord.groupPolicy).toBe("open");
    });

    it("downgrades allowlist policy without a guild allowlist to disabled", () => {
      const cfg = {
        channels: {
          discord: { enabled: true, groupPolicy: "allowlist", guilds: {} },
        },
      };
      expect(reconcileDiscordGroupPolicy(cfg)).toBe(true);
      expect(cfg.channels.discord.groupPolicy).toBe(kDefaultDiscordGroupPolicy);
    });
  });

  describe("reconcileEnabledChannelPlugins", () => {
    it("allows and enables plugins for enabled channels only", () => {
      const cfg = {
        channels: {
          telegram: { enabled: true },
          discord: { enabled: false },
          slack: "not-an-object",
          whatsapp: { enabled: true },
        },
        plugins: {
          allow: ["telegram"],
          load: { paths: [] },
          entries: { telegram: { enabled: false } },
        },
      };

      expect(reconcileEnabledChannelPlugins(cfg)).toBe(true);
      expect(cfg.plugins.allow).toEqual(["telegram", "whatsapp"]);
      expect(cfg.plugins.entries.telegram).toEqual({ enabled: true });
      expect(cfg.plugins.entries.whatsapp).toEqual({ enabled: true });
      expect(cfg.plugins.entries.discord).toBeUndefined();
      expect(cfg.plugins.entries.slack).toBeUndefined();

      // A second pass finds nothing left to change.
      expect(reconcileEnabledChannelPlugins(cfg)).toBe(false);
    });
  });

  it("reconciles channel plugins and discord policy in the managed pass", () => {
    const cfg = {
      channels: {
        telegram: { enabled: true },
        discord: { enabled: true, groupPolicy: "allowlist" },
      },
      plugins: { allow: [], load: { paths: [] }, entries: {} },
    };

    expect(reconcileManagedPluginConfig(cfg)).toBe(true);
    expect(cfg.plugins.allow).toContain("usage-tracker");
    expect(cfg.plugins.allow).toContain("telegram");
    expect(cfg.plugins.allow).toContain("discord");
    expect(cfg.channels.discord.groupPolicy).toBe(kDefaultDiscordGroupPolicy);
  });

  it("returns false without rewriting an already reconciled config", () => {
    const openclawDir = createTempOpenclawDir();
    const configPath = path.join(openclawDir, "openclaw.json");
    const reconciled = {
      plugins: {
        allow: ["usage-tracker"],
        load: { paths: [kUsageTrackerPluginPath] },
        entries: {
          "usage-tracker": {
            enabled: true,
            hooks: { allowConversationAccess: true },
          },
        },
      },
    };
    fs.writeFileSync(configPath, JSON.stringify(reconciled, null, 2), "utf8");
    const before = fs.readFileSync(configPath, "utf8");

    expect(ensureUsageTrackerPluginConfig({ fsModule: fs, openclawDir })).toBe(false);
    expect(fs.readFileSync(configPath, "utf8")).toBe(before);
  });
});
