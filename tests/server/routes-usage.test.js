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
    {
      sessionId: "agent:main:hook:10bded75-e18b-4d0c-823f-99f296b4eedb",
      sessionKey: "agent:main:hook:10bded75-e18b-4d0c-823f-99f296b4eedb",
      totalTokens: 640,
      totalCost: 0.0064,
      lastActivityMs: 1730000002000,
    },
    {
      sessionId: "agent:main:hook:gmail:19cb6d04b",
      sessionKey: "agent:main:hook:gmail:19cb6d04b",
      totalTokens: 450,
      totalCost: 0.0045,
      lastActivityMs: 1730000003000,
    },
    {
      sessionId: "agent:main:cron:system-sync",
      sessionKey: "agent:main:cron:system-sync",
      totalTokens: 320,
      totalCost: 0.0032,
      lastActivityMs: 1730000004000,
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
    expect(deps.getDailySummary).toHaveBeenCalledWith(
      expect.objectContaining({ days: 30 }),
    );
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
    expect(response.body.sessions[2].labels).toEqual([
      { label: "Main", tone: "cyan" },
      { label: "Hook", tone: "purple" },
    ]);
    expect(response.body.sessions[3].labels).toEqual([
      { label: "Main", tone: "cyan" },
      { label: "Hook", tone: "purple" },
      { label: "Gmail", tone: "gray" },
    ]);
    expect(response.body.sessions[4].labels).toEqual([
      { label: "Main", tone: "cyan" },
      { label: "Cron", tone: "blue" },
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

  it("returns enriched session detail when found", async () => {
    const deps = createDeps();
    const app = createApp(deps);

    const response = await request(app).get(
      "/api/usage/sessions/agent%3Amain%3Acron%3Async",
    );

    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
    expect(deps.getSessionDetail).toHaveBeenCalledWith({
      sessionId: "agent:main:cron:sync",
    });
    expect(response.body.detail.sessionId).toBe("agent:main:cron:sync");
    expect(response.body.detail.labels).toEqual([
      { label: "Main", tone: "cyan" },
      { label: "Cron", tone: "blue" },
    ]);
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

  it("passes the client time zone header through to the summary", async () => {
    const deps = createDeps();
    const app = createApp(deps);

    const response = await request(app)
      .get("/api/usage/summary?days=14")
      .set("x-client-timezone", "America/New_York");

    expect(response.status).toBe(200);
    expect(deps.getDailySummary).toHaveBeenCalledWith({
      days: 14,
      timeZone: "America/New_York",
    });
  });

  it("labels non-direct, non-group telegram channels and falls back on unknown sessions", async () => {
    const deps = createDeps();
    deps.getSessionsList = vi.fn(() => [
      {
        sessionId: "agent:main:telegram:channel:987",
        sessionKey: "agent:main:telegram:channel:987",
      },
      { sessionId: "", sessionKey: "" },
      { sessionId: "opaque-session", sessionKey: "opaque-session" },
      {
        sessionId: "agent:main:telegram:group:-42:topic:7",
        sessionKey: "agent:main:telegram:group:-42:topic:7",
      },
    ]);
    vi.spyOn(topicRegistry, "getGroup").mockImplementation(() => {
      throw new Error("registry unavailable");
    });
    const app = createApp(deps);

    const response = await request(app).get("/api/usage/sessions");

    expect(response.status).toBe(200);
    expect(response.body.sessions[0].labels).toEqual([
      { label: "Main", tone: "cyan" },
      { label: "Telegram Channel", tone: "blue" },
    ]);
    expect(response.body.sessions[1].labels).toBeNull();
    expect(response.body.sessions[2].labels).toBeNull();
    // Registry failures fall back to raw group/topic ids.
    expect(response.body.sessions[3].labels).toEqual([
      { label: "Main", tone: "cyan" },
      { label: "Group -42", tone: "purple" },
      { label: "Topic 7", tone: "gray" },
    ]);
  });

  it("returns 500 with the error message when summary generation fails", async () => {
    const deps = createDeps();
    deps.getDailySummary = vi.fn(() => {
      throw new Error("summary exploded");
    });
    const app = createApp(deps);

    const response = await request(app).get("/api/usage/summary");

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ ok: false, error: "summary exploded" });
  });

  it("returns 500 when the sessions list fails", async () => {
    const deps = createDeps();
    deps.getSessionsList = vi.fn(() => {
      throw new Error("sessions exploded");
    });
    const app = createApp(deps);

    const response = await request(app).get("/api/usage/sessions");

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ ok: false, error: "sessions exploded" });
  });

  it("returns 500 when session detail lookup fails", async () => {
    const deps = createDeps();
    deps.getSessionDetail = vi.fn(() => {
      throw new Error("detail exploded");
    });
    const app = createApp(deps);

    const response = await request(app).get("/api/usage/sessions/broken");

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ ok: false, error: "detail exploded" });
  });

  it("returns 500 when session time series lookup fails", async () => {
    const deps = createDeps();
    deps.getSessionTimeSeries = vi.fn(() => {
      throw new Error("series exploded");
    });
    const app = createApp(deps);

    const response = await request(app).get("/api/usage/sessions/broken/timeseries");

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ ok: false, error: "series exploded" });
  });
});
