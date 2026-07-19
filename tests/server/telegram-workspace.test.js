const fs = require("fs");
const os = require("os");
const path = require("path");

const { syncConfigForTelegram } = require("../../lib/server/telegram-workspace");

const writeOpenclawConfig = ({ dir, config }) => {
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    path.join(dir, "openclaw.json"),
    JSON.stringify(config, null, 2),
    "utf8",
  );
};

const readOpenclawConfig = ({ dir }) =>
  JSON.parse(fs.readFileSync(path.join(dir, "openclaw.json"), "utf8"));

describe("server/telegram-workspace", () => {
  let tempRootDir = "";
  let openclawDir = "";

  beforeEach(() => {
    tempRootDir = fs.mkdtempSync(path.join(os.tmpdir(), "alphaclaw-test-"));
    openclawDir = path.join(tempRootDir, ".openclaw");
  });

  afterEach(() => {
    if (tempRootDir) {
      fs.rmSync(tempRootDir, { recursive: true, force: true });
    }
  });

  it("writes topic agentId to openclaw group topic config", () => {
    writeOpenclawConfig({
      dir: openclawDir,
      config: {
        channels: {
          telegram: {
            groups: {
              "-1001234567890": {
                requireMention: true,
              },
            },
          },
        },
      },
    });

    const topicRegistry = {
      getGroup: () => ({
        topics: {
          "1": { name: "General", agentId: "main" },
          "3": {
            name: "Ops",
            agentId: "ops",
            systemInstructions: "Handle ops requests only.",
          },
          "5": { name: "No Overrides" },
        },
      }),
      getTotalTopicCount: () => 3,
    };

    syncConfigForTelegram({
      fs,
      openclawDir,
      topicRegistry,
      groupId: "-1001234567890",
      requireMention: true,
      resolvedUserId: "",
    });

    const nextConfig = readOpenclawConfig({ dir: openclawDir });
    expect(nextConfig.channels.telegram.groups["-1001234567890"].topics).toEqual({
      "1": { agentId: "main" },
      "3": { systemPrompt: "Handle ops requests only.", agentId: "ops" },
    });
  });

  it("omits empty agentId values when syncing topic metadata", () => {
    writeOpenclawConfig({
      dir: openclawDir,
      config: {
        channels: {
          telegram: {
            groups: {
              "-1001234567890": {},
            },
          },
        },
      },
    });

    const topicRegistry = {
      getGroup: () => ({
        topics: {
          "2": { name: "Prompt Only", systemInstructions: "Only prompt." },
          "4": { name: "Blank Agent", agentId: "   " },
        },
      }),
      getTotalTopicCount: () => 2,
    };

    syncConfigForTelegram({
      fs,
      openclawDir,
      topicRegistry,
      groupId: "-1001234567890",
      requireMention: false,
      resolvedUserId: "",
    });

    const nextConfig = readOpenclawConfig({ dir: openclawDir });
    expect(nextConfig.channels.telegram.groups["-1001234567890"].topics).toEqual({
      "2": { systemPrompt: "Only prompt." },
    });
  });

  it("bootstraps a missing config and records the allowed user", () => {
    fs.mkdirSync(openclawDir, { recursive: true });
    const topicRegistry = {
      getGroup: () => null,
      getTotalTopicCount: () => 0,
    };

    const result = syncConfigForTelegram({
      fs,
      openclawDir,
      topicRegistry,
      groupId: "-100999",
      requireMention: true,
      resolvedUserId: "42",
    });

    expect(result).toEqual({
      totalTopics: 0,
      maxConcurrent: 8,
      subagentMaxConcurrent: 6,
    });
    const nextConfig = readOpenclawConfig({ dir: openclawDir });
    const group = nextConfig.channels.telegram.groups["-100999"];
    expect(group.requireMention).toBe(true);
    expect(group.topics).toBeUndefined();
    expect(nextConfig.channels.telegram.groupPolicy).toBe("allowlist");
    expect(nextConfig.channels.telegram.groupAllowFrom).toEqual(["42"]);
    expect(nextConfig.session.resetByType.thread).toEqual({
      mode: "idle",
      idleMinutes: 525600,
    });

    // Re-running with the same user does not duplicate the allowlist entry.
    syncConfigForTelegram({
      fs,
      openclawDir,
      topicRegistry,
      groupId: "-100999",
      requireMention: true,
      resolvedUserId: "42",
    });
    expect(
      readOpenclawConfig({ dir: openclawDir }).channels.telegram.groupAllowFrom,
    ).toEqual(["42"]);
  });

  it("removes stale topics when the registry has no prompt overrides left", () => {
    writeOpenclawConfig({
      dir: openclawDir,
      config: {
        channels: {
          telegram: {
            groups: {
              "-100777": {
                requireMention: false,
                topics: { "9": { systemPrompt: "stale" } },
              },
            },
          },
        },
      },
    });
    const topicRegistry = {
      getGroup: () => ({ topics: { "9": { name: "No Overrides" } } }),
      getTotalTopicCount: () => 1,
    };

    syncConfigForTelegram({
      fs,
      openclawDir,
      topicRegistry,
      groupId: "-100777",
      requireMention: false,
      resolvedUserId: "",
    });

    const nextConfig = readOpenclawConfig({ dir: openclawDir });
    expect(nextConfig.channels.telegram.groups["-100777"].topics).toBeUndefined();
  });

  it("targets the matching account config when multi-account telegram is set up", () => {
    writeOpenclawConfig({
      dir: openclawDir,
      config: {
        channels: {
          telegram: {
            accounts: {
              work: {
                groups: { "-100555": { requireMention: false } },
              },
            },
          },
        },
      },
    });
    const topicRegistry = {
      getGroup: () => ({
        topics: { "3": { name: "Ops", agentId: "ops" } },
      }),
      getTotalTopicCount: () => 4,
    };

    const result = syncConfigForTelegram({
      fs,
      openclawDir,
      topicRegistry,
      groupId: "-100555",
      accountId: "work",
      requireMention: true,
      resolvedUserId: "77",
    });

    expect(result.totalTopics).toBe(4);
    expect(result.maxConcurrent).toBe(12);
    expect(result.subagentMaxConcurrent).toBe(10);
    const nextConfig = readOpenclawConfig({ dir: openclawDir });
    const account = nextConfig.channels.telegram.accounts.work;
    expect(account.groups["-100555"]).toEqual({
      requireMention: true,
      topics: { "3": { agentId: "ops" } },
    });
    expect(account.groupPolicy).toBe("allowlist");
    expect(account.groupAllowFrom).toEqual(["77"]);
    // Root telegram config is left untouched when accounts exist.
    expect(nextConfig.channels.telegram.groups).toBeUndefined();
  });

  it("creates a fresh account bucket for unknown or malformed account ids", () => {
    writeOpenclawConfig({
      dir: openclawDir,
      config: {
        channels: {
          telegram: {
            accounts: { work: "not-an-object" },
          },
        },
      },
    });
    const topicRegistry = {
      getGroup: () => null,
      getTotalTopicCount: () => 0,
    };

    syncConfigForTelegram({
      fs,
      openclawDir,
      topicRegistry,
      groupId: "-100333",
      accountId: "  personal  ",
      requireMention: false,
      resolvedUserId: "",
    });

    const nextConfig = readOpenclawConfig({ dir: openclawDir });
    const personal = nextConfig.channels.telegram.accounts.personal;
    expect(personal.groups["-100333"]).toEqual({ requireMention: false });
    expect(personal.groupPolicy).toBe("allowlist");
    // The malformed sibling account entry is preserved as-is.
    expect(nextConfig.channels.telegram.accounts.work).toBe("not-an-object");
  });
});
