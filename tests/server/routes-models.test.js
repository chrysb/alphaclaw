const express = require("express");
const request = require("supertest");

const { registerModelRoutes } = require("../../lib/server/routes/models");
const { kFallbackOnboardingModels } = require("../../lib/server/constants");

const createModelDeps = () => {
  const deps = {
    shellCmd: vi.fn(),
    gatewayEnv: vi.fn(() => ({ OPENCLAW_GATEWAY_TOKEN: "token" })),
    parseJsonFromNoisyOutput: vi.fn(() => ({})),
    normalizeOnboardingModels: vi.fn(() => []),
    readEnvFile: vi.fn(() => []),
    writeEnvFile: vi.fn(),
    reloadEnv: vi.fn(() => true),
    authProfiles: {
      getModelConfig: vi.fn(() => ({ primary: null, configuredModels: {} })),
      listProfiles: vi.fn(() => []),
      loadAuthStore: vi.fn(() => ({ profiles: {}, order: {} })),
      setModelConfig: vi.fn(),
      upsertProfile: vi.fn(),
      getEnvVarForApiKeyProvider: vi.fn((provider) =>
        provider === "openai" ? "OPENAI_API_KEY" : "",
      ),
      listApiKeyProviders: vi.fn(() => ["openai"]),
      getDefaultProfileIdForApiKeyProvider: vi.fn((provider) =>
        provider ? `${provider}:default` : "",
      ),
      upsertApiKeyProfileForEnvVar: vi.fn(),
      removeApiKeyProfileForEnvVar: vi.fn(),
      setAuthOrder: vi.fn(),
      syncConfigAuthReferencesForAgent: vi.fn(),
      removeProfile: vi.fn(),
    },
  };
  return deps;
};

const createApp = (deps) => {
  const app = express();
  app.use(express.json());
  registerModelRoutes({
    app,
    ...deps,
  });
  return app;
};

