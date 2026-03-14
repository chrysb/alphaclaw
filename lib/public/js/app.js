import { h, render } from "https://esm.sh/preact";
import { useState, useEffect } from "https://esm.sh/preact/hooks";
import htm from "https://esm.sh/htm";
import {
  Router,
  Route,
  Switch,
  useLocation,
} from "https://esm.sh/wouter-preact";
import { logout } from "./lib/api.js";
import { Welcome } from "./components/welcome/index.js";
import { ToastContainer } from "./components/toast.js";
import { GlobalRestartBanner } from "./components/global-restart-banner.js";
import { LoadingSpinner } from "./components/loading-spinner.js";
import { AppSidebar } from "./components/sidebar.js";
import {
  AgentsRoute,
  BrowseRoute,
  CronRoute,
  DoctorRoute,
  EnvarsRoute,
  GeneralRoute,
  ModelsRoute,
  NodesRoute,
  RouteRedirect,
  TelegramRoute,
  UsageRoute,
  WatchdogRoute,
  WebhooksRoute,
} from "./components/routes/index.js";
import { useAgents } from "./components/agents-tab/use-agents.js";
import { useAppShellController } from "./hooks/use-app-shell-controller.js";
import { useAppShellUi } from "./hooks/use-app-shell-ui.js";
import { useBrowseNavigation } from "./hooks/use-browse-navigation.js";
import {
  getHashRouterPath,
  useHashLocation,
} from "./hooks/use-hash-location.js";
import { readUiSettings, writeUiSettings } from "./lib/ui-settings.js";

const html = htm.bind(h);
const kDoctorWarningDismissedUntilUiSettingKey =
  "doctorWarningDismissedUntilMs";
const kOneWeekMs = 7 * 24 * 60 * 60 * 1000;
const kPendingCreateAgentWindowFlag = "__alphaclawPendingCreateAgent";

