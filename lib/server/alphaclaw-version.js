const childProcess = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");
const {
  kLatestVersionCacheTtlMs,
  kAlphaclawRegistryUrl,
  kNpmPackageRoot,
  kOpenclawUpdateCopyTimeoutMs,
  kRootDir,
} = require("./constants");
const {
  compareVersionParts,
  normalizeOpenclawVersion,
  resolveGithubRepoUrl,
} = require("./helpers");

const kGithubApiBaseUrl = "https://api.github.com/repos";
const kGithubRawBaseUrl = "https://raw.githubusercontent.com";
const kDefaultTemplateBranch = "main";
const kRailwayTemplateRepoUrl =
  "https://github.com/chrysb/openclaw-railway-template.git";
const kRenderTemplateRepoUrl =
  "https://github.com/chrysb/openclaw-render-template.git";
const kApexTemplateRepoUrl =
  "https://github.com/chrysb/openclaw-apex-template.git";

const isNewerVersion = (latest, current) => {
  if (!latest || !current) return false;
  const parse = (value) => {
    const normalized = String(value || "").replace(/^v/, "").trim();
    const [core, prerelease = ""] = normalized.split("-", 2);
    const parts = core.split(".").map(Number);
    return {
      major: parts[0] || 0,
      minor: parts[1] || 0,
      patch: parts[2] || 0,
      prerelease,
    };
  };
  const latestParts = parse(latest);
  const currentParts = parse(current);
  if (latestParts.major !== currentParts.major) {
    return latestParts.major > currentParts.major;
  }
  if (latestParts.minor !== currentParts.minor) {
    return latestParts.minor > currentParts.minor;
  }
  if (latestParts.patch !== currentParts.patch) {
    return latestParts.patch > currentParts.patch;
  }
  if (!latestParts.prerelease && currentParts.prerelease) {
    return true;
  }
  return false;
};

const normalizeVersion = (value) => {
  const normalized = String(value || "").trim();
  return normalized || null;
};

const parseJsonResponse = async (response, fallbackMessage) => {
  const text = await response.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(text || fallbackMessage);
  }
  if (!response.ok) {
    throw new Error(
      data?.message ||
        data?.error ||
        text ||
        `${fallbackMessage} (${response.status})`,
    );
  }
  return data;
};

const buildGithubHeaders = ({ env = process.env, accept = "application/json" } = {}) => {
  const headers = {
    Accept: accept,
    "User-Agent": "alphaclaw",
  };
  const token = String(env?.GITHUB_TOKEN || env?.GH_TOKEN || "").trim();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
};

const extractTemplateVersions = (pkg) => ({
  latestVersion: normalizeVersion(pkg?.dependencies?.["@chrysb/alphaclaw"]),
  latestOpenclawVersion: normalizeOpenclawVersion(pkg?.dependencies?.openclaw),
});

const fetchLatestVersionFromRegistry = async ({ fetchImpl }) => {
  if (typeof fetchImpl !== "function") {
    throw new Error("Fetch is not available for AlphaClaw version checks");
  }
  const response = await fetchImpl(kAlphaclawRegistryUrl, {
    headers: buildGithubHeaders({
      accept: "application/vnd.npm.install-v1+json",
    }),
  });
  const data = await parseJsonResponse(
    response,
    "Failed to fetch latest AlphaClaw version",
  );
  return normalizeVersion(data?.["dist-tags"]?.latest);
};

const fetchTemplatePackageVersions = async ({
  fetchImpl,
  repoUrl,
  branch = kDefaultTemplateBranch,
}) => {
  if (typeof fetchImpl !== "function") {
    throw new Error("Fetch is not available for template version checks");
  }
  const repoPath = resolveGithubRepoUrl(repoUrl);
  if (!repoPath) {
    throw new Error("Template repository is not configured");
  }
  const response = await fetchImpl(
    `${kGithubRawBaseUrl}/${repoPath}/${encodeURIComponent(branch)}/package.json`,
    {
      headers: buildGithubHeaders(),
    },
  );
  const data = await parseJsonResponse(
    response,
    "Could not fetch the deployment template metadata",
  );
  return extractTemplateVersions(data);
};

