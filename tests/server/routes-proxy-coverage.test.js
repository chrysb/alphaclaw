const express = require("express");
const http = require("http");
const { Readable, Writable } = require("stream");
const request = require("supertest");

const { createLoginThrottle } = require("../../lib/server/login-throttle");
const {
  kOpenAiCompatProxyPathPattern,
  registerProxyRoutes,
} = require("../../lib/server/routes/proxy");

const listen = (server) =>
  new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      resolve(server.address().port);
    });
  });

const close = (server) =>
  new Promise((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });

const registerDefaults = ({ app, ...overrides }) => {
  registerProxyRoutes({
    app,
    proxy: { web: vi.fn() },
    getGatewayUrl: () => "http://127.0.0.1:1",
    getGatewayToken: () => "gateway-token",
    SETUP_API_PREFIXES: [],
    requireAuth: (_req, _res, next) => next(),
    oauthCallbackMiddleware: (_req, res) => res.status(204).end(),
    webhookMiddleware: (_req, res) => res.status(204).end(),
    ...overrides,
  });
};

const createApiAuthThrottle = ({
  clientKey = "coverage-client",
  maxAttempts = 2,
} = {}) => ({
  ...createLoginThrottle({
    scope: `coverage-openai-api-${clientKey}-${Math.random()}`,
    windowMs: 60_000,
    maxAttempts,
    baseLockMs: 60_000,
    maxLockMs: 60_000,
    globalWindowMs: 60_000,
    globalMaxAttempts: 100,
    globalBaseLockMs: 60_000,
    globalMaxLockMs: 60_000,
    stateTtlMs: 180_000,
  }),
  getClientKey: () => clientKey,
});