describe("server/routes/models", () => {
  it("returns normalized models from openclaw output", async () => {
    const deps = createModelDeps();
    deps.shellCmd.mockResolvedValue("noise");
    deps.parseJsonFromNoisyOutput.mockReturnValue({
      models: [{ key: "openai/gpt-5.1-codex", name: "GPT" }],
    });
    deps.normalizeOnboardingModels.mockReturnValue([
      { key: "openai/gpt-5.1-codex", provider: "openai", label: "GPT" },
    ]);
    const app = createApp(deps);

    const res = await request(app).get("/api/models");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      ok: true,
      source: "openclaw",
      models: [{ key: "openai/gpt-5.1-codex", provider: "openai", label: "GPT" }],
    });
    expect(deps.shellCmd).toHaveBeenCalledWith("openclaw models list --all --json", {
      env: { OPENCLAW_GATEWAY_TOKEN: "token" },
      timeout: 20000,
    });
  });

  it("falls back to static models when normalized list is empty", async () => {
    const deps = createModelDeps();
    deps.shellCmd.mockResolvedValue("{}");
    deps.parseJsonFromNoisyOutput.mockReturnValue({ models: [] });
    deps.normalizeOnboardingModels.mockReturnValue([]);
    const app = createApp(deps);

    const res = await request(app).get("/api/models");

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.source).toBe("fallback");
    expect(res.body.models).toEqual(kFallbackOnboardingModels);
  });

  it("returns fallback models when command throws", async () => {
    const deps = createModelDeps();
    deps.shellCmd.mockRejectedValue(new Error("boom"));
    const app = createApp(deps);

    const res = await request(app).get("/api/models");

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.source).toBe("fallback");
  });

  it("returns model status payload on GET /api/models/status", async () => {
    const deps = createModelDeps();
    deps.shellCmd.mockResolvedValue("{}");
    deps.parseJsonFromNoisyOutput.mockReturnValue({
      resolvedDefault: "openai/gpt-5.1-codex",
      fallbacks: ["anthropic/claude-opus-4-6"],
      imageModel: "google/gemini-3.1-pro-preview",
    });
    const app = createApp(deps);

    const res = await request(app).get("/api/models/status");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      ok: true,
      modelKey: "openai/gpt-5.1-codex",
      fallbacks: ["anthropic/claude-opus-4-6"],
      imageModel: "google/gemini-3.1-pro-preview",
    });
  });

  it("validates modelKey on POST /api/models/set", async () => {
    const deps = createModelDeps();
    const app = createApp(deps);

    const res = await request(app).post("/api/models/set").send({ modelKey: "invalid" });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ ok: false, error: "Missing modelKey" });
    expect(deps.shellCmd).not.toHaveBeenCalled();
  });

  it("sets model when modelKey is valid", async () => {
    const deps = createModelDeps();
    deps.shellCmd.mockResolvedValue("");
    const app = createApp(deps);

    const res = await request(app)
      .post("/api/models/set")
      .send({ modelKey: "openai/gpt-5.1-codex" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
    expect(deps.shellCmd).toHaveBeenCalledWith(
      'openclaw models set "openai/gpt-5.1-codex"',
      {
        env: { OPENCLAW_GATEWAY_TOKEN: "token" },
        timeout: 30000,
      },
    );
  });

  it("re-syncs auth references on PUT /api/models/config", async () => {
    const deps = createModelDeps();
    deps.shellCmd.mockResolvedValue("");
    const app = createApp(deps);

    const res = await request(app).put("/api/models/config").send({
      primary: "openai-codex/gpt-5.3-codex",
      configuredModels: {
        "openai-codex/gpt-5.3-codex": {},
      },
    });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
    expect(deps.authProfiles.setModelConfig).toHaveBeenCalledWith({
      primary: "openai-codex/gpt-5.3-codex",
      configuredModels: {
        "openai-codex/gpt-5.3-codex": {},
      },
    });
    expect(deps.authProfiles.syncConfigAuthReferencesForAgent).toHaveBeenCalledWith(
      undefined,
    );
    expect(deps.shellCmd).toHaveBeenCalledWith(
      'alphaclaw git-sync -m "models: update config" -f "openclaw.json"',
      { timeout: 30000 },
    );
  });

  it("prefills default api-key auth profiles from env vars on GET /api/models/config", async () => {
    const deps = createModelDeps();
    deps.readEnvFile.mockReturnValue([{ key: "GEMINI_API_KEY", value: "AI-live-123" }]);
    deps.authProfiles.listApiKeyProviders.mockReturnValue(["google"]);
    deps.authProfiles.getEnvVarForApiKeyProvider.mockImplementation((provider) =>
      provider === "google" ? "GEMINI_API_KEY" : "",
    );
    const app = createApp(deps);

    const res = await request(app).get("/api/models/config");

    expect(res.status).toBe(200);
    expect(res.body.authProfiles).toEqual([
      {
        id: "google:default",
        type: "api_key",
        provider: "google",
        key: "AI-live-123",
      },
    ]);
  });

  it("writes API-key model auth changes back to env vars", async () => {
    const deps = createModelDeps();
    deps.shellCmd.mockResolvedValue("");
    deps.readEnvFile.mockReturnValue([{ key: "OPENAI_API_KEY", value: "" }]);
    const app = createApp(deps);

    const res = await request(app).put("/api/models/config").send({
      profiles: [
        {
          id: "openai:default",
          type: "api_key",
          provider: "openai",
          key: "sk-live-123",
        },
      ],
    });

    expect(res.status).toBe(200);
    expect(deps.writeEnvFile).toHaveBeenCalledWith([
      { key: "OPENAI_API_KEY", value: "sk-live-123" },
    ]);
    expect(deps.reloadEnv).toHaveBeenCalledTimes(1);
  });

  it("removes API-key env vars when profile key is cleared", async () => {
    const deps = createModelDeps();
    deps.shellCmd.mockResolvedValue("");
    deps.readEnvFile.mockReturnValue([{ key: "OPENAI_API_KEY", value: "sk-live-123" }]);
    const app = createApp(deps);

    const res = await request(app).put("/api/models/config").send({
      profiles: [
        {
          id: "openai:default",
          type: "api_key",
          provider: "openai",
          key: "",
        },
      ],
    });

    expect(res.status).toBe(200);
    expect(deps.writeEnvFile).toHaveBeenCalledWith([]);
    expect(deps.reloadEnv).toHaveBeenCalledTimes(1);
  });

  it("writes newly supported provider API keys back to env vars", async () => {
    const deps = createModelDeps();
    deps.shellCmd.mockResolvedValue("");
    deps.authProfiles.getEnvVarForApiKeyProvider.mockImplementation((provider) =>
      provider === "zai" ? "ZAI_API_KEY" : "",
    );
    deps.readEnvFile.mockReturnValue([{ key: "ZAI_API_KEY", value: "" }]);
    const app = createApp(deps);

    const res = await request(app).put("/api/models/config").send({
      profiles: [
        {
          id: "zai:default",
          type: "api_key",
          provider: "zai",
          key: "zai-live-123",
        },
      ],
    });

    expect(res.status).toBe(200);
    expect(deps.writeEnvFile).toHaveBeenCalledWith([
      { key: "ZAI_API_KEY", value: "zai-live-123" },
    ]);
    expect(deps.reloadEnv).toHaveBeenCalledTimes(1);
  });

  it("syncs env-backed api-key profiles into auth storage on PUT /api/models/config", async () => {
    const deps = createModelDeps();
    deps.shellCmd.mockResolvedValue("");
    deps.readEnvFile.mockReturnValue([{ key: "GEMINI_API_KEY", value: "AI-live-123" }]);
    deps.authProfiles.listApiKeyProviders.mockReturnValue(["google"]);
    deps.authProfiles.getEnvVarForApiKeyProvider.mockImplementation((provider) =>
      provider === "google" ? "GEMINI_API_KEY" : "",
    );
    const app = createApp(deps);

    const res = await request(app).put("/api/models/config").send({
      primary: "google/gemini-3.1-pro-preview",
      configuredModels: {
        "google/gemini-3.1-pro-preview": {},
      },
    });

    expect(res.status).toBe(200);
    expect(deps.authProfiles.upsertApiKeyProfileForEnvVar).toHaveBeenCalledWith(
      "google",
      "AI-live-123",
      undefined,
    );
  });
});
