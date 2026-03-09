import { h } from "https://esm.sh/preact";
import { useState } from "https://esm.sh/preact/hooks";
import htm from "https://esm.sh/htm";
import { ActionButton } from "../action-button.js";
import { Badge } from "../badge.js";
import { AgentOverview } from "./agent-overview.js";
import { Models } from "../models-tab/index.js";

const html = htm.bind(h);

const kSubTabs = [
  { id: "overview", label: "Overview" },
  { id: "models", label: "Models" },
];

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
  const [activeTab, setActiveTab] = useState("overview");

  if (!agent) {
    return html`
      <div class="agents-detail-panel">
        <div class="agents-empty-state">
          <span class="text-sm">Select an agent to view details</span>
        </div>
      </div>
    `;
  }

  const isMain = String(agent.id || "") === "main";

  return html`
    <div class="agents-detail-panel">
      <div class="agents-detail-inner">
        <div class="agents-detail-header">
          <div class="flex items-center gap-3 min-w-0">
            <span class="agents-detail-header-title">
              ${agent.name || agent.id}
            </span>
            ${agent.default
              ? html`<${Badge} tone="cyan">Default</${Badge}>`
              : null}
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <${ActionButton}
              onClick=${() => onEdit(agent)}
              disabled=${saving}
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
                    onClick=${() => onDelete(agent)}
                    disabled=${saving}
                    tone="danger"
                    size="sm"
                    idleLabel="Delete"
                    className="text-xs"
                  />
                `
              : null}
          </div>
        </div>

        <div class="agents-sub-tabs">
          ${kSubTabs.map(
            (tab) => html`
              <button
                key=${tab.id}
                type="button"
                class=${`agents-sub-tab ${activeTab === tab.id ? "active" : ""}`}
                onclick=${() => setActiveTab(tab.id)}
              >
                ${tab.label}
              </button>
            `,
          )}
        </div>

        <div class="agents-detail-content">
          ${activeTab === "overview"
            ? html`
                <${AgentOverview}
                  agent=${agent}
                  agents=${agents}
                  saving=${saving}
                  onUpdateAgent=${onUpdateAgent}
                  onSetLocation=${onSetLocation}
                  onOpenWorkspace=${onOpenWorkspace}
                  onSwitchToModels=${() => setActiveTab("models")}
                />
              `
            : null}
          ${activeTab === "models"
            ? html`<${Models} agentId=${agent.id} embedded=${true} />`
            : null}
        </div>
      </div>
    </div>
  `;
};
