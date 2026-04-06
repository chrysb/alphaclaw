const fs = require("fs");
const path = require("path");
const https = require("https");
const http = require("http");
const {
  kLatestVersionCacheTtlMs,
  kAlphaclawRegistryUrl,
  kNpmPackageRoot,
  kRootDir,
} = require("./constants");

const isNewerVersion = (latest, current) => {
  if (!latest || !current) return false;
  const parse = (v) => {
    const [core] = String(v).replace(/^v/, "").split("-");
    const parts = core.split(".").map(Number);
    return { major: parts[0] || 0, minor: parts[1] || 0, patch: parts[2] || 0 };
  };
  const l = parse(latest);
  const c = parse(current);
  if (l.major !== c.major) return l.major > c.major;
  if (l.minor !== c.minor) return l.minor > c.minor;
  return l.patch > c.patch;
};

const buildAlphaclawInstallSpec = (version = "latest") =>
  `@chrysb/alphaclaw@${String(version || "").trim() || "latest"}`;

const createAlphaclawVersionService = () => {
  let kUpdateStatusCache = {
    latestVersion: null,
    hasUpdate: false,
    fetchedAt: 0,
  };
  let kUpdateInProgress = false;

  const readAlphaclawVersion = () => {
    try {
      const pkg = JSON.parse(
        fs.readFileSync(path.join(kNpmPackageRoot, "package.json"), "utf8"),
      );
      return pkg.version || null;
    } catch {
      return null;
    }
  };

  const fetchLatestVersionFromRegistry = () =>
    new Promise((resolve, reject) => {
      const doGet = (url, redirects = 0) => {
        if (redirects > 3) return reject(new Error("Too many redirects"));
        const get = url.startsWith("https") ? https.get : http.get;
        get(
          url,
          { headers: { Accept: "application/vnd.npm.install-v1+json" } },
          (res) => {
            if (
              res.statusCode >= 300 &&
              res.statusCode < 400 &&
              res.headers.location
            ) {
              res.resume();
              return doGet(res.headers.location, redirects + 1);
            }
            let data = "";
            res.on("data", (chunk) => {
              data += chunk;
            });
            res.on("end", () => {
              try {
                const parsed = JSON.parse(data);
                resolve(parsed["dist-tags"]?.latest || null);
              } catch (e) {
                reject(
                  new Error(
                    `Failed to parse registry response (status ${res.statusCode})`,
                  ),
                );
              }
            });
          },
        ).on("error", reject);
      };
      doGet(kAlphaclawRegistryUrl);
    });

  const readAlphaclawUpdateStatus = async ({ refresh = false } = {}) => {
    const now = Date.now();
    if (
      !refresh &&
      kUpdateStatusCache.fetchedAt &&
      now - kUpdateStatusCache.fetchedAt < kLatestVersionCacheTtlMs
    ) {
      return {
        latestVersion: kUpdateStatusCache.latestVersion,
        hasUpdate: kUpdateStatusCache.hasUpdate,
      };
    }
    const currentVersion = readAlphaclawVersion();
    const latestVersion = await fetchLatestVersionFromRegistry();
    const hasUpdate = isNewerVersion(latestVersion, currentVersion);
    kUpdateStatusCache = { latestVersion, hasUpdate, fetchedAt: Date.now() };
    if (hasUpdate) {
      console.log(
        `[alphaclaw] alphaclaw update available: current=${currentVersion} latest=${latestVersion || "unknown"}`,
      );
    }
    return { latestVersion, hasUpdate };
  };

  const isContainer = () =>
    process.env.RAILWAY_ENVIRONMENT ||
    process.env.RENDER ||
    process.env.FLY_APP_NAME ||
    fs.existsSync("/.dockerenv");

  const restartProcess = () => {
    if (isContainer()) {
      // In containers, exit with code 1 so the orchestrator (Railway, Docker
      // restart policy, etc.) treats it as a crash and restarts the service.
      // Spawning a child doesn't work because killing PID 1 tears down the
      // entire container along with any children.
      console.log("[alphaclaw] Restarting via container crash (exit 1)...");
      process.exit(1);
    }
    // On bare metal / Mac / Linux, spawn a replacement process then exit.
    console.log("[alphaclaw] Spawning new process and exiting...");
    const { spawn } = require("child_process");
    const nextEnv = { ...process.env };
    delete nextEnv.ALPHACLAW_MANAGED_RUNTIME_ACTIVE;
    const bootstrapCliPath =
      String(process.env.ALPHACLAW_BOOTSTRAP_CLI_PATH || "").trim() ||
      process.argv[1];
    const child = spawn(process.argv[0], [bootstrapCliPath, ...process.argv.slice(2)], {
      detached: true,
      stdio: "inherit",
      env: nextEnv,
    });
    child.unref();
    process.exit(0);
  };

  const getVersionStatus = async (refresh) => {
    const currentVersion = readAlphaclawVersion();
    try {
      const { latestVersion, hasUpdate } = await readAlphaclawUpdateStatus({
        refresh,
      });
      return { ok: true, currentVersion, latestVersion, hasUpdate };
    } catch (err) {
      return {
        ok: false,
        currentVersion,
        latestVersion: kUpdateStatusCache.latestVersion,
        hasUpdate: kUpdateStatusCache.hasUpdate,
        error: err.message || "Failed to fetch latest AlphaClaw version",
      };
    }
  };

  const updateAlphaclaw = async () => {
    if (kUpdateInProgress) {
      return {
        status: 409,
        body: { ok: false, error: "AlphaClaw update already in progress" },
      };
    }

    kUpdateInProgress = true;
    const previousVersion = readAlphaclawVersion();
    try {
      let targetVersion = "latest";
      try {
        const updateStatus = await readAlphaclawUpdateStatus({ refresh: true });
        if (updateStatus.latestVersion) {
          targetVersion = updateStatus.latestVersion;
        }
      } catch (error) {
        console.log(
          `[alphaclaw] Could not resolve exact AlphaClaw version before restart: ${error.message || "unknown error"}`,
        );
      }

      const spec = buildAlphaclawInstallSpec(targetVersion);
      // Write marker to persistent volume so the update survives container recreation
      const markerPath = path.join(kRootDir, ".alphaclaw-update-pending");
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
        `[alphaclaw] Update marker written to ${markerPath} for ${spec}`,
      );
      kUpdateStatusCache = {
        latestVersion: null,
        hasUpdate: false,
        fetchedAt: 0,
      };
      return {
        status: 200,
        body: {
          ok: true,
          previousVersion,
          targetVersion: targetVersion === "latest" ? null : targetVersion,
          restarting: true,
        },
      };
    } catch (err) {
      return {
        status: 500,
        body: { ok: false, error: err.message || "Failed to update AlphaClaw" },
      };
    } finally {
      kUpdateInProgress = false;
    }
  };

  return {
    readAlphaclawVersion,
    getVersionStatus,
    updateAlphaclaw,
    restartProcess,
  };
};

module.exports = { createAlphaclawVersionService };
