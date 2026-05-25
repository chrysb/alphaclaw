const { replayParsedJsonBody } = require("../../lib/server/proxy-body-replay");

describe("server/proxy-body-replay", () => {
  it("replays parsed JSON bodies into proxied mutating requests", () => {
    const proxyReq = {
      setHeader: vi.fn(),
      write: vi.fn(),
    };

    const replayed = replayParsedJsonBody(proxyReq, {
      method: "PUT",
      headers: { "content-type": "application/json; charset=utf-8" },
      body: { from: "welcome", to: "identity" },
    });

    expect(replayed).toBe(true);
    expect(proxyReq.setHeader).toHaveBeenCalledWith("content-type", "application/json");
    expect(proxyReq.setHeader).toHaveBeenCalledWith("content-length", "34");
    expect(proxyReq.write).toHaveBeenCalledWith(
      Buffer.from('{"from":"welcome","to":"identity"}'),
    );
  });

  it("does not replay GET requests or non-JSON bodies", () => {
    const proxyReq = {
      setHeader: vi.fn(),
      write: vi.fn(),
    };

    expect(
      replayParsedJsonBody(proxyReq, {
        method: "GET",
        headers: { "content-type": "application/json" },
        body: { ok: true },
      }),
    ).toBe(false);
    expect(
      replayParsedJsonBody(proxyReq, {
        method: "POST",
        headers: { "content-type": "text/plain" },
        body: "hello",
      }),
    ).toBe(false);
    expect(proxyReq.write).not.toHaveBeenCalled();
  });
});
