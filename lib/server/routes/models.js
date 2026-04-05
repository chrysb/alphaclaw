const { kFallbackOnboardingModels } = require("../constants");
const { createModelCatalogCache } = require("../model-catalog-cache");

const runModelsGitSync = async (shellCmd) => {
  if (typeof shellCmd !== "function") return null;
  try {
    await shellCmd('alphaclaw git-sync -m "models: update config" -f "openclaw.json"', {
      timeout: 30000,
    });
    return null;
  } catch (err) {
    return err?.message || "alphaclaw git-sync failed";
  }
};

const registerModelRoutes = ({
  app,
  shellCmd,
  gatewayEnv,
  parseJsonFromNoisyOutput,
  normalizeOnboardingModels,
  authProfiles,
  readEnvFile,
  writeEnvFile,
  reloadEnv,
  modelCatalogCache = createModelCatalogCache({
    shellCmd,
    gatewayEnv,
    parseJsonFromNoisyOutput,
    normalizeOnboardingModels,
    fallbackModels: kFallbackOnboardingModels,
  }),
}) => {
  const upsertEnvVar = (items, key, value) => {
    const next = Array.isArray(items) ? [...items] : [];
    const existing = next.find((entry) => entry.key === key);
    if (existing) {
      existing.value = value;
      return next;
    }
    next.push({ key, value });
    return next;
  };

  const removeEnvVar = (items, key) => {
    const next = Array.isArray(items) ? [...items] : [];
    return next.filter((entry) => entry.key !== key);
  };

  const readEnvVarMap = () => {
    if (typeof readEnvFile !== "function") return new Map();
    return new Map(
      (readEnvFile() || []).map((entry) => [
        String(entry?.key || "").trim(),
        String(entry?.value || "").trim(),
      ]),
    );
  };

  const buildEnvBackedProfiles = (agentId) => {
    const envMap = readEnvVarMap();
    const providers = authProfiles.listApiKeyProviders?.() || [];
    return providers.flatMap((provider) => {
      const envKey = authProfiles.getEnvVarForApiKeyProvider?.(provider);
      const envValue = String(envMap.get(envKey) || "").trim();
      if (!envKey || !envValue) return [];
      const profileId =
        authProfiles.getDefaultProfileIdForApiKeyProvider?.(provider) ||
        `${provider}:default`;
      return [
        {
          id: profileId,
          type: "api_key",
          provider,
          key: envValue,
        },
      ];
    });
  };

  const mergeProfilesWithEnvFallback = (profiles, agentId) => {
    const mergedProfiles = Array.isArray(profiles) ? [...profiles] : [];
    const profileIndexById = new Map(
      mergedProfiles.map((profile, index) => [profile?.id, index]),
    );
    for (const envProfile of buildEnvBackedProfiles(agentId)) {
      const existingIndex = profileIndexById.get(envProfile.id);
      if (existingIndex === undefined) {
        profileIndexById.set(envProfile.id, mergedProfiles.length);
        mergedProfiles.push(envProfile);
        continue;
      }
      const existingProfile = mergedProfiles[existingIndex] || {};
      const existingValue = String(
        existingProfile?.key || existingProfile?.token || existingProfile?.access || "",
      ).trim();
      if (existingValue) continue;
      mergedProfiles[existingIndex] = {
        ...existingProfile,
        ...envProfile,
      };
    }
    return mergedProfiles;
  };

  const syncEnvVarsForProfiles = (profiles) => {
    if (
      !Array.isArray(profiles) ||
      typeof readEnvFile !== "function" ||
      typeof writeEnvFile !== "function" ||
      typeof reloadEnv !== "function"
    ) {
      return;
    }
    let nextEnvVars = readEnvFile();
    let changed = false;
    for (const profile of profiles) {
      if (profile?.type !== "api_key") continue;
      const envKey = authProfiles.getEnvVarForApiKeyProvider?.(profile.provider);
      const envValue = String(profile?.key || "").trim();
      if (!envKey) continue;
      const prevValue = String(
        nextEnvVars.find((entry) => entry.key === envKey)?.value || "",
      );
      if (!envValue) {
        if (!prevValue) continue;
        nextEnvVars = removeEnvVar(nextEnvVars, envKey);
        changed = true;
        continue;
      }
      if (prevValue === envValue) continue;
      nextEnvVars = upsertEnvVar(nextEnvVars, envKey, envValue);
      changed = true;
    }
    if (!changed) return;
    writeEnvFile(nextEnvVars);
    reloadEnv();
  };

  const syncProfilesFromEnvVars = (agentId) => {
    if (
      typeof readEnvFile !== "function" ||
      typeof authProfiles.upsertApiKeyProfileForEnvVar !== "function" ||
      typeof authProfiles.removeApiKeyProfileForEnvVar !== "function"
    ) {
      return;
    }
    const envMap = readEnvVarMap();
    const providers = authProfiles.listApiKeyProviders?.() || [];
    for (const provider of providers) {
      const envKey = authProfiles.getEnvVarForApiKeyProvider?.(provider);
      if (!envKey) continue;
      const envValue = String(envMap.get(envKey) || "").trim();
      if (!envValue) {
        authProfiles.removeApiKeyProfileForEnvVar(provider, agentId);
        continue;
      }
      authProfiles.upsertApiKeyProfileForEnvVar(provider, envValue, agentId);
    }
  };

  // ── Existing CLI-backed catalog/status routes ──

  app.get("/api/models", async (req, res) => {
    const response = await modelCatalogCache.getCatalogResponse();
    return res.json(response);
  });

  app.get("/api/models/status", async (req, res) => {
    try {
      const output = await shellCmd("openclaw models status --json", {
        env: gatewayEnv(),
        timeout: 20000,
      });
      const parsed = parseJsonFromNoisyOutput(output) || {};
      res.json({
        ok: true,
        modelKey: parsed.resolvedDefault || parsed.defaultModel || null,
        fallbacks: parsed.fallbacks || [],
        imageModel: parsed.imageModel || null,
      });
    } catch (err) {
      res.json({
        ok: false,
        error: err.message || "Failed to read model status",
      });
    }
  });

  app.post("/api/models/set", async (req, res) => {
    const { modelKey } = req.body || {};
    if (!modelKey || typeof modelKey !== "string" || !modelKey.includes("/")) {
      return res.status(400).json({ ok: false, error: "Missing modelKey" });
    }
    try {
      await shellCmd(`openclaw models set "${modelKey}"`, {
        env: gatewayEnv(),
        timeout: 30000,
      });
      modelCatalogCache.markStale();
      res.json({ ok: true });
    } catch (err) {
      res
        .status(400)
        .json({ ok: false, error: err.message || "Failed to set model" });
    }
  });

  // ── Model config (direct JSON) ──

  app.get("/api/models/config", (req, res) => {
    try {
      const { primary, configuredModels } = authProfiles.getModelConfig();
      const agentId = req.query.agentId || undefined;
      const profiles = mergeProfilesWithEnvFallback(
        authProfiles.listProfiles(agentId),
        agentId,
      );
      const store = authProfiles.loadAuthStore(agentId);
      res.json({
        ok: true,
        primary,
        configuredModels,
        authProfiles: profiles,
        authOrder: store.order || {},
      });
    } catch (err) {
      res
        .status(500)
        .json({ ok: false, error: err.message || "Failed to read config" });
    }
  });

  app.put("/api/models/config", async (req, res) => {
    const { primary, configuredModels, profiles, authOrder } = req.body || {};
    const agentId = req.query.agentId || undefined;
    if (primary !== undefined && (typeof primary !== "string" || !primary.includes("/"))) {
      return res
        .status(400)
        .json({ ok: false, error: "Invalid primary model key" });
    }
    if (
      configuredModels !== undefined &&
      (typeof configuredModels !== "object" || configuredModels === null)
    ) {
      return res
        .status(400)
        .json({ ok: false, error: "Invalid configuredModels" });
    }
    try {
      authProfiles.setModelConfig({ primary, configuredModels });

      if (Array.isArray(profiles)) {
        for (const { id: profileId, ...credential } of profiles) {
          if (profileId && credential.type && credential.provider) {
            authProfiles.upsertProfile(profileId, credential, agentId);
          }
        }
        syncEnvVarsForProfiles(profiles);
      }

      syncProfilesFromEnvVars(agentId);

      if (authOrder && typeof authOrder === "object") {
        for (const [provider, order] of Object.entries(authOrder)) {
          if (Array.isArray(order)) {
            authProfiles.setAuthOrder(provider, order, agentId);
          }
        }
      }

      // `auth-profiles.json` is the durable source of truth. Re-sync
      // `openclaw.json.auth.profiles` on save so model re-adds restore refs.
      authProfiles.syncConfigAuthReferencesForAgent(agentId);

      const syncWarning = await runModelsGitSync(shellCmd);
      modelCatalogCache.markStale();
      res.json({
        ok: true,
        ...(syncWarning ? { syncWarning } : {}),
      });
    } catch (err) {
      res
        .status(500)
        .json({ ok: false, error: err.message || "Failed to save config" });
    }
  });

  // ── Auth profiles (direct JSON) ──

  app.get("/api/models/auth", (req, res) => {
    try {
      const agentId = req.query.agentId || undefined;
      const profiles = authProfiles.listProfiles(agentId);
      const store = authProfiles.loadAuthStore(agentId);
      res.json({ ok: true, profiles, order: store.order || {} });
    } catch (err) {
      res
        .status(500)
        .json({
          ok: false,
          error: err.message || "Failed to read auth profiles",
        });
    }
  });

  app.put("/api/models/auth/:profileId", (req, res) => {
    const { profileId } = req.params;
    const credential = req.body;
    if (
      !profileId ||
      !credential?.type ||
      !credential?.provider
    ) {
      return res
        .status(400)
        .json({ ok: false, error: "Missing profileId, type, or provider" });
    }
    const validTypes = new Set(["api_key", "token", "oauth"]);
    if (!validTypes.has(credential.type)) {
      return res.status(400).json({
        ok: false,
        error: `Invalid credential type: ${credential.type}`,
      });
    }
    try {
      const agentId = req.query.agentId || undefined;
      authProfiles.upsertProfile(profileId, credential, agentId);
      syncEnvVarsForProfiles([{ id: profileId, ...credential }]);
      modelCatalogCache.markStale();
      res.json({ ok: true });
    } catch (err) {
      res
        .status(500)
        .json({
          ok: false,
          error: err.message || "Failed to save auth profile",
        });
    }
  });

  app.delete("/api/models/auth/:profileId", (req, res) => {
    const { profileId } = req.params;
    if (!profileId) {
      return res
        .status(400)
        .json({ ok: false, error: "Missing profileId" });
    }
    try {
      const agentId = req.query.agentId || undefined;
      const removed = authProfiles.removeProfile(profileId, agentId);
      modelCatalogCache.markStale();
      res.json({ ok: true, removed });
    } catch (err) {
      res
        .status(500)
        .json({
          ok: false,
          error: err.message || "Failed to remove auth profile",
        });
    }
  });
};

module.exports = { registerModelRoutes };
