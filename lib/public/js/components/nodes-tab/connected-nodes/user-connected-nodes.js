import { usePolling } from "../../../hooks/usePolling.js";
import { fetchNodesStatus } from "../../../lib/api.js";

const kNodesPollIntervalMs = 3000;

export const useConnectedNodes = ({ enabled = true } = {}) => {
  const poll = usePolling(
    async () => {
      const result = await fetchNodesStatus();
      const nodes = Array.isArray(result?.nodes) ? result.nodes : [];
      const pending = Array.isArray(result?.pending) ? result.pending : [];
      return { nodes, pending };
    },
    kNodesPollIntervalMs,
    { enabled },
  );

  return {
    nodes: Array.isArray(poll.data?.nodes) ? poll.data.nodes : [],
    pending: Array.isArray(poll.data?.pending) ? poll.data.pending : [],
    loading: poll.data === null && !poll.error,
    error: poll.error ? String(poll.error.message || "Could not load nodes") : "",
    refresh: poll.refresh,
  };
};
