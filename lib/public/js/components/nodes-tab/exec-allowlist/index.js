import { h } from "preact";
import htm from "htm";
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
          <p class="text-xs text-fg-muted">
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

      ${state.error ? html`<div class="text-xs text-status-error-muted">${state.error}</div>` : null}

      <div class="flex items-center gap-2">
        <input
          type="text"
          value=${state.patternInput}
          oninput=${(event) => state.setPatternInput(event.target.value)}
          placeholder="/usr/bin/sw_vers"
          class="flex-1 min-w-0 bg-field border border-border rounded-lg px-2.5 py-2 text-xs font-mono focus:border-fg-muted focus:outline-none"
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

      <div class="text-[11px] text-fg-muted">
        Supports wildcard patterns like <code>*</code>, <code>**</code>, and
        exact executable paths.
      </div>

      ${state.loading
        ? html`<div class="text-xs text-fg-muted">Loading allowlist...</div>`
        : !state.allowlist.length
          ? html`<div class="text-xs text-fg-muted">No allowlist patterns configured.</div>`
          : html`
              <div class="space-y-2">
                ${state.allowlist.map(
                  (entry) => html`
                    <div class="ac-surface-inset rounded-lg px-3 py-2 flex items-center justify-between gap-2">
                      <div class="min-w-0">
                        <div class="text-xs font-mono text-body truncate">
                          ${entry?.pattern || ""}
                        </div>
                        <div class="text-[11px] text-fg-muted font-mono truncate">
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
