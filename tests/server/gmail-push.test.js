const http = require("http");
const {
  createGmailPushHandler,
  createGmailPushEventDeduper,
  createPushEventDedupeKey,
} = require("../../lib/server/gmail-push");

const encodeEnvelope = ({ emailAddress, historyId, messageId = "" }) =>
  Buffer.from(
    JSON.stringify({
      message: {
        ...(messageId ? { messageId } : {}),
        data: Buffer.from(
          JSON.stringify({
            emailAddress,
            historyId,
          }),
          "utf8",
        ).toString("base64"),
      },
    }),
    "utf8",
  );

const createMockResponse = () => {
  const response = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
    send(payload) {
      this.body = payload;
      return this;
    },
  };
  return response;
};

describe("server/gmail-push dedupe", () => {
  it("ignores duplicate deliveries by Pub/Sub messageId", async () => {
    let proxyCalls = 0;
    const markPushReceived = vi.fn();
    const handler = createGmailPushHandler({
      resolvePushToken: () => "secret",
      resolveTargetByEmail: () => ({ accountId: "acct-1", port: 18801 }),
      markPushReceived,
      shouldProcessPushEvent: createGmailPushEventDeduper({ ttlMs: 24 * 60 * 60 * 1000 }),
      proxyPushToServeImpl: async () => {
        proxyCalls += 1;
        return { statusCode: 204, body: "" };
      },
    });
    const req = {
      query: { token: "secret" },
      headers: { "content-type": "application/json" },
      body: encodeEnvelope({
        messageId: "pubsub-message-1",
        emailAddress: "agent@example.com",
        historyId: "1001",
      }),
    };

    const firstRes = createMockResponse();
    await handler(req, firstRes);
    const secondRes = createMockResponse();
    await handler(req, secondRes);

    expect(firstRes.statusCode).toBe(204);
    expect(secondRes.statusCode).toBe(200);
    expect(secondRes.body).toEqual({
      ok: true,
      ignored: true,
      reason: "duplicate_event",
    });
    expect(proxyCalls).toBe(1);
    expect(markPushReceived).toHaveBeenCalledTimes(1);
  });

  it("allows Pub/Sub retries after downstream non-2xx responses", async () => {
    let proxyCalls = 0;
    const markPushReceived = vi.fn();
    const handler = createGmailPushHandler({
      resolvePushToken: () => "secret",
      resolveTargetByEmail: () => ({ accountId: "acct-1", port: 18801 }),
      markPushReceived,
      shouldProcessPushEvent: createGmailPushEventDeduper({ ttlMs: 24 * 60 * 60 * 1000 }),
      proxyPushToServeImpl: async () => {
        proxyCalls += 1;
        if (proxyCalls === 1) {
          return { statusCode: 500, body: "retry me" };
        }
        return { statusCode: 204, body: "" };
      },
    });
    const req = {
      query: { token: "secret" },
      headers: { "content-type": "application/json" },
      body: encodeEnvelope({
        messageId: "pubsub-message-retry",
        emailAddress: "agent@example.com",
        historyId: "1002",
      }),
    };

    const firstRes = createMockResponse();
    await handler(req, firstRes);
    const secondRes = createMockResponse();
    await handler(req, secondRes);

    expect(firstRes.statusCode).toBe(500);
    expect(firstRes.body).toBe("retry me");
    expect(secondRes.statusCode).toBe(204);
    expect(proxyCalls).toBe(2);
    expect(markPushReceived).toHaveBeenCalledTimes(1);
  });

  it("falls back to email+historyId dedupe when messageId is missing", async () => {
    let proxyCalls = 0;
    const handler = createGmailPushHandler({
      resolvePushToken: () => "secret",
      resolveTargetByEmail: () => ({ accountId: "acct-1", port: 18801 }),
      markPushReceived: vi.fn(),
      shouldProcessPushEvent: createGmailPushEventDeduper({ ttlMs: 24 * 60 * 60 * 1000 }),
      proxyPushToServeImpl: async () => {
        proxyCalls += 1;
        return { statusCode: 200, body: "ok" };
      },
    });

    const firstReq = {
      query: { token: "secret" },
      headers: { "content-type": "application/json" },
      body: encodeEnvelope({
        emailAddress: "agent@example.com",
        historyId: "4242",
      }),
    };
    const secondReq = {
      ...firstReq,
      body: encodeEnvelope({
        emailAddress: "agent@example.com",
        historyId: "4242",
      }),
    };

    const firstRes = createMockResponse();
    await handler(firstReq, firstRes);
    const secondRes = createMockResponse();
    await handler(secondReq, secondRes);

    expect(firstRes.statusCode).toBe(200);
    expect(secondRes.statusCode).toBe(200);
    expect(secondRes.body).toEqual({
      ok: true,
      ignored: true,
      reason: "duplicate_event",
    });
    expect(proxyCalls).toBe(1);
  });
});

