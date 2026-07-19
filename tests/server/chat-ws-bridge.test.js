const fs = require("fs");
const http = require("http");
const os = require("os");
const path = require("path");
const { WebSocketServer, WebSocket } = require("ws");

const { createChatWsService } = require("../../lib/server/chat-ws");

const waitUntil = async (fn, label = "condition") => {
  const startedAt = Date.now();
  while (!fn()) {
    if (Date.now() - startedAt > 5000) {
      throw new Error(`timed out waiting for ${label}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
};

describe("server/chat-ws bridge", () => {
  let originalGatewayToken;
  let cleanups;

  beforeEach(() => {
    originalGatewayToken = process.env.OPENCLAW_GATEWAY_TOKEN;
    cleanups = [];
  });

  afterEach(async () => {
    vi.useRealTimers();
    while (cleanups.length) {
      const fn = cleanups.pop();
      try {
        await fn();
      } catch {
        // best-effort cleanup
      }
    }
    if (originalGatewayToken === undefined) {
      delete process.env.OPENCLAW_GATEWAY_TOKEN;
    } else {
      process.env.OPENCLAW_GATEWAY_TOKEN = originalGatewayToken;
    }
    delete process.env.ALPHACLAW_TEST_GW_TOKEN;
  });

  const startGatewayHarness = async ({
    connectResponse = null,
    garbageFirst = false,
  } = {}) => {
    const wss = new WebSocketServer({ host: "127.0.0.1", port: 0 });
    await new Promise((resolve) => wss.once("listening", resolve));
    const harness = {
      wss,
      socket: null,
      connectCount: 0,
      lastConnectParams: null,
      requests: [],
      onRequest: null,
      port: wss.address().port,
      emit(payload) {
        this.socket.send(JSON.stringify(payload));
      },
      respond(id, payload) {
        this.socket.send(JSON.stringify({ type: "res", id, ok: true, payload }));
      },
      fail(id, error) {
        this.socket.send(
          JSON.stringify({ type: "res", id, ok: false, ...(error ? { error } : {}) }),
        );
      },
    };
    wss.on("connection", (socket) => {
      harness.socket = socket;
      socket.on("message", (rawData) => {
        let frame;
        try {
          frame = JSON.parse(String(rawData || ""));
        } catch {
          return;
        }
        if (frame.method === "connect") {
          harness.connectCount += 1;
          harness.lastConnectParams = frame.params;
          if (connectResponse) {
            socket.send(
              JSON.stringify({ ...connectResponse, type: "res", id: frame.id }),
            );
          } else {
            harness.respond(frame.id, { type: "hello-ok" });
          }
          return;
        }
        harness.requests.push(frame);
        if (harness.onRequest) harness.onRequest(frame, socket);
      });
      if (garbageFirst) {
        socket.send("this is not json");
        socket.send("42");
        socket.send('"just a string"');
        socket.send(JSON.stringify({ type: "weird" }));
        socket.send(JSON.stringify({ type: "event", event: "health" }));
      }
      socket.send(JSON.stringify({ type: "event", event: "connect.challenge" }));
    });
    cleanups.push(async () => {
      for (const client of wss.clients) {
        try {
          client.terminate();
        } catch {}
      }
      await new Promise((resolve) => wss.close(resolve));
    });
    return harness;
  };

  const createService = (portOrHarness, { config } = {}) => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "alphaclaw-chat-ws-bridge-"));
    cleanups.push(() => fs.rmSync(tempDir, { recursive: true, force: true }));
    if (config !== undefined) {
      fs.writeFileSync(path.join(tempDir, "openclaw.json"), JSON.stringify(config));
    }
    return createChatWsService({
      fs,
      openclawDir: tempDir,
      getGatewayPort: () =>
        typeof portOrHarness === "number" ? portOrHarness : portOrHarness.port,
    });
  };

  const openBrowser = async (service) => {
    const server = http.createServer((req, res) => {
      res.statusCode = 404;
      res.end();
    });
    server.on("upgrade", (request, socket, head) => {
      service.handleUpgrade(request, socket, head);
    });
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    cleanups.push(() => new Promise((resolve) => server.close(resolve)));
    const client = new WebSocket(`ws://127.0.0.1:${server.address().port}`);
    const messages = [];
    const listeners = new Set();
    client.on("message", (rawData) => {
      messages.push(JSON.parse(String(rawData || "")));
      for (const listener of [...listeners]) listener();
    });
    await new Promise((resolve, reject) => {
      client.once("open", resolve);
      client.once("error", reject);
    });
    cleanups.push(() => {
      try {
        client.terminate();
      } catch {}
    });
    const waitFor = (predicate, label = "message") =>
      new Promise((resolve, reject) => {
        const check = () => {
          const found = messages.find(predicate);
          if (found) {
            clearTimeout(timer);
            listeners.delete(check);
            resolve(found);
          }
        };
        const timer = setTimeout(() => {
          listeners.delete(check);
          reject(
            new Error(`timed out waiting for ${label}; saw ${JSON.stringify(messages)}`),
          );
        }, 5000);
        listeners.add(check);
        check();
      });
    return {
      client,
      messages,
      waitFor,
      send: (payload) => client.send(JSON.stringify(payload)),
      sendRaw: (raw) => client.send(raw),
      close: () => client.close(),
    };
  };

  const respondEmptyHistory = (harness) => (frame) => {
    if (frame.method === "chat.history") {
      harness.respond(frame.id, { messages: [] });
    }
  };

  describe("gateway auth token resolution", () => {
    it("uses a plain config token when no env token is set", async () => {
      delete process.env.OPENCLAW_GATEWAY_TOKEN;
      const harness = await startGatewayHarness();
      harness.onRequest = respondEmptyHistory(harness);
      const service = createService(harness, {
        config: { gateway: { auth: { token: "plain-token" } } },
      });
      await service.fetchHistory("agent:main:main");
      expect(harness.lastConnectParams.auth.token).toBe("plain-token");
    });

    it("resolves ${ENV} config token references", async () => {
      delete process.env.OPENCLAW_GATEWAY_TOKEN;
      process.env.ALPHACLAW_TEST_GW_TOKEN = "resolved-token";
      const harness = await startGatewayHarness();
      harness.onRequest = respondEmptyHistory(harness);
      const service = createService(harness, {
        config: { gateway: { auth: { token: "${ALPHACLAW_TEST_GW_TOKEN}" } } },
      });
      await service.fetchHistory("agent:main:main");
      expect(harness.lastConnectParams.auth.token).toBe("resolved-token");
    });

    it("falls back to an empty token when nothing is configured", async () => {
      delete process.env.OPENCLAW_GATEWAY_TOKEN;
      const harness = await startGatewayHarness();
      harness.onRequest = respondEmptyHistory(harness);
      const service = createService(harness);
      await service.fetchHistory("agent:main:main");
      expect(harness.lastConnectParams.auth.token).toBe("");
    });
  });

  describe("gateway connection handling", () => {
    it("ignores unparseable and non-request gateway frames before connecting", async () => {
      const harness = await startGatewayHarness({ garbageFirst: true });
      harness.onRequest = respondEmptyHistory(harness);
      const service = createService(harness);
      const history = await service.fetchHistory("agent:main:main");
      expect(history.messages).toEqual([]);
    });

    it("shares one connect across concurrent requests and reuses the socket", async () => {
      const harness = await startGatewayHarness();
      harness.onRequest = respondEmptyHistory(harness);
      const service = createService(harness);
      await Promise.all([service.fetchHistory("a"), service.fetchHistory("b")]);
      await service.fetchHistory("c");
      expect(harness.connectCount).toBe(1);
    });

    it("rejects when the gateway declines the connect request", async () => {
      const harness = await startGatewayHarness({
        connectResponse: { ok: false, error: { message: "unauthorized token" } },
      });
      const service = createService(harness);
      await expect(service.fetchHistory("x")).rejects.toThrow("unauthorized token");
    });

    it("rejects when the gateway hello payload is not hello-ok", async () => {
      const harness = await startGatewayHarness({
        connectResponse: { ok: true, payload: { type: "hello-weird" } },
      });
      const service = createService(harness);
      await expect(service.fetchHistory("x")).rejects.toThrow(
        "OpenClaw gateway connect failed",
      );
    });

    it("rejects with a connection error when the gateway port is closed", async () => {
      const probe = new WebSocketServer({ host: "127.0.0.1", port: 0 });
      await new Promise((resolve) => probe.once("listening", resolve));
      const deadPort = probe.address().port;
      await new Promise((resolve) => probe.close(resolve));
      const service = createService(deadPort);
      await expect(service.fetchHistory("x")).rejects.toThrow(/ECONNREFUSED|failed/i);
    });

    it("rejects pending requests when the gateway disconnects mid-request", async () => {
      const harness = await startGatewayHarness();
      harness.onRequest = (frame, socket) => {
        socket.close(1000, "bye");
      };
      const service = createService(harness);
      await expect(service.fetchHistory("x")).rejects.toThrow(/Gateway disconnected/);
    });

    it("ignores stray response ids while settling the matching request", async () => {
      const harness = await startGatewayHarness();
      harness.onRequest = (frame) => {
        harness.socket.send(
          JSON.stringify({ type: "res", id: "stray-id", ok: true, payload: {} }),
        );
        harness.respond(frame.id, { messages: [{ role: "user", content: "ok" }] });
      };
      const service = createService(harness);
      const history = await service.fetchHistory("x");
      expect(history.messages).toEqual([
        expect.objectContaining({ role: "user", content: "ok" }),
      ]);
    });

    it("rejects using the error code when no message is present", async () => {
      const harness = await startGatewayHarness();
      harness.onRequest = (frame) => harness.fail(frame.id, { code: "E_NOPE" });
      const service = createService(harness);
      await expect(service.fetchHistory("x")).rejects.toThrow("E_NOPE");
    });

    it("rejects with a generic error when the failure has no details", async () => {
      const harness = await startGatewayHarness();
      harness.onRequest = (frame) => harness.fail(frame.id);
      const service = createService(harness);
      await expect(service.fetchHistory("x")).rejects.toThrow("Gateway request failed");
    });

    it("times out gateway requests that never resolve", async () => {
      const harness = await startGatewayHarness();
      let silent = false;
      harness.onRequest = (frame) => {
        if (!silent) harness.respond(frame.id, { messages: [] });
      };
      const service = createService(harness);
      await service.fetchHistory("warm-up");
      silent = true;
      vi.useFakeTimers();
      const pending = service.fetchHistory("slow");
      const expectation = expect(pending).rejects.toThrow(/timed out after 12000ms/);
      await vi.advanceTimersByTimeAsync(12001);
      await expectation;
      vi.useRealTimers();
    });
  });

  describe("history parsing", () => {
    it("returns empty history without a session key", async () => {
      const service = createService(0);
      await expect(service.fetchHistory("")).resolves.toEqual({
        messages: [],
        rawHistory: null,
      });
      await expect(service.fetchHistory()).resolves.toEqual({
        messages: [],
        rawHistory: null,
      });
    });

    it("normalizes transcript rows, tool calls, and metadata", async () => {
      const rawHistory = {
        messages: [
          { role: "user", content: "[telegram] hello there", timestamp: 1700000000000 },
          {
            role: "assistant",
            timestamp: "2024-01-02T03:04:05.000Z",
            api: "anthropic",
            provider: "anthropic",
            model: "claude-x",
            stopReason: "end_turn",
            thinkingLevel: "high",
            senderLabel: "   ",
            runId: "run-9",
            inputTokens: "12",
            outputTokens: 0,
            totalTokens: 34,
            cacheCreationInputTokens: 5,
            cacheReadInputTokens: "not-a-number",
            content: [
              { type: "text", text: "line1\r\nline2\n\n\n\nline3" },
              { type: "thinking", thinking: "hidden" },
              { type: "tool_result", text: "hidden too" },
              {
                type: "toolCall",
                id: "tc-1",
                name: "exec",
                arguments: { cmd: "ls" },
                partialJson: "",
              },
              { type: "toolCall", name: "noid" },
              { type: "toolCall" },
            ],
          },
          {
            role: "toolResult",
            toolCallId: "tc-1",
            content: [{ type: "text", text: "done" }],
          },
          { role: "toolResult", content: [] },
          { role: "assistant", content: "   " },
          { author: "human", text: { unknownWrapper: { deep: ["deep text"] } } },
          { role: "assistant", message: { parts: [{ type: "text", text: "via parts" }] } },
          { role: "SomethingUserish", content: { value: "value text" } },
          { role: "assistant", content: { output: "output text", input: "input text" } },
        ],
      };
      const harness = await startGatewayHarness();
      harness.onRequest = (frame) => harness.respond(frame.id, rawHistory);
      const service = createService(harness);
      const { messages, rawHistory: echoed } = await service.fetchHistory("s");

      expect(echoed).toEqual(rawHistory);
      expect(messages.map((m) => [m.role, m.content])).toEqual([
        ["user", "hello there"],
        ["assistant", "line1\nline2\n\nline3"],
        ["tool", "Tool call: exec"],
        ["tool", "Tool call: noid"],
        ["user", "deep text"],
        ["assistant", "via parts"],
        ["user", "value text"],
        ["assistant", "output textinput text"],
      ]);
      expect(messages[0].timestamp).toBe(1700000000000);
      expect(messages[0].metadata).toBeNull();
      expect(messages[1].timestamp).toBe(Date.parse("2024-01-02T03:04:05.000Z"));
      expect(messages[1].metadata).toEqual({
        api: "anthropic",
        provider: "anthropic",
        model: "claude-x",
        stopReason: "end_turn",
        thinkingLevel: "high",
        runId: "run-9",
        inputTokens: 12,
        totalTokens: 34,
        cacheCreationInputTokens: 5,
      });
      expect(messages[2].toolCalls).toEqual([
        { id: "tc-1", name: "exec", arguments: { cmd: "ls" }, partialJson: "" },
      ]);
      expect(messages[2].toolResult).toEqual(
        expect.objectContaining({ toolCallId: "tc-1" }),
      );
      expect(messages[3].toolCalls).toEqual([
        { id: "", name: "noid", arguments: null, partialJson: "" },
      ]);
      expect(messages[3].toolResult).toBeNull();
      expect(messages[4].timestamp).toBeGreaterThan(0);
    });

    it("accepts history, items, and empty payload variants", async () => {
      const responses = [
        { history: [{ role: "client", content: "c1" }] },
        { items: [{ role: "input", content: "i1" }] },
        {},
        null,
      ];
      const harness = await startGatewayHarness();
      harness.onRequest = (frame) => harness.respond(frame.id, responses.shift());
      const service = createService(harness);

      const fromHistory = await service.fetchHistory("s");
      expect(fromHistory.messages).toEqual([
        expect.objectContaining({ role: "user", content: "c1" }),
      ]);
      const fromItems = await service.fetchHistory("s");
      expect(fromItems.messages).toEqual([
        expect.objectContaining({ role: "user", content: "i1" }),
      ]);
      const fromEmpty = await service.fetchHistory("s");
      expect(fromEmpty.messages).toEqual([]);
      const fromNull = await service.fetchHistory("s");
      expect(fromNull).toEqual({ messages: [], rawHistory: null });
    });
  });

  describe("browser websocket protocol", () => {
    it("ignores malformed browser frames and still answers history", async () => {
      const harness = await startGatewayHarness();
      harness.onRequest = respondEmptyHistory(harness);
      const service = createService(harness);
      const browser = await openBrowser(service);
      browser.sendRaw("{{{ not json");
      browser.sendRaw("null");
      browser.sendRaw('"a string"');
      browser.send({ type: "unknown-kind" });
      browser.send({ type: "history" });
      const emptyHistory = await browser.waitFor(
        (m) => m.type === "history" && !m.sessionKey,
        "empty history",
      );
      expect(emptyHistory.messages).toEqual([]);
      browser.send({ type: "history", sessionKey: "s1" });
      const history = await browser.waitFor(
        (m) => m.type === "history" && m.sessionKey === "s1",
        "history",
      );
      expect(history.messages).toEqual([]);
      expect(history.rawHistory).toEqual({ messages: [] });
    });

    it("validates message and stop payloads", async () => {
      const service = createService(0);
      const browser = await openBrowser(service);
      browser.send({ type: "message", sessionKey: "s1" });
      const missingContent = await browser.waitFor(
        (m) => m.type === "error" && m.message.includes("required"),
        "missing content error",
      );
      expect(missingContent.message).toBe("sessionKey and content are required");
      browser.send({ type: "stop" });
      await browser.waitFor(
        (m) => m.type === "error" && m.message === "sessionKey is required",
        "missing stop session error",
      );
    });

    it.each([
      ["agent runtime not connected", "Agent runtime is not connected right now."],
      [
        "connect failed while dialing",
        "Could not connect to the OpenClaw gateway. Check that the gateway is running and reachable.",
      ],
      [
        "request timed out upstream",
        "The gateway did not respond in time. Try again after the gateway finishes starting.",
      ],
      [
        "unauthorized: bad credentials",
        "Gateway authentication failed. Verify OPENCLAW_GATEWAY_TOKEN matches the gateway.",
      ],
      [
        "protocol mismatch: need v4",
        "Chat cannot connect to the gateway (protocol version mismatch). Update AlphaClaw to match your OpenClaw version.",
      ],
      [
        "method not found: chat.history",
        "This gateway build does not support chat APIs. Update OpenClaw.",
      ],
      [null, "The gateway could not start this chat run. Check gateway logs."],
      ["some inexplicable kaboom", "Something went wrong. Please try again."],
    ])("sanitizes gateway error %j for browsers", async (rawMessage, expected) => {
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const harness = await startGatewayHarness();
      harness.onRequest = (frame) => {
        harness.fail(frame.id, rawMessage ? { message: rawMessage } : undefined);
      };
      const service = createService(harness);
      const browser = await openBrowser(service);
      browser.send({ type: "history", sessionKey: "s1" });
      const error = await browser.waitFor((m) => m.type === "error", "error");
      expect(error.message).toBe(expected);
      expect(error.sessionKey).toBe("s1");
      errorSpy.mockRestore();
    });

    it("reports a friendly error when the gateway is unreachable", async () => {
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const probe = new WebSocketServer({ host: "127.0.0.1", port: 0 });
      await new Promise((resolve) => probe.once("listening", resolve));
      const deadPort = probe.address().port;
      await new Promise((resolve) => probe.close(resolve));
      const service = createService(deadPort);
      const browser = await openBrowser(service);
      browser.send({ type: "message", sessionKey: "s1", content: "hi" });
      const error = await browser.waitFor((m) => m.type === "error", "error");
      expect(error.message).toBe(
        "Could not connect to the OpenClaw gateway. Check that the gateway is running and reachable.",
      );
      errorSpy.mockRestore();
    });

    it("errors when chat.send succeeds without a run id", async () => {
      const harness = await startGatewayHarness();
      harness.onRequest = (frame) => harness.respond(frame.id, {});
      const service = createService(harness);
      const browser = await openBrowser(service);
      browser.send({ type: "message", sessionKey: "s1", content: "hi" });
      const error = await browser.waitFor((m) => m.type === "error", "error");
      expect(error.message).toBe("Something went wrong connecting to the agent.");
      expect(error.sessionKey).toBe("s1");
    });
  });

  describe("agent event streaming", () => {
    const startRun = async ({ harness, browser, sessionKey, runId }) => {
      const previous = harness.onRequest;
      harness.onRequest = (frame) => {
        if (frame.method === "chat.send" && frame.params.sessionKey === sessionKey) {
          harness.respond(frame.id, { runId });
          harness.onRequest = previous;
          return;
        }
        if (previous) previous(frame);
      };
      browser.send({ type: "message", sessionKey, content: "go" });
      return browser.waitFor(
        (m) => m.type === "started" && m.sessionKey === sessionKey,
        `started ${sessionKey}`,
      );
    };

    it("streams tool phases, deltas, and lifecycle end", async () => {
      const harness = await startGatewayHarness();
      const service = createService(harness);
      const browser = await openBrowser(service);
      const started = await startRun({
        harness,
        browser,
        sessionKey: "s-tools",
        runId: "run-1",
      });
      expect(started.runId).toBe("run-1");

      harness.emit({
        type: "event",
        event: "agent",
        payload: {
          run: { id: "run-1" },
          stream: "tool",
          ts: 111,
          data: {
            phase: "start",
            name: "exec",
            toolCallId: "tc1",
            args: { cmd: "ls" },
          },
        },
      });
      harness.emit({
        type: "event",
        event: "agent",
        payload: {
          stream: "tool",
          data: {
            runId: "run-1",
            phase: "result",
            name: "exec",
            toolCallId: "tc1",
            result: { content: [{ type: "text", text: "out" }] },
            isError: false,
          },
        },
      });
      harness.emit({
        type: "event",
        event: "agent",
        payload: {
          runId: "run-1",
          stream: "tool",
          data: { phase: "delta", name: "exec", toolCallId: "tc1" },
        },
      });
      harness.emit({
        type: "event",
        event: "agent",
        payload: {
          runId: "run-1",
          stream: "tool",
          data: {
            phase: "result",
            name: "exec",
            toolCallId: "tc2",
            result: null,
            isError: true,
          },
        },
      });
      harness.emit({
        type: "event",
        event: "agent",
        payload: {
          stream: "assistant",
          data: { run: { id: "run-1" }, delta: "Hello " },
        },
      });
      harness.emit({
        type: "event",
        event: "agent",
        payload: {
          stream: "assistant",
          data: { runId: "run-1", delta: "", text: "world" },
        },
      });
      harness.emit({
        type: "event",
        event: "agent",
        payload: { stream: "assistant", data: { runId: "run-1", delta: "" } },
      });
      harness.emit({
        type: "event",
        event: "agent",
        payload: { runId: "run-1", stream: "tool", data: {} },
      });
      harness.emit({
        type: "event",
        event: "agent",
        payload: {
          meta: { runId: "run-1" },
          stream: "lifecycle",
          data: { phase: "end" },
        },
      });

      await browser.waitFor((m) => m.type === "done", "done");
      const toolMessages = browser.messages.filter((m) => m.type === "tool");
      expect(toolMessages).toHaveLength(3);
      expect(toolMessages[0]).toMatchObject({
        phase: "call",
        timestamp: 111,
        toolCall: {
          id: "tc1",
          name: "exec",
          arguments: { cmd: "ls" },
          partialJson: "",
        },
        toolResult: null,
      });
      expect(toolMessages[1]).toMatchObject({
        phase: "result",
        toolCall: null,
        toolResult: {
          role: "toolResult",
          toolCallId: "tc1",
          toolName: "exec",
          content: [{ type: "text", text: "out" }],
          isError: false,
        },
      });
      expect(toolMessages[2].toolResult).toMatchObject({
        toolCallId: "tc2",
        content: [],
        isError: true,
      });
      const chunks = browser.messages
        .filter((m) => m.type === "chunk")
        .map((m) => m.content);
      expect(chunks).toEqual(["Hello ", "world"]);
    });

    it("extracts tool calls and results from unknown event shapes", async () => {
      const harness = await startGatewayHarness();
      const service = createService(harness);
      const browser = await openBrowser(service);
      await startRun({ harness, browser, sessionKey: "s-shapes", runId: "run-2" });

      harness.emit({
        type: "event",
        event: "agent",
        payload: {
          runId: "run-2",
          stream: "weird",
          data: {
            content: [
              {
                type: "tool_call",
                toolCallId: "u1",
                toolName: "grep",
                args: { q: "x" },
              },
            ],
          },
        },
      });
      harness.emit({
        type: "event",
        event: "agent",
        payload: {
          runId: "run-2",
          stream: "weird",
          data: {
            part: {
              type: "toolResult",
              callId: "u1",
              name: "grep",
              content: [{ type: "text", text: "match" }],
            },
          },
        },
      });
      harness.emit({
        type: "event",
        event: "agent",
        payload: {
          runId: "run-2",
          stream: "weird",
          data: { toolCallId: "u2", status: "error", result: "boom" },
        },
      });
      harness.emit({
        type: "event",
        event: "agent",
        payload: {
          runId: "run-2",
          stream: "weird",
          data: [{ type: "toolcall", id: "u3", name: "ls" }],
        },
      });
      harness.emit({
        type: "event",
        event: "agent",
        payload: {
          runId: "run-2",
          stream: "weird",
          data: {
            role: "tool_result",
            toolCallId: "u4",
            content: [{ type: "text", text: "r2" }],
          },
        },
      });
      harness.emit({
        type: "event",
        event: "agent",
        payload: {
          runId: "run-2",
          stream: "weird",
          data: { part: { type: "toolcall", partialJson: "{" } },
        },
      });
      harness.emit({
        type: "event",
        event: "agent",
        payload: {
          runId: "run-2",
          stream: "lifecycle",
          data: { phase: "end" },
        },
      });

      await browser.waitFor((m) => m.type === "done", "done");
      const toolMessages = browser.messages.filter((m) => m.type === "tool");
      expect(toolMessages.map((m) => m.phase)).toEqual([
        "call",
        "result",
        "result",
        "call",
        "result",
      ]);
      expect(toolMessages[0].toolCall).toEqual({
        id: "u1",
        name: "grep",
        arguments: { q: "x" },
        partialJson: "",
      });
      expect(toolMessages[1].toolResult).toMatchObject({
        toolCallId: "u1",
        toolName: "grep",
        content: [{ type: "text", text: "match" }],
        isError: false,
      });
      expect(toolMessages[2].toolResult).toMatchObject({
        toolCallId: "u2",
        content: [{ type: "text", text: "boom" }],
        isError: true,
      });
      expect(toolMessages[3].toolCall).toMatchObject({ id: "u3", name: "ls" });
      expect(toolMessages[4].toolResult).toMatchObject({
        toolCallId: "u4",
        content: [{ type: "text", text: "r2" }],
        isError: false,
      });
    });

    it("routes events by session key, pending sends, buffered runs, and fallbacks", async () => {
      const harness = await startGatewayHarness();
      const service = createService(harness);
      const browser = await openBrowser(service);

      // While chat.send is in flight, session-key events reach the pending browser.
      harness.onRequest = (frame) => {
        if (frame.method === "chat.send") {
          harness.emit({
            type: "event",
            event: "agent",
            payload: {
              session: { key: "s3" },
              stream: "assistant",
              data: { delta: "early" },
            },
          });
          harness.respond(frame.id, { runId: "run-3" });
          harness.onRequest = null;
        }
      };
      browser.send({ type: "message", sessionKey: "s3", content: "hi" });
      await browser.waitFor((m) => m.type === "started", "started s3");
      await browser.waitFor(
        (m) => m.type === "chunk" && m.content === "early",
        "early chunk",
      );
      const earlyIndex = browser.messages.findIndex(
        (m) => m.type === "chunk" && m.content === "early",
      );
      const startedIndex = browser.messages.findIndex((m) => m.type === "started");
      expect(earlyIndex).toBeLessThan(startedIndex);

      // Session-key match against an active run target.
      harness.emit({
        type: "event",
        event: "agent",
        payload: {
          sessionKey: "s3",
          stream: "assistant",
          data: { delta: "later" },
        },
      });
      await browser.waitFor(
        (m) => m.type === "chunk" && m.content === "later",
        "later chunk",
      );

      // Lifecycle end resolved only by session key removes the run target.
      harness.emit({
        type: "event",
        event: "agent",
        payload: {
          stream: "lifecycle",
          data: { sessionKey: "s3", phase: "end" },
        },
      });
      await browser.waitFor((m) => m.type === "done", "done s3");

      // Events for a not-yet-registered run id are buffered until chat.send resolves.
      harness.onRequest = (frame) => {
        if (frame.method === "chat.send") {
          harness.emit({
            type: "event",
            event: "agent",
            payload: {
              runId: "run-4",
              stream: "assistant",
              data: { delta: "buffered" },
            },
          });
          harness.respond(frame.id, { runId: "run-4" });
          harness.onRequest = null;
        }
      };
      browser.send({ type: "message", sessionKey: "s4", content: "next" });
      await browser.waitFor(
        (m) => m.type === "chunk" && m.content === "buffered",
        "buffered chunk",
      );

      // With exactly one active run, id-less events fall back to it.
      harness.emit({
        type: "event",
        event: "agent",
        payload: { stream: "assistant", data: { delta: "solo" } },
      });
      await browser.waitFor(
        (m) => m.type === "chunk" && m.content === "solo",
        "solo chunk",
      );

      // Chat error events resolved by session key clear the run and notify.
      harness.emit({
        type: "event",
        event: "chat",
        payload: { meta: { sessionKey: "s4" }, state: "error" },
      });
      const chatError = await browser.waitFor((m) => m.type === "error", "chat error");
      expect(chatError.message).toBe("Something went wrong connecting to the agent.");
      expect(chatError.sessionKey).toBe("s4");

      // With no targets left, chat and agent events are dropped without crashing.
      harness.emit({ type: "event", event: "chat", payload: { state: "error" } });
      harness.emit({
        type: "event",
        event: "agent",
        payload: { stream: "assistant", data: { delta: "orphan" } },
      });
      harness.onRequest = respondEmptyHistory(harness);
      browser.send({ type: "history", sessionKey: "s4" });
      await browser.waitFor((m) => m.type === "history", "history round trip");
      expect(
        browser.messages.some((m) => m.type === "chunk" && m.content === "orphan"),
      ).toBe(false);
    });

    it("clears run targets on chat error events with run ids", async () => {
      const harness = await startGatewayHarness();
      const service = createService(harness);
      const browser = await openBrowser(service);
      await startRun({ harness, browser, sessionKey: "s5", runId: "run-5" });

      harness.emit({
        type: "event",
        event: "chat",
        payload: { runId: "run-5", state: "running" },
      });
      harness.emit({
        type: "event",
        event: "chat",
        payload: { runId: "run-5", state: "error" },
      });
      const error = await browser.waitFor((m) => m.type === "error", "error");
      expect(error.message).toBe("Something went wrong connecting to the agent.");
    });

    it("stops runs for a session and aborts on the gateway", async () => {
      const harness = await startGatewayHarness();
      const service = createService(harness);
      const browser = await openBrowser(service);
      await startRun({ harness, browser, sessionKey: "stop-a", runId: "run-a" });
      await startRun({ harness, browser, sessionKey: "stop-b", runId: "run-b" });

      harness.onRequest = (frame) => {
        if (frame.method === "chat.abort") harness.respond(frame.id, {});
      };
      browser.send({ type: "stop", sessionKey: "stop-a" });
      const done = await browser.waitFor(
        (m) => m.type === "done" && m.stopped === true,
        "stopped done",
      );
      expect(done.sessionKey).toBe("stop-a");
      const abort = harness.requests.find((f) => f.method === "chat.abort");
      expect(abort.params).toEqual({ sessionKey: "stop-a" });

      // A browser without tracked runs can still request a stop.
      const otherBrowser = await openBrowser(service);
      otherBrowser.send({ type: "stop", sessionKey: "stop-c" });
      await otherBrowser.waitFor(
        (m) => m.type === "done" && m.stopped === true,
        "other stopped done",
      );
    });

    it("cleans up run targets and pending sends when the browser disconnects", async () => {
      const harness = await startGatewayHarness();
      const service = createService(harness);
      const browser = await openBrowser(service);
      await startRun({ harness, browser, sessionKey: "gone-1", runId: "run-g1" });
      await startRun({ harness, browser, sessionKey: "gone-2", runId: "run-g2" });

      // Leave a chat.send pending so the session-pending map has an entry.
      let pendingSendFrame = null;
      harness.onRequest = (frame) => {
        if (frame.method === "chat.send") pendingSendFrame = frame;
      };
      browser.send({ type: "message", sessionKey: "gone-3", content: "hang" });
      await waitUntil(() => pendingSendFrame !== null, "pending chat.send");

      browser.close();
      await waitUntil(
        () => browser.client.readyState === WebSocket.CLOSED,
        "browser closed",
      );
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Settle the dangling request; the browser is gone so this is a no-op send.
      harness.fail(pendingSendFrame.id, { message: "too late" });

      // Events for the cleaned-up runs go nowhere but do not crash the bridge.
      harness.emit({
        type: "event",
        event: "agent",
        payload: {
          runId: "run-g1",
          stream: "assistant",
          data: { delta: "ghost" },
        },
      });

      harness.onRequest = respondEmptyHistory(harness);
      const survivor = await openBrowser(service);
      survivor.send({ type: "history", sessionKey: "still-alive" });
      const history = await survivor.waitFor((m) => m.type === "history", "history");
      expect(history.messages).toEqual([]);
    });
  });
});
