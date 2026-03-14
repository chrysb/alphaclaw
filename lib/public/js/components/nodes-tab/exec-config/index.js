import { h } from "https://esm.sh/preact";
import htm from "https://esm.sh/htm";
import { ActionButton } from "../../action-button.js";
import { useExecConfig } from "./use-exec-config.js";

const html = htm.bind(h);

export const NodeExecConfigCard = ({
  nodes = [],
  onRestartRequired = () => {},
}) => {
  const state = useExecConfig({ onRestartRequired });

  const availableNodeOptions = nodes
    .filter((node) => String(node?.nodeId || "").trim())
    .map((node) => ({
      value: String(node.nodeId).trim(),
      label: String(node?.displayName || node.nodeId).trim(),
    }));

  return html`
    <div class="bg-surface border border-border rounded-xl p-4 space-y-3">
      <div class="flex items-center justify-between gap-2">
        <div class="space-y-1">
          <h3 class="font-semibold text-sm">Exec Routing</h3>
          <p class="text-xs text-gray-500">
            Set where command execution runs and how strict approval policy should be.
          </p>
        </div>
        <${ActionButton}
          onClick=${state.refresh}
          idleLabel="Reload"
          tone="secondary"
          size="sm"
          disabled=${state.loading}
        />
      </div>

      ${state.error ? html`<div class="text-xs text-red-400">${state.error}</div>` : null}

      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <label class="space-y-1">
          <div class="text-xs text-gray-500">Host</div>
          <select
            value=${state.config.host}
            disabled=${state.loading || state.saving}
            oninput=${(event) => state.updateField("host", event.target.value)}
            class="w-full bg-black/30 border border-border rounded-lg px-2.5 py-2 text-xs font-mono focus:border-gray-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="gateway">gateway</option>
            <option value="node">node</option>
          </select>
        </label>

        <label class="space-y-1">
          <div class="text-xs text-gray-500">Security</div>
          <select
            value=${state.config.security}
            disabled=${state.loading || state.saving}
            oninput=${(event) => state.updateField("security", event.target.value)}
            class="w-full bg-black/30 border border-border rounded-lg px-2.5 py-2 text-xs font-mono focus:border-gray-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="deny">deny</option>
            <option value="allowlist">allowlist</option>
            <option value="full">full</option>
          </select>
        </label>

        <label class="space-y-1">
          <div class="text-xs text-gray-500">Ask</div>
          <select
            value=${state.config.ask}
            disabled=${state.loading || state.saving}
            oninput=${(event) => state.updateField("ask", event.target.value)}
            class="w-full bg-black/30 border border-border rounded-lg px-2.5 py-2 text-xs font-mono focus:border-gray-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="off">off</option>
            <option value="on-miss">on-miss</option>
            <option value="always">always</option>
          </select>
        </label>

        <label class="space-y-1">
          <div class="text-xs text-gray-500">Node target</div>
          <select
            value=${state.config.node}
            disabled=${state.loading || state.saving || state.config.host !== "node"}
            oninput=${(event) => state.updateField("node", event.target.value)}
            class="w-full bg-black/30 border border-border rounded-lg px-2.5 py-2 text-xs font-mono focus:border-gray-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="">${availableNodeOptions.length ? "Select node..." : "No nodes available"}</option>
            ${availableNodeOptions.map(
              (option) => html`
                <option value=${option.value}>${option.label}</option>
              `,
            )}
          </select>
        </label>
      </div>

      <div class="rounded-lg border border-yellow-500/40 bg-yellow-500/10 px-3 py-2 text-xs text-yellow-300">
        Save applies config immediately, but gateway restart may still be required by OpenClaw.
      </div>

      <div class="flex justify-end">
        <${ActionButton}
          onClick=${state.save}
          loading=${state.saving}
          idleLabel="Save Exec Config"
          loadingLabel="Saving..."
          tone="primary"
          size="sm"
          disabled=${state.loading || (state.config.host === "node" && !state.config.node)}
        />
      </div>
    </div>
  `;
};