describe("server/gmail-push dedupe internals", () => {
  it("builds dedupe keys from envelope and payload fields", () => {
    expect(
      createPushEventDedupeKey({
        envelope: { message: { messageId: "m-1" } },
        payload: {},
      }),
    ).toBe("msg:m-1");
    expect(
      createPushEventDedupeKey({
        envelope: { message: { message_id: "m-2" } },
        payload: {},
      }),
    ).toBe("msg:m-2");
    expect(
      createPushEventDedupeKey({
        envelope: {},
        payload: { emailAddress: " User@Example.com ", historyId: 42 },
      }),
    ).toBe("hist:user@example.com:42");
    expect(
      createPushEventDedupeKey({ envelope: {}, payload: { historyId: 42 } }),
    ).toBe("hist:42");
    expect(createPushEventDedupeKey({ envelope: {}, payload: {} })).toBe("");
  });

  it("expires seen events after the ttl window", () => {
    const dedupe = createGmailPushEventDeduper({ ttlMs: 1000 });
    const event = {
      envelope: { message: { messageId: "ttl-1" } },
      payload: {},
    };
    dedupe.markProcessed({ ...event, receivedAt: 1000 });
    expect(dedupe({ ...event, receivedAt: 1500 })).toBe(false);
    expect(dedupe({ ...event, receivedAt: 2500 })).toBe(true);
  });

  it("stops pruning at the first non-expired entry", () => {
    const dedupe = createGmailPushEventDeduper({ ttlMs: 1000 });
    const older = { envelope: { message: { messageId: "old" } }, payload: {} };
    const newer = { envelope: { message: { messageId: "new" } }, payload: {} };
    dedupe.markProcessed({ ...older, receivedAt: 1000 });
    dedupe.markProcessed({ ...newer, receivedAt: 1900 });
    expect(dedupe({ ...older, receivedAt: 2500 })).toBe(true);
    expect(dedupe({ ...newer, receivedAt: 2500 })).toBe(false);
  });

  it("evicts the oldest entries beyond maxEntries", () => {
    const dedupe = createGmailPushEventDeduper({
      ttlMs: 60_000,
      maxEntries: 2,
    });
    const eventFor = (id) => ({
      envelope: { message: { messageId: id } },
      payload: {},
    });
    dedupe.markProcessed({ ...eventFor("a"), receivedAt: 1000 });
    dedupe.markProcessed({ ...eventFor("b"), receivedAt: 1001 });
    dedupe.markProcessed({ ...eventFor("c"), receivedAt: 1002 });
    expect(dedupe({ ...eventFor("a"), receivedAt: 1003 })).toBe(true);
    expect(dedupe({ ...eventFor("b"), receivedAt: 1003 })).toBe(false);
    expect(dedupe({ ...eventFor("c"), receivedAt: 1003 })).toBe(false);
  });

  it("always processes events without a dedupe key", () => {
    const dedupe = createGmailPushEventDeduper({ ttlMs: 1000 });
    const anonymous = { envelope: {}, payload: {} };
    expect(dedupe.markProcessed({ ...anonymous, receivedAt: 1000 })).toBe(true);
    expect(dedupe({ ...anonymous, receivedAt: 1000 })).toBe(true);
  });

  it("falls back to the current time for non-finite receivedAt values", () => {
    const dedupe = createGmailPushEventDeduper({ ttlMs: 60_000 });
    const event = { envelope: { message: { messageId: "nan" } }, payload: {} };
    expect(dedupe.markProcessed({ ...event, receivedAt: NaN })).toBe(true);
    expect(dedupe({ ...event, receivedAt: NaN })).toBe(false);
  });
});

