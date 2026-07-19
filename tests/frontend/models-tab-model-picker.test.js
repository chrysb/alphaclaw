const loadModelPicker = async () =>
  import("../../lib/public/js/components/models-tab/model-picker.js");

describe("frontend/models-tab/model-picker", () => {
  it("uses Codex auth for canonical and legacy OpenAI agent models", async () => {
    const modelPicker = await loadModelPicker();

    expect(modelPicker.getModelsTabAuthProvider("openai/gpt-5.5")).toBe(
      "openai-codex",
    );
    expect(
      modelPicker.getModelsTabAuthProvider("openai-codex/gpt-5.5"),
    ).toBe("openai-codex");
    expect(
      modelPicker.getModelsTabRequiredAuthProviders("openai/gpt-5.5"),
    ).toEqual(["openai", "openai-codex"]);
  });

  it("always includes Codex OAuth in provider authentication", async () => {
    const modelPicker = await loadModelPicker();

    expect(modelPicker.getProviderAuthDisplayOrder([])).toEqual([
      "openai-codex",
    ]);
    expect(modelPicker.getProviderAuthDisplayOrder(["anthropic"])).toEqual([
      "anthropic",
      "openai-codex",
    ]);
  });

  it("accepts Codex OAuth or an OpenAI API key for canonical models", async () => {
    const modelPicker = await loadModelPicker();

    expect(
      modelPicker.buildProviderHasAuth({ codexStatus: { connected: true } }),
    ).toMatchObject({ "openai-codex": true });
    expect(
      modelPicker.buildProviderHasAuth({
        authProfiles: [{ provider: "openai", key: "configured" }],
      }),
    ).toMatchObject({ openai: true, "openai-codex": true });
  });

  it("uses friendly OpenAI labels for catalog and synthetic agent entries", async () => {
    const modelPicker = await loadModelPicker();

    expect(
      modelPicker.getModelDisplayLabel({
        key: "openai/gpt-5.5",
        label: "gpt-5.5",
      }),
    ).toBe("GPT-5.5");
    expect(modelPicker.buildSyntheticModelEntry("openai/gpt-5.6-sol")).toEqual({
      key: "openai/gpt-5.6-sol",
      provider: "openai",
      label: "GPT-5.6 Sol",
    });
  });
});
