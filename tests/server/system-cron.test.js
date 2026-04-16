const path = require("path");

const {
  installHourlyGitSyncCron,
} = require("../../lib/server/onboarding/cron");
const {
  getSystemCronStatus,
  isValidCronSchedule,
  kSystemCronPath,
  stopManagedScheduler,
} = require("../../lib/server/system-cron");

const createMemoryFs = () => {
  const files = new Map();
  const dirs = new Set();

  const ensureParentDirs = (targetPath) => {
    let current = path.dirname(targetPath);
    while (current && !dirs.has(current)) {
      dirs.add(current);
      const parent = path.dirname(current);
      if (parent === current) break;
      current = parent;
    }
  };

  return {
    files,
    dirs,
    existsSync: vi.fn((targetPath) => files.has(targetPath) || dirs.has(targetPath)),
    mkdirSync: vi.fn((targetPath) => {
      dirs.add(targetPath);
      ensureParentDirs(targetPath);
    }),
    readFileSync: vi.fn((targetPath) => {
      if (targetPath.endsWith("hourly-git-sync.sh")) {
        return "echo sync";
      }
      if (files.has(targetPath)) {
        return files.get(targetPath);
      }
      throw Object.assign(new Error(`ENOENT: ${targetPath}`), { code: "ENOENT" });
    }),
    writeFileSync: vi.fn((targetPath, contents) => {
      ensureParentDirs(targetPath);
      files.set(targetPath, String(contents));
    }),
    rmSync: vi.fn((targetPath) => {
      files.delete(targetPath);
      dirs.delete(targetPath);
    }),
    readdirSync: vi.fn((targetPath) => {
      if (!dirs.has(targetPath)) return [];
      return [];
    }),
    statSync: vi.fn((targetPath) => {
      if (dirs.has(targetPath)) {
        return { isDirectory: () => true, isFile: () => false, mode: 0o755 };
      }
      if (files.has(targetPath)) {
        return { isDirectory: () => false, isFile: () => true, mode: 0o644 };
      }
      throw Object.assign(new Error(`ENOENT: ${targetPath}`), { code: "ENOENT" });
    }),
    copyFileSync: vi.fn((sourcePath, targetPath) => {
      ensureParentDirs(targetPath);
      files.set(targetPath, String(files.get(sourcePath) || ""));
    }),
  };
};

describe("server/system-cron", () => {
  afterEach(() => {
    stopManagedScheduler();
  });

  it("rejects named cron tokens", () => {
    expect(isValidCronSchedule("0 * * * MON")).toBe(false);
    expect(isValidCronSchedule("0 * * * *")).toBe(true);
  });

  it("writes /etc/cron.d/openclaw-hourly-sync on linux install", async () => {
    const fs = createMemoryFs();
    const openclawDir = "/tmp/openclaw-linux";
    fs.dirs.add(path.join(openclawDir, "cron"));
    fs.dirs.add(path.join(openclawDir, ".alphaclaw"));
    fs.files.set(path.join(openclawDir, "openclaw.json"), "{}");

    const result = await installHourlyGitSyncCron({
      fs,
      openclawDir,
      platform: "linux",
      execFileSyncImpl: vi.fn(() => ""),
    });

    expect(result).toBe(true);
    expect(fs.files.has(kSystemCronPath)).toBe(true);
    const cronContent = fs.files.get(kSystemCronPath);
    expect(cronContent).toContain("0 * * * *");
    expect(
      getSystemCronStatus({ fs, openclawDir, platform: "linux" }),
    ).toEqual(
      expect.objectContaining({
        enabled: true,
        installed: true,
        platform: "linux",
        installMethod: "system_cron",
      }),
    );
  });

  it("darwin: disable stops scheduler; re-enable restarts it", async () => {
    const fs = createMemoryFs();
    const openclawDir = "/tmp/openclaw-roundtrip";
    fs.dirs.add(path.join(openclawDir, "cron"));
    fs.dirs.add(path.join(openclawDir, ".alphaclaw"));
    fs.files.set(path.join(openclawDir, "openclaw.json"), "{}");
    const cronStatus = (installed) =>
      getSystemCronStatus({ fs, openclawDir, platform: "darwin" }).installed === installed;

    // Initial install — scheduler must be active.
    await installHourlyGitSyncCron({
      fs,
      openclawDir,
      platform: "darwin",
      execFileSyncImpl: vi.fn(() => ""),
    });
    expect(cronStatus(true)).toBe(true);

    // Simulate a disable (e.g. user toggles sync off).
    stopManagedScheduler();
    expect(cronStatus(false)).toBe(true);

    // Re-enable — installHourlyGitSyncCron called again (same code path as
    // onboarding, which is the only writer of this state today).
    const reEnableResult = await installHourlyGitSyncCron({
      fs,
      openclawDir,
      platform: "darwin",
      execFileSyncImpl: vi.fn(() => ""),
    });
    expect(reEnableResult).toBe(true);
    expect(cronStatus(true)).toBe(true);
  });

  it("activates the managed scheduler after macOS install", async () => {
    const fs = createMemoryFs();
    const openclawDir = "/tmp/openclaw";
    fs.dirs.add(path.join(openclawDir, "cron"));
    fs.dirs.add(path.join(openclawDir, ".alphaclaw"));
    fs.files.set(path.join(openclawDir, "openclaw.json"), "{}");

    const result = await installHourlyGitSyncCron({
      fs,
      openclawDir,
      platform: "darwin",
      execFileSyncImpl: vi.fn(() => ""),
    });

    expect(result).toBe(true);
    expect(
      getSystemCronStatus({
        fs,
        openclawDir,
        platform: "darwin",
      }),
    ).toEqual(
      expect.objectContaining({
        enabled: true,
        schedule: "0 * * * *",
        installed: true,
        platform: "darwin",
        installMethod: "managed_scheduler",
      }),
    );
  });
});
