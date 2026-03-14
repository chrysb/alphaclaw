import { useEffect } from "https://esm.sh/preact/hooks";
import { usePolling } from "../../../hooks/usePolling.js";
import { fetchWatchdogEvents } from "../../../lib/api.js";

export const useWatchdogIncidents = ({
  restartSignal = 0,
  onRefreshStatuses = () => {},
} = {}) => {
  const eventsPoll = usePolling(() => fetchWatchdogEvents(20), 15000);

  useEffect(() => {
    if (!restartSignal) return;
    onRefreshStatuses();
    eventsPoll.refresh();
    const t1 = setTimeout(() => {
      onRefreshStatuses();
      eventsPoll.refresh();
    }, 1200);
    const t2 = setTimeout(() => {
      onRefreshStatuses();
      eventsPoll.refresh();
    }, 3500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [restartSignal, onRefreshStatuses, eventsPoll.refresh]);

  return {
    events: eventsPoll.data?.events || [],
    refreshEvents: eventsPoll.refresh,
  };
};
