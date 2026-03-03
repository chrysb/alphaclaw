import { h, render } from "https://esm.sh/preact";
import { useState, useEffect, useRef, useCallback } from "https://esm.sh/preact/hooks";
import htm from "https://esm.sh/htm";
import { Router, Route, Switch, useLocation } from "https://esm.sh/wouter-preact";
import {
  fetchStatus,
  fetchPairings,
  approvePairing,
  rejectPairing,
  fetchDevicePairings,
  approveDevice,
  rejectDevice,
  fetchOnboardStatus,
  fetchAuthStatus,
  logout,
  fetchDashboardUrl,
  updateSyncCron,
  fetchAlphaclawVersion,
  updateAlphaclaw,
  fetchRestartStatus,
  restartGateway,
  fetchWatchdogStatus,
  triggerWatchdogRepair,
  updateOpenclaw,
} from "./lib/api.js";
import { usePolling } from "./hooks/usePolling.js";
import { Gateway } from "./components/gateway.js";
import { Channels, ALL_CHANNELS } from "./components/channels.js";
import { Pairings } from "./components/pairings.js";
import { DevicePairings } from "./components/device-pairings.js";
import { Google } from "./components/google/index.js";
import { Features } from "./components/features.js";
import { Providers } from "./components/providers.js";
import { Welcome } from "./components/welcome.js";
import { Envars } from "./components/envars.js";
import { Webhooks } from "./components/webhooks.js";
import { ToastContainer, showToast } from "./components/toast.js";
import { TelegramWorkspace } from "./components/telegram-workspace/index.js";
import { ChevronDownIcon } from "./components/icons.js";
import { UpdateActionButton } from "./components/update-action-button.js";
import { GlobalRestartBanner } from "./components/global-restart-banner.js";
import { LoadingSpinner } from "./components/loading-spinner.js";
import { WatchdogTab } from "./components/watchdog-tab.js";
import { FileViewer } from "./components/file-viewer/index.js";
import { AppSidebar } from "./components/sidebar.js";
import { UsageTab } from "./components/usage-tab.js";
import { readUiSettings, writeUiSettings } from "./lib/ui-settings.js";
const html = htm.bind(h);
const kDefaultUiTab = "general";
const kDefaultSidebarWidthPx = 220;
const kSidebarMinWidthPx = 180;
const kSidebarMaxWidthPx = 460;
const kBrowseLastPathUiSettingKey = "browseLastPath";
const kLastMenuRouteUiSettingKey = "lastMenuRoute";
const normalizeBrowsePath = (value) => String(value || "").replace(/^\/+|\/+$/g, "");

const clampSidebarWidth = (value) =>
  Math.max(kSidebarMinWidthPx, Math.min(kSidebarMaxWidthPx, value));

