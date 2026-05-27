import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "preact/hooks";
import {
  deleteWebhook,
  fetchAgents,
  fetchWebhookDetail,
  rotateWebhookOauthCallback,
  updateWebhookDestination,
} from "../../../lib/api.js";
import {
  useDestinationSessionSelection,
} from "../../../hooks/use-destination-session-selection.js";
import { useCachedFetch } from "../../../hooks/use-cached-fetch.js";
import {
  getAgentIdFromSessionKey,
  getSessionRowKey,
} from "../../../lib/session-keys.js";
import { showToast } from "../../toast.js";
import { formatAgentFallbackName } from "../helpers.js";

const getWebhookDestination = (webhook = null) => {
  const channel = String(webhook?.channel || "").trim();
  const to = String(webhook?.to || "").trim();
  if (!channel || !to) return null;
  const agentId = String(webhook?.agentId || "").trim();
  return {
    channel,
    to,
    ...(agentId ? { agentId } : {}),
  };
};

const findDestinationSessionKey = (sessions = [], webhook = null) => {
  const destination = getWebhookDestination(webhook);
  if (!destination) return "";
  const destinationAgentId = String(destination?.agentId || "").trim();
  const matchingSession = sessions.find((sessionRow) => {
    const channel = String(sessionRow?.replyChannel || "").trim();
    const to = String(sessionRow?.replyTo || "").trim();
    const agentId = getAgentIdFromSessionKey(getSessionRowKey(sessionRow));
    const agentMatches = destinationAgentId ? agentId === destinationAgentId : true;
    return (
      channel === destination.channel &&
      to === destination.to &&
      agentMatches
    );
  });
  return String(matchingSession?.key || "").trim();
};

const areDestinationsEqual = (left = null, right = null) => {
  if (!left && !right) return true;
  if (!left || !right) return false;
  return (
    String(left.channel || "").trim() === String(right.channel || "").trim() &&
    String(left.to || "").trim() === String(right.to || "").trim() &&
    String(left.agentId || "").trim() === String(right.agentId || "").trim()
  );
};

