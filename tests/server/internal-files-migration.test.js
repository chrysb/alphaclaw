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
