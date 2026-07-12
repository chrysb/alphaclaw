const fs = require("fs");
const os = require("os");
const path = require("path");

const {
  migrateLegacyCodexState,
} = require("../../lib/server/openclaw-codex-migration");

describe("server/openclaw-codex-migration", () => {
  it("migrates legacy Codex routes and OAuth credentials into canonical SQLite state", async () => {
    const stateDir = fs.mkdtempSync(path.join(os.tmpdir(), "alphaclaw-codex-migration-"));
    const configPath = path.join(stateDir, "openclaw.json");
    const agentDir = path.join(stateDir, "agents", "main", "agent");
    fs.mkdirSync(agentDir, { recursive: true });
    fs.writeFileSync(
      configPath,
      JSON.stringify({
        agents: {
          defaults: {
            model: { primary: "openai-codex/gpt-5.5" },
            models: { "openai-codex/gpt-5.5": {} },
          },
        },
        auth: {
          profiles: {
            "openai-codex:codex-cli": {
              provider: "openai-codex",
              mode: "oauth",
            },
          },
        },
      }),
      "utf8",
    );
    fs.writeFileSync(
      path.join(agentDir, "auth-profiles.json"),
      JSON.stringify({
        version: 1,
        profiles: {
          "openai-codex:codex-cli": {
            type: "oauth",
            provider: "openai-codex",
            access: "test-access",
            refresh: "test-refresh",
            expires: Date.now() + 3_600_000,
          },
        },
      }),
      "utf8",
    );

    const env = {
      ...process.env,
      OPENCLAW_STATE_DIR: stateDir,
      OPENCLAW_CONFIG_PATH: configPath,
    };
    const result = await migrateLegacyCodexState({ configPath, env });

    expect(result.changed).toBe(true);
    expect(result.warnings).toEqual([]);
    const cfg = JSON.parse(fs.readFileSync(configPath, "utf8"));
    expect(cfg.agents.defaults.model.primary).toBe("openai/gpt-5.5");
    expect(cfg.agents.defaults.models).toEqual({
      "openai/gpt-5.5": { agentRuntime: { id: "codex" } },
    });
    expect(cfg.auth.profiles["openai:codex-cli"]).toEqual({
      provider: "openai",
      mode: "oauth",
    });
    expect(cfg.auth.profiles["openai-codex:codex-cli"]).toBeUndefined();
    expect(fs.existsSync(path.join(agentDir, "openclaw-agent.sqlite"))).toBe(true);
    expect(fs.existsSync(path.join(agentDir, "auth-profiles.json"))).toBe(false);

    cfg.agents.defaults.models["openai/gpt-5.5"] = {};
    fs.writeFileSync(configPath, JSON.stringify(cfg), "utf8");

    const restored = await migrateLegacyCodexState({ configPath, env });
    expect(restored.changed).toBe(true);
    const restoredCfg = JSON.parse(fs.readFileSync(configPath, "utf8"));
    expect(restoredCfg.agents.defaults.models["openai/gpt-5.5"]).toEqual({
      agentRuntime: { id: "codex" },
    });

    const second = await migrateLegacyCodexState({ configPath, env });
    expect(second.changed).toBe(false);
  });
});
