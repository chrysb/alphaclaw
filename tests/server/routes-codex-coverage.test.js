const express = require("express");
const request = require("supertest");

const { registerCodexRoutes } = require("../../lib/server/routes/codex");
const {
  CODEX_OAUTH_AUTHORIZE_URL,
  CODEX_OAUTH_CLIENT_ID,
  CODEX_OAUTH_REDIRECT_URI,
  CODEX_OAUTH_SCOPE,
  CODEX_OAUTH_TOKEN_URL,
  kCodexOauthStateTtlMs,
} = require("../../lib/server/constants");

const kOriginalFetch = global.fetch;

const buildTokenResponse = ({
  ok = true,
  status = 200,
  json = async () => ({
    access_token: "access-token",
    refresh_token: "refresh-token",
    expires_in: 3600,
  }),
} = {}) => ({ ok, status, json });

const createApp = ({
  createPkcePair = () => ({ verifier: "verifier-1", challenge: "challenge-1" }),
  parseCodexAuthorizationInput = () => ({}),
  getCodexAccountId = () => "acct-1",
  profile = null,
  removeChanged = true,
} = {}) => {
  const app = express();
  app.use(express.json());
  const onAuthChanged = vi.fn();
  const upsertCodexProfile = vi.fn();
  registerCodexRoutes({
    app,
    createPkcePair,
    parseCodexAuthorizationInput,
    getCodexAccountId,
    authProfiles: {
      getCodexProfile: () => profile,
      upsertCodexProfile,
      removeCodexProfiles: () => removeChanged,
    },
    onAuthChanged,
  });
  return { app, onAuthChanged, upsertCodexProfile };
};

const startOauthAndGetState = async (app) => {
  const res = await request(app).get("/auth/codex/start");
  expect(res.status).toBe(302);
  const location = new URL(res.headers.location);
  return { location, state: location.searchParams.get("state") };
};

afterEach(() => {
  global.fetch = kOriginalFetch;
});

