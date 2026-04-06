const fs = require("fs");
const os = require("os");
const path = require("path");

const {
  applyPendingOpenclawUpdate,
  buildPendingOpenclawInstallSpec,
} = require("../../lib/server/pending-openclaw-update");

describe("server/pending-openclaw-update", () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "openclaw-pending-"));
  });

  afterEach(() => {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {}
  });

  it("builds the install spec from an explicit marker spec", () => {
    expect(
      buildPendingOpenclawInstallSpec({
        spec: "openclaw@1.1.0",
        to: "1.0.9",
      }),
    ).toBe("openclaw@1.1.0");
  });

  it("falls back to the marker version when spec is not present", () => {
    expect(buildPendingOpenclawInstallSpec({ to: "1.1.0" })).toBe(
      "openclaw@1.1.0",
    );
  });

  it("falls back to latest for legacy or invalid markers", () => {
    expect(buildPendingOpenclawInstallSpec({})).toBe("openclaw@latest");
  });

  it("installs the pending update with a real npm install command and clears the marker", () => {
    const runtimeDir = path.join(tmpDir, ".openclaw-runtime");
    const markerPath = path.join(tmpDir, ".openclaw-update-pending");
    fs.writeFileSync(
      markerPath,
      JSON.stringify({
        from: "1.0.9",
        to: "1.1.0",
        spec: "openclaw@1.1.0",
        ts: Date.now(),
      }),
    );
    const execSyncImpl = vi.fn();

    const result = applyPendingOpenclawUpdate({
      execSyncImpl,
      fsModule: fs,
      installDir: runtimeDir,
      logger: { log: vi.fn() },
      markerPath,
    });

    expect(result).toEqual({
      attempted: true,
      installed: true,
      spec: "openclaw@1.1.0",
    });
    expect(execSyncImpl).toHaveBeenCalledTimes(1);
    expect(execSyncImpl.mock.calls[0][0]).toBe(
      "npm install 'openclaw@1.1.0' --omit=dev --no-save --save=false --package-lock=false --prefer-online",
    );
    expect(execSyncImpl.mock.calls[0][1]).toEqual({
      cwd: expect.stringMatching(new RegExp(`^${runtimeDir.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}-pending-[^/]+$`)),
      stdio: "inherit",
      timeout: 180000,
    });
    expect(
      JSON.parse(fs.readFileSync(path.join(runtimeDir, "package.json"), "utf8")),
    ).toEqual({
      name: "alphaclaw-openclaw-runtime",
      private: true,
    });
    expect(fs.existsSync(markerPath)).toBe(false);
  });

  it("keeps the existing runtime in place when the pending install fails", () => {
    const runtimeDir = path.join(tmpDir, ".openclaw-runtime");
    const markerPath = path.join(tmpDir, ".openclaw-update-pending");
    fs.writeFileSync(markerPath, "{not-json");
    fs.mkdirSync(runtimeDir, { recursive: true });
    fs.writeFileSync(
      path.join(runtimeDir, "package.json"),
      JSON.stringify({ name: "existing-runtime", private: true }),
    );
    const execSyncImpl = vi.fn(() => {
      throw new Error("boom");
    });

    const result = applyPendingOpenclawUpdate({
      execSyncImpl,
      fsModule: fs,
      installDir: runtimeDir,
      logger: { log: vi.fn() },
      markerPath,
    });

    expect(result.attempted).toBe(true);
    expect(result.installed).toBe(false);
    expect(
      JSON.parse(fs.readFileSync(path.join(runtimeDir, "package.json"), "utf8")),
    ).toEqual({
      name: "existing-runtime",
      private: true,
    });
    expect(fs.existsSync(markerPath)).toBe(false);
  });

  it("removes the marker and reports failure when npm install throws", () => {
    const runtimeDir = path.join(tmpDir, ".openclaw-runtime");
    const markerPath = path.join(tmpDir, ".openclaw-update-pending");
    fs.writeFileSync(markerPath, "{not-json");
    const execSyncImpl = vi.fn(() => {
      throw new Error("boom");
    });

    const result = applyPendingOpenclawUpdate({
      execSyncImpl,
      fsModule: fs,
      installDir: runtimeDir,
      logger: { log: vi.fn() },
      markerPath,
    });

    expect(result.attempted).toBe(true);
    expect(result.installed).toBe(false);
    expect(result.spec).toBe("openclaw@latest");
    expect(result.error).toBeInstanceOf(Error);
    expect(fs.existsSync(markerPath)).toBe(false);
  });
});
