const express = require("express");
const request = require("supertest");

const { registerWatchdogRoutes } = require("../../lib/server/routes/watchdog");

const createDeps = (overrides = {}) => {
  const requireAuth = (req, res, next) => next();
  const watchdog = {
    getStatus: vi.fn(() => ({ lifecycle: "running", health: "healthy" })),
    triggerRepair: vi.fn(async () => ({ ok: true })),
    getSettings: vi.fn(() => ({ autoRepair: true, notificationsEnabled: true })),
    updateSettings: vi.fn(({ autoRepair }) => ({ autoRepair, notificationsEnabled: true })),
  };
  const watchdogNotifier = {
    notify: vi.fn(async () => ({
      telegram: { sent: 1, failed: 0, skipped: false, targets: 1 },
      discord: { sent: 0, failed: 0, skipped: true, targets: 0 },
      slack: { sent: 0, failed: 0, skipped: true, targets: 0 },
    })),
  };
  const getRecentEvents = vi.fn(() => []);
  const readLogTail = vi.fn(() => "");
  return {
    requireAuth,
    watchdog,
    watchdogNotifier,
    getRecentEvents,
    readLogTail,
    ...overrides,
  };
};

const createApp = (deps) => {
  const app = express();
  app.use(express.json());
  registerWatchdogRoutes({ app, ...deps });
  return app;
};

describe("POST /api/watchdog/test-notification", () => {
  it("sends a test notification and returns per-channel results", async () => {
    const deps = createDeps();
    const app = createApp(deps);

    const res = await request(app).post("/api/watchdog/test-notification");

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.result.telegram.sent).toBe(1);
    expect(res.body.result.discord.skipped).toBe(true);
    expect(deps.watchdogNotifier.notify).toHaveBeenCalledTimes(1);
    expect(deps.watchdogNotifier.notify).toHaveBeenCalledWith(
      expect.stringContaining("test notification"),
    );
  });

  it("returns 503 when notifier is not available", async () => {
    const deps = createDeps({ watchdogNotifier: null });
    const app = createApp(deps);

    const res = await request(app).post("/api/watchdog/test-notification");

    expect(res.status).toBe(503);
    expect(res.body.ok).toBe(false);
    expect(res.body.error).toBe("Notifier not available");
  });

  it("returns 500 when notify throws", async () => {
    const deps = createDeps({
      watchdogNotifier: {
        notify: vi.fn(async () => {
          throw new Error("connection refused");
        }),
      },
    });
    const app = createApp(deps);

    const res = await request(app).post("/api/watchdog/test-notification");

    expect(res.status).toBe(500);
    expect(res.body.ok).toBe(false);
    expect(res.body.error).toBe("connection refused");
  });
});
