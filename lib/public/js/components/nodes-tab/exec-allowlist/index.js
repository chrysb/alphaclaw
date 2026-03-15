import { h } from "https://esm.sh/preact";
import htm from "https://esm.sh/htm";
import { ActionButton } from "../../action-button.js";
import { useExecAllowlist } from "./use-exec-allowlist.js";

const html = htm.bind(h);

export const NodeExecAllowlistCard = () => {
  const state = useExecAllowlist();

  return html`
    <div class="bg-surface border border-border rounded-xl p-4 space-y-3">
      <div class="flex items-center justify-between gap-2">
        <div class="space-y-1">
          <h3 class="font-semibold text-sm">Gateway Exec Allowlist</h3>
          <p class="text-xs text-gray-500">
            Patterns here are used when <code>tools.exec.security</code> is set to
            <code>allowlist</code>.
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

      <div class="flex items-center gap-2">
        <input
          type="text"
          value=${state.patternInput}
          oninput=${(event) => state.setPatternInput(event.target.value)}
          placeholder="/usr/bin/sw_vers"
          class="flex-1 min-w-0 bg-black/30 border border-border rounded-lg px-2.5 py-2 text-xs font-mono focus:border-gray-500 focus:outline-none"
          disabled=${state.loading || state.saving}
        />
        <${ActionButton}
          onClick=${state.addPattern}
          loading=${state.saving}
          idleLabel="Add Pattern"
          loadingLabel="Adding..."
          tone="primary"
          size="sm"
          disabled=${!String(state.patternInput || "").trim()}
        />
      </div>

      <div class="text-[11px] text-gray-500">
        Supports wildcard patterns like <code>*</code>, <code>**</code>, and
        exact executable paths.
      </div>

      ${state.loading
        ? html`<div class="text-xs text-gray-500">Loading allowlist...</div>`
        : !state.allowlist.length
          ? html`<div class="text-xs text-gray-500">No allowlist patterns configured.</div>`
          : html`
              <div class="space-y-2">
                ${state.allowlist.map(
                  (entry) => html`
                    <div class="ac-surface-inset rounded-lg px-3 py-2 flex items-center justify-between gap-2">
                      <div class="min-w-0">
                        <div class="text-xs font-mono text-gray-200 truncate">
                          ${entry?.pattern || ""}
                        </div>
                        <div class="text-[11px] text-gray-500 font-mono truncate">
                          ${entry?.id || ""}
                        </div>
                      </div>
                      <${ActionButton}
                        onClick=${() => state.removePattern(entry?.id)}
                        loading=${state.removingId === String(entry?.id || "")}
                        idleLabel="Remove"
                        loadingLabel="Removing..."
                        tone="danger"
                        size="sm"
                      />
                    </div>
                  `,
                )}
              </div>
            `}
    </div>
  `;
};
