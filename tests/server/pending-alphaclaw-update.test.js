const fs = require("fs");
const os = require("os");
const path = require("path");

const {
  applyPendingAlphaclawUpdate,
  buildPendingAlphaclawInstallSpec,
} = require("../../lib/server/pending-alphaclaw-update");

describe("server/pending-alphaclaw-update", () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "alphaclaw-pending-"));
  });

  afterEach(() => {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {}
  });

  it("builds the install spec from an explicit marker spec", () => {
    expect(
      buildPendingAlphaclawInstallSpec({
        spec: "@chrysb/alphaclaw@0.8.6",
        to: "0.8.5",
      }),
    ).toBe("@chrysb/alphaclaw@0.8.6");
  });

  it("falls back to the marker version when spec is not present", () => {
    expect(buildPendingAlphaclawInstallSpec({ to: "0.8.6" })).toBe(
      "@chrysb/alphaclaw@0.8.6",
    );
  });

  it("falls back to latest for legacy or invalid markers", () => {
    expect(buildPendingAlphaclawInstallSpec({})).toBe(
      "@chrysb/alphaclaw@latest",
    );
  });

  it("installs the pending update with a real npm install command and clears the marker", () => {
    const runtimeDir = path.join(tmpDir, ".alphaclaw-runtime");
    const markerPath = path.join(tmpDir, ".alphaclaw-update-pending");
    fs.writeFileSync(
      markerPath,
      JSON.stringify({
        from: "0.8.5",
        to: "0.8.6",
        spec: "@chrysb/alphaclaw@0.8.6",
        ts: Date.now(),
      }),
    );
    const execSyncImpl = vi.fn();

    const result = applyPendingAlphaclawUpdate({
      execSyncImpl,
      fsModule: fs,
      installDir: runtimeDir,
      logger: { log: vi.fn() },
      markerPath,
    });

    expect(result).toEqual({
      attempted: true,
      installed: true,
      spec: "@chrysb/alphaclaw@0.8.6",
    });
    expect(execSyncImpl).toHaveBeenCalledTimes(1);
    expect(execSyncImpl.mock.calls[0][0]).toBe(
      "npm install '@chrysb/alphaclaw@0.8.6' --omit=dev --no-save --save=false --package-lock=false --prefer-online",
    );
    expect(execSyncImpl.mock.calls[0][1]).toEqual({
      cwd: expect.stringMatching(new RegExp(`^${runtimeDir.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}-pending-[^/]+$`)),
      stdio: "inherit",
      timeout: 180000,
    });
    expect(
      JSON.parse(fs.readFileSync(path.join(runtimeDir, "package.json"), "utf8")),
    ).toEqual({
      name: "alphaclaw-runtime",
      private: true,
    });
    expect(fs.existsSync(markerPath)).toBe(false);
  });

  it("keeps the existing runtime in place when the pending install fails", () => {
    const runtimeDir = path.join(tmpDir, ".alphaclaw-runtime");
    const markerPath = path.join(tmpDir, ".alphaclaw-update-pending");
    fs.writeFileSync(markerPath, "{not-json");
    fs.mkdirSync(runtimeDir, { recursive: true });
    fs.writeFileSync(
      path.join(runtimeDir, "package.json"),
      JSON.stringify({ name: "existing-runtime", private: true }),
    );
    const execSyncImpl = vi.fn(() => {
      throw new Error("boom");
    });

    const result = applyPendingAlphaclawUpdate({
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
    const runtimeDir = path.join(tmpDir, ".alphaclaw-runtime");
    const markerPath = path.join(tmpDir, ".alphaclaw-update-pending");
    fs.writeFileSync(markerPath, "{not-json");
    const execSyncImpl = vi.fn(() => {
      throw new Error("boom");
    });

    const result = applyPendingAlphaclawUpdate({
      execSyncImpl,
      fsModule: fs,
      installDir: runtimeDir,
      logger: { log: vi.fn() },
      markerPath,
    });

    expect(result.attempted).toBe(true);
    expect(result.installed).toBe(false);
    expect(result.spec).toBe("@chrysb/alphaclaw@latest");
    expect(result.error).toBeInstanceOf(Error);
    expect(fs.existsSync(markerPath)).toBe(false);
  });
});
