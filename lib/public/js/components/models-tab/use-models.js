import { useState, useEffect, useRef, useCallback } from "preact/hooks";
import {
  fetchModels,
  fetchModelsConfig,
  saveModelsConfig,
  fetchCodexStatus,
  disconnectCodex,
} from "../../lib/api.js";
import { showToast } from "../toast.js";
import { useCachedFetch } from "../../hooks/use-cached-fetch.js";
import { usePolling } from "../../hooks/usePolling.js";
import { invalidateCache } from "../../lib/api-cache.js";
import {
  getModelCatalogModels,
  isModelCatalogRefreshing,
  kModelCatalogCacheKey,
  kModelCatalogPollIntervalMs,
} from "../../lib/model-catalog.js";

let kModelsTabCache = null;
const getCredentialValue = (value) =>
  String(value?.key || value?.token || value?.access || "").trim();
const kNoModelsFoundError = "No models found";
const kModelSettingsLoadError = "Failed to load model settings";

export const useModels = (agentId) => {
  const isScoped = !!agentId;
  const normalizedAgentId = String(agentId || "").trim();
  const useCache = !isScoped;
  const [catalog, setCatalog] = useState(() => (useCache && kModelsTabCache?.catalog) || []);
  const [catalogStatus, setCatalogStatus] = useState(
    () =>
      (useCache && kModelsTabCache?.catalogStatus) || {
        source: "",
        fetchedAt: null,
        stale: false,
        refreshing: false,
      },
  );
  const [primary, setPrimary] = useState(() => (useCache && kModelsTabCache?.primary) || "");
  const [configuredModels, setConfiguredModels] = useState(
    () => (useCache && kModelsTabCache?.configuredModels) || {},
  );
  const [authProfiles, setAuthProfiles] = useState(
    () => (useCache && kModelsTabCache?.authProfiles) || [],
  );
  const [authOrder, setAuthOrder] = useState(
    () => (useCache && kModelsTabCache?.authOrder) || {},
  );
  const [codexStatus, setCodexStatus] = useState(
    () => (useCache && kModelsTabCache?.codexStatus) || { connected: false },
  );
  const [loading, setLoading] = useState(() => !(useCache && kModelsTabCache));
  const [saving, setSaving] = useState(false);
  const [ready, setReady] = useState(() => !!(useCache && kModelsTabCache));
  const [error, setError] = useState("");

  const [profileEdits, setProfileEdits] = useState({});
  const [orderEdits, setOrderEdits] = useState({});

  const savedPrimaryRef = useRef(kModelsTabCache?.primary || "");
  const savedConfiguredRef = useRef(kModelsTabCache?.configuredModels || {});

  const updateCache = useCallback((patch) => {
    if (!isScoped) kModelsTabCache = { ...(kModelsTabCache || {}), ...patch };
  }, [isScoped]);
  const modelsConfigCacheKey = normalizedAgentId
    ? `/api/models/config?agentId=${encodeURIComponent(normalizedAgentId)}`
    : "/api/models/config";
  const catalogFetchState = useCachedFetch(kModelCatalogCacheKey, fetchModels, {
    maxAgeMs: 30000,
  });
  const configFetchState = useCachedFetch(
    modelsConfigCacheKey,
    () => fetchModelsConfig(isScoped ? { agentId } : undefined),
    { maxAgeMs: 30000 },
  );
  const codexFetchState = useCachedFetch("/api/codex/status", fetchCodexStatus, {
    maxAgeMs: 15000,
  });
  const catalogPoll = usePolling(fetchModels, kModelCatalogPollIntervalMs, {
    enabled: ready && isModelCatalogRefreshing(catalogStatus),
    pauseWhenHidden: true,
    cacheKey: kModelCatalogCacheKey,
  });

  const syncCatalogError = useCallback((catalogModels) => {
    setError((current) => {
      if (catalogModels.length > 0) {
        return current === kNoModelsFoundError ? "" : current;
      }
      return current || kNoModelsFoundError;
    });
  }, []);

  const applyCatalogResult = useCallback(
    (catalogResult) => {
      const catalogModels = getModelCatalogModels(catalogResult);
      const nextCatalogStatus = {
        source: String(catalogResult?.source || ""),
        fetchedAt: Number(catalogResult?.fetchedAt || 0) || null,
        stale: Boolean(catalogResult?.stale),
        refreshing: Boolean(catalogResult?.refreshing),
      };
      setCatalog(catalogModels);
      setCatalogStatus(nextCatalogStatus);
      updateCache({
        catalog: catalogModels,
        catalogStatus: nextCatalogStatus,
      });
      syncCatalogError(catalogModels);
      return catalogModels;
    },
    [syncCatalogError, updateCache],
  );

  const refresh = useCallback(async () => {
    if (!ready) setLoading(true);
    setError("");
    try {
      const [catalogResult, configResult, codex] = await Promise.all([
        catalogFetchState.refresh({ force: true }),
        configFetchState.refresh({ force: true }),
        codexFetchState.refresh({ force: true }),
      ]);
      const catalogModels = applyCatalogResult(catalogResult);
      const p = configResult.primary || "";
      const cm = configResult.configuredModels || {};
      const ap = configResult.authProfiles || [];
      const ao = configResult.authOrder || {};
      setPrimary(p);
      setConfiguredModels(cm);
      setAuthProfiles(ap);
      setAuthOrder(ao);
      setCodexStatus(codex || { connected: false });
      setProfileEdits({});
      setOrderEdits({});
      savedPrimaryRef.current = p;
      savedConfiguredRef.current = cm;
      updateCache({
        catalog: catalogModels,
        primary: p,
        configuredModels: cm,
        authProfiles: ap,
        authOrder: ao,
        codexStatus: codex || { connected: false },
      });
    } catch (err) {
      setError(kModelSettingsLoadError);
      showToast(`${kModelSettingsLoadError}: ${err.message}`, "error");
    } finally {
      setReady(true);
      setLoading(false);
    }
  }, [
    applyCatalogResult,
    catalogFetchState,
    codexFetchState,
    configFetchState,
    ready,
    updateCache,
  ]);

  useEffect(() => {
    refresh();
  }, [agentId]);

  useEffect(() => {
    if (!catalogPoll.data) return;
    applyCatalogResult(catalogPoll.data);
  }, [applyCatalogResult, catalogPoll.data]);

  const stableStringify = (obj) =>
    JSON.stringify(Object.keys(obj).sort().reduce((acc, k) => { acc[k] = obj[k]; return acc; }, {}));

  const modelConfigDirty =
    primary !== savedPrimaryRef.current ||
    stableStringify(configuredModels) !==
      stableStringify(savedConfiguredRef.current);

  const authDirty = (() => {
    const hasProfileChanges = Object.entries(profileEdits).some(
      ([id, cred]) => {
        const existing = authProfiles.find((p) => p.id === id);
        return getCredentialValue(cred) !== getCredentialValue(existing);
      },
    );
    const hasOrderChanges = Object.entries(orderEdits).some(
      ([provider, order]) => {
        const existing = authOrder[provider];
        return JSON.stringify(order) !== JSON.stringify(existing);
      },
    );
    return hasProfileChanges || hasOrderChanges;
  })();

  const isDirty = modelConfigDirty || authDirty;

  const addModel = useCallback(
    (modelKey) => {
      if (!modelKey) return;
      setConfiguredModels((prev) => {
        const next = { ...prev, [modelKey]: {} };
        updateCache({ configuredModels: next });
        return next;
      });
    },
    [updateCache],
  );

  const removeModel = useCallback(
    (modelKey) => {
      setConfiguredModels((prev) => {
        const next = { ...prev };
        delete next[modelKey];
        updateCache({ configuredModels: next });
        return next;
      });
      if (primary === modelKey) {
        const remaining = Object.keys(configuredModels).filter(
          (k) => k !== modelKey,
        );
        const newPrimary = remaining[0] || "";
        setPrimary(newPrimary);
        updateCache({ primary: newPrimary });
      }
    },
    [primary, configuredModels, updateCache],
  );

  const setPrimaryModel = useCallback(
    (modelKey) => {
      setPrimary(modelKey);
      updateCache({ primary: modelKey });
    },
    [updateCache],
  );

  const editProfile = useCallback(
    (profileId, credential) => {
      const existing = authProfiles.find((p) => p.id === profileId);
      if (getCredentialValue(credential) === getCredentialValue(existing)) {
        setProfileEdits((prev) => {
          const next = { ...prev };
          delete next[profileId];
          return next;
        });
        return;
      }
      setProfileEdits((prev) => ({ ...prev, [profileId]: credential }));
    },
    [authProfiles],
  );

  const editAuthOrder = useCallback(
    (provider, orderedIds) => {
      const existing = authOrder[provider] || null;
      if (JSON.stringify(orderedIds) === JSON.stringify(existing)) {
        setOrderEdits((prev) => {
          const next = { ...prev };
          delete next[provider];
          return next;
        });
        return;
      }
      setOrderEdits((prev) => ({ ...prev, [provider]: orderedIds }));
    },
    [authOrder],
  );

  const getProfileValue = useCallback(
    (profileId) => {
      if (profileEdits[profileId] !== undefined) return profileEdits[profileId];
      const existing = authProfiles.find((p) => p.id === profileId);
      return existing || null;
    },
    [profileEdits, authProfiles],
  );

  const getEffectiveOrder = useCallback(
    (provider) => {
      if (orderEdits[provider] !== undefined) return orderEdits[provider];
      return authOrder[provider] || null;
    },
    [orderEdits, authOrder],
  );

  const cancelChanges = useCallback(() => {
    const savedPrimary = savedPrimaryRef.current || "";
    const savedConfigured = savedConfiguredRef.current || {};
    setPrimary(savedPrimary);
    setConfiguredModels(savedConfigured);
    setProfileEdits({});
    setOrderEdits({});
    updateCache({
      primary: savedPrimary,
      configuredModels: savedConfigured,
    });
  }, [updateCache]);

  const saveAll = useCallback(async () => {
    if (saving) return;
    setSaving(true);
    try {
      const changedProfiles = Object.entries(profileEdits)
        .filter(([id, cred]) => {
          const existing = authProfiles.find((p) => p.id === id);
          return getCredentialValue(cred) !== getCredentialValue(existing);
        })
        .map(([id, cred]) => ({ id, ...cred }));

      const result = await saveModelsConfig({
        primary,
        configuredModels,
        profiles: changedProfiles.length > 0 ? changedProfiles : undefined,
        authOrder:
          Object.keys(orderEdits).length > 0 ? orderEdits : undefined,
        ...(isScoped ? { agentId } : {}),
      });
      if (!result.ok)
        throw new Error(result.error || "Failed to save config");
      showToast("Changes saved", "success");
      if (result.syncWarning) {
        showToast(`Saved, but git-sync failed: ${result.syncWarning}`, "warning");
      }
      invalidateCache(kModelCatalogCacheKey);
      await refresh();
    } catch (err) {
      showToast(err.message || "Failed to save changes", "error");
    } finally {
      setSaving(false);
    }
  }, [
    saving,
    primary,
    configuredModels,
    profileEdits,
    orderEdits,
    authProfiles,
    isScoped,
    agentId,
    refresh,
  ]);

  const refreshCodexStatus = useCallback(async () => {
    try {
      const codex = await fetchCodexStatus();
      setCodexStatus(codex || { connected: false });
      updateCache({ codexStatus: codex || { connected: false } });
    } catch {
      setCodexStatus({ connected: false });
      updateCache({ codexStatus: { connected: false } });
    }
  }, [updateCache]);

  return {
    catalog,
    primary,
    configuredModels,
    authProfiles,
    authOrder,
    codexStatus,
    loading,
    saving,
    ready,
    error,
    isDirty,
    refresh,
    addModel,
    removeModel,
    setPrimaryModel,
    editProfile,
    editAuthOrder,
    getProfileValue,
    getEffectiveOrder,
    cancelChanges,
    saveAll,
    refreshCodexStatus,
  };
};
