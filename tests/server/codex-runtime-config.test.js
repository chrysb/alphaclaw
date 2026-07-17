const {
  configUsesCodexRuntime,
  ensureCodexRuntimePlugin,
} = require("../../lib/server/codex-runtime-config");

describe("codex-runtime-config", () => {
  it("enables and allows Codex for canonical OpenAI GPT models", () => {
    const cfg = {
      agents: {
        defaults: {
          model: { primary: "openai/gpt-5.6-sol" },
          models: { "openai/gpt-5.6-sol": {} },
        },
      },
      plugins: {
        allow: ["telegram"],
        entries: { telegram: { enabled: true } },
      },
    };

    expect(ensureCodexRuntimePlugin(cfg)).toBe(true);
    expect(cfg.plugins.allow).toEqual(["telegram", "codex"]);
    expect(cfg.plugins.entries.codex).toEqual({ enabled: true });
    expect(ensureCodexRuntimePlugin(cfg)).toBe(false);
  });

  it("respects an explicit OpenClaw runtime opt-in", () => {
    const cfg = {
      agents: {
        defaults: {
          model: { primary: "openai/gpt-5.6" },
          models: {
            "openai/gpt-5.6": { agentRuntime: { id: "openclaw" } },
          },
        },
      },
    };

    expect(configUsesCodexRuntime(cfg)).toBe(false);
    expect(ensureCodexRuntimePlugin(cfg)).toBe(false);
    expect(cfg.plugins).toBeUndefined();
  });

  it("detects per-agent Codex model overrides", () => {
    const cfg = {
      agents: {
        defaults: { model: { primary: "anthropic/claude-opus-4-6" } },
        list: [
          {
            id: "main",
            model: { primary: "openai/gpt-5.6-sol" },
          },
        ],
      },
    };

    expect(configUsesCodexRuntime(cfg)).toBe(true);
    expect(ensureCodexRuntimePlugin(cfg)).toBe(true);
    expect(cfg.plugins.allow).toContain("codex");
  });
});
