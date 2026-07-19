const fs = require("fs");
const os = require("os");
const childProcess = require("child_process");

// system-resources destructures execSync from child_process at load time, so
// the replacement must be installed before the module is required.
const kRealExecSync = childProcess.execSync;
const execSyncMock = vi.fn(kRealExecSync);
childProcess.execSync = execSyncMock;

const { getSystemResources } = require("../../lib/server/system-resources");

// system-resources reads cgroup/proc files through the shared fs singleton and
// shells out via child_process.execSync. We intercept those boundaries with
// spies that fall through to the real fs for unrelated paths.
//
// NOTE: the module keeps a private CPU snapshot (prevCpuSnapshot) between
// calls. The first two tests coordinate Date.now values so each observes the
// snapshot state it expects, whether run alone or in file order; the remaining
// tests never expose cgroup CPU counters and so never touch the snapshot.

const kCgroupPrefix = "/sys/fs/cgroup";

const createFileSystem = (files = {}) => {
  const realReadFileSync = fs.readFileSync;
  vi.spyOn(fs, "readFileSync").mockImplementation((filePath, ...args) => {
    const key = String(filePath);
    if (key.startsWith(kCgroupPrefix) || key.startsWith("/proc/")) {
      if (Object.prototype.hasOwnProperty.call(files, key)) {
        const value = files[key];
        if (value instanceof Error) throw value;
        return value;
      }
      throw Object.assign(new Error(`ENOENT: ${key}`), { code: "ENOENT" });
    }
    return realReadFileSync(filePath, ...args);
  });
  return files;
};

