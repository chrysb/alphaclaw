const loadCodexOauthWindow = async () =>
  import("../../lib/public/js/lib/codex-oauth-window.js");

describe("frontend/codex-oauth-window", () => {
  beforeEach(() => {
    vi.resetModules();
    global.window = {
      open: vi.fn(),
      location: { href: "http://localhost/" },
    };
  });

  it("uses popup features when opening Codex auth", async () => {
    global.window.open.mockReturnValue({ closed: false });
    const mod = await loadCodexOauthWindow();

    const opened = mod.openCodexAuthWindow();

    expect(global.window.open).toHaveBeenCalledWith(
      "/auth/codex/start",
      "codex-auth",
      "popup=yes,width=640,height=780",
    );
    expect(opened).toBeTruthy();
  });

  it("falls back to navigating the current page when opening fails", async () => {
    global.window.open.mockReturnValue(null);
    const mod = await loadCodexOauthWindow();

    const opened = mod.openCodexAuthWindow();

    expect(opened).toBeNull();
    expect(global.window.location.href).toBe("/auth/codex/start");
  });

  it("detects automatic localhost callback messages", async () => {
    const mod = await loadCodexOauthWindow();

    expect(
      mod.isCodexAuthCallbackMessage({
        codex: "callback-input",
        input: "http://localhost:1455/auth/callback?code=abc&state=def",
      }),
    ).toBe(true);
    expect(mod.isCodexAuthCallbackMessage({ codex: "success" })).toBe(false);
    expect(
      mod.isCodexAuthCallbackMessage({
        codex: "callback-input",
        input: "   ",
      }),
    ).toBe(false);
  });
});
