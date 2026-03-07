const path = require("path");
const { kSetupDir, kRootDir } = require("../constants");
const { validateOnboardingInput } = require("./validation");
const {
  ensureGithubRepoAccessible,
  verifyGithubRepoForOnboarding,
  cloneRepoToTemp,
} = require("./github");
const {
  buildOnboardArgs,
  writeSanitizedOpenclawConfig,
} = require("./openclaw");
const {
  ensureOpenclawRuntimeArtifacts,
  installControlUiSkill,
  syncBootstrapPromptFiles,
} = require("./workspace");
const {
  installHourlyGitSyncScript,
  installHourlyGitSyncCron,
} = require("./cron");
const { migrateManagedInternalFiles } = require("../internal-files-migration");
const { installGogCliSkill } = require("../gog-skill");

const kPlaceholderEnvValue = "placeholder";
const kEnvRefPattern = /\$\{([A-Z_][A-Z0-9_]*)\}/g;

const upsertEnvVar = (items, key, value) => {
  const normalizedKey = String(key || "").trim();
  if (!normalizedKey) return items;
  const normalizedValue = String(value || "");
  const existing = items.find((entry) => entry.key === normalizedKey);
  if (existing) {
    existing.value = normalizedValue;
    return items;
  }
  items.push({ key: normalizedKey, value: normalizedValue });
  return items;
};

const collectEnvRefs = (value, found = new Set()) => {
  if (typeof value === "string") {
    for (const match of value.matchAll(kEnvRefPattern)) {
      found.add(match[1]);
    }
    return found;
  }
  if (Array.isArray(value)) {
    value.forEach((entry) => collectEnvRefs(entry, found));
    return found;
  }
  if (value && typeof value === "object") {
    Object.values(value).forEach((entry) => collectEnvRefs(entry, found));
  }
  return found;
};

const resolveConfigIncludes = ({ fs, absoluteConfigPath }) => {
  const includes = [];
  try {
    const raw = fs.readFileSync(absoluteConfigPath, "utf8");
    const cfg = JSON.parse(raw);
    const walk = (value) => {
      if (!value || typeof value !== "object") return;
      for (const [key, entry] of Object.entries(value)) {
        if (key === "$include" && typeof entry === "string" && entry.trim()) {
          includes.push(entry.trim());
          continue;
        }
        walk(entry);
      }
    };
    walk(cfg);
  } catch {}
  return includes;
};

const resolveImportedConfigPaths = ({ fs, openclawDir }) => {
  const discovered = new Set();
  const queue = [
    path.join(openclawDir, "openclaw.json"),
    path.join(openclawDir, ".openclaw", "openclaw.json"),
  ].filter((configPath) => fs.existsSync(configPath));

  while (queue.length > 0) {
    const absoluteConfigPath = queue.shift();
    if (!absoluteConfigPath || discovered.has(absoluteConfigPath)) continue;
    if (!fs.existsSync(absoluteConfigPath)) continue;
    discovered.add(absoluteConfigPath);

    const includes = resolveConfigIncludes({ fs, absoluteConfigPath });
    for (const includePath of includes) {
      const candidatePaths = [
        path.join(openclawDir, includePath),
        path.join(path.dirname(absoluteConfigPath), includePath),
      ];
      for (const candidatePath of candidatePaths) {
        if (fs.existsSync(candidatePath) && !discovered.has(candidatePath)) {
          queue.push(candidatePath);
          break;
        }
      }
    }
  }

  return [...discovered];
};

const normalizeImportedConfig = ({ fs, openclawDir }) => {
  const configPaths = resolveImportedConfigPaths({ fs, openclawDir });
  for (const configPath of configPaths) {
    let cfg = null;
    try {
      cfg = JSON.parse(fs.readFileSync(configPath, "utf8"));
    } catch {
      continue;
    }
    if (!cfg || typeof cfg !== "object") continue;
    let changed = false;
    const currentToken = String(cfg?.gateway?.auth?.token || "").trim();
    const expectedTokenRef = "${OPENCLAW_GATEWAY_TOKEN}";
    if (cfg.gateway?.auth && currentToken !== expectedTokenRef) {
      cfg.gateway = {
        ...(cfg.gateway || {}),
        auth: {
          ...(cfg.gateway.auth || {}),
          token: expectedTokenRef,
        },
      };
      changed = true;
    }
    if (cfg.hooks && Object.prototype.hasOwnProperty.call(cfg.hooks, "transformsDir")) {
      const { transformsDir, ...nextHooks } = cfg.hooks;
      void transformsDir;
      cfg.hooks = nextHooks;
      changed = true;
    }
    if (changed) {
      fs.writeFileSync(configPath, JSON.stringify(cfg, null, 2));
    }
  }
};

