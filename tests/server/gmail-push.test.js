const {
  createGmailPushHandler,
  createGmailPushEventDeduper,
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
