import { useState } from "https://esm.sh/preact/hooks";
import { usePolling } from "../../../hooks/usePolling.js";
import { fetchWatchdogResources } from "../../../lib/api.js";

export const useWatchdogResources = () => {
  const resourcesPoll = usePolling(() => fetchWatchdogResources(), 5000);
  const [memoryExpanded, setMemoryExpanded] = useState(false);
  return {
    resources: resourcesPoll.data?.resources || null,
    memoryExpanded,
    setMemoryExpanded,
  };
};
