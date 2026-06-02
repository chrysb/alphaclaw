import { useEffect, useRef, useState } from "preact/hooks";
import {
  approveDevice,
  approvePairing,
  fetchDashboardUrl,
  fetchDevicePairings,
  fetchPairings,
  rejectDevice,
  rejectPairing,
  triggerWatchdogRepair,
  updateOpenAiCompatApiFeature,
  updateSyncCron,
} from "../../lib/api.js";
import { usePolling } from "../../hooks/usePolling.js";
import {
  kOpenAiCompatApiFeatureCacheKey,
} from "../../lib/storage-keys.js";
import { showToast } from "../toast.js";
import { ALL_CHANNELS } from "../channels.js";

const kDefaultSyncCronSchedule = "0 * * * *";

const readCachedOpenAiCompatApi = () => {
  try {
    const rawValue = window.localStorage.getItem(kOpenAiCompatApiFeatureCacheKey);
    if (rawValue === "true") return { enabled: true, hydrated: true };
    if (rawValue === "false") return { enabled: false, hydrated: true };
  } catch {}
  return { enabled: false, hydrated: false };
};

const writeCachedOpenAiCompatApi = (enabled) => {
  try {
    window.localStorage.setItem(
      kOpenAiCompatApiFeatureCacheKey,
      enabled ? "true" : "false",
    );
  } catch {}
};