const fetchTemplateHeadRef = async ({
  fetchImpl,
  repoUrl,
  branch = kDefaultTemplateBranch,
  env = process.env,
}) => {
  if (typeof fetchImpl !== "function") {
    throw new Error("Fetch is not available for template update requests");
  }
  const repoPath = resolveGithubRepoUrl(repoUrl);
  if (!repoPath) {
    throw new Error("Template repository is not configured");
  }
  const response = await fetchImpl(
    `${kGithubApiBaseUrl}/${repoPath}/commits/${encodeURIComponent(branch)}`,
    {
      headers: buildGithubHeaders({
        env,
        accept: "application/vnd.github+json",
      }),
    },
  );
  const data = await parseJsonResponse(
    response,
    "Could not fetch the deployment template metadata",
  );
  return normalizeVersion(data?.sha);
};

const createUpdateStrategy = ({
  action,
  provider,
  label,
  templateRepoUrl = "",
  templateBranch = kDefaultTemplateBranch,
  description,
  steps = [],
  primaryActionLabel,
  primaryActionUrl = "",
  managedUpdateUrl = "",
  managedUpdateToken = "",
}) => ({
  action,
  provider,
  label,
  templateRepoUrl,
  templateBranch,
  description: String(description || "").trim(),
  steps: Array.isArray(steps)
    ? steps.map((entry) => String(entry || "").trim()).filter(Boolean)
    : [],
  primaryActionLabel: String(primaryActionLabel || "").trim() || "Update now",
  primaryActionUrl: String(primaryActionUrl || "").trim(),
  managedUpdateUrl: String(managedUpdateUrl || "").trim(),
  managedUpdateToken: String(managedUpdateToken || "").trim(),
});

const buildRailwayDeploymentUrl = (env = process.env) => {
  const projectId = String(env.RAILWAY_PROJECT_ID || "").trim();
  const serviceId = String(env.RAILWAY_SERVICE_ID || "").trim();
  const environmentId = String(env.RAILWAY_ENVIRONMENT_ID || "").trim();
  if (!projectId) return "";
  const baseUrl = serviceId
    ? `https://railway.com/project/${projectId}/service/${serviceId}`
    : `https://railway.com/project/${projectId}`;
  return environmentId
    ? `${baseUrl}?environmentId=${encodeURIComponent(environmentId)}`
    : baseUrl;
};

const buildRenderDeploymentUrl = (env = process.env) => {
  const serviceId = String(env.RENDER_SERVICE_ID || "").trim();
  if (!serviceId) return "";
  return `https://dashboard.render.com/web/${encodeURIComponent(serviceId)}`;
};

