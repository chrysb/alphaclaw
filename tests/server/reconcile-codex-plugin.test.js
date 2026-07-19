const Module = require("module");
const childProcess = require("child_process");

const {
  getInstalledCodexPlugin,
  getPinnedOpenclawVersion,
  reconcileCodexPlugin,
} = require("../../lib/scripts/reconcile-codex-plugin");

const modulePath = require.resolve("../../lib/scripts/reconcile-codex-plugin");

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

  it("treats an unavailable openclaw CLI as not installed", () => {
    const exec = vi.fn(() => {
      throw new Error("spawn openclaw ENOENT");
    });

    expect(getInstalledCodexPlugin({ exec })).toBe(null);
    expect(reconcileCodexPlugin({ exec })).toEqual({
      changed: false,
      reason: "not-installed",
    });
  });

  it("skips reconciliation when the openclaw pin is missing", () => {
    const pkg = require("../../package.json");
    const originalPin = pkg.dependencies.openclaw;
    pkg.dependencies.openclaw = "";
    try {
      const exec = vi.fn();
      expect(reconcileCodexPlugin({ exec })).toEqual({
        changed: false,
        reason: "missing-pin",
      });
      expect(exec).not.toHaveBeenCalled();
    } finally {
      pkg.dependencies.openclaw = originalPin;
    }
  });

  it("runs reconciliation when executed as the main module and warns on failure", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "log").mockImplementation(() => {});
    const originalExecFileSync = childProcess.execFileSync;
    const originalMainModule = process.mainModule;
    const cachedModule = require.cache[modulePath];
    childProcess.execFileSync = vi
      .fn()
      .mockReturnValueOnce(
        JSON.stringify({
          plugins: [{ id: "codex", origin: "global", version: "0.0.1" }],
        }),
      )
      .mockImplementationOnce(() => {
        throw new Error("install blew up");
      });

    try {
      delete require.cache[modulePath];
      Module._load(modulePath, null, true);

      expect(childProcess.execFileSync).toHaveBeenCalledTimes(2);
      expect(warnSpy).toHaveBeenCalledWith(
        "[alphaclaw] Codex plugin reconciliation warning: install blew up",
      );
    } finally {
      process.mainModule = originalMainModule;
      childProcess.execFileSync = originalExecFileSync;
      delete require.cache[modulePath];
      if (cachedModule) require.cache[modulePath] = cachedModule;
    }
  });
});
