const childProcess = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");
const https = require("https");
const http = require("http");
const {
  kLatestVersionCacheTtlMs,
  kAlphaclawRegistryUrl,
  kNpmPackageRoot,
  kOpenclawUpdateCopyTimeoutMs,
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

  const findInstallDir = () => {
    // Walk up from kNpmPackageRoot to find the consuming project's directory
    // (the one with node_modules/@chrysb/alphaclaw). In Docker this is /app.
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
    // Fallback: if running directly (not from node_modules), use kNpmPackageRoot
    return kNpmPackageRoot;
  };

  const installLatestAlphaclaw = () =>
    new Promise((resolve, reject) => {
      const installDir = findInstallDir();
      const tmpDir = fs.mkdtempSync(
        path.join(os.tmpdir(), "alphaclaw-update-"),
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
          dependencies: { "@chrysb/alphaclaw": "latest" },
        }),
      );

      const npmEnv = {
        ...process.env,
        npm_config_update_notifier: "false",
        npm_config_fund: "false",
        npm_config_audit: "false",
      };

      console.log(
        `[alphaclaw] Running: npm install @chrysb/alphaclaw@latest in temp dir (target: ${installDir})`,
      );
      childProcess.exec(
        "npm install --omit=dev --prefer-online --package-lock=false",
        {
          cwd: tmpDir,
          env: npmEnv,
          timeout: 180000,
        },
        (err, stdout, stderr) => {
          if (err) {
            const message = String(stderr || err.message || "").trim();
            console.log(
              `[alphaclaw] alphaclaw install error: ${message.slice(0, 200)}`,
            );
            cleanup();
            return reject(
              new Error(
                message || "Failed to install @chrysb/alphaclaw@latest",
              ),
            );
          }
          if (stdout?.trim()) {
            console.log(
              `[alphaclaw] alphaclaw install stdout: ${stdout.trim().slice(0, 300)}`,
            );
          }

          const src = path.join(tmpDir, "node_modules");
          const dest = path.join(installDir, "node_modules");
          childProcess.exec(
            `cp -af "${src}/." "${dest}/"`,
            { timeout: kOpenclawUpdateCopyTimeoutMs },
            (copyErr) => {
              cleanup();
              if (copyErr) {
                console.log(
                  `[alphaclaw] alphaclaw copy error: ${(copyErr.message || "").slice(0, 200)}`,
                );
                return reject(
                  new Error(
                    `Failed to copy updated AlphaClaw files: ${copyErr.message}`,
                  ),
                );
              }
              console.log("[alphaclaw] alphaclaw install completed");
              resolve({ stdout: stdout?.trim(), stderr: stderr?.trim() });
            },
          );
        },
      );
    });

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
    const child = spawn(process.argv[0], process.argv.slice(1), {
      detached: true,
      stdio: "inherit",
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
      await installLatestAlphaclaw();
      // Write marker to persistent volume so the update survives container recreation
      const markerPath = path.join(kRootDir, ".alphaclaw-update-pending");
      try {
        fs.writeFileSync(
          markerPath,
          JSON.stringify({ from: previousVersion, ts: Date.now() }),
        );
        console.log(`[alphaclaw] Update marker written to ${markerPath}`);
      } catch (e) {
        console.log(`[alphaclaw] Could not write update marker: ${e.message}`);
      }
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
          restarting: true,
        },
      };
    } catch (err) {
      kUpdateInProgress = false;
      return {
        status: 500,
        body: { ok: false, error: err.message || "Failed to update AlphaClaw" },
      };
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
