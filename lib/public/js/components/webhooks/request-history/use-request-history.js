import { useCallback, useMemo, useState } from "https://esm.sh/preact/hooks";
import {
  fetchWebhookRequest,
  fetchWebhookRequests,
} from "../../../lib/api.js";
import { usePolling } from "../../../hooks/usePolling.js";
import { showToast } from "../../toast.js";

export const useRequestHistory = ({
  selectedHookName = "",
  effectiveAuthMode = "headers",
  webhookUrl = "",
  webhookUrlWithQueryToken = "",
  bearerTokenValue = "",
}) => {
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedRows, setExpandedRows] = useState(() => new Set());
  const [replayingRequestId, setReplayingRequestId] = useState(null);
  const [debugLoadingRequestId, setDebugLoadingRequestId] = useState(null);
  const [debugRequest, setDebugRequest] = useState(null);

  const requestsPoll = usePolling(
    async () => {
      if (!selectedHookName) return { requests: [] };
      const data = await fetchWebhookRequests(selectedHookName, {
        limit: 25,
        offset: 0,
        status: statusFilter,
      });
      return data;
    },
    5000,
    { enabled: !!selectedHookName },
  );

  const requests = requestsPoll.data?.requests || [];

  const handleRequestRowToggle = useCallback((id, isOpen) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (isOpen) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const handleSetStatusFilter = useCallback(
    (filter) => {
      setStatusFilter(filter);
      setExpandedRows(new Set());
      setTimeout(() => requestsPoll.refresh(), 0);
    },
    [requestsPoll.refresh],
  );

  const resetState = useCallback(() => {
    setStatusFilter("all");
    setExpandedRows(new Set());
    setDebugRequest(null);
    setDebugLoadingRequestId(null);
    setReplayingRequestId(null);
  }, []);

  const handleCopyRequestField = useCallback(async (value, label) => {
    try {
      await navigator.clipboard.writeText(String(value || ""));
      showToast(`${label} copied`, "success");
    } catch {
      showToast(
        `Could not copy ${String(label || "value").toLowerCase()}`,
        "error",
      );
    }
  }, []);

  const requestUrl = useMemo(() => {
    return effectiveAuthMode === "query" ? webhookUrlWithQueryToken : webhookUrl;
  }, [effectiveAuthMode, webhookUrl, webhookUrlWithQueryToken]);

  const requestHeaders = useMemo(() => {
    const headers = { "Content-Type": "application/json" };
    if (effectiveAuthMode === "headers") {
      headers.Authorization = bearerTokenValue;
    }
    return headers;
  }, [bearerTokenValue, effectiveAuthMode]);

  const handleReplayRequest = useCallback(
    async (item) => {
      if (!item || replayingRequestId === item.id) return;
      if (item.payloadTruncated) {
        showToast("Cannot replay a truncated payload", "warning");
        return;
      }
      setReplayingRequestId(item.id);
      try {
        const response = await fetch(requestUrl, {
          method: "POST",
          headers: requestHeaders,
          body: String(item.payload || ""),
        });
        const bodyText = await response.text();
        let body = null;
        try {
          body = bodyText ? JSON.parse(bodyText) : null;
        } catch {
          body = null;
        }
        const errorMessage =
          body?.ok === false
            ? body?.error || "Webhook rejected"
            : !response.ok
              ? body?.error || bodyText || `HTTP ${response.status}`
              : "";
        if (errorMessage) {
          showToast(`Replay failed: ${errorMessage}`, "error");
          return;
        }
        showToast("Request replayed", "success");
        setTimeout(() => requestsPoll.refresh(), 0);
      } catch (err) {
        showToast(err.message || "Could not replay request", "error");
      } finally {
        setReplayingRequestId(null);
      }
    },
    [replayingRequestId, requestHeaders, requestUrl, requestsPoll.refresh],
  );

  const handleAskAgentToDebug = useCallback(
    async (item) => {
      if (!selectedHookName || !item?.id || debugLoadingRequestId === item.id)
        return;
      try {
        setDebugLoadingRequestId(item.id);
        const data = await fetchWebhookRequest(selectedHookName, item.id);
        setDebugRequest(data?.request || item);
      } catch (err) {
        showToast(err.message || "Could not load webhook request details", "error");
      } finally {
        setDebugLoadingRequestId(null);
      }
    },
    [debugLoadingRequestId, selectedHookName],
  );

  return {
    state: {
      requests,
      statusFilter,
      expandedRows,
      replayingRequestId,
      debugLoadingRequestId,
      debugRequest,
    },
    actions: {
      refreshRequests: requestsPoll.refresh,
      handleRequestRowToggle,
      handleSetStatusFilter,
      handleReplayRequest,
      handleCopyRequestField,
      handleAskAgentToDebug,
      setDebugRequest,
      resetState,
    },
  };
};
