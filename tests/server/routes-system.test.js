const express = require("express");
const request = require("supertest");

const { registerSystemRoutes } = require("../../lib/server/routes/system");

const createSystemDeps = () => {
  const deps = {
    fs: {
      existsSync: vi.fn(() => true),
      readFileSync: vi.fn(() => {
        throw new Error("no config");
      }),
      writeFileSync: vi.fn(),
      mkdirSync: vi.fn(),
      rmSync: vi.fn(),
    },
    readEnvFile: vi.fn(() => []),
    writeEnvFile: vi.fn(),
    reloadEnv: vi.fn(() => true),
    kKnownVars: [
      {
        key: "OPENAI_API_KEY",
        label: "OpenAI API Key",
        group: "ai",
        hint: "",
        features: ["Models", "Embeddings", "TTS", "STT"],
      },
      {
        key: "ANTHROPIC_TOKEN",
        label: "Anthropic Setup Token",
        group: "ai",
        hint: "",
        features: ["Models"],
        visibleInEnvars: false,
      },
      { key: "GITHUB_TOKEN", label: "GitHub Access Token", group: "github", hint: "" },
    ],
    kKnownKeys: new Set(["OPENAI_API_KEY", "ANTHROPIC_TOKEN", "GITHUB_TOKEN"]),
    kSystemVars: new Set(["PORT", "SETUP_PASSWORD"]),
    syncChannelConfig: vi.fn(),
    isGatewayRunning: vi.fn(async () => true),
    isOnboarded: vi.fn(() => true),
    getChannelStatus: vi.fn(() => ({ telegram: "ready" })),
    openclawVersionService: {
      readOpenclawVersion: vi.fn(() => "1.2.3"),
      getVersionStatus: vi.fn(async () => ({ ok: true, current: "1.2.3" })),
      updateOpenclaw: vi.fn(async () => ({ status: 200, body: { ok: true } })),
    },
    alphaclawVersionService: {
      readAlphaclawVersion: vi.fn(() => "0.1.5"),
      getVersionStatus: vi.fn(async () => ({
        ok: true,
        currentVersion: "0.1.5",
        currentOpenclawVersion: "1.2.3",
        latestVersion: "0.2.0",
        latestOpenclawVersion: "1.3.0",
        hasUpdate: true,
        updateStrategy: {
          action: "self-update",
          provider: "self-hosted",
          label: "This install",
          description: "Update in place",
          steps: [],
          primaryActionLabel: "Update now",
        },
      })),
      updateAlphaclaw: vi.fn(async () => ({
        status: 200,
        body: { ok: true, previousVersion: "0.1.5", restarting: true },
      })),
      restartProcess: vi.fn(),
    },
    clawCmd: vi.fn(async () => ({ ok: true, stdout: "" })),
    restartGateway: vi.fn(),
    restartRequiredState: {
      markRequired: vi.fn(),
      getSnapshot: vi.fn(async () => ({
        restartRequired: false,
        restartInProgress: false,
        gatewayRunning: true,
      })),
      markRestartInProgress: vi.fn(),
      clearRequired: vi.fn(),
      markRestartComplete: vi.fn(),
    },
    topicRegistry: {
      getGroup: vi.fn(() => null),
    },
    authProfiles: {
      listApiKeyProviders: vi.fn(() => ["openai"]),
      getEnvVarForApiKeyProvider: vi.fn((provider) =>
        provider === "openai" ? "OPENAI_API_KEY" : "",
      ),
      upsertApiKeyProfileForEnvVar: vi.fn(),
      removeApiKeyProfileForEnvVar: vi.fn(),
    },
    OPENCLAW_DIR: "/tmp/openclaw",
    ensureGatewayProxyConfig: vi.fn(() => false),
    getBaseUrl: vi.fn(() => "https://setup.example.com"),
  };
  return deps;
};

const createApp = (deps) => {
  const app = express();
  app.use(express.json());
  registerSystemRoutes({
    app,
    ...deps,
  });
  return app;
};

