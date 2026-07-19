const fs = require("fs");
const Module = require("module");

const { createChatWsService } = require("../../lib/server/chat-ws");

describe("server/chat-ws without the ws dependency", () => {
  it("degrades to a 503 upgrade handler and a failing history fetch", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    // Simulate a deployment where the optional `ws` dependency cannot be
    // loaded, tripping the try/catch in createChatWsService.
    const originalLoad = Module._load;
    Module._load = function (request, ...rest) {
      if (request === "ws") {
        throw new Error("Cannot find module 'ws'");
      }
      return originalLoad.call(this, request, ...rest);
    };
    let service;
    try {
      service = createChatWsService({ fs, openclawDir: "/tmp" });
    } finally {
      Module._load = originalLoad;
    }

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("chat websocket disabled: missing ws dependency"),
    );

    const socket = { write: vi.fn(), destroy: vi.fn() };
    service.handleUpgrade({}, socket);
    expect(socket.write).toHaveBeenCalledWith(
      expect.stringContaining("503 Service Unavailable"),
    );
    expect(socket.destroy).toHaveBeenCalled();

    await expect(service.fetchHistory("s")).rejects.toThrow(
      "Chat websocket unavailable",
    );
    warnSpy.mockRestore();
  });
});
