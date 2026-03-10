const express = require("express");
const request = require("supertest");

const { registerAgentRoutes } = require("../../lib/server/routes/agents");

const createAgentsServiceMock = () => ({
  listAgents: vi.fn(() => [{ id: "main", name: "Main Agent", default: true }]),
  listConfiguredChannelAccounts: vi.fn(() => [
    {
      channel: "telegram",
      accounts: [
        {
          id: "default",
          name: "",
          boundAgentId: "",
          paired: 0,
          status: "configured",
        },
      ],
    },
  ]),
  createChannelAccount: vi.fn((input) => ({
    channel: input.provider,
    account: {
      id: input.accountId || "default",
      name: input.name,
      envKey: "TELEGRAM_BOT_TOKEN",
    },
    binding: {
      agentId: input.agentId,
      match: {
        channel: input.provider,
        accountId: input.accountId || "default",
      },
    },
  })),
  updateChannelAccount: vi.fn((input) => ({
    channel: input.provider,
    account: {
      id: input.accountId || "default",
      name: input.name,
      boundAgentId: input.agentId,
    },
    tokenUpdated: !!String(input?.token || "").trim(),
  })),
  getChannelAccountToken: vi.fn((input) => ({
    provider: input.provider,
    accountId: input.accountId || "default",
    envKey: "TELEGRAM_BOT_TOKEN",
    token: "123:abc",
  })),
  deleteChannelAccount: vi.fn(() => ({ ok: true })),
  getAgent: vi.fn((id) =>
    id === "main" ? { id: "main", name: "Main Agent", default: true } : null,
  ),
  getAgentWorkspaceSize: vi.fn(() => ({
    workspacePath: "/tmp/openclaw/workspace",
    exists: true,
    sizeBytes: 3072,
  })),
  getBindingsForAgent: vi.fn(() => [
    { agentId: "main", match: { channel: "telegram", accountId: "default" } },
  ]),
  createAgent: vi.fn((input) => ({
    id: input.id,
    name: input.name || input.id,
    default: false,
  })),
  updateAgent: vi.fn((id, patch) => ({ id, ...patch })),
  addBinding: vi.fn((id, input) => ({ agentId: id, match: { ...input } })),
  removeBinding: vi.fn(() => ({ ok: true })),
  deleteAgent: vi.fn(() => ({ ok: true })),
  setDefaultAgent: vi.fn((id) => ({ id, default: true })),
});

const createApp = (
  agentsService,
  restartRequiredState = { markRequired: vi.fn() },
  operationEvents = null,
) => {
  const app = express();
  app.use(express.json());
  registerAgentRoutes({
    app,
    agentsService,
    restartRequiredState,
    operationEvents,
  });
  return app;
};