describe("server/routes/system", () => {
  it("merges known vars and custom vars on GET /api/env", async () => {
    const deps = createSystemDeps();
    deps.readEnvFile.mockReturnValue([
      { key: "OPENAI_API_KEY", value: "abc" },
      { key: "PORT", value: "3000" },
      { key: "CUSTOM_FLAG", value: "1" },
    ]);
    const app = createApp(deps);

    const res = await request(app).get("/api/env");

    expect(res.status).toBe(200);
    expect(res.body.vars).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "OPENAI_API_KEY",
          value: "abc",
          features: ["Models", "Embeddings", "TTS", "STT"],
          source: "env_file",
        }),
        expect.objectContaining({
          key: "GITHUB_TOKEN",
          value: "",
          source: "unset",
        }),
        expect.objectContaining({
          key: "CUSTOM_FLAG",
          value: "1",
          group: "custom",
        }),
      ]),
    );
    expect(res.body.vars.some((entry) => entry.key === "PORT")).toBe(false);
    expect(res.body.vars.some((entry) => entry.key === "ANTHROPIC_TOKEN")).toBe(false);
    expect(res.body.vars.some((entry) => entry.key === "GITHUB_WORKSPACE_REPO")).toBe(
      false,
    );
    expect(res.body.reservedKeys).toEqual(
      expect.arrayContaining([
        "PORT",
        "SETUP_PASSWORD",
        "GITHUB_WORKSPACE_REPO",
        "GOG_KEYRING_PASSWORD",
      ]),
    );
    expect(res.body.restartRequired).toBe(false);
  });

  it("rejects reserved vars on PUT /api/env", async () => {
    const deps = createSystemDeps();
    deps.reloadEnv.mockReturnValue(true);
    deps.readEnvFile.mockReturnValue([
      { key: "GITHUB_WORKSPACE_REPO", value: "owner/repo" },
    ]);
    const app = createApp(deps);

    const payload = {
      vars: [
        { key: "OPENAI_API_KEY", value: "abc" },
        { key: "PORT", value: "3000" },
        { key: "GITHUB_WORKSPACE_REPO", value: "changed/repo" },
      ],
    };

    const res = await request(app).put("/api/env").send(payload);

    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
    expect(res.body.error).toContain("Reserved environment variables cannot be edited");
    expect(res.body.error).toContain("PORT");
    expect(res.body.error).toContain("GITHUB_WORKSPACE_REPO");
    expect(deps.writeEnvFile).not.toHaveBeenCalled();
    expect(deps.syncChannelConfig).not.toHaveBeenCalled();
    expect(deps.restartGateway).not.toHaveBeenCalled();
  });

  it("rejects gog keyring password edits on PUT /api/env", async () => {
    const deps = createSystemDeps();
    const app = createApp(deps);

    const res = await request(app).put("/api/env").send({
      vars: [{ key: "GOG_KEYRING_PASSWORD", value: "changed" }],
    });

    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
    expect(res.body.error).toContain("GOG_KEYRING_PASSWORD");
    expect(deps.writeEnvFile).not.toHaveBeenCalled();
    expect(deps.syncChannelConfig).not.toHaveBeenCalled();
  });

  it("does not restart gateway when env is unchanged", async () => {
    const deps = createSystemDeps();
    deps.reloadEnv.mockReturnValue(false);
    const app = createApp(deps);

    const res = await request(app).put("/api/env").send({
      vars: [{ key: "OPENAI_API_KEY", value: "same" }],
    });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true, changed: false, restartRequired: false });
    expect(deps.restartGateway).not.toHaveBeenCalled();
  });

  it("preserves hidden known vars on PUT /api/env", async () => {
    const deps = createSystemDeps();
    deps.readEnvFile.mockReturnValue([
      { key: "ANTHROPIC_TOKEN", value: "hidden-token" },
    ]);
    const app = createApp(deps);

    const res = await request(app).put("/api/env").send({
      vars: [{ key: "OPENAI_API_KEY", value: "same" }],
    });

    expect(res.status).toBe(200);
    expect(deps.writeEnvFile).toHaveBeenCalledWith([
      { key: "OPENAI_API_KEY", value: "same" },
      { key: "ANTHROPIC_TOKEN", value: "hidden-token" },
    ]);
  });

  it("hides and preserves managed slack channel tokens on /api/env", async () => {
    const deps = createSystemDeps();
    deps.readEnvFile.mockReturnValue([
      { key: "SLACK_BOT_TOKEN", value: "xoxb-hidden" },
      { key: "SLACK_APP_TOKEN", value: "xapp-hidden" },
    ]);
    const app = createApp(deps);

    const getRes = await request(app).get("/api/env");
    expect(getRes.status).toBe(200);
    expect(getRes.body.vars.some((entry) => entry.key === "SLACK_BOT_TOKEN")).toBe(
      false,
    );
    expect(getRes.body.vars.some((entry) => entry.key === "SLACK_APP_TOKEN")).toBe(
      false,
    );

    const putRes = await request(app).put("/api/env").send({
      vars: [{ key: "OPENAI_API_KEY", value: "same" }],
    });
    expect(putRes.status).toBe(200);
    expect(deps.writeEnvFile).toHaveBeenCalledWith([
      { key: "OPENAI_API_KEY", value: "same" },
      { key: "SLACK_BOT_TOKEN", value: "xoxb-hidden" },
      { key: "SLACK_APP_TOKEN", value: "xapp-hidden" },
    ]);
  });

  it("hides and preserves WHATSAPP_OWNER_NUMBER on /api/env", async () => {
    const deps = createSystemDeps();
    deps.readEnvFile.mockReturnValue([
      { key: "WHATSAPP_OWNER_NUMBER", value: "+15551234567" },
    ]);
    const app = createApp(deps);

    const getRes = await request(app).get("/api/env");
    expect(getRes.status).toBe(200);
    expect(
      getRes.body.vars.some((entry) => entry.key === "WHATSAPP_OWNER_NUMBER"),
    ).toBe(false);

    const putRes = await request(app).put("/api/env").send({
      vars: [{ key: "OPENAI_API_KEY", value: "same" }],
    });
    expect(putRes.status).toBe(200);
    expect(deps.writeEnvFile).toHaveBeenCalledWith([
      { key: "OPENAI_API_KEY", value: "same" },
      { key: "WHATSAPP_OWNER_NUMBER", value: "+15551234567" },
    ]);
  });

  it("syncs API-key auth profiles from known env vars on save", async () => {
    const deps = createSystemDeps();
    const app = createApp(deps);

    const res = await request(app).put("/api/env").send({
      vars: [{ key: "OPENAI_API_KEY", value: "sk-test-123" }],
    });

    expect(res.status).toBe(200);
    expect(deps.authProfiles.getEnvVarForApiKeyProvider).toHaveBeenCalledWith("openai");
    expect(deps.authProfiles.upsertApiKeyProfileForEnvVar).toHaveBeenCalledWith(
      "openai",
      "sk-test-123",
    );
  });

  it("removes mirrored auth profile when synced env var is cleared", async () => {
    const deps = createSystemDeps();
    const app = createApp(deps);

    const res = await request(app).put("/api/env").send({
      vars: [{ key: "OPENAI_API_KEY", value: "" }],
    });

    expect(res.status).toBe(200);
    expect(deps.authProfiles.removeApiKeyProfileForEnvVar).toHaveBeenCalledWith(
      "openai",
    );
    expect(deps.authProfiles.upsertApiKeyProfileForEnvVar).not.toHaveBeenCalled();
  });

  it("keeps restartRequired true until gateway restart", async () => {
    const deps = createSystemDeps();
    const app = createApp(deps);

    const firstSave = await request(app).put("/api/env").send({
      vars: [{ key: "OPENAI_API_KEY", value: "abc" }],
    });
    expect(firstSave.status).toBe(200);
    expect(firstSave.body.restartRequired).toBe(true);

    deps.reloadEnv.mockReturnValue(false);
    const secondSave = await request(app).put("/api/env").send({
      vars: [{ key: "OPENAI_API_KEY", value: "abc" }],
    });
    expect(secondSave.status).toBe(200);
    expect(secondSave.body).toEqual({
      ok: true,
      changed: false,
      restartRequired: true,
    });

    const envBeforeRestart = await request(app).get("/api/env");
    expect(envBeforeRestart.status).toBe(200);
    expect(envBeforeRestart.body.restartRequired).toBe(true);

    const restart = await request(app).post("/api/gateway/restart");
    expect(restart.status).toBe(200);
    expect(restart.body).toEqual({ ok: true, restartRequired: false });
    expect(deps.restartGateway).toHaveBeenCalledTimes(1);

    const envAfterRestart = await request(app).get("/api/env");
    expect(envAfterRestart.status).toBe(200);
    expect(envAfterRestart.body.restartRequired).toBe(false);
  });

  it("returns 400 when vars payload is missing", async () => {
    const deps = createSystemDeps();
    const app = createApp(deps);

    const res = await request(app).put("/api/env").send({});

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ ok: false, error: "Missing vars array" });
  });

  it("reports running gateway status on GET /api/status", async () => {
    const deps = createSystemDeps();
    deps.fs.existsSync.mockReturnValue(true);
    deps.isGatewayRunning.mockResolvedValue(true);
    const app = createApp(deps);

    const res = await request(app).get("/api/status");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      expect.objectContaining({
        gateway: "running",
        configExists: true,
        openclawVersion: "1.2.3",
        alphaclaw: {
          features: {
            openaiCompatApi: {
              enabled: false,
            },
          },
        },
        syncCron: expect.objectContaining({
          enabled: true,
          schedule: "0 * * * *",
        }),
      }),
    );
  });

  it("returns tokenized dashboard URL when OpenClaw CLI prints a token", async () => {
    const previousEnvToken = process.env.OPENCLAW_GATEWAY_TOKEN;
    delete process.env.OPENCLAW_GATEWAY_TOKEN;
    try {
      const deps = createSystemDeps();
      deps.clawCmd.mockResolvedValueOnce({
        ok: true,
        stdout: "Dashboard URL: http://127.0.0.1:18789/#token=abc123",
      });
      const app = createApp(deps);

      const res = await request(app).get("/api/gateway/dashboard");

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ ok: true, url: "/openclaw/#token=abc123" });
    } finally {
      if (previousEnvToken === undefined) delete process.env.OPENCLAW_GATEWAY_TOKEN;
      else process.env.OPENCLAW_GATEWAY_TOKEN = previousEnvToken;
    }
  });

  it("falls back to plain configured gateway token for dashboard URL", async () => {
    const deps = createSystemDeps();
    deps.clawCmd.mockResolvedValueOnce({
      ok: true,
      stdout: "Dashboard URL: http://127.0.0.1:18789/",
    });
    deps.fs.readFileSync.mockImplementation((filePath) => {
      if (String(filePath).endsWith("openclaw.json")) {
        return JSON.stringify({ gateway: { auth: { token: "cfg-token+value" } } });
      }
      throw new Error("unexpected file");
    });
    const app = createApp(deps);

    const res = await request(app).get("/api/gateway/dashboard");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      ok: true,
      url: "/openclaw/#token=cfg-token%2Bvalue",
      source: "config",
    });
    expect(deps.clawCmd).not.toHaveBeenCalled();
  });

  it("falls back to OPENCLAW_GATEWAY_TOKEN from env file for dashboard URL", async () => {
    const previousEnvToken = process.env.OPENCLAW_GATEWAY_TOKEN;
    process.env.OPENCLAW_GATEWAY_TOKEN = "";
    try {
      const deps = createSystemDeps();
      deps.clawCmd.mockResolvedValueOnce({
        ok: true,
        stdout: "Dashboard URL: http://127.0.0.1:18789/",
      });
      deps.readEnvFile.mockReturnValue([
        { key: "OPENCLAW_GATEWAY_TOKEN", value: "env-token" },
      ]);
      const app = createApp(deps);

      const res = await request(app).get("/api/gateway/dashboard");

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        ok: true,
        url: "/openclaw/#token=env-token",
        source: "config",
      });
    } finally {
      if (previousEnvToken === undefined) delete process.env.OPENCLAW_GATEWAY_TOKEN;
      else process.env.OPENCLAW_GATEWAY_TOKEN = previousEnvToken;
    }
  });

  it("resolves configured OPENCLAW_GATEWAY_TOKEN env refs for dashboard URL", async () => {
    const previousEnvToken = process.env.OPENCLAW_GATEWAY_TOKEN;
    process.env.OPENCLAW_GATEWAY_TOKEN = "real-env-token+value";
    try {
      const deps = createSystemDeps();
      deps.clawCmd.mockResolvedValueOnce({
        ok: true,
        stdout: "Dashboard URL: http://127.0.0.1:18789/",
      });
      deps.fs.readFileSync.mockImplementation((filePath) => {
        if (String(filePath).endsWith("openclaw.json")) {
          return JSON.stringify({
            gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
          });
        }
        throw new Error("unexpected file");
      });
      const app = createApp(deps);

      const res = await request(app).get("/api/gateway/dashboard");

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        ok: true,
        url: "/openclaw/#token=real-env-token%2Bvalue",
        source: "config",
      });
    } finally {
      if (previousEnvToken === undefined) delete process.env.OPENCLAW_GATEWAY_TOKEN;
      else process.env.OPENCLAW_GATEWAY_TOKEN = previousEnvToken;
    }
  });

  it("resolves configured OPENCLAW_GATEWAY_TOKEN env refs from env file for dashboard URL", async () => {
    const previousEnvToken = process.env.OPENCLAW_GATEWAY_TOKEN;
    delete process.env.OPENCLAW_GATEWAY_TOKEN;
    try {
      const deps = createSystemDeps();
      deps.clawCmd.mockResolvedValueOnce({
        ok: true,
        stdout: "Dashboard URL: http://127.0.0.1:18789/",
      });
      deps.fs.readFileSync.mockImplementation((filePath) => {
        if (String(filePath).endsWith("openclaw.json")) {
          return JSON.stringify({
            gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
          });
        }
        throw new Error("unexpected file");
      });
      deps.readEnvFile.mockReturnValue([
        { key: "OPENCLAW_GATEWAY_TOKEN", value: "env-file-token" },
      ]);
      const app = createApp(deps);

      const res = await request(app).get("/api/gateway/dashboard");

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        ok: true,
        url: "/openclaw/#token=env-file-token",
        source: "config",
      });
    } finally {
      if (previousEnvToken === undefined) delete process.env.OPENCLAW_GATEWAY_TOKEN;
      else process.env.OPENCLAW_GATEWAY_TOKEN = previousEnvToken;
    }
  });

  it("resolves configured object SecretRefs for dashboard URL", async () => {
    const previousEnvToken = process.env.OPENCLAW_GATEWAY_TOKEN;
    process.env.OPENCLAW_GATEWAY_TOKEN = "object-ref-token+value";
    try {
      const deps = createSystemDeps();
      deps.fs.readFileSync.mockImplementation((filePath) => {
        if (String(filePath).endsWith("openclaw.json")) {
          return JSON.stringify({
            gateway: {
              auth: {
                token: {
                  source: "env",
                  provider: "default",
                  id: "OPENCLAW_GATEWAY_TOKEN",
                },
              },
            },
          });
        }
        throw new Error("unexpected file");
      });
      const app = createApp(deps);

      const res = await request(app).get("/api/gateway/dashboard");

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        ok: true,
        url: "/openclaw/#token=object-ref-token%2Bvalue",
        source: "config",
      });
      expect(deps.clawCmd).not.toHaveBeenCalled();
    } finally {
      if (previousEnvToken === undefined) delete process.env.OPENCLAW_GATEWAY_TOKEN;
      else process.env.OPENCLAW_GATEWAY_TOKEN = previousEnvToken;
    }
  });

  it("marks dashboard URL as needing auth when no token can be resolved", async () => {
    const previousEnvToken = process.env.OPENCLAW_GATEWAY_TOKEN;
    delete process.env.OPENCLAW_GATEWAY_TOKEN;
    try {
      const deps = createSystemDeps();
      deps.clawCmd.mockResolvedValueOnce({
        ok: true,
        stdout: "Dashboard URL: http://127.0.0.1:18789/",
      });
      const app = createApp(deps);

      const res = await request(app).get("/api/gateway/dashboard");

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ ok: true, url: "/openclaw", needsAuth: true });
    } finally {
      if (previousEnvToken === undefined) delete process.env.OPENCLAW_GATEWAY_TOKEN;
      else process.env.OPENCLAW_GATEWAY_TOKEN = previousEnvToken;
    }
  });

  it("returns sync cron status on GET /api/sync-cron", async () => {
    const deps = createSystemDeps();
    deps.fs.readFileSync.mockReturnValueOnce(
      JSON.stringify({ enabled: false, schedule: "*/30 * * * *" }),
    );
    const app = createApp(deps);

    const res = await request(app).get("/api/sync-cron");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      expect.objectContaining({
        ok: true,
        enabled: false,
        schedule: "*/30 * * * *",
      }),
    );
  });

  it("updates sync cron config on PUT /api/sync-cron", async () => {
    const deps = createSystemDeps();
    deps.fs.readFileSync.mockReturnValueOnce(
      JSON.stringify({ enabled: true, schedule: "0 * * * *" }),
    );
    const app = createApp(deps);

    const res = await request(app).put("/api/sync-cron").send({
      enabled: true,
      schedule: "*/15 * * * *",
    });

    expect(res.status).toBe(200);
    expect(deps.fs.mkdirSync).toHaveBeenCalledWith("/tmp/openclaw/cron", {
      recursive: true,
    });
    expect(deps.fs.writeFileSync).toHaveBeenCalledWith(
      "/tmp/openclaw/cron/system-sync.json",
      expect.stringContaining('"schedule": "*/15 * * * *"'),
    );
    expect(deps.fs.writeFileSync).toHaveBeenCalledWith(
      "/etc/cron.d/openclaw-hourly-sync",
      expect.stringContaining('*/15 * * * * root bash "/tmp/openclaw/.alphaclaw/hourly-git-sync.sh"'),
      expect.objectContaining({ mode: 0o644 }),
    );
    expect(res.body.ok).toBe(true);
  });

  it("returns AlphaClaw config on GET /api/alphaclaw/config", async () => {
    const deps = createSystemDeps();
    deps.fs.readFileSync.mockImplementation((targetPath) => {
      if (targetPath === "/tmp/openclaw/alphaclaw.json") {
        return JSON.stringify({
          features: { openaiCompatApi: { enabled: true } },
        });
      }
      throw new Error("no config");
    });
    const app = createApp(deps);

    const res = await request(app).get("/api/alphaclaw/config");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      ok: true,
      config: {
        features: {
          openaiCompatApi: {
            enabled: true,
          },
        },
      },
    });
  });

  it("persists the OpenAI-compatible API feature toggle", async () => {
    const deps = createSystemDeps();
    const app = createApp(deps);

    const res = await request(app)
      .put("/api/alphaclaw/config/features/openai-compat-api")
      .send({ enabled: true });

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      expect.objectContaining({
        ok: true,
        changed: true,
        gatewayConfigChanged: false,
        config: {
          features: {
            openaiCompatApi: {
              enabled: true,
            },
          },
        },
      }),
    );
    expect(deps.fs.mkdirSync).toHaveBeenCalledWith("/tmp/openclaw", {
      recursive: true,
    });
    expect(deps.fs.writeFileSync).toHaveBeenCalledWith(
      "/tmp/openclaw/alphaclaw.json",
      expect.stringContaining('"enabled": true'),
    );
    expect(deps.ensureGatewayProxyConfig).toHaveBeenCalledWith(
      "https://setup.example.com",
    );
  });

  it("marks restart required when enabling API changes OpenClaw gateway config", async () => {
    const deps = createSystemDeps();
    deps.ensureGatewayProxyConfig.mockReturnValue(true);
    deps.restartRequiredState.getSnapshot.mockResolvedValueOnce({
      restartRequired: true,
      restartInProgress: false,
      gatewayRunning: true,
    });
    const app = createApp(deps);

    const res = await request(app)
      .put("/api/alphaclaw/config/features/openai-compat-api")
      .send({ enabled: true });

    expect(res.status).toBe(200);
    expect(res.body.restartRequired).toBe(true);
    expect(res.body.gatewayConfigChanged).toBe(true);
    expect(deps.restartRequiredState.markRequired).toHaveBeenCalledWith(
      "openai_compat_api_enabled",
    );
  });

  it("rejects non-boolean OpenAI-compatible API feature updates", async () => {
    const deps = createSystemDeps();
    const app = createApp(deps);

    const res = await request(app)
      .put("/api/alphaclaw/config/features/openai-compat-api")
      .send({ enabled: "yes" });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      ok: false,
      error: "enabled must be a boolean",
    });
    expect(deps.fs.writeFileSync).not.toHaveBeenCalledWith(
      "/tmp/openclaw/alphaclaw.json",
      expect.any(String),
    );
  });

  it("returns alphaclaw version status on GET /api/alphaclaw/version", async () => {
    const deps = createSystemDeps();
    const app = createApp(deps);

    const res = await request(app).get("/api/alphaclaw/version");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      expect.objectContaining({
        ok: true,
        currentVersion: "0.1.5",
        currentOpenclawVersion: "1.2.3",
        latestVersion: "0.2.0",
        latestOpenclawVersion: "1.3.0",
        hasUpdate: true,
        updateStrategy: expect.objectContaining({
          action: "self-update",
          provider: "self-hosted",
        }),
      }),
    );
    expect(deps.alphaclawVersionService.getVersionStatus).toHaveBeenCalledWith(false);
  });

  it("passes refresh flag to alphaclaw version service", async () => {
    const deps = createSystemDeps();
    const app = createApp(deps);

    await request(app).get("/api/alphaclaw/version?refresh=1");

    expect(deps.alphaclawVersionService.getVersionStatus).toHaveBeenCalledWith(true);
  });

  it("returns update result and schedules restart on POST /api/alphaclaw/update", async () => {
    vi.useFakeTimers();
    const deps = createSystemDeps();
    const app = createApp(deps);

    const res = await request(app).post("/api/alphaclaw/update");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      ok: true,
      previousVersion: "0.1.5",
      restarting: true,
    });
    expect(deps.alphaclawVersionService.updateAlphaclaw).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1000);
    expect(deps.alphaclawVersionService.restartProcess).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it("does not schedule a local restart for managed updates", async () => {
    vi.useFakeTimers();
    const deps = createSystemDeps();
    deps.alphaclawVersionService.updateAlphaclaw.mockResolvedValue({
      status: 200,
      body: {
        ok: true,
        previousVersion: "0.1.5",
        latestVersion: "0.2.0",
        latestOpenclawVersion: "1.3.0",
        restarting: true,
        managedUpdate: true,
      },
    });
    const app = createApp(deps);

    const res = await request(app).post("/api/alphaclaw/update");

    expect(res.status).toBe(200);
    await vi.advanceTimersByTimeAsync(1000);
    expect(deps.alphaclawVersionService.restartProcess).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it("returns error status when alphaclaw update fails", async () => {
    const deps = createSystemDeps();
    deps.alphaclawVersionService.updateAlphaclaw.mockResolvedValue({
      status: 500,
      body: { ok: false, error: "npm install failed" },
    });
    const app = createApp(deps);

    const res = await request(app).post("/api/alphaclaw/update");

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ ok: false, error: "npm install failed" });
  });

  it("returns 409 when alphaclaw update is already in progress", async () => {
    const deps = createSystemDeps();
    deps.alphaclawVersionService.updateAlphaclaw.mockResolvedValue({
      status: 409,
      body: { ok: false, error: "AlphaClaw update already in progress" },
    });
    const app = createApp(deps);

    const res = await request(app).post("/api/alphaclaw/update");

    expect(res.status).toBe(409);
    expect(res.body).toEqual({
      ok: false,
      error: "AlphaClaw update already in progress",
    });
  });

  it("returns raw session metadata on GET /api/agent/sessions", async () => {
    const deps = createSystemDeps();
    deps.fs.readFileSync.mockImplementation((targetPath) => {
      if (targetPath === "/tmp/openclaw/openclaw.json") {
        return JSON.stringify({
          channels: {
            telegram: {
              accounts: {
                default: { name: "Tester" },
                mac: { name: "Mac" },
              },
            },
          },
          bindings: [
            { agentId: "main", match: { channel: "telegram", accountId: "default" } },
            { agentId: "morpheus", match: { channel: "telegram", accountId: "mac" } },
          ],
        });
      }
      throw new Error(`unexpected read: ${targetPath}`);
    });
    deps.topicRegistry.getGroup.mockImplementation((groupId) =>
      String(groupId) === "-1003709908795"
        ? {
            name: "AlphaClaw",
            topics: {
              "4011": { name: "Rosebud" },
            },
          }
        : null,
    );
    deps.clawCmd.mockResolvedValue({
      ok: true,
      stdout: JSON.stringify({
        sessions: [
          { key: "agent:main:main", sessionId: "main-session", updatedAt: 10 },
          {
            key: "agent:morpheus:telegram:direct:1050",
            sessionId: "morpheus-direct-session",
            updatedAt: 11,
          },
          { key: "agent:main:hook:abc", sessionId: "hook-session", updatedAt: 9 },
          { key: "agent:main:cron:abc", sessionId: "cron-session", updatedAt: 8 },
          { key: "agent:main:doctor:42", sessionId: "doctor-session", updatedAt: 7 },
          {
            key: "agent:main:telegram:direct:1050",
            sessionId: "",
            updatedAt: 6,
          },
          {
            key: "agent:main:telegram:group:-1003709908795:topic:4011",
            sessionId: "topic-session",
            updatedAt: 5,
          },
        ],
      }),
    });
    const app = createApp(deps);

    const res = await request(app).get("/api/agent/sessions");

    expect(res.status).toBe(200);
    expect(deps.clawCmd).toHaveBeenCalledWith(
      "sessions --json --all-agents",
      { quiet: true },
    );
    expect(res.body.ok).toBe(true);
    expect(res.body.sessions).toEqual([
      {
        key: "agent:morpheus:telegram:direct:1050",
        sessionId: "morpheus-direct-session",
        updatedAt: 11,
        agentId: "morpheus",
        agentLabel: "Morpheus Agent",
        channel: "telegram",
        groupName: "",
        topicName: "",
        replyChannel: "telegram",
        replyTo: "1050",
      },
      {
        key: "agent:main:main",
        sessionId: "main-session",
        updatedAt: 10,
        agentId: "main",
        agentLabel: "Main Agent",
        channel: "",
        groupName: "",
        topicName: "",
        replyChannel: "",
        replyTo: "",
      },
      {
        key: "agent:main:hook:abc",
        sessionId: "hook-session",
        updatedAt: 9,
        agentId: "main",
        agentLabel: "Main Agent",
        channel: "",
        groupName: "",
        topicName: "",
        replyChannel: "",
        replyTo: "",
      },
      {
        key: "agent:main:cron:abc",
        sessionId: "cron-session",
        updatedAt: 8,
        agentId: "main",
        agentLabel: "Main Agent",
        channel: "",
        groupName: "",
        topicName: "",
        replyChannel: "",
        replyTo: "",
      },
      {
        key: "agent:main:doctor:42",
        sessionId: "doctor-session",
        updatedAt: 7,
        agentId: "main",
        agentLabel: "Main Agent",
        channel: "",
        groupName: "",
        topicName: "",
        replyChannel: "",
        replyTo: "",
      },
      {
        key: "agent:main:telegram:direct:1050",
        sessionId: "",
        updatedAt: 6,
        agentId: "main",
        agentLabel: "Main Agent",
        channel: "telegram",
        groupName: "",
        topicName: "",
        replyChannel: "telegram",
        replyTo: "1050",
      },
      {
        key: "agent:main:telegram:group:-1003709908795:topic:4011",
        sessionId: "topic-session",
        updatedAt: 5,
        agentId: "main",
        agentLabel: "Main Agent",
        channel: "telegram",
        groupName: "AlphaClaw",
        topicName: "Rosebud",
        replyChannel: "telegram",
        replyTo: "-1003709908795:4011",
      },
    ]);
  });
});
