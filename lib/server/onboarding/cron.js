const os = require("os");
const path = require("path");
const { kSetupDir } = require("../constants");
const { buildManagedPaths } = require("../internal-files-migration");
const {
  applySystemCronConfig,
  getSystemCronPaths,
  getSystemCronStatus,
  kDefaultSystemCronSchedule,
  startManagedScheduler,
} = require("../system-cron");

const kHourlyGitSyncTemplatePath = path.join(kSetupDir, "hourly-git-sync.sh");

const installHourlyGitSyncScript = ({ fs, openclawDir }) => {
  try {
    const { internalDir, hourlyGitSyncPath } = buildManagedPaths({ openclawDir });
    const hourlyGitSyncScript = fs.readFileSync(kHourlyGitSyncTemplatePath, "utf8");
    fs.mkdirSync(internalDir, { recursive: true });
    fs.writeFileSync(hourlyGitSyncPath, hourlyGitSyncScript, { mode: 0o755 });
    console.log("[onboard] Installed deterministic hourly git sync script");
  } catch (e) {
    console.error("[onboard] Hourly git sync script install error:", e.message);
  }
};

const installHourlyGitSyncCron = async ({
  fs,
  openclawDir,
  platform = os.platform(),
  execFileSyncImpl,
}) => {
  try {
    const paths = getSystemCronPaths({ openclawDir, platform });
    const status = applySystemCronConfig({
      fs,
      openclawDir,
      nextConfig: {
        enabled: true,
        schedule: kDefaultSystemCronSchedule,
      },
      platform,
      execFileSyncImpl,
    });
    console.log(
      `[onboard] Installed system cron job at ${paths.installPath} (${paths.configPath})`,
    );
    if (status.platform === "darwin" && status.enabled) {
      startManagedScheduler({ fs, openclawDir, platform });
    }
    const finalStatus = getSystemCronStatus({ fs, openclawDir, platform });
    return finalStatus.installed;
  } catch (e) {
    console.error("[onboard] System cron install error:", e.message);
    return false;
  }
};

module.exports = { installHourlyGitSyncScript, installHourlyGitSyncCron };