describe("server/gmail-push handler guards", () => {
  it("rejects requests with a missing or mismatched push token", async () => {
    const proxy = vi.fn();
    const cases = [
      { resolvePushToken: () => "", query: { token: "anything" } },
      { resolvePushToken: () => "secret", query: {} },
      { resolvePushToken: () => "secret", query: { token: "wrong" } },
    ];
    for (const testCase of cases) {
      const handler = createGmailPushHandler({
        resolvePushToken: testCase.resolvePushToken,
        resolveTargetByEmail: () => ({ accountId: "a", port: 1 }),
        markPushReceived: vi.fn(),
        proxyPushToServeImpl: proxy,
      });
      const res = createMockResponse();
      await handler(
        { query: testCase.query, headers: {}, body: encodeEnvelope({}) },
        res,
      );
      expect(res.statusCode).toBe(401);
      expect(res.body).toEqual({ ok: false, error: "Invalid push token" });
    }
    expect(proxy).not.toHaveBeenCalled();
  });

  it("ignores envelopes without an email address", async () => {
    const handler = createGmailPushHandler({
      resolvePushToken: () => "secret",
      resolveTargetByEmail: () => ({ accountId: "a", port: 1 }),
      markPushReceived: vi.fn(),
      proxyPushToServeImpl: vi.fn(),
    });
    const res = createMockResponse();
    await handler(
      {
        query: { token: "secret" },
        headers: {},
        body: JSON.stringify({ message: {} }),
      },
      res,
    );
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ ok: true, ignored: true, reason: "missing_email" });
  });

  it("ignores pushes for accounts without an enabled watch", async () => {
    const handler = createGmailPushHandler({
      resolvePushToken: () => "secret",
      resolveTargetByEmail: () => null,
      markPushReceived: vi.fn(),
      proxyPushToServeImpl: vi.fn(),
    });
    const res = createMockResponse();
    await handler(
      {
        query: { token: "secret" },
        headers: {},
        body: encodeEnvelope({ emailAddress: "x@y.com", historyId: "1" }),
      },
      res,
    );
    expect(res.body).toEqual({
      ok: true,
      ignored: true,
      reason: "watch_not_enabled",
    });
  });

  it("ignores pushes when no target resolver is configured", async () => {
    const handler = createGmailPushHandler({
      resolvePushToken: () => "secret",
      markPushReceived: vi.fn(),
      proxyPushToServeImpl: vi.fn(),
    });
    const res = createMockResponse();
    await handler(
      {
        query: { token: "secret" },
        headers: {},
        body: encodeEnvelope({ emailAddress: "x@y.com", historyId: "2" }),
      },
      res,
    );
    expect(res.body).toEqual({
      ok: true,
      ignored: true,
      reason: "watch_not_enabled",
    });
  });

  it("accepts plain-object request bodies", async () => {
    const proxy = vi.fn(async () => ({ statusCode: 200, body: "ok" }));
    const handler = createGmailPushHandler({
      resolvePushToken: () => "secret",
      resolveTargetByEmail: () => ({ accountId: "a", port: 1 }),
      proxyPushToServeImpl: proxy,
    });
    const res = createMockResponse();
    await handler(
      {
        query: { token: "secret" },
        headers: {},
        body: JSON.parse(
          String(
            encodeEnvelope({ emailAddress: "obj@y.com", historyId: "3" }),
          ),
        ),
      },
      res,
    );
    expect(res.statusCode).toBe(200);
    expect(res.body).toBe("ok");
    expect(proxy).toHaveBeenCalledTimes(1);
  });

  it("responds with proxy_error when the downstream proxy fails", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const handler = createGmailPushHandler({
      resolvePushToken: () => "secret",
      resolveTargetByEmail: () => ({ accountId: "a", port: 1 }),
      markPushReceived: vi.fn(),
      proxyPushToServeImpl: async () => {
        throw new Error("boom");
      },
    });
    const res = createMockResponse();
    await handler(
      {
        query: { token: "secret" },
        headers: {},
        body: encodeEnvelope({ emailAddress: "x@y.com", historyId: "4" }),
      },
      res,
    );
    expect(res.body).toEqual({ ok: true, ignored: true, reason: "proxy_error" });
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining("Gmail push proxy error for x@y.com"),
    );
  });

  it("responds with handler_error for malformed envelopes", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const handler = createGmailPushHandler({
      resolvePushToken: () => "secret",
      resolveTargetByEmail: () => ({ accountId: "a", port: 1 }),
      markPushReceived: vi.fn(),
      proxyPushToServeImpl: vi.fn(),
    });
    for (const body of ["not json", undefined]) {
      const res = createMockResponse();
      await handler({ query: { token: "secret" }, headers: {}, body }, res);
      expect(res.body).toEqual({
        ok: true,
        ignored: true,
        reason: "handler_error",
      });
    }
    expect(errorSpy).toHaveBeenCalled();
  });
});

