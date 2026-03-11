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
});