export const useWebhookDetail = ({
  selectedHookName = "",
  onBackToList = () => {},
  onRestartRequired = () => {},
  onTestWebhookSent = () => {},
}) => {
  const [authMode, setAuthMode] = useState("headers");
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTransformDir, setDeleteTransformDir] = useState(true);
  const [rotatingOauthCallback, setRotatingOauthCallback] = useState(false);
  const [showRotateOauthConfirm, setShowRotateOauthConfirm] = useState(false);
  const [sendingTestWebhook, setSendingTestWebhook] = useState(false);
  const [savingDestination, setSavingDestination] = useState(false);

  const detailCacheKey = useMemo(
    () => `/api/webhooks/${encodeURIComponent(String(selectedHookName || ""))}`,
    [selectedHookName],
  );
  const detailFetchState = useCachedFetch(
    detailCacheKey,
    async () => {
      if (!selectedHookName) return null;
      const data = await fetchWebhookDetail(selectedHookName);
      return data.webhook || null;
    },
    {
      enabled: !!selectedHookName,
      maxAgeMs: 15000,
    },
  );
  const agentsFetchState = useCachedFetch("/api/agents", fetchAgents, {
    enabled: true,
    maxAgeMs: 30000,
  });

  const agents = Array.isArray(agentsFetchState.data?.agents)
    ? agentsFetchState.data.agents
    : [];
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

  const selectedWebhook = detailFetchState.data;
  const isWebhookLoading = !!selectedHookName && detailFetchState.loading;
  const webhookLoadError = detailFetchState.error;
  const selectedWebhookManaged = Boolean(selectedWebhook?.managed);
  const selectedDeliveryAgentId =
    String(selectedWebhook?.agentId || "main").trim() || "main";
  const selectedDeliveryAgentName =
    agentNameById.get(selectedDeliveryAgentId) ||
    formatAgentFallbackName(selectedDeliveryAgentId);
  const selectedDeliveryChannel =
    String(selectedWebhook?.channel || "last").trim() || "last";
  const destinationResetKey = useMemo(
    () =>
      [
        selectedHookName,
        selectedWebhook?.agentId,
        selectedWebhook?.channel,
        selectedWebhook?.to,
      ]
        .map((value) => String(value || "").trim())
        .join("|"),
    [
      selectedHookName,
      selectedWebhook?.agentId,
      selectedWebhook?.channel,
      selectedWebhook?.to,
    ],
  );
  const {
    sessions: selectableSessions,
    loading: loadingDestinationSessions,
    error: destinationLoadError,
    destinationSessionKey,
    setDestinationSessionKey,
    selectedDestination,
  } = useDestinationSessionSelection({
    enabled: !!selectedHookName && !selectedWebhookManaged,
    resetKey: destinationResetKey,
  });

  const webhookUrl = selectedWebhook?.fullUrl || `.../hooks/${selectedHookName}`;
  const oauthCallbackUrl = String(selectedWebhook?.oauthCallbackUrl || "").trim();
  const hasOauthCallback = !!oauthCallbackUrl;
  const oauthCallbackTestUrl = useMemo(() => {
    if (!hasOauthCallback) return "";
    try {
      const url = new URL(oauthCallbackUrl);
      if (!url.searchParams.has("code")) {
        url.searchParams.set("code", "TEST_AUTH_CODE");
      }
      if (!url.searchParams.has("state")) {
        url.searchParams.set("state", "TEST_STATE");
      }
      if (!url.searchParams.has("message")) {
        url.searchParams.set("message", "OAuth callback test");
      }
      return url.toString();
    } catch {
      const separator = oauthCallbackUrl.includes("?") ? "&" : "?";
      return `${oauthCallbackUrl}${separator}code=TEST_AUTH_CODE&state=TEST_STATE&message=OAuth%20callback%20test`;
    }
  }, [hasOauthCallback, oauthCallbackUrl]);
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
  const curlCommandOauth = `curl -X GET "${oauthCallbackTestUrl}"`;

  const effectiveAuthMode = selectedWebhookManaged ? "headers" : authMode;
  const activeCurlCommand = hasOauthCallback
    ? curlCommandOauth
    : effectiveAuthMode === "query"
      ? curlCommandQuery
      : curlCommandHeaders;

  const refreshDetail = useCallback(() => {
    detailFetchState.refresh({ force: true });
    agentsFetchState.refresh({ force: true });
  }, [agentsFetchState.refresh, detailFetchState.refresh]);

  useEffect(() => {
    if (!selectedHookName || selectedWebhookManaged || !selectedWebhook) return;
    if (!Array.isArray(selectableSessions) || selectableSessions.length <= 0) {
      setDestinationSessionKey("");
      return;
    }
    const nextKey = findDestinationSessionKey(selectableSessions, selectedWebhook);
    setDestinationSessionKey(nextKey);
  }, [
    selectableSessions,
    selectedHookName,
    selectedWebhook,
    selectedWebhookManaged,
    setDestinationSessionKey,
  ]);

  const currentDestination = useMemo(
    () => getWebhookDestination(selectedWebhook),
    [selectedWebhook],
  );
  const destinationDirty = useMemo(
    () => !areDestinationsEqual(currentDestination, selectedDestination),
    [currentDestination, selectedDestination],
  );

  const handleSaveDestination = useCallback(async () => {
    if (
      !selectedHookName ||
      selectedWebhookManaged ||
      savingDestination ||
      !destinationDirty
    ) {
      return;
    }
    setSavingDestination(true);
    try {
      const data = await updateWebhookDestination(selectedHookName, {
        destination: selectedDestination || null,
      });
      if (data?.restartRequired) {
        onRestartRequired(true);
      }
      if (data?.syncWarning) {
        showToast(`Updated, but git-sync failed: ${data.syncWarning}`, "warning");
      }
      showToast("Webhook destination updated", "success");
      refreshDetail();
    } catch (err) {
      showToast(err.message || "Could not update webhook destination", "error");
    } finally {
      setSavingDestination(false);
    }
  }, [
    destinationDirty,
    onRestartRequired,
    refreshDetail,
    savingDestination,
    selectedDestination,
    selectedHookName,
    selectedWebhookManaged,
  ]);

  const handleSendTestWebhook = useCallback(async () => {
    if (!selectedHookName || sendingTestWebhook) return;
    setSendingTestWebhook(true);
    try {
      const response = hasOauthCallback
        ? await fetch(oauthCallbackTestUrl, {
            method: "GET",
          })
        : await fetch(
            effectiveAuthMode === "query" ? webhookUrlWithQueryToken : webhookUrl,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                ...(effectiveAuthMode === "headers"
                  ? { Authorization: bearerTokenValue }
                  : {}),
              },
              body: webhookTestPayloadJson,
            },
          );
      onTestWebhookSent();
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
    hasOauthCallback,
    oauthCallbackTestUrl,
    onTestWebhookSent,
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
      isWebhookLoading,
      webhookLoadError,
      selectedWebhookManaged,
      selectedDeliveryAgentName,
      selectedDeliveryChannel,
      selectableSessions,
      loadingDestinationSessions,
      destinationLoadError,
      destinationSessionKey,
      destinationDirty,
      savingDestination,
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
      setDestinationSessionKey,
      setShowDeleteConfirm,
      setDeleteTransformDir,
      setShowRotateOauthConfirm,
      handleSaveDestination,
      handleDeleteConfirmed,
      handleRotateOauthCallback,
      handleSendTestWebhook,
    },
  };
};