describe("server/routes/codex coverage", () => {
  describe("GET /api/codex/status", () => {
    it("reports disconnected when no profile exists", async () => {
      const { app } = createApp({ profile: null });
      const res = await request(app).get("/api/codex/status");
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ connected: false });
    });

    it("reports profile details when connected", async () => {
      const { app } = createApp({
        profile: { profileId: "codex:main", accountId: "acct-9", expires: 1234 },
      });
      const res = await request(app).get("/api/codex/status");
      expect(res.body).toEqual({
        connected: true,
        profileId: "codex:main",
        accountId: "acct-9",
        expires: 1234,
      });
    });

    it("nulls out missing accountId and non-numeric expires", async () => {
      const { app } = createApp({
        profile: { profileId: "codex:main", expires: "soon" },
      });
      const res = await request(app).get("/api/codex/status");
      expect(res.body).toEqual({
        connected: true,
        profileId: "codex:main",
        accountId: null,
        expires: null,
      });
    });
  });

  describe("GET /auth/codex/start", () => {
    it("redirects to the authorization URL with PKCE params", async () => {
      const { app } = createApp();
      const { location, state } = await startOauthAndGetState(app);
      expect(location.origin + location.pathname).toBe(CODEX_OAUTH_AUTHORIZE_URL);
      expect(location.searchParams.get("response_type")).toBe("code");
      expect(location.searchParams.get("client_id")).toBe(CODEX_OAUTH_CLIENT_ID);
      expect(location.searchParams.get("redirect_uri")).toBe(
        CODEX_OAUTH_REDIRECT_URI,
      );
      expect(location.searchParams.get("scope")).toBe(CODEX_OAUTH_SCOPE);
      expect(location.searchParams.get("code_challenge")).toBe("challenge-1");
      expect(location.searchParams.get("code_challenge_method")).toBe("S256");
      expect(location.searchParams.get("id_token_add_organizations")).toBe("true");
      expect(location.searchParams.get("codex_cli_simplified_flow")).toBe("true");
      expect(location.searchParams.get("originator")).toBe("pi");
      expect(state).toMatch(/^[0-9a-f]{32}$/);
    });

    it("redirects to setup with an error when PKCE creation fails", async () => {
      const consoleError = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const { app } = createApp({
        createPkcePair: () => {
          throw new Error("pkce blew up");
        },
      });
      const res = await request(app).get("/auth/codex/start");
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe(
        "/setup?codex=error&message=" + encodeURIComponent("pkce blew up"),
      );
      expect(consoleError).toHaveBeenCalled();
    });
  });

  describe("GET /auth/codex/callback", () => {
    it("relays provider errors to the opener with quotes escaped", async () => {
      const { app } = createApp();
      const res = await request(app).get(
        "/auth/codex/callback?error=" + encodeURIComponent("denied'now"),
      );
      expect(res.status).toBe(200);
      expect(res.text).toContain("codex: 'error'");
      expect(res.text).toContain("denied\\'now");
      expect(res.text).toContain("Codex auth failed");
    });

    it("reports missing state or code", async () => {
      const { app } = createApp();
      const res = await request(app).get("/auth/codex/callback?code=abc");
      expect(res.text).toContain("Missing OAuth state/code");
    });

    it("reports state mismatch for unknown states", async () => {
      const { app } = createApp();
      const res = await request(app).get(
        "/auth/codex/callback?code=abc&state=unknown",
      );
      expect(res.text).toContain("State mismatch or expired login attempt");
    });

    it("exchanges the code and persists the profile on success", async () => {
      const { app, onAuthChanged, upsertCodexProfile } = createApp();
      const { state } = await startOauthAndGetState(app);
      global.fetch = vi.fn(async () => buildTokenResponse());

      const res = await request(app).get(
        `/auth/codex/callback?code=auth-code&state=${state}`,
      );

      expect(res.status).toBe(200);
      expect(res.text).toContain("codex: 'success'");
      expect(res.text).toContain("Codex connected");
      expect(global.fetch).toHaveBeenCalledTimes(1);
      const [tokenUrl, fetchOptions] = global.fetch.mock.calls[0];
      expect(tokenUrl).toBe(CODEX_OAUTH_TOKEN_URL);
      expect(fetchOptions.method).toBe("POST");
      const params = new URLSearchParams(String(fetchOptions.body));
      expect(params.get("grant_type")).toBe("authorization_code");
      expect(params.get("client_id")).toBe(CODEX_OAUTH_CLIENT_ID);
      expect(params.get("code")).toBe("auth-code");
      expect(params.get("code_verifier")).toBe("verifier-1");
      expect(params.get("redirect_uri")).toBe(CODEX_OAUTH_REDIRECT_URI);
      expect(upsertCodexProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          access: "access-token",
          refresh: "refresh-token",
          accountId: "acct-1",
        }),
      );
      expect(upsertCodexProfile.mock.calls[0][0].expires).toBeGreaterThan(
        Date.now(),
      );
      expect(onAuthChanged).toHaveBeenCalledOnce();
    });

    it("rejects state reuse after a successful exchange", async () => {
      const { app } = createApp();
      const { state } = await startOauthAndGetState(app);
      global.fetch = vi.fn(async () => buildTokenResponse());
      await request(app).get(`/auth/codex/callback?code=c1&state=${state}`);
      const replay = await request(app).get(
        `/auth/codex/callback?code=c2&state=${state}`,
      );
      expect(replay.text).toContain("State mismatch");
    });

    it("reports token exchange failures with the response status", async () => {
      const consoleError = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const { app, upsertCodexProfile } = createApp();
      const { state } = await startOauthAndGetState(app);
      global.fetch = vi.fn(async () =>
        buildTokenResponse({ ok: false, status: 403, json: async () => ({}) }),
      );

      const res = await request(app).get(
        `/auth/codex/callback?code=bad&state=${state}`,
      );

      expect(res.text).toContain("Token exchange failed (403)");
      expect(upsertCodexProfile).not.toHaveBeenCalled();
      expect(consoleError).toHaveBeenCalled();
    });

    it("treats unparsable token responses as failures", async () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      const { app } = createApp();
      const { state } = await startOauthAndGetState(app);
      global.fetch = vi.fn(async () =>
        buildTokenResponse({
          ok: true,
          status: 200,
          json: async () => {
            throw new Error("invalid json");
          },
        }),
      );

      const res = await request(app).get(
        `/auth/codex/callback?code=bad&state=${state}`,
      );

      expect(res.text).toContain("Token exchange failed (200)");
    });

    it("expires stale states after the TTL", async () => {
      const { app } = createApp();
      const { state } = await startOauthAndGetState(app);
      const realNow = Date.now();
      const nowSpy = vi
        .spyOn(Date, "now")
        .mockReturnValue(realNow + kCodexOauthStateTtlMs + 1000);
      try {
        const res = await request(app).get(
          `/auth/codex/callback?code=late&state=${state}`,
        );
        expect(res.text).toContain("State mismatch or expired login attempt");
      } finally {
        nowSpy.mockRestore();
      }
    });
  });

  describe("POST /api/codex/exchange", () => {
    it("requires code and state from the pasted input", async () => {
      const { app } = createApp({ parseCodexAuthorizationInput: () => ({}) });
      const res = await request(app)
        .post("/api/codex/exchange")
        .send({ input: "https://example.com/callback" });
      expect(res.status).toBe(400);
      expect(res.body.ok).toBe(false);
      expect(res.body.error).toContain("Missing code/state");
    });

    it("handles a missing request body", async () => {
      const { app } = createApp({ parseCodexAuthorizationInput: () => ({}) });
      const res = await request(app).post("/api/codex/exchange");
      expect(res.status).toBe(400);
      expect(res.body.error).toContain("Missing code/state");
    });

    it("rejects unknown or expired states", async () => {
      const { app } = createApp({
        parseCodexAuthorizationInput: () => ({ code: "c", state: "nope" }),
      });
      const res = await request(app)
        .post("/api/codex/exchange")
        .send({ input: "whatever" });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain("OAuth state expired or invalid");
    });

    it("exchanges tokens and persists the profile", async () => {
      let knownState = "";
      const { app, onAuthChanged, upsertCodexProfile } = createApp({
        parseCodexAuthorizationInput: () => ({
          code: "manual-code",
          state: knownState,
        }),
        getCodexAccountId: () => null,
      });
      const { state } = await startOauthAndGetState(app);
      knownState = state;
      global.fetch = vi.fn(async () => buildTokenResponse());

      const res = await request(app)
        .post("/api/codex/exchange")
        .send({ input: "pasted-url" });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ ok: true });
      const params = new URLSearchParams(String(global.fetch.mock.calls[0][1].body));
      expect(params.get("code")).toBe("manual-code");
      expect(params.get("code_verifier")).toBe("verifier-1");
      expect(upsertCodexProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          access: "access-token",
          refresh: "refresh-token",
          accountId: null,
        }),
      );
      expect(onAuthChanged).toHaveBeenCalledOnce();

      const replay = await request(app)
        .post("/api/codex/exchange")
        .send({ input: "pasted-url" });
      expect(replay.status).toBe(400);
      expect(replay.body.error).toContain("OAuth state expired or invalid");
    });

    it("returns 400 when the token exchange fails", async () => {
      let knownState = "";
      const { app, upsertCodexProfile } = createApp({
        parseCodexAuthorizationInput: () => ({ code: "c", state: knownState }),
      });
      const { state } = await startOauthAndGetState(app);
      knownState = state;
      global.fetch = vi.fn(async () =>
        buildTokenResponse({
          ok: true,
          status: 200,
          json: async () => ({ access_token: "a", refresh_token: "r" }),
        }),
      );

      const res = await request(app)
        .post("/api/codex/exchange")
        .send({ input: "pasted-url" });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        ok: false,
        error: "Token exchange failed (200)",
      });
      expect(upsertCodexProfile).not.toHaveBeenCalled();
    });

    it("returns 500 when parsing the authorization input throws", async () => {
      const consoleError = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const { app } = createApp({
        parseCodexAuthorizationInput: () => {
          throw new Error("cannot parse input");
        },
      });
      const res = await request(app)
        .post("/api/codex/exchange")
        .send({ input: "junk" });
      expect(res.status).toBe(500);
      expect(res.body).toEqual({ ok: false, error: "cannot parse input" });
      expect(consoleError).toHaveBeenCalled();
    });

    it("falls back to a generic error message when the thrown error is blank", async () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      const { app } = createApp({
        parseCodexAuthorizationInput: () => {
          throw new Error("");
        },
      });
      const res = await request(app)
        .post("/api/codex/exchange")
        .send({ input: "junk" });
      expect(res.status).toBe(500);
      expect(res.body).toEqual({
        ok: false,
        error: "Codex OAuth exchange failed",
      });
    });
  });
});
