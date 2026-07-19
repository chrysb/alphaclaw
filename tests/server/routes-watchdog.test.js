const express = require("express");
const request = require("supertest");

const { registerWatchdogRoutes } = require("../../lib/server/routes/watchdog");

const createDeps = () => {
  const requireAuth = (req, res, next) => next();
  const watchdog = {
    getStatus: vi.fn(() => ({ lifecycle: "running", health: "healthy" })),
    triggerRepair: vi.fn(async () => ({ ok: true })),
    resumeChannels: vi.fn(async () => ({
      ok: true,
      results: [{ channel: "telegram", ok: true }],
    })),
    getSettings: vi.fn(() => ({ autoRepair: true, notificationsEnabled: true })),
    updateSettings: vi.fn(({ autoRepair }) => ({ autoRepair, notificationsEnabled: true })),
  };
  const getRecentEvents = vi.fn(() => [
    { id: 1, eventType: "crash", status: "failed" },
  ]);
  const readLogTail = vi.fn(() => "watchdog log line");
  return {
    requireAuth,
    watchdog,
    getRecentEvents,
    readLogTail,
  };
};

const createApp = (deps) => {
  const app = express();
  app.use(express.json());
  registerWatchdogRoutes({
    app,
    ...deps,
  });
  return app;
};

describe("server/routes/watchdog", () => {
  it("returns watchdog status on GET /api/watchdog/status", async () => {
    const deps = createDeps();
    const app = createApp(deps);

    const res = await request(app).get("/api/watchdog/status");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      ok: true,
      status: { lifecycle: "running", health: "healthy" },
    });
    expect(deps.watchdog.getStatus).toHaveBeenCalledTimes(1);
  });

  it("parses query params and returns events on GET /api/watchdog/events", async () => {
    const deps = createDeps();
    const app = createApp(deps);

    const res = await request(app).get("/api/watchdog/events?limit=25&includeRoutine=true");

    expect(res.status).toBe(200);
    expect(deps.getRecentEvents).toHaveBeenCalledWith({
      limit: 25,
      includeRoutine: true,
    });
    expect(res.body.ok).toBe(true);
    expect(Array.isArray(res.body.events)).toBe(true);
  });

  it("returns log tail as plain text on GET /api/watchdog/logs", async () => {
    const deps = createDeps();
    const app = createApp(deps);

    const res = await request(app).get("/api/watchdog/logs?tail=1024");

    expect(res.status).toBe(200);
    expect(deps.readLogTail).toHaveBeenCalledWith(1024);
    expect(res.text).toBe("watchdog log line");
    expect(res.headers["content-type"]).toContain("text/plain");
  });

  it("triggers repair and returns result on POST /api/watchdog/repair", async () => {
    const deps = createDeps();
    deps.watchdog.triggerRepair.mockResolvedValue({
      ok: false,
      skipped: true,
      reason: "operation_in_progress",
    });
    const app = createApp(deps);

    const res = await request(app).post("/api/watchdog/repair");

    expect(res.status).toBe(200);
    expect(deps.watchdog.triggerRepair).toHaveBeenCalledTimes(1);
    expect(res.body).toEqual({
      ok: false,
      result: {
        ok: false,
        skipped: true,
        reason: "operation_in_progress",
      },
    });
  });

  it("resumes suppressed channels on POST /api/watchdog/resume-channels", async () => {
    const deps = createDeps();
    const app = createApp(deps);

    const res = await request(app).post("/api/watchdog/resume-channels");

    expect(res.status).toBe(200);
    expect(deps.watchdog.resumeChannels).toHaveBeenCalledTimes(1);
    expect(res.body).toEqual({
      ok: true,
      result: {
        ok: true,
        results: [{ channel: "telegram", ok: true }],
      },
    });
  });

  it("returns 409 when resume-channels has nothing to resume", async () => {
    const deps = createDeps();
    deps.watchdog.resumeChannels.mockResolvedValue({
      ok: false,
      skipped: true,
      reason: "no_suppressed_channels",
    });
    const app = createApp(deps);

    const res = await request(app).post("/api/watchdog/resume-channels");

    expect(res.status).toBe(409);
    expect(res.body.ok).toBe(false);
    expect(res.body.error).toBe("no_suppressed_channels");
  });

  it("returns 400 when updateSettings throws", async () => {
    const deps = createDeps();
    deps.watchdog.updateSettings.mockImplementation(() => {
      throw new Error("Expected autoRepair and/or notificationsEnabled boolean");
    });
    const app = createApp(deps);

    const res = await request(app).put("/api/watchdog/settings").send({});

    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
    expect(res.body.error).toContain("Expected autoRepair");
  });
});
