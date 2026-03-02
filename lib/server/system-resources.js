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
  const cgroupMem = parseCgroupMemory();
  const mem = {
    usedBytes: cgroupMem?.usedBytes ?? process.memoryUsage().rss,
    totalBytes: cgroupMem?.totalBytes ?? os.totalmem(),
  };

  const diskUsage = readDiskUsage();

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
      cores: os.cpus().length,
    },
    processes: {
      alphaclaw: { rssBytes: alphaclawRss },
      gateway: { rssBytes: gatewayRss, pid: gatewayPid },
    },
  };
};

module.exports = { getSystemResources };
