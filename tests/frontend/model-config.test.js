const loadModelConfig = async () =>
  import("../../lib/public/js/lib/model-config.js");

describe("frontend/model-config", () => {
  it("maps openai-codex auth provider to openai", async () => {
    const modelConfig = await loadModelConfig();
    expect(modelConfig.getAuthProviderFromModelProvider("openai-codex")).toBe("openai");
    expect(modelConfig.getAuthProviderFromModelProvider("minimax-portal")).toBe(
      "minimax",
    );
    expect(modelConfig.getAuthProviderFromModelProvider("volcengine-plan")).toBe(
      "volcengine",
    );
    expect(modelConfig.getAuthProviderFromModelProvider("byteplus-plan")).toBe(
      "byteplus",
    );
    expect(modelConfig.getAuthProviderFromModelProvider("google")).toBe("google");
  });

  it("returns visible AI field keys for provider", async () => {
    const modelConfig = await loadModelConfig();
    const keys = modelConfig.getVisibleAiFieldKeys("openai-codex");
    expect(keys.has("OPENAI_API_KEY")).toBe(false);
    expect(keys.has("ANTHROPIC_API_KEY")).toBe(false);
    const zaiKeys = modelConfig.getVisibleAiFieldKeys("zai");
    expect(zaiKeys.has("ZAI_API_KEY")).toBe(true);
    const volcengineKeys = modelConfig.getVisibleAiFieldKeys("volcengine-plan");
    expect(volcengineKeys.has("VOLCANO_ENGINE_API_KEY")).toBe(true);
  });

  it("picks featured models in defined preference order", async () => {
    const modelConfig = await loadModelConfig();
    const featured = modelConfig.getFeaturedModels([
      { key: "google/gemini-3.1-pro-preview", label: "Gemini 3.1 Pro" },
      { key: "anthropic/claude-opus-4-6", label: "Opus 4.6" },
      { key: "openai-codex/gpt-5.3-codex", label: "Codex 5.3" },
      { key: "openai-codex/gpt-5.4", label: "GPT-5.4" },
    ]);

    expect(featured.map((entry) => entry.key)).toEqual([
      "anthropic/claude-opus-4-6",
      "openai-codex/gpt-5.3-codex",
      "openai-codex/gpt-5.4",
      "google/gemini-3.1-pro-preview",
    ]);
    expect(featured[2]?.featuredLabel).toBe("GPT-5.4");
    expect(featured[3]?.featuredLabel).toBe("Gemini 3.1 Pro");
  });
});
