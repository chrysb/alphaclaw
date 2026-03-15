import { useCallback, useEffect, useMemo, useState } from "https://esm.sh/preact/hooks";
import {
  fetchGmailConfig,
  renewGmailWatch,
  saveGmailConfig,
  startGmailWatch,
  stopGmailWatch,
} from "../../lib/api.js";
import { useCachedFetch } from "../../hooks/use-cached-fetch.js";

export const useGmailWatch = ({ gatewayStatus, accounts = [] }) => {
  const [busyByAccountId, setBusyByAccountId] = useState({});
  const [savingClient, setSavingClient] = useState(false);
  const accountSignature = useMemo(
    () =>
      accounts
        .map((entry) => String(entry?.id || "").trim())
        .filter(Boolean)
        .sort()
        .join("|"),
    [accounts],
  );
  const {
    data: config,
    loading,
    refresh: refreshCachedConfig,
  } = useCachedFetch("/api/gmail/config", fetchGmailConfig, {
    enabled: gatewayStatus === "running",
    maxAgeMs: 30000,
  });

  const refresh = useCallback(async () => {
    return refreshCachedConfig({ force: true });
  }, [refreshCachedConfig]);

  useEffect(() => {
    if (gatewayStatus !== "running") return;
    if (!accounts.length) return;
    refresh().catch(() => {});
  }, [accountSignature, accounts.length, gatewayStatus, refresh]);

  const watchByAccountId = useMemo(() => {
    const map = new Map();
    for (const entry of config?.accounts || []) {
      map.set(String(entry.accountId || ""), entry);
    }
    return map;
  }, [config]);

  const clientConfigByClient = useMemo(() => {
    const map = new Map();
    for (const clientConfig of config?.clients || []) {
      map.set(String(clientConfig.client || "default"), clientConfig);
    }
    return map;
  }, [config]);

  const setBusy = (accountId, busy) => {
    setBusyByAccountId((prev) => {
      const key = String(accountId || "");
      if (!key) return prev;
      if (busy) return { ...prev, [key]: true };
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const startWatchForAccount = useCallback(async (accountId, { destination = null } = {}) => {
    const key = String(accountId || "");
    setBusy(key, true);
    try {
      const data = await startGmailWatch(key, { destination });
      await refresh();
      return data;
    } finally {
      setBusy(key, false);
    }
  }, [refresh]);

  const stopWatchForAccount = useCallback(async (accountId) => {
    const key = String(accountId || "");
    setBusy(key, true);
    try {
      await stopGmailWatch(key);
      await refresh();
    } finally {
      setBusy(key, false);
    }
  }, [refresh]);

  const renewForAccount = useCallback(async (accountId = "") => {
    const key = String(accountId || "");
    if (key) setBusy(key, true);
    try {
      await renewGmailWatch({ accountId: key, force: true });
      await refresh();
    } finally {
      if (key) setBusy(key, false);
    }
  }, [refresh]);

  const saveClientSetup = useCallback(async ({
    client = "default",
    projectId = "",
    regeneratePushToken = false,
  } = {}) => {
    setSavingClient(true);
    try {
      const data = await saveGmailConfig({
        client,
        projectId,
        regeneratePushToken,
      });
      await refresh();
      return data;
    } catch (err) {
      const message = String(err?.message || "");
      if (message.toLowerCase().includes("not found")) {
        throw new Error(
          "Gmail watch API route not found. Restart AlphaClaw so /api/gmail routes are loaded.",
        );
      }
      throw err;
    } finally {
      setSavingClient(false);
    }
  }, [refresh]);

  return {
    loading,
    config,
    watchByAccountId,
    clientConfigByClient,
    busyByAccountId,
    savingClient,
    refresh,
    saveClientSetup,
    startWatchForAccount,
    stopWatchForAccount,
    renewForAccount,
  };
};
