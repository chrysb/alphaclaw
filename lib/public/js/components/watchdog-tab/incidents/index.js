import { h } from "https://esm.sh/preact";
import htm from "https://esm.sh/htm";
import { getIncidentStatusTone } from "../helpers.js";

const html = htm.bind(h);

export const WatchdogIncidentsCard = ({
  events = [],
  onRefresh = () => {},
}) => html`
  <div class="bg-surface border border-border rounded-xl p-4">
    <div class="flex items-center justify-between gap-2 mb-3">
      <h2 class="card-label">Recent incidents</h2>
      <button class="text-xs text-gray-400 hover:text-gray-200" onclick=${onRefresh}>
        Refresh
      </button>
    </div>
    <div class="ac-history-list">
      ${events.length === 0 &&
      html`<p class="text-xs text-gray-500">No incidents recorded.</p>`}
      ${events.map((event) => {
        const tone = getIncidentStatusTone(event);
        return html`
          <details class="ac-history-item">
            <summary class="ac-history-summary">
              <div class="ac-history-summary-row">
                <span class="inline-flex items-center gap-2 min-w-0">
                  <span class="ac-history-toggle shrink-0" aria-hidden="true"
                    >▸</span
                  >
                  <span class="truncate">
                    ${event.createdAt || ""} · ${event.eventType || "event"} ·
                    ${event.status || "unknown"}
                  </span>
                </span>
                <span
                  class=${`h-2.5 w-2.5 shrink-0 rounded-full ${tone.dotClass}`}
                  title=${tone.label}
                  aria-label=${tone.label}
                ></span>
              </div>
            </summary>
            <div class="ac-history-body text-xs text-gray-400">
              <div>Source: ${event.source || "unknown"}</div>
              <pre class="mt-2 bg-black/30 rounded p-2 whitespace-pre-wrap break-words">
${typeof event.details === "string"
                  ? event.details
                  : JSON.stringify(event.details || {}, null, 2)}</pre
              >
            </div>
          </details>
        `;
      })}
    </div>
  </div>
`;
