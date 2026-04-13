import { useCallback, useEffect, useState } from "preact/hooks";
import { fetchNodeConnectInfo } from "../../lib/api.js";
import { useCachedFetch } from "../../hooks/use-cached-fetch.js";
import { showToast } from "../toast.js";
import { useConnectedNodes } from "./connected-nodes/user-connected-nodes.js";

export const useNodesTab = () => {
  const connectedNodesState = useConnectedNodes({ enabled: true });
  const [wizardVisible, setWizardVisible] = useState(false);
  const [refreshingNodes, setRefreshingNodes] = useState(false);
  const {
    data: connectInfo,
    error: connectInfoError,
  } = useCachedFetch("/api/nodes/connect-info", fetchNodeConnectInfo, {
    maxAgeMs: 60000,
  });
  const pairedNodes = Array.isArray(connectedNodesState.nodes)
    ? connectedNodesState.nodes.filter((entry) => entry?.paired !== false)
    : [];

  useEffect(() => {
    if (!connectInfoError) return;
    showToast(
      connectInfoError.message || "Could not load node connect command",
      "error",
    );
  }, [connectInfoError]);

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
