import { h } from "https://esm.sh/preact";
import htm from "https://esm.sh/htm";
import { PageHeader } from "../page-header.js";
import { ActionButton } from "../action-button.js";
import { useNodesTab } from "./use-nodes-tab.js";
import { ConnectedNodesCard } from "./connected-nodes/index.js";
import { NodesSetupWizard } from "./setup-wizard/index.js";

const html = htm.bind(h);

export const NodesTab = ({ onRestartRequired = () => {} }) => {
  const { state, actions } = useNodesTab();

  return html`
    <div class="space-y-4">
      <${PageHeader}
        title="Nodes"
        actions=${html`
          <${ActionButton}
            onClick=${actions.openWizard}
            idleLabel="Connect Node"
            tone="primary"
            size="sm"
          />
        `}
      />

      <${ConnectedNodesCard}
        nodes=${state.nodes}
        pending=${state.pending}
        loading=${state.loadingNodes}
        error=${state.nodesError}
        onRefresh=${actions.refreshNodes}
      />

      <${NodesSetupWizard}
        visible=${state.wizardVisible}
        nodes=${state.nodes}
        pending=${state.pending}
        refreshNodes=${actions.refreshNodes}
        onRestartRequired=${onRestartRequired}
        onClose=${actions.closeWizard}
      />
    </div>
  `;
};
