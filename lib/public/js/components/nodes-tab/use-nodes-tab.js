import { useCallback, useEffect, useState } from "https://esm.sh/preact/hooks";
import { fetchNodeConnectInfo } from "../../lib/api.js";
import { showToast } from "../toast.js";
import { useConnectedNodes } from "./connected-nodes/user-connected-nodes.js";

export const useNodesTab = () => {
  const connectedNodesState = useConnectedNodes({ enabled: true });
  const [wizardVisible, setWizardVisible] = useState(false);
  const [connectInfo, setConnectInfo] = useState(null);
  const [refreshingNodes, setRefreshingNodes] = useState(false);
  const pairedNodes = Array.isArray(connectedNodesState.nodes)
    ? connectedNodesState.nodes.filter((entry) => entry?.paired !== false)
    : [];

  useEffect(() => {
    fetchNodeConnectInfo()
      .then((result) => {
        setConnectInfo(result || null);
      })
      .catch((error) => {
        showToast(error.message || "Could not load node connect command", "error");
      });
  }, []);

  const refreshNodes = useCallback(async () => {
    if (refreshingNodes) return;
    setRefreshingNodes(true);
    try {
      await connectedNodesState.refresh();
    } finally {
      setRefreshingNodes(false);
    }
  }, [connectedNodesState.refresh, refreshingNodes]);

  return {
    state: {
      wizardVisible,
      nodes: pairedNodes,
      pending: connectedNodesState.pending,
      loadingNodes: connectedNodesState.loading,
      refreshingNodes,
      nodesError: connectedNodesState.error,
      connectInfo,
    },
    actions: {
      openWizard: () => setWizardVisible(true),
      closeWizard: () => setWizardVisible(false),
      refreshNodes,
    },
  };
};