describe("server/routes/proxy coverage", () => {
  let upstream;

  afterEach(async () => {
    if (upstream) {
      await close(upstream);
      upstream = null;
    }
  });

  describe("gateway passthrough routes", () => {
    const createProxyApp = ({ SETUP_API_PREFIXES = [] } = {}) => {
      const app = express();
      const proxy = {
        web: vi.fn((req, res, options) =>
          res.status(200).json({ url: req.url, target: options.target }),
        ),
      };
      registerDefaults({
        app,
        proxy,
        getGatewayUrl: () => "http://gateway.internal:18789",
        SETUP_API_PREFIXES,
      });
      return { app, proxy };
    };

    it("rewrites /openclaw to the gateway root", async () => {
      const { app, proxy } = createProxyApp();
      const res = await request(app).get("/openclaw");
      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        url: "/",
        target: "http://gateway.internal:18789",
      });
      expect(proxy.web).toHaveBeenCalledTimes(1);
    });

    it("strips the /openclaw prefix from nested paths", async () => {
      const { app } = createProxyApp();
      const res = await request(app).get("/openclaw/chat?tab=1");
      expect(res.status).toBe(200);
      expect(res.body.url).toBe("/chat?tab=1");
    });

    it("forwards /assets paths unchanged", async () => {
      const { app } = createProxyApp();
      const res = await request(app).get("/assets/app.js");
      expect(res.status).toBe(200);
      expect(res.body.url).toBe("/assets/app.js");
    });

    it("proxies /api paths except reserved setup prefixes", async () => {
      const { app, proxy } = createProxyApp({
        SETUP_API_PREFIXES: ["/api/setup"],
      });

      const proxied = await request(app).get("/api/gateway/thing");
      expect(proxied.status).toBe(200);
      expect(proxied.body.url).toBe("/api/gateway/thing");

      const reserved = await request(app).get("/api/setup/status");
      expect(reserved.status).toBe(404);
      expect(proxy.web).toHaveBeenCalledTimes(1);
    });

    it("routes hooks, webhook, and oauth paths to their middleware", async () => {
      const { app } = createProxyApp();
      expect((await request(app).post("/hooks/gmail")).status).toBe(204);
      expect((await request(app).post("/webhook/gmail")).status).toBe(204);
      expect((await request(app).get("/oauth/abc123")).status).toBe(204);
    });
  });

  it("returns 404 from the /v1 route itself when the API is disabled", async () => {
    const app = express();
    app.use(express.json());
    registerDefaults({ app, isOpenAiCompatApiEnabled: () => false });

    const res = await request(app)
      .post("/v1/chat/completions")
      .set("Authorization", "Bearer gateway-token")
      .send({ model: "openclaw/default" });

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Not found" });
  });

  it("returns 502 when the gateway URL is unparseable", async () => {
    const app = express();
    app.use(express.json());
    registerDefaults({ app, getGatewayUrl: () => "not a url" });

    const res = await request(app)
      .post("/v1/chat/completions")
      .set("Authorization", "Bearer gateway-token")
      .send({ model: "openclaw/default" });

    expect(res.status).toBe(502);
    expect(res.body).toEqual({ error: "Gateway unavailable" });
  });

  it("returns 502 when the gateway connection fails before headers", async () => {
    // Reserve a port, then close it so the connection is refused.
    const placeholder = http.createServer(() => {});
    const port = await listen(placeholder);
    await close(placeholder);

    const app = express();
    app.use(express.json());
    registerDefaults({ app, getGatewayUrl: () => `http://127.0.0.1:${port}` });

    const res = await request(app)
      .post("/v1/chat/completions")
      .set("Authorization", "Bearer gateway-token")
      .send({ model: "openclaw/default" });

    expect(res.status).toBe(502);
    expect(res.body).toEqual({ error: "Gateway unavailable" });
  });

  it("forwards raw string bodies and empty bodies", async () => {
    const seen = [];
    upstream = http.createServer((req, res) => {
      const chunks = [];
      req.on("data", (chunk) => chunks.push(chunk));
      req.on("end", () => {
        seen.push({
          url: req.url,
          body: Buffer.concat(chunks).toString("utf8"),
          contentLength: req.headers["content-length"],
        });
        res.writeHead(200, { "content-type": "application/json" });
        res.end("{}");
      });
    });
    const port = await listen(upstream);

    // Text parser produces string bodies.
    const textApp = express();
    textApp.use(express.text({ type: "text/plain" }));
    registerDefaults({ app: textApp, getGatewayUrl: () => `http://127.0.0.1:${port}` });

    const textRes = await request(textApp)
      .post("/v1/chat/completions")
      .set("Authorization", "Bearer gateway-token")
      .set("Content-Type", "text/plain")
      .send("raw-string-body");
    expect(textRes.status).toBe(200);

    // Without any body parser, req.body stays undefined and no body is sent.
    const bareApp = express();
    registerDefaults({ app: bareApp, getGatewayUrl: () => `http://127.0.0.1:${port}` });
    const emptyRes = await request(bareApp)
      .get("/v1/models")
      .set("Authorization", "Bearer gateway-token");
    expect(emptyRes.status).toBe(200);

    expect(seen[0].body).toBe("raw-string-body");
    expect(seen[0].contentLength).toBe(String("raw-string-body".length));
    expect(seen[1].url).toBe("/v1/models");
    expect(seen[1].body).toBe("");
    expect(seen[1].contentLength).toBeUndefined();
  });

  it("blocks locked clients before checking credentials", async () => {
    upstream = http.createServer((_req, res) => {
      res.writeHead(200, { "content-type": "application/json" });
      res.end("{}");
    });
    const port = await listen(upstream);

    const app = express();
    app.use(express.json());
    registerDefaults({
      app,
      getGatewayUrl: () => `http://127.0.0.1:${port}`,
      openAiCompatApiThrottle: createApiAuthThrottle(),
    });

    const send = (token) =>
      request(app)
        .post("/v1/chat/completions")
        .set("Authorization", `Bearer ${token}`)
        .send({ model: "openclaw/default" });

    expect((await send("wrong-1")).status).toBe(401);
    // The second failure locks the client.
    expect((await send("wrong-2")).status).toBe(429);
    // The third request is blocked up-front by the evaluate step, even with
    // the correct token.
    const blocked = await send("gateway-token");
    expect(blocked.status).toBe(429);
    expect(blocked.headers["retry-after"]).toBeDefined();
  });

  it("records successful bearer auth with the throttle", async () => {
    upstream = http.createServer((_req, res) => {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ ok: true }));
    });
    const port = await listen(upstream);

    const throttle = createApiAuthThrottle();
    const successSpy = vi.spyOn(throttle, "recordLoginSuccess");
    const app = express();
    app.use(express.json());
    registerDefaults({
      app,
      getGatewayUrl: () => `http://127.0.0.1:${port}`,
      openAiCompatApiThrottle: throttle,
    });

    const res = await request(app)
      .post("/v1/chat/completions")
      .set("Authorization", "Bearer gateway-token")
      .send({ model: "openclaw/default" });

    expect(res.status).toBe(200);
    expect(successSpy).toHaveBeenCalledWith("coverage-client");
  });

  describe("proxy response handling (unit)", () => {
    const getOpenAiHandler = (overrides = {}) => {
      const routes = [];
      const fakeApp = {
        all: (pattern, ...handlers) => routes.push({ pattern, handlers }),
      };
      registerDefaults({ app: fakeApp, ...overrides });
      const route = routes.find(
        (entry) => entry.pattern === kOpenAiCompatProxyPathPattern,
      );
      return route.handlers[route.handlers.length - 1];
    };

    const createFakeRes = () => {
      const res = new Writable({
        write(chunk, _encoding, callback) {
          res.chunks.push(Buffer.from(chunk));
          callback();
        },
      });
      res.chunks = [];
      res.headers = {};
      res.headersSent = false;
      res.setHeader = vi.fn((key, value) => {
        res.headers[key.toLowerCase()] = value;
      });
      res.set = vi.fn(() => res);
      res.status = vi.fn(() => res);
      res.json = vi.fn(() => res);
      return res;
    };

    const createFakeReq = ({ originalUrl } = {}) => ({
      method: "POST",
      url: "/v1/chat/completions",
      ...(originalUrl === undefined ? {} : { originalUrl }),
      headers: { authorization: "Bearer gateway-token" },
      body: { model: "openclaw/default" },
    });

    const stubHttpRequest = () => {
      const state = { proxyReq: null, callback: null, options: null };
      vi.spyOn(http, "request").mockImplementation((options, callback) => {
        state.options = options;
        state.callback = callback;
        state.proxyReq = {
          handlers: {},
          on(event, handler) {
            this.handlers[event] = handler;
            return this;
          },
          write: vi.fn(),
          end: vi.fn(),
        };
        return state.proxyReq;
      });
      return state;
    };

    it("skips null header values and defaults missing status codes to 502", async () => {
      const state = stubHttpRequest();
      const handler = getOpenAiHandler();
      const req = createFakeReq({ originalUrl: "/v1/chat/completions?x=1" });
      const res = createFakeRes();

      handler(req, res);
      expect(state.options.path).toBe("/v1/chat/completions?x=1");
      expect(state.proxyReq.write).toHaveBeenCalled();
      expect(state.proxyReq.end).toHaveBeenCalled();

      const proxyRes = new Readable({ read() {} });
      proxyRes.statusCode = 0;
      proxyRes.headers = {
        "x-null-header": null,
        "x-kept": "yes",
        connection: "keep-alive",
        "set-cookie": "leak=1",
      };
      const finished = new Promise((resolve) => res.on("finish", resolve));
      state.callback(proxyRes);
      proxyRes.push("body");
      proxyRes.push(null);
      await finished;

      expect(res.statusCode).toBe(502);
      expect(res.headers["x-kept"]).toBe("yes");
      expect(res.headers["x-null-header"]).toBeUndefined();
      expect(res.headers.connection).toBeUndefined();
      expect(res.headers["set-cookie"]).toBeUndefined();
      expect(Buffer.concat(res.chunks).toString("utf8")).toBe("body");
    });

    it("falls back to req.url when originalUrl is missing", () => {
      const state = stubHttpRequest();
      const handler = getOpenAiHandler();
      handler(createFakeReq(), createFakeRes());
      expect(state.options.path).toBe("/v1/chat/completions");
    });

    it("ends the response when the gateway drops after headers were sent", () => {
      const state = stubHttpRequest();
      const handler = getOpenAiHandler();
      const req = createFakeReq();
      const res = createFakeRes();
      const endSpy = vi.spyOn(res, "end");

      handler(req, res);
      res.headersSent = true;
      state.proxyReq.handlers.error(new Error("socket hang up"));

      expect(endSpy).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });
});
