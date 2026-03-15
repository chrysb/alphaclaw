import { useCallback, useMemo, useState } from "https://esm.sh/preact/hooks";
import {
  deleteWebhook,
  fetchAgents,
  fetchWebhookDetail,
  rotateWebhookOauthCallback,
} from "../../../lib/api.js";
import { usePolling } from "../../../hooks/usePolling.js";
import { showToast } from "../../toast.js";
import { formatAgentFallbackName } from "../helpers.js";

export const useWebhookDetail = ({
  selectedHookName = "",
  onBackToList = () => {},
  onRestartRequired = () => {},
}) => {
  const [authMode, setAuthMode] = useState("headers");
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTransformDir, setDeleteTransformDir] = useState(true);
  const [rotatingOauthCallback, setRotatingOauthCallback] = useState(false);
  const [showRotateOauthConfirm, setShowRotateOauthConfirm] = useState(false);
  const [sendingTestWebhook, setSendingTestWebhook] = useState(false);

  const detailPoll = usePolling(
    async () => {
      if (!selectedHookName) return null;
      const data = await fetchWebhookDetail(selectedHookName);
      return data.webhook || null;
    },
    10000,
    { enabled: !!selectedHookName },
  );

  const agentsPoll = usePolling(fetchAgents, 20000);
  const agents = Array.isArray(agentsPoll.data?.agents) ? agentsPoll.data.agents : [];
  const agentNameById = useMemo(
    () =>
      new Map(
        agents.map((agent) => [
          String(agent?.id || "").trim(),
          String(agent?.name || "").trim() || formatAgentFallbackName(agent?.id),
        ]),
      ),
    [agents],
  );

  const selectedWebhook = detailPoll.data;
  const selectedWebhookManaged = Boolean(selectedWebhook?.managed);
  const selectedDeliveryAgentId =
    String(selectedWebhook?.agentId || "main").trim() || "main";
  const selectedDeliveryAgentName =
    agentNameById.get(selectedDeliveryAgentId) ||
    formatAgentFallbackName(selectedDeliveryAgentId);
  const selectedDeliveryChannel =
    String(selectedWebhook?.channel || "last").trim() || "last";

  const webhookUrl = selectedWebhook?.fullUrl || `.../hooks/${selectedHookName}`;
  const oauthCallbackUrl = String(selectedWebhook?.oauthCallbackUrl || "").trim();
  const hasOauthCallback = !!oauthCallbackUrl;
  const webhookUrlWithQueryToken =
    selectedWebhook?.queryStringUrl ||
    `${webhookUrl}${webhookUrl.includes("?") ? "&" : "?"}token=<WEBHOOK_TOKEN>`;

  const derivedTokenFromQuery = useMemo(() => {
    try {
      const parsed = new URL(webhookUrlWithQueryToken);
      return String(parsed.searchParams.get("token") || "").trim();
    } catch {
      return "";
    }
  }, [webhookUrlWithQueryToken]);

  const authHeaderValue =
    selectedWebhook?.authHeaderValue ||
    (derivedTokenFromQuery
      ? `Authorization: Bearer ${derivedTokenFromQuery}`
      : "Authorization: Bearer <WEBHOOK_TOKEN>");
  const bearerTokenValue = authHeaderValue.startsWith("Authorization: ")
    ? authHeaderValue.slice("Authorization: ".length)
    : authHeaderValue;

  const webhookTestPayload = useMemo(() => {
    if (
      String(selectedHookName || "")
        .trim()
        .toLowerCase() === "gmail"
    ) {
      return {
        payload: {
          account: "test@gmail.com",
          messages: [
            {
              id: "test-message-1",
              from: "alerts@example.com",
              to: ["test@gmail.com"],
              subject: "Test Gmail webhook event",
              snippet:
                "This is a simulated Gmail message payload for webhook testing.",
              receivedAt: new Date().toISOString(),
            },
          ],
        },
      };
    }
    return {
      source: "manual-test",
      message: `This is a test of the ${selectedHookName || "webhook"} webhook.`,
    };
  }, [selectedHookName]);

  const webhookTestPayloadJson = JSON.stringify(webhookTestPayload);
  const curlCommandHeaders =
    `curl -X POST "${webhookUrl}" ` +
    `-H "Content-Type: application/json" ` +
    `-H "${authHeaderValue}" ` +
    `-d '${webhookTestPayloadJson}'`;
  const curlCommandQuery =
    `curl -X POST "${webhookUrlWithQueryToken}" ` +
    `-H "Content-Type: application/json" ` +
    `-d '${webhookTestPayloadJson}'`;

  const effectiveAuthMode = selectedWebhookManaged ? "headers" : authMode;
  const activeCurlCommand =
    effectiveAuthMode === "query" ? curlCommandQuery : curlCommandHeaders;

  const refreshDetail = useCallback(() => {
    detailPoll.refresh();
    agentsPoll.refresh();
  }, [agentsPoll.refresh, detailPoll.refresh]);

  const handleSendTestWebhook = useCallback(async () => {
    if (!selectedHookName || sendingTestWebhook) return;
    setSendingTestWebhook(true);
    const requestUrl =
      effectiveAuthMode === "query" ? webhookUrlWithQueryToken : webhookUrl;
    const headers = { "Content-Type": "application/json" };
    if (effectiveAuthMode === "headers") {
      headers.Authorization = bearerTokenValue;
    }
    try {
      const response = await fetch(requestUrl, {
        method: "POST",
        headers,
        body: webhookTestPayloadJson,
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
        showToast(`Test webhook failed: ${errorMessage}`, "error");
        return;
      }
      showToast("Test webhook sent", "success");
    } catch (err) {
      showToast(err.message || "Could not send test webhook", "error");
    } finally {
      setSendingTestWebhook(false);
    }
  }, [
    bearerTokenValue,
    effectiveAuthMode,
    selectedHookName,
    sendingTestWebhook,
    webhookTestPayloadJson,
    webhookUrl,
    webhookUrlWithQueryToken,
  ]);

  const handleDeleteConfirmed = useCallback(async () => {
    if (!selectedHookName || deleting) return;
    setDeleting(true);
    try {
      const data = await deleteWebhook(selectedHookName, {
        deleteTransformDir,
      });
      if (data.restartRequired) onRestartRequired(true);
      onBackToList();
      setShowDeleteConfirm(false);
      setDeleteTransformDir(true);
      showToast("Webhook removed", "success");
      if (data.deletedTransformDir) {
        showToast("Transform directory deleted", "success");
      }
      if (data.syncWarning) {
        showToast(`Deleted, but git-sync failed: ${data.syncWarning}`, "warning");
      }
      refreshDetail();
    } catch (err) {
      showToast(err.message || "Could not delete webhook", "error");
    } finally {
      setDeleting(false);
    }
  }, [
    deleteTransformDir,
    deleting,
    onBackToList,
    onRestartRequired,
    refreshDetail,
    selectedHookName,
  ]);

  const handleRotateOauthCallback = useCallback(async () => {
    if (!selectedHookName || rotatingOauthCallback) return;
    setRotatingOauthCallback(true);
    try {
      await rotateWebhookOauthCallback(selectedHookName);
      showToast("OAuth callback rotated", "success");
      setShowRotateOauthConfirm(false);
      refreshDetail();
    } catch (err) {
      showToast(err.message || "Could not rotate OAuth callback", "error");
    } finally {
      setRotatingOauthCallback(false);
    }
  }, [refreshDetail, rotatingOauthCallback, selectedHookName]);

  return {
    state: {
      authMode,
      selectedWebhook,
      selectedWebhookManaged,
      selectedDeliveryAgentName,
      selectedDeliveryChannel,
      webhookUrl,
      oauthCallbackUrl,
      hasOauthCallback,
      webhookUrlWithQueryToken,
      authHeaderValue,
      bearerTokenValue,
      effectiveAuthMode,
      activeCurlCommand,
      deleting,
      showDeleteConfirm,
      deleteTransformDir,
      rotatingOauthCallback,
      showRotateOauthConfirm,
      sendingTestWebhook,
    },
    actions: {
      refreshDetail,
      setAuthMode,
      setShowDeleteConfirm,
      setDeleteTransformDir,
      setShowRotateOauthConfirm,
      handleDeleteConfirmed,
      handleRotateOauthCallback,
      handleSendTestWebhook,
    },
  };
};