const getImportedConfigEnvRefs = ({ fs, openclawDir }) => {
  const refs = new Set();
  const configPaths = resolveImportedConfigPaths({ fs, openclawDir });
  for (const configPath of configPaths) {
    try {
      const raw = fs.readFileSync(configPath, "utf8");
      collectEnvRefs(JSON.parse(raw), refs);
    } catch {}
  }
  return refs;
};

const createOnboardingService = ({
  fs,
  constants,
  shellCmd,
  gatewayEnv,
  readEnvFile,
  writeEnvFile,
  reloadEnv,
  resolveGithubRepoUrl,
  resolveModelProvider,
  hasCodexOauthProfile,
  authProfiles,
  ensureGatewayProxyConfig,
  getBaseUrl,
  startGateway,
}) => {
  const { OPENCLAW_DIR, WORKSPACE_DIR, kOnboardingMarkerPath } = constants;

  const verifyGithubSetup = async ({
    githubRepoInput,
    githubToken,
    mode = "new",
    resolveGithubRepoUrl,
  }) => {
    const repoUrl = resolveGithubRepoUrl(githubRepoInput);
    const verification = await verifyGithubRepoForOnboarding({
      repoUrl,
      githubToken,
      mode,
    });
    if (!verification.ok) return verification;

    if (
      mode === "existing" &&
      verification.repoExists &&
      !verification.repoIsEmpty
    ) {
      const cloneResult = await cloneRepoToTemp({
        repoUrl,
        githubToken,
        shellCmd,
      });
      if (!cloneResult.ok) {
        return { ok: false, status: 400, error: cloneResult.error };
      }
      return { ...verification, tempDir: cloneResult.tempDir };
    }

    return verification;
  };

  const completeOnboarding = async ({ req, vars, modelKey, importMode = false }) => {
    const validation = validateOnboardingInput({
      vars,
      modelKey,
      resolveModelProvider,
      hasCodexOauthProfile,
    });
    if (!validation.ok) {
      return {
        status: validation.status,
        body: { ok: false, error: validation.error },
      };
    }

    const {
      varMap,
      githubToken,
      githubRepoInput,
      selectedProvider,
      hasCodexOauth,
    } = validation.data;

    const repoUrl = resolveGithubRepoUrl(githubRepoInput);
    const remoteUrl = `https://github.com/${repoUrl}.git`;
    const existingConfigPresent =
      importMode &&
      (fs.existsSync(`${OPENCLAW_DIR}/openclaw.json`) ||
        fs.existsSync(`${OPENCLAW_DIR}/.openclaw/openclaw.json`));
    const existingEnvVars =
      typeof readEnvFile === "function" ? readEnvFile() : [];
    const varsToSave = [...existingEnvVars];
    for (const entry of vars.filter(
      (item) => item.value && item.key !== "GITHUB_WORKSPACE_REPO",
    )) {
      upsertEnvVar(varsToSave, entry.key, entry.value);
    }
    upsertEnvVar(varsToSave, "GITHUB_WORKSPACE_REPO", repoUrl);
    if (importMode && existingConfigPresent) {
      normalizeImportedConfig({
        fs,
        openclawDir: OPENCLAW_DIR,
      });
      const systemVars =
        constants.kSystemVars instanceof Set ? constants.kSystemVars : new Set();
      const referencedEnvVars = getImportedConfigEnvRefs({
        fs,
        openclawDir: OPENCLAW_DIR,
      });
      for (const envKey of referencedEnvVars) {
        if (systemVars.has(envKey)) continue;
        const existingValue = String(
          varsToSave.find((entry) => entry.key === envKey)?.value || "",
        ).trim();
        if (existingValue) continue;
        upsertEnvVar(varsToSave, envKey, kPlaceholderEnvValue);
      }
    }
    writeEnvFile(varsToSave);
    reloadEnv();

    if (!importMode) {
      const [, repoName] = repoUrl.split("/");
      const repoCheck = await ensureGithubRepoAccessible({
        repoUrl,
        repoName,
        githubToken,
      });
      if (!repoCheck.ok) {
        return {
          status: repoCheck.status,
          body: { ok: false, error: repoCheck.error },
        };
      }
    }

    fs.mkdirSync(OPENCLAW_DIR, { recursive: true });
    fs.mkdirSync(WORKSPACE_DIR, { recursive: true });
    migrateManagedInternalFiles({
      fs,
      openclawDir: OPENCLAW_DIR,
    });
    syncBootstrapPromptFiles({
      fs,
      workspaceDir: WORKSPACE_DIR,
      baseUrl: getBaseUrl(req),
      skipExisting: importMode,
    });
    ensureOpenclawRuntimeArtifacts({
      fs,
      openclawDir: OPENCLAW_DIR,
    });

    if (!fs.existsSync(`${OPENCLAW_DIR}/.git`)) {
      await shellCmd(
        `cd ${OPENCLAW_DIR} && git init -b main && git remote add origin "${remoteUrl}" && git config user.email "agent@alphaclaw.md" && git config user.name "AlphaClaw Agent"`,
      );
      console.log("[onboard] Git initialized");
    } else if (importMode) {
      // Ensure remote points to the correct URL for imported repos
      try {
        await shellCmd(
          `cd ${OPENCLAW_DIR} && git remote set-url origin "${remoteUrl}" && git config user.email "agent@alphaclaw.md" && git config user.name "AlphaClaw Agent"`,
        );
      } catch {}
    }

    if (!fs.existsSync(`${OPENCLAW_DIR}/.gitignore`)) {
      fs.copyFileSync(
        path.join(kSetupDir, "gitignore"),
        `${OPENCLAW_DIR}/.gitignore`,
      );
    }

    if (!existingConfigPresent) {
      const onboardArgs = buildOnboardArgs({
        varMap,
        selectedProvider,
        hasCodexOauth,
        workspaceDir: WORKSPACE_DIR,
      });
      await shellCmd(
        `openclaw onboard ${onboardArgs.map((a) => `"${a}"`).join(" ")}`,
        {
          env: {
            ...process.env,
            OPENCLAW_HOME: kRootDir,
            OPENCLAW_CONFIG_PATH: `${OPENCLAW_DIR}/openclaw.json`,
          },
          timeout: 120000,
        },
      );
      console.log("[onboard] Onboard complete");
    } else {
      console.log("[onboard] Skipped openclaw onboard (existing config present)");
    }

    await shellCmd(`openclaw models set "${modelKey}"`, {
      env: gatewayEnv(),
      timeout: 30000,
    }).catch((e) => {
      console.error("[onboard] Failed to set model:", e.message);
      throw new Error(
        `Onboarding completed but failed to set model "${modelKey}"`,
      );
    });

    try {
      fs.rmSync(`${WORKSPACE_DIR}/.git`, { recursive: true, force: true });
    } catch {}

    if (!existingConfigPresent) {
      writeSanitizedOpenclawConfig({ fs, openclawDir: OPENCLAW_DIR, varMap });
    }
    authProfiles?.syncConfigAuthReferencesForAgent?.();
    ensureGatewayProxyConfig(getBaseUrl(req));

    installControlUiSkill({
      fs,
      openclawDir: OPENCLAW_DIR,
      baseUrl: getBaseUrl(req),
    });
    installGogCliSkill({ fs, openclawDir: OPENCLAW_DIR });

    installHourlyGitSyncScript({ fs, openclawDir: OPENCLAW_DIR });
    await installHourlyGitSyncCron({ fs, openclawDir: OPENCLAW_DIR });
    fs.mkdirSync(path.dirname(kOnboardingMarkerPath), { recursive: true });
    fs.writeFileSync(
      kOnboardingMarkerPath,
      JSON.stringify(
        {
          onboarded: true,
          reason: importMode ? "import_complete" : "onboarding_complete",
          markedAt: new Date().toISOString(),
        },
        null,
        2,
      ),
    );

    try {
      const commitMsg = importMode
        ? "imported existing setup via AlphaClaw"
        : "initial setup";
      await shellCmd(`alphaclaw git-sync -m "${commitMsg}"`, {
        timeout: 30000,
        env: {
          ...process.env,
          GITHUB_TOKEN: githubToken,
        },
      });
      console.log("[onboard] Initial state committed and pushed");
    } catch (e) {
      console.error("[onboard] Git push error:", e.message);
    }

    startGateway();
    return { status: 200, body: { ok: true } };
  };

  return { completeOnboarding, verifyGithubSetup };
};

module.exports = { createOnboardingService };
