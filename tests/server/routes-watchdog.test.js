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
  const watchdogNotifier = {
    notify: vi.fn(async () => ({ ok: true, sent: 1 })),
  };
  const watchdogTerminal = {
    createOrReuseSession: vi.fn(() => ({ sessionId: "term-1", reused: false })),
    readOutput: vi.fn(() => ({ found: true, output: "shell out", cursor: 9 })),
    writeInput: vi.fn(() => ({ ok: true })),
    closeSession: vi.fn(),
  };
  return {
    requireAuth,
    watchdog,
    getRecentEvents,
    readLogTail,
    watchdogNotifier,
    watchdogTerminal,
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

  it("updates settings on PUT /api/watchdog/settings", async () => {
    const deps = createDeps();
    const app = createApp(deps);

    const res = await request(app)
      .put("/api/watchdog/settings")
      .send({ autoRepair: false });

    expect(res.status).toBe(200);
    expect(deps.watchdog.updateSettings).toHaveBeenCalledWith({
      autoRepair: false,
    });
    expect(res.body).toEqual({
      ok: true,
      settings: { autoRepair: false, notificationsEnabled: true },
    });
  });

  it("returns 500 when getStatus throws on GET /api/watchdog/status", async () => {
    const deps = createDeps();
    deps.watchdog.getStatus.mockImplementation(() => {
      throw new Error("status unavailable");
    });
    const app = createApp(deps);

    const res = await request(app).get("/api/watchdog/status");

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ ok: false, error: "status unavailable" });
  });

  it("uses default query params and supports includeRoutine=1 on GET /api/watchdog/events", async () => {
    const deps = createDeps();
    const app = createApp(deps);

    const defaultsRes = await request(app).get("/api/watchdog/events");
    expect(defaultsRes.status).toBe(200);
    expect(deps.getRecentEvents).toHaveBeenCalledWith({
      limit: 20,
      includeRoutine: false,
    });

    const numericRes = await request(app).get("/api/watchdog/events?includeRoutine=1");
    expect(numericRes.status).toBe(200);
    expect(deps.getRecentEvents).toHaveBeenLastCalledWith({
      limit: 20,
      includeRoutine: true,
    });
  });

  it("returns 500 when getRecentEvents throws", async () => {
    const deps = createDeps();
    deps.getRecentEvents.mockImplementation(() => {
      throw new Error("db is closed");
    });
    const app = createApp(deps);

    const res = await request(app).get("/api/watchdog/events");

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ ok: false, error: "db is closed" });
  });

  it("uses the default tail size and returns 500 on log read failure", async () => {
    const deps = createDeps();
    const app = createApp(deps);

    const okRes = await request(app).get("/api/watchdog/logs");
    expect(okRes.status).toBe(200);
    expect(deps.readLogTail).toHaveBeenCalledWith(65536);

    deps.readLogTail.mockImplementation(() => {
      throw new Error("log file missing");
    });
    const errRes = await request(app).get("/api/watchdog/logs");
    expect(errRes.status).toBe(500);
    expect(errRes.body).toEqual({ ok: false, error: "log file missing" });
  });

  it("returns 500 when triggerRepair rejects", async () => {
    const deps = createDeps();
    deps.watchdog.triggerRepair.mockRejectedValue(new Error("repair exploded"));
    const app = createApp(deps);

    const res = await request(app).post("/api/watchdog/repair");

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ ok: false, error: "repair exploded" });
  });

  it("returns 500 when resumeChannels rejects", async () => {
    const deps = createDeps();
    deps.watchdog.resumeChannels.mockRejectedValue(new Error("resume exploded"));
    const app = createApp(deps);

    const res = await request(app).post("/api/watchdog/resume-channels");

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ ok: false, error: "resume exploded" });
  });

  it("returns settings on GET /api/watchdog/settings and 500 on failure", async () => {
    const deps = createDeps();
    const app = createApp(deps);

    const okRes = await request(app).get("/api/watchdog/settings");
    expect(okRes.status).toBe(200);
    expect(okRes.body).toEqual({
      ok: true,
      settings: { autoRepair: true, notificationsEnabled: true },
    });

    deps.watchdog.getSettings.mockImplementation(() => {
      throw new Error("settings unavailable");
    });
    const errRes = await request(app).get("/api/watchdog/settings");
    expect(errRes.status).toBe(500);
    expect(errRes.body).toEqual({ ok: false, error: "settings unavailable" });
  });

  it("returns live system resources on GET /api/watchdog/resources", async () => {
    const deps = createDeps();
    deps.watchdog.getStatus.mockReturnValue({
      lifecycle: "running",
      gatewayPid: null,
    });
    const app = createApp(deps);

    const res = await request(app).get("/api/watchdog/resources");

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.resources).toEqual(
      expect.objectContaining({
        memory: expect.objectContaining({ usedBytes: expect.any(Number) }),
        cpu: expect.objectContaining({ hostCores: expect.any(Number) }),
        processes: expect.objectContaining({
          gateway: expect.objectContaining({ pid: null }),
        }),
      }),
    );
  });

  it("returns 500 when resource lookup fails", async () => {
    const deps = createDeps();
    deps.watchdog.getStatus.mockImplementation(() => {
      throw new Error("no status for resources");
    });
    const app = createApp(deps);

    const res = await request(app).get("/api/watchdog/resources");

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ ok: false, error: "no status for resources" });
  });

  it("sends a test notification on POST /api/watchdog/test-notification", async () => {
    const deps = createDeps();
    const app = createApp(deps);

    const res = await request(app).post("/api/watchdog/test-notification");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true, result: { ok: true, sent: 1 } });
    expect(deps.watchdogNotifier.notify).toHaveBeenCalledWith(
      expect.stringContaining("test notification"),
    );
  });

  it("returns 503 when the notifier is unavailable", async () => {
    const deps = createDeps();
    deps.watchdogNotifier = null;
    const app = createApp(deps);

    const res = await request(app).post("/api/watchdog/test-notification");

    expect(res.status).toBe(503);
    expect(res.body).toEqual({ ok: false, error: "Notifier not available" });
  });

  it("returns 500 when the test notification fails", async () => {
    const deps = createDeps();
    deps.watchdogNotifier.notify.mockRejectedValue(new Error("send failed"));
    const app = createApp(deps);

    const res = await request(app).post("/api/watchdog/test-notification");

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ ok: false, error: "send failed" });
  });

  it("creates a terminal session on POST /api/watchdog/terminal/session", async () => {
    const deps = createDeps();
    const app = createApp(deps);

    const res = await request(app).post("/api/watchdog/terminal/session");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      ok: true,
      session: { sessionId: "term-1", reused: false },
    });
  });

  it("returns 500 when creating a terminal session fails", async () => {
    const deps = createDeps();
    deps.watchdogTerminal.createOrReuseSession.mockImplementation(() => {
      throw new Error("pty spawn failed");
    });
    const app = createApp(deps);

    const res = await request(app).post("/api/watchdog/terminal/session");

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ ok: false, error: "pty spawn failed" });
  });

  it("reads terminal output with cursor parsing on GET /api/watchdog/terminal/output", async () => {
    const deps = createDeps();
    const app = createApp(deps);

    const res = await request(app).get(
      "/api/watchdog/terminal/output?sessionId=term-1&cursor=4",
    );

    expect(res.status).toBe(200);
    expect(deps.watchdogTerminal.readOutput).toHaveBeenCalledWith({
      sessionId: "term-1",
      cursor: 4,
    });
    expect(res.body).toEqual({
      ok: true,
      found: true,
      output: "shell out",
      cursor: 9,
    });
  });

  it("validates terminal output requests", async () => {
    const deps = createDeps();
    deps.watchdogTerminal.readOutput.mockReturnValue({ found: false });
    const app = createApp(deps);

    const missingRes = await request(app).get("/api/watchdog/terminal/output");
    expect(missingRes.status).toBe(400);
    expect(missingRes.body).toEqual({ ok: false, error: "Missing sessionId" });

    const notFoundRes = await request(app).get(
      "/api/watchdog/terminal/output?sessionId=stale",
    );
    expect(notFoundRes.status).toBe(404);
    expect(notFoundRes.body).toEqual({
      ok: false,
      error: "Terminal session not found",
    });

    deps.watchdogTerminal.readOutput.mockImplementation(() => {
      throw new Error("output read failed");
    });
    const errRes = await request(app).get(
      "/api/watchdog/terminal/output?sessionId=term-1",
    );
    expect(errRes.status).toBe(500);
    expect(errRes.body).toEqual({ ok: false, error: "output read failed" });
  });

  it("writes terminal input on POST /api/watchdog/terminal/input", async () => {
    const deps = createDeps();
    const app = createApp(deps);

    const res = await request(app)
      .post("/api/watchdog/terminal/input")
      .send({ sessionId: "term-1", input: "ls\n" });

    expect(res.status).toBe(200);
    expect(deps.watchdogTerminal.writeInput).toHaveBeenCalledWith({
      sessionId: "term-1",
      input: "ls\n",
    });
    expect(res.body).toEqual({ ok: true });
  });

  it("validates terminal input requests", async () => {
    const deps = createDeps();
    const app = createApp(deps);

    const missingRes = await request(app)
      .post("/api/watchdog/terminal/input")
      .send({ input: "ls\n" });
    expect(missingRes.status).toBe(400);
    expect(missingRes.body).toEqual({ ok: false, error: "Missing sessionId" });

    deps.watchdogTerminal.writeInput.mockReturnValue({ ok: false });
    const failedRes = await request(app)
      .post("/api/watchdog/terminal/input")
      .send({ sessionId: "term-1", input: "ls\n" });
    expect(failedRes.status).toBe(400);
    expect(failedRes.body).toEqual({ ok: false, error: "Write failed" });

    deps.watchdogTerminal.writeInput.mockImplementation(() => {
      throw new Error("stdin closed");
    });
    const errRes = await request(app)
      .post("/api/watchdog/terminal/input")
      .send({ sessionId: "term-1", input: "ls\n" });
    expect(errRes.status).toBe(500);
    expect(errRes.body).toEqual({ ok: false, error: "stdin closed" });
  });

  it("closes terminal sessions on POST /api/watchdog/terminal/close", async () => {
    const deps = createDeps();
    const app = createApp(deps);

    const missingRes = await request(app)
      .post("/api/watchdog/terminal/close")
      .send({});
    expect(missingRes.status).toBe(400);
    expect(missingRes.body).toEqual({ ok: false, error: "Missing sessionId" });

    const okRes = await request(app)
      .post("/api/watchdog/terminal/close")
      .send({ sessionId: "term-1" });
    expect(okRes.status).toBe(200);
    expect(okRes.body).toEqual({ ok: true });
    expect(deps.watchdogTerminal.closeSession).toHaveBeenCalledWith({
      sessionId: "term-1",
    });

    deps.watchdogTerminal.closeSession.mockImplementation(() => {
      throw new Error("close failed");
    });
    const errRes = await request(app)
      .post("/api/watchdog/terminal/close")
      .send({ sessionId: "term-1" });
    expect(errRes.status).toBe(500);
    expect(errRes.body).toEqual({ ok: false, error: "close failed" });
  });
});
