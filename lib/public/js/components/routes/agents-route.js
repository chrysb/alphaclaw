import { h } from "https://esm.sh/preact";
import htm from "https://esm.sh/htm";
import { AgentsTab } from "../agents-tab/index.js";

const html = htm.bind(h);

export const AgentsRoute = ({
  agents = [],
  loading = false,
  saving = false,
  agentsActions = {},
  selectedAgentId = "",
  activeTab = "overview",
  onSelectAgent = () => {},
  onSelectTab = () => {},
  onNavigateToBrowseFile = () => {},
  onSetLocation = () => {},
}) => html`
  <${AgentsTab}
    agents=${agents}
    loading=${loading}
    saving=${saving}
    agentsActions=${agentsActions}
    selectedAgentId=${selectedAgentId}
    activeTab=${activeTab}
    onSelectAgent=${onSelectAgent}
    onSelectTab=${onSelectTab}
    onNavigateToBrowseFile=${onNavigateToBrowseFile}
    onSetLocation=${onSetLocation}
  />
`;
