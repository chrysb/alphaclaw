import {
  getOnboardingModels,
  getOrdinaryModelOptions,
  withAlwaysAvailableModels,
} from "../../lib/public/js/lib/model-config.js";
import { getInitialOnboardingModelKey } from "../../lib/public/js/lib/model-catalog.js";
import { runOnboard, saveModelsConfig } from "../../lib/public/js/lib/api.js";

const entry = (key) => ({ key, provider: key.split("/")[0], label: key });
const routes = [
  ["minimax/MiniMax-M3.1-Flash", "minimax/MiniMax-M3", "minimax/MiniMax-M2.7"],
  ["minimax-cn/MiniMax-M3.1-Flash", "minimax-cn/MiniMax-M3", "minimax-cn/MiniMax-M2.7"],
  ["openrouter/minimax/minimax-m3.1-flash:free", "openrouter/minimax/minimax-m3", "openrouter/minimax/minimax-m2.7"],
  ["opencode/minimax-m3.1-flash-free", "opencode/minimax-m3", "opencode/minimax-m2.7"],
];

describe("MiniMax model selection", () => {
  afterEach(() => vi.unstubAllGlobals());

  it.each(routes)("prefers discovered %s without synthesizing a route", (flash, m3, legacy) => {
    const catalog = [legacy, m3, flash].map(entry);
    const options = getOnboardingModels(catalog);
    expect(options.map((model) => model.key)).toEqual([flash, m3, legacy]);
    expect(getInitialOnboardingModelKey({ catalog: options })).toBe(flash);
    expect(getOnboardingModels([entry(m3)]).map((model) => model.key)).toEqual([m3]);
    expect(withAlwaysAvailableModels([entry(m3)]).some((model) => model.key === flash)).toBe(false);
    expect(getInitialOnboardingModelKey({ catalog: options, currentModelKey: legacy })).toBe(legacy);
  });

  it("retains other providers, media, and unknown custom entries in their slots", () => {
    const catalog = [
      entry("minimax/MiniMax-M3"),
      entry("anthropic/claude-opus-4-8"),
      entry("minimax/MiniMax-Image-01"),
      entry("minimax/MiniMax-M3.1-Flash"),
      entry("minimax/custom-model"),
      entry("private/minimax-m2.7"),
    ];
    const snapshot = structuredClone(catalog);
    const options = getOrdinaryModelOptions(catalog);
    expect(options).toEqual([catalog[3], catalog[1], catalog[2], catalog[0], catalog[4], catalog[5]]);
    expect(catalog).toEqual(snapshot);
    expect(getInitialOnboardingModelKey({ catalog: options })).toBe("anthropic/claude-opus-4-8");
  });

  it("preserves exact saved legacy and custom entries, including metadata", () => {
    for (const key of ["minimax/MiniMax-M2.7", "minimax/MiniMax-M3-custom"]) {
      const saved = { ...entry(key), label: "Saved model", contextWindow: 12345 };
      const options = getOnboardingModels([saved, entry(routes[0][0])], { currentModelKey: key });
      expect(options.at(-1)).toBe(saved);
      expect(getInitialOnboardingModelKey({ catalog: options, currentModelKey: key })).toBe(key);
    }
  });

  it.each(routes)("keeps a discovered legacy-only %s catalog selectable", (_flash, _m3, legacy) => {
    expect(getOrdinaryModelOptions([entry(legacy)])).toEqual([entry(legacy)]);
    expect(getOnboardingModels([entry(legacy)])).toEqual([entry(legacy)]);
  });

  it("keeps discovered custom and future model IDs without treating them as aliases", () => {
    const discovered = [
      "minimax/MiniMax-M4",
      "minimax-cn/MiniMax-M4",
      "openrouter/minimax/minimax-m4",
      "opencode/minimax-m4",
      "minimax/custom-model",
      "minimax/MiniMax-M3.1-Flash-Preview",
      "openrouter/minimax/minimax-m3.1-flash",
      "opencode/minimax-m3.1-flash",
    ].map(entry);
    expect(getOrdinaryModelOptions(discovered)).toEqual(discovered);
  });

  it("serializes default, saved and custom selections unchanged at the setup HTTP boundary", async () => {
    const requests = [];
    vi.stubGlobal("fetch", vi.fn(async (url, options) => {
      requests.push({ url, method: options.method, body: JSON.parse(options.body) });
      return { status: 200, json: async () => ({ ok: true }) };
    }));
    for (const [flash, m3, legacy] of routes) {
      const catalog = getOnboardingModels([entry(m3), entry(flash)]);
      const initial = getInitialOnboardingModelKey({ catalog });
      for (const key of [initial, m3, legacy, "minimax/custom-model"]) {
        await runOnboard([], key);
        expect(requests.at(-1)).toEqual({
          url: "/api/onboard", method: "POST", body: { vars: [], modelKey: key, importMode: false },
        });
        const configuredModels = { [key]: { alias: "Saved alias" } };
        await saveModelsConfig({ primary: key, configuredModels, profiles: [], authOrder: {}, agentId: "test-agent" });
        expect(requests.at(-1)).toEqual({
          url: "/api/models/config?agentId=test-agent", method: "PUT",
          body: { primary: key, configuredModels, profiles: [], authOrder: {} },
        });
      }
    }
  });
});
