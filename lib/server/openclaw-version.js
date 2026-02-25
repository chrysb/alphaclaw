const { exec, execSync } = require("child_process");
const {
  kVersionCacheTtlMs,
  kLatestVersionCacheTtlMs,
  kAppDir,
} = require("./constants");
const { normalizeOpenclawVersion } = require("./helpers");

const createOpenclawVersionService = ({ gatewayEnv, restartGateway, isOnboarded }) => {
  let kOpenclawVersionCache = { value: null, fetchedAt: 0 };
  let kOpenclawUpdateStatusCache = {
    latestVersion: null,
    hasUpdate: false,
    fetchedAt: 0,
  };
  let kOpenclawUpdateInProgress = false;

  const readOpenclawVersion = () => {
    const now = Date.now();
    if (
      kOpenclawVersionCache.value &&
      now - kOpenclawVersionCache.fetchedAt < kVersionCacheTtlMs
    ) {
      return kOpenclawVersionCache.value;
    }
    try {
      const raw = execSync("openclaw --version", {
        env: gatewayEnv(),
        timeout: 5000,
        encoding: "utf8",
      }).trim();
      const version = normalizeOpenclawVersion(raw);
      kOpenclawVersionCache = { value: version, fetchedAt: now };
      return version;
    } catch {
      return kOpenclawVersionCache.value;
    }
  };

  const readOpenclawUpdateStatus = ({ refresh = false } = {}) => {
    const now = Date.now();
    if (
      !refresh &&
      kOpenclawUpdateStatusCache.fetchedAt &&
      now - kOpenclawUpdateStatusCache.fetchedAt < kLatestVersionCacheTtlMs
    ) {
      return {
        latestVersion: kOpenclawUpdateStatusCache.latestVersion,
        hasUpdate: kOpenclawUpdateStatusCache.hasUpdate,
      };
    }
    try {
      console.log("[wrapper] Running: openclaw update status --json");
      const raw = execSync("openclaw update status --json", {
        env: gatewayEnv(),
        timeout: 8000,
        encoding: "utf8",
      }).trim();
      const parsed = JSON.parse(raw);
      const latestVersion = normalizeOpenclawVersion(
        parsed?.availability?.latestVersion || parsed?.update?.registry?.latestVersion,
      );
      const hasUpdate = !!parsed?.availability?.available;
      kOpenclawUpdateStatusCache = {
        latestVersion,
        hasUpdate,
        fetchedAt: now,
      };
      console.log(
        `[wrapper] openclaw update status: hasUpdate=${hasUpdate} latest=${latestVersion || "unknown"}`,
      );
      return { latestVersion, hasUpdate };
    } catch (err) {
      console.log(
        `[wrapper] openclaw update status error: ${(err.message || "unknown").slice(0, 200)}`,
      );
      throw new Error(err.message || "Failed to read OpenClaw update status");
    }
  };

  const installLatestOpenclaw = () =>
    new Promise((resolve, reject) => {
      console.log("[wrapper] Running: npm install --omit=dev --no-save --package-lock=false openclaw@latest");
      exec(
        "npm install --omit=dev --no-save --package-lock=false openclaw@latest",
        {
          cwd: kAppDir,
          env: {
            ...process.env,
            npm_config_update_notifier: "false",
            npm_config_fund: "false",
            npm_config_audit: "false",
          },
          timeout: 180000,
        },
        (err, stdout, stderr) => {
          if (err) {
            const message = String(stderr || err.message || "").trim();
            console.log(`[wrapper] openclaw install error: ${message.slice(0, 200)}`);
            return reject(new Error(message || "Failed to install openclaw@latest"));
          }
          if (stdout && stdout.trim()) {
            console.log(`[wrapper] openclaw install stdout: ${stdout.trim().slice(0, 300)}`);
          }
          if (stderr && stderr.trim()) {
            console.log(`[wrapper] openclaw install stderr: ${stderr.trim().slice(0, 300)}`);
          }
          console.log("[wrapper] openclaw install completed");
          resolve({ stdout: stdout.trim(), stderr: stderr.trim() });
        },
      );
    });

  const getVersionStatus = async (refresh) => {
    const currentVersion = readOpenclawVersion();
    try {
      const { latestVersion, hasUpdate } = readOpenclawUpdateStatus({ refresh });
      return { ok: true, currentVersion, latestVersion, hasUpdate };
    } catch (err) {
      return {
        ok: false,
        currentVersion,
        latestVersion: kOpenclawUpdateStatusCache.latestVersion,
        hasUpdate: kOpenclawUpdateStatusCache.hasUpdate,
        error: err.message || "Failed to fetch latest OpenClaw version",
      };
    }
  };

  const updateOpenclaw = async () => {
    if (kOpenclawUpdateInProgress) {
      return {
        status: 409,
        body: { ok: false, error: "OpenClaw update already in progress" },
      };
    }

    kOpenclawUpdateInProgress = true;
    const previousVersion = readOpenclawVersion();
    try {
      await installLatestOpenclaw();
      kOpenclawVersionCache = { value: null, fetchedAt: 0 };
      const currentVersion = readOpenclawVersion();
      const { latestVersion, hasUpdate } = readOpenclawUpdateStatus({ refresh: true });
      let restarted = false;
      if (isOnboarded()) {
        restartGateway();
        restarted = true;
      }
      return {
        status: 200,
        body: {
          ok: true,
          previousVersion,
          currentVersion,
          latestVersion,
          hasUpdate,
          restarted,
          updated: previousVersion !== currentVersion,
        },
      };
    } catch (err) {
      return {
        status: 500,
        body: { ok: false, error: err.message || "Failed to update OpenClaw" },
      };
    } finally {
      kOpenclawUpdateInProgress = false;
    }
  };

  return {
    readOpenclawVersion,
    getVersionStatus,
    updateOpenclaw,
  };
};

module.exports = { createOpenclawVersionService };
