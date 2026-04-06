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
      installDir: tmpDir,
      logger: { log: vi.fn() },
      markerPath,
    });

    expect(result).toEqual({
      attempted: true,
      installed: true,
      spec: "@chrysb/alphaclaw@0.8.6",
    });
    expect(execSyncImpl).toHaveBeenCalledWith(
      "npm install '@chrysb/alphaclaw@0.8.6' --omit=dev --no-save --save=false --package-lock=false --prefer-online",
      {
        cwd: tmpDir,
        stdio: "inherit",
        timeout: 180000,
      },
    );
    expect(
      JSON.parse(fs.readFileSync(path.join(tmpDir, "package.json"), "utf8")),
    ).toEqual({
      name: "alphaclaw-runtime",
      private: true,
    });
    expect(fs.existsSync(markerPath)).toBe(false);
  });

  it("removes the marker and reports failure when npm install throws", () => {
    const markerPath = path.join(tmpDir, ".alphaclaw-update-pending");
    fs.writeFileSync(markerPath, "{not-json");
    const execSyncImpl = vi.fn(() => {
      throw new Error("boom");
    });

    const result = applyPendingAlphaclawUpdate({
      execSyncImpl,
      fsModule: fs,
      installDir: tmpDir,
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
