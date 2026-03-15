import { useWatchdogConsole } from "./console/use-console.js";
import { useWatchdogIncidents } from "./incidents/use-incidents.js";
import { useWatchdogResources } from "./resources/use-resources.js";
import { useWatchdogSettings } from "./settings/use-settings.js";

export const useWatchdogTab = ({
  watchdogStatus = null,
  onRefreshStatuses = () => {},
  restartSignal = 0,
} = {}) => {
  const currentWatchdogStatus = watchdogStatus || {};
  const incidents = useWatchdogIncidents({
    restartSignal,
    onRefreshStatuses,
  });
  const resources = useWatchdogResources();
  const settings = useWatchdogSettings({
    watchdogStatus: currentWatchdogStatus,
    onRefreshStatuses,
    onRefreshIncidents: incidents.refreshEvents,
  });
  const consoleState = useWatchdogConsole();

  return {
    currentWatchdogStatus,
    events: incidents.events,
    refreshEvents: incidents.refreshEvents,
    resources: resources.resources,
    memoryExpanded: resources.memoryExpanded,
    setMemoryExpanded: resources.setMemoryExpanded,
    settings: settings.settings,
    savingSettings: settings.savingSettings,
    onToggleAutoRepair: settings.onToggleAutoRepair,
    onToggleNotifications: settings.onToggleNotifications,
    onRepair: settings.onRepair,
    isRepairInProgress: settings.isRepairInProgress,
    logs: consoleState.logs,
    loadingLogs: consoleState.loadingLogs,
    stickToBottom: consoleState.stickToBottom,
    setStickToBottom: consoleState.setStickToBottom,
    activeConsoleTab: consoleState.activeConsoleTab,
    handleSelectConsoleTab: consoleState.handleSelectConsoleTab,
    connectingTerminal: consoleState.connectingTerminal,
    terminalConnected: consoleState.terminalConnected,
    terminalEnded: consoleState.terminalEnded,
    terminalStatusText: consoleState.terminalStatusText,
    terminalUiSettling: consoleState.terminalUiSettling,
    onRestartTerminalSession: consoleState.onRestartTerminalSession,
    logsPanelHeightPx: consoleState.logsPanelHeightPx,
    logsRef: consoleState.logsRef,
    terminalPanelRef: consoleState.terminalPanelRef,
    terminalHostRef: consoleState.terminalHostRef,
    terminalInstanceRef: consoleState.terminalInstanceRef,
  };
};
