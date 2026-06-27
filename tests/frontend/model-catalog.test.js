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

  it("defaults to Claude Opus 4.8 when it is in the catalog", async () => {
    const { getInitialOnboardingModelKey } = await import(
      "../../lib/public/js/lib/model-catalog.js"
    );

    expect(
      getInitialOnboardingModelKey({
        catalog: [
          { key: "openai-codex/gpt-5.4", label: "GPT-5.4" },
          { key: "anthropic/claude-opus-4-7", label: "Opus 4.7" },
          { key: "anthropic/claude-opus-4-8", label: "Opus 4.8" },
        ],
      }),
    ).toBe("anthropic/claude-opus-4-8");
  });

  it("falls back to the first featured model when Opus 4.8 is unavailable", async () => {
    const { getInitialOnboardingModelKey } = await import(
      "../../lib/public/js/lib/model-catalog.js"
    );

    expect(
      getInitialOnboardingModelKey({
        catalog: [
          { key: "openai-codex/gpt-5.4", label: "GPT-5.4" },
          { key: "anthropic/claude-opus-4-7", label: "Opus 4.7" },
          { key: "anthropic/claude-opus-4-6", label: "Opus 4.6" },
        ],
      }),
    ).toBe("anthropic/claude-opus-4-7");
  });

  it("reports whether the catalog is still refreshing", async () => {
    const { isModelCatalogRefreshing } = await import(
      "../../lib/public/js/lib/model-catalog.js"
    );

    expect(isModelCatalogRefreshing({ refreshing: true })).toBe(true);
    expect(isModelCatalogRefreshing({ refreshing: false })).toBe(false);
  });

  it("forces a real fetch when preloading the onboarding model catalog", async () => {
    vi.resetModules();
    global.fetch = vi.fn().mockResolvedValue({
      status: 200,
      ok: true,
      json: async () => ({
        models: [{ key: "openai/gpt-5.4", label: "GPT-5.4" }],
      }),
    });

    const {
      getCached,
      invalidateCache,
      setCached,
    } = await import("../../lib/public/js/lib/api-cache.js");
    const {
      kModelCatalogCacheKey,
      preloadModelCatalog,
    } = await import("../../lib/public/js/lib/model-catalog.js");

    invalidateCache(kModelCatalogCacheKey);
    setCached(kModelCatalogCacheKey, {
      models: [{ key: "fallback/model", label: "Fallback" }],
    });

    const result = await preloadModelCatalog();

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/models",
      expect.objectContaining({ headers: expect.any(Headers) }),
    );
    expect(result).toEqual({
      models: [{ key: "openai/gpt-5.4", label: "GPT-5.4" }],
    });
    expect(getCached(kModelCatalogCacheKey)).toEqual(result);
  });
});