describe("server/system-resources", () => {
  afterEach(() => {
    execSyncMock.mockReset();
  });

  afterAll(() => {
    childProcess.execSync = kRealExecSync;
  });

  it("reports cgroup v2 memory, cpu quota, disk, and process usage", () => {
    const files = createFileSystem({
      "/sys/fs/cgroup/memory.current": "1073741824\n",
      "/sys/fs/cgroup/memory.max": "2147483648\n",
      "/sys/fs/cgroup/cpu.stat":
        "usage_usec 1000000\nuser_usec 800000\nsystem_usec 200000\nmalformed\n",
      "/sys/fs/cgroup/cpu.max": "200000 100000",
      "/proc/4242/status": "Name:\topenclaw\nVmRSS:\t    2048 kB\n",
    });
    vi.spyOn(os, "cpus").mockReturnValue(new Array(8).fill({ model: "x" }));
    vi.spyOn(fs, "statfsSync").mockReturnValue({
      bsize: 4096,
      blocks: 1_000_000,
      bfree: 400_000,
    });
    let fakeNow = 1_000_000;
    vi.spyOn(Date, "now").mockImplementation(() => fakeNow);

    const first = getSystemResources({ gatewayPid: 4242 });
    expect(first.memory).toEqual({
      usedBytes: 1073741824,
      totalBytes: 2147483648,
      percent: 50,
    });
    // First sample with a cgroup counter: no previous snapshot to diff against.
    expect(first.cpu).toEqual({ percent: null, cores: 2, hostCores: 8 });
    expect(first.disk.totalBytes).toBe(4096 * 1_000_000);
    expect(first.disk.usedBytes).toBe(4096 * 600_000);
    expect(first.disk.percent).toBe(60);
    expect(first.processes.gateway).toEqual({ rssBytes: 2048 * 1024, pid: 4242 });
    expect(first.processes.alphaclaw.rssBytes).toBeGreaterThan(0);

    // 1s later the cgroup counter advanced by 1s of CPU: 100% raw / 2 cores.
    fakeNow += 1000;
    files["/sys/fs/cgroup/cpu.stat"] = "usage_usec 2000000\nuser_usec 1600000\n";
    const second = getSystemResources({ gatewayPid: 4242 });
    expect(second.cpu.percent).toBe(50);
  });

  it("falls back to cgroup v1 files and treats sentinel limits as unlimited", () => {
    createFileSystem({
      "/sys/fs/cgroup/memory/memory.usage_in_bytes": "500000000",
      "/sys/fs/cgroup/memory/memory.limit_in_bytes": "9223372036854771712",
      "/sys/fs/cgroup/cpuacct/cpuacct.usage": "3000000000",
      "/sys/fs/cgroup/cpu/cpu.cfs_quota_us": "150000",
      "/sys/fs/cgroup/cpu/cpu.cfs_period_us": "100000",
    });
    vi.spyOn(os, "cpus").mockReturnValue(new Array(4).fill({ model: "x" }));
    vi.spyOn(os, "totalmem").mockReturnValue(1_000_000_000);
    // Pin Date.now to the previous test's final snapshot time so elapsedMs is
    // zero when a snapshot exists (and there is simply no snapshot otherwise).
    vi.spyOn(Date, "now").mockReturnValue(1_001_000);
    const statfsSpy = vi.spyOn(fs, "statfsSync").mockImplementation((diskPath) => {
      if (diskPath === "/data") {
        return { bsize: 512, blocks: 100, bfree: 50 };
      }
      throw new Error("statfs unavailable");
    });
    execSyncMock.mockReturnValue("1024  2.5\n");

    const first = getSystemResources({ gatewayPid: 987 });
    expect(first.memory).toEqual({
      usedBytes: 500000000,
      totalBytes: 1_000_000_000,
      percent: 50,
    });
    expect(first.cpu.cores).toBe(1.5);
    expect(first.cpu.percent).toBeNull();
    expect(first.disk).toEqual({
      usedBytes: 512 * 50,
      totalBytes: 512 * 100,
      path: "/data",
      percent: 50,
    });
    // /proc read failed, so gateway usage came from ps.
    expect(first.processes.gateway).toEqual({ rssBytes: 1024 * 1024, pid: 987 });
    expect(statfsSpy).toHaveBeenCalled();
    expect(execSyncMock).toHaveBeenCalledWith(
      "ps -o rss=,pcpu= -p 987",
      expect.objectContaining({ encoding: "utf8", timeout: 2000 }),
    );

    // Zero elapsed time between snapshots leaves the percent unknown.
    const second = getSystemResources({ gatewayPid: 987 });
    expect(second.cpu.percent).toBeNull();
  });

  it("uses cpuset counts and loadavg when quota files are absent", () => {
    createFileSystem({
      "/sys/fs/cgroup/cpu.max": "max 100000",
      "/sys/fs/cgroup/cpu/cpu.cfs_quota_us": "-1",
      "/sys/fs/cgroup/cpu/cpu.cfs_period_us": "100000",
      "/sys/fs/cgroup/cpuset.cpus": "0-3,7,junk-,x",
      "/proc/55/status": "Name:\topenclaw\nThreads:\t4\n",
    });
    vi.spyOn(os, "cpus").mockReturnValue(new Array(16).fill({ model: "x" }));
    vi.spyOn(os, "totalmem").mockReturnValue(0);
    vi.spyOn(os, "loadavg").mockReturnValue([2, 1, 0.5]);
    vi.spyOn(fs, "statfsSync").mockImplementation(() => {
      throw new Error("statfs unavailable");
    });

    const resources = getSystemResources({ gatewayPid: 55 });

    // cpuset "0-3,7" counts 5 cores; malformed parts are ignored.
    expect(resources.cpu.cores).toBe(5);
    expect(resources.cpu.percent).toBe(40);
    expect(resources.cpu.hostCores).toBe(16);
    // No cgroup memory files: usage falls back to process rss / os.totalmem.
    expect(resources.memory.usedBytes).toBeGreaterThan(0);
    expect(resources.memory.totalBytes).toBe(0);
    expect(resources.memory.percent).toBeNull();
    expect(resources.disk).toEqual({
      usedBytes: null,
      totalBytes: null,
      path: null,
      percent: null,
    });
    // /proc/55/status exists but lacks VmRSS.
    expect(resources.processes.gateway).toEqual({ rssBytes: null, pid: 55 });
  });

  it("returns null process usage when proc and ps are both unavailable", () => {
    createFileSystem({});
    vi.spyOn(os, "cpus").mockReturnValue(new Array(2).fill({ model: "x" }));
    vi.spyOn(os, "totalmem").mockReturnValue(8_000_000_000);
    vi.spyOn(os, "loadavg").mockReturnValue([0, 0, 0]);
    vi.spyOn(fs, "statfsSync").mockReturnValue({
      bsize: 4096,
      blocks: 10,
      bfree: 10,
    });
    execSyncMock.mockImplementation(() => {
      throw new Error("ps failed");
    });

    const resources = getSystemResources({ gatewayPid: 12345 });

    expect(resources.processes.gateway).toEqual({ rssBytes: null, pid: 12345 });
    expect(resources.cpu.percent).toBe(0);
  });

  it("skips gateway usage lookups when no pid is provided", () => {
    createFileSystem({});
    vi.spyOn(os, "cpus").mockReturnValue(new Array(2).fill({ model: "x" }));
    vi.spyOn(os, "loadavg").mockReturnValue([1, 1, 1]);
    vi.spyOn(fs, "statfsSync").mockReturnValue({
      bsize: 4096,
      blocks: 10,
      bfree: 5,
    });
    const execSpy = execSyncMock;

    const resources = getSystemResources();

    expect(resources.processes.gateway).toEqual({ rssBytes: null, pid: null });
    expect(execSpy).not.toHaveBeenCalled();
  });

  it("ignores unparsable cgroup readings", () => {
    createFileSystem({
      "/sys/fs/cgroup/memory.current": "garbage",
      "/sys/fs/cgroup/memory.max": "also-garbage",
      "/sys/fs/cgroup/cpuacct/cpuacct.usage": "not-a-number",
      "/sys/fs/cgroup/cpuset.cpus.effective": "",
    });
    vi.spyOn(os, "cpus").mockReturnValue(new Array(3).fill({ model: "x" }));
    vi.spyOn(os, "totalmem").mockReturnValue(6_000_000_000);
    vi.spyOn(os, "loadavg").mockReturnValue([9, 9, 9]);
    vi.spyOn(fs, "statfsSync").mockReturnValue({
      bsize: 1024,
      blocks: 100,
      bfree: 25,
    });

    const resources = getSystemResources();

    // NaN memory.current invalidates the cgroup sample entirely.
    expect(resources.memory.totalBytes).toBe(6_000_000_000);
    // NaN cpuacct usage falls through to loadavg, clamped to 100%.
    expect(resources.cpu.percent).toBe(100);
    // Empty cpuset yields no allocation info, so host core count is used.
    expect(resources.cpu.cores).toBe(3);
  });

  it("treats a numeric v1 memory limit as the total", () => {
    createFileSystem({
      "/sys/fs/cgroup/memory.current": "250",
      "/sys/fs/cgroup/memory.max": "1000",
      "/sys/fs/cgroup/cpu.stat": "nr_periods 5\n\n",
    });
    vi.spyOn(os, "cpus").mockReturnValue(new Array(1).fill({ model: "x" }));
    vi.spyOn(os, "loadavg").mockReturnValue([0.25, 0, 0]);
    vi.spyOn(fs, "statfsSync").mockReturnValue({
      bsize: 4096,
      blocks: 10,
      bfree: 5,
    });

    const resources = getSystemResources();

    expect(resources.memory).toEqual({
      usedBytes: 250,
      totalBytes: 1000,
      percent: 25,
    });
    // cpu.stat exists but has no usage_usec, so loadavg supplies the percent.
    expect(resources.cpu.percent).toBe(25);
  });

  it("handles empty ps output fields", () => {
    createFileSystem({});
    vi.spyOn(os, "cpus").mockReturnValue(new Array(2).fill({ model: "x" }));
    vi.spyOn(os, "loadavg").mockReturnValue([0, 0, 0]);
    vi.spyOn(fs, "statfsSync").mockReturnValue({
      bsize: 4096,
      blocks: 10,
      bfree: 5,
    });
    execSyncMock.mockReturnValue("   ");

    const resources = getSystemResources({ gatewayPid: 777 });

    expect(resources.processes.gateway).toEqual({ rssBytes: null, pid: 777 });
  });
});