const getHashPath = () => {
  const hash = window.location.hash.replace(/^#/, "");
  if (!hash) return `/${kDefaultUiTab}`;
  return hash.startsWith("/") ? hash : `/${hash}`;
};

const useHashLocation = () => {
  const [location, setLocationState] = useState(getHashPath);

  useEffect(() => {
    const onHashChange = () => setLocationState(getHashPath());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const setLocation = useCallback((to) => {
    const normalized = to.startsWith("/") ? to : `/${to}`;
    const nextHash = `#${normalized}`;
    if (window.location.hash !== nextHash) {
      window.location.hash = normalized;
      return;
    }
    setLocationState(normalized);
  }, []);

  return [location, setLocation];
};

const RouteRedirect = ({ to }) => {
  const [, setLocation] = useLocation();
  useEffect(() => {
    setLocation(to);
  }, [to, setLocation]);
  return null;
};

const GeneralTab = ({
  statusData = null,
  watchdogData = null,
  onRefreshStatuses = () => {},
  onSwitchTab,
  onNavigate,
  isActive,
  restartingGateway,
  onRestartGateway,
  restartSignal = 0,
  openclawUpdateInProgress = false,
  onOpenclawVersionActionComplete = () => {},
  onOpenclawUpdate,
}) => {
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [repairingWatchdog, setRepairingWatchdog] = useState(false);
  const status = statusData;
  const watchdogStatus = watchdogData;
  const gatewayStatus = status?.gateway ?? null;
  const channels = status?.channels ?? null;
  const repo = status?.repo || null;
  const syncCron = status?.syncCron || null;
  const openclawVersion = status?.openclawVersion || null;
  const [syncCronEnabled, setSyncCronEnabled] = useState(true);
  const [syncCronSchedule, setSyncCronSchedule] = useState("0 * * * *");
  const [savingSyncCron, setSavingSyncCron] = useState(false);
  const [syncCronChoice, setSyncCronChoice] = useState("0 * * * *");

  const hasUnpaired = ALL_CHANNELS.some((ch) => {
    const info = channels?.[ch];
    return info && info.status !== "paired";
  });

  const pairingsPoll = usePolling(
    async () => {
      const d = await fetchPairings();
      return d.pending || [];
    },
    1000,
    { enabled: hasUnpaired && gatewayStatus === "running" },
  );
  const pending = pairingsPoll.data || [];

  const refreshAfterAction = () => {
    setTimeout(pairingsPoll.refresh, 500);
    setTimeout(pairingsPoll.refresh, 2000);
    setTimeout(onRefreshStatuses, 3000);
  };

  const handleApprove = async (id, channel) => {
    await approvePairing(id, channel);
    refreshAfterAction();
  };

  const handleReject = async (id, channel) => {
    await rejectPairing(id, channel);
    refreshAfterAction();
  };

  const devicePoll = usePolling(
    async () => {
      const d = await fetchDevicePairings();
      return d.pending || [];
    },
    2000,
    { enabled: gatewayStatus === "running" },
  );
  const devicePending = devicePoll.data || [];

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

  useEffect(() => {
    if (!isActive) return;
    onRefreshStatuses();
    pairingsPoll.refresh();
    devicePoll.refresh();
  }, [isActive]);

  useEffect(() => {
    if (!restartSignal || !isActive) return;
    onRefreshStatuses();
    pairingsPoll.refresh();
    devicePoll.refresh();
    const t1 = setTimeout(() => {
      onRefreshStatuses();
      pairingsPoll.refresh();
      devicePoll.refresh();
    }, 1200);
    const t2 = setTimeout(() => {
      onRefreshStatuses();
      pairingsPoll.refresh();
      devicePoll.refresh();
    }, 3500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [
    restartSignal,
    isActive,
    onRefreshStatuses,
    pairingsPoll.refresh,
    devicePoll.refresh,
  ]);

  useEffect(() => {
    if (!syncCron) return;
    setSyncCronEnabled(syncCron.enabled !== false);
    setSyncCronSchedule(syncCron.schedule || "0 * * * *");
    setSyncCronChoice(
      syncCron.enabled === false
        ? "disabled"
        : syncCron.schedule || "0 * * * *",
    );
  }, [syncCron?.enabled, syncCron?.schedule]);

  const saveSyncCronSettings = async ({
    enabled = syncCronEnabled,
    schedule = syncCronSchedule,
  }) => {
    if (savingSyncCron) return;
    setSavingSyncCron(true);
    try {
      const data = await updateSyncCron({ enabled, schedule });
      if (!data.ok)
        throw new Error(data.error || "Could not save sync settings");
      showToast("Sync schedule updated", "success");
      onRefreshStatuses();
    } catch (err) {
      showToast(err.message || "Could not save sync settings", "error");
    }
    setSavingSyncCron(false);
  };

  const syncCronStatusText = syncCronEnabled ? "Enabled" : "Disabled";
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

  return html`
    <div class="space-y-4">
      <${Gateway}
        status=${gatewayStatus}
        openclawVersion=${openclawVersion}
        restarting=${restartingGateway}
        onRestart=${onRestartGateway}
        watchdogStatus=${watchdogStatus}
        onOpenWatchdog=${() => onSwitchTab("watchdog")}
        onRepair=${handleWatchdogRepair}
        repairing=${repairingWatchdog}
        openclawUpdateInProgress=${openclawUpdateInProgress}
        onOpenclawVersionActionComplete=${onOpenclawVersionActionComplete}
        onOpenclawUpdate=${onOpenclawUpdate}
      />
      <${Channels} channels=${channels} onSwitchTab=${onSwitchTab} onNavigate=${onNavigate} />
      <${Pairings}
        pending=${pending}
        channels=${channels}
        visible=${hasUnpaired}
        onApprove=${handleApprove}
        onReject=${handleReject}
      />
      <${Features} onSwitchTab=${onSwitchTab} />
      <${Google} gatewayStatus=${gatewayStatus} />

      ${repo &&
      html`
        <div class="bg-surface border border-border rounded-xl p-4">
          <div class="flex items-center justify-between gap-3">
            <div class="flex items-center gap-2 min-w-0">
              <svg
                class="w-4 h-4 text-gray-400"
                viewBox="0 0 16 16"
                fill="currentColor"
              >
                <path
                  d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"
                />
              </svg>
              <a
                href="https://github.com/${repo}"
                target="_blank"
                class="text-sm text-gray-400 hover:text-gray-200 transition-colors truncate"
                >${repo}</a
              >
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <span class="text-xs text-gray-400">Auto-sync</span>
              <div class="relative">
                <select
                  value=${syncCronChoice}
                  onchange=${(e) => {
                    const nextChoice = e.target.value;
                    setSyncCronChoice(nextChoice);
                    const nextEnabled = nextChoice !== "disabled";
                    const nextSchedule = nextEnabled
                      ? nextChoice
                      : syncCronSchedule;
                    setSyncCronEnabled(nextEnabled);
                    setSyncCronSchedule(nextSchedule);
                    saveSyncCronSettings({
                      enabled: nextEnabled,
                      schedule: nextSchedule,
                    });
                  }}
                  disabled=${savingSyncCron}
                  class="appearance-none bg-black/30 border border-border rounded-lg pl-2.5 pr-9 py-1.5 text-xs text-gray-300 ${savingSyncCron
                    ? "opacity-50 cursor-not-allowed"
                    : ""}"
                  title=${syncCron?.installed === false
                    ? "Not Installed Yet"
                    : syncCronStatusText}
                >
                  <option value="disabled">Disabled</option>
                  <option value="*/30 * * * *">Every 30 min</option>
                  <option value="0 * * * *">Hourly</option>
                  <option value="0 0 * * *">Daily</option>
                </select>
                <${ChevronDownIcon}
                  className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500"
                />
              </div>
            </div>
          </div>
        </div>
      `}

      <div class="bg-surface border border-border rounded-xl p-4">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="font-semibold text-sm">OpenClaw Gateway Dashboard</h2>
          </div>
          <${UpdateActionButton}
            onClick=${async () => {
              if (dashboardLoading) return;
              setDashboardLoading(true);
              try {
                const data = await fetchDashboardUrl();
                console.log("[dashboard] response:", JSON.stringify(data));
                window.open(data.url || "/openclaw", "_blank");
              } catch (err) {
                console.error("[dashboard] error:", err);
                window.open("/openclaw", "_blank");
              }
              setDashboardLoading(false);
            }}
            loading=${dashboardLoading}
            warning=${false}
            idleLabel="Open"
            loadingLabel="Opening..."
          />
        </div>
        <${DevicePairings}
          pending=${devicePending}
          onApprove=${handleDeviceApprove}
          onReject=${handleDeviceReject}
        />
      </div>
    </div>
  `;
};

const App = () => {
  const appShellRef = useRef(null);
  const [onboarded, setOnboarded] = useState(null);
  const [location, setLocation] = useLocation();
  const [acVersion, setAcVersion] = useState(null);
  const [acLatest, setAcLatest] = useState(null);
  const [acHasUpdate, setAcHasUpdate] = useState(false);
  const [acUpdating, setAcUpdating] = useState(false);
  const [acDismissed, setAcDismissed] = useState(false);
  const [authEnabled, setAuthEnabled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [sidebarTab, setSidebarTab] = useState(() =>
    location.startsWith("/browse") ? "browse" : "menu",
  );
  const [sidebarWidthPx, setSidebarWidthPx] = useState(() => {
    const settings = readUiSettings();
    if (!Number.isFinite(settings.sidebarWidthPx)) return kDefaultSidebarWidthPx;
    return clampSidebarWidth(settings.sidebarWidthPx);
  });
  const [lastBrowsePath, setLastBrowsePath] = useState(() => {
    const settings = readUiSettings();
    return typeof settings[kBrowseLastPathUiSettingKey] === "string"
      ? settings[kBrowseLastPathUiSettingKey]
      : "";
  });
  const [lastMenuRoute, setLastMenuRoute] = useState(() => {
    const settings = readUiSettings();
    const storedRoute = settings[kLastMenuRouteUiSettingKey];
    if (
      typeof storedRoute === "string" &&
      storedRoute.startsWith("/") &&
      !storedRoute.startsWith("/browse")
    ) {
      return storedRoute;
    }
    return `/${kDefaultUiTab}`;
  });
  const [isResizingSidebar, setIsResizingSidebar] = useState(false);
  const [browsePreviewPath, setBrowsePreviewPath] = useState("");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [mobileTopbarScrolled, setMobileTopbarScrolled] = useState(false);
  const [restartRequired, setRestartRequired] = useState(false);
  const [restartingGateway, setRestartingGateway] = useState(false);
  const [gatewayRestartSignal, setGatewayRestartSignal] = useState(0);
  const [statusPollCadenceMs, setStatusPollCadenceMs] = useState(15000);
  const [openclawUpdateInProgress, setOpenclawUpdateInProgress] = useState(false);
  const menuRef = useRef(null);
  const sharedStatusPoll = usePolling(fetchStatus, statusPollCadenceMs, {
    enabled: onboarded === true,
  });
  const sharedWatchdogPoll = usePolling(fetchWatchdogStatus, statusPollCadenceMs, {
    enabled: onboarded === true,
  });
  const sharedStatus = sharedStatusPoll.data || null;
  const sharedWatchdogStatus = sharedWatchdogPoll.data?.status || null;
  const refreshSharedStatuses = useCallback(() => {
    sharedStatusPoll.refresh();
    sharedWatchdogPoll.refresh();
  }, [sharedStatusPoll.refresh, sharedWatchdogPoll.refresh]);

  const closeMenu = useCallback((e) => {
    if (menuRef.current && !menuRef.current.contains(e.target)) {
      setMenuOpen(false);
    }
  }, []);

  useEffect(() => {
    if (menuOpen) {
      document.addEventListener("click", closeMenu, true);
      return () => document.removeEventListener("click", closeMenu, true);
    }
  }, [menuOpen, closeMenu]);

  useEffect(() => {
    fetchOnboardStatus()
      .then((data) => setOnboarded(data.onboarded))
      .catch(() => setOnboarded(false));
    fetchAuthStatus()
      .then((data) => setAuthEnabled(!!data.authEnabled))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!mobileSidebarOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileSidebarOpen]);

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
    onboarded,
    location,
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

  const handleGatewayRestart = useCallback(async () => {
    if (restartingGateway) return;
    setRestartingGateway(true);
    try {
      const data = await restartGateway();
      if (!data?.ok) throw new Error(data?.error || "Gateway restart failed");
      setRestartRequired(!!data.restartRequired);
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
  }, [restartingGateway, refreshRestartStatus, refreshSharedStatuses]);

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
  }, [
    openclawUpdateInProgress,
    refreshRestartStatus,
    refreshSharedStatuses,
  ]);

  const handleOpenclawVersionActionComplete = useCallback(
    ({ type }) => {
      if (type !== "update") return;
      refreshSharedStatuses();
      setTimeout(refreshSharedStatuses, 1200);
    },
    [refreshSharedStatuses],
  );

  const handleAcUpdate = async () => {
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
  };
  // Still loading onboard status
  if (onboarded === null) {
    return html`
      <div
        class="min-h-screen flex items-center justify-center"
        style="position: relative; z-index: 1"
      >
        <${LoadingSpinner}
          className="h-6 w-6"
          style="color: var(--text-muted)"
        />
      </div>
      <${ToastContainer} />
    `;
  }

  if (!onboarded) {
    return html`
      <div
        class="min-h-screen flex justify-center pt-12 pb-8 px-4"
        style="position: relative; z-index: 1"
      >
        <${Welcome} onComplete=${() => setOnboarded(true)} />
      </div>
      <${ToastContainer} />
    `;
  }

  const buildBrowseRoute = (relativePath, options = {}) => {
    const view = String(options?.view || "edit");
    const encodedPath = String(relativePath || "")
      .split("/")
      .filter(Boolean)
      .map((segment) => encodeURIComponent(segment))
      .join("/");
    const baseRoute = encodedPath ? `/browse/${encodedPath}` : "/browse";
    if (view === "diff" && encodedPath) return `${baseRoute}?view=diff`;
    return baseRoute;
  };
  const navigateToSubScreen = (screen) => {
    setLocation(`/${screen}`);
    setMobileSidebarOpen(false);
  };
  const handleBrowsePreviewFile = useCallback((nextPreviewPath) => {
    const normalizedPreviewPath = normalizeBrowsePath(nextPreviewPath);
    setBrowsePreviewPath(normalizedPreviewPath);
  }, []);
  const navigateToBrowseFile = (relativePath, options = {}) => {
    const normalizedTargetPath = normalizeBrowsePath(relativePath);
    const selectingDirectory =
      !!options.directory || String(relativePath || "").trim().endsWith("/");
    const shouldPreservePreview = selectingDirectory && !!options.preservePreview;
    const activePath = normalizeBrowsePath(
      browsePreviewPath || selectedBrowsePath || "",
    );
    const nextPreviewPath =
      shouldPreservePreview && activePath && activePath !== normalizedTargetPath
        ? activePath
        : "";
    setBrowsePreviewPath(nextPreviewPath);
    const routeOptions = selectingDirectory
      ? { ...options, view: "edit" }
      : options;
    setLocation(buildBrowseRoute(normalizedTargetPath, routeOptions));
    setMobileSidebarOpen(false);
  };
  const handleSidebarLogout = async () => {
    setMenuOpen(false);
    await logout();
    try {
      window.localStorage.clear();
      window.sessionStorage.clear();
    } catch {}
    window.location.href = "/login.html";
  };
  const handleSelectSidebarTab = (nextTab) => {
    setSidebarTab(nextTab);
    if (nextTab === "menu" && location.startsWith("/browse")) {
      setBrowsePreviewPath("");
      setLocation(lastMenuRoute || `/${kDefaultUiTab}`);
      return;
    }
    if (nextTab === "browse" && !location.startsWith("/browse")) {
      setLocation(buildBrowseRoute(lastBrowsePath));
    }
  };
  const handleSelectNavItem = (itemId) => {
    setLocation(`/${itemId}`);
    setMobileSidebarOpen(false);
  };
  const exitSubScreen = () => {
    setLocation(`/${kDefaultUiTab}`);
    setMobileSidebarOpen(false);
  };
  const handleAppContentScroll = (e) => {
    const nextScrolled = e.currentTarget.scrollTop > 0;
    setMobileTopbarScrolled((currentScrolled) =>
      currentScrolled === nextScrolled ? currentScrolled : nextScrolled,
    );
  };

  const kNavSections = [
    {
      label: "Setup",
      items: [
        { id: "general", label: "General" },
      ],
    },
    {
      label: "Monitoring",
      items: [
        { id: "watchdog", label: "Watchdog" },
        { id: "usage", label: "Usage" },
      ],
    },
    {
      label: "Config",
      items: [
        { id: "providers", label: "Providers" },
        { id: "envars", label: "Envars" },
        { id: "webhooks", label: "Webhooks" },
      ],
    },
  ];

  const isBrowseRoute = location.startsWith("/browse");
  const browseRoutePath = isBrowseRoute ? String(location || "").split("?")[0] : "";
  const browseRouteQuery =
    isBrowseRoute && String(location || "").includes("?")
      ? String(location || "").split("?").slice(1).join("?")
      : "";
  const selectedBrowsePath = isBrowseRoute
    ? browseRoutePath
        .replace(/^\/browse\/?/, "")
        .split("/")
        .filter(Boolean)
        .map((segment) => {
          try {
            return decodeURIComponent(segment);
          } catch {
            return segment;
          }
        })
        .join("/")
    : "";
  const activeBrowsePath = browsePreviewPath || selectedBrowsePath;
  const browseViewerMode =
    !browsePreviewPath &&
    new URLSearchParams(browseRouteQuery).get("view") === "diff"
      ? "diff"
      : "edit";
  const selectedNavId = isBrowseRoute
    ? "browse"
    : location === "/telegram"
    ? ""
    : location.startsWith("/providers")
    ? "providers"
    : location.startsWith("/watchdog")
    ? "watchdog"
    : location.startsWith("/usage")
    ? "usage"
    : location.startsWith("/envars")
    ? "envars"
    : location.startsWith("/webhooks")
    ? "webhooks"
    : "general";

  useEffect(() => {
    setSidebarTab((currentTab) => {
      if (location.startsWith("/browse")) return "browse";
      if (currentTab === "browse") return "menu";
      return currentTab;
    });
  }, [location]);

  useEffect(() => {
    if (location.startsWith("/browse")) return;
    setBrowsePreviewPath("");
  }, [location]);

  useEffect(() => {
    if (location.startsWith("/browse")) return;
    if (location === "/telegram") return;
    setLastMenuRoute((currentRoute) =>
      currentRoute === location ? currentRoute : location,
    );
  }, [location]);

  useEffect(() => {
    if (!isBrowseRoute) return;
    if (!selectedBrowsePath) return;
    setLastBrowsePath((currentPath) =>
      currentPath === selectedBrowsePath ? currentPath : selectedBrowsePath,
    );
  }, [isBrowseRoute, selectedBrowsePath]);

  useEffect(() => {
    const handleBrowseGitSynced = () => {
      if (!isBrowseRoute || browseViewerMode !== "diff") return;
      const activePath = String(selectedBrowsePath || "").trim();
      if (!activePath) return;
      setLocation(buildBrowseRoute(activePath, { view: "edit" }));
    };
    window.addEventListener("alphaclaw:browse-git-synced", handleBrowseGitSynced);
    return () => {
      window.removeEventListener(
        "alphaclaw:browse-git-synced",
        handleBrowseGitSynced,
      );
    };
  }, [
    isBrowseRoute,
    browseViewerMode,
    selectedBrowsePath,
    setLocation,
    buildBrowseRoute,
  ]);

  useEffect(() => {
    const settings = readUiSettings();
    settings.sidebarWidthPx = sidebarWidthPx;
    settings[kBrowseLastPathUiSettingKey] = lastBrowsePath;
    settings[kLastMenuRouteUiSettingKey] = lastMenuRoute;
    writeUiSettings(settings);
  }, [sidebarWidthPx, lastBrowsePath, lastMenuRoute]);

  const resizeSidebarWithClientX = useCallback((clientX) => {
    const shellElement = appShellRef.current;
    if (!shellElement) return;
    const shellBounds = shellElement.getBoundingClientRect();
    const nextWidth = clampSidebarWidth(Math.round(clientX - shellBounds.left));
    setSidebarWidthPx(nextWidth);
  }, []);

  const onSidebarResizerPointerDown = (event) => {
    event.preventDefault();
    setIsResizingSidebar(true);
    resizeSidebarWithClientX(event.clientX);
  };

  useEffect(() => {
    if (!isResizingSidebar) return () => {};
    const onPointerMove = (event) => resizeSidebarWithClientX(event.clientX);
    const onPointerUp = () => setIsResizingSidebar(false);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    const previousUserSelect = document.body.style.userSelect;
    const previousCursor = document.body.style.cursor;
    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      document.body.style.userSelect = previousUserSelect;
      document.body.style.cursor = previousCursor;
    };
  }, [isResizingSidebar, resizeSidebarWithClientX]);

  const renderWebhooks = (hookName = "") => html`
    <div class="pt-4">
      <${Webhooks}
        selectedHookName=${hookName}
        onSelectHook=${(name) => setLocation(`/webhooks/${encodeURIComponent(name)}`)}
        onBackToList=${() => setLocation("/webhooks")}
        onRestartRequired=${setRestartRequired}
      />
    </div>
  `;

  return html`
    <div
      class="app-shell"
      ref=${appShellRef}
      style=${{ "--sidebar-width": `${sidebarWidthPx}px` }}
    >
      <${GlobalRestartBanner}
        visible=${restartRequired}
        restarting=${restartingGateway}
        onRestart=${handleGatewayRestart}
      />
      <${AppSidebar}
        mobileSidebarOpen=${mobileSidebarOpen}
        authEnabled=${authEnabled}
        menuRef=${menuRef}
        menuOpen=${menuOpen}
        onToggleMenu=${() => setMenuOpen((open) => !open)}
        onLogout=${handleSidebarLogout}
        sidebarTab=${sidebarTab}
        onSelectSidebarTab=${handleSelectSidebarTab}
        navSections=${kNavSections}
        selectedNavId=${selectedNavId}
        onSelectNavItem=${handleSelectNavItem}
        selectedBrowsePath=${selectedBrowsePath}
        onSelectBrowseFile=${navigateToBrowseFile}
        onPreviewBrowseFile=${handleBrowsePreviewFile}
        acHasUpdate=${acHasUpdate}
        acLatest=${acLatest}
        acDismissed=${acDismissed}
        acUpdating=${acUpdating}
        onAcUpdate=${handleAcUpdate}
      />
      <div
        class=${`sidebar-resizer ${isResizingSidebar ? "is-resizing" : ""}`}
        onpointerdown=${onSidebarResizerPointerDown}
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize sidebar"
      ></div>

      <div
        class=${`mobile-sidebar-overlay ${mobileSidebarOpen ? "active" : ""}`}
        onclick=${() => setMobileSidebarOpen(false)}
      />

      <div
        class=${`app-content ${isBrowseRoute ? "browse-mode" : ""}`}
        onscroll=${handleAppContentScroll}
      >
        <div class=${`mobile-topbar ${mobileTopbarScrolled ? "is-scrolled" : ""}`}>
          <button
            class="mobile-topbar-menu"
            onclick=${() => setMobileSidebarOpen((open) => !open)}
            aria-label="Open menu"
            aria-expanded=${mobileSidebarOpen ? "true" : "false"}
          >
            <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor">
              <path
                d="M2 3.75a.75.75 0 01.75-.75h10.5a.75.75 0 010 1.5H2.75A.75.75 0 012 3.75zm0 4.25a.75.75 0 01.75-.75h10.5a.75.75 0 010 1.5H2.75A.75.75 0 012 8zm0 4.25a.75.75 0 01.75-.75h10.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75z"
              />
            </svg>
          </button>
          <span class="mobile-topbar-title">
            <span style="color: var(--accent)">alpha</span>claw
          </span>
        </div>
        <div class=${isBrowseRoute ? "w-full" : "max-w-2xl w-full mx-auto"}>
          <div style=${{ display: isBrowseRoute ? "block" : "none" }}>
            <${FileViewer}
              filePath=${activeBrowsePath}
              isPreviewOnly=${false}
              browseView=${browseViewerMode}
              onRequestEdit=${(targetPath) => {
                const normalizedTargetPath = String(targetPath || "");
                if (
                  normalizedTargetPath &&
                  normalizedTargetPath !== selectedBrowsePath
                ) {
                  navigateToBrowseFile(normalizedTargetPath, { view: "edit" });
                  return;
                }
                setLocation(buildBrowseRoute(selectedBrowsePath, { view: "edit" }));
              }}
              onRequestClearSelection=${() => {
                setBrowsePreviewPath("");
                setLocation("/browse");
              }}
            />
          </div>
          <div style=${{ display: isBrowseRoute ? "none" : "block" }}>
            <div style=${{ display: location === "/general" ? "block" : "none" }}>
              <div class="pt-4">
                <${GeneralTab}
                  statusData=${sharedStatus}
                  watchdogData=${sharedWatchdogStatus}
                  onRefreshStatuses=${refreshSharedStatuses}
                  onSwitchTab=${(nextTab) => setLocation(`/${nextTab}`)}
                  onNavigate=${navigateToSubScreen}
                  isActive=${location === "/general"}
                  restartingGateway=${restartingGateway}
                  onRestartGateway=${handleGatewayRestart}
                  restartSignal=${gatewayRestartSignal}
                  openclawUpdateInProgress=${openclawUpdateInProgress}
                  onOpenclawVersionActionComplete=${handleOpenclawVersionActionComplete}
                  onOpenclawUpdate=${handleOpenclawUpdate}
                />
              </div>
            </div>
            ${!isBrowseRoute && location !== "/general"
              ? html`
                  <${Switch}>
                    <${Route} path="/telegram">
                      <div class="pt-4">
                        <${TelegramWorkspace} onBack=${exitSubScreen} />
                      </div>
                    </${Route}>
                    <${Route} path="/providers">
                      <div class="pt-4">
                        <${Providers} onRestartRequired=${setRestartRequired} />
                      </div>
                    </${Route}>
                    <${Route} path="/watchdog">
                      <div class="pt-4">
                        <${WatchdogTab}
                          gatewayStatus=${sharedStatus?.gateway || null}
                          openclawVersion=${sharedStatus?.openclawVersion || null}
                          watchdogStatus=${sharedWatchdogStatus}
                          onRefreshStatuses=${refreshSharedStatuses}
                          restartingGateway=${restartingGateway}
                          onRestartGateway=${handleGatewayRestart}
                          restartSignal=${gatewayRestartSignal}
                          openclawUpdateInProgress=${openclawUpdateInProgress}
                          onOpenclawVersionActionComplete=${handleOpenclawVersionActionComplete}
                          onOpenclawUpdate=${handleOpenclawUpdate}
                        />
                      </div>
                    </${Route}>
                    <${Route} path="/usage/:sessionId">
                      ${(params) => html`
                        <div class="pt-4">
                          <${UsageTab}
                            sessionId=${decodeURIComponent(params.sessionId || "")}
                            onSelectSession=${(id) =>
                              setLocation(`/usage/${encodeURIComponent(String(id || ""))}`)}
                            onBackToSessions=${() => setLocation("/usage")}
                          />
                        </div>
                      `}
                    </${Route}>
                    <${Route} path="/usage">
                      <div class="pt-4">
                        <${UsageTab}
                          onSelectSession=${(id) =>
                            setLocation(`/usage/${encodeURIComponent(String(id || ""))}`)}
                          onBackToSessions=${() => setLocation("/usage")}
                        />
                      </div>
                    </${Route}>
                    <${Route} path="/envars">
                      <div class="pt-4">
                        <${Envars} onRestartRequired=${setRestartRequired} />
                      </div>
                    </${Route}>
                    <${Route} path="/webhooks/:hookName">
                      ${(params) =>
                        renderWebhooks(decodeURIComponent(params.hookName || ""))}
                    </${Route}>
                    <${Route} path="/webhooks">
                      ${() => renderWebhooks("")}
                    </${Route}>
                    <${Route}>
                      <${RouteRedirect} to="/general" />
                    </${Route}>
                  </${Switch}>
                `
              : null}
          </div>
        </div>
        <${ToastContainer}
          className="fixed bottom-10 right-4 z-50 space-y-2 pointer-events-none"
        />
      </div>

      <div class="app-statusbar">
        <div class="statusbar-left">
          ${acVersion
            ? html`<span style="color: var(--text-muted)">v${acVersion}</span>`
            : null}
        </div>
        <div class="statusbar-right">
          <a href="https://docs.openclaw.ai" target="_blank" rel="noreferrer"
            >docs</a
          >
          <a
            href="https://discord.com/invite/clawd"
            target="_blank"
            rel="noreferrer"
            >discord</a
          >
          <a
            href="https://github.com/openclaw/openclaw"
            target="_blank"
            rel="noreferrer"
            >github</a
          >
        </div>
      </div>
    </div>
  `;
};

render(
  html`
    <${Router} hook=${useHashLocation}>
      <${App} />
    </${Router}>
  `,
  document.getElementById("app"),
);