const App = () => {
  const [location, setLocation] = useLocation();
  const [doctorWarningDismissedUntilMs, setDoctorWarningDismissedUntilMs] =
    useState(() => {
      const settings = readUiSettings();
      return Number(settings[kDoctorWarningDismissedUntilUiSettingKey] || 0);
    });

  const { state: controllerState, actions: controllerActions } =
    useAppShellController({
      location,
    });
  const {
    refs: shellRefs,
    state: shellState,
    actions: shellActions,
  } = useAppShellUi();
  const {
    state: browseState,
    actions: browseActions,
    constants: browseConstants,
  } = useBrowseNavigation({
    location,
    setLocation,
    onCloseMobileSidebar: shellActions.closeMobileSidebar,
  });

  const {
    state: agentsState,
    actions: agentsActions,
  } = useAgents();

  const isAgentsRoute = location.startsWith("/agents");
  const isCronRoute = location.startsWith("/cron");
  const isEnvarsRoute = location.startsWith("/envars");
  const isModelsRoute = location.startsWith("/models");
  const isNodesRoute = location.startsWith("/nodes");
  const selectedAgentId = (() => {
    const match = location.match(/^\/agents\/([^/]+)/);
    return match ? decodeURIComponent(match[1]) : "";
  })();
  const agentDetailTab = (() => {
    const match = location.match(/^\/agents\/[^/]+\/([^/]+)/);
    const tab = match ? match[1] : "";
    return tab === "tools" ? "tools" : "overview";
  })();
  const selectedCronJobId = (() => {
    const match = location.match(/^\/cron\/([^/]+)/);
    return match ? decodeURIComponent(match[1]) : "";
  })();

  useEffect(() => {
    if (!isAgentsRoute) return;
    if (window[kPendingCreateAgentWindowFlag]) return;
    if (selectedAgentId) return;
    if (agentsState.loading || agentsState.agents.length === 0) return;
    setLocation(`/agents/${encodeURIComponent(agentsState.agents[0].id)}`);
  }, [isAgentsRoute, selectedAgentId, agentsState.loading, agentsState.agents, setLocation]);

  useEffect(() => {
    if (!isAgentsRoute) return;
    if (!window[kPendingCreateAgentWindowFlag]) return;
    window[kPendingCreateAgentWindowFlag] = false;
    window.setTimeout(() => {
      window.dispatchEvent(new Event("alphaclaw:create-agent"));
    }, 0);
  }, [isAgentsRoute]);

  useEffect(() => {
    const settings = readUiSettings();
    settings[kDoctorWarningDismissedUntilUiSettingKey] =
      doctorWarningDismissedUntilMs;
    writeUiSettings(settings);
  }, [doctorWarningDismissedUntilMs]);

  const handleSidebarLogout = async () => {
    shellActions.setMenuOpen(false);
    await logout();
    try {
      window.localStorage.clear();
      window.sessionStorage.clear();
    } catch {}
    window.location.href = "/login.html";
  };

  if (controllerState.onboarded === null) {
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

  if (!controllerState.onboarded) {
    return html`
      <div
        class="min-h-screen flex flex-col items-center pt-12 pb-8 px-4"
        style="position: relative; z-index: 1"
      >
        <${Welcome}
          onComplete=${controllerActions.handleOnboardingComplete}
          acVersion=${controllerState.acVersion}
        />
      </div>
      <${ToastContainer} />
    `;
  }

  return html`
    <div
      class="app-shell"
      ref=${shellRefs.appShellRef}
      style=${{ "--sidebar-width": `${shellState.sidebarWidthPx}px` }}
    >
      <${GlobalRestartBanner}
        visible=${controllerState.isAnyRestartRequired}
        restarting=${controllerState.restartingGateway}
        onRestart=${controllerActions.handleGatewayRestart}
      />
      <${AppSidebar}
        mobileSidebarOpen=${shellState.mobileSidebarOpen}
        authEnabled=${controllerState.authEnabled}
        menuRef=${shellRefs.menuRef}
        menuOpen=${shellState.menuOpen}
        onToggleMenu=${shellActions.onToggleMenu}
        onLogout=${handleSidebarLogout}
        sidebarTab=${browseState.sidebarTab}
        onSelectSidebarTab=${browseActions.handleSelectSidebarTab}
        navSections=${browseConstants.kNavSections}
        selectedNavId=${browseState.selectedNavId}
        onSelectNavItem=${browseActions.handleSelectNavItem}
        selectedBrowsePath=${browseState.selectedBrowsePath}
        onSelectBrowseFile=${browseActions.navigateToBrowseFile}
        onPreviewBrowseFile=${browseActions.handleBrowsePreviewFile}
        acHasUpdate=${controllerState.acHasUpdate}
        acLatest=${controllerState.acLatest}
        acUpdating=${controllerState.acUpdating}
        onAcUpdate=${controllerActions.handleAcUpdate}
        agents=${agentsState.agents}
        selectedAgentId=${selectedAgentId}
        onSelectAgent=${(agentId) => setLocation(`/agents/${encodeURIComponent(agentId)}`)}
        onAddAgent=${() => {
          if (isAgentsRoute) {
            window.dispatchEvent(new Event("alphaclaw:create-agent"));
            return;
          }
          window[kPendingCreateAgentWindowFlag] = true;
          setLocation("/agents");
        }}
      />
      <div
        class=${`sidebar-resizer ${shellState.isResizingSidebar ? "is-resizing" : ""}`}
        onpointerdown=${shellActions.onSidebarResizerPointerDown}
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize sidebar"
      ></div>

      <div
        class=${`mobile-sidebar-overlay ${shellState.mobileSidebarOpen ? "active" : ""}`}
        onclick=${shellActions.closeMobileSidebar}
      />

      <div class="app-content">
        <div
          class=${`mobile-topbar ${shellState.mobileTopbarScrolled ? "is-scrolled" : ""}`}
        >
          <button
            class="mobile-topbar-menu"
            onclick=${() =>
              shellActions.setMobileSidebarOpen((open) => !open)}
            aria-label="Open menu"
            aria-expanded=${shellState.mobileSidebarOpen ? "true" : "false"}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 16 16"
              fill="currentColor"
            >
              <path
                d="M2 3.75a.75.75 0 01.75-.75h10.5a.75.75 0 010 1.5H2.75A.75.75 0 012 3.75zm0 4.25a.75.75 0 01.75-.75h10.5a.75.75 0 010 1.5H2.75A.75.75 0 012 8zm0 4.25a.75.75 0 01.75-.75h10.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75z"
              />
            </svg>
          </button>
          <span class="mobile-topbar-title">
            <span style="color: var(--accent)">alpha</span>claw
          </span>
        </div>
        <div
          class="app-content-pane browse-pane"
          style=${{ display: browseState.isBrowseRoute ? "block" : "none" }}
        >
          <${BrowseRoute}
            activeBrowsePath=${browseState.activeBrowsePath}
            browseView=${browseState.browseViewerMode}
            lineTarget=${browseState.browseLineTarget}
            lineEndTarget=${browseState.browseLineEndTarget}
            selectedBrowsePath=${browseState.selectedBrowsePath}
            onNavigateToBrowseFile=${browseActions.navigateToBrowseFile}
            onEditSelectedBrowseFile=${() =>
              setLocation(
                browseActions.buildBrowseRoute(browseState.selectedBrowsePath, {
                  view: "edit",
                }),
              )}
            onClearSelection=${() => {
              browseActions.clearBrowsePreview();
              setLocation("/browse");
            }}
          />
        </div>
        <div
          class="app-content-pane agents-pane"
          style=${{ display: isAgentsRoute ? "block" : "none" }}
        >
          <${AgentsRoute}
            agents=${agentsState.agents}
            loading=${agentsState.loading}
            saving=${agentsState.saving}
            agentsActions=${agentsActions}
            selectedAgentId=${selectedAgentId}
            activeTab=${agentDetailTab}
            onSelectAgent=${(agentId) => setLocation(`/agents/${encodeURIComponent(agentId)}`)}
            onSelectTab=${(tab) => {
              const safePath = tab && tab !== "overview"
                ? `/agents/${encodeURIComponent(selectedAgentId)}/${tab}`
                : `/agents/${encodeURIComponent(selectedAgentId)}`;
              setLocation(safePath);
            }}
            onNavigateToBrowseFile=${browseActions.navigateToBrowseFile}
            onSetLocation=${setLocation}
          />
        </div>
        <div
          class="app-content-pane cron-pane"
          style=${{ display: isCronRoute ? "block" : "none" }}
        >
          <${CronRoute}
            jobId=${selectedCronJobId}
            onSetLocation=${setLocation}
          />
        </div>
        <div
          class="app-content-pane ac-fixed-header-pane"
          style=${{ display: isEnvarsRoute ? "block" : "none" }}
        >
          <${EnvarsRoute} onRestartRequired=${controllerActions.setRestartRequired} />
        </div>
        <div
          class="app-content-pane ac-fixed-header-pane"
          style=${{ display: isModelsRoute ? "block" : "none" }}
        >
          <${ModelsRoute} onRestartRequired=${controllerActions.setRestartRequired} />
        </div>
        <div
          class="app-content-pane ac-fixed-header-pane"
          style=${{ display: isNodesRoute ? "block" : "none" }}
        >
          <${NodesRoute} onRestartRequired=${controllerActions.setRestartRequired} />
        </div>
        <div
          class="app-content-pane"
          onscroll=${shellActions.handlePaneScroll}
          style=${{ display: browseState.isBrowseRoute || isAgentsRoute || isCronRoute || isEnvarsRoute || isModelsRoute || isNodesRoute ? "none" : "block" }}
        >
          <div class="max-w-2xl w-full mx-auto">
            ${!browseState.isBrowseRoute && !isAgentsRoute && !isCronRoute && !isEnvarsRoute && !isModelsRoute && !isNodesRoute
              ? html`
                  <${Switch}>
                    <${Route} path="/general">
                      <${GeneralRoute}
                        statusData=${controllerState.sharedStatus}
                        watchdogData=${controllerState.sharedWatchdogStatus}
                        doctorStatusData=${controllerState.sharedDoctorStatus}
                        agents=${agentsState.agents}
                        doctorWarningDismissedUntilMs=${doctorWarningDismissedUntilMs}
                        onRefreshStatuses=${controllerActions.refreshSharedStatuses}
                        onSetLocation=${setLocation}
                        onNavigate=${browseActions.navigateToSubScreen}
                        restartingGateway=${controllerState.restartingGateway}
                        onRestartGateway=${controllerActions.handleGatewayRestart}
                        restartSignal=${controllerState.gatewayRestartSignal}
                        openclawUpdateInProgress=${controllerState.openclawUpdateInProgress}
                        onOpenclawVersionActionComplete=${controllerActions.handleOpenclawVersionActionComplete}
                        onOpenclawUpdate=${controllerActions.handleOpenclawUpdate}
                        onRestartRequired=${controllerActions.setRestartRequired}
                        onDismissDoctorWarning=${() =>
                          setDoctorWarningDismissedUntilMs(
                            Date.now() + kOneWeekMs,
                          )}
                      />
                    </${Route}>
                    <${Route} path="/doctor">
                      <${DoctorRoute} onNavigateToBrowseFile=${browseActions.navigateToBrowseFile} />
                    </${Route}>
                    <${Route} path="/telegram/:accountId">
                      ${(params) => html`
                        <${TelegramRoute}
                          accountId=${decodeURIComponent(params.accountId || "default")}
                          onBack=${browseActions.exitSubScreen}
                        />
                      `}
                    </${Route}>
                    <${Route} path="/telegram">
                      <${RouteRedirect} to="/telegram/default" />
                    </${Route}>
                    <${Route} path="/providers">
                      <${RouteRedirect} to="/models" />
                    </${Route}>
                    <${Route} path="/watchdog">
                      <${WatchdogRoute}
                        statusData=${controllerState.sharedStatus}
                        watchdogStatus=${controllerState.sharedWatchdogStatus}
                        onRefreshStatuses=${controllerActions.refreshSharedStatuses}
                        restartingGateway=${controllerState.restartingGateway}
                        onRestartGateway=${controllerActions.handleGatewayRestart}
                        restartSignal=${controllerState.gatewayRestartSignal}
                        openclawUpdateInProgress=${controllerState.openclawUpdateInProgress}
                        onOpenclawVersionActionComplete=${controllerActions.handleOpenclawVersionActionComplete}
                        onOpenclawUpdate=${controllerActions.handleOpenclawUpdate}
                      />
                    </${Route}>
                    <${Route} path="/usage/:sessionId">
                      ${(params) => html`
                        <${UsageRoute}
                          sessionId=${decodeURIComponent(
                            params.sessionId || "",
                          )}
                          onSetLocation=${setLocation}
                        />
                      `}
                    </${Route}>
                    <${Route} path="/usage">
                      <${UsageRoute} onSetLocation=${setLocation} />
                    </${Route}>
                    <${Route} path="/webhooks/:hookName">
                      ${(params) => html`
                        <${WebhooksRoute}
                          hookName=${decodeURIComponent(params.hookName || "")}
                          routeHistoryRef=${browseState.routeHistoryRef}
                          getCurrentPath=${getHashRouterPath}
                          onSetLocation=${setLocation}
                          onRestartRequired=${controllerActions.setRestartRequired}
                          onNavigateToBrowseFile=${browseActions.navigateToBrowseFile}
                        />
                      `}
                    </${Route}>
                    <${Route} path="/webhooks">
                      <${WebhooksRoute}
                        routeHistoryRef=${browseState.routeHistoryRef}
                        getCurrentPath=${getHashRouterPath}
                        onSetLocation=${setLocation}
                        onRestartRequired=${controllerActions.setRestartRequired}
                        onNavigateToBrowseFile=${browseActions.navigateToBrowseFile}
                      />
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
          className="fixed top-4 right-4 z-[60] space-y-2 pointer-events-none"
        />
      </div>

      <div class="app-statusbar">
        <div class="statusbar-left">
          ${controllerState.acVersion
            ? html`<span style="color: var(--text-muted)"
                >v${controllerState.acVersion}</span
              >`
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

const rootElement = document.getElementById("app");
if (rootElement) {
  const appBootCounter = "__alphaclawSetupAppBootCount";
  window[appBootCounter] = Number(window[appBootCounter] || 0) + 1;
  // Defensive: clear root so duplicate bootstraps cannot stack full app shells.
  render(null, rootElement);
  rootElement.replaceChildren();
  render(
    html`
      <${Router} hook=${useHashLocation}>
        <${App} />
      </${Router}>
    `,
    rootElement,
  );
}
