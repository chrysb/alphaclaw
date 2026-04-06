const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const {
  kVersionCacheTtlMs,
  kLatestVersionCacheTtlMs,
  kRootDir,
} = require("./constants");
const { normalizeOpenclawVersion } = require("./helpers");
const { parseJsonObjectFromNoisyOutput } = require("./utils/json");

const createOpenclawVersionService = ({
  gatewayEnv,
  restartGateway,
  isOnboarded,
}) => {
  let kOpenclawVersionCache = { value: null, fetchedAt: 0 };
  let kOpenclawUpdateStatusCache = {
    latestVersion: null,
    hasUpdate: false,
    fetchedAt: 0,
  };
  let kOpenclawUpdateInProgress = false;

  const buildOpenclawInstallSpec = (version = "latest") =>
    `openclaw@${String(version || "").trim() || "latest"}`;

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
      const raw = execSync("openclaw update status --json", {
        env: gatewayEnv(),
        timeout: 8000,
        encoding: "utf8",
      }).trim();
      const parsed = parseJsonObjectFromNoisyOutput(raw);
      if (!parsed) {
        throw new Error("openclaw update status returned invalid JSON payload");
      }
      const latestVersion = normalizeOpenclawVersion(
        parsed?.availability?.latestVersion ||
          parsed?.update?.registry?.latestVersion,
      );
      const hasUpdate = !!parsed?.availability?.available;
      kOpenclawUpdateStatusCache = {
        latestVersion,
        hasUpdate,
        fetchedAt: now,
      };
      return { latestVersion, hasUpdate };
    } catch (err) {
      console.error(
        `[alphaclaw] openclaw update status error: ${err.message || "unknown error"}`,
      );
      throw new Error(err.message || "Failed to read OpenClaw update status");
    }
  };

  const getVersionStatus = async (refresh) => {
    const currentVersion = readOpenclawVersion();
    try {
      const { latestVersion, hasUpdate } = readOpenclawUpdateStatus({
        refresh,
      });
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
      let latestVersion = null;
      let hasUpdate = false;
      try {
        const updateStatus = readOpenclawUpdateStatus({ refresh: true });
        latestVersion = updateStatus.latestVersion || null;
        hasUpdate = !!updateStatus.hasUpdate;
      } catch (error) {
        console.log(
          `[alphaclaw] Could not resolve exact OpenClaw version before restart: ${error.message || "unknown error"}`,
        );
      }

      if (!hasUpdate && latestVersion && latestVersion === previousVersion) {
        return {
          status: 200,
          body: {
            ok: true,
            previousVersion,
            currentVersion: previousVersion,
            latestVersion,
            hasUpdate: false,
            restarted: false,
            restarting: false,
            updated: false,
          },
        };
      }

      const targetVersion = latestVersion || "latest";
      const spec = buildOpenclawInstallSpec(targetVersion);
      const markerPath = path.join(kRootDir, ".openclaw-update-pending");
      fs.writeFileSync(
        markerPath,
        JSON.stringify({
          from: previousVersion,
          to: targetVersion,
          spec,
          ts: Date.now(),
        }),
      );
      console.log(
        `[alphaclaw] OpenClaw update marker written to ${markerPath} for ${spec}`,
      );
      kOpenclawVersionCache = { value: previousVersion, fetchedAt: 0 };
      kOpenclawUpdateStatusCache = {
        latestVersion,
        hasUpdate,
        fetchedAt: 0,
      };
      return {
        status: 200,
        body: {
          ok: true,
          previousVersion,
          currentVersion: previousVersion,
          targetVersion: targetVersion === "latest" ? null : targetVersion,
          latestVersion,
          hasUpdate: true,
          restarted: false,
          restarting: true,
          updated: previousVersion !== targetVersion,
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
