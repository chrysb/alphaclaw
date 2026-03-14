import { useState } from "https://esm.sh/preact/hooks";
import { useConnectedNodes } from "./connected-nodes/user-connected-nodes.js";

export const useNodesTab = () => {
  const connectedNodesState = useConnectedNodes({ enabled: true });
  const [wizardVisible, setWizardVisible] = useState(false);

  return {
    state: {
      wizardVisible,
      nodes: connectedNodesState.nodes,
      pending: connectedNodesState.pending,
      loadingNodes: connectedNodesState.loading,
      nodesError: connectedNodesState.error,
    },
    actions: {
      openWizard: () => setWizardVisible(true),
      closeWizard: () => setWizardVisible(false),
      refreshNodes: connectedNodesState.refresh,
    },
  };
};
