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
      imageModel: "google/gemini-3-pro-preview",
    });
    const app = createApp(deps);

    const res = await request(app).get("/api/models/status");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      ok: true,
      modelKey: "openai/gpt-5.1-codex",
      fallbacks: ["anthropic/claude-opus-4-6"],
      imageModel: "google/gemini-3-pro-preview",
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
});
