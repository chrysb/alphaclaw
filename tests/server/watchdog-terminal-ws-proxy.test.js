const { rewriteOpenClawProxyUrl } = require("../../lib/server/watchdog-terminal-ws");

describe("OpenClaw WebSocket proxy path", () => {
  it("rewrites the mounted root to the gateway root", () => {
    expect(rewriteOpenClawProxyUrl(new URL("http://example.test/openclaw"))).toBe("/");
  });

  it("preserves nested paths and query strings", () => {
    expect(rewriteOpenClawProxyUrl(new URL("http://example.test/openclaw/ws?token=x"))).toBe("/ws?token=x");
  });

  it("leaves unrelated websocket paths alone", () => {
    expect(rewriteOpenClawProxyUrl(new URL("http://example.test/api/ws/chat"))).toBeNull();
  });
});
