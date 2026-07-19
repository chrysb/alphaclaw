import { describe, expect, it } from "vitest";
import {
  buildProviderHasAuth,
  buildSyntheticModelEntry,
  getModelCatalogProvider,
  getModelDisplayLabel,
  getModelsTabAuthProvider,
  getModelsTabRequiredAuthProviders,
  getProviderAuthDisplayOrder,
  getProviderSortIndex,
} from "../../lib/public/js/components/models-tab/model-picker.js";

describe("frontend/models-tab/model-picker helpers", () => {
  it("maps non-OpenAI model providers to their auth provider", () => {
    expect(getModelsTabAuthProvider("anthropic/claude-opus-4-6")).toBe(
      "anthropic",
    );
    expect(getModelsTabAuthProvider("google/gemini-3.1-pro-preview")).toBe(
      "google",
    );
  });

  it("returns the single auth provider for non-OpenAI models", () => {
    expect(
      getModelsTabRequiredAuthProviders("anthropic/claude-opus-4-6"),
    ).toEqual(["anthropic"]);
    expect(getModelsTabRequiredAuthProviders("")).toEqual([]);
  });

  it("appends unknown required providers after the known display order", () => {
    expect(
      getProviderAuthDisplayOrder(["anthropic", "custom-lab"]),
    ).toEqual(["anthropic", "openai-codex", "custom-lab"]);
  });

  it("resolves the catalog provider from explicit field or key", () => {
    expect(getModelCatalogProvider({ provider: " openai " })).toBe("openai");
    expect(getModelCatalogProvider({ key: "google/gemini-3.1-pro" })).toBe(
      "google",
    );
    expect(getModelCatalogProvider(null)).toBe("");
  });

  it("sorts providers by display order with unknowns last", () => {
    expect(getProviderSortIndex("anthropic")).toBe(0);
    expect(getProviderSortIndex("openai-codex")).toBe(2);
    expect(getProviderSortIndex("not-a-provider")).toBe(
      Number.MAX_SAFE_INTEGER,
    );
  });

  it("builds friendly Anthropic labels for synthetic entries", () => {
    expect(buildSyntheticModelEntry("anthropic/claude-opus-4-6")).toEqual({
      key: "anthropic/claude-opus-4-6",
      provider: "anthropic",
      label: "Claude Opus 4.6",
    });
    expect(buildSyntheticModelEntry("anthropic/claude-sonnet-4.6")).toEqual({
      key: "anthropic/claude-sonnet-4.6",
      provider: "anthropic",
      label: "Claude Sonnet 4.6",
    });
  });

  it("falls back to the raw key when no friendly label matches", () => {
    expect(buildSyntheticModelEntry("anthropic/claude-custom")).toEqual({
      key: "anthropic/claude-custom",
      provider: "anthropic",
      label: "anthropic/claude-custom",
    });
    expect(buildSyntheticModelEntry("plainmodel")).toEqual({
      key: "plainmodel",
      provider: "plainmodel",
      label: "plainmodel",
    });
    expect(buildSyntheticModelEntry("")).toEqual({
      key: "",
      provider: "",
      label: "",
    });
  });

  it("prefers featured labels for display", () => {
    expect(getModelDisplayLabel({ featuredLabel: "Featured" })).toBe(
      "Featured",
    );
    expect(getModelDisplayLabel({ key: "zai/glm-5" })).toBe("zai/glm-5");
    expect(getModelDisplayLabel(null)).toBe("");
  });

  it("marks providers authenticated for key, token, or access profiles", () => {
    expect(
      buildProviderHasAuth({
        authProfiles: [
          { provider: "anthropic", token: "tok" },
          { provider: "google", access: "acc" },
          { provider: "zai" },
        ],
      }),
    ).toEqual({ anthropic: true, google: true });
    expect(buildProviderHasAuth()).toEqual({});
    expect(buildProviderHasAuth({})).toEqual({});
  });
});
