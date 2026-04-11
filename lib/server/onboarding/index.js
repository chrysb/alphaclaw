const path = require("path");
const { kSetupDir, kRootDir } = require("../constants");
const {
  resolveConfigIncludes,
  resolveImportedConfigPaths,
} = require("./import/import-config");
const { validateOnboardingInput } = require("./validation");
const {
  ensureGithubRepoAccessible,
  verifyGithubRepoForOnboarding,
  cloneRepoToTemp,
} = require("./github");
const {
  buildOnboardArgs,
  writeManagedImportOpenclawConfig,
  writeSanitizedOpenclawConfig,
} = require("./openclaw");
const {
  ensureOpenclawRuntimeArtifacts,
  syncBootstrapPromptFiles,
} = require("./workspace");
const {
  installHourlyGitSyncScript,
  installHourlyGitSyncCron,
} = require("./cron");
const { migrateManagedInternalFiles } = require("../internal-files-migration");
const { installGogCliSkill } = require("../gog-skill");
const { ensureManagedExecDefaults } = require("../exec-defaults-config");

const kPlaceholderEnvValue = "placeholder";
const kEnvRefPattern = /\$\{([A-Z_][A-Z0-9_]*)\}/g;
const kImportedPairingKeys = ["allowFrom", "groupAllowFrom"];

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

const removeEnvVar = (items, key) => {
  const normalizedKey = String(key || "").trim();
  if (!normalizedKey) return items;
  const idx = items.findIndex((entry) => entry.key === normalizedKey);
  if (idx !== -1) items.splice(idx, 1);
  return items;
};

const applySubmittedEnvVars = (items, vars = []) => {
  for (const entry of vars || []) {
    const key = String(entry?.key || "").trim();
    if (!key || key === "GITHUB_WORKSPACE_REPO") continue;
    const value = String(entry?.value || "");
    if (value) {
      upsertEnvVar(items, key, value);
    } else {
      removeEnvVar(items, key);
    }
  }
  return items;
};

const pruneConflictingProviderAuthVars = (items, { selectedProvider, varMap }) => {
  if (selectedProvider !== "anthropic") return items;
  const hasAnthropicToken = !!String(varMap.ANTHROPIC_TOKEN || "").trim();
  const hasAnthropicApiKey = !!String(varMap.ANTHROPIC_API_KEY || "").trim();
  if (hasAnthropicToken && !hasAnthropicApiKey) {
    removeEnvVar(items, "ANTHROPIC_API_KEY");
  } else if (hasAnthropicApiKey && !hasAnthropicToken) {
    removeEnvVar(items, "ANTHROPIC_TOKEN");
  }
  return items;
};

const clearImportedChannelPairingState = (channelsRoot) => {
  if (!channelsRoot || typeof channelsRoot !== "object") return false;
  let changed = false;
  for (const [channelKey, channelConfig] of Object.entries(channelsRoot)) {
    if (!channelConfig || typeof channelConfig !== "object") continue;
    if (
      channelKey === "telegram" &&
      Object.prototype.hasOwnProperty.call(channelConfig, "accounts")
    ) {
      delete channelConfig.accounts;
      changed = true;
    }
    for (const pairingKey of kImportedPairingKeys) {
      if (
        Object.prototype.hasOwnProperty.call(channelConfig, pairingKey) &&
        (!Array.isArray(channelConfig[pairingKey]) ||
          channelConfig[pairingKey].length > 0)
      ) {
        channelConfig[pairingKey] = [];
        changed = true;
      }
    }
    if (
      channelConfig.dmPolicy === "allowlist" &&
      (!Array.isArray(channelConfig.allowFrom) ||
        channelConfig.allowFrom.length === 0)
    ) {
      channelConfig.dmPolicy = "pairing";
      changed = true;
    }
  }
  return changed;
};

