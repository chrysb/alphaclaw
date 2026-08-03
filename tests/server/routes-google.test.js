const express = require("express");
const request = require("supertest");

const { registerGoogleRoutes } = require("../../lib/server/routes/google");

const createFsMock = () => {
  const files = new Map();
  return {
    existsSync: vi.fn((p) => files.has(p)),
    readFileSync: vi.fn((p) => {
      if (!files.has(p)) {
        throw Object.assign(new Error("ENOENT"), { code: "ENOENT" });
      }
      return files.get(p);
    }),
    writeFileSync: vi.fn((p, content) => {
      files.set(p, content);
    }),
    unlinkSync: vi.fn((p) => {
      files.delete(p);
    }),
  };
};

const createApp = (overrides = {}) => {
  const app = express();
  app.use(express.json());
  const deps = {
    app,
    fs: createFsMock(),
    isGatewayRunning: vi.fn(async () => true),
    gogCmd: vi.fn(async () => ({ ok: true, stdout: "", stderr: "" })),
    getBaseUrl: () => "https://alphaclaw.example",
    readGoogleCredentials: vi.fn(() => ({
      clientId: "client-id",
      clientSecret: "client-secret",
    })),
    getApiEnableUrl: vi.fn(() => ""),
    constants: {
      GOG_CONFIG_DIR: "/tmp/gog",
      GOG_STATE_PATH: "/tmp/gog/state.json",
      API_TEST_COMMANDS: {},
      BASE_SCOPES: ["openid", "email"],
      SCOPE_MAP: { "gmail:read": "gmail.readonly" },
      REVERSE_SCOPE_MAP: { "gmail.readonly": "gmail:read" },
      kMaxGoogleAccounts: 5,
      gogClientCredentialsPath: () => "/tmp/gog/creds.json",
      WORKSPACE_DIR: "/tmp/workspace",
    },
    ...overrides,
  };
  registerGoogleRoutes(deps);
  return { app, deps };
};

describe("server/routes/google oauth state (CSRF)", () => {
  it("mints an opaque, unguessable state token on start rather than trusting client-supplied data", async () => {
    const { app } = createApp();
    const res = await request(app).get("/auth/google/start");

    expect(res.status).toBe(302);
    const location = new URL(res.headers.location);
    const state = location.searchParams.get("state");
    expect(state).toBeTruthy();
    // Must not be a base64url-encoded JSON blob an attacker could forge with
    // their own accountId/email/client -- just an opaque random token.
    expect(() => JSON.parse(Buffer.from(state, "base64url").toString())).toThrow();
    expect(state).toMatch(/^[0-9a-f]{32}$/);
  });

  it("rejects a callback whose state was never issued by this server", async () => {
    const { app } = createApp();
    const fetchSpy = vi.spyOn(global, "fetch");

    const res = await request(app)
      .get("/auth/google/callback")
      .query({ code: "attacker-code", state: "forged-state-attacker-controls" });

    expect(res.status).toBe(302);
    expect(res.headers.location).toContain("google=error");
    expect(res.headers.location).toContain("state_mismatch_or_expired");
    // Must never exchange the code for tokens without a verified state.
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it("accepts a callback using the exact state issued by /auth/google/start, and consumes it once", async () => {
    const { app } = createApp();

    const startRes = await request(app)
      .get("/auth/google/start")
      .query({ email: "owner@example.com" });
    const state = new URL(startRes.headers.location).searchParams.get("state");

    const fetchSpy = vi.spyOn(global, "fetch").mockImplementation(async (url) => {
      if (String(url).includes("oauth2.googleapis.com/token")) {
        return {
          ok: true,
          json: async () => ({
            access_token: "at",
            refresh_token: "rt",
            scope: "gmail.readonly",
          }),
        };
      }
      return { ok: true, json: async () => ({ email: "owner@example.com" }) };
    });

    const firstAttempt = await request(app)
      .get("/auth/google/callback")
      .query({ code: "real-code", state });
    expect(firstAttempt.status).toBe(200);
    expect(firstAttempt.text).toContain("google");

    // Replaying the same state (e.g. an attacker who intercepted the callback
    // URL) must not be able to trigger a second token exchange.
    const secondAttempt = await request(app)
      .get("/auth/google/callback")
      .query({ code: "replayed-code", state });
    expect(secondAttempt.status).toBe(302);
    expect(secondAttempt.headers.location).toContain("state_mismatch_or_expired");

    fetchSpy.mockRestore();
  });
});
