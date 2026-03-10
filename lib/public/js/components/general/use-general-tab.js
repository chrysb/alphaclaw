import { useEffect, useRef, useState } from "https://esm.sh/preact/hooks";
import {
  approveDevice,
  approvePairing,
  fetchDashboardUrl,
  fetchDevicePairings,
  fetchPairings,
  rejectDevice,
  rejectPairing,
  triggerWatchdogRepair,
  updateSyncCron,
} from "../../lib/api.js";
import { usePolling } from "../../hooks/usePolling.js";
import { showToast } from "../toast.js";
import { ALL_CHANNELS } from "../channels.js";

const kDefaultSyncCronSchedule = "0 * * * *";

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

  const pairingsPoll = usePolling(
    async () => {
      const data = await fetchPairings();
      return data.pending || [];
    },
    1000,
    { enabled: hasUnpaired && gatewayStatus === "running" },
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
    2000,
    { enabled: shouldPollDevices },
  );
  const devicePending = devicePoll.data || [];

  useEffect(() => {
    if (!isActive) return;
    onRefreshStatuses();
    pairingsPoll.refresh();
    if (shouldPollDevices) {
      devicePoll.refresh();
    }
  }, [
    devicePoll.refresh,
    isActive,
    onRefreshStatuses,
    pairingsPoll.refresh,
    devicePollingEnabled,
    shouldPollDevices,
  ]);

  useEffect(() => {
    if (!restartSignal || !isActive) return;
    onRefreshStatuses();
    pairingsPoll.refresh();
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
    pairingsPoll.refresh();
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

  const handleApprove = async (id, channel, accountId = "") => {
    await approvePairing(id, channel, accountId);
    refreshAfterPairingAction();
  };

  const handleReject = async (id, channel, accountId = "") => {
    try {
      await rejectPairing(id, channel, accountId);
      refreshAfterPairingAction();
    } catch (err) {
      showToast(err.message || "Could not reject pairing", "error");
    }
  };

  const handleDeviceApprove = async (id) => {
    await approveDevice(id);
    setTimeout(devicePoll.refresh, 500);
    setTimeout(devicePoll.refresh, 2000);
  };

  const handleDeviceReject = async (id) => {
    await rejectDevice(id);
    setTimeout(devicePoll.refresh, 500);
    setTimeout(devicePoll.refresh, 2000);
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
      console.log("[dashboard] response:", JSON.stringify(data));
      window.open(data.url || "/openclaw", "_blank");
    } catch (err) {
      console.error("[dashboard] error:", err);
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
      pending,
      pairingStatusRefreshing,
      repairingWatchdog,
      repo,
      savingSyncCron,
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
      handleReject,
      handleSyncCronChoiceChange,
      handleWatchdogRepair,
    },
  };
};