const clearImportedCredentialPairings = ({ fs, openclawDir }) => {
  const credentialsDir = path.join(openclawDir, "credentials");
  if (!fs.existsSync(credentialsDir)) return;
  let entries = [];
  try {
    entries = fs.readdirSync(credentialsDir);
  } catch {
    return;
  }
  for (const entry of entries) {
    const fileName = typeof entry === "string" ? entry : entry?.name;
    if (!fileName || !fileName.endsWith("-allowFrom.json")) continue;
    const filePath = path.join(credentialsDir, fileName);
    try {
      const parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
      if (!parsed || typeof parsed !== "object") continue;
      if (Array.isArray(parsed.allowFrom) && parsed.allowFrom.length === 0) {
        continue;
      }
      parsed.allowFrom = [];
      fs.writeFileSync(filePath, JSON.stringify(parsed, null, 2));
    } catch {}
  }
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

const getEnvVarValue = (items, key) =>
  items.find((entry) => entry.key === key)?.value || "";

const syncApiKeyAuthProfilesFromEnvVars = (authProfiles, envVars = []) => {
  if (!authProfiles?.getEnvVarForApiKeyProvider) return;
  const providers = [
    "anthropic",
    "openai",
    "google",
    "opencode",
    "openrouter",
    "zai",
    "vercel-ai-gateway",
    "kilocode",
    "xai",
    "mistral",
    "cerebras",
    "moonshot",
    "kimi-coding",
    "volcengine",
    "byteplus",
    "synthetic",
    "minimax",
    "voyage",
    "groq",
    "deepgram",
    "vllm",
  ];
  const envMap = new Map(
    (envVars || []).map((entry) => [
      String(entry?.key || "").trim(),
      String(entry?.value || ""),
    ]),
  );
  for (const provider of providers) {
    const envKey = authProfiles.getEnvVarForApiKeyProvider(provider);
    if (!envKey) continue;
    const value = String(envMap.get(envKey) || "").trim();
    if (!value || value === kPlaceholderEnvValue) continue;
    authProfiles.upsertApiKeyProfileForEnvVar?.(provider, value);
  }
};

const buildPlaceholderReview = ({
  referencedEnvVars,
  envVars = [],
  systemVars = new Set(),
}) => {
  const vars = Array.from(referencedEnvVars)
    .filter((envKey) => !systemVars.has(envKey))
    .sort()
    .map((envKey) => {
      const currentValue = String(getEnvVarValue(envVars, envKey) || "").trim();
      const status =
        currentValue === kPlaceholderEnvValue
          ? "placeholder"
          : currentValue
            ? "resolved"
            : "missing";
      if (status === "resolved") return null;
      return {
        key: envKey,
        status,
      };
    })
    .filter(Boolean);
  return {
    found: vars.length > 0,
    count: vars.length,
    vars,
  };
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
    const currentWebhookToken = String(cfg?.hooks?.token || "").trim();
    const expectedWebhookTokenRef = "${WEBHOOK_TOKEN}";
    if (cfg.hooks && currentWebhookToken !== expectedWebhookTokenRef) {
      cfg.hooks = {
        ...(cfg.hooks || {}),
        token: expectedWebhookTokenRef,
      };
      changed = true;
    }
    if (
      cfg.hooks &&
      Object.prototype.hasOwnProperty.call(cfg.hooks, "transformsDir")
    ) {
      const { transformsDir, ...nextHooks } = cfg.hooks;
      void transformsDir;
      cfg.hooks = nextHooks;
      changed = true;
    }
    const configFileName = path.basename(configPath).toLowerCase();
    const channelsRoot =
      cfg.channels && typeof cfg.channels === "object"
        ? cfg.channels
        : configFileName.includes("channel")
          ? cfg
          : null;
    changed = clearImportedChannelPairingState(channelsRoot) || changed;
    if (changed) {
      fs.writeFileSync(configPath, JSON.stringify(cfg, null, 2));
    }
  }
  clearImportedCredentialPairings({ fs, openclawDir });
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

const getImportedPlaceholderReview = ({
  fs,
  openclawDir,
  envVars = [],
  systemVars = new Set(),
  normalizeConfig = false,
}) => {
  if (normalizeConfig) {
    normalizeImportedConfig({ fs, openclawDir });
  }
  const referencedEnvVars = getImportedConfigEnvRefs({ fs, openclawDir });
  return buildPlaceholderReview({
    referencedEnvVars,
    envVars,
    systemVars,
  });
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

  const completeOnboarding = async ({
    req,
    vars,
    modelKey,
    importMode = false,
  }) => {
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
      importMode && fs.existsSync(`${OPENCLAW_DIR}/openclaw.json`);
    const existingEnvVars =
      typeof readEnvFile === "function" ? readEnvFile() : [];
    const varsToSave = [...existingEnvVars];
    applySubmittedEnvVars(varsToSave, vars);
    upsertEnvVar(varsToSave, "GITHUB_WORKSPACE_REPO", repoUrl);
    pruneConflictingProviderAuthVars(varsToSave, {
      selectedProvider,
      varMap,
    });
    if (importMode && existingConfigPresent) {
      const systemVars =
        constants.kSystemVars instanceof Set
          ? constants.kSystemVars
          : new Set();
      const placeholderReview = getImportedPlaceholderReview({
        fs,
        openclawDir: OPENCLAW_DIR,
        envVars: varsToSave,
        systemVars,
        normalizeConfig: true,
      });
      for (const placeholderVar of placeholderReview.vars) {
        upsertEnvVar(varsToSave, placeholderVar.key, kPlaceholderEnvValue);
      }
    }
    writeEnvFile(varsToSave);
    reloadEnv();
    syncApiKeyAuthProfilesFromEnvVars(authProfiles, varsToSave);

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
    });
    ensureOpenclawRuntimeArtifacts({
      fs,
      openclawDir: OPENCLAW_DIR,
    });

    const hadImportedGit = importMode && fs.existsSync(`${OPENCLAW_DIR}/.git`);
    if (hadImportedGit) {
      try {
        fs.rmSync(`${OPENCLAW_DIR}/.git`, { recursive: true, force: true });
      } catch {}
    }

    if (hadImportedGit || !fs.existsSync(`${OPENCLAW_DIR}/.git`)) {
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
            OPENCLAW_STATE_DIR: OPENCLAW_DIR,
            XDG_CONFIG_HOME: OPENCLAW_DIR,
          },
          timeout: 120000,
        },
      );
      console.log("[onboard] Onboard complete");
    } else {
      console.log(
        "[onboard] Skipped openclaw onboard (existing config present)",
      );
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
    } else if (importMode) {
      writeManagedImportOpenclawConfig({
        fs,
        openclawDir: OPENCLAW_DIR,
        varMap,
      });
    }
    authProfiles?.syncConfigAuthReferencesForAgent?.();
    ensureManagedExecDefaults({
      fsModule: fs,
      openclawDir: OPENCLAW_DIR,
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

    ensureGatewayProxyConfig(getBaseUrl(req));

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

module.exports = {
  createOnboardingService,
  getImportedPlaceholderReview,
};
