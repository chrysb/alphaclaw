const loadModelConfig = async () =>
  import("../../lib/public/js/lib/model-config.js");

describe("frontend/model-config", () => {
  it("maps openai-codex auth provider to openai", async () => {
    const modelConfig = await loadModelConfig();
    expect(modelConfig.getAuthProviderFromModelProvider("openai-codex")).toBe("openai");
    expect(modelConfig.getAuthProviderFromModelProvider("google")).toBe("google");
  });

  it("returns visible AI field keys for provider", async () => {
    const modelConfig = await loadModelConfig();
    const keys = modelConfig.getVisibleAiFieldKeys("openai-codex");
    expect(keys.has("OPENAI_API_KEY")).toBe(false);
    expect(keys.has("ANTHROPIC_API_KEY")).toBe(false);
  });

  it("picks featured models in defined preference order", async () => {
    const modelConfig = await loadModelConfig();
    const featured = modelConfig.getFeaturedModels([
      { key: "google/gemini-3-pro-preview", label: "Gemini 3 Pro Preview" },
      { key: "anthropic/claude-opus-4-6", label: "Opus 4.6" },
      { key: "openai-codex/gpt-5.3-codex", label: "Codex 5.3" },
    ]);

    expect(featured.map((entry) => entry.key)).toEqual([
      "anthropic/claude-opus-4-6",
      "openai-codex/gpt-5.3-codex",
      "google/gemini-3-pro-preview",
    ]);
  });
});
