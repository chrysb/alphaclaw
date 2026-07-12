const fs = require("fs");
const path = require("path");
const { DatabaseSync } = require("node:sqlite");
const { AUTH_PROFILES_PATH, CODEX_PROFILE_ID, OPENCLAW_DIR } = require("./constants");

const kDefaultAgentId = "main";
const kApiKeyEnvVarByProvider = {
  anthropic: "ANTHROPIC_API_KEY",
  openai: "OPENAI_API_KEY",
  google: "GEMINI_API_KEY",
  opencode: "OPENCODE_API_KEY",
  openrouter: "OPENROUTER_API_KEY",
  zai: "ZAI_API_KEY",
  "vercel-ai-gateway": "AI_GATEWAY_API_KEY",
  kilocode: "KILOCODE_API_KEY",
  xai: "XAI_API_KEY",
  mistral: "MISTRAL_API_KEY",
  cerebras: "CEREBRAS_API_KEY",
  moonshot: "MOONSHOT_API_KEY",
  "kimi-coding": "KIMI_API_KEY",
  volcengine: "VOLCANO_ENGINE_API_KEY",
  byteplus: "BYTEPLUS_API_KEY",
  synthetic: "SYNTHETIC_API_KEY",
  minimax: "MINIMAX_API_KEY",
  voyage: "VOYAGE_API_KEY",
  groq: "GROQ_API_KEY",
  deepgram: "DEEPGRAM_API_KEY",
  vllm: "VLLM_API_KEY",
};

const normalizeSecret = (raw) =>
  String(raw ?? "")
    .replace(/[\r\n\u2028\u2029]/g, "")
    .trim();

const credentialMode = (credential) => {
  if (credential.type === "api_key") return "api_key";
  if (credential.type === "token") return "token";
  return "oauth";
};

const getEnvVarForApiKeyProvider = (provider) =>
  kApiKeyEnvVarByProvider[String(provider || "").trim()] || "";

const listApiKeyProviders = () => Object.keys(kApiKeyEnvVarByProvider);

const getDefaultProfileIdForApiKeyProvider = (provider) => {
  const normalized = String(provider || "").trim();
  return normalized ? `${normalized}:default` : "";
};

const resolveAgentDir = (agentId = kDefaultAgentId) =>
  path.join(OPENCLAW_DIR, "agents", agentId, "agent");

const resolveAuthProfilesPath = (agentId = kDefaultAgentId) =>
  path.join(resolveAgentDir(agentId), "auth-profiles.json");

const resolveAuthDatabasePath = (agentId = kDefaultAgentId) =>
  path.join(resolveAgentDir(agentId), "openclaw-agent.sqlite");

const loadSqliteAuthStore = (agentId = kDefaultAgentId) => {
  const databasePath = resolveAuthDatabasePath(agentId);
  if (!fs.existsSync(databasePath)) return null;
  let database;
  try {
    database = new DatabaseSync(databasePath, { readOnly: true });
    const secretsRow = database
      .prepare("SELECT store_json FROM auth_profile_store WHERE store_key = ?")
      .get("primary");
    if (!secretsRow?.store_json) return null;
    const secrets = JSON.parse(secretsRow.store_json);
    const stateRow = database
      .prepare("SELECT state_json FROM auth_profile_state WHERE state_key = ?")
      .get("primary");
    const state = stateRow?.state_json ? JSON.parse(stateRow.state_json) : {};
    return {
      version: Number(secrets.version || state.version || 1),
      profiles: secrets.profiles || {},
      order: state.order,
      lastGood: state.lastGood,
      usageStats: state.usageStats,
    };
  } catch {
    return null;
  } finally {
    database?.close();
  }
};

