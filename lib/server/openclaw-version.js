const { exec, execSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");
const {
  kVersionCacheTtlMs,
  kLatestVersionCacheTtlMs,
  kNpmPackageRoot,
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

  const findInstallDir = () => {
    // Resolve the consumer app root (for example /app in Docker), not this package directory.
    let dir = kNpmPackageRoot;
    while (dir !== path.dirname(dir)) {
      const parent = path.dirname(dir);
      if (
        path.basename(parent) === "node_modules" ||
        parent.includes(`${path.sep}node_modules${path.sep}`)
      ) {
        dir = parent;
        continue;
      }
      const pkgPath = path.join(parent, "package.json");
      if (fs.existsSync(pkgPath)) {
        try {
          const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
          if (
            pkg.dependencies?.["@chrysb/alphaclaw"] ||
            pkg.devDependencies?.["@chrysb/alphaclaw"] ||
            pkg.optionalDependencies?.["@chrysb/alphaclaw"]
          ) {
            return parent;
          }
        } catch {}
      }
      dir = parent;
    }
    return kNpmPackageRoot;
  };

  // Install to a temp directory, then copy into the real node_modules.
  // Running `npm install` directly in the app dir causes EBUSY on Docker
  // because npm tries to rename directories that the running process holds open.
  // Copying individual files (cp -af) avoids the rename syscall entirely.
  const installLatestOpenclaw = () =>
    new Promise((resolve, reject) => {
      const installDir = findInstallDir();
      const tmpDir = fs.mkdtempSync(
        path.join(os.tmpdir(), "openclaw-update-"),
      );
      const cleanup = () => {
        try {
          fs.rmSync(tmpDir, { recursive: true, force: true });
        } catch {}
      };

      fs.writeFileSync(
        path.join(tmpDir, "package.json"),
        JSON.stringify({
          private: true,
          dependencies: { openclaw: "latest" },
        }),
      );

      const npmEnv = {
        ...process.env,
        npm_config_update_notifier: "false",
        npm_config_fund: "false",
        npm_config_audit: "false",
      };

      console.log(
        `[alphaclaw] Running: npm install openclaw@latest in temp dir (target: ${installDir})`,
      );
      exec(
        "npm install --omit=dev --prefer-online --package-lock=false",
        { cwd: tmpDir, env: npmEnv, timeout: 180000 },
        (installErr, stdout, stderr) => {
          if (installErr) {
            const message = String(stderr || installErr.message || "").trim();
            console.log(
              `[alphaclaw] openclaw install error: ${message.slice(0, 200)}`,
            );
            cleanup();
            return reject(
              new Error(message || "Failed to install openclaw@latest"),
            );
          }
          if (stdout?.trim()) {
            console.log(
              `[alphaclaw] openclaw install stdout: ${stdout.trim().slice(0, 300)}`,
            );
          }

          const src = path.join(tmpDir, "node_modules");
          const dest = path.join(installDir, "node_modules");
          exec(
            `cp -af "${src}/." "${dest}/"`,
            { timeout: 60000 },
            (cpErr) => {
              cleanup();
              if (cpErr) {
                console.log(
                  `[alphaclaw] openclaw copy error: ${(cpErr.message || "").slice(0, 200)}`,
                );
                return reject(
                  new Error(
                    `Failed to copy updated openclaw files: ${cpErr.message}`,
                  ),
                );
              }
              console.log("[alphaclaw] openclaw install completed");
              resolve({
                stdout: stdout?.trim() || "",
                stderr: stderr?.trim() || "",
              });
            },
          );
        },
      );
    });

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
      await installLatestOpenclaw();
      kOpenclawVersionCache = { value: null, fetchedAt: 0 };
      const currentVersion = readOpenclawVersion();
      const { latestVersion, hasUpdate } = readOpenclawUpdateStatus({
        refresh: true,
      });
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
