import { useState, useEffect, useCallback } from "https://esm.sh/preact/hooks";
import {
  fetchStatus,
  fetchOnboardStatus,
  fetchAuthStatus,
  fetchAlphaclawVersion,
  updateAlphaclaw,
  fetchRestartStatus,
  restartGateway,
  fetchWatchdogStatus,
  fetchDoctorStatus,
  updateOpenclaw,
} from "../lib/api.js";
import { shouldRequireRestartForBrowsePath } from "../lib/browse-restart-policy.js";
import { usePolling } from "./usePolling.js";
import { showToast } from "../components/toast.js";

export const useAppShellController = ({ location = "" } = {}) => {
  const [onboarded, setOnboarded] = useState(null);
  const [authEnabled, setAuthEnabled] = useState(false);
  const [acVersion, setAcVersion] = useState(null);
  const [acLatest, setAcLatest] = useState(null);
  const [acHasUpdate, setAcHasUpdate] = useState(false);
  const [acUpdating, setAcUpdating] = useState(false);
  const [restartRequired, setRestartRequired] = useState(false);
  const [browseRestartRequired, setBrowseRestartRequired] = useState(false);
  const [restartingGateway, setRestartingGateway] = useState(false);
  const [gatewayRestartSignal, setGatewayRestartSignal] = useState(0);
  const [statusPollCadenceMs, setStatusPollCadenceMs] = useState(15000);
  const [openclawUpdateInProgress, setOpenclawUpdateInProgress] = useState(false);

  const sharedStatusPoll = usePolling(fetchStatus, statusPollCadenceMs, {
    enabled: onboarded === true,
  });
  const sharedWatchdogPoll = usePolling(fetchWatchdogStatus, statusPollCadenceMs, {
    enabled: onboarded === true,
  });
  const sharedDoctorPoll = usePolling(fetchDoctorStatus, statusPollCadenceMs, {
    enabled: onboarded === true,
  });
  const sharedStatus = sharedStatusPoll.data || null;
  const sharedWatchdogStatus = sharedWatchdogPoll.data?.status || null;
  const sharedDoctorStatus = sharedDoctorPoll.data?.status || null;
  const isAnyRestartRequired = restartRequired || browseRestartRequired;

  const refreshSharedStatuses = useCallback(() => {
    sharedStatusPoll.refresh();
    sharedWatchdogPoll.refresh();
    sharedDoctorPoll.refresh();
  }, [sharedDoctorPoll.refresh, sharedStatusPoll.refresh, sharedWatchdogPoll.refresh]);

  useEffect(() => {
    fetchOnboardStatus()
      .then((data) => setOnboarded(data.onboarded))
      .catch(() => setOnboarded(false));
    fetchAuthStatus()
      .then((data) => setAuthEnabled(!!data.authEnabled))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!onboarded) return;
    let active = true;
    const check = async (refresh = false) => {
      try {
        const data = await fetchAlphaclawVersion(refresh);
        if (!active) return;
        setAcVersion(data.currentVersion || null);
        setAcLatest(data.latestVersion || null);
        setAcHasUpdate(!!data.hasUpdate);
      } catch {}
    };
    check(true);
    const id = setInterval(() => check(false), 5 * 60 * 1000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [onboarded]);

  const refreshRestartStatus = useCallback(async () => {
    if (!onboarded) return;
    try {
      const data = await fetchRestartStatus();
      setRestartRequired(!!data.restartRequired);
      setRestartingGateway(!!data.restartInProgress);
    } catch {}
  }, [onboarded]);

  useEffect(() => {
    if (!onboarded) return;
    refreshRestartStatus();
  }, [onboarded, refreshRestartStatus]);

  useEffect(() => {
    if (onboarded !== true) return;
    const inStatusView =
      location.startsWith("/general") || location.startsWith("/watchdog");
    const gatewayStatus = sharedStatus?.gateway ?? null;
    const watchdogHealth = String(sharedWatchdogStatus?.health || "").toLowerCase();
    const watchdogLifecycle = String(sharedWatchdogStatus?.lifecycle || "").toLowerCase();
    const shouldFastPollWatchdog =
      watchdogHealth === "unknown" ||
      watchdogLifecycle === "restarting" ||
      watchdogLifecycle === "stopped" ||
      !!sharedWatchdogStatus?.operationInProgress;
    const shouldFastPollGateway = !gatewayStatus || gatewayStatus !== "running";
    const nextCadenceMs =
      inStatusView && (shouldFastPollWatchdog || shouldFastPollGateway) ? 2000 : 15000;
    setStatusPollCadenceMs((currentCadenceMs) =>
      currentCadenceMs === nextCadenceMs ? currentCadenceMs : nextCadenceMs,
    );
  }, [
    location,
    onboarded,
    sharedStatus?.gateway,
    sharedWatchdogStatus?.health,
    sharedWatchdogStatus?.lifecycle,
    sharedWatchdogStatus?.operationInProgress,
  ]);

  useEffect(() => {
    if (!onboarded || (!restartRequired && !restartingGateway)) return;
    const id = setInterval(refreshRestartStatus, 2000);
    return () => clearInterval(id);
  }, [onboarded, restartRequired, restartingGateway, refreshRestartStatus]);

  useEffect(() => {
    const handleBrowseFileSaved = (event) => {
      const savedPath = String(event?.detail?.path || "");
      if (!shouldRequireRestartForBrowsePath(savedPath)) return;
      setBrowseRestartRequired(true);
    };
    window.addEventListener("alphaclaw:browse-file-saved", handleBrowseFileSaved);
    return () => {
      window.removeEventListener("alphaclaw:browse-file-saved", handleBrowseFileSaved);
    };
  }, []);
  useEffect(() => {
    const handleRestartRequired = () => setRestartRequired(true);
    window.addEventListener("alphaclaw:restart-required", handleRestartRequired);
    return () => {
      window.removeEventListener("alphaclaw:restart-required", handleRestartRequired);
    };
  }, []);

  const handleGatewayRestart = useCallback(async () => {
    if (restartingGateway) return;
    setRestartingGateway(true);
    try {
      const data = await restartGateway();
      if (!data?.ok) throw new Error(data?.error || "Gateway restart failed");
      setRestartRequired(!!data.restartRequired);
      setBrowseRestartRequired(false);
      setGatewayRestartSignal(Date.now());
      refreshSharedStatuses();
      showToast("Gateway restarted", "success");
      setTimeout(refreshRestartStatus, 800);
    } catch (err) {
      showToast(err.message || "Restart failed", "error");
      setTimeout(refreshRestartStatus, 800);
    } finally {
      setRestartingGateway(false);
    }
  }, [refreshRestartStatus, refreshSharedStatuses, restartingGateway]);

  const handleOpenclawUpdate = useCallback(async () => {
    if (openclawUpdateInProgress) {
      return { ok: false, error: "OpenClaw update already in progress" };
    }
    setOpenclawUpdateInProgress(true);
    try {
      const data = await updateOpenclaw();
      return data;
    } finally {
      setOpenclawUpdateInProgress(false);
      refreshSharedStatuses();
      setTimeout(refreshSharedStatuses, 1200);
      setTimeout(refreshSharedStatuses, 3500);
      setTimeout(refreshRestartStatus, 1200);
    }
  }, [openclawUpdateInProgress, refreshRestartStatus, refreshSharedStatuses]);

  const handleOpenclawVersionActionComplete = useCallback(
    ({ type }) => {
      if (type !== "update") return;
      refreshSharedStatuses();
      setTimeout(refreshSharedStatuses, 1200);
    },
    [refreshSharedStatuses],
  );

  const handleAcUpdate = useCallback(async () => {
    if (acUpdating) return;
    setAcUpdating(true);
    try {
      const data = await updateAlphaclaw();
      if (data.ok) {
        showToast("AlphaClaw updated — restarting...", "success");
        setTimeout(() => window.location.reload(), 5000);
      } else {
        showToast(data.error || "AlphaClaw update failed", "error");
        setAcUpdating(false);
      }
    } catch (err) {
      showToast(err.message || "Could not update AlphaClaw", "error");
      setAcUpdating(false);
    }
  }, [acUpdating]);

  return {
    state: {
      acHasUpdate,
      acLatest,
      acUpdating,
      acVersion,
      authEnabled,
      gatewayRestartSignal,
      isAnyRestartRequired,
      onboarded,
      openclawUpdateInProgress,
      restartingGateway,
      sharedDoctorStatus,
      sharedStatus,
      sharedWatchdogStatus,
    },
    actions: {
      handleAcUpdate,
      handleGatewayRestart,
      handleOnboardingComplete: () => setOnboarded(true),
      handleOpenclawUpdate,
      handleOpenclawVersionActionComplete,
      refreshSharedStatuses,
      setRestartRequired,
    },
  };
};
