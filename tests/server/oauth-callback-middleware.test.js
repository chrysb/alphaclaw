const http = require("http");
const express = require("express");
const request = require("supertest");

const { createWebhookMiddleware } = require("../../lib/server/webhook-middleware");
const {
  createOauthCallbackMiddleware,
} = require("../../lib/server/oauth-callback-middleware");

const createGatewaySpyServer = async () => {
  const calls = [];
  const server = http.createServer((req, res) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      calls.push({
        method: req.method,
        url: req.url,
        headers: req.headers,
        bodyText: Buffer.concat(chunks).toString("utf8"),
      });
      res.statusCode = 200;
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify({ ok: true }));
    });
  });

  await new Promise((resolve) => {
    server.listen(0, "127.0.0.1", resolve);
  });

  const address = server.address();
  return {
    server,
    calls,
    gatewayUrl: `http://127.0.0.1:${address.port}`,
  };
};

const createApp = ({
  gatewayUrl,
  getOauthCallbackById = () => null,
  markOauthCallbackUsed = () => {},
}) => {
  const app = express();
  app.use(["/hooks", "/webhook"], express.raw({ type: "*/*", limit: "5mb" }));
  const webhookMiddleware = createWebhookMiddleware({
    gatewayUrl,
    insertRequest: () => {},
    maxPayloadBytes: 64 * 1024,
  });
  const oauthCallbackMiddleware = createOauthCallbackMiddleware({
    getOauthCallbackById,
    markOauthCallbackUsed,
    webhookMiddleware,
  });
  app.all("/oauth/:id", oauthCallbackMiddleware);
  return app;
};

describe("server/oauth-callback-middleware", () => {
  it("returns 404 for unknown callback ids", async () => {
    const { server, calls, gatewayUrl } = await createGatewaySpyServer();
    const app = createApp({ gatewayUrl });

    try {
      const response = await request(app).get("/oauth/unknown-id?code=abc");
      expect(response.status).toBe(404);
      expect(calls).toHaveLength(0);
    } finally {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  it("rewrites oauth callback requests into POST hook calls with injected auth", async () => {
    const { server, calls, gatewayUrl } = await createGatewaySpyServer();
    const originalWebhookToken = process.env.WEBHOOK_TOKEN;
    process.env.WEBHOOK_TOKEN = "test-webhook-token";
    const app = createApp({
      gatewayUrl,
      getOauthCallbackById: (id) =>
        id === "abc123"
          ? { callbackId: "abc123", hookName: "schwab-oauth" }
          : null,
    });

    try {
      const response = await request(app).get("/oauth/abc123?code=AUTH&state=STATE");
      expect(response.status).toBe(200);
      expect(calls).toHaveLength(1);
      expect(calls[0].method).toBe("POST");
      expect(calls[0].url).toBe("/hooks/schwab-oauth?code=AUTH&state=STATE");
      expect(calls[0].headers.authorization).toBe("Bearer test-webhook-token");
      expect(JSON.parse(calls[0].bodyText)).toEqual({
        code: "AUTH",
        state: "STATE",
      });
    } finally {
      process.env.WEBHOOK_TOKEN = originalWebhookToken;
      await new Promise((resolve) => server.close(resolve));
    }
  });

  it("forwards requests without authorization header when WEBHOOK_TOKEN is missing", async () => {
    const { server, calls, gatewayUrl } = await createGatewaySpyServer();
    const originalWebhookToken = process.env.WEBHOOK_TOKEN;
    delete process.env.WEBHOOK_TOKEN;
    const app = createApp({
      gatewayUrl,
      getOauthCallbackById: (id) =>
        id === "abc123"
          ? { callbackId: "abc123", hookName: "schwab-oauth" }
          : null,
    });

    try {
      const response = await request(app).get("/oauth/abc123?code=AUTH");
      expect(response.status).toBe(200);
      expect(calls).toHaveLength(1);
      expect(calls[0].method).toBe("POST");
      expect(calls[0].headers.authorization).toBeUndefined();
    } finally {
      process.env.WEBHOOK_TOKEN = originalWebhookToken;
      await new Promise((resolve) => server.close(resolve));
    }
  });
});