const saveSqliteAuthStore = (agentId, store) => {
  const databasePath = resolveAuthDatabasePath(agentId);
  if (!fs.existsSync(databasePath)) return false;
  let database;
  try {
    database = new DatabaseSync(databasePath);
    const now = Date.now();
    const secrets = {
      version: Number(store.version || 1),
      profiles: store.profiles || {},
    };
    const state = {
      version: Number(store.version || 1),
      ...(store.order !== undefined ? { order: store.order } : {}),
      ...(store.lastGood !== undefined ? { lastGood: store.lastGood } : {}),
      ...(store.usageStats !== undefined ? { usageStats: store.usageStats } : {}),
    };
    database.exec("BEGIN IMMEDIATE");
    database
      .prepare(
        `INSERT INTO auth_profile_store (store_key, store_json, updated_at)
         VALUES (?, ?, ?)
         ON CONFLICT(store_key) DO UPDATE SET
           store_json = excluded.store_json,
           updated_at = excluded.updated_at`,
      )
      .run("primary", JSON.stringify(secrets), now);
    database
      .prepare(
        `INSERT INTO auth_profile_state (state_key, state_json, updated_at)
         VALUES (?, ?, ?)
         ON CONFLICT(state_key) DO UPDATE SET
           state_json = excluded.state_json,
           updated_at = excluded.updated_at`,
      )
      .run("primary", JSON.stringify(state), now);
    database.exec("COMMIT");
    return true;
  } catch {
    try {
      database?.exec("ROLLBACK");
    } catch {}
    return false;
  } finally {
    database?.close();
  }
};

const resolveOpenclawConfigPath = () =>
  path.join(OPENCLAW_DIR, "openclaw.json");

const hasCompletedOnboardingConfig = (cfg) =>
  String(cfg?.agents?.defaults?.model?.primary || "").trim().includes("/");

const loadAuthStore = (agentId = kDefaultAgentId) => {
  const sqliteStore = loadSqliteAuthStore(agentId);
  if (sqliteStore) return sqliteStore;
  const storePath = resolveAuthProfilesPath(agentId);
  let store = { version: 1, profiles: {} };
  try {
    if (fs.existsSync(storePath)) {
      const parsed = JSON.parse(fs.readFileSync(storePath, "utf8"));
      if (
        parsed &&
        typeof parsed === "object" &&
        parsed.profiles &&
        typeof parsed.profiles === "object"
      ) {
        store = {
          version: Number(parsed.version || 1),
          profiles: parsed.profiles,
          order: parsed.order,
          lastGood: parsed.lastGood,
          usageStats: parsed.usageStats,
        };
      }
    }
  } catch {}
  return store;
};

const saveAuthStore = (agentId, store) => {
  if (saveSqliteAuthStore(agentId, store)) return;
  const storePath = resolveAuthProfilesPath(agentId);
  fs.mkdirSync(path.dirname(storePath), { recursive: true });
  fs.writeFileSync(
    storePath,
    JSON.stringify(
      {
        version: Number(store.version || 1),
        profiles: store.profiles || {},
        ...(store.order !== undefined ? { order: store.order } : {}),
        ...(store.lastGood !== undefined ? { lastGood: store.lastGood } : {}),
        ...(store.usageStats !== undefined
          ? { usageStats: store.usageStats }
          : {}),
      },
      null,
      2,
    ),
  );
};

const loadOpenclawConfig = () => {
  const configPath = resolveOpenclawConfigPath();
  try {
    return JSON.parse(fs.readFileSync(configPath, "utf8"));
  } catch {
    return {};
  }
};

const canSyncOpenclawAuthReferences = () => {
  const configPath = resolveOpenclawConfigPath();
  if (!fs.existsSync(configPath)) return false;
  try {
    const cfg = JSON.parse(fs.readFileSync(configPath, "utf8"));
    return hasCompletedOnboardingConfig(cfg);
  } catch {
    return false;
  }
};

const saveOpenclawConfig = (cfg) => {
  const configPath = resolveOpenclawConfigPath();
  fs.writeFileSync(configPath, JSON.stringify(cfg, null, 2));
};

const syncConfigAuthReference = (cfg, profileId, credential) => {
  const next = { ...cfg };
  if (!next.auth) next.auth = {};
  if (!next.auth.profiles) next.auth.profiles = {};
  next.auth = { ...next.auth, profiles: { ...next.auth.profiles } };
  next.auth.profiles[profileId] = {
    provider: credential.provider,
    mode: credentialMode(credential),
  };
  return next;
};

