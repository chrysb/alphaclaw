import { h } from "https://esm.sh/preact";
import htm from "https://esm.sh/htm";
import { kProfileLabels } from "../agent-tools/tool-catalog.js";

const html = htm.bind(h);

export const AgentToolsCard = ({
  profile = "full",
  enabledCount = 0,
  totalCount = 0,
  onSwitchToTools = () => {},
}) => {
  const profileLabel = kProfileLabels[profile] || profile;

  return html`
    <div class="bg-surface border border-border rounded-xl p-4">
      <h2 class="card-label mb-3">Tools</h2>
      <div
        class="flex items-center justify-between gap-3 cursor-pointer hover:bg-white/5 -mx-2 px-2 py-1.5 rounded-lg transition-colors"
        role="button"
        tabindex="0"
        onclick=${onSwitchToTools}
        onKeyDown=${(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSwitchToTools();
          }
        }}
      >
        <span class="font-medium text-sm">${profileLabel}</span>
        <span class="flex items-center gap-2 shrink-0">
          <span class="text-xs text-gray-500">
            ${enabledCount}/${totalCount} enabled
          </span>
          <svg
            width="14"
            height="14"
            viewBox="0 0 16 16"
            fill="none"
            class="text-gray-600"
          >
            <path
              d="M6 3.5L10.5 8L6 12.5"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </span>
      </div>
    </div>
  `;
};
