const express = require("express");
const request = require("supertest");

const loadAuthRoutes = () => {
  vi.resetModules();
  const modulePath = require.resolve("../../lib/server/routes/auth");
  delete require.cache[modulePath];
  return require(modulePath);
};

const createLoginThrottleMock = () => ({
  getClientKey: vi.fn(() => "client-key"),
  getOrCreateLoginAttemptState: vi.fn(() => ({ attempts: 0 })),
  evaluateLoginThrottle: vi.fn(() => ({ blocked: false, retryAfterSec: 0 })),
  recordLoginFailure: vi.fn(() => ({ lockMs: 0, locked: false })),
  recordLoginSuccess: vi.fn(),
  cleanupLoginAttemptStates: vi.fn(),
});

const createTestApp = ({ setupPassword, loginThrottle } = {}) => {
  if (typeof setupPassword === "string") {
    process.env.SETUP_PASSWORD = setupPassword;
  } else {
    delete process.env.SETUP_PASSWORD;
  }

  const { registerAuthRoutes } = loadAuthRoutes();
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    if (req.url === "/setup-api" || req.url.startsWith("/setup-api/")) {
      req.url = req.url.replace(/^\/setup-api(?=\/|$)/, "/api");
    } else if (req.url.startsWith("/setup-api?")) {
      req.url = req.url.replace(/^\/setup-api(?=\?)/, "/api");
    }
    next();
  });
  const throttle = loginThrottle || createLoginThrottleMock();
  registerAuthRoutes({ app, loginThrottle: throttle });

  app.get("/api/protected", (req, res) => res.json({ ok: true }));
  app.get("/setup/protected", (req, res) => res.json({ ok: true }));

  return { app, throttle };
};

describe("server/routes/auth", () => {
  afterEach(() => {
    delete process.env.SETUP_PASSWORD;
  });

  it("returns 503 when setup password is unset", async () => {
    const { app, throttle } = createTestApp({ setupPassword: "" });

    const login = await request(app).post("/api/auth/login").send({ password: "any" });
    expect(login.status).toBe(503);
    expect(login.body.ok).toBe(false);

    const protectedRes = await request(app).get("/api/protected");
    expect(protectedRes.status).toBe(503);
    expect(throttle.getClientKey).not.toHaveBeenCalled();
  });

  it("returns 429 and retry-after header when throttle blocks", async () => {
    const { app, throttle } = createTestApp({ setupPassword: "secret" });
    throttle.evaluateLoginThrottle.mockReturnValue({
      blocked: true,
      retryAfterSec: 12,
    });

    const res = await request(app).post("/api/auth/login").send({ password: "wrong" });

    expect(res.status).toBe(429);
    expect(res.headers["retry-after"]).toBe("12");
    expect(res.body.ok).toBe(false);
    expect(throttle.recordLoginFailure).not.toHaveBeenCalled();
  });

  it("returns 401 for invalid credentials and records failure", async () => {
    const { app, throttle } = createTestApp({ setupPassword: "secret" });

    const res = await request(app).post("/api/auth/login").send({ password: "wrong" });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ ok: false, error: "Invalid credentials" });
    expect(throttle.recordLoginFailure).toHaveBeenCalledTimes(1);
  });

  it("sets auth cookie on success and allows protected API by cookie", async () => {
    const { app, throttle } = createTestApp({ setupPassword: "secret" });

    const login = await request(app).post("/api/auth/login").send({ password: "secret" });

    expect(login.status).toBe(200);
    expect(login.body).toEqual({ ok: true });
    expect(throttle.recordLoginSuccess).toHaveBeenCalledTimes(1);

    const setCookieHeader = login.headers["set-cookie"]?.[0] || "";
    const tokenMatch = setCookieHeader.match(/setup_token=([^;]+)/);
    expect(tokenMatch).toBeTruthy();
    const cookie = setCookieHeader.split(";")[0];
    const protectedRes = await request(app).get("/api/protected").set("Cookie", cookie);
    expect(protectedRes.status).toBe(200);
    expect(protectedRes.body).toEqual({ ok: true });
  });

  it("rejects query-string token auth", async () => {
    const { app } = createTestApp({ setupPassword: "secret" });
    const login = await request(app).post("/api/auth/login").send({ password: "secret" });
    const setCookieHeader = login.headers["set-cookie"]?.[0] || "";
    const tokenMatch = setCookieHeader.match(/setup_token=([^;]+)/);
    expect(tokenMatch).toBeTruthy();

    const protectedRes = await request(app).get(`/api/protected?token=${tokenMatch[1]}`);
    expect(protectedRes.status).toBe(401);
    expect(protectedRes.body).toEqual({ error: "Unauthorized" });
  });

  it("treats setup-api aliases as API requests for auth errors", async () => {
    const { app } = createTestApp({ setupPassword: "secret" });

    const protectedRes = await request(app).get("/setup-api/protected");

    expect(protectedRes.status).toBe(401);
    expect(protectedRes.body).toEqual({ error: "Unauthorized" });
  });

});
