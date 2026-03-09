import { h } from "https://esm.sh/preact";
import htm from "https://esm.sh/htm";
import { ActionButton } from "../action-button.js";
import { AgentBindingsSection } from "./agent-bindings-section.js";
import { AgentPairingSection } from "./agent-pairing-section.js";

const html = htm.bind(h);

const kPropertyRowClass =
  "flex items-start justify-between gap-4 py-2.5 border-b border-border last:border-b-0";
const kLabelClass = "text-xs text-gray-400 shrink-0 w-28";
const kValueClass = "text-sm text-gray-200 text-right min-w-0 break-all";

const resolveModelDisplay = (model) => {
  if (!model) return null;
  if (typeof model === "string") return model;
  return model.primary || null;
};

export const AgentOverview = ({
  agent = {},
  agents = [],
  saving = false,
  onSetLocation = () => {},
  onOpenWorkspace = () => {},
  onSwitchToModels = () => {},
  onSetDefault = () => {},
  onDelete = () => {},
}) => {
  const modelDisplay = resolveModelDisplay(agent.model);
  const isMain = String(agent.id || "") === "main";

  return html`
    <div class="space-y-4">
      <div class="bg-surface border border-border rounded-xl p-4">
        <h3 class="card-label mb-3">Properties</h3>
        <div class="divide-y divide-border">
          <div class=${kPropertyRowClass}>
            <span class=${kLabelClass}>Agent ID</span>
            <span class="${kValueClass} font-mono">${agent.id}</span>
          </div>

          <div class=${kPropertyRowClass}>
            <span class=${kLabelClass}>Display Name</span>
            <span class=${kValueClass}>${agent.name || agent.id}</span>
          </div>

          <div class=${kPropertyRowClass}>
            <span class=${kLabelClass}>Workspace</span>
            <div class="text-right min-w-0">
              ${agent.workspace
                ? html`
                    <button
                      type="button"
                      class="text-sm font-mono break-all text-right ac-tip-link hover:underline"
                      onclick=${() => onOpenWorkspace(agent.workspace)}
                    >
                      ${agent.workspace}
                    </button>
                  `
                : html`<span class="text-sm text-gray-500">—</span>`}
            </div>
          </div>

          <div class=${kPropertyRowClass}>
            <span class=${kLabelClass}>Primary Model</span>
            <div class="text-right min-w-0">
              ${modelDisplay
                ? html`
                    <button
                      type="button"
                      class="text-sm font-mono break-all text-right ac-tip-link hover:underline"
                      onclick=${onSwitchToModels}
                    >
                      ${modelDisplay}
                    </button>
                  `
                : html`
                    <button
                      type="button"
                      class="text-sm text-gray-500 hover:text-gray-300"
                      onclick=${onSwitchToModels}
                    >
                      Inherited from defaults
                    </button>
                  `}
            </div>
          </div>

          <div class=${kPropertyRowClass}>
            <span class=${kLabelClass}>Default</span>
            <span class=${kValueClass}>
              ${agent.default ? "Yes" : "No"}
            </span>
          </div>
        </div>
      </div>

      <${AgentBindingsSection}
        agent=${agent}
        agents=${agents}
        onSetLocation=${onSetLocation}
      />
      <div class="bg-surface border border-border rounded-xl p-4">
        <h3 class="card-label mb-3">Manage</h3>
        <div class="flex flex-wrap items-center gap-2">
          ${!agent.default
            ? html`
                <${ActionButton}
                  onClick=${() => onSetDefault(agent.id)}
                  disabled=${saving}
                  tone="secondary"
                  size="sm"
                  idleLabel="Set default"
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
                  idleLabel="Delete agent"
                />
              `
            : null}
        </div>
      </div>
      <${AgentPairingSection} agent=${agent} />
    </div>
  `;
};