describe("server/gmail-push default proxy", () => {
  let server = null;

  afterEach(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
      server = null;
    }
  });

  const startEchoServer = async () =>
    await new Promise((resolve) => {
      const echo = http.createServer((req, res) => {
        const chunks = [];
        req.on("data", (chunk) => chunks.push(chunk));
        req.on("end", () => {
          res.statusCode = 200;
          res.end(`echoed:${Buffer.concat(chunks).length}`);
        });
      });
      echo.listen(0, "127.0.0.1", () => resolve(echo));
    });

  it("proxies pushes to the local serve port using the real http client", async () => {
    server = await startEchoServer();
    const port = server.address().port;
    const markPushReceived = vi.fn();
    const handler = createGmailPushHandler({
      resolvePushToken: () => "secret",
      resolveTargetByEmail: () => ({ accountId: "acct-9", port }),
      markPushReceived,
    });
    const body = encodeEnvelope({
      messageId: "real-proxy-1",
      emailAddress: "real@example.com",
      historyId: "9001",
    });
    const res = createMockResponse();
    await handler({ query: { token: "secret" }, headers: {}, body }, res);
    expect(res.statusCode).toBe(200);
    expect(res.body).toBe(`echoed:${body.length}`);
    expect(markPushReceived).toHaveBeenCalledWith({
      accountId: "acct-9",
      at: expect.any(Number),
    });
  });

  it("reports proxy_error when the serve port is closed", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const closed = await startEchoServer();
    const port = closed.address().port;
    await new Promise((resolve) => closed.close(resolve));
    const handler = createGmailPushHandler({
      resolvePushToken: () => "secret",
      resolveTargetByEmail: () => ({ accountId: "acct-9", port }),
      markPushReceived: vi.fn(),
    });
    const res = createMockResponse();
    await handler(
      {
        query: { token: "secret" },
        headers: { "content-type": "application/json" },
        body: encodeEnvelope({
          messageId: "real-proxy-2",
          emailAddress: "real@example.com",
          historyId: "9002",
        }),
      },
      res,
    );
    expect(res.body).toEqual({ ok: true, ignored: true, reason: "proxy_error" });
    expect(errorSpy).toHaveBeenCalled();
  });
});
