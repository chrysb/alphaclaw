const http = require("http");
const express = require("express");
const request = require("supertest");

const { createWebhookMiddleware } = require("../../lib/server/webhook-middleware");

const createGatewaySpyServer = async ({ respond } = {}) => {
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
      if (typeof respond === "function") {
        respond(res);
        return;
      }
      res.statusCode = 200;
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify({ ok: true }));
    });
  });

  await new Promise((resolve) => {
    server.listen(0, "127.0.0.1", resolve);
  });

  const gatewayUrl = `http://127.0.0.1:${server.address().port}`;
  return { server, calls, gatewayUrl };
};

const createHookApp = ({
  gatewayUrl,
  getGatewayUrl,
  insertRequest = () => {},
  maxPayloadBytes = 1024 * 64,
  beforeMiddleware,
}) => {
  const app = express();
  if (beforeMiddleware) beforeMiddleware(app);
  app.use(["/hooks", "/webhook"], express.raw({ type: "*/*", limit: "5mb" }));
  app.use(
    createWebhookMiddleware({
      gatewayUrl,
      getGatewayUrl,
      insertRequest,
      maxPayloadBytes,
    }),
  );
  return app;
};

const closeServer = (server) => new Promise((resolve) => server.close(resolve));

describe("server/webhook-middleware coverage", () => {
  describe("gmail dedupe", () => {
    it("filters previously seen gmail messages inside payload envelopes", async () => {
      const { server, calls, gatewayUrl } = await createGatewaySpyServer();
      const app = createHookApp({ gatewayUrl });
      const send = (body) =>
        request(app)
          .post("/hooks/gmail")
          .set("content-type", "application/json")
          .send(JSON.stringify(body));

      try {
        const first = await send({
          payload: {
            account: "User@Example.com ",
            messages: [{ id: "m1" }, { messageId: "m2" }, { subject: "no id" }],
          },
        });
        expect(first.status).toBe(200);
        expect(calls).toHaveLength(1);
        expect(JSON.parse(calls[0].bodyText).payload.messages).toHaveLength(3);

        const second = await send({
          payload: {
            account: "user@example.com",
            messages: [{ id: "m1" }, { messageId: "m2" }, { subject: "no id" }],
          },
        });
        expect(second.status).toBe(200);
        expect(calls).toHaveLength(2);
        const forwarded = JSON.parse(calls[1].bodyText);
        expect(forwarded.payload.messages).toEqual([{ subject: "no id" }]);

        const third = await send({
          payload: {
            account: "user@example.com",
            messages: [{ id: "m1" }, { messageId: "m2" }],
          },
        });
        expect(third.status).toBe(200);
        expect(third.body).toEqual({ ok: true, deduped: true });
        expect(calls).toHaveLength(2);
      } finally {
        await closeServer(server);
      }
    });

    it("filters seen gmail messages for flat payload bodies", async () => {
      const { server, calls, gatewayUrl } = await createGatewaySpyServer();
      const app = createHookApp({ gatewayUrl });
      const send = (body) =>
        request(app)
          .post("/hooks/gmail")
          .set("content-type", "application/json")
          .send(JSON.stringify(body));

      try {
        await send({ email: "a@b.c", messages: [{ id: "x1" }, { id: "x2" }] });
        const second = await send({
          email: "a@b.c",
          messages: [{ id: "x1" }, { id: "x3" }],
        });
        expect(second.status).toBe(200);
        expect(calls).toHaveLength(2);
        expect(JSON.parse(calls[1].bodyText)).toEqual({
          email: "a@b.c",
          messages: [{ id: "x3" }],
        });
      } finally {
        await closeServer(server);
      }
    });

    it("forwards gmail bodies without messages or with non-JSON payloads", async () => {
      const { server, calls, gatewayUrl } = await createGatewaySpyServer();
      const app = createHookApp({ gatewayUrl });

      try {
        const noMessages = await request(app)
          .post("/hooks/gmail")
          .set("content-type", "application/json")
          .send(JSON.stringify({ inbox: "a", messages: [] }));
        expect(noMessages.status).toBe(200);

        const nonJson = await request(app)
          .post("/hooks/gmail")
          .set("content-type", "text/plain")
          .send("plain notification");
        expect(nonJson.status).toBe(200);
        expect(calls).toHaveLength(2);
        expect(calls[1].bodyText).toBe("plain notification");
      } finally {
        await closeServer(server);
      }
    });

    it("prunes stale gmail dedupe entries after the TTL", async () => {
      const { server, calls, gatewayUrl } = await createGatewaySpyServer();
      const app = createHookApp({ gatewayUrl });
      const send = (body) =>
        request(app)
          .post("/hooks/gmail")
          .set("content-type", "application/json")
          .send(JSON.stringify(body));
      const realNow = Date.now();
      const nowSpy = vi.spyOn(Date, "now");

      try {
        nowSpy.mockReturnValue(realNow);
        await send({ account: "p", messages: [{ id: "t1" }] });
        expect(calls).toHaveLength(1);

        // Move past the 24h TTL so t1 gets pruned on next cleanup.
        nowSpy.mockReturnValue(realNow + 25 * 60 * 60 * 1000);
        await send({ account: "p", messages: [{ id: "t2" }] });
        expect(calls).toHaveLength(2);

        // Same timestamp: prune early-returns, t1 was already pruned.
        await send({ account: "p", messages: [{ id: "t1" }] });
        expect(calls).toHaveLength(3);
        expect(JSON.parse(calls[2].bodyText).messages).toEqual([{ id: "t1" }]);
      } finally {
        nowSpy.mockRestore();
        await closeServer(server);
      }
    });
  });

  describe("body extraction", () => {
    it("forwards string bodies set by earlier middleware", async () => {
      const { server, calls, gatewayUrl } = await createGatewaySpyServer();
      const app = express();
      app.use((req, _res, next) => {
        req.body = "string-body";
        next();
      });
      app.use(
        createWebhookMiddleware({
          gatewayUrl,
          insertRequest: () => {},
          maxPayloadBytes: 1024,
        }),
      );

      try {
        const res = await request(app).post("/hooks/custom");
        expect(res.status).toBe(200);
        expect(calls).toHaveLength(1);
        expect(calls[0].bodyText).toBe("string-body");
      } finally {
        await closeServer(server);
      }
    });

    it("serializes object bodies from JSON middleware", async () => {
      const { server, calls, gatewayUrl } = await createGatewaySpyServer();
      const app = express();
      app.use(express.json());
      app.use(
        createWebhookMiddleware({
          gatewayUrl,
          insertRequest: () => {},
          maxPayloadBytes: 1024,
        }),
      );

      try {
        const res = await request(app)
          .post("/hooks/custom")
          .send({ hello: "world" });
        expect(res.status).toBe(200);
        expect(JSON.parse(calls[0].bodyText)).toEqual({ hello: "world" });
      } finally {
        await closeServer(server);
      }
    });

    it("keeps raw body when JSON body is an array and query params exist", async () => {
      const { server, calls, gatewayUrl } = await createGatewaySpyServer();
      const app = createHookApp({ gatewayUrl });

      try {
        const res = await request(app)
          .post("/hooks/custom?a=1")
          .set("content-type", "application/json")
          .send(JSON.stringify([1, 2, 3]));
        expect(res.status).toBe(200);
        expect(calls[0].bodyText).toBe("[1,2,3]");
      } finally {
        await closeServer(server);
      }
    });

    it("keeps raw body when body is not JSON and query params exist", async () => {
      const { server, calls, gatewayUrl } = await createGatewaySpyServer();
      const app = createHookApp({ gatewayUrl });

      try {
        const res = await request(app)
          .post("/hooks/custom?a=1")
          .set("content-type", "text/plain")
          .send("not json");
        expect(res.status).toBe(200);
        expect(calls[0].bodyText).toBe("not json");
      } finally {
        await closeServer(server);
      }
    });

    it("builds a JSON body from query params when no body parser ran", async () => {
      const { server, calls, gatewayUrl } = await createGatewaySpyServer();
      const app = express();
      app.use(
        createWebhookMiddleware({
          gatewayUrl,
          insertRequest: () => {},
          maxPayloadBytes: 1024,
        }),
      );

      try {
        const res = await request(app).get("/hooks/no-parser?a=1&b=2");
        expect(res.status).toBe(200);
        expect(JSON.parse(calls[0].bodyText)).toEqual({ a: "1", b: "2" });
        expect(calls[0].headers["content-type"]).toBe("application/json");
      } finally {
        await closeServer(server);
      }
    });

    it("collects repeated query params into arrays", async () => {
      const { server, calls, gatewayUrl } = await createGatewaySpyServer();
      const app = createHookApp({ gatewayUrl });

      try {
        const res = await request(app).get("/hooks/custom?a=1&a=2&a=3&b=solo");
        expect(res.status).toBe(200);
        expect(JSON.parse(calls[0].bodyText)).toEqual({
          a: ["1", "2", "3"],
          b: "solo",
        });
      } finally {
        await closeServer(server);
      }
    });
  });

  describe("hook name resolution and path rewriting", () => {
    it("resolves hook names from route params", async () => {
      const { server, gatewayUrl } = await createGatewaySpyServer();
      const logged = [];
      const middleware = createWebhookMiddleware({
        gatewayUrl,
        insertRequest: (entry) => logged.push(entry),
        maxPayloadBytes: 1024,
      });
      const app = express();
      app.use((req, res) => {
        req.params = { path: "param-hook/sub" };
        middleware(req, res);
      });

      try {
        const res = await request(app).get("/hooks/ignored");
        expect(res.status).toBe(200);
        await vi.waitFor(() => expect(logged).toHaveLength(1));
        expect(logged[0].hookName).toBe("param-hook");
      } finally {
        await closeServer(server);
      }
    });

    it("resolves hook names from wildcard params", async () => {
      const { server, gatewayUrl } = await createGatewaySpyServer();
      const logged = [];
      const middleware = createWebhookMiddleware({
        gatewayUrl,
        insertRequest: (entry) => logged.push(entry),
        maxPayloadBytes: 1024,
      });
      const app = express();
      app.use((req, res) => {
        req.params = { 0: "zero-hook/x" };
        middleware(req, res);
      });

      try {
        await request(app).get("/hooks/ignored");
        await vi.waitFor(() => expect(logged).toHaveLength(1));
        expect(logged[0].hookName).toBe("zero-hook");
      } finally {
        await closeServer(server);
      }
    });

    it("resolves hook names from star params", async () => {
      const { server, gatewayUrl } = await createGatewaySpyServer();
      const logged = [];
      const middleware = createWebhookMiddleware({
        gatewayUrl,
        insertRequest: (entry) => logged.push(entry),
        maxPayloadBytes: 1024,
      });
      const app = express();
      app.use((req, res) => {
        req.params = { "*": "star%2Dhook/x" };
        middleware(req, res);
      });

      try {
        await request(app).get("/hooks/ignored");
        await vi.waitFor(() => expect(logged).toHaveLength(1));
        expect(logged[0].hookName).toBe("star-hook");
      } finally {
        await closeServer(server);
      }
    });

    it("rewrites /webhook paths to /hooks for the gateway", async () => {
      const { server, calls, gatewayUrl } = await createGatewaySpyServer();
      const logged = [];
      const app = createHookApp({
        gatewayUrl,
        insertRequest: (entry) => logged.push(entry),
      });

      try {
        const res = await request(app).post("/webhook/legacy?x=1").send();
        expect(res.status).toBe(200);
        expect(calls[0].url).toBe("/hooks/legacy?x=1");
        await vi.waitFor(() => expect(logged).toHaveLength(1));
        expect(logged[0].hookName).toBe("legacy");
      } finally {
        await closeServer(server);
      }
    });

    it("leaves non-hook paths untouched with an empty hook name", async () => {
      const { server, calls, gatewayUrl } = await createGatewaySpyServer();
      const logged = [];
      const app = express();
      app.use(
        createWebhookMiddleware({
          gatewayUrl,
          insertRequest: (entry) => logged.push(entry),
          maxPayloadBytes: 1024,
        }),
      );

      try {
        const res = await request(app).get("/other/path");
        expect(res.status).toBe(200);
        expect(calls[0].url).toBe("/other/path");
        await vi.waitFor(() => expect(logged).toHaveLength(1));
        expect(logged[0].hookName).toBe("");
      } finally {
        await closeServer(server);
      }
    });

    it("resolves the gateway URL lazily via getGatewayUrl", async () => {
      const { server, calls, gatewayUrl } = await createGatewaySpyServer();
      const app = createHookApp({
        gatewayUrl: "http://127.0.0.1:9",
        getGatewayUrl: () => gatewayUrl,
      });

      try {
        const res = await request(app).get("/hooks/lazy");
        expect(res.status).toBe(200);
        expect(calls).toHaveLength(1);
      } finally {
        await closeServer(server);
      }
    });
  });

  describe("payload and response truncation", () => {
    it("truncates logged request payloads beyond maxPayloadBytes", async () => {
      const { server, gatewayUrl } = await createGatewaySpyServer();
      const logged = [];
      const app = createHookApp({
        gatewayUrl,
        insertRequest: (entry) => logged.push(entry),
        maxPayloadBytes: 16,
      });

      try {
        const bigBody = "z".repeat(64);
        const res = await request(app)
          .post("/hooks/big")
          .set("content-type", "text/plain")
          .send(bigBody);
        expect(res.status).toBe(200);
        await vi.waitFor(() => expect(logged).toHaveLength(1));
        expect(logged[0].payload).toBe("z".repeat(16));
        expect(logged[0].payloadTruncated).toBe(true);
        expect(logged[0].payloadSize).toBe(64);
      } finally {
        await closeServer(server);
      }
    });

    it("truncates oversized gateway responses in the request log", async () => {
      const { server, gatewayUrl } = await createGatewaySpyServer({
        respond: (res) => {
          res.statusCode = 200;
          res.write("0123456789");
          res.write("A".repeat(40));
          res.write("tail-chunk");
          res.end();
        },
      });
      const logged = [];
      const app = createHookApp({
        gatewayUrl,
        insertRequest: (entry) => logged.push(entry),
        maxPayloadBytes: 16,
      });

      try {
        const res = await request(app).get("/hooks/big-response");
        expect(res.status).toBe(200);
        expect(res.text).toBe("0123456789" + "A".repeat(40) + "tail-chunk");
        await vi.waitFor(() => expect(logged).toHaveLength(1));
        expect(logged[0].gatewayBody).toBe(
          "0123456789" + "A".repeat(6) + "\n[TRUNCATED]",
        );
        expect(logged[0].gatewayStatus).toBe(200);
      } finally {
        await closeServer(server);
      }
    });

    it("logs a console error when insertRequest throws on success", async () => {
      const { server, gatewayUrl } = await createGatewaySpyServer();
      const consoleError = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const app = createHookApp({
        gatewayUrl,
        insertRequest: () => {
          throw new Error("db unavailable");
        },
      });

      try {
        const res = await request(app).get("/hooks/logfail");
        expect(res.status).toBe(200);
        await vi.waitFor(() =>
          expect(consoleError).toHaveBeenCalledWith(
            "[webhook] failed to write request log:",
            "db unavailable",
          ),
        );
      } finally {
        await closeServer(server);
      }
    });
  });

  describe("gateway errors", () => {
    it("returns 502 and logs when the gateway is unreachable over https", async () => {
      const logged = [];
      const app = createHookApp({
        gatewayUrl: "https://127.0.0.1:1",
        insertRequest: (entry) => logged.push(entry),
      });

      const res = await request(app)
        .post("/hooks/down")
        .set("content-type", "application/json")
        .send(JSON.stringify({ ping: true }));

      expect(res.status).toBe(502);
      expect(res.body).toEqual({ error: "Gateway unavailable" });
      expect(logged).toHaveLength(1);
      expect(logged[0].gatewayStatus).toBe(502);
      expect(logged[0].hookName).toBe("down");
      expect(typeof logged[0].gatewayBody).toBe("string");
    });

    it("swallows insertRequest failures during gateway errors", async () => {
      const app = createHookApp({
        gatewayUrl: "http://127.0.0.1:1",
        insertRequest: () => {
          throw new Error("log write failed");
        },
      });

      const res = await request(app).get("/hooks/down");
      expect(res.status).toBe(502);
      expect(res.body).toEqual({ error: "Gateway unavailable" });
    });
  });
});
