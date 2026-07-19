const fs = require("fs");
const Module = require("module");

const { createChatWsService } = require("../../lib/server/chat-ws");

// Fake `ws` implementations let us exercise gateway-socket edge cases that a
// real websocket can never produce deterministically: a socket whose
// readyState goes stale right after connect, error events without an Error
// instance, falsy message frames, and close() calls that throw.
const createFakeSocketClass = (script) =>
  class FakeGatewaySocket {
    constructor() {
      this.readyState = 1;
      this.listeners = {};
      this.closeImpl = () => {};
      queueMicrotask(() => script(this));
    }
    on(event, handler) {
      (this.listeners[event] ||= []).push(handler);
      return this;
    }
    dispatch(event, ...args) {
      for (const handler of this.listeners[event] || []) handler(...args);
    }
    reply(frame) {
      this.dispatch("message", JSON.stringify(frame));
    }
    send(rawData) {
      const frame = JSON.parse(String(rawData));
      if (this.onFrame) this.onFrame(frame);
    }
    close() {
      this.closeImpl();
    }
  };

class FakeWebSocketServer {
  constructor() {}
  on(event, handler) {
    if (event === "connection") FakeWebSocketServer.connectionHandler = handler;
  }
  emit() {}
  handleUpgrade() {}
}

const createServiceWithFakeWs = (SocketClass) => {
  const originalLoad = Module._load;
  Module._load = function (request, ...rest) {
    if (request === "ws") {
      return { WebSocketServer: FakeWebSocketServer, WebSocket: SocketClass };
    }
    return originalLoad.call(this, request, ...rest);
  };
  try {
    return createChatWsService({
      fs,
      openclawDir: "/tmp",
      getGatewayPort: () => 1,
    });
  } finally {
    Module._load = originalLoad;
  }
};

describe("server/chat-ws fake gateway sockets", () => {
  it("rejects requests when the connected socket is not open", async () => {
    const SocketClass = createFakeSocketClass((socket) => {
      socket.readyState = 3;
      socket.onFrame = (frame) => {
        if (frame.method === "connect") {
          queueMicrotask(() =>
            socket.reply({
              type: "res",
              id: frame.id,
              ok: true,
              payload: { type: "hello-ok" },
            }),
          );
        }
      };
      socket.reply({ type: "event", event: "connect.challenge" });
    });
    const service = createServiceWithFakeWs(SocketClass);
    await expect(service.fetchHistory("s")).rejects.toThrow(
      "OpenClaw gateway is not connected",
    );
  });

  it("falls back to a generic error message for empty socket errors", async () => {
    const SocketClass = createFakeSocketClass((socket) => {
      socket.dispatch("error", "");
    });
    const service = createServiceWithFakeWs(SocketClass);
    await expect(service.fetchHistory("s")).rejects.toThrow(
      "OpenClaw gateway websocket failed",
    );
  });

  it("tolerates falsy frames, id-less responses, and throwing close", async () => {
    const SocketClass = createFakeSocketClass((socket) => {
      socket.dispatch("message", undefined);
      socket.dispatch("message", "");
      socket.onFrame = (frame) => {
        if (frame.method === "connect") {
          queueMicrotask(() => {
            socket.reply({ type: "res", ok: true, payload: {} });
            socket.reply({
              type: "res",
              id: frame.id,
              ok: true,
              payload: { type: "hello-ok" },
            });
          });
          return;
        }
        if (frame.method === "chat.history") {
          queueMicrotask(() =>
            socket.reply({
              type: "res",
              id: frame.id,
              ok: true,
              payload: { messages: [] },
            }),
          );
        }
      };
      socket.reply({ type: "event", event: "connect.challenge" });
    });
    const service = createServiceWithFakeWs(SocketClass);
    await expect(service.fetchHistory("s")).resolves.toEqual({
      messages: [],
      rawHistory: { messages: [] },
    });
  });

  it("swallows close() failures after a declined connect", async () => {
    const SocketClass = createFakeSocketClass((socket) => {
      socket.closeImpl = () => {
        throw new Error("already closed");
      };
      socket.onFrame = (frame) => {
        if (frame.method === "connect") {
          queueMicrotask(() =>
            socket.reply({
              type: "res",
              id: frame.id,
              ok: false,
              error: { message: "denied" },
            }),
          );
        }
      };
      socket.reply({ type: "event", event: "connect.challenge" });
    });
    const service = createServiceWithFakeWs(SocketClass);
    await expect(service.fetchHistory("s")).rejects.toThrow("denied");
  });

  it("ignores falsy browser frames from upgraded connections", () => {
    const SocketClass = createFakeSocketClass(() => {});
    createServiceWithFakeWs(SocketClass);
    const connectionHandler = FakeWebSocketServer.connectionHandler;
    expect(typeof connectionHandler).toBe("function");
    const listeners = {};
    const fakeBrowserWs = {
      readyState: 1,
      on: (event, handler) => {
        listeners[event] = handler;
      },
      send: vi.fn(),
    };
    connectionHandler(fakeBrowserWs);
    listeners.message(undefined);
    listeners.message("");
    expect(fakeBrowserWs.send).not.toHaveBeenCalled();
  });
});