export const useGeneralTab = ({
  statusData = null,
  watchdogData = null,
  doctorStatusData = null,
  onRefreshStatuses = () => {},
  isActive = false,
  restartSignal = 0,
} = {}) => {
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [repairingWatchdog, setRepairingWatchdog] = useState(false);
  const [syncCronEnabled, setSyncCronEnabled] = useState(true);
  const [syncCronSchedule, setSyncCronSchedule] = useState(kDefaultSyncCronSchedule);
  const [savingSyncCron, setSavingSyncCron] = useState(false);
  const [syncCronChoice, setSyncCronChoice] = useState(kDefaultSyncCronSchedule);
  const [cachedOpenAiCompatApi] = useState(readCachedOpenAiCompatApi);
  const [openAiCompatApiEnabled, setOpenAiCompatApiEnabled] = useState(
    cachedOpenAiCompatApi.enabled,
  );
  const [openAiCompatApiHydrated, setOpenAiCompatApiHydrated] = useState(
    cachedOpenAiCompatApi.hydrated,
  );
  const [savingOpenAiCompatApi, setSavingOpenAiCompatApi] = useState(false);
  const [pairingStatusRefreshing, setPairingStatusRefreshing] = useState(false);
  const [devicePollingEnabled, setDevicePollingEnabled] = useState(false);
  const [cliAutoApproveComplete, setCliAutoApproveComplete] = useState(false);
  const pairingRefreshTimerRef = useRef(null);

  const status = statusData;
  const watchdogStatus = watchdogData;
  const doctorStatus = doctorStatusData;
  const gatewayStatus = status?.gateway ?? null;
  const channels = status?.channels ?? null;
  const repo = status?.repo || null;
  const syncCron = status?.syncCron || null;
  const openAiCompatApi = status?.alphaclaw?.features?.openaiCompatApi || null;
  const hasOpenAiCompatApiStatus = typeof openAiCompatApi?.enabled === "boolean";
  const openclawVersion = status?.openclawVersion || null;

  const hasUnpaired = ALL_CHANNELS.some((channel) => {
    const info = channels?.[channel];
    if (!info) return false;
    const accounts =
      info.accounts && typeof info.accounts === "object" ? info.accounts : {};
    if (Object.keys(accounts).length > 0) {
      return Object.values(accounts).some(
        (acc) => acc && acc.status !== "paired",
      );
    }
    return info.status !== "paired";
  });
  const hasConfiguredPairingChannel = ALL_CHANNELS.some((channel) =>
    Boolean(channels?.[channel]),
  );

  const pairingsPoll = usePolling(
    async () => {
      const data = await fetchPairings();
      return data.pending || [];
    },
    3000,
    {
      enabled: hasConfiguredPairingChannel && gatewayStatus === "running",
      cacheKey: "/api/pairings",
      dedupeInFlight: true,
    },
  );
  const pending = pairingsPoll.data || [];
  const shouldPollDevices =
    gatewayStatus === "running" && (devicePollingEnabled || !cliAutoApproveComplete);

  const devicePoll = usePolling(
    async () => {
      const data = await fetchDevicePairings();
      setCliAutoApproveComplete(data?.cliAutoApproveComplete === true);
      return data.pending || [];
    },
    5000,
    {
      enabled: shouldPollDevices,
      cacheKey: "/api/devices",
    },
  );
  const devicePending = devicePoll.data || [];

  useEffect(() => {
    if (!restartSignal || !isActive) return;
    onRefreshStatuses();
    pairingsPoll.refresh({ force: true });
    if (shouldPollDevices) {
      devicePoll.refresh();
    }
    const t1 = setTimeout(() => {
      onRefreshStatuses();
      pairingsPoll.refresh();
      if (shouldPollDevices) {
        devicePoll.refresh();
      }
    }, 1200);
    const t2 = setTimeout(() => {
      onRefreshStatuses();
      pairingsPoll.refresh();
      if (shouldPollDevices) {
        devicePoll.refresh();
      }
    }, 3500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [
    devicePoll.refresh,
    isActive,
    onRefreshStatuses,
    pairingsPoll.refresh,
    restartSignal,
    devicePollingEnabled,
    shouldPollDevices,
  ]);

  useEffect(() => {
    if (!syncCron) return;
    setSyncCronEnabled(syncCron.enabled !== false);
    setSyncCronSchedule(syncCron.schedule || kDefaultSyncCronSchedule);
    setSyncCronChoice(
      syncCron.enabled === false ? "disabled" : syncCron.schedule || kDefaultSyncCronSchedule,
    );
  }, [syncCron?.enabled, syncCron?.schedule]);

  useEffect(() => {
    if (!hasOpenAiCompatApiStatus) return;
    const nextEnabled = openAiCompatApi.enabled === true;
    setOpenAiCompatApiEnabled(nextEnabled);
    setOpenAiCompatApiHydrated(true);
    writeCachedOpenAiCompatApi(nextEnabled);
  }, [hasOpenAiCompatApiStatus, openAiCompatApi?.enabled]);

  useEffect(
    () => () => {
      if (pairingRefreshTimerRef.current) {
        clearTimeout(pairingRefreshTimerRef.current);
      }
    },
    [],
  );

  const refreshAfterPairingAction = () => {
    setPairingStatusRefreshing(true);
    if (pairingRefreshTimerRef.current) {
      clearTimeout(pairingRefreshTimerRef.current);
    }
    pairingRefreshTimerRef.current = setTimeout(() => {
      setPairingStatusRefreshing(false);
      pairingRefreshTimerRef.current = null;
    }, 2800);
    onRefreshStatuses();
    pairingsPoll.refresh({ force: true });
    setTimeout(() => {
      onRefreshStatuses();
      pairingsPoll.refresh();
    }, 700);
    setTimeout(() => {
      onRefreshStatuses();
      pairingsPoll.refresh();
    }, 1800);
  };

  const saveSyncCronSettings = async ({
    enabled = syncCronEnabled,
    schedule = syncCronSchedule,
  } = {}) => {
    if (savingSyncCron) return;
    setSavingSyncCron(true);
    try {
      const data = await updateSyncCron({ enabled, schedule });
      if (!data.ok) {
        throw new Error(data.error || "Could not save sync settings");
      }
      showToast("Sync schedule updated", "success");
      onRefreshStatuses();
    } catch (err) {
      showToast(err.message || "Could not save sync settings", "error");
    } finally {
      setSavingSyncCron(false);
    }
  };

  const handleSyncCronChoiceChange = async (nextChoice) => {
    setSyncCronChoice(nextChoice);
    const nextEnabled = nextChoice !== "disabled";
    const nextSchedule = nextEnabled ? nextChoice : syncCronSchedule;
    setSyncCronEnabled(nextEnabled);
    setSyncCronSchedule(nextSchedule);
    await saveSyncCronSettings({
      enabled: nextEnabled,
      schedule: nextSchedule,
    });
  };

  const handleOpenAiCompatApiToggle = async (enabled) => {
    if (savingOpenAiCompatApi) return;
    const previousEnabled = openAiCompatApiEnabled;
    setOpenAiCompatApiEnabled(enabled);
    setSavingOpenAiCompatApi(true);
    try {
      const data = await updateOpenAiCompatApiFeature(enabled);
      if (!data.ok) {
        throw new Error(data.error || "Could not save API setting");
      }
      writeCachedOpenAiCompatApi(enabled);
      setOpenAiCompatApiHydrated(true);
      showToast(`API ${enabled ? "enabled" : "disabled"}`, "success");
      onRefreshStatuses();
    } catch (err) {
      setOpenAiCompatApiEnabled(previousEnabled);
      showToast(err.message || "Could not save API setting", "error");
    } finally {
      setSavingOpenAiCompatApi(false);
    }
  };

  const handleApprove = async (id, channel, accountId = "") => {
    try {
      const result = await approvePairing(id, channel, accountId);
      if (!result.ok) throw new Error(result.error || "Could not approve pairing");
      refreshAfterPairingAction();
    } catch (err) {
      showToast(err.message || "Could not approve pairing", "error");
      throw err;
    }
  };

  const handleReject = async (id, channel, accountId = "") => {
    try {
      await rejectPairing(id, channel, accountId);
      refreshAfterPairingAction();
    } catch (err) {
      showToast(err.message || "Could not reject pairing", "error");
      throw err;
    }
  };

  const handleDeviceApprove = async (id) => {
    try {
      await approveDevice(id);
      showToast("Device pairing approved", "success");
      setTimeout(devicePoll.refresh, 500);
      setTimeout(devicePoll.refresh, 2000);
    } catch (err) {
      showToast(err.message || "Could not approve device pairing", "error");
      throw err;
    }
  };

  const handleDeviceReject = async (id) => {
    try {
      await rejectDevice(id);
      showToast("Device pairing rejected", "info");
      setTimeout(devicePoll.refresh, 500);
      setTimeout(devicePoll.refresh, 2000);
    } catch (err) {
      showToast(err.message || "Could not reject device pairing", "error");
      throw err;
    }
  };

  const handleWatchdogRepair = async () => {
    if (repairingWatchdog) return;
    setRepairingWatchdog(true);
    try {
      const data = await triggerWatchdogRepair();
      if (!data.ok) throw new Error(data.error || "Repair failed");
      showToast("Repair triggered", "success");
      setTimeout(() => {
        onRefreshStatuses();
      }, 800);
    } catch (err) {
      showToast(err.message || "Could not run repair", "error");
    } finally {
      setRepairingWatchdog(false);
    }
  };

  const handleOpenDashboard = async () => {
    if (dashboardLoading) return;
    setDevicePollingEnabled(true);
    setDashboardLoading(true);
    try {
      const data = await fetchDashboardUrl();
      if (data.needsAuth) {
        showToast(
          "OpenClaw dashboard token is missing from the AlphaClaw server environment",
          "warning",
        );
      }
      window.open(data.url || "/openclaw", "_blank");
    } catch (err) {
      showToast(err.message || "Could not open OpenClaw dashboard", "error");
      window.open("/openclaw", "_blank");
    } finally {
      setDashboardLoading(false);
    }
  };

  return {
    state: {
      channels,
      dashboardLoading,
      devicePending,
      doctorStatus,
      gatewayStatus,
      hasUnpaired,
      openclawVersion,
      openAiCompatApi: {
        ...(openAiCompatApi || {}),
        enabled: openAiCompatApiEnabled,
        hydrated: openAiCompatApiHydrated,
      },
      pending,
      pairingsPolling: pairingsPoll.isPolling,
      pairingStatusRefreshing,
      repairingWatchdog,
      repo,
      savingSyncCron,
      savingOpenAiCompatApi,
      syncCron,
      syncCronChoice,
      syncCronEnabled,
      syncCronSchedule,
      syncCronStatusText: syncCronEnabled ? "Enabled" : "Disabled",
      watchdogStatus,
    },
    actions: {
      handleApprove,
      handleDeviceApprove,
      handleDeviceReject,
      handleOpenDashboard,
      handleOpenAiCompatApiToggle,
      handleReject,
      handleSyncCronChoiceChange,
      handleWatchdogRepair,
    },
  };
};
