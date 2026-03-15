import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "https://esm.sh/preact/hooks";
import {
  approveDevice,
  fetchDevicePairings,
  fetchNodeConnectInfo,
  rejectDevice,
  routeExecToNode,
} from "../../../lib/api.js";
import { showToast } from "../../toast.js";

const kNodeDiscoveryPollIntervalMs = 3000;

export const useSetupWizard = ({
  visible = false,
  nodes = [],
  refreshNodes = async () => {},
  onRestartRequired = () => {},
  onClose = () => {},
} = {}) => {
  const [step, setStep] = useState(0);
  const [connectInfo, setConnectInfo] = useState(null);
  const [loadingConnectInfo, setLoadingConnectInfo] = useState(false);
  const [displayName, setDisplayName] = useState("My Mac Node");
  const [selectedNodeId, setSelectedNodeId] = useState("");
  const [configuring, setConfiguring] = useState(false);
  const [devicePending, setDevicePending] = useState([]);
  const [approvedInSession, setApprovedInSession] = useState(false);
  const refreshInFlightRef = useRef(false);

  useEffect(() => {
    if (!visible) return;
    setStep(0);
    setSelectedNodeId("");
    setConfiguring(false);
    setApprovedInSession(false);
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

  const pairedNodes = useMemo(() => {
    const seen = new Set();
    const unique = [];
    for (const entry of nodes) {
      const nodeId = String(entry?.nodeId || "").trim();
      if (!nodeId || seen.has(nodeId)) continue;
      if (entry?.paired === false) continue;
      seen.add(nodeId);
      unique.push({
        nodeId,
        displayName: String(entry?.displayName || entry?.name || nodeId),
        connected: entry?.connected === true,
      });
    }
    return unique;
  }, [nodes]);

  const selectedPairedNode = useMemo(
    () =>
      pairedNodes.find(
        (entry) => entry.nodeId === String(selectedNodeId || "").trim(),
      ) || null,
    [pairedNodes, selectedNodeId],
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
    if (refreshInFlightRef.current) return;
    refreshInFlightRef.current = true;
    try {
      await refreshNodes();
      const deviceData = await fetchDevicePairings();
      const pendingList = Array.isArray(deviceData?.pending)
        ? deviceData.pending
        : [];
      setDevicePending(pendingList);
    } finally {
      refreshInFlightRef.current = false;
    }
  }, [refreshNodes]);

  useEffect(() => {
    if (!visible || step !== 1) return;
    let active = true;
    const poll = async () => {
      if (!active) return;
      try {
        await refreshNodeList();
      } catch {}
    };
    poll();
    const timer = setInterval(poll, kNodeDiscoveryPollIntervalMs);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [refreshNodeList, step, visible]);

  useEffect(() => {
    if (!visible || step !== 1) return;
    const hasSelected = pairedNodes.some(
      (entry) => entry.nodeId === String(selectedNodeId || "").trim(),
    );
    const normalizedDisplayName = String(displayName || "").trim().toLowerCase();
    const preferredNode =
      pairedNodes.find(
        (entry) =>
          String(entry?.displayName || "")
            .trim()
            .toLowerCase() === normalizedDisplayName,
      ) || pairedNodes[0];
    if (!preferredNode) return;
    if (hasSelected && String(selectedNodeId || "").trim() === preferredNode.nodeId) return;
    setSelectedNodeId(preferredNode.nodeId);
  }, [displayName, pairedNodes, selectedNodeId, step, visible]);

  const handleDeviceApprove = useCallback(async (requestId) => {
    try {
      await approveDevice(requestId);
      showToast("Pairing approved", "success");
      setApprovedInSession(true);
      await refreshNodeList();
    } catch (err) {
      showToast(err.message || "Could not approve pairing", "error");
    }
  }, [refreshNodeList]);

  const handleDeviceReject = useCallback(async (requestId) => {
    try {
      await rejectDevice(requestId);
      showToast("Pairing rejected", "info");
      await refreshNodeList();
    } catch (err) {
      showToast(err.message || "Could not reject pairing", "error");
    }
  }, [refreshNodeList]);

  const applyGatewayNodeRouting = useCallback(async () => {
    const nodeId = String(selectedNodeId || "").trim();
    if (!nodeId || configuring) return false;
    setConfiguring(true);
    try {
      await routeExecToNode(nodeId);
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
    pairedNodes,
    selectedPairedNode,
    devicePending,
    approvedInSession,
    configuring,
    canFinish: approvedInSession && Boolean(selectedPairedNode?.connected),
    connectCommand,
    refreshNodeList,
    nodeDiscoveryPollIntervalMs: kNodeDiscoveryPollIntervalMs,
    handleDeviceApprove,
    handleDeviceReject,
    applyGatewayNodeRouting,
    completeWizard,
  };
};
