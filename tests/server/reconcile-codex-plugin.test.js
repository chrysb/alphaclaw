const {
  getPinnedOpenclawVersion,
  reconcileCodexPlugin,
} = require("../../lib/scripts/reconcile-codex-plugin");

describe("scripts/reconcile-codex-plugin", () => {
  it("replaces a stale persisted Codex plugin with the pinned OpenClaw version", () => {
    const exec = vi
      .fn()
      .mockReturnValueOnce(
        JSON.stringify({
          plugins: [
            {
              id: "codex",
              origin: "global",
              version: "2026.5.28",
            },
          ],
        }),
      )
      .mockReturnValueOnce("");

    const result = reconcileCodexPlugin({ exec, logger: { log: vi.fn() } });

    expect(result).toEqual({
      changed: true,
      previousVersion: "2026.5.28",
      version: getPinnedOpenclawVersion(),
    });
    expect(exec).toHaveBeenLastCalledWith(
      "openclaw",
      [
        "plugins",
        "install",
        `@openclaw/codex@${getPinnedOpenclawVersion()}`,
        "--force",
      ],
      expect.objectContaining({ stdio: "inherit" }),
    );
  });

  it("is a no-op when the installed plugin matches the pin", () => {
    const version = getPinnedOpenclawVersion();
    const exec = vi.fn().mockReturnValue(
      JSON.stringify({
        plugins: [{ id: "codex", origin: "global", version }],
      }),
    );

    expect(reconcileCodexPlugin({ exec })).toEqual({
      changed: false,
      reason: "current",
      version,
    });
    expect(exec).toHaveBeenCalledOnce();
  });

  it("does not install Codex for users who do not already have it", () => {
    const exec = vi.fn().mockReturnValue(JSON.stringify({ plugins: [] }));

    expect(reconcileCodexPlugin({ exec })).toEqual({
      changed: false,
      reason: "not-installed",
    });
    expect(exec).toHaveBeenCalledOnce();
  });
});
