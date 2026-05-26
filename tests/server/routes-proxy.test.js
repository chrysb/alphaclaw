const express = require("express");
const http = require("http");
const zlib = require("zlib");
const request = require("supertest");

const { registerProxyRoutes } = require("../../lib/server/routes/proxy");

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

const createApp = ({
  gatewayUrl,
  gatewayToken = "gateway-token",
  openAiJsonLimit = "50mb",
  globalJsonLimit = "5mb",
}) => {
  const app = express();
  app.use("/v1", express.json({ limit: openAiJsonLimit }));
  app.use(express.json({ limit: globalJsonLimit }));
  registerProxyRoutes({
    app,
    proxy: {
      web: vi.fn((_req, res) => res.status(502).json({ error: "Unexpected proxy" })),
    },
    getGatewayUrl: () => gatewayUrl,
    getGatewayToken: () => gatewayToken,
    SETUP_API_PREFIXES: [],
    requireAuth: (_req, _res, next) => next(),
    oauthCallbackMiddleware: (_req, res) => res.status(204).end(),
    webhookMiddleware: (_req, res) => res.status(204).end(),
  });
  return app;
};

describe("server/routes/proxy OpenAI compatibility", () => {
  let upstream;

  afterEach(async () => {
    if (upstream) {
      await close(upstream);
      upstream = null;
    }
  });

  it("requires bearer auth before proxying /v1 requests", async () => {
    let upstreamCalls = 0;
    upstream = http.createServer((_req, res) => {
      upstreamCalls += 1;
      res.statusCode = 200;
      res.end("{}");
    });
    const port = await listen(upstream);
    const app = createApp({ gatewayUrl: `http://127.0.0.1:${port}` });

    const res = await request(app).post("/v1/chat/completions").send({
      model: "openclaw/default",
      stream: true,
    });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "Unauthorized" });
    expect(upstreamCalls).toBe(0);
  });

  it("rejects bearer tokens that do not match the configured gateway token", async () => {
    let upstreamCalls = 0;
    upstream = http.createServer((_req, res) => {
      upstreamCalls += 1;
      res.statusCode = 200;
      res.end("{}");
    });
    const port = await listen(upstream);
    const app = createApp({ gatewayUrl: `http://127.0.0.1:${port}` });

    const res = await request(app)
      .post("/v1/chat/completions")
      .set("Authorization", "Bearer wrong-token")
      .send({
        model: "openclaw/default",
        stream: true,
      });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "Unauthorized" });
    expect(upstreamCalls).toBe(0);
  });

  it("rejects /v1 requests when no gateway token is configured", async () => {
    let upstreamCalls = 0;
    upstream = http.createServer((_req, res) => {
      upstreamCalls += 1;
      res.statusCode = 200;
      res.end("{}");
    });
    const port = await listen(upstream);
    const app = createApp({
      gatewayUrl: `http://127.0.0.1:${port}`,
      gatewayToken: "",
    });

    const res = await request(app)
      .post("/v1/chat/completions")
      .set("Authorization", "Bearer gateway-token")
      .send({
        model: "openclaw/default",
        stream: true,
      });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "Unauthorized" });
    expect(upstreamCalls).toBe(0);
  });

  it("forwards /v1 chat requests with parsed JSON bodies and streams gateway responses", async () => {
    const seen = {};
    upstream = http.createServer((req, res) => {
      const chunks = [];
      req.on("data", (chunk) => chunks.push(chunk));
      req.on("end", () => {
        seen.method = req.method;
        seen.url = req.url;
        seen.authorization = req.headers.authorization;
        seen.cookie = req.headers.cookie;
        seen.contentType = req.headers["content-type"];
        seen.body = Buffer.concat(chunks).toString("utf8");
        res.writeHead(200, {
          "keep-alive": "timeout=5",
          "proxy-authenticate": "Basic realm=test",
          "content-type": "text/event-stream",
          upgrade: "websocket",
        });
        res.write('data: {"choices":[{"delta":{"content":"ok"}}]}\n\n');
        res.end("data: [DONE]\n\n");
      });
    });
    const port = await listen(upstream);
    const app = createApp({ gatewayUrl: `http://127.0.0.1:${port}` });

    const res = await request(app)
      .post("/v1/chat/completions?trace=1")
      .set("Authorization", "Bearer gateway-token")
      .set("Cookie", "setup_token=private")
      .send({
        model: "openclaw/default",
        stream: true,
      });

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("text/event-stream");
    expect(res.headers["proxy-authenticate"]).toBeUndefined();
    expect(res.headers.upgrade).toBeUndefined();
    expect(res.text).toContain("data: [DONE]");
    expect(seen).toEqual({
      method: "POST",
      url: "/v1/chat/completions?trace=1",
      authorization: "Bearer gateway-token",
      cookie: undefined,
      contentType: expect.stringContaining("application/json"),
      body: JSON.stringify({
        model: "openclaw/default",
        stream: true,
      }),
    });
  });

  it("uses the /v1 JSON parser limit before the smaller global JSON limit", async () => {
    const seen = {};
    upstream = http.createServer((req, res) => {
      const chunks = [];
      req.on("data", (chunk) => chunks.push(chunk));
      req.on("end", () => {
        seen.bodyLength = Buffer.concat(chunks).length;
        res.writeHead(200, { "content-type": "application/json" });
        res.end(JSON.stringify({ ok: true }));
      });
    });
    const port = await listen(upstream);
    const app = createApp({
      gatewayUrl: `http://127.0.0.1:${port}`,
      openAiJsonLimit: "10kb",
      globalJsonLimit: "1kb",
    });
    const payload = {
      model: "openclaw/default",
      messages: [{ role: "user", content: "x".repeat(2048) }],
    };

    const res = await request(app)
      .post("/v1/chat/completions")
      .set("Authorization", "Bearer gateway-token")
      .send(payload);

    expect(res.status).toBe(200);
    expect(seen.bodyLength).toBe(Buffer.byteLength(JSON.stringify(payload)));
  });

  describe("createGatewayProxyHeaders (unit)", () => {
    const { __testing } = require("../../lib/server/routes/proxy");
    const { createGatewayProxyHeaders } = __testing;

    it("strips Content-Encoding because Express has already inflated the body", () => {
      const headers = createGatewayProxyHeaders({
        reqHeaders: {
          host: "alphaclaw.example.com",
          "content-type": "application/json",
          "content-encoding": "gzip",
          "content-length": "1234",
          authorization: "Bearer abc",
        },
        bodyBuffer: Buffer.from(JSON.stringify({ model: "openclaw/default" })),
      });
      expect(headers["content-encoding"]).toBeUndefined();
      expect(headers["content-length"]).toBe(String(
        Buffer.from(JSON.stringify({ model: "openclaw/default" })).length,
      ));
      expect(headers.authorization).toBe("Bearer abc");
    });

    it("strips hop-by-hop request headers", () => {
      const headers = createGatewayProxyHeaders({
        reqHeaders: {
          host: "alphaclaw.example.com",
          connection: "keep-alive",
          "transfer-encoding": "chunked",
          cookie: "setup_token=leak",
          "content-type": "application/json",
          authorization: "Bearer abc",
        },
        bodyBuffer: Buffer.from("{}"),
      });
      expect(headers.host).toBeUndefined();
      expect(headers.connection).toBeUndefined();
      expect(headers["transfer-encoding"]).toBeUndefined();
      expect(headers.cookie).toBeUndefined();
    });

    it("defaults missing Content-Type to application/json when body present", () => {
      const headers = createGatewayProxyHeaders({
        reqHeaders: { authorization: "Bearer abc" },
        bodyBuffer: Buffer.from('{"x":1}'),
      });
      expect(headers["content-type"]).toBe("application/json");
    });

    it("does not set Content-Type when body is empty", () => {
      const headers = createGatewayProxyHeaders({
        reqHeaders: { authorization: "Bearer abc" },
        bodyBuffer: Buffer.alloc(0),
      });
      expect(headers["content-type"]).toBeUndefined();
      expect(headers["content-length"]).toBeUndefined();
    });
  });

  it("strips Set-Cookie from upstream responses", async () => {
    upstream = http.createServer((_req, res) => {
      res.writeHead(200, {
        "content-type": "application/json",
        "set-cookie": "session=leaked-from-gateway; Path=/",
      });
      res.end(JSON.stringify({ ok: true }));
    });
    const port = await listen(upstream);
    const app = createApp({ gatewayUrl: `http://127.0.0.1:${port}` });

    const res = await request(app)
      .post("/v1/chat/completions")
      .set("Authorization", "Bearer gateway-token")
      .send({ model: "openclaw/default", messages: [{ role: "user", content: "hi" }] });

    expect(res.status).toBe(200);
    expect(res.headers["set-cookie"]).toBeUndefined();
  });

  it("forwards OpenAI-compatible model list paths", async () => {
    const seenUrls = [];
    upstream = http.createServer((req, res) => {
      seenUrls.push(req.url);
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ data: [] }));
    });
    const port = await listen(upstream);
    const app = createApp({ gatewayUrl: `http://127.0.0.1:${port}` });

    const res = await request(app)
      .get("/v1/models/openclaw%2Fdefault")
      .set("Authorization", "Bearer gateway-token");

    expect(res.status).toBe(200);
    expect(seenUrls).toEqual(["/v1/models/openclaw%2Fdefault"]);
  });
});
