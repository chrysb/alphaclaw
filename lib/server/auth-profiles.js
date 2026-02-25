const fs = require("fs");
const path = require("path");
const { AUTH_PROFILES_PATH, CODEX_PROFILE_ID } = require("./constants");

const createAuthProfiles = () => {
  const ensureAuthProfilesStore = () => {
    let store = { version: 1, profiles: {} };
    try {
      if (fs.existsSync(AUTH_PROFILES_PATH)) {
        const parsed = JSON.parse(fs.readFileSync(AUTH_PROFILES_PATH, "utf8"));
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

  const saveAuthProfilesStore = (store) => {
    fs.mkdirSync(path.dirname(AUTH_PROFILES_PATH), { recursive: true });
    fs.writeFileSync(
      AUTH_PROFILES_PATH,
      JSON.stringify(
        {
          version: Number(store.version || 1),
          profiles: store.profiles || {},
          order: store.order,
          lastGood: store.lastGood,
          usageStats: store.usageStats,
        },
        null,
        2,
      ),
    );
  };

  const listCodexProfiles = () => {
    const store = ensureAuthProfilesStore();
    return Object.entries(store.profiles || {})
      .filter(([, cred]) => cred?.provider === "openai-codex")
      .map(([id, cred]) => ({ id, cred }));
  };

  const getCodexProfile = () => {
    const profiles = listCodexProfiles();
    if (profiles.length === 0) return null;
    const preferred = profiles.find((p) => p.id === CODEX_PROFILE_ID) || profiles[0];
    return { profileId: preferred.id, ...preferred.cred };
  };

  const hasCodexOauthProfile = () => {
    const profile = getCodexProfile();
    return !!(profile?.access && profile?.refresh);
  };

  const upsertCodexProfile = ({ access, refresh, expires, accountId }) => {
    const store = ensureAuthProfilesStore();
    store.profiles[CODEX_PROFILE_ID] = {
      type: "oauth",
      provider: "openai-codex",
      access,
      refresh,
      expires,
      ...(accountId ? { accountId } : {}),
    };
    saveAuthProfilesStore(store);
  };

  const removeCodexProfiles = () => {
    const store = ensureAuthProfilesStore();
    let changed = false;
    for (const [id, cred] of Object.entries(store.profiles || {})) {
      if (cred?.provider === "openai-codex") {
        delete store.profiles[id];
        changed = true;
      }
    }
    if (changed) saveAuthProfilesStore(store);
    return changed;
  };

  return {
    getCodexProfile,
    hasCodexOauthProfile,
    upsertCodexProfile,
    removeCodexProfiles,
  };
};

module.exports = { createAuthProfiles };