const detectUpdateStrategy = ({
  env = process.env,
  fsImpl = fs,
} = {}) => {
  const deploymentProvider = String(env.ALPHACLAW_DEPLOYMENT_PROVIDER || "")
    .trim()
    .toLowerCase();
  const managedUpdateUrl = String(env.ALPHACLAW_MANAGED_UPDATE_URL || "").trim();
  const managedUpdateToken = String(
    env.ALPHACLAW_MANAGED_UPDATE_TOKEN || "",
  ).trim();
  const managedTemplateRepoUrl =
    String(env.ALPHACLAW_TEMPLATE_REPO_URL || "").trim() || kApexTemplateRepoUrl;
  const managedTemplateBranch =
    String(env.ALPHACLAW_TEMPLATE_BRANCH || "").trim() || kDefaultTemplateBranch;

  if (deploymentProvider === "apex" && managedUpdateUrl && managedUpdateToken) {
    return createUpdateStrategy({
      action: "managed-update",
      provider: "apex",
      label: "Apex",
      templateRepoUrl: managedTemplateRepoUrl,
      templateBranch: managedTemplateBranch,
      primaryActionLabel: "Update now",
      managedUpdateUrl,
      managedUpdateToken,
    });
  }

  if (deploymentProvider === "apex") {
    return createUpdateStrategy({
      action: "instructions",
      provider: "apex",
      label: "Apex",
      templateRepoUrl: managedTemplateRepoUrl,
      templateBranch: managedTemplateBranch,
      description:
        "This Apex deployment must be migrated to the managed updater before one-click updates are available.",
      primaryActionLabel: "Done",
    });
  }

  if (managedUpdateUrl && managedUpdateToken) {
    return createUpdateStrategy({
      action: "managed-update",
      provider: "apex",
      label: "Apex",
      templateRepoUrl: managedTemplateRepoUrl,
      templateBranch: managedTemplateBranch,
      primaryActionLabel: "Update now",
      managedUpdateUrl,
      managedUpdateToken,
    });
  }

  if (
    env.RAILWAY_ENVIRONMENT ||
    env.RAILWAY_PUBLIC_DOMAIN ||
    env.RAILWAY_STATIC_URL
  ) {
    const railwayDeploymentUrl = buildRailwayDeploymentUrl(env);
    return createUpdateStrategy({
      action: "instructions",
      provider: "railway",
      label: "Railway",
      templateRepoUrl: kRailwayTemplateRepoUrl,
      description:
        "Railway deployments update by syncing the latest template repo changes and redeploying the service.",
      steps: [
        "Open your Railway project and select the AlphaClaw service",
        "Update the upstream template/source repo to the latest commit on main",
        "Redeploy the service so AlphaClaw and OpenClaw update together",
      ],
      primaryActionLabel: railwayDeploymentUrl ? "Update on Railway" : "Done",
      primaryActionUrl: railwayDeploymentUrl,
    });
  }

  if (env.RENDER || env.RENDER_EXTERNAL_URL) {
    const renderDeploymentUrl = buildRenderDeploymentUrl(env);
    return createUpdateStrategy({
      action: "instructions",
      provider: "render",
      label: "Render",
      templateRepoUrl: kRenderTemplateRepoUrl,
      description:
        "Render deployments update by deploying the latest template commit.",
      steps: [
        "Open your Render service for this AlphaClaw deployment",
        "Click the arrow next to Manual Deploy",
        'Choose "Deploy latest commit"',
      ],
      primaryActionLabel: renderDeploymentUrl ? "Update on Render" : "Done",
      primaryActionUrl: renderDeploymentUrl,
    });
  }

  if (fsImpl.existsSync("/.dockerenv")) {
    return createUpdateStrategy({
      action: "instructions",
      provider: "container",
      label: "Container",
      description:
        "This AlphaClaw instance is running in a container. Rebuild or redeploy the container from the latest deployment template or image to apply updates.",
      steps: [
        "Pull the latest deployment template or image for this container",
        "Rebuild or redeploy the container with the updated bundle",
        "Restart the service after the new build is ready",
      ],
      primaryActionLabel: "Done",
    });
  }

  return createUpdateStrategy({
    action: "self-update",
    provider: "self-hosted",
    label: "This install",
    description:
      "This will install the latest @chrysb/alphaclaw package in place and restart AlphaClaw.",
    steps: [
      "AlphaClaw will install the latest published package in place",
      "The process will restart after the new files are copied into node_modules",
    ],
    primaryActionLabel: "Update now",
  });
};

