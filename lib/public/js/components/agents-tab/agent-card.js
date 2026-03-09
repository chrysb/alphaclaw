import { h } from "https://esm.sh/preact";
import htm from "https://esm.sh/htm";
import { ActionButton } from "../action-button.js";
import { Badge } from "../badge.js";

const html = htm.bind(h);

export const AgentCard = ({
  agent = {},
  saving = false,
  onSetDefault = () => {},
  onEdit = () => {},
  onDelete = () => {},
  onOpenWorkspace = () => {},
}) => {
  const isMain = String(agent.id || "") === "main";
  return html`
    <div class="bg-surface border border-border rounded-xl p-4">
      <div class="flex items-start justify-between gap-3">
        <div class="space-y-1">
          <div class="flex items-center gap-2">
            <h3 class="text-sm font-semibold text-gray-100">${agent.name || agent.id}</h3>
            ${agent.default
              ? html`<${Badge} tone="cyan">Default</${Badge}>`
              : null}
          </div>
          <p class="text-xs text-gray-400 font-mono">${agent.id}</p>
          ${agent.workspace
            ? html`
                <button
                  type="button"
                  class="text-xs font-mono break-all text-left ac-tip-link hover:underline"
                  onclick=${() => onOpenWorkspace(agent.workspace)}
                >
                  ${agent.workspace}
                </button>
              `
            : null}
        </div>
        <div class="flex items-center gap-2">
          <${ActionButton}
            onClick=${() => onEdit(agent)}
            disabled=${saving}
            loading=${false}
            tone="secondary"
            size="sm"
            idleLabel="Edit"
            className="text-xs"
          />
          ${!agent.default
            ? html`
                <${ActionButton}
                  onClick=${() => onSetDefault(agent.id)}
                  disabled=${saving}
                  loading=${false}
                  tone="secondary"
                  size="sm"
                  idleLabel="Set default"
                  className="text-xs"
                />
              `
            : null}
          ${!isMain
            ? html`
                <${ActionButton}
                  onClick=${() => onDelete(agent.id)}
                  disabled=${saving}
                  loading=${false}
                  tone="danger"
                  size="sm"
                  idleLabel="Delete"
                  className="text-xs"
                />
              `
            : null}
        </div>
      </div>
    </div>
  `;
};
