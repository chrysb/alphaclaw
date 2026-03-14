import { h } from "https://esm.sh/preact";
import htm from "https://esm.sh/htm";
import {
  kWatchdogConsoleTabLogs,
  kWatchdogConsoleTabTerminal,
} from "../helpers.js";
import { WatchdogTerminal } from "../terminal/index.js";

const html = htm.bind(h);

export const WatchdogConsoleCard = ({
  activeConsoleTab = kWatchdogConsoleTabLogs,
  stickToBottom = true,
  onSetStickToBottom = () => {},
  onSelectConsoleTab = () => {},
  connectingTerminal = false,
  terminalConnected = false,
  terminalEnded = false,
  terminalStatusText = "",
  terminalUiSettling = false,
  onRestartTerminalSession = () => {},
  logsRef = null,
  logs = "",
  loadingLogs = true,
  terminalPanelRef = null,
  terminalHostRef = null,
  terminalInstanceRef = null,
  logsPanelHeightPx = 320,
}) => html`
  <div class="bg-surface border border-border rounded-xl p-4">
    <div class="flex items-center justify-between gap-2 mb-3">
      <div
        class="inline-flex items-center rounded-lg border border-border bg-black/20 p-0.5"
      >
        <button
          type="button"
          class=${`px-2.5 py-1 text-xs rounded-md ${activeConsoleTab === kWatchdogConsoleTabLogs ? "bg-surface text-gray-100" : "text-gray-400 hover:text-gray-200"}`}
          onClick=${() => onSelectConsoleTab(kWatchdogConsoleTabLogs)}
        >
          Logs
        </button>
        <button
          type="button"
          class=${`px-2.5 py-1 text-xs rounded-md ${activeConsoleTab === kWatchdogConsoleTabTerminal ? "bg-surface text-gray-100" : "text-gray-400 hover:text-gray-200"}`}
          onClick=${() => onSelectConsoleTab(kWatchdogConsoleTabTerminal)}
        >
          Terminal
        </button>
      </div>
      <div class="flex items-center gap-2">
        ${activeConsoleTab === kWatchdogConsoleTabLogs
          ? html`
              <label class="inline-flex items-center gap-2 text-xs text-gray-400">
                <input
                  type="checkbox"
                  checked=${stickToBottom}
                  onchange=${(event) =>
                    onSetStickToBottom(!!event.currentTarget?.checked)}
                />
                Stick to bottom
              </label>
            `
          : html`
              <div class="flex items-center gap-2 pr-1">
                ${terminalUiSettling
                  ? null
                  : html`
                      <span class="text-xs text-gray-500">
                        ${connectingTerminal
                          ? "Connecting..."
                          : terminalEnded
                            ? "Session ended"
                            : terminalConnected
                              ? "Connected"
                              : terminalStatusText || "Disconnected"}
                      </span>
                      ${connectingTerminal || terminalConnected
                        ? null
                        : html`
                            <button
                              type="button"
                              class="ac-btn-secondary text-xs px-2.5 py-1 rounded-lg"
                              onClick=${onRestartTerminalSession}
                            >
                              New session
                            </button>
                          `}
                    `}
              </div>
            `}
      </div>
    </div>
    <div class=${activeConsoleTab === kWatchdogConsoleTabLogs ? "" : "hidden"}>
      <pre
        ref=${logsRef}
        class="watchdog-logs-panel bg-black/40 border border-border rounded-lg p-3 overflow-auto text-xs text-gray-300 whitespace-pre-wrap break-words"
        style=${{ height: `${logsPanelHeightPx}px` }}
      >
${loadingLogs ? "Loading logs..." : logs || "No logs yet."}</pre
      >
    </div>
    <div
      class=${activeConsoleTab === kWatchdogConsoleTabTerminal
        ? "space-y-2"
        : "hidden"}
    >
      <${WatchdogTerminal}
        panelRef=${terminalPanelRef}
        hostRef=${terminalHostRef}
        terminalInstanceRef=${terminalInstanceRef}
        panelHeightPx=${logsPanelHeightPx}
      />
    </div>
  </div>
`;