const createAlphaclawVersionService = ({
  readOpenclawVersion = () => null,
  env = process.env,
  fsImpl = fs,
  fetchImpl = global.fetch,
} = {}) => {
  let kRegistryStatusCache = {
    latestVersion: null,
    fetchedAt: 0,
  };
  const kTemplateStatusCache = new Map();
  let kUpdateInProgress = false;

  const readAlphaclawVersion = () => {
    try {
      const pkg = JSON.parse(
        fsImpl.readFileSync(path.join(kNpmPackageRoot, "package.json"), "utf8"),
      );
      return normalizeVersion(pkg.version);
    } catch {
      return null;
    }
  };

  const readTemplateStatus = async ({
    repoUrl,
    branch = kDefaultTemplateBranch,
    refresh = false,
  }) => {
    const cacheKey = `${resolveGithubRepoUrl(repoUrl)}#${branch}`;
    const now = Date.now();
    if (!refresh && kTemplateStatusCache.has(cacheKey)) {
      const cached = kTemplateStatusCache.get(cacheKey);
      if (now - cached.fetchedAt < kLatestVersionCacheTtlMs) {
        return cached;
      }
    }
    const payload = await fetchTemplatePackageVersions({
      fetchImpl,
      repoUrl,
      branch,
    });
    const next = { ...payload, fetchedAt: Date.now() };
    kTemplateStatusCache.set(cacheKey, next);
    return next;
  };

  const readRegistryStatus = async ({ refresh = false } = {}) => {
    const now = Date.now();
    if (
      !refresh &&
      kRegistryStatusCache.fetchedAt &&
      now - kRegistryStatusCache.fetchedAt < kLatestVersionCacheTtlMs
    ) {
      return kRegistryStatusCache;
    }
    const latestVersion = await fetchLatestVersionFromRegistry({ fetchImpl });
    kRegistryStatusCache = {
      latestVersion,
      fetchedAt: Date.now(),
    };
    return kRegistryStatusCache;
  };

  const buildVersionStatus = ({
    strategy,
    latestVersion = null,
    latestOpenclawVersion = null,
    ok = true,
    error = "",
  }) => {
    const currentVersion = readAlphaclawVersion();
    const currentOpenclawVersion = normalizeOpenclawVersion(readOpenclawVersion());
    const alphaclawHasUpdate = isNewerVersion(latestVersion, currentVersion);
    const openclawHasUpdate =
      strategy.templateRepoUrl && latestOpenclawVersion
        ? !currentOpenclawVersion ||
          compareVersionParts(latestOpenclawVersion, currentOpenclawVersion) > 0
        : false;
    return {
      ok,
      currentVersion,
      currentOpenclawVersion,
      latestVersion: normalizeVersion(latestVersion),
      latestOpenclawVersion: normalizeOpenclawVersion(latestOpenclawVersion),
      hasUpdate: Boolean(alphaclawHasUpdate || openclawHasUpdate),
      updateStrategy: strategy,
      ...(error ? { error: String(error || "").trim() } : {}),
    };
  };

  const installLatestAlphaclaw = () =>
    new Promise((resolve, reject) => {
      const installDir = findInstallDir(fsImpl);
      const tmpDir = fsImpl.mkdtempSync(path.join(os.tmpdir(), "alphaclaw-update-"));

      const cleanup = () => {
        try {
          fsImpl.rmSync(tmpDir, { recursive: true, force: true });
        } catch {}
      };

      fsImpl.writeFileSync(
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

  const updateManagedDeployment = async (strategy) => {
    try {
      const latestStatus = await readTemplateStatus({
        repoUrl: strategy.templateRepoUrl,
        branch: strategy.templateBranch,
        refresh: true,
      });
      const latestRef = await fetchTemplateHeadRef({
        fetchImpl,
        repoUrl: strategy.templateRepoUrl,
        branch: strategy.templateBranch,
        env,
      });
      const response = await fetchImpl(strategy.managedUpdateUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${strategy.managedUpdateToken}`,
          "User-Agent": "alphaclaw",
        },
        body: JSON.stringify({
          repo: strategy.templateRepoUrl,
          ref: latestRef,
          alphaclawVersion: latestStatus.latestVersion || readAlphaclawVersion() || "",
          openclawVersion:
            latestStatus.latestOpenclawVersion ||
            normalizeOpenclawVersion(readOpenclawVersion()) ||
            "",
        }),
      });
      const data = await parseJsonResponse(
        response,
        "Failed to trigger the managed deployment update",
      );
      return {
        status: 200,
        body: {
          ok: true,
          previousVersion: readAlphaclawVersion(),
          currentVersion: latestStatus.latestVersion || readAlphaclawVersion(),
          currentOpenclawVersion: normalizeOpenclawVersion(readOpenclawVersion()),
          latestVersion: latestStatus.latestVersion || readAlphaclawVersion(),
          latestOpenclawVersion:
            latestStatus.latestOpenclawVersion ||
            normalizeOpenclawVersion(readOpenclawVersion()),
          managedUpdate: true,
          restarting: true,
          noop: !!data?.noop,
          phase: String(data?.phase || "").trim(),
        },
      };
    } catch (err) {
      return {
        status: 502,
        body: {
          ok: false,
          error:
            err.message || "Failed to trigger the managed deployment update",
          updateStrategy: strategy,
        },
      };
    }
  };

  const restartProcess = () => {
    if (
      env.RAILWAY_ENVIRONMENT ||
      env.RENDER ||
      env.FLY_APP_NAME ||
      fsImpl.existsSync("/.dockerenv")
    ) {
      console.log("[alphaclaw] Restarting via container crash (exit 1)...");
      process.exit(1);
    }
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
    const strategy = detectUpdateStrategy({ env, fsImpl });
    try {
      if (strategy.templateRepoUrl) {
        const status = await readTemplateStatus({
          repoUrl: strategy.templateRepoUrl,
          branch: strategy.templateBranch,
          refresh,
        });
        return buildVersionStatus({
          strategy,
          latestVersion: status.latestVersion,
          latestOpenclawVersion: status.latestOpenclawVersion,
        });
      }
      const status = await readRegistryStatus({ refresh });
      return buildVersionStatus({
        strategy,
        latestVersion: status.latestVersion,
      });
    } catch (err) {
      const cachedTemplateStatus = strategy.templateRepoUrl
        ? kTemplateStatusCache.get(
            `${resolveGithubRepoUrl(strategy.templateRepoUrl)}#${strategy.templateBranch}`,
          ) || {}
        : {};
      return buildVersionStatus({
        strategy,
        latestVersion:
          cachedTemplateStatus.latestVersion || kRegistryStatusCache.latestVersion,
        latestOpenclawVersion: cachedTemplateStatus.latestOpenclawVersion,
        ok: false,
        error: err.message || "Failed to fetch latest AlphaClaw version",
      });
    }
  };

  const updateAlphaclaw = async () => {
    const strategy = detectUpdateStrategy({ env, fsImpl });
    if (kUpdateInProgress) {
      return {
        status: 409,
        body: { ok: false, error: "AlphaClaw update already in progress" },
      };
    }
    if (strategy.action === "managed-update") {
      return updateManagedDeployment(strategy);
    }
    if (strategy.action !== "self-update") {
      return {
        status: 409,
        body: {
          ok: false,
          error:
            strategy.description || "This deployment is updated outside AlphaClaw.",
          updateStrategy: strategy,
        },
      };
    }

    kUpdateInProgress = true;
    const previousVersion = readAlphaclawVersion();
    try {
      await installLatestAlphaclaw();
      const markerPath = path.join(kRootDir, ".alphaclaw-update-pending");
      try {
        fsImpl.writeFileSync(
          markerPath,
          JSON.stringify({ from: previousVersion, ts: Date.now() }),
        );
        console.log(`[alphaclaw] Update marker written to ${markerPath}`);
      } catch (e) {
        console.log(`[alphaclaw] Could not write update marker: ${e.message}`);
      }
      kRegistryStatusCache = {
        latestVersion: null,
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

const findInstallDir = (fsImpl) => {
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
    if (fsImpl.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fsImpl.readFileSync(pkgPath, "utf8"));
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

module.exports = {
  createAlphaclawVersionService,
  detectUpdateStrategy,
};
