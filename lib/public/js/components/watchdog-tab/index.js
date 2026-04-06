import { h } from "preact";
import htm from "htm";
import { Gateway } from "../gateway.js";
import { useWatchdogTab } from "./use-watchdog-tab.js";
import { WatchdogResourcesCard } from "./resources/index.js";
import { WatchdogSettingsCard } from "./settings/index.js";
import { WatchdogConsoleCard } from "./console/index.js";
import { WatchdogIncidentsCard } from "./incidents/index.js";

const html = htm.bind(h);

export const WatchdogTab = ({
  gatewayStatus = null,
  openclawVersion = null,
  watchdogStatus = null,
  onRefreshStatuses = () => {},
  restartingGateway = false,
  onRestartGateway,
  restartSignal = 0,
  openclawRestarting = false,
  openclawUpdateInProgress = false,
  onOpenclawVersionActionComplete = () => {},
  onOpenclawUpdate,
}) => {
  const state = useWatchdogTab({
    watchdogStatus,
    onRefreshStatuses,
    restartSignal,
  });

  return html`
    <div class="space-y-4">
      <${Gateway}
        status=${gatewayStatus}
        openclawVersion=${openclawVersion}
        restarting=${restartingGateway}
        onRestart=${onRestartGateway}
        watchdogStatus=${state.currentWatchdogStatus}
        onRepair=${state.onRepair}
        repairing=${state.isRepairInProgress}
        openclawRestarting=${openclawRestarting}
        openclawUpdateInProgress=${openclawUpdateInProgress}
        onOpenclawVersionActionComplete=${onOpenclawVersionActionComplete}
        onOpenclawUpdate=${onOpenclawUpdate}
      />

      <${WatchdogResourcesCard}
        resources=${state.resources}
        memoryExpanded=${state.memoryExpanded}
        onSetMemoryExpanded=${state.setMemoryExpanded}
      />

      <${WatchdogSettingsCard}
        settings=${state.settings}
        savingSettings=${state.savingSettings}
        onToggleAutoRepair=${state.onToggleAutoRepair}
        onToggleNotifications=${state.onToggleNotifications}
      />

      <${WatchdogConsoleCard}
        activeConsoleTab=${state.activeConsoleTab}
        stickToBottom=${state.stickToBottom}
        onSetStickToBottom=${state.setStickToBottom}
        onSelectConsoleTab=${state.handleSelectConsoleTab}
        connectingTerminal=${state.connectingTerminal}
        terminalConnected=${state.terminalConnected}
        terminalEnded=${state.terminalEnded}
        terminalStatusText=${state.terminalStatusText}
        terminalUiSettling=${state.terminalUiSettling}
        onRestartTerminalSession=${state.onRestartTerminalSession}
        logsRef=${state.logsRef}
        logs=${state.logs}
        loadingLogs=${state.loadingLogs}
        copyingAll=${state.copyingAll}
        terminalPanelRef=${state.terminalPanelRef}
        terminalHostRef=${state.terminalHostRef}
        terminalInstanceRef=${state.terminalInstanceRef}
        logsPanelHeightPx=${state.logsPanelHeightPx}
        onCopyAll=${state.onCopyAll}
      />

      <${WatchdogIncidentsCard}
        events=${state.events}
        onRefresh=${state.refreshEvents}
      />
    </div>
  `;
};
