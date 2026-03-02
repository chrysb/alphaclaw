const os = require("os");
const fs = require("fs");
const { execSync } = require("child_process");
const { kRootDir } = require("./constants");

const readCgroupFile = (filePath) => {
  try {
    return fs.readFileSync(filePath, "utf8").trim();
  } catch {
    return null;
  }
};

const readFirstCgroupFile = (paths) => {
  for (const filePath of paths) {
    const value = readCgroupFile(filePath);
    if (value != null) return value;
  }
  return null;
};

const countCpuSet = (cpuSet) => {
  if (!cpuSet) return null;
  let count = 0;
  const parts = String(cpuSet)
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  for (const part of parts) {
    const [startRaw, endRaw] = part.split("-");
    const start = Number.parseInt(startRaw, 10);
    const end = endRaw == null ? start : Number.parseInt(endRaw, 10);
    if (Number.isNaN(start) || Number.isNaN(end)) continue;
    count += Math.max(0, end - start + 1);
  }
  return count > 0 ? count : null;
};

const parseCgroupMemory = () => {
  const current = readFirstCgroupFile([
    "/sys/fs/cgroup/memory.current",
    "/sys/fs/cgroup/memory/memory.usage_in_bytes",
  ]);
  const max = readFirstCgroupFile([
    "/sys/fs/cgroup/memory.max",
    "/sys/fs/cgroup/memory/memory.limit_in_bytes",
  ]);
  if (!current) return null;
  const usedBytes = Number.parseInt(current, 10);
  if (Number.isNaN(usedBytes)) return null;
  const parsedLimit =
    max && max !== "max" ? Number.parseInt(max, 10) : null;
  const limitBytes = Number.isNaN(parsedLimit) ? null : parsedLimit;
  // Cgroup v1 uses huge sentinel values to mean "no limit".
  const unlimited =
    limitBytes == null ||
    limitBytes <= 0 ||
    limitBytes >= 9_000_000_000_000_000_000;
  return {
    usedBytes,
    totalBytes: unlimited ? null : limitBytes,
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

const parseCgroupCpuV1 = () => {
  const usageNs = readFirstCgroupFile([
    "/sys/fs/cgroup/cpuacct/cpuacct.usage",
    "/sys/fs/cgroup/cpu/cpuacct.usage",
  ]);
  if (!usageNs) return null;
  const usageNsParsed = Number.parseInt(usageNs, 10);
  if (Number.isNaN(usageNsParsed)) return null;
  return {
    usageUsec: Math.floor(usageNsParsed / 1000),
    userUsec: null,
    systemUsec: null,
  };
};

const getAllocatedCpuCores = () => {
  const cpuMax = readCgroupFile("/sys/fs/cgroup/cpu.max");
  if (cpuMax) {
    const [quotaRaw, periodRaw] = cpuMax.split(/\s+/);
    const quota = Number.parseInt(quotaRaw, 10);
    const period = Number.parseInt(periodRaw, 10);
    if (quotaRaw !== "max" && !Number.isNaN(quota) && !Number.isNaN(period) && period > 0) {
      return quota / period;
    }
  }

  const quotaV1 = readFirstCgroupFile([
    "/sys/fs/cgroup/cpu/cpu.cfs_quota_us",
    "/sys/fs/cgroup/cpuacct/cpu.cfs_quota_us",
  ]);
  const periodV1 = readFirstCgroupFile([
    "/sys/fs/cgroup/cpu/cpu.cfs_period_us",
    "/sys/fs/cgroup/cpuacct/cpu.cfs_period_us",
  ]);
  if (quotaV1 && periodV1) {
    const quota = Number.parseInt(quotaV1, 10);
    const period = Number.parseInt(periodV1, 10);
    if (!Number.isNaN(quota) && !Number.isNaN(period) && quota > 0 && period > 0) {
      return quota / period;
    }
  }

  const cpuSet =
    readCgroupFile("/sys/fs/cgroup/cpuset.cpus.effective") ||
    readCgroupFile("/sys/fs/cgroup/cpuset.cpus");
  return countCpuSet(cpuSet);
};

const readProcStatus = (pid) => {
  try {
    const status = fs.readFileSync(`/proc/${pid}/status`, "utf8");
    const vmRss = status.match(/VmRSS:\s+(\d+)\s+kB/);
    return { rssBytes: vmRss ? Number.parseInt(vmRss[1], 10) * 1024 : null };
  } catch {
    return null;
  }
};

const readPsStats = (pid) => {
  try {
    const out = execSync(`ps -o rss=,pcpu= -p ${pid}`, {
      encoding: "utf8",
      timeout: 2000,
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    const [rss, pcpu] = out.split(/\s+/);
    return {
      rssBytes: rss ? Number.parseInt(rss, 10) * 1024 : null,
      cpuPercent: pcpu ? Number.parseFloat(pcpu) : null,
    };
  } catch {
    return null;
  }
};

const getProcessUsage = (pid) => {
  if (!pid) return null;
  const proc = readProcStatus(pid);
  if (proc) return { rssBytes: proc.rssBytes };
  const ps = readPsStats(pid);
  if (ps) return { rssBytes: ps.rssBytes };
  return null;
};

const readDiskUsage = () => {
  const paths = [kRootDir, "/data", "/"];
  for (const diskPath of paths) {
    try {
      const stat = fs.statfsSync(diskPath);
      return {
        usedBytes: stat.bsize * (stat.blocks - stat.bfree),
        totalBytes: stat.bsize * stat.blocks,
        path: diskPath,
      };
    } catch {
      // Try next path.
    }
  }
  return { usedBytes: null, totalBytes: null, path: null };
};

let prevCpuSnapshot = null;
let prevCpuSnapshotAt = 0;

const getSystemResources = ({ gatewayPid = null } = {}) => {
  const hostCores = os.cpus().length || 1;
  const allocatedCores = getAllocatedCpuCores() || hostCores;
  const cgroupMem = parseCgroupMemory();
  const mem = {
    usedBytes: cgroupMem?.usedBytes ?? process.memoryUsage().rss,
    totalBytes: cgroupMem?.totalBytes ?? os.totalmem(),
  };

  const diskUsage = readDiskUsage();

  const cgroupCpu = parseCgroupCpu() || parseCgroupCpuV1();
  let cpuPercent = null;
  if (cgroupCpu?.usageUsec != null) {
    const now = Date.now();
    if (prevCpuSnapshot && prevCpuSnapshotAt) {
      const elapsedMs = now - prevCpuSnapshotAt;
      if (elapsedMs > 0) {
        const usageDeltaUs = cgroupCpu.usageUsec - prevCpuSnapshot.usageUsec;
        const elapsedUs = elapsedMs * 1000;
        const rawPercent = (usageDeltaUs / elapsedUs) * 100;
        cpuPercent = Math.min(100, Math.max(0, rawPercent / allocatedCores));
      }
    }
    prevCpuSnapshot = cgroupCpu;
    prevCpuSnapshotAt = now;
  } else {
    const load = os.loadavg();
    cpuPercent = Math.min(100, Math.max(0, (load[0] / allocatedCores) * 100));
  }

  const alphaclawRss = process.memoryUsage().rss;
  const gatewayUsage = getProcessUsage(gatewayPid);
  const gatewayRss = gatewayUsage?.rssBytes ?? null;

  return {
    memory: {
      usedBytes: mem.usedBytes,
      totalBytes: mem.totalBytes,
      percent: mem.totalBytes
        ? Math.round((mem.usedBytes / mem.totalBytes) * 1000) / 10
        : null,
    },
    disk: {
      usedBytes: diskUsage.usedBytes,
      totalBytes: diskUsage.totalBytes,
      path: diskUsage.path,
      percent: diskUsage.totalBytes
        ? Math.round((diskUsage.usedBytes / diskUsage.totalBytes) * 1000) / 10
        : null,
    },
    cpu: {
      percent: cpuPercent != null ? Math.round(cpuPercent * 10) / 10 : null,
      cores: Math.round(allocatedCores * 10) / 10,
      hostCores,
    },
    processes: {
      alphaclaw: { rssBytes: alphaclawRss },
      gateway: { rssBytes: gatewayRss, pid: gatewayPid },
    },
  };
};

module.exports = { getSystemResources };
