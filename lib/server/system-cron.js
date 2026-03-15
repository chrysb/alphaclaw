"use strict";

const os = require("os");
const path = require("path");
const { spawn } = require("child_process");
const { buildManagedPaths } = require("./internal-files-migration");

const kSystemCronPath = "/etc/cron.d/openclaw-hourly-sync";
const kSystemCronConfigDir = "cron";
const kSystemCronConfigFile = "system-sync.json";
const kDefaultSystemCronSchedule = "0 * * * *";

const kSchedulerState = {
  active: false,
  lastRunKey: "",
  timer: null,
};

const normalizeCronPlatform = (platform = os.platform()) =>
  platform === "darwin" ? "darwin" : "linux";

const isValidCronSchedule = (value) =>
  typeof value === "string" && /^(\S+\s+){4}\S+$/.test(value.trim());

const getSystemCronPaths = ({
  openclawDir,
  platform = os.platform(),
  pathModule = path,
}) => {
  const normalizedPlatform = normalizeCronPlatform(platform);
  const managedPaths = buildManagedPaths({ openclawDir, pathModule });
  const configDir = pathModule.join(openclawDir, kSystemCronConfigDir);
  return {
    platform: normalizedPlatform,
    configDir,
    configPath: pathModule.join(configDir, kSystemCronConfigFile),
    scriptPath: managedPaths.hourlyGitSyncPath,
    logPath:
      normalizedPlatform === "darwin"
        ? pathModule.join(managedPaths.internalDir, "hourly-git-sync.log")
        : "/var/log/openclaw-hourly-sync.log",
    installPath:
      normalizedPlatform === "darwin" ? "managed scheduler" : kSystemCronPath,
  };
};

const buildManagedCronContent = ({
  schedule,
  scriptPath,
  logPath,
  platform = os.platform(),
}) => {
  const normalizedPlatform = normalizeCronPlatform(platform);
  if (normalizedPlatform === "darwin") {
    return [
      "SHELL=/bin/bash",
      "PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin",
      `${schedule} bash "${scriptPath}" >> "${logPath}" 2>&1`,
      "",
    ].join("\n");
  }
  return [
    "SHELL=/bin/bash",
    "PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin",
    `${schedule} root bash "${scriptPath}" >> ${logPath} 2>&1`,
    "",
  ].join("\n");
};

const readSystemCronConfig = ({
  fs,
  openclawDir,
  platform = os.platform(),
}) => {
  const { configPath } = getSystemCronPaths({ openclawDir, platform });
  try {
    const raw = fs.readFileSync(configPath, "utf8");
    const parsed = JSON.parse(raw);
    return {
      enabled: parsed.enabled !== false,
      schedule: isValidCronSchedule(parsed.schedule)
        ? parsed.schedule.trim()
        : kDefaultSystemCronSchedule,
    };
  } catch {
    return {
      enabled: true,
      schedule: kDefaultSystemCronSchedule,
    };
  }
};

const normalizeCronValue = (value, fieldName) => {
  if (fieldName === "dayOfWeek" && value === 7) return 0;
  return value;
};

const matchCronToken = ({ token, value, min, max, fieldName }) => {
  const normalizedToken = String(token || "").trim();
  if (!normalizedToken) return false;
  if (normalizedToken === "*") return true;

  const [base, stepRaw] = normalizedToken.split("/");
  const step = stepRaw ? Number.parseInt(stepRaw, 10) : null;
  if (stepRaw && (!Number.isFinite(step) || step <= 0)) return false;

  let rangeStart = min;
  let rangeEnd = max;
  if (base && base !== "*") {
    if (base.includes("-")) {
      const [startRaw, endRaw] = base.split("-", 2);
      rangeStart = normalizeCronValue(Number.parseInt(startRaw, 10), fieldName);
      rangeEnd = normalizeCronValue(Number.parseInt(endRaw, 10), fieldName);
    } else {
      rangeStart = normalizeCronValue(Number.parseInt(base, 10), fieldName);
      rangeEnd = rangeStart;
    }
  }
  if (
    !Number.isFinite(rangeStart) ||
    !Number.isFinite(rangeEnd) ||
    rangeStart < min ||
    rangeEnd > max ||
    rangeStart > rangeEnd
  ) {
    return false;
  }
  if (value < rangeStart || value > rangeEnd) return false;
  if (!step) return true;
  return (value - rangeStart) % step === 0;
};

const matchCronField = ({ expression, value, min, max, fieldName }) =>
  String(expression || "")
    .split(",")
    .some((token) => matchCronToken({ token, value, min, max, fieldName }));

