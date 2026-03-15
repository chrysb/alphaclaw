const http = require("http");
const express = require("express");
const request = require("supertest");

const { createWebhookMiddleware } = require("../../lib/server/webhook-middleware");

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
  const gatewayUrl = `http://127.0.0.1:${address.port}`;
  return { server, calls, gatewayUrl };
};

const createHookApp = ({ gatewayUrl, insertRequest = () => {} }) => {
  const app = express();
  app.use(["/hooks", "/webhook"], express.raw({ type: "*/*", limit: "5mb" }));
  app.use(
    createWebhookMiddleware({
      gatewayUrl,
      insertRequest,
      maxPayloadBytes: 1024 * 64,
    }),
  );
  return app;
};

describe("server/webhook-middleware", () => {
  it("maps hook query params into forwarded JSON body", async () => {
    const { server, calls, gatewayUrl } = await createGatewaySpyServer();
    const app = createHookApp({ gatewayUrl });

    try {
      const response = await request(app).get(
        "/hooks/schwab-oauth?code=AUTH_CODE&session=SESSION_ID",
      );
      expect(response.status).toBe(200);
      expect(calls).toHaveLength(1);
      expect(calls[0].url).toBe("/hooks/schwab-oauth?code=AUTH_CODE&session=SESSION_ID");
      expect(calls[0].headers["content-type"]).toContain("application/json");
      expect(JSON.parse(calls[0].bodyText)).toEqual({
        code: "AUTH_CODE",
        session: "SESSION_ID",
      });
    } finally {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  it("keeps explicit JSON body values over query params", async () => {
    const { server, calls, gatewayUrl } = await createGatewaySpyServer();
    const app = createHookApp({ gatewayUrl });

    try {
      const response = await request(app)
        .post("/hooks/schwab-oauth?code=AUTH_CODE&session=SESSION_ID")
        .set("content-type", "application/json")
        .send(
          JSON.stringify({
            code: "BODY_CODE",
            extra: "from-body",
          }),
        );
      expect(response.status).toBe(200);
      expect(calls).toHaveLength(1);
      expect(JSON.parse(calls[0].bodyText)).toEqual({
        code: "BODY_CODE",
        session: "SESSION_ID",
        extra: "from-body",
      });
    } finally {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  it("redacts oauth-style secrets in stored payload logs", async () => {
    const { server, calls, gatewayUrl } = await createGatewaySpyServer();
    const loggedRequests = [];
    const app = createHookApp({
      gatewayUrl,
      insertRequest: (entry) => loggedRequests.push(entry),
    });

    try {
      const response = await request(app).get(
        "/hooks/schwab-oauth?code=AUTH_CODE&session=SESSION_ID&refresh_token=REFRESH_TOKEN",
      );
      expect(response.status).toBe(200);
      expect(calls).toHaveLength(1);
      expect(JSON.parse(calls[0].bodyText)).toEqual({
        code: "AUTH_CODE",
        session: "SESSION_ID",
        refresh_token: "REFRESH_TOKEN",
      });

      expect(loggedRequests).toHaveLength(1);
      expect(JSON.parse(loggedRequests[0].payload)).toEqual({
        code: "[REDACTED]",
        session: "SESSION_ID",
        refresh_token: "[REDACTED]",
      });
    } finally {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  it("moves query token into authorization header without body logging leak", async () => {
    const { server, calls, gatewayUrl } = await createGatewaySpyServer();
    const loggedRequests = [];
    const app = createHookApp({
      gatewayUrl,
      insertRequest: (entry) => loggedRequests.push(entry),
    });

    try {
      const response = await request(app).get("/hooks/schwab-oauth?token=SECRET_TOKEN");
      expect(response.status).toBe(200);
      expect(calls).toHaveLength(1);
      expect(calls[0].headers.authorization).toBe("Bearer SECRET_TOKEN");
      expect(calls[0].url).toBe("/hooks/schwab-oauth");
      expect(calls[0].bodyText).toBe("{}");

      expect(loggedRequests).toHaveLength(1);
      expect(loggedRequests[0].headers.authorization).toBeUndefined();
      expect(loggedRequests[0].payload).toBe("{}");
    } finally {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  it("drops query token when authorization header already exists", async () => {
    const { server, calls, gatewayUrl } = await createGatewaySpyServer();
    const loggedRequests = [];
    const app = createHookApp({
      gatewayUrl,
      insertRequest: (entry) => loggedRequests.push(entry),
    });

    try {
      const response = await request(app)
        .get("/hooks/schwab-oauth?token=SECRET_TOKEN&session=SESSION_ID")
        .set("authorization", "Bearer HEADER_TOKEN");
      expect(response.status).toBe(200);
      expect(calls).toHaveLength(1);
      expect(calls[0].headers.authorization).toBe("Bearer HEADER_TOKEN");
      expect(calls[0].url).toBe("/hooks/schwab-oauth?session=SESSION_ID");
      expect(JSON.parse(calls[0].bodyText)).toEqual({
        session: "SESSION_ID",
      });

      expect(loggedRequests).toHaveLength(1);
      expect(loggedRequests[0].headers.authorization).toBe("[REDACTED]");
      expect(JSON.parse(loggedRequests[0].payload)).toEqual({
        session: "SESSION_ID",
      });
    } finally {
      await new Promise((resolve) => server.close(resolve));
    }
  });
});
