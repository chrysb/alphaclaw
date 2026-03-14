import { useCallback, useEffect, useMemo, useState } from "https://esm.sh/preact/hooks";
import {
  approveNode,
  fetchNodeConnectInfo,
  saveNodeExecConfig,
} from "../../../lib/api.js";
import { showToast } from "../../toast.js";

export const useSetupWizard = ({
  visible = false,
  nodes = [],
  pending = [],
  refreshNodes = async () => {},
  onRestartRequired = () => {},
  onClose = () => {},
} = {}) => {
  const [step, setStep] = useState(0);
  const [connectInfo, setConnectInfo] = useState(null);
  const [loadingConnectInfo, setLoadingConnectInfo] = useState(false);
  const [displayName, setDisplayName] = useState("My Mac Node");
  const [selectedNodeId, setSelectedNodeId] = useState("");
  const [approvingNodeId, setApprovingNodeId] = useState("");
  const [configuring, setConfiguring] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setStep(0);
    setSelectedNodeId("");
    setApprovingNodeId("");
    setConfiguring(false);
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    setLoadingConnectInfo(true);
    fetchNodeConnectInfo()
      .then((result) => {
        setConnectInfo(result || null);
      })
      .catch((err) => {
        showToast(err.message || "Could not load node connect command", "error");
      })
      .finally(() => {
        setLoadingConnectInfo(false);
      });
  }, [visible]);

  const selectableNodes = useMemo(() => {
    const all = [...pending, ...nodes];
    const seen = new Set();
    const unique = [];
    for (const entry of all) {
      const nodeId = String(entry?.nodeId || entry?.id || "").trim();
      if (!nodeId || seen.has(nodeId)) continue;
      seen.add(nodeId);
      unique.push({
        nodeId,
        displayName: String(entry?.displayName || entry?.name || nodeId),
        paired: entry?.paired !== false,
        connected: entry?.connected === true,
      });
    }
    return unique;
  }, [nodes, pending]);

  const selectedNode = useMemo(
    () =>
      selectableNodes.find(
        (entry) => entry.nodeId === String(selectedNodeId || "").trim(),
      ) || null,
    [selectableNodes, selectedNodeId],
  );

  const connectCommand = useMemo(() => {
    if (!connectInfo) return "";
    const host = String(connectInfo.gatewayHost || "").trim() || "localhost";
    const port = Number(connectInfo.gatewayPort) || 3000;
    const token = String(connectInfo.gatewayToken || "").trim();
    const tls = connectInfo.tls === true ? " --tls" : "";
    const escapedDisplayName = String(displayName || "")
      .trim()
      .replace(/"/g, '\\"');
    return [
      token ? `OPENCLAW_GATEWAY_TOKEN=${token}` : "",
      "openclaw node run",
      `--host ${host}`,
      `--port ${port}`,
      tls.trim(),
      escapedDisplayName ? `--display-name "${escapedDisplayName}"` : "",
    ]
      .filter(Boolean)
      .join(" ");
  }, [connectInfo, displayName]);

  const refreshNodeList = useCallback(async () => {
    await refreshNodes();
  }, [refreshNodes]);

  const approveSelectedNode = useCallback(async () => {
    const nodeId = String(selectedNodeId || "").trim();
    if (!nodeId || approvingNodeId) return;
    setApprovingNodeId(nodeId);
    try {
      await approveNode(nodeId);
      showToast("Node approved", "success");
      await refreshNodes();
    } catch (err) {
      showToast(err.message || "Could not approve node", "error");
    } finally {
      setApprovingNodeId("");
    }
  }, [approvingNodeId, refreshNodes, selectedNodeId]);

  const applyGatewayNodeRouting = useCallback(async () => {
    const nodeId = String(selectedNodeId || "").trim();
    if (!nodeId || configuring) return false;
    setConfiguring(true);
    try {
      await saveNodeExecConfig({
        host: "node",
        security: "allowlist",
        ask: "on-miss",
        node: nodeId,
      });
      onRestartRequired(true);
      showToast("Gateway routing now points to the selected node", "success");
      return true;
    } catch (err) {
      showToast(err.message || "Could not configure gateway node routing", "error");
      return false;
    } finally {
      setConfiguring(false);
    }
  }, [configuring, onRestartRequired, selectedNodeId]);

  const completeWizard = useCallback(() => {
    onClose();
  }, [onClose]);

  return {
    step,
    setStep,
    connectInfo,
    loadingConnectInfo,
    displayName,
    setDisplayName,
    selectedNodeId,
    setSelectedNodeId,
    selectedNode,
    selectableNodes,
    approvingNodeId,
    configuring,
    connectCommand,
    refreshNodeList,
    approveSelectedNode,
    applyGatewayNodeRouting,
    completeWizard,
  };
};
