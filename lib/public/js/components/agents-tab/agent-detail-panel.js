import { h } from "https://esm.sh/preact";
import { useState, useCallback } from "https://esm.sh/preact/hooks";
import htm from "https://esm.sh/htm";
import { ActionButton } from "../action-button.js";
import { Badge } from "../badge.js";
import { PopActions } from "../pop-actions.js";
import { AgentOverview } from "./agent-overview/index.js";
import { AgentToolsPanel } from "./agent-tools/index.js";
import { useAgentTools } from "./agent-tools/use-agent-tools.js";

const html = htm.bind(h);

const kDetailTabs = [
  { label: "Overview", value: "overview" },
  { label: "Tools", value: "tools" },
];

const kPillBase =
  "inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-medium transition-colors";
const kPillActive =
  "border-cyan-500/40 bg-cyan-500/10 text-cyan-200 shadow-[0_0_0_1px_rgba(34,211,238,0.08)]";
const kPillInactive =
  "border-border bg-black/20 text-gray-500 hover:border-gray-500 hover:text-gray-300";

const PencilIcon = ({ className = "w-3.5 h-3.5" }) => html`
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    class=${className}
  >
    <path
      d="M15.7279 9.57627L14.3137 8.16206L5 17.4758V18.89H6.41421L15.7279 9.57627ZM17.1421 8.16206L18.5563 6.74785L17.1421 5.33363L15.7279 6.74785L17.1421 8.16206ZM7.24264 20.89H3V16.6473L16.435 3.21231C16.8256 2.82179 17.4587 2.82179 17.8492 3.21231L20.6777 6.04074C21.0682 6.43126 21.0682 7.06443 20.6777 7.45495L7.24264 20.89Z"
    />
  </svg>
`;

export const AgentDetailPanel = ({
  agent = null,
  agents = [],
  activeTab = "overview",
  saving = false,
  onUpdateAgent = async () => {},
  onSetLocation = () => {},
  onSelectTab = () => {},
  onEdit = () => {},
  onDelete = () => {},
  onSetDefault = () => {},
  onOpenWorkspace = () => {},
}) => {
  const tools = useAgentTools({ agent: agent || {} });
  const [savingTools, setSavingTools] = useState(false);

  const handleSaveTools = useCallback(async () => {
    if (!agent) return;
    setSavingTools(true);
    try {
      const nextAgent = await onUpdateAgent(
        agent.id,
        { tools: tools.toolsConfig },
        "Tool access updated",
      );
      tools.markSaved(nextAgent?.tools || tools.toolsConfig);
    } catch {
      // toast handled by parent
    } finally {
      setSavingTools(false);
    }
  }, [agent, tools.toolsConfig, tools.markSaved, onUpdateAgent]);

  const isSaving = saving || savingTools;

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
            <div class="flex items-center gap-2 min-w-0">
              <span class="agents-detail-header-title">
                ${agent.name || agent.id}
              </span>
              <button
                type="button"
                class="text-gray-500 hover:text-gray-300 transition-colors p-0.5 -ml-0.5"
                onclick=${() => onEdit(agent)}
                title="Edit agent name"
              >
                <${PencilIcon} />
              </button>
              ${agent.default
                ? html`<${Badge} tone="cyan">Default</${Badge}>`
                : null}
            </div>
            <div class="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1 min-w-0 text-xs text-gray-500">
              <span class="font-mono">${agent.id}</span>
            </div>
          </div>
          <${PopActions} visible=${tools.dirty}>
            <${ActionButton}
              onClick=${tools.reset}
              disabled=${isSaving}
              tone="secondary"
              size="sm"
              idleLabel="Cancel"
              className="text-xs"
            />
            <${ActionButton}
              onClick=${handleSaveTools}
              disabled=${isSaving}
              loading=${isSaving}
              loadingMode="inline"
              tone="primary"
              size="sm"
              idleLabel="Save changes"
              loadingLabel="Saving…"
              className="text-xs"
            />
          </${PopActions}>
        </div>
        <div class="flex items-center gap-2 pt-6">
          ${kDetailTabs.map(
            (tab) => html`
              <button
                key=${tab.value}
                type="button"
                class=${`${kPillBase} ${activeTab === tab.value ? kPillActive : kPillInactive}`}
                onclick=${() => onSelectTab(tab.value)}
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
                  onSwitchToModels=${() => onSetLocation("/models")}
                  onSetDefault=${onSetDefault}
                  onDelete=${onDelete}
                />
              `
            : html`
                <${AgentToolsPanel}
                  agent=${agent}
                  tools=${tools}
                />
              `}
        </div>
      </div>
    </div>
  `;
};
