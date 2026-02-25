const path = require("path");
const { kSetupDir } = require("../constants");

const kHourlyGitSyncTemplatePath = path.join(kSetupDir, "hourly-git-sync.sh");
const kSystemCronPath = "/etc/cron.d/openclaw-hourly-sync";
const kSystemCronConfigDir = "cron";
const kSystemCronConfigFile = "system-sync.json";
const kDefaultSystemCronSchedule = "0 * * * *";

const buildSystemCronFile = ({ schedule, scriptPath }) =>
  [
    "SHELL=/bin/bash",
    "PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin",
    `${schedule} root bash "${scriptPath}" >> /var/log/openclaw-hourly-sync.log 2>&1`,
    "",
  ].join("\n");

const installHourlyGitSyncScript = ({ fs, openclawDir }) => {
  try {
    const scriptPath = `${openclawDir}/hourly-git-sync.sh`;
    const hourlyGitSyncScript = fs.readFileSync(kHourlyGitSyncTemplatePath, "utf8");
    fs.writeFileSync(scriptPath, hourlyGitSyncScript, { mode: 0o755 });
    console.log("[onboard] Installed deterministic hourly git sync script");
  } catch (e) {
    console.error("[onboard] Hourly git sync script install error:", e.message);
  }
};

const installHourlyGitSyncCron = async ({ fs, openclawDir }) => {
  try {
    const scriptPath = `${openclawDir}/hourly-git-sync.sh`;
    const configDir = `${openclawDir}/${kSystemCronConfigDir}`;
    const configPath = `${configDir}/${kSystemCronConfigFile}`;
    const config = { enabled: true, schedule: kDefaultSystemCronSchedule };
    fs.mkdirSync(configDir, { recursive: true });
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

    const cronContent = buildSystemCronFile({
      schedule: config.schedule,
      scriptPath,
    });
    fs.writeFileSync(kSystemCronPath, cronContent, { mode: 0o644 });
    console.log(`[onboard] Installed system cron job at ${kSystemCronPath} (${configPath})`);
    return true;
  } catch (e) {
    console.error("[onboard] System cron install error:", e.message);
    return false;
  }
};

module.exports = { installHourlyGitSyncScript, installHourlyGitSyncCron };