describe("server/routes/agents", () => {
  it("lists configured channel accounts on GET /api/channels/accounts", async () => {
    const agentsService = createAgentsServiceMock();
    const app = createApp(agentsService);

    const response = await request(app).get("/api/channels/accounts");

    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
    expect(response.body.channels).toEqual([
      {
        channel: "telegram",
        accounts: [
          {
            id: "default",
            name: "",
            boundAgentId: "",
            paired: 0,
            status: "configured",
          },
        ],
      },
    ]);
  });

  it("creates a configured channel account on POST /api/channels/accounts", async () => {
    const agentsService = createAgentsServiceMock();
    const restartRequiredState = { markRequired: vi.fn() };
    const app = createApp(agentsService, restartRequiredState);

    const response = await request(app).post("/api/channels/accounts").send({
      provider: "telegram",
      name: "Alerts",
      accountId: "alerts",
      token: "123:abc",
      agentId: "main",
    });

    expect(response.status).toBe(201);
    expect(response.body.ok).toBe(true);
    expect(response.body.restartRequired).toBeUndefined();
    expect(restartRequiredState.markRequired).not.toHaveBeenCalled();
    expect(agentsService.createChannelAccount).toHaveBeenCalledWith({
      provider: "telegram",
      name: "Alerts",
      accountId: "alerts",
      token: "123:abc",
      agentId: "main",
    });
  });

  it("starts channel create job on POST /api/channels/accounts/jobs", async () => {
    const agentsService = createAgentsServiceMock();
    const operationEvents = {
      createOperation: vi.fn(() => ({ operationId: "op-1" })),
      publish: vi.fn(),
      complete: vi.fn(),
      fail: vi.fn(),
      subscribe: vi.fn(() => true),
    };
    const app = createApp(
      agentsService,
      { markRequired: vi.fn() },
      operationEvents,
    );

    const response = await request(app)
      .post("/api/channels/accounts/jobs")
      .send({
        provider: "telegram",
        name: "Alerts",
        accountId: "alerts",
        token: "123:abc",
        agentId: "main",
      });

    expect(response.status).toBe(202);
    expect(response.body).toEqual({
      ok: true,
      operationId: "op-1",
      streamUrl: "/api/operations/op-1/events",
    });
    expect(operationEvents.createOperation).toHaveBeenCalledWith({
      type: "channel-account-create",
    });
  });

  it("streams operation events on GET /api/operations/:id/events", async () => {
    const agentsService = createAgentsServiceMock();
    const operationEvents = {
      createOperation: vi.fn(),
      publish: vi.fn(),
      complete: vi.fn(),
      fail: vi.fn(),
      subscribe: vi.fn(({ res }) => {
        res.status(200).send("ok");
        return true;
      }),
    };
    const app = createApp(
      agentsService,
      { markRequired: vi.fn() },
      operationEvents,
    );

    const response = await request(app).get("/api/operations/op-1/events");

    expect(response.status).toBe(200);
    expect(operationEvents.subscribe).toHaveBeenCalled();
  });

  it("updates a configured channel account on PUT /api/channels/accounts", async () => {
    const agentsService = createAgentsServiceMock();
    const app = createApp(agentsService);

    const response = await request(app).put("/api/channels/accounts").send({
      provider: "telegram",
      accountId: "alerts",
      name: "Alerts Bot",
      agentId: "main",
    });

    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
    expect(agentsService.updateChannelAccount).toHaveBeenCalledWith({
      provider: "telegram",
      accountId: "alerts",
      name: "Alerts Bot",
      agentId: "main",
    });
    expect(response.body.restartRequired).toBe(false);
  });

  it("marks restart required when a channel token is updated", async () => {
    const agentsService = createAgentsServiceMock();
    const restartRequiredState = { markRequired: vi.fn() };
    const app = createApp(agentsService, restartRequiredState);

    const response = await request(app).put("/api/channels/accounts").send({
      provider: "telegram",
      accountId: "alerts",
      name: "Alerts Bot",
      agentId: "main",
      token: "new-token",
    });

    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
    expect(response.body.restartRequired).toBe(true);
    expect(restartRequiredState.markRequired).toHaveBeenCalledWith(
      "channel_token_updated",
    );
  });

  it("loads a channel account token on GET /api/channels/accounts/token", async () => {
    const agentsService = createAgentsServiceMock();
    const app = createApp(agentsService);

    const response = await request(app).get(
      "/api/channels/accounts/token?provider=telegram&accountId=default",
    );

    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
    expect(response.body.token).toBe("123:abc");
    expect(agentsService.getChannelAccountToken).toHaveBeenCalledWith({
      provider: "telegram",
      accountId: "default",
    });
  });

  it("deletes a configured channel account on DELETE /api/channels/accounts", async () => {
    const agentsService = createAgentsServiceMock();
    const app = createApp(agentsService);

    const response = await request(app).delete("/api/channels/accounts").send({
      provider: "telegram",
      accountId: "alerts",
    });

    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
    expect(agentsService.deleteChannelAccount).toHaveBeenCalledWith({
      provider: "telegram",
      accountId: "alerts",
    });
  });

  it("lists agents on GET /api/agents", async () => {
    const agentsService = createAgentsServiceMock();
    const app = createApp(agentsService);

    const response = await request(app).get("/api/agents");

    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
    expect(response.body.agents).toEqual([
      { id: "main", name: "Main Agent", default: true },
    ]);
  });

  it("creates an agent on POST /api/agents", async () => {
    const agentsService = createAgentsServiceMock();
    const app = createApp(agentsService);

    const response = await request(app).post("/api/agents").send({
      id: "ops",
      name: "Ops Agent",
    });

    expect(response.status).toBe(201);
    expect(response.body.ok).toBe(true);
    expect(agentsService.createAgent).toHaveBeenCalledWith({
      id: "ops",
      name: "Ops Agent",
    });
  });

  it("loads workspace size on GET /api/agents/:id/workspace-size", async () => {
    const agentsService = createAgentsServiceMock();
    const app = createApp(agentsService);

    const response = await request(app).get("/api/agents/main/workspace-size");

    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
    expect(response.body.sizeBytes).toBe(3072);
    expect(agentsService.getAgentWorkspaceSize).toHaveBeenCalledWith("main");
  });

  it("returns 409 for duplicate agent ids", async () => {
    const agentsService = createAgentsServiceMock();
    agentsService.createAgent.mockImplementation(() => {
      throw new Error('Agent "ops" already exists');
    });
    const app = createApp(agentsService);

    const response = await request(app).post("/api/agents").send({ id: "ops" });

    expect(response.status).toBe(409);
    expect(response.body.ok).toBe(false);
  });

  it("sets default agent on POST /api/agents/:id/default", async () => {
    const agentsService = createAgentsServiceMock();
    const app = createApp(agentsService);

    const response = await request(app).post("/api/agents/ops/default");

    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
    expect(agentsService.setDefaultAgent).toHaveBeenCalledWith("ops");
  });

  it("lists bindings on GET /api/agents/:id/bindings", async () => {
    const agentsService = createAgentsServiceMock();
    const app = createApp(agentsService);

    const response = await request(app).get("/api/agents/main/bindings");

    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
    expect(response.body.bindings).toEqual([
      { agentId: "main", match: { channel: "telegram", accountId: "default" } },
    ]);
  });

  it("adds bindings on POST /api/agents/:id/bindings", async () => {
    const agentsService = createAgentsServiceMock();
    const app = createApp(agentsService);

    const response = await request(app).post("/api/agents/main/bindings").send({
      channel: "telegram",
      accountId: "default",
    });

    expect(response.status).toBe(201);
    expect(response.body.ok).toBe(true);
    expect(agentsService.addBinding).toHaveBeenCalledWith("main", {
      channel: "telegram",
      accountId: "default",
    });
  });

  it("removes bindings on DELETE /api/agents/:id/bindings", async () => {
    const agentsService = createAgentsServiceMock();
    const app = createApp(agentsService);

    const response = await request(app)
      .delete("/api/agents/main/bindings")
      .send({
        channel: "telegram",
        accountId: "default",
      });

    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
    expect(agentsService.removeBinding).toHaveBeenCalledWith("main", {
      channel: "telegram",
      accountId: "default",
    });
  });
});
