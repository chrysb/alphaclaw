const express = require("express");
const request = require("supertest");

const {
  registerDenchWebFallbackProxyRoutes,
  registerDenchWebPriorityProxyRoutes,
} = require("../../lib/server/routes/dench-web");
const { registerPageRoutes } = require("../../lib/server/routes/pages");

const rewriteSetupApiAlias = (req, _res, next) => {
  if (req.url === "/setup-api" || req.url.startsWith("/setup-api/")) {
    req.url = req.url.replace(/^\/setup-api(?=\/|$)/, "/api");
  } else if (req.url.startsWith("/setup-api?")) {
    req.url = req.url.replace(/^\/setup-api(?=\?)/, "/api");
  }
  next();
};

const createRuntime = ({ enabled = true } = {}) => ({
  isEnabled: vi.fn(() => enabled),
  getWebUrl: vi.fn(() => "http://127.0.0.1:3100"),
});

const createProxy = () => ({
  web: vi.fn((req, res, { target }) => {
    res.json({
      proxied: true,
      target,
      path: req.path,
      url: req.url,
      originalUrl: req.originalUrl,
    });
  }),
});

const requireAuth = (_req, _res, next) => next();

describe("server/routes/dench-web", () => {
  it("proxies DenchClaw web API requests before AlphaClaw setup API routes", async () => {
    const app = express();
    const proxy = createProxy();
    const denchWebRuntime = createRuntime();
    app.use(rewriteSetupApiAlias);
    registerDenchWebPriorityProxyRoutes({
      app,
      proxy,
      requireAuth,
      denchWebRuntime,
    });
    app.get("/api/status", (req, res) =>
      res.json({
        setup: true,
        path: req.path,
        url: req.url,
        originalUrl: req.originalUrl,
      }),
    );

    const denchRes = await request(app).get("/api/profiles?view=compact");
    expect(denchRes.status).toBe(200);
    expect(denchRes.body).toEqual({
      proxied: true,
      target: "http://127.0.0.1:3100",
      path: "/api/profiles",
      url: "/api/profiles?view=compact",
      originalUrl: "/api/profiles?view=compact",
    });

    const setupRes = await request(app).get("/setup-api/status");
    expect(setupRes.status).toBe(200);
    expect(setupRes.body).toEqual({
      setup: true,
      path: "/api/status",
      url: "/api/status",
      originalUrl: "/setup-api/status",
    });
    expect(proxy.web).toHaveBeenCalledTimes(1);
  });

  it("proxies DenchClaw static assets through the authenticated priority route", async () => {
    const app = express();
    const proxy = createProxy();
    registerDenchWebPriorityProxyRoutes({
      app,
      proxy,
      requireAuth,
      denchWebRuntime: createRuntime(),
    });

    const res = await request(app).get("/_next/static/chunks/app.js");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      expect.objectContaining({
        proxied: true,
        target: "http://127.0.0.1:3100",
        path: "/_next/static/chunks/app.js",
      }),
    );
  });

  it("uses the fallback route for DenchClaw page paths without catching setup paths", async () => {
    const app = express();
    const proxy = createProxy();
    registerDenchWebFallbackProxyRoutes({
      app,
      proxy,
      requireAuth,
      denchWebRuntime: createRuntime(),
    });
    app.use((_req, res) => res.status(404).json({ ok: false }));

    const pageRes = await request(app).get("/workspace");
    expect(pageRes.status).toBe(200);
    expect(pageRes.body).toEqual(
      expect.objectContaining({
        proxied: true,
        target: "http://127.0.0.1:3100",
        path: "/workspace",
      }),
    );

    const setupRes = await request(app).get("/setup/advanced");
    expect(setupRes.status).toBe(404);
    expect(proxy.web).toHaveBeenCalledTimes(1);
  });

  it("serves DenchClaw at root only after onboarding", async () => {
    const app = express();
    const proxy = createProxy();
    registerPageRoutes({
      app,
      requireAuth,
      isGatewayRunning: vi.fn(async () => true),
      isOnboarded: vi.fn(() => true),
      proxy,
      denchWebRuntime: createRuntime(),
    });

    const res = await request(app).get("/");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      expect.objectContaining({
        proxied: true,
        target: "http://127.0.0.1:3100",
        path: "/",
      }),
    );
  });

  it("keeps root on the AlphaClaw setup UI before onboarding", async () => {
    const app = express();
    const proxy = createProxy();
    registerPageRoutes({
      app,
      requireAuth,
      isGatewayRunning: vi.fn(async () => false),
      isOnboarded: vi.fn(() => false),
      proxy,
      denchWebRuntime: createRuntime(),
    });

    const res = await request(app).get("/");

    expect(res.status).toBe(200);
    expect(res.text).toContain("<title>alphaclaw</title>");
    expect(proxy.web).not.toHaveBeenCalled();
  });
});
