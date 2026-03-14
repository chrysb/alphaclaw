import { useEffect, useState } from "https://esm.sh/preact/hooks";
import { fetchNodeConnectInfo } from "../../lib/api.js";
import { showToast } from "../toast.js";
import { useConnectedNodes } from "./connected-nodes/user-connected-nodes.js";

export const useNodesTab = () => {
  const connectedNodesState = useConnectedNodes({ enabled: true });
  const [wizardVisible, setWizardVisible] = useState(false);
  const [connectInfo, setConnectInfo] = useState(null);

  useEffect(() => {
    fetchNodeConnectInfo()
      .then((result) => {
        setConnectInfo(result || null);
      })
      .catch((error) => {
        showToast(error.message || "Could not load node connect command", "error");
      });
  }, []);

  return {
    state: {
      wizardVisible,
      nodes: connectedNodesState.nodes,
      pending: connectedNodesState.pending,
      loadingNodes: connectedNodesState.loading,
      nodesError: connectedNodesState.error,
      connectInfo,
    },
    actions: {
      openWizard: () => setWizardVisible(true),
      closeWizard: () => setWizardVisible(false),
      refreshNodes: connectedNodesState.refresh,
    },
  };
};
