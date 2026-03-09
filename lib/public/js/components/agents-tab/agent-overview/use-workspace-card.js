import { useEffect, useState } from "https://esm.sh/preact/hooks";
import { fetchAgentWorkspaceSize } from "../../../lib/api.js";

export const useWorkspaceCard = ({ agent = {} }) => {
  const [workspaceSizeBytes, setWorkspaceSizeBytes] = useState(null);
  const [workspaceSizeExists, setWorkspaceSizeExists] = useState(true);
  const [loadingWorkspaceSize, setLoadingWorkspaceSize] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const agentId = String(agent?.id || "").trim();
    const workspacePath = String(agent?.workspace || "").trim();
    if (!agentId || !workspacePath) {
      setWorkspaceSizeBytes(null);
      setWorkspaceSizeExists(true);
      setLoadingWorkspaceSize(false);
      return undefined;
    }
    setLoadingWorkspaceSize(true);
    fetchAgentWorkspaceSize(agentId)
      .then((result) => {
        if (cancelled) return;
        setWorkspaceSizeBytes(Number(result?.sizeBytes || 0));
        setWorkspaceSizeExists(result?.exists !== false);
      })
      .catch(() => {
        if (cancelled) return;
        setWorkspaceSizeBytes(null);
        setWorkspaceSizeExists(false);
      })
      .finally(() => {
        if (cancelled) return;
        setLoadingWorkspaceSize(false);
      });
    return () => {
      cancelled = true;
    };
  }, [agent?.id, agent?.workspace]);

  return {
    loadingWorkspaceSize,
    workspaceSizeBytes,
    workspaceSizeExists,
  };
};
