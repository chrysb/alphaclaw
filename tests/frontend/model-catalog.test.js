describe("frontend/model-catalog", () => {
  it("returns catalog models when the payload is valid", async () => {
    const { getModelCatalogModels } = await import(
      "../../lib/public/js/lib/model-catalog.js"
    );

    expect(
      getModelCatalogModels({
        models: [{ key: "openai/gpt-5.4", label: "GPT-5.4" }],
      }),
    ).toEqual([{ key: "openai/gpt-5.4", label: "GPT-5.4" }]);
    expect(getModelCatalogModels(null)).toEqual([]);
  });

  it("preserves an existing onboarding selection", async () => {
    const { getInitialOnboardingModelKey } = await import(
      "../../lib/public/js/lib/model-catalog.js"
    );

    expect(
      getInitialOnboardingModelKey({
        catalog: [{ key: "openai-codex/gpt-5.4", label: "GPT-5.4" }],
        currentModelKey: "anthropic/claude-opus-4-6",
      }),
    ).toBe("anthropic/claude-opus-4-6");
  });

  it("picks the first featured onboarding model when nothing is selected", async () => {
    const { getInitialOnboardingModelKey } = await import(
      "../../lib/public/js/lib/model-catalog.js"
    );

    expect(
      getInitialOnboardingModelKey({
        catalog: [
          { key: "openai-codex/gpt-5.4", label: "GPT-5.4" },
          { key: "anthropic/claude-opus-4-6", label: "Opus 4.6" },
        ],
      }),
    ).toBe("anthropic/claude-opus-4-6");
  });

  it("reports whether the catalog is still refreshing", async () => {
    const { isModelCatalogRefreshing } = await import(
      "../../lib/public/js/lib/model-catalog.js"
    );

    expect(isModelCatalogRefreshing({ refreshing: true })).toBe(true);
    expect(isModelCatalogRefreshing({ refreshing: false })).toBe(false);
  });
});
