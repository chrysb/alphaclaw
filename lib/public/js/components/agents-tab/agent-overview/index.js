import { h } from "https://esm.sh/preact";
import htm from "https://esm.sh/htm";
import { ChannelOperationsPanel } from "../../channel-operations-panel.js";
import { ManageCard } from "./manage-card.js";
import { AgentModelCard } from "./model-card.js";
import { AgentToolsCard } from "./tools-card.js";
import { WorkspaceCard } from "./workspace-card.js";

const html = htm.bind(h);

export const AgentOverview = ({
  agent = {},
  agents = [],
  saving = false,
  toolsSummary = {},
  onUpdateAgent = async () => {},
  onSetLocation = () => {},
  onOpenWorkspace = () => {},
  onSwitchToModels = () => {},
  onSwitchToTools = () => {},
  onSetDefault = () => {},
  onDelete = () => {},
}) => {
  const isMain = String(agent.id || "") === "main";
  const showManageSection = !agent.default || !isMain;

  return html`
    <div class="space-y-4">
      <${WorkspaceCard}
        agent=${agent}
        onOpenWorkspace=${onOpenWorkspace}
      />
      <${AgentModelCard}
        agent=${agent}
        saving=${saving}
        onUpdateAgent=${onUpdateAgent}
        onSwitchToModels=${onSwitchToModels}
      />
      <${AgentToolsCard}
        profile=${toolsSummary.profile || "full"}
        enabledCount=${toolsSummary.enabledCount || 0}
        totalCount=${toolsSummary.totalCount || 0}
        onSwitchToTools=${onSwitchToTools}
      />
      <${ChannelOperationsPanel}
        agent=${agent}
        agents=${agents}
        onSetLocation=${onSetLocation}
      />
      ${showManageSection
        ? html`
            <${ManageCard}
              agent=${agent}
              saving=${saving}
              onSetDefault=${onSetDefault}
              onDelete=${onDelete}
            />
          `
        : null}
    </div>
  `;
};
