const fs = require("fs");
const os = require("os");
const path = require("path");

const {
  buildManagedPaths,
  migrateManagedInternalFiles,
} = require("../../lib/server/internal-files-migration");

const createTempOpenclawDir = () =>
  fs.mkdtempSync(path.join(os.tmpdir(), "alphaclaw-managed-files-test-"));

describe("server/internal-files-migration", () => {
  it("moves legacy managed files into .alphaclaw", () => {
    const openclawDir = createTempOpenclawDir();
    const legacyScriptPath = path.join(openclawDir, "hourly-git-sync.sh");
    const legacyMarkerPath = path.join(openclawDir, ".cli-device-auto-approved");
    fs.writeFileSync(legacyScriptPath, "echo legacy\n", { mode: 0o755 });
    fs.writeFileSync(legacyMarkerPath, '{"approvedAt":"x"}\n', "utf8");

    const managedPaths = migrateManagedInternalFiles({
      fs,
      openclawDir,
      logger: { error: vi.fn() },
    });

    expect(fs.existsSync(legacyScriptPath)).toBe(false);
    expect(fs.existsSync(legacyMarkerPath)).toBe(false);
    expect(fs.existsSync(managedPaths.hourlyGitSyncPath)).toBe(true);
    expect(fs.existsSync(managedPaths.cliDeviceAutoApprovedPath)).toBe(true);
    expect(fs.readFileSync(managedPaths.hourlyGitSyncPath, "utf8")).toContain("legacy");
  });

  it("keeps new paths as source of truth when both old and new exist", () => {
    const openclawDir = createTempOpenclawDir();
    const managedPaths = buildManagedPaths({ openclawDir });
    fs.mkdirSync(managedPaths.internalDir, { recursive: true });
    fs.writeFileSync(managedPaths.hourlyGitSyncPath, "echo new\n", "utf8");
    fs.writeFileSync(managedPaths.cliDeviceAutoApprovedPath, '{"approvedAt":"new"}\n', "utf8");
    fs.writeFileSync(managedPaths.legacyHourlyGitSyncPath, "echo old\n", "utf8");
    fs.writeFileSync(managedPaths.legacyCliDeviceAutoApprovedPath, '{"approvedAt":"old"}\n', "utf8");

    migrateManagedInternalFiles({
      fs,
      openclawDir,
      logger: { error: vi.fn() },
    });

    expect(fs.existsSync(managedPaths.legacyHourlyGitSyncPath)).toBe(false);
    expect(fs.existsSync(managedPaths.legacyCliDeviceAutoApprovedPath)).toBe(false);
    expect(fs.readFileSync(managedPaths.hourlyGitSyncPath, "utf8")).toBe("echo new\n");
    expect(fs.readFileSync(managedPaths.cliDeviceAutoApprovedPath, "utf8")).toBe(
      '{"approvedAt":"new"}\n',
    );
  });

  it("appends cron jobs-state gitignore entries when missing", () => {
    const openclawDir = createTempOpenclawDir();
    const gitignorePath = path.join(openclawDir, ".gitignore");
    fs.writeFileSync(gitignorePath, "*\n!cron/\n!cron/jobs.json\n", "utf8");

    migrateManagedInternalFiles({
      fs,
      openclawDir,
      logger: { error: vi.fn() },
    });

    const next = fs.readFileSync(gitignorePath, "utf8");
    expect(next).toContain("cron/jobs-state.json");
    expect(next).toContain("!hooks/");
  });

  it("falls back to copy+chmod+rm when rename fails", () => {
    const openclawDir = createTempOpenclawDir();
    const legacyScriptPath = path.join(openclawDir, "hourly-git-sync.sh");
    fs.writeFileSync(legacyScriptPath, "echo cross-device\n", { mode: 0o755 });
    const crossDeviceFs = {
      ...fs,
      renameSync: () => {
        throw Object.assign(new Error("EXDEV: cross-device link"), {
          code: "EXDEV",
        });
      },
    };

    const managedPaths = migrateManagedInternalFiles({
      fs: crossDeviceFs,
      openclawDir,
      logger: { error: vi.fn() },
    });

    expect(fs.existsSync(legacyScriptPath)).toBe(false);
    expect(fs.existsSync(managedPaths.hourlyGitSyncPath)).toBe(true);
    expect(fs.readFileSync(managedPaths.hourlyGitSyncPath, "utf8")).toContain(
      "cross-device",
    );
    expect(fs.statSync(managedPaths.hourlyGitSyncPath).mode & 0o777).toBe(0o755);
  });

  it("skips chmod when the source mode is not finite", () => {
    const openclawDir = createTempOpenclawDir();
    const legacyMarkerPath = path.join(openclawDir, ".cli-device-auto-approved");
    fs.writeFileSync(legacyMarkerPath, "{}", "utf8");
    const chmodSpy = vi.fn();
    const oddFs = {
      ...fs,
      renameSync: () => {
        throw new Error("EXDEV");
      },
      chmodSync: chmodSpy,
      statSync: () => ({ mode: undefined }),
    };

    const managedPaths = migrateManagedInternalFiles({
      fs: oddFs,
      openclawDir,
      logger: { error: vi.fn() },
    });

    expect(fs.existsSync(managedPaths.cliDeviceAutoApprovedPath)).toBe(true);
    expect(chmodSpy).not.toHaveBeenCalled();
  });

  it("logs and continues when migration work throws", () => {
    const openclawDir = createTempOpenclawDir();
    fs.writeFileSync(path.join(openclawDir, ".gitignore"), "*\n", "utf8");
    const logger = { error: vi.fn() };
    const brokenFs = {
      ...fs,
      readFileSync: () => {
        throw new Error("gitignore unreadable");
      },
    };

    const managedPaths = migrateManagedInternalFiles({
      fs: brokenFs,
      openclawDir,
      logger,
    });

    expect(managedPaths.internalDir).toContain(".alphaclaw");
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining("gitignore unreadable"),
    );

    // A logger without an error method is tolerated.
    expect(() =>
      migrateManagedInternalFiles({ fs: brokenFs, openclawDir, logger: {} }),
    ).not.toThrow();
  });

  it("is idempotent across repeated runs", () => {
    const openclawDir = createTempOpenclawDir();
    fs.writeFileSync(path.join(openclawDir, "hourly-git-sync.sh"), "echo script\n", "utf8");

    migrateManagedInternalFiles({
      fs,
      openclawDir,
      logger: { error: vi.fn() },
    });
    migrateManagedInternalFiles({
      fs,
      openclawDir,
      logger: { error: vi.fn() },
    });

    const managedPaths = buildManagedPaths({ openclawDir });
    expect(fs.existsSync(managedPaths.hourlyGitSyncPath)).toBe(true);
    expect(fs.existsSync(managedPaths.legacyHourlyGitSyncPath)).toBe(false);
    expect(fs.existsSync(managedPaths.internalDir)).toBe(true);
  });
});
