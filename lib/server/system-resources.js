const os = require("os");
const fs = require("fs");

const readCgroupFile = (filePath) => {
  try {
    return fs.readFileSync(filePath, "utf8").trim();
  } catch {
    return null;
  }
};

const parseCgroupMemory = () => {
  const current = readCgroupFile("/sys/fs/cgroup/memory.current");
  const max = readCgroupFile("/sys/fs/cgroup/memory.max");
  if (!current) return null;
  const usedBytes = Number.parseInt(current, 10);
  if (Number.isNaN(usedBytes)) return null;
  const limitBytes =
    max && max !== "max" ? Number.parseInt(max, 10) : null;
  return {
    usedBytes,
    totalBytes: Number.isNaN(limitBytes) ? null : limitBytes,
  };
};

const parseCgroupCpu = () => {
  const stat = readCgroupFile("/sys/fs/cgroup/cpu.stat");
  if (!stat) return null;
  const lines = stat.split("\n");
  const map = {};
  for (const line of lines) {
    const [key, val] = line.split(/\s+/);
    if (key && val) map[key] = Number.parseInt(val, 10);
  }
  return {
    usageUsec: map.usage_usec ?? null,
    userUsec: map.user_usec ?? null,
    systemUsec: map.system_usec ?? null,
  };
};

let prevCpuSnapshot = null;
let prevCpuSnapshotAt = 0;

const getSystemResources = () => {
  const cgroupMem = parseCgroupMemory();
  const mem = {
    usedBytes: cgroupMem?.usedBytes ?? process.memoryUsage().rss,
    totalBytes: cgroupMem?.totalBytes ?? os.totalmem(),
  };

  let diskUsedBytes = null;
  let diskTotalBytes = null;
  try {
    const stat = fs.statfsSync("/");
    diskTotalBytes = stat.bsize * stat.blocks;
    diskUsedBytes = stat.bsize * (stat.blocks - stat.bfree);
  } catch {
    // statfsSync unavailable
  }

  const cgroupCpu = parseCgroupCpu();
  let cpuPercent = null;
  if (cgroupCpu?.usageUsec != null) {
    const now = Date.now();
    if (prevCpuSnapshot && prevCpuSnapshotAt) {
      const elapsedMs = now - prevCpuSnapshotAt;
      if (elapsedMs > 0) {
        const usageDeltaUs = cgroupCpu.usageUsec - prevCpuSnapshot.usageUsec;
        const elapsedUs = elapsedMs * 1000;
        cpuPercent = Math.min(100, Math.max(0, (usageDeltaUs / elapsedUs) * 100));
      }
    }
    prevCpuSnapshot = cgroupCpu;
    prevCpuSnapshotAt = now;
  } else {
    const load = os.loadavg();
    const cpus = os.cpus().length || 1;
    cpuPercent = Math.min(100, Math.max(0, (load[0] / cpus) * 100));
  }

  return {
    memory: {
      usedBytes: mem.usedBytes,
      totalBytes: mem.totalBytes,
      percent: mem.totalBytes
        ? Math.round((mem.usedBytes / mem.totalBytes) * 1000) / 10
        : null,
    },
    disk: {
      usedBytes: diskUsedBytes,
      totalBytes: diskTotalBytes,
      percent: diskTotalBytes
        ? Math.round((diskUsedBytes / diskTotalBytes) * 1000) / 10
        : null,
    },
    cpu: {
      percent: cpuPercent != null ? Math.round(cpuPercent * 10) / 10 : null,
      cores: os.cpus().length,
    },
  };
};

module.exports = { getSystemResources };
