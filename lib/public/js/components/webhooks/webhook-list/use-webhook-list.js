import { useCallback } from "https://esm.sh/preact/hooks";
import { usePolling } from "../../../hooks/usePolling.js";
import { fetchWebhooks } from "../../../lib/api.js";

export const useWebhookList = ({
  onSelectHook = () => {},
}) => {
  const listPoll = usePolling(fetchWebhooks, 15000);

  const webhooks = listPoll.data?.webhooks || [];
  const isListLoading = !listPoll.data && !listPoll.error;

  const handleSelectHook = useCallback(
    (name) => {
      onSelectHook(name);
    },
    [onSelectHook],
  );

  return {
    state: {
      webhooks,
      isListLoading,
    },
    actions: {
      refreshList: listPoll.refresh,
      handleSelectHook,
    },
  };
};