const cronMatchesDate = (schedule, date) => {
  if (!isValidCronSchedule(schedule)) return false;
  const [minuteExpr, hourExpr, dayExpr, monthExpr, weekExpr] =
    schedule.trim().split(/\s+/);
  const minute = date.getMinutes();
  const hour = date.getHours();
  const dayOfMonth = date.getDate();
  const month = date.getMonth() + 1;
  const dayOfWeek = date.getDay();

  if (
    !matchCronField({
      expression: minuteExpr,
      value: minute,
      min: 0,
      max: 59,
      fieldName: "minute",
    }) ||
    !matchCronField({
      expression: hourExpr,
      value: hour,
      min: 0,
      max: 23,
      fieldName: "hour",
    }) ||
    !matchCronField({
      expression: monthExpr,
      value: month,
      min: 1,
      max: 12,
      fieldName: "month",
    })
  ) {
    return false;
  }

  const dayMatches = matchCronField({
    expression: dayExpr,
    value: dayOfMonth,
    min: 1,
    max: 31,
    fieldName: "dayOfMonth",
  });
  const weekMatches = matchCronField({
    expression: weekExpr,
    value: dayOfWeek,
    min: 0,
    max: 7,
    fieldName: "dayOfWeek",
  });

  const dayRestricted = dayExpr !== "*";
  const weekRestricted = weekExpr !== "*";
  if (dayRestricted && weekRestricted) return dayMatches || weekMatches;
  return dayMatches && weekMatches;
};

const runManagedSchedulerTick = ({ fs, openclawDir, logger = console }) => {
  const config = readSystemCronConfig({ fs, openclawDir, platform: "darwin" });
  if (!config.enabled) return;
  const now = new Date();
  if (!cronMatchesDate(config.schedule, now)) return;
  const runKey = [
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    now.getHours(),
    now.getMinutes(),
  ].join(":");
  if (kSchedulerState.lastRunKey === runKey) return;
  kSchedulerState.lastRunKey = runKey;

  const { scriptPath, logPath } = getSystemCronPaths({
    openclawDir,
    platform: "darwin",
  });
  const child = spawn("bash", [scriptPath], {
    detached: true,
    stdio: ["ignore", "ignore", "ignore"],
    env: {
      ...process.env,
      ALPHACLAW_SYNC_LOG_PATH: logPath,
    },
  });
  child.unref();
  logger.log?.(`[alphaclaw] Managed scheduler triggered (${config.schedule})`);
};

const startManagedScheduler = ({
  fs,
  openclawDir,
  platform = os.platform(),
  logger = console,
}) => {
  if (normalizeCronPlatform(platform) !== "darwin") return false;
  if (kSchedulerState.timer) return true;
  kSchedulerState.active = true;

  const scheduleNextTick = () => {
    const now = new Date();
    const delayMs =
      (60 - now.getSeconds()) * 1000 - now.getMilliseconds() + 50;
    kSchedulerState.timer = setTimeout(() => {
      runManagedSchedulerTick({ fs, openclawDir, logger });
      scheduleNextTick();
    }, Math.max(delayMs, 250));
    if (typeof kSchedulerState.timer.unref === "function") {
      kSchedulerState.timer.unref();
    }
  };

  scheduleNextTick();
  return true;
};

const stopManagedScheduler = () => {
  kSchedulerState.active = false;
  kSchedulerState.lastRunKey = "";
  if (kSchedulerState.timer) {
    clearTimeout(kSchedulerState.timer);
    kSchedulerState.timer = null;
  }
};

const getSystemCronStatus = ({
  fs,
  openclawDir,
  platform = os.platform(),
}) => {
  const paths = getSystemCronPaths({ openclawDir, platform });
  const config = readSystemCronConfig({ fs, openclawDir, platform });
  return {
    enabled: config.enabled,
    schedule: config.schedule,
    installed:
      paths.platform === "darwin"
        ? kSchedulerState.active
        : fs.existsSync(kSystemCronPath),
    scriptExists: fs.existsSync(paths.scriptPath),
    platform: paths.platform,
    installMethod:
      paths.platform === "darwin" ? "managed_scheduler" : "system_cron",
  };
};

const applySystemCronConfig = ({
  fs,
  openclawDir,
  nextConfig,
  platform = os.platform(),
}) => {
  const paths = getSystemCronPaths({ openclawDir, platform });
  const normalizedConfig = {
    enabled: nextConfig.enabled !== false,
    schedule: isValidCronSchedule(nextConfig.schedule)
      ? nextConfig.schedule.trim()
      : kDefaultSystemCronSchedule,
  };
  fs.mkdirSync(paths.configDir, { recursive: true });
  fs.writeFileSync(paths.configPath, JSON.stringify(normalizedConfig, null, 2));
  if (paths.platform === "darwin") {
    if (!normalizedConfig.enabled) kSchedulerState.lastRunKey = "";
  } else if (normalizedConfig.enabled) {
    fs.writeFileSync(
      kSystemCronPath,
      buildManagedCronContent({
        schedule: normalizedConfig.schedule,
        scriptPath: paths.scriptPath,
        logPath: paths.logPath,
        platform: paths.platform,
      }),
      { mode: 0o644 },
    );
  } else {
    fs.rmSync(kSystemCronPath, { force: true });
  }
  return getSystemCronStatus({
    fs,
    openclawDir,
    platform: paths.platform,
  });
};

module.exports = {
  applySystemCronConfig,
  buildManagedCronContent,
  getSystemCronPaths,
  getSystemCronStatus,
  isValidCronSchedule,
  kDefaultSystemCronSchedule,
  kSystemCronPath,
  normalizeCronPlatform,
  readSystemCronConfig,
  startManagedScheduler,
  stopManagedScheduler,
};
