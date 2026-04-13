const { sanitizeOpenclawConfig } = require("../../lib/server/openclaw-config");

describe("sanitizeOpenclawConfig", () => {
  it("adds models array to provider missing it", () => {
    const cfg = {
      models: {
        providers: {
          "ollama-mac": { type: "ollama", baseUrl: "http://127.0.0.1:11434" },
        },
      },
    };
    const result = sanitizeOpenclawConfig(cfg);
    expect(result.models.providers["ollama-mac"].models).toEqual([]);
  });

  it("preserves existing models array", () => {
    const cfg = {
      models: {
        providers: {
          "ollama-mac": {
            type: "ollama",
            baseUrl: "http://127.0.0.1:11434",
            models: [{ id: "qwen2.5:7b" }],
          },
        },
      },
    };
    const result = sanitizeOpenclawConfig(cfg);
    expect(result.models.providers["ollama-mac"].models).toEqual([
      { id: "qwen2.5:7b" },
    ]);
  });

  it("handles multiple providers, some with models and some without", () => {
    const cfg = {
      models: {
        providers: {
          "ollama-mac": { type: "ollama" },
          "lmstudio-win": { type: "lmstudio", models: [{ id: "phi-4" }] },
          "ollama-win": { type: "ollama" },
        },
      },
    };
    const result = sanitizeOpenclawConfig(cfg);
    expect(result.models.providers["ollama-mac"].models).toEqual([]);
    expect(result.models.providers["lmstudio-win"].models).toEqual([
      { id: "phi-4" },
    ]);
    expect(result.models.providers["ollama-win"].models).toEqual([]);
  });

  it("is a no-op when models.providers is absent", () => {
    const cfg = { channels: { telegram: { enabled: false } } };
    const result = sanitizeOpenclawConfig(cfg);
    expect(result).toEqual({ channels: { telegram: { enabled: false } } });
  });

  it("does not mutate the original config object", () => {
    const cfg = {
      models: { providers: { "ollama-mac": { type: "ollama" } } },
    };
    sanitizeOpenclawConfig(cfg);
    expect(cfg.models.providers["ollama-mac"].models).toBeUndefined();
  });
});
