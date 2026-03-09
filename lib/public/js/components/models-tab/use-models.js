import { useState, useEffect, useRef, useCallback } from "https://esm.sh/preact/hooks";
import {
  fetchModels,
  fetchModelsConfig,
  saveModelsConfig,
  fetchCodexStatus,
  disconnectCodex,
} from "../../lib/api.js";
import { showToast } from "../toast.js";

let kModelsTabCache = null;

export const useModels = (agentId) => {
  const isScoped = !!agentId;
  const useCache = !isScoped;
  const [catalog, setCatalog] = useState(() => (useCache && kModelsTabCache?.catalog) || []);
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

  const refresh = useCallback(async () => {
    if (!ready) setLoading(true);
    setError("");
    try {
      const [catalogResult, configResult, codex] = await Promise.all([
        fetchModels(),
        fetchModelsConfig(isScoped ? { agentId } : undefined),
        fetchCodexStatus(),
      ]);
      const catalogModels = Array.isArray(catalogResult.models)
        ? catalogResult.models
        : [];
      setCatalog(catalogModels);
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
      if (!catalogModels.length) setError("No models found");
    } catch (err) {
      setError("Failed to load model settings");
      showToast(`Failed to load model settings: ${err.message}`, "error");
    } finally {
      setReady(true);
      setLoading(false);
    }
  }, [ready, updateCache, agentId, isScoped]);

  useEffect(() => {
    refresh();
  }, [agentId]);

  const modelConfigDirty =
    primary !== savedPrimaryRef.current ||
    JSON.stringify(configuredModels) !==
      JSON.stringify(savedConfiguredRef.current);

  const authDirty = (() => {
    const hasProfileChanges = Object.entries(profileEdits).some(
      ([id, cred]) => {
        const existing = authProfiles.find((p) => p.id === id);
        const newVal = cred?.key || cred?.token || cred?.access || "";
        const oldVal =
          existing?.key || existing?.token || existing?.access || "";
        return newVal !== oldVal && newVal !== "";
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

  const editProfile = useCallback((profileId, credential) => {
    setProfileEdits((prev) => ({ ...prev, [profileId]: credential }));
  }, []);

  const editAuthOrder = useCallback((provider, orderedIds) => {
    setOrderEdits((prev) => ({ ...prev, [provider]: orderedIds }));
  }, []);

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
        .filter(([, cred]) => {
          const val = cred?.key || cred?.token || cred?.access || "";
          return val !== "";
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
      await refresh();
    } catch (err) {
      showToast(err.message || "Failed to save changes", "error");
    } finally {
      setSaving(false);
    }
  }, [saving, primary, configuredModels, profileEdits, orderEdits, refresh]);

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
