const express = require("express");
const request = require("supertest");

// Patch the shared openclaw-config module before routes/models destructures
// it so the thinking-options error branch can be exercised.
const openclawConfig = require("../../lib/server/openclaw-config");
const realReadOpenclawConfig = openclawConfig.readOpenclawConfig;
let readOpenclawConfigImpl = realReadOpenclawConfig;
openclawConfig.readOpenclawConfig = (...args) => readOpenclawConfigImpl(...args);

const { registerModelRoutes } = require("../../lib/server/routes/models");

const createCacheStub = () => ({
  getCatalogResponse: vi.fn(async () => ({ ok: true, models: [] })),
  markStale: vi.fn(),
});

const createModelDeps = () => ({
  shellCmd: vi.fn(async () => ""),
  gatewayEnv: vi.fn(() => ({ OPENCLAW_GATEWAY_TOKEN: "token" })),
  parseJsonFromNoisyOutput: vi.fn(() => ({})),
  normalizeOnboardingModels: vi.fn(() => []),
  readOpenclawVersion: vi.fn(() => "2026.6.11"),
  isOnboarded: vi.fn(() => true),
  readEnvFile: vi.fn(() => []),
  writeEnvFile: vi.fn(),
  reloadEnv: vi.fn(() => true),
  authProfiles: {
    getModelConfig: vi.fn(() => ({ primary: null, configuredModels: {} })),
    listProfiles: vi.fn(() => []),
    loadAuthStore: vi.fn(() => ({ profiles: {}, order: {} })),
    setModelConfig: vi.fn(),
    upsertProfile: vi.fn(),
    removeProfile: vi.fn(() => true),
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
  },
});

const createApp = (deps, cacheStub = createCacheStub()) => {
  const app = express();
  app.use(express.json());
  registerModelRoutes({ app, ...deps, modelCatalogCache: cacheStub });
  return app;
};

const createHandlerRegistry = () => {
  const routes = new Map();
  const record = (method) => (routePath, handler) =>
    routes.set(`${method} ${routePath}`, handler);
  return {
    app: {
      get: record("GET"),
      post: record("POST"),
      put: record("PUT"),
      delete: record("DELETE"),
    },
    routes,
  };
};

const createMockRes = () => {
  const res = { statusCode: 200, body: undefined };
  res.status = vi.fn((code) => {
    res.statusCode = code;
    return res;
  });
  res.json = vi.fn((payload) => {
    res.body = payload;
    return res;
  });
  return res;
};

