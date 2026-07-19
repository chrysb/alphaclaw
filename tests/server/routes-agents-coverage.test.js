const express = require("express");
const request = require("supertest");

const { registerAgentRoutes } = require("../../lib/server/routes/agents");

const createAgentsServiceMock = () => ({
  listAgents: vi.fn(() => []),
  listConfiguredChannelAccounts: vi.fn(() => []),
  getAgentDefaults: vi.fn(() => ({ thinkingDefault: null })),
  createChannelAccount: vi.fn(async () => ({ channel: "telegram" })),
  updateChannelAccount: vi.fn(() => ({ tokenUpdated: false })),
  getChannelAccountToken: vi.fn(() => ({ token: "t" })),
  deleteChannelAccount: vi.fn(async () => ({ ok: true })),
  runChannelAccountLogin: vi.fn(async () => ({ ok: true })),
  getChannelAccountLoginStatus: vi.fn(() => ({ linked: false })),
  getAgent: vi.fn(() => ({ id: "main" })),
  getAgentWorkspaceSize: vi.fn(() => ({ sizeBytes: 0 })),
  getBindingsForAgent: vi.fn(() => []),
  createAgent: vi.fn(() => ({ id: "ops" })),
  updateAgent: vi.fn(() => ({ id: "main" })),
  addBinding: vi.fn(() => ({})),
  removeBinding: vi.fn(() => ({ ok: true })),
  deleteAgent: vi.fn(() => ({ ok: true })),
  setDefaultAgent: vi.fn(() => ({ id: "ops", default: true })),
});

const createApp = (agentsService, operationEvents = null) => {
  const app = express();
  app.use(express.json());
  registerAgentRoutes({
    app,
    agentsService,
    restartRequiredState: { markRequired: vi.fn() },
    operationEvents,
  });
  return app;
};

