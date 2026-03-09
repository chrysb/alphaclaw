const express = require("express");
const request = require("supertest");

const { registerAgentRoutes } = require("../../lib/server/routes/agents");

const createAgentsServiceMock = () => ({
  listAgents: vi.fn(() => [{ id: "main", name: "Main Agent", default: true }]),
  getAgent: vi.fn((id) =>
    id === "main" ? { id: "main", name: "Main Agent", default: true } : null,
  ),
  createAgent: vi.fn((input) => ({
    id: input.id,
    name: input.name || input.id,
    default: false,
  })),
  updateAgent: vi.fn((id, patch) => ({ id, ...patch })),
  deleteAgent: vi.fn(() => ({ ok: true })),
  setDefaultAgent: vi.fn((id) => ({ id, default: true })),
});

const createApp = (agentsService) => {
  const app = express();
  app.use(express.json());
  registerAgentRoutes({ app, agentsService });
  return app;
};

describe("server/routes/agents", () => {
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
});
