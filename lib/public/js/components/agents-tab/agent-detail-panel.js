import { h } from "https://esm.sh/preact";
import htm from "https://esm.sh/htm";
import { ActionButton } from "../action-button.js";
import { Badge } from "../badge.js";
import { AgentOverview } from "./agent-overview/index.js";

const html = htm.bind(h);

export const AgentDetailPanel = ({
  agent = null,
  agents = [],
  saving = false,
  onUpdateAgent = async () => {},
  onSetLocation = () => {},
  onEdit = () => {},
  onDelete = () => {},
  onSetDefault = () => {},
  onOpenWorkspace = () => {},
}) => {
  if (!agent) {
    return html`
      <div class="agents-detail-panel">
        <div class="agents-empty-state">
          <span class="text-sm">Select an agent to view details</span>
        </div>
      </div>
    `;
  }

  return html`
    <div class="agents-detail-panel">
      <div class="agents-detail-inner">
        <div class="agents-detail-header">
          <div class="min-w-0">
            <div class="flex items-center gap-3 min-w-0">
              <span class="agents-detail-header-title">
                ${agent.name || agent.id}
              </span>
              ${agent.default
                ? html`<${Badge} tone="cyan">Default</${Badge}>`
                : null}
            </div>
            <div class="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1 min-w-0 text-xs text-gray-500">
              <span class="font-mono">${agent.id}</span>
            </div>
          </div>
          <div class="flex items-start gap-2 shrink-0">
            <${ActionButton}
              onClick=${() => onEdit(agent)}
              disabled=${saving}
              tone="secondary"
              size="sm"
              idleLabel="Edit"
              className="text-xs"
            />
          </div>
        </div>
        <div class="agents-detail-content">
          <${AgentOverview}
            agent=${agent}
            agents=${agents}
            saving=${saving}
            onUpdateAgent=${onUpdateAgent}
            onSetLocation=${onSetLocation}
            onOpenWorkspace=${onOpenWorkspace}
            onSwitchToModels=${() => onSetLocation("/models")}
            onSetDefault=${onSetDefault}
            onDelete=${onDelete}
          />
        </div>
      </div>
    </div>
  `;
};