describe("server/routes/agents coverage", () => {
  it("returns 500 when listing channel accounts fails", async () => {
    const agentsService = createAgentsServiceMock();
    agentsService.listConfiguredChannelAccounts.mockImplementation(() => {
      throw new Error("channels exploded");
    });
    const app = createApp(agentsService);

    const res = await request(app).get("/api/channels/accounts");

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ ok: false, error: "channels exploded" });
  });

  it("maps channel token lookup failures to 404 or 400", async () => {
    const agentsService = createAgentsServiceMock();
    agentsService.getChannelAccountToken.mockImplementation(() => {
      throw new Error('Channel account "telegram/ghost" not found');
    });
    const app = createApp(agentsService);

    const missing = await request(app).get(
      "/api/channels/accounts/token?provider=telegram&accountId=ghost",
    );
    expect(missing.status).toBe(404);
    expect(missing.body.ok).toBe(false);

    agentsService.getChannelAccountToken.mockImplementation(() => {
      throw new Error('Unsupported channel provider "smoke"');
    });
    const invalid = await request(app).get(
      "/api/channels/accounts/token?provider=smoke",
    );
    expect(invalid.status).toBe(400);
    expect(invalid.body.ok).toBe(false);
  });

  it("maps channel account creation failures to specific statuses", async () => {
    const agentsService = createAgentsServiceMock();
    const app = createApp(agentsService);
    const cases = [
      ['Channel account "telegram/default" already exists', 409],
      ['Binding already assigned to agent "other"', 409],
      ['Agent "ghost" not found', 404],
      ["Channel token is required", 400],
    ];

    for (const [message, expectedStatus] of cases) {
      agentsService.createChannelAccount.mockRejectedValueOnce(
        new Error(message),
      );
      const res = await request(app)
        .post("/api/channels/accounts")
        .send({ provider: "telegram" });
      expect(res.status).toBe(expectedStatus);
      expect(res.body).toEqual({ ok: false, error: message });
    }
  });

  it("returns 503 for channel jobs and event streams without operation events", async () => {
    const app = createApp(createAgentsServiceMock());

    const jobs = await request(app)
      .post("/api/channels/accounts/jobs")
      .send({ provider: "telegram" });
    expect(jobs.status).toBe(503);
    expect(jobs.body).toEqual({ ok: false, error: "Operation events unavailable" });

    const events = await request(app).get("/api/operations/op-1/events");
    expect(events.status).toBe(503);
    expect(events.body).toEqual({ ok: false, error: "Operation events unavailable" });
  });

  it("publishes progress phases and completes channel account jobs", async () => {
    const agentsService = createAgentsServiceMock();
    agentsService.createChannelAccount.mockImplementation(
      async (body, { onProgress } = {}) => {
        onProgress({ phase: "configuring", label: "Configuring..." });
        onProgress();
        return { channel: "telegram" };
      },
    );
    const operationEvents = {
      createOperation: vi.fn(() => ({ operationId: "op-2" })),
      publish: vi.fn(),
      complete: vi.fn(),
      fail: vi.fn(),
      subscribe: vi.fn(() => true),
    };
    const app = createApp(agentsService, operationEvents);

    const res = await request(app)
      .post("/api/channels/accounts/jobs")
      .send({ provider: "telegram", agentId: "main" });

    expect(res.status).toBe(202);
    await vi.waitFor(() => expect(operationEvents.complete).toHaveBeenCalled());
    expect(operationEvents.publish).toHaveBeenCalledWith("op-2", {
      event: "phase",
      data: { phase: "configuring", label: "Configuring..." },
    });
    expect(operationEvents.publish).toHaveBeenCalledWith("op-2", {
      event: "phase",
      data: { phase: "", label: "" },
    });
    expect(operationEvents.complete).toHaveBeenCalledWith("op-2", {
      ok: true,
      channel: "telegram",
    });
  });

  it("fails the operation when channel account job creation throws", async () => {
    const agentsService = createAgentsServiceMock();
    const error = new Error("create failed");
    agentsService.createChannelAccount.mockRejectedValue(error);
    const operationEvents = {
      createOperation: vi.fn(() => ({ operationId: "op-3" })),
      publish: vi.fn(),
      complete: vi.fn(),
      fail: vi.fn(),
      subscribe: vi.fn(() => true),
    };
    const app = createApp(agentsService, operationEvents);

    const res = await request(app)
      .post("/api/channels/accounts/jobs")
      .send({ provider: "telegram" });

    expect(res.status).toBe(202);
    await vi.waitFor(() => expect(operationEvents.fail).toHaveBeenCalled());
    expect(operationEvents.fail).toHaveBeenCalledWith("op-3", error);
  });

  it("returns 404 when subscribing to an unknown operation", async () => {
    const operationEvents = {
      createOperation: vi.fn(() => ({ operationId: "op-4" })),
      publish: vi.fn(),
      complete: vi.fn(),
      fail: vi.fn(),
      subscribe: vi.fn(() => false),
    };
    const app = createApp(createAgentsServiceMock(), operationEvents);

    const res = await request(app).get("/api/operations/missing/events");

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ ok: false, error: "Operation not found" });
  });

  it("maps channel account update failures to 404 or 400", async () => {
    const agentsService = createAgentsServiceMock();
    const app = createApp(agentsService);

    agentsService.updateChannelAccount.mockImplementation(() => {
      throw new Error('Channel "telegram" not found');
    });
    const missing = await request(app)
      .put("/api/channels/accounts")
      .send({ provider: "telegram" });
    expect(missing.status).toBe(404);

    agentsService.updateChannelAccount.mockImplementation(() => {
      throw new Error("Channel name is required");
    });
    const invalid = await request(app)
      .put("/api/channels/accounts")
      .send({ provider: "telegram" });
    expect(invalid.status).toBe(400);
  });

  it("maps login-status failures to 400 or 500", async () => {
    const agentsService = createAgentsServiceMock();
    const app = createApp(agentsService);

    agentsService.getChannelAccountLoginStatus.mockImplementation(() => {
      throw new Error(
        "Channel login status is currently only supported for WhatsApp",
      );
    });
    const unsupported = await request(app).get(
      "/api/channels/accounts/login-status?provider=telegram",
    );
    expect(unsupported.status).toBe(400);

    agentsService.getChannelAccountLoginStatus.mockImplementation(() => {
      throw new Error("credentials unreadable");
    });
    const broken = await request(app).get(
      "/api/channels/accounts/login-status?provider=whatsapp",
    );
    expect(broken.status).toBe(500);
  });

  it("maps login failures without provider hints to 500", async () => {
    const agentsService = createAgentsServiceMock();
    agentsService.runChannelAccountLogin.mockRejectedValue(
      new Error("login process crashed"),
    );
    const app = createApp(agentsService);

    const res = await request(app)
      .post("/api/channels/accounts/login")
      .send({ provider: "whatsapp" });

    expect(res.status).toBe(500);
    expect(res.body.ok).toBe(false);
  });

  it("maps channel account deletion failures to 404 or 400", async () => {
    const agentsService = createAgentsServiceMock();
    const app = createApp(agentsService);

    agentsService.deleteChannelAccount.mockRejectedValue(
      new Error('Channel "telegram" not found'),
    );
    const missing = await request(app)
      .delete("/api/channels/accounts")
      .send({ provider: "telegram" });
    expect(missing.status).toBe(404);

    agentsService.deleteChannelAccount.mockRejectedValue(
      new Error("Could not delete channel account"),
    );
    const failed = await request(app)
      .delete("/api/channels/accounts")
      .send({ provider: "telegram" });
    expect(failed.status).toBe(400);
  });

  it("returns 500 when listing agents fails", async () => {
    const agentsService = createAgentsServiceMock();
    agentsService.listAgents.mockImplementation(() => {
      throw new Error("agents exploded");
    });
    const app = createApp(agentsService);

    const res = await request(app).get("/api/agents");

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ ok: false, error: "agents exploded" });
  });

  it("returns 500 when loading a single agent fails", async () => {
    const agentsService = createAgentsServiceMock();
    agentsService.getAgent.mockImplementation(() => {
      throw new Error("agent load failed");
    });
    const app = createApp(agentsService);

    const res = await request(app).get("/api/agents/main");

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ ok: false, error: "agent load failed" });
  });

  it("maps workspace size failures to 404 or 500", async () => {
    const agentsService = createAgentsServiceMock();
    const app = createApp(agentsService);

    agentsService.getAgentWorkspaceSize.mockImplementation(() => {
      throw new Error('Agent "ghost" not found');
    });
    const missing = await request(app).get("/api/agents/ghost/workspace-size");
    expect(missing.status).toBe(404);

    agentsService.getAgentWorkspaceSize.mockImplementation(() => {
      throw new Error("stat failed");
    });
    const failed = await request(app).get("/api/agents/main/workspace-size");
    expect(failed.status).toBe(500);
  });

  it("returns 404 and 500 for binding list failures", async () => {
    const agentsService = createAgentsServiceMock();
    const app = createApp(agentsService);

    agentsService.getAgent.mockReturnValueOnce(null);
    const missing = await request(app).get("/api/agents/ghost/bindings");
    expect(missing.status).toBe(404);
    expect(missing.body).toEqual({ ok: false, error: "Agent not found" });

    agentsService.getBindingsForAgent.mockImplementation(() => {
      throw new Error("bindings unreadable");
    });
    const failed = await request(app).get("/api/agents/main/bindings");
    expect(failed.status).toBe(500);
    expect(failed.body).toEqual({ ok: false, error: "bindings unreadable" });
  });

  it("requires an id when creating agents", async () => {
    const agentsService = createAgentsServiceMock();
    const app = createApp(agentsService);

    const res = await request(app).post("/api/agents").send({ id: "  " });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ ok: false, error: "id is required" });
    expect(agentsService.createAgent).not.toHaveBeenCalled();
  });

  it("maps binding creation failures to 404, 409, or 400", async () => {
    const agentsService = createAgentsServiceMock();
    const app = createApp(agentsService);
    const cases = [
      ['Agent "ghost" not found', 404],
      ['Binding already assigned to agent "other"', 409],
      ["Binding channel is required", 400],
    ];

    for (const [message, expectedStatus] of cases) {
      agentsService.addBinding.mockImplementationOnce(() => {
        throw new Error(message);
      });
      const res = await request(app)
        .post("/api/agents/main/bindings")
        .send({ channel: "telegram" });
      expect(res.status).toBe(expectedStatus);
      expect(res.body).toEqual({ ok: false, error: message });
    }
  });

  it("maps binding removal failures to 404 or 400", async () => {
    const agentsService = createAgentsServiceMock();
    const app = createApp(agentsService);

    agentsService.removeBinding.mockImplementation(() => {
      throw new Error("Binding not found");
    });
    const missing = await request(app)
      .delete("/api/agents/main/bindings")
      .send({ channel: "telegram" });
    expect(missing.status).toBe(404);

    agentsService.removeBinding.mockImplementation(() => {
      throw new Error("Binding channel is required");
    });
    const invalid = await request(app)
      .delete("/api/agents/main/bindings")
      .send({});
    expect(invalid.status).toBe(400);
  });

  it("maps agent deletion failures to 404", async () => {
    const agentsService = createAgentsServiceMock();
    agentsService.deleteAgent.mockImplementation(() => {
      throw new Error('Agent "ghost" not found');
    });
    const app = createApp(agentsService);

    const res = await request(app).delete("/api/agents/ghost");

    expect(res.status).toBe(404);
    expect(res.body.ok).toBe(false);
  });

  it("maps default agent selection failures to 404 or 400", async () => {
    const agentsService = createAgentsServiceMock();
    const app = createApp(agentsService);

    agentsService.setDefaultAgent.mockImplementation(() => {
      throw new Error('Agent "ghost" not found');
    });
    const missing = await request(app).post("/api/agents/ghost/default");
    expect(missing.status).toBe(404);

    agentsService.setDefaultAgent.mockImplementation(() => {
      throw new Error("config write failed");
    });
    const failed = await request(app).post("/api/agents/main/default");
    expect(failed.status).toBe(400);
  });
});
