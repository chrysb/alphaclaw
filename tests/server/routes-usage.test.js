const express = require("express");
const request = require("supertest");

const topicRegistry = require("../../lib/server/topic-registry");
const { registerUsageRoutes } = require("../../lib/server/routes/usage");

const createDeps = () => ({
  requireAuth: (req, res, next) => next(),
  getDailySummary: vi.fn(() => ({ daily: [], totals: {} })),
  getSessionsList: vi.fn(() => [
    {
      sessionId: "agent:main:telegram:group:-1003832123427:topic:182",
      sessionKey: "agent:main:telegram:group:-1003832123427:topic:182",
      totalTokens: 1200,
      totalCost: 0.012,
      lastActivityMs: 1730000000000,
    },
    {
      sessionId: "agent:main:telegram:direct:1050628644",
      sessionKey: "agent:main:telegram:direct:1050628644",
      totalTokens: 800,
      totalCost: 0.008,
      lastActivityMs: 1730000001000,
    },
  ]),
  getSessionDetail: vi.fn(({ sessionId }) =>
    sessionId === "missing"
      ? null
      : ({
          sessionId,
          sessionKey: sessionId,
          modelBreakdown: [],
          toolUsage: [],
        })),
  getSessionTimeSeries: vi.fn(() => ({ sessionId: "abc", points: [] })),
});

const createApp = (deps) => {
  const app = express();
  app.use(express.json());
  registerUsageRoutes({
    app,
    ...deps,
  });
  return app;
};

describe("server/routes/usage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("caches summary payloads by days", async () => {
    const deps = createDeps();
    const app = createApp(deps);

    const firstResponse = await request(app).get("/api/usage/summary?days=30");
    const secondResponse = await request(app).get("/api/usage/summary?days=30");

    expect(firstResponse.status).toBe(200);
    expect(firstResponse.body.ok).toBe(true);
    expect(firstResponse.body.cached).toBe(false);
    expect(secondResponse.status).toBe(200);
    expect(secondResponse.body.cached).toBe(true);
    expect(deps.getDailySummary).toHaveBeenCalledTimes(1);
    expect(deps.getDailySummary).toHaveBeenCalledWith({ days: 30 });
  });

  it("returns sessions with resolved labels on GET /api/usage/sessions", async () => {
    const deps = createDeps();
    vi.spyOn(topicRegistry, "getGroup").mockReturnValue({
      name: "Workspace Name",
      topics: {
        "182": { name: "Topic Name" },
      },
    });
    const app = createApp(deps);

    const response = await request(app).get("/api/usage/sessions?limit=25");

    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
    expect(deps.getSessionsList).toHaveBeenCalledWith({ limit: 25 });
    expect(response.body.sessions[0].labels).toEqual([
      { label: "Main", tone: "cyan" },
      { label: "Workspace Name", tone: "purple" },
      { label: "Topic Name", tone: "gray" },
    ]);
    expect(response.body.sessions[1].labels).toEqual([
      { label: "Main", tone: "cyan" },
      { label: "Telegram Direct", tone: "blue" },
    ]);
  });

  it("returns 404 when session detail is missing", async () => {
    const deps = createDeps();
    const app = createApp(deps);

    const response = await request(app).get("/api/usage/sessions/missing");

    expect(response.status).toBe(404);
    expect(response.body.ok).toBe(false);
    expect(response.body.error).toBe("Session not found");
  });

  it("parses maxPoints for session time series endpoint", async () => {
    const deps = createDeps();
    const app = createApp(deps);

    const response = await request(app).get("/api/usage/sessions/abc/timeseries?maxPoints=200");

    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
    expect(deps.getSessionTimeSeries).toHaveBeenCalledWith({
      sessionId: "abc",
      maxPoints: 200,
    });
  });
});
