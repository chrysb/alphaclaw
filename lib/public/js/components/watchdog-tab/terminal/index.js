import { h } from "https://esm.sh/preact";
import htm from "https://esm.sh/htm";

const html = htm.bind(h);

export const WatchdogTerminal = ({
  panelRef = null,
  hostRef = null,
  terminalInstanceRef = null,
  panelHeightPx = 320,
}) => html`
  <div
    ref=${panelRef}
    class="watchdog-logs-panel bg-black/40 border border-border rounded-lg p-3 overflow-hidden"
    style=${{ height: `${panelHeightPx}px` }}
    onClick=${() => terminalInstanceRef?.current?.focus()}
  >
    <div ref=${hostRef} class="watchdog-terminal-host w-full h-full"></div>
  </div>
`;