describe("server/routes/models coverage", () => {
  afterEach(() => {
    readOpenclawConfigImpl = realReadOpenclawConfig;
  });

  afterAll(() => {
    openclawConfig.readOpenclawConfig = realReadOpenclawConfig;
  });

  it("rejects thinking-options requests without a provider-scoped model key", async () => {
    const app = createApp(createModelDeps());

    const res = await request(app).get(
      "/api/models/thinking-options?modelKey=nope",
    );

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      ok: false,
      error: "modelKey is required (provider/model)",
    });
  });

  it("resolves thinking options with config-provided defaults and runtime", async () => {
    readOpenclawConfigImpl = () => ({
      agents: {
        defaults: {
          thinkingDefault: "low",
          models: {
            "openai/gpt-5.6-sol": { agentRuntime: { id: "codex" } },
          },
        },
      },
    });
    const app = createApp(createModelDeps());

    const res = await request(app).get(
      "/api/models/thinking-options?modelKey=openai/gpt-5.6-sol",
    );

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.inheritedDefault).toBe("low");
  });

  it("returns 500 when thinking-options config read fails", async () => {
    readOpenclawConfigImpl = () => {
      throw new Error("config exploded");
    };
    const app = createApp(createModelDeps());

    const res = await request(app).get(
      "/api/models/thinking-options?modelKey=openai/gpt-5.6-sol",
    );

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ ok: false, error: "config exploded" });
  });

  it("reports model status failure when error output is not parseable JSON", async () => {
    const deps = createModelDeps();
    const err = new Error("models status failed");
    err.stdout = "not json";
    deps.shellCmd.mockRejectedValue(err);
    deps.parseJsonFromNoisyOutput.mockReturnValue(null);
    const app = createApp(deps);

    const res = await request(app).get("/api/models/status");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: false, error: "models status failed" });
  });

  it("falls back to a null parser when parseJsonFromNoisyOutput is not provided", async () => {
    const deps = createModelDeps();
    const err = new Error("models status failed");
    err.stdout = "not json";
    err.stderr = "still not json";
    const shellCmd = vi.fn(async () => {
      throw err;
    });
    const app = express();
    app.use(express.json());
    registerModelRoutes({
      app,
      shellCmd,
      gatewayEnv: deps.gatewayEnv,
      authProfiles: deps.authProfiles,
      modelCatalogCache: createCacheStub(),
    });

    const res = await request(app).get("/api/models/status");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: false, error: "models status failed" });
  });

  it("returns 400 when openclaw models set fails", async () => {
    const deps = createModelDeps();
    deps.shellCmd.mockRejectedValue(new Error("set failed"));
    const app = createApp(deps);

    const res = await request(app)
      .post("/api/models/set")
      .send({ modelKey: "openai/gpt-5.6-sol" });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ ok: false, error: "set failed" });
  });

  it("merges env-backed profiles with existing stored profiles on GET /api/models/config", async () => {
    const deps = createModelDeps();
    deps.readEnvFile.mockReturnValue([
      { key: "GEMINI_API_KEY", value: "AI-live-1" },
      { key: "OPENAI_API_KEY", value: "sk-env-1" },
    ]);
    deps.authProfiles.listApiKeyProviders.mockReturnValue(["google", "openai"]);
    deps.authProfiles.getEnvVarForApiKeyProvider.mockImplementation((provider) =>
      provider === "google"
        ? "GEMINI_API_KEY"
        : provider === "openai"
          ? "OPENAI_API_KEY"
          : "",
    );
    deps.authProfiles.listProfiles.mockReturnValue([
      { id: "google:default", type: "api_key", provider: "google", key: "" },
      { id: "openai:default", type: "api_key", provider: "openai", key: "sk-keep" },
    ]);
    const app = createApp(deps);

    const res = await request(app).get("/api/models/config");

    expect(res.status).toBe(200);
    expect(res.body.authProfiles).toEqual([
      { id: "google:default", type: "api_key", provider: "google", key: "AI-live-1" },
      { id: "openai:default", type: "api_key", provider: "openai", key: "sk-keep" },
    ]);
  });

  it("returns 500 when reading model config fails", async () => {
    const deps = createModelDeps();
    deps.authProfiles.getModelConfig.mockImplementation(() => {
      throw new Error("read failed");
    });
    const app = createApp(deps);

    const res = await request(app).get("/api/models/config");

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ ok: false, error: "read failed" });
  });

  it("rejects invalid primary model keys on PUT /api/models/config", async () => {
    const app = createApp(createModelDeps());

    const res = await request(app)
      .put("/api/models/config")
      .send({ primary: "noslash" });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ ok: false, error: "Invalid primary model key" });
  });

  it("rejects invalid configuredModels payloads on PUT /api/models/config", async () => {
    const app = createApp(createModelDeps());

    const res = await request(app)
      .put("/api/models/config")
      .send({ configuredModels: "bad" });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ ok: false, error: "Invalid configuredModels" });
  });

  it("saves profiles, auth order, and reports git-sync warnings on PUT /api/models/config", async () => {
    const deps = createModelDeps();
    deps.readEnvFile.mockReturnValue([]);
    deps.shellCmd.mockRejectedValue(new Error("git sync down"));
    const cacheStub = createCacheStub();
    const app = createApp(deps, cacheStub);

    const res = await request(app)
      .put("/api/models/config")
      .send({
        primary: "openai/gpt-5.6-sol",
        profiles: [
          { id: "openai:default", type: "api_key", provider: "openai", key: "sk-new" },
          { id: "", type: "oauth", provider: "", key: "ignored" },
        ],
        authOrder: { openai: ["openai:default"], bogus: "nope" },
      });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true, syncWarning: "git sync down" });
    expect(deps.writeEnvFile).toHaveBeenCalledWith([
      { key: "OPENAI_API_KEY", value: "sk-new" },
    ]);
    expect(deps.authProfiles.setAuthOrder).toHaveBeenCalledTimes(1);
    expect(deps.authProfiles.setAuthOrder).toHaveBeenCalledWith(
      "openai",
      ["openai:default"],
      undefined,
    );
    expect(cacheStub.markStale).toHaveBeenCalled();
  });

  it("skips env syncing when env-file helpers are not wired up", async () => {
    const authProfiles = {
      setModelConfig: vi.fn(),
      upsertProfile: vi.fn(),
      setAuthOrder: vi.fn(),
      syncConfigAuthReferencesForAgent: vi.fn(),
    };
    const app = express();
    app.use(express.json());
    registerModelRoutes({
      app,
      shellCmd: vi.fn(async () => ""),
      gatewayEnv: vi.fn(() => ({})),
      authProfiles,
      modelCatalogCache: createCacheStub(),
    });

    const res = await request(app)
      .put("/api/models/config")
      .send({
        profiles: [
          { id: "openai:default", type: "api_key", provider: "openai", key: "sk" },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
    expect(authProfiles.upsertProfile).toHaveBeenCalled();
  });

  it("returns 500 when saving model config fails", async () => {
    const deps = createModelDeps();
    deps.authProfiles.setModelConfig.mockImplementation(() => {
      throw new Error("save failed");
    });
    const app = createApp(deps);

    const res = await request(app)
      .put("/api/models/config")
      .send({ primary: "openai/gpt-5.6-sol" });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ ok: false, error: "save failed" });
  });

  it("lists auth profiles on GET /api/models/auth", async () => {
    const deps = createModelDeps();
    deps.authProfiles.listProfiles.mockReturnValue([
      { id: "openai:default", type: "api_key", provider: "openai" },
    ]);
    deps.authProfiles.loadAuthStore.mockReturnValue({
      profiles: {},
      order: { openai: ["openai:default"] },
    });
    const app = createApp(deps);

    const res = await request(app).get("/api/models/auth?agentId=ops");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      ok: true,
      profiles: [{ id: "openai:default", type: "api_key", provider: "openai" }],
      order: { openai: ["openai:default"] },
    });
    expect(deps.authProfiles.listProfiles).toHaveBeenCalledWith("ops");
  });

  it("returns 500 when listing auth profiles fails", async () => {
    const deps = createModelDeps();
    deps.authProfiles.listProfiles.mockImplementation(() => {
      throw new Error("auth read failed");
    });
    const app = createApp(deps);

    const res = await request(app).get("/api/models/auth");

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ ok: false, error: "auth read failed" });
  });

  it("rejects auth profile upserts without type or provider", async () => {
    const app = createApp(createModelDeps());

    const res = await request(app)
      .put("/api/models/auth/openai:default")
      .send({ provider: "openai" });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      ok: false,
      error: "Missing profileId, type, or provider",
    });
  });

  it("rejects auth profile upserts with invalid credential types", async () => {
    const app = createApp(createModelDeps());

    const res = await request(app)
      .put("/api/models/auth/openai:default")
      .send({ type: "password", provider: "openai" });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      ok: false,
      error: "Invalid credential type: password",
    });
  });

  it("upserts auth profiles and syncs env vars on PUT /api/models/auth/:profileId", async () => {
    const deps = createModelDeps();
    deps.readEnvFile.mockReturnValue([]);
    const cacheStub = createCacheStub();
    const app = createApp(deps, cacheStub);

    const res = await request(app)
      .put("/api/models/auth/openai:default?agentId=ops")
      .send({ type: "api_key", provider: "openai", key: "sk-put" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
    expect(deps.authProfiles.upsertProfile).toHaveBeenCalledWith(
      "openai:default",
      { type: "api_key", provider: "openai", key: "sk-put" },
      "ops",
    );
    expect(deps.writeEnvFile).toHaveBeenCalledWith([
      { key: "OPENAI_API_KEY", value: "sk-put" },
    ]);
    expect(cacheStub.markStale).toHaveBeenCalled();
  });

  it("returns 500 when upserting an auth profile fails", async () => {
    const deps = createModelDeps();
    deps.authProfiles.upsertProfile.mockImplementation(() => {
      throw new Error("upsert failed");
    });
    const app = createApp(deps);

    const res = await request(app)
      .put("/api/models/auth/openai:default")
      .send({ type: "api_key", provider: "openai", key: "sk" });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ ok: false, error: "upsert failed" });
  });

  it("removes auth profiles on DELETE /api/models/auth/:profileId", async () => {
    const deps = createModelDeps();
    const cacheStub = createCacheStub();
    const app = createApp(deps, cacheStub);

    const res = await request(app).delete("/api/models/auth/openai:default?agentId=ops");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true, removed: true });
    expect(deps.authProfiles.removeProfile).toHaveBeenCalledWith(
      "openai:default",
      "ops",
    );
    expect(cacheStub.markStale).toHaveBeenCalled();
  });

  it("returns 500 when removing an auth profile fails", async () => {
    const deps = createModelDeps();
    deps.authProfiles.removeProfile.mockImplementation(() => {
      throw new Error("remove failed");
    });
    const app = createApp(deps);

    const res = await request(app).delete("/api/models/auth/openai:default");

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ ok: false, error: "remove failed" });
  });

  it("defaults isOnboarded to true and builds its own catalog cache when omitted", async () => {
    const deps = createModelDeps();
    const shellCmd = vi.fn(async () => "{}");
    const app = express();
    app.use(express.json());
    registerModelRoutes({
      app,
      shellCmd,
      gatewayEnv: () => ({}),
      parseJsonFromNoisyOutput: () => ({ models: [] }),
      normalizeOnboardingModels: (items) => items,
      readOpenclawVersion: () => null,
      authProfiles: deps.authProfiles,
    });

    const res = await request(app).get("/api/models");

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    // The default isOnboarded gate reports true, so a dynamic refresh runs.
    await vi.waitFor(() => expect(shellCmd).toHaveBeenCalled());
  });

  it("guards against empty profile ids on auth upsert and delete handlers", async () => {
    const deps = createModelDeps();
    const { app, routes } = createHandlerRegistry();
    registerModelRoutes({ app, ...deps, modelCatalogCache: createCacheStub() });

    const putHandler = routes.get("PUT /api/models/auth/:profileId");
    const putRes = createMockRes();
    putHandler(
      { params: {}, body: { type: "api_key", provider: "openai" }, query: {} },
      putRes,
    );
    expect(putRes.statusCode).toBe(400);
    expect(putRes.body).toEqual({
      ok: false,
      error: "Missing profileId, type, or provider",
    });

    const deleteHandler = routes.get("DELETE /api/models/auth/:profileId");
    const deleteRes = createMockRes();
    deleteHandler({ params: {}, query: {} }, deleteRes);
    expect(deleteRes.statusCode).toBe(400);
    expect(deleteRes.body).toEqual({ ok: false, error: "Missing profileId" });
  });
});