const removeConfigAuthReference = (cfg, profileId) => {
  if (!cfg.auth?.profiles?.[profileId]) return cfg;
  const next = { ...cfg };
  next.auth = { ...next.auth, profiles: { ...next.auth.profiles } };
  delete next.auth.profiles[profileId];
  if (Object.keys(next.auth.profiles).length === 0) {
    delete next.auth.profiles;
  }
  if (Object.keys(next.auth).length === 0) {
    delete next.auth;
  }
  return next;
};

const createAuthProfiles = () => {
  // ── Generic profile operations ──

  const listProfiles = (agentId = kDefaultAgentId) => {
    const store = loadAuthStore(agentId);
    return Object.entries(store.profiles || {}).map(([id, cred]) => ({
      id,
      ...cred,
    }));
  };

  const listProfilesByProvider = (provider, agentId = kDefaultAgentId) =>
    listProfiles(agentId).filter((p) => p.provider === provider);

  const getProfile = (profileId, agentId = kDefaultAgentId) => {
    const store = loadAuthStore(agentId);
    const cred = store.profiles?.[profileId];
    if (!cred) return null;
    return { id: profileId, ...cred };
  };

  const upsertProfile = (profileId, credential, agentId = kDefaultAgentId) => {
    const store = loadAuthStore(agentId);
    const sanitized = { ...credential };
    if (sanitized.key) sanitized.key = normalizeSecret(sanitized.key);
    if (sanitized.token) sanitized.token = normalizeSecret(sanitized.token);
    if (sanitized.access) sanitized.access = normalizeSecret(sanitized.access);
    if (sanitized.refresh)
      sanitized.refresh = normalizeSecret(sanitized.refresh);
    store.profiles[profileId] = sanitized;
    saveAuthStore(agentId, store);

    if (!canSyncOpenclawAuthReferences()) return;
    const cfg = loadOpenclawConfig();
    const updated = syncConfigAuthReference(cfg, profileId, sanitized);
    saveOpenclawConfig(updated);
  };

  const removeProfile = (profileId, agentId = kDefaultAgentId) => {
    const store = loadAuthStore(agentId);
    if (!store.profiles[profileId]) return false;
    delete store.profiles[profileId];
    saveAuthStore(agentId, store);

    if (!canSyncOpenclawAuthReferences()) return true;
    const cfg = loadOpenclawConfig();
    const updated = removeConfigAuthReference(cfg, profileId);
    saveOpenclawConfig(updated);
    return true;
  };

  const setAuthOrder = (provider, orderedProfileIds, agentId = kDefaultAgentId) => {
    const store = loadAuthStore(agentId);
    if (!store.order) store.order = {};
    store.order[provider] = orderedProfileIds;
    saveAuthStore(agentId, store);
  };

  const syncConfigAuthReferencesForAgent = (agentId = kDefaultAgentId) => {
    if (!canSyncOpenclawAuthReferences()) return;
    const store = loadAuthStore(agentId);
    let cfg = loadOpenclawConfig();
    for (const [profileId, credential] of Object.entries(store.profiles || {})) {
      if (!credential?.type || !credential?.provider) continue;
      cfg = syncConfigAuthReference(cfg, profileId, credential);
    }
    saveOpenclawConfig(cfg);
  };

  const upsertApiKeyProfileForEnvVar = (
    provider,
    rawValue,
    agentId = kDefaultAgentId,
  ) => {
    const key = normalizeSecret(rawValue);
    if (!provider || !key) return false;
    upsertProfile(
      getDefaultProfileIdForApiKeyProvider(provider),
      {
        type: "api_key",
        provider,
        key,
      },
      agentId,
    );
    return true;
  };

  const removeApiKeyProfileForEnvVar = (provider, agentId = kDefaultAgentId) => {
    const profileId = getDefaultProfileIdForApiKeyProvider(provider);
    if (!profileId) return false;
    const existing = getProfile(profileId, agentId);
    if (!existing) return false;
    if (existing.type !== "api_key" || existing.provider !== provider) return false;
    return removeProfile(profileId, agentId);
  };

  // ── Model config operations ──

  const preserveCodexRuntimeModels = (configuredModels) => {
    const models =
      configuredModels && typeof configuredModels === "object"
        ? configuredModels
        : {};
    if (!hasCodexOauthProfile()) return models;
    return Object.fromEntries(
      Object.entries(models).map(([modelKey, modelConfig]) => {
        if (!modelKey.startsWith("openai/gpt-")) {
          return [modelKey, modelConfig];
        }
        return [
          modelKey,
          {
            ...(modelConfig && typeof modelConfig === "object"
              ? modelConfig
              : {}),
            agentRuntime: { id: "codex" },
          },
        ];
      }),
    );
  };

  const getModelConfig = () => {
    const cfg = loadOpenclawConfig();
    const defaults = cfg.agents?.defaults || {};
    const configuredModels = preserveCodexRuntimeModels(defaults.models || {});
    if (JSON.stringify(configuredModels) !== JSON.stringify(defaults.models || {})) {
      cfg.agents.defaults.models = configuredModels;
      saveOpenclawConfig(cfg);
    }
    return {
      primary: defaults.model?.primary || null,
      configuredModels,
    };
  };

  const setModelConfig = ({ primary, configuredModels }) => {
    const cfg = loadOpenclawConfig();
    if (!cfg.agents) cfg.agents = {};
    if (!cfg.agents.defaults) cfg.agents.defaults = {};
    if (!cfg.agents.defaults.model) cfg.agents.defaults.model = {};
    if (primary !== undefined) {
      cfg.agents.defaults.model.primary = primary;
    }
    if (configuredModels !== undefined) {
      cfg.agents.defaults.models = preserveCodexRuntimeModels(configuredModels);
    }
    saveOpenclawConfig(cfg);
  };

  // ── Legacy Codex-specific wrappers ──

  const listCodexProfiles = () =>
    listProfiles().filter(
      (profile) =>
        profile.type === "oauth" &&
        (profile.provider === "openai" || profile.provider === "openai-codex"),
    );

  const getCodexProfile = () => {
    const profiles = listCodexProfiles();
    if (profiles.length === 0) return null;
    const preferred =
      profiles.find((p) => p.id === CODEX_PROFILE_ID) || profiles[0];
    return { profileId: preferred.id, ...preferred };
  };

  const hasCodexOauthProfile = () => {
    const profile = getCodexProfile();
    return !!(profile?.access && profile?.refresh);
  };

  const upsertCodexProfile = ({ access, refresh, expires, accountId }) => {
    upsertProfile(CODEX_PROFILE_ID, {
      type: "oauth",
      provider: "openai",
      access,
      refresh,
      expires,
      ...(accountId ? { accountId } : {}),
    });
  };

  const removeCodexProfiles = () => {
    const store = loadAuthStore();
    let changed = false;
    for (const [id, cred] of Object.entries(store.profiles || {})) {
      if (
        cred?.type === "oauth" &&
        (cred.provider === "openai" || cred.provider === "openai-codex")
      ) {
        delete store.profiles[id];
        changed = true;
      }
    }
    if (changed) {
      saveAuthStore(kDefaultAgentId, store);
      if (!canSyncOpenclawAuthReferences()) return changed;
      let cfg = loadOpenclawConfig();
      for (const [id, cred] of Object.entries(cfg.auth?.profiles || {})) {
        if (
          cred?.mode === "oauth" &&
          (cred.provider === "openai" || cred.provider === "openai-codex")
        ) {
          cfg = removeConfigAuthReference(cfg, id);
        }
      }
      saveOpenclawConfig(cfg);
    }
    return changed;
  };

  return {
    listProfiles,
    listProfilesByProvider,
    getProfile,
    upsertProfile,
    removeProfile,
    setAuthOrder,
    syncConfigAuthReferencesForAgent,
    upsertApiKeyProfileForEnvVar,
    removeApiKeyProfileForEnvVar,
    getEnvVarForApiKeyProvider,
    listApiKeyProviders,
    getDefaultProfileIdForApiKeyProvider,
    getModelConfig,
    setModelConfig,
    getCodexProfile,
    hasCodexOauthProfile,
    upsertCodexProfile,
    removeCodexProfiles,
    loadAuthStore,
  };
};

module.exports = { createAuthProfiles, getEnvVarForApiKeyProvider };
