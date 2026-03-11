import { h } from "https://esm.sh/preact";
import { useCallback, useMemo, useState } from "https://esm.sh/preact/hooks";
import htm from "https://esm.sh/htm";
import { usePolling } from "../hooks/usePolling.js";
import {
  kNoDestinationSessionValue,
  useDestinationSessionSelection,
} from "../hooks/use-destination-session-selection.js";
import {
  createWebhook,
  deleteWebhook,
  fetchAgents,
  fetchWebhookDetail,
  fetchWebhookRequest,
  fetchWebhookRequests,
  fetchWebhooks,
  sendAgentMessage,
} from "../lib/api.js";
import {
  formatLocaleDateTime,
  formatLocaleDateTimeWithTodayTime,
} from "../lib/format.js";
import { showToast } from "./toast.js";
import { PageHeader } from "./page-header.js";
import { ConfirmDialog } from "./confirm-dialog.js";
import { ActionButton } from "./action-button.js";
import { AgentSendModal } from "./agent-send-modal.js";
import { ModalShell } from "./modal-shell.js";
import { Badge } from "./badge.js";
import { CloseIcon } from "./icons.js";
import { SessionSelectField } from "./session-select-field.js";

const html = htm.bind(h);
const kNamePattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const kStatusFilters = ["all", "success", "error"];

const formatDateTime = (value) => {
  return formatLocaleDateTime(value, { fallback: "—" });
};

const formatLastReceived = (value) => {
  return formatLocaleDateTimeWithTodayTime(value, { fallback: "—" });
};

const formatBytes = (size) => {
  const bytes = Number(size || 0);
  if (!Number.isFinite(bytes) || bytes <= 0) return "0B";
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
};

const healthClassName = (health) => {
  if (health === "red") return "bg-red-500";
  if (health === "yellow") return "bg-yellow-500";
  return "bg-green-500";
};

const getRequestStatusTone = (status) => {
  if (status === "success") {
    return {
      dotClass: "bg-green-500/90",
      textClass: "text-green-500/90",
    };
  }
  if (status === "error") {
    return {
      dotClass: "bg-red-500/90",
      textClass: "text-red-500/90",
    };
  }
  return {
    dotClass: "bg-gray-500/70",
    textClass: "text-gray-400",
  };
};

const formatAgentFallbackName = (agentId = "") =>
  String(agentId || "")
    .trim()
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ") || "Main Agent";

const jsonPretty = (value) => {
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return value;
    }
  }
  try {
    return JSON.stringify(value || {}, null, 2);
  } catch {
    return String(value || "");
  }
};

const buildWebhookDebugMessage = ({
  hookName = "",
  webhook = null,
  request = null,
}) => {
  const hookPath =
    String(webhook?.path || "").trim() ||
    (hookName ? `/hooks/${hookName}` : "/hooks/unknown");
  const gatewayStatus =
    request?.gatewayStatus == null ? "n/a" : String(request.gatewayStatus);
  return [
    "Investigate this failed webhook request and share findings before fixing anything.",
    "Reply with your diagnosis first, including the likely root cause, any relevant risks, and what you would change if I approve a fix.",
    "",
    `Webhook: ${hookPath}`,
    `Request ID: ${String(request?.id || "unknown")}`,
    `Time: ${String(request?.createdAt || "unknown")}`,
    `Method: ${String(request?.method || "unknown")}`,
    `Source IP: ${String(request?.sourceIp || "unknown")}`,
    `Gateway status: ${gatewayStatus}`,
    `Transform path: ${String(webhook?.transformPath || "unknown")}`,
    `Payload truncated: ${request?.payloadTruncated ? "yes" : "no"}`,
    "",
    "Headers:",
    jsonPretty(request?.headers),
    "",
    "Payload:",
    jsonPretty(request?.payload),
    "",
    "Gateway response:",
    jsonPretty(request?.gatewayBody),
  ].join("\n");
};

const CreateWebhookModal = ({
  visible,
  name,
  onNameChange,
  canCreate,
  creating,
  onCreate = () => {},
  onClose,
}) => {
  const {
    sessions: selectableSessions,
    loading: loadingSessions,
    error: destinationLoadError,
    destinationSessionKey,
    setDestinationSessionKey,
    selectedDestination,
  } = useDestinationSessionSelection({
    enabled: visible,
    resetKey: String(visible),
  });

  const normalized = String(name || "")
    .trim()
    .toLowerCase();
  const previewName = normalized || "{name}";
  const previewUrl = `${window.location.origin}/hooks/${previewName}`;
  if (!visible) return null;
  return html`
    <${ModalShell}
      visible=${visible}
      onClose=${onClose}
      panelClassName="bg-modal border border-border rounded-xl p-5 max-w-lg w-full space-y-4"
    >
        <${PageHeader}
          title="Create Webhook"
          actions=${html`
            <button
              type="button"
              onclick=${onClose}
              class="h-8 w-8 inline-flex items-center justify-center rounded-lg ac-btn-secondary"
              aria-label="Close modal"
            >
              <${CloseIcon} className="w-3.5 h-3.5 text-gray-300" />
            </button>
          `}
        />
        <div class="space-y-2">
          <p class="text-xs text-gray-500">Name</p>
          <input
            type="text"
            value=${name}
            placeholder="fathom"
            onInput=${(e) => onNameChange(e.target.value)}
            onKeyDown=${(e) => {
              if (e.key === "Enter" && canCreate && !creating) {
                onCreate(selectedDestination);
              }
              if (e.key === "Escape") onClose();
            }}
            class="w-full bg-black/30 border border-border rounded-lg px-3 py-1.5 text-sm text-gray-200 outline-none focus:border-gray-500 font-mono"
          />
        </div>
        <${SessionSelectField}
          label="Deliver to"
          sessions=${selectableSessions}
          selectedSessionKey=${destinationSessionKey}
          onChangeSessionKey=${setDestinationSessionKey}
          disabled=${loadingSessions || creating}
          loading=${loadingSessions}
          error=${destinationLoadError}
          allowNone=${true}
          noneValue=${kNoDestinationSessionValue}
          noneLabel="Default"
          emptyStateText="No paired chat sessions found yet. You can still create the webhook without a default destination."
          loadingLabel="Loading destinations..."
        />
        <div class="border border-border rounded-lg overflow-hidden">
          <table class="w-full text-xs">
            <tbody>
              <tr class="border-b border-border">
                <td class="w-24 px-3 py-2 text-gray-500">Path</td>
                <td class="px-3 py-2 text-gray-300 font-mono">
                  <code>/hooks/${previewName}</code>
                </td>
              </tr>
              <tr class="border-b border-border">
                <td class="w-24 px-3 py-2 text-gray-500">URL</td>
                <td class="px-3 py-2 text-gray-300 font-mono break-all">
                  <code>${previewUrl}</code>
                </td>
              </tr>
              <tr>
                <td class="w-24 px-3 py-2 text-gray-500">Transform</td>
                <td class="px-3 py-2 text-gray-300 font-mono">
                  <code
                    >hooks/transforms/${previewName}/${previewName}-transform.mjs</code
                  >
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="pt-1 flex items-center justify-end gap-2">
          <${ActionButton}
            onClick=${onClose}
            tone="secondary"
            size="md"
            idleLabel="Cancel"
            className="px-4 py-2 rounded-lg text-sm"
          />
          <${ActionButton}
            onClick=${() => onCreate(selectedDestination)}
            disabled=${!canCreate || creating}
            loading=${creating}
            tone="primary"
            size="md"
            idleLabel="Create"
            loadingLabel="Creating..."
            className="px-4 py-2 rounded-lg text-sm"
          />
        </div>
    </${ModalShell}>
  `;
};

export const Webhooks = ({
  selectedHookName = "",
  onSelectHook = () => {},
  onBackToList = () => {},
  onRestartRequired = () => {},
  onOpenFile = () => {},
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTransformDir, setDeleteTransformDir] = useState(true);
  const [authMode, setAuthMode] = useState("headers");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedRows, setExpandedRows] = useState(() => new Set());
  const [sendingTestWebhook, setSendingTestWebhook] = useState(false);
  const [replayingRequestId, setReplayingRequestId] = useState(null);
  const [debugLoadingRequestId, setDebugLoadingRequestId] = useState(null);
  const [debugRequest, setDebugRequest] = useState(null);

  const listPoll = usePolling(fetchWebhooks, 15000);
  const webhooks = listPoll.data?.webhooks || [];
  const agentsPoll = usePolling(fetchAgents, 20000);
  const agents = Array.isArray(agentsPoll.data?.agents)
    ? agentsPoll.data.agents
    : [];
  const agentNameById = useMemo(
    () =>
      new Map(
        agents.map((agent) => [
          String(agent?.id || "").trim(),
          String(agent?.name || "").trim() ||
            formatAgentFallbackName(agent?.id),
        ]),
      ),
    [agents],
  );

  const detailPoll = usePolling(
    async () => {
      if (!selectedHookName) return null;
      const data = await fetchWebhookDetail(selectedHookName);
      return data.webhook || null;
    },
    10000,
    { enabled: !!selectedHookName },
  );

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

  const selectedWebhook = detailPoll.data;
  const selectedWebhookManaged = Boolean(selectedWebhook?.managed);
  const selectedDeliveryAgentId =
    String(selectedWebhook?.agentId || "main").trim() || "main";
  const selectedDeliveryAgentName =
    agentNameById.get(selectedDeliveryAgentId) ||
    formatAgentFallbackName(selectedDeliveryAgentId);
  const selectedDeliveryChannel =
    String(selectedWebhook?.channel || "last").trim() || "last";
  const requests = requestsPoll.data?.requests || [];
  const webhookUrl =
    selectedWebhook?.fullUrl || `.../hooks/${selectedHookName}`;
  const webhookUrlWithQueryToken =
    selectedWebhook?.queryStringUrl ||
    `${webhookUrl}${webhookUrl.includes("?") ? "&" : "?"}token=<WEBHOOK_TOKEN>`;
  const derivedTokenFromQuery = (() => {
    try {
      const parsed = new URL(webhookUrlWithQueryToken);
      return String(parsed.searchParams.get("token") || "").trim();
    } catch {
      return "";
    }
  })();
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

  const canCreate = useMemo(() => {
    const name = String(newName || "")
      .trim()
      .toLowerCase();
    return kNamePattern.test(name);
  }, [newName]);

  const refreshAll = useCallback(() => {
    listPoll.refresh();
    detailPoll.refresh();
    requestsPoll.refresh();
  }, [listPoll.refresh, detailPoll.refresh, requestsPoll.refresh]);

  const handleCreate = useCallback(
    async (destination = null) => {
      const candidateName = String(newName || "")
        .trim()
        .toLowerCase();
      if (!kNamePattern.test(candidateName)) {
        showToast(
          "Name must be lowercase letters, numbers, and hyphens",
          "error",
        );
        return;
      }
      if (creating) return;
      setCreating(true);
      try {
        const data = await createWebhook(candidateName, { destination });
        setIsCreating(false);
        setNewName("");
        onSelectHook(candidateName);
        if (data.restartRequired) onRestartRequired(true);
        showToast("Webhook created", "success");
        if (data.syncWarning) {
          showToast(
            `Created, but git-sync failed: ${data.syncWarning}`,
            "warning",
          );
        }
        refreshAll();
      } catch (err) {
        showToast(err.message || "Could not create webhook", "error");
      } finally {
        setCreating(false);
      }
    },
    [newName, creating, refreshAll, onSelectHook, onRestartRequired],
  );

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
        showToast(
          `Deleted, but git-sync failed: ${data.syncWarning}`,
          "warning",
        );
      }
      refreshAll();
    } catch (err) {
      showToast(err.message || "Could not delete webhook", "error");
    } finally {
      setDeleting(false);
    }
  }, [
    selectedHookName,
    deleting,
    deleteTransformDir,
    refreshAll,
    onBackToList,
    onRestartRequired,
  ]);

  const handleRequestRowToggle = useCallback((id, isOpen) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (isOpen) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

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
      setTimeout(() => requestsPoll.refresh(), 0);
    } catch (err) {
      showToast(err.message || "Could not send test webhook", "error");
    } finally {
      setSendingTestWebhook(false);
    }
  }, [
    bearerTokenValue,
    effectiveAuthMode,
    requestsPoll.refresh,
    selectedHookName,
    sendingTestWebhook,
    webhookTestPayloadJson,
    webhookUrl,
    webhookUrlWithQueryToken,
  ]);

  const handleReplayRequest = useCallback(
    async (item) => {
      if (!item || replayingRequestId === item.id) return;
      if (item.payloadTruncated) {
        showToast("Cannot replay a truncated payload", "warning");
        return;
      }
      const requestUrl =
        effectiveAuthMode === "query" ? webhookUrlWithQueryToken : webhookUrl;
      const headers = { "Content-Type": "application/json" };
      if (effectiveAuthMode === "headers") {
        headers.Authorization = bearerTokenValue;
      }
      setReplayingRequestId(item.id);
      try {
        const response = await fetch(requestUrl, {
          method: "POST",
          headers,
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
    [
      bearerTokenValue,
      effectiveAuthMode,
      replayingRequestId,
      requestsPoll.refresh,
      webhookUrl,
      webhookUrlWithQueryToken,
    ],
  );

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

  const isListLoading = !listPoll.data && !listPoll.error;
  const debugAgentMessage = useMemo(
    () =>
      buildWebhookDebugMessage({
        hookName: selectedHookName,
        webhook: selectedWebhook,
        request: debugRequest,
      }),
    [debugRequest, selectedHookName, selectedWebhook],
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
        showToast(
          err.message || "Could not load webhook request details",
          "error",
        );
      } finally {
        setDebugLoadingRequestId(null);
      }
    },
    [debugLoadingRequestId, selectedHookName],
  );

  return html`
    <div class="space-y-4">
      <${PageHeader}
        title="Webhooks"
        leading=${selectedHookName
          ? html`
              <button
                class="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors"
                onclick=${onBackToList}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                >
                  <path
                    d="M10.354 3.354a.5.5 0 00-.708-.708l-5 5a.5.5 0 000 .708l5 5a.5.5 0 00.708-.708L5.707 8l4.647-4.646z"
                  />
                </svg>
                Back
              </button>
            `
          : null}
        actions=${selectedHookName
          ? null
          : html`
              <button
                class="text-xs px-3 py-1.5 rounded-lg ac-btn-secondary"
                onclick=${() => setIsCreating((open) => !open)}
              >
                Create new
              </button>
            `}
      />

      ${selectedHookName
        ? html`
            <div
              class="bg-surface border border-border rounded-xl p-4 space-y-4"
            >
              <div>
                <h2 class="font-semibold text-sm">
                  ${selectedWebhook?.path || `/hooks/${selectedHookName}`}
                </h2>
              </div>

              <div
                class="bg-black/20 border border-border rounded-lg p-3 space-y-4"
              >
                ${selectedWebhookManaged
                  ? null
                  : html`
                      <div class="space-y-2">
                        <p class="text-xs text-gray-500">Auth mode</p>
                        <div class="flex items-center gap-2">
                          <button
                            class="text-xs px-2 py-1 rounded border transition-colors ${authMode ===
                            "headers"
                              ? "border-cyan-400 text-cyan-200 bg-cyan-400/10"
                              : "border-border text-gray-400 hover:text-gray-200"}"
                            onclick=${() => setAuthMode("headers")}
                          >
                            Headers
                          </button>
                          <button
                            class="text-xs px-2 py-1 rounded border transition-colors ${authMode ===
                            "query"
                              ? "border-cyan-400 text-cyan-200 bg-cyan-400/10"
                              : "border-border text-gray-400 hover:text-gray-200"}"
                            onclick=${() => setAuthMode("query")}
                          >
                            Query string
                          </button>
                        </div>
                      </div>
                    `}
                <div class="space-y-2">
                  <p class="text-xs text-gray-500">Webhook URL</p>
                  <div class="flex items-center gap-2">
                    <input
                      type="text"
                      readonly
                      value=${effectiveAuthMode === "query"
                        ? webhookUrlWithQueryToken
                        : webhookUrl}
                      class="h-8 flex-1 bg-black/30 border border-border rounded-lg px-3 text-xs text-gray-200 outline-none font-mono"
                    />
                    <button
                      class="h-8 text-xs px-2.5 rounded-lg ac-btn-secondary shrink-0"
                      onclick=${async () => {
                        try {
                          await navigator.clipboard.writeText(
                            effectiveAuthMode === "query"
                              ? webhookUrlWithQueryToken
                              : webhookUrl,
                          );
                          showToast("Webhook URL copied", "success");
                        } catch {
                          showToast("Could not copy URL", "error");
                        }
                      }}
                    >
                      Copy
                    </button>
                  </div>
                </div>
                ${selectedWebhookManaged
                  ? null
                  : effectiveAuthMode === "headers"
                    ? html`
                        <div class="space-y-2">
                          <p class="text-xs text-gray-500">Auth headers</p>
                          <div class="flex items-center gap-2">
                            <input
                              type="text"
                              readonly
                              value=${authHeaderValue}
                              class="h-8 flex-1 bg-black/30 border border-border rounded-lg px-3 text-xs text-gray-200 outline-none font-mono"
                            />
                            <button
                              class="h-8 text-xs px-2.5 rounded-lg ac-btn-secondary shrink-0"
                              onclick=${async () => {
                                try {
                                  await navigator.clipboard.writeText(
                                    bearerTokenValue,
                                  );
                                  showToast("Bearer token copied", "success");
                                } catch {
                                  showToast(
                                    "Could not copy bearer token",
                                    "error",
                                  );
                                }
                              }}
                            >
                              Copy
                            </button>
                          </div>
                        </div>
                      `
                    : html`
                        <p class="text-xs text-yellow-300">
                          Always use auth headers when possible. Query string is
                          less secure.
                        </p>
                      `}
              </div>

              <div
                class="bg-black/20 border border-border rounded-lg p-3 space-y-2"
              >
                <p class="text-xs text-gray-500">Deliver to</p>
                <p class="text-xs text-gray-200 font-mono ">
                  ${selectedDeliveryAgentName}${" "}
                  <span class="text-xs text-gray-500 font-mono">
                    (${selectedDeliveryChannel})</span
                  >
                </p>
              </div>

              <div
                class="bg-black/20 border border-border rounded-lg p-3 space-y-2"
              >
                <p class="text-xs text-gray-500">Test webhook</p>
                <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <input
                    type="text"
                    readonly
                    value=${activeCurlCommand}
                    class="h-8 w-full sm:flex-1 sm:min-w-0 bg-black/30 border border-border rounded-lg px-3 text-xs text-gray-200 outline-none font-mono overflow-x-auto scrollbar-hidden"
                  />
                  <div
                    class="grid grid-cols-2 gap-2 w-full sm:w-auto sm:flex sm:items-center"
                  >
                    <button
                      class="h-8 text-xs px-2.5 rounded-lg ac-btn-secondary w-full sm:w-auto sm:shrink-0"
                      onclick=${async () => {
                        try {
                          await navigator.clipboard.writeText(
                            activeCurlCommand,
                          );
                          showToast("curl command copied", "success");
                        } catch {
                          showToast("Could not copy curl command", "error");
                        }
                      }}
                    >
                      Copy
                    </button>
                    <button
                      class="h-8 text-xs px-2.5 rounded-lg ac-btn-secondary w-full sm:w-auto sm:shrink-0 disabled:opacity-60"
                      onclick=${handleSendTestWebhook}
                      disabled=${sendingTestWebhook}
                    >
                      ${sendingTestWebhook ? "Sending..." : "Send"}
                    </button>
                  </div>
                </div>
              </div>

              <div class="bg-black/20 border border-border rounded-lg p-3">
                <div class="flex items-center gap-2 text-xs text-gray-300">
                  <span class="text-gray-500">Transform:</span>
                  ${selectedWebhook?.transformPath
                    ? html`<button
                        type="button"
                        class="ac-tip-link flex-1 min-w-0 truncate block text-left font-mono"
                        title=${selectedWebhook.transformPath}
                        onclick=${() =>
                          onOpenFile(selectedWebhook.transformPath)}
                      >
                        ${selectedWebhook.transformPath}
                      </button>`
                    : html`<code class="flex-1 min-w-0 truncate block"
                        >—</code
                      >`}
                  <span
                    class=${`ml-auto inline-flex items-center gap-1 px-1.5 py-0.5 rounded border font-sans ${
                      selectedWebhook?.transformExists
                        ? "border-green-500/30 text-green-300 bg-green-500/10"
                        : "border-yellow-500/30 text-yellow-300 bg-yellow-500/10"
                    }`}
                  >
                    <span class="font-sans text-sm leading-none">
                      ${selectedWebhook?.transformExists ? "✓" : "!"}
                    </span>
                    ${selectedWebhook?.transformExists
                      ? null
                      : html`<span>missing</span>`}
                  </span>
                </div>
              </div>

              <div class="flex items-center justify-between gap-3">
                <p class="text-xs text-gray-600">
                  Created: ${formatDateTime(selectedWebhook?.createdAt)}
                </p>
                ${selectedWebhookManaged
                  ? null
                  : html`<${ActionButton}
                      onClick=${() => {
                        if (deleting) return;
                        setDeleteTransformDir(true);
                        setShowDeleteConfirm(true);
                      }}
                      disabled=${deleting}
                      loading=${deleting}
                      tone="danger"
                      size="sm"
                      idleLabel="Delete"
                      loadingLabel="Deleting..."
                      className="shrink-0 px-2.5 py-1"
                    />`}
              </div>
            </div>

            ${selectedWebhookManaged
              ? html`
                  <div
                    class="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3"
                  >
                    <p class="text-xs text-yellow-200">
                      This webhook is managed by Gmail Watch setup and cannot be
                      deleted or edited from this page.
                    </p>
                  </div>
                `
              : null}
            <div
              class="bg-surface border border-border rounded-xl p-4 space-y-3"
            >
              <div class="flex items-center justify-between gap-3">
                <h3 class="card-label">Request history</h3>
                <div class="flex items-center gap-2">
                  ${kStatusFilters.map(
                    (filter) => html`
                      <button
                        class="text-xs px-2 py-1 rounded border ${statusFilter ===
                        filter
                          ? "border-cyan-400 text-cyan-200 bg-cyan-400/10"
                          : "border-border text-gray-400 hover:text-gray-200"}"
                        onclick=${() => {
                          setStatusFilter(filter);
                          setExpandedRows(new Set());
                          setTimeout(() => requestsPoll.refresh(), 0);
                        }}
                      >
                        ${filter}
                      </button>
                    `,
                  )}
                </div>
              </div>

              ${requests.length === 0
                ? html`<p class="text-sm text-gray-500">
                    No requests logged yet.
                  </p>`
                : html`
                    <div class="ac-history-list">
                      ${requests.map((item) => {
                        const statusTone = getRequestStatusTone(item.status);
                        return html`
                          <details
                            class="ac-history-item"
                            open=${expandedRows.has(item.id)}
                            ontoggle=${(e) =>
                              handleRequestRowToggle(
                                item.id,
                                !!e.currentTarget?.open,
                              )}
                          >
                            <summary class="ac-history-summary">
                              <div class="ac-history-summary-row">
                                <span
                                  class="inline-flex items-center gap-2 min-w-0"
                                >
                                  <span
                                    class="ac-history-toggle shrink-0"
                                    aria-hidden="true"
                                    >▸</span
                                  >
                                  <span class="truncate text-xs text-gray-300">
                                    ${formatLastReceived(item.createdAt)}
                                  </span>
                                </span>
                                <span
                                  class="inline-flex items-center gap-2 shrink-0"
                                >
                                  <span class="text-xs text-gray-500"
                                    >${formatBytes(item.payloadSize)}</span
                                  >
                                  <span
                                    class=${`text-xs font-medium ${statusTone.textClass}`}
                                    >${item.gatewayStatus || "n/a"}</span
                                  >
                                  <span class="inline-flex items-center">
                                    <span
                                      class=${`h-2.5 w-2.5 rounded-full ${statusTone.dotClass}`}
                                      title=${item.status || "unknown"}
                                      aria-label=${item.status || "unknown"}
                                    ></span>
                                  </span>
                                </span>
                              </div>
                            </summary>
                            ${expandedRows.has(item.id)
                              ? html`
                                  <div class="ac-history-body space-y-3">
                                    <div>
                                      <p class="text-[11px] text-gray-500 mb-1">
                                        Headers
                                      </p>
                                      <pre
                                        class="text-xs bg-black/30 border border-border rounded p-2 overflow-auto"
                                      >
${jsonPretty(item.headers)}</pre
                                      >
                                      <div
                                        class="mt-2 flex justify-start gap-2"
                                      >
                                        <button
                                          class="h-7 text-xs px-2.5 rounded-lg ac-btn-secondary"
                                          onclick=${() =>
                                            handleCopyRequestField(
                                              jsonPretty(item.headers),
                                              "Headers",
                                            )}
                                        >
                                          Copy
                                        </button>
                                      </div>
                                    </div>
                                    <div>
                                      <p class="text-[11px] text-gray-500 mb-1">
                                        Payload
                                        ${item.payloadTruncated
                                          ? "(truncated)"
                                          : ""}
                                      </p>
                                      <pre
                                        class="text-xs bg-black/30 border border-border rounded p-2 overflow-auto"
                                      >
${jsonPretty(item.payload)}</pre
                                      >
                                      <div
                                        class="mt-2 flex justify-start gap-2"
                                      >
                                        <button
                                          class="h-7 text-xs px-2.5 rounded-lg ac-btn-secondary"
                                          onclick=${() =>
                                            handleCopyRequestField(
                                              item.payload,
                                              "Payload",
                                            )}
                                        >
                                          Copy
                                        </button>
                                        <button
                                          class="h-7 text-xs px-2.5 rounded-lg ac-btn-secondary disabled:opacity-60"
                                          onclick=${() =>
                                            handleReplayRequest(item)}
                                          disabled=${item.payloadTruncated ||
                                          replayingRequestId === item.id}
                                          title=${item.payloadTruncated
                                            ? "Cannot replay truncated payload"
                                            : "Replay this payload"}
                                        >
                                          ${replayingRequestId === item.id
                                            ? "Replaying..."
                                            : "Replay"}
                                        </button>
                                      </div>
                                    </div>
                                    <div>
                                      <p class="text-[11px] text-gray-500 mb-1">
                                        Gateway response
                                        (${item.gatewayStatus || "n/a"})
                                      </p>
                                      <pre
                                        class="text-xs bg-black/30 border border-border rounded p-2 overflow-auto"
                                      >
${jsonPretty(item.gatewayBody)}</pre
                                      >
                                      <div
                                        class="mt-2 flex justify-start gap-2"
                                      >
                                        <button
                                          class="h-7 text-xs px-2.5 rounded-lg ac-btn-secondary"
                                          onclick=${() =>
                                            handleCopyRequestField(
                                              item.gatewayBody,
                                              "Gateway response",
                                            )}
                                        >
                                          Copy
                                        </button>
                                        ${item.status === "error"
                                          ? html`<${ActionButton}
                                              onClick=${() =>
                                                handleAskAgentToDebug(item)}
                                              loading=${debugLoadingRequestId ===
                                              item.id}
                                              tone="primary"
                                              size="sm"
                                              idleLabel="Ask agent to debug"
                                              loadingLabel="Loading..."
                                              className="h-7 px-2.5"
                                            />`
                                          : null}
                                      </div>
                                    </div>
                                  </div>
                                `
                              : null}
                          </details>
                        `;
                      })}
                    </div>
                  `}
            </div>
          `
        : html`
            <div
              class="bg-surface border border-border rounded-xl p-4 space-y-4"
            >
              ${isListLoading
                ? html`<p class="text-xs text-gray-500">Loading webhooks...</p>`
                : null}
              ${!isListLoading && webhooks.length === 0
                ? html`<p class="text-sm text-gray-500">
                    No webhooks configured yet. Create one to get started.
                  </p>`
                : null}
              ${webhooks.length > 0
                ? html`
                    <div class="overflow-auto">
                      <table class="w-full text-sm">
                        <thead>
                          <tr
                            class="text-left text-xs text-gray-500 border-b border-border"
                          >
                            <th class="pb-2 pr-3">Path</th>
                            <th class="pb-2 pr-3">Last received</th>
                            <th class="pb-2 pr-3">Errors</th>
                            <th class="pb-2 pr-3">Health</th>
                            <th class="pb-2 pr-3">Type</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr aria-hidden="true">
                            <td class="h-2 p-0" colspan="5"></td>
                          </tr>
                          ${webhooks.map(
                            (item) => html`
                              <tr
                                class="group cursor-pointer"
                                onclick=${() => {
                                  onSelectHook(item.name);
                                  setStatusFilter("all");
                                  setExpandedRows(new Set());
                                }}
                              >
                                <td
                                  class="px-3 py-2.5 group-hover:bg-white/5 first:rounded-l-lg transition-colors"
                                >
                                  <code
                                    >${item.path || `/hooks/${item.name}`}</code
                                  >
                                </td>
                                <td
                                  class="px-3 py-2.5 text-xs text-gray-400 group-hover:bg-white/5 transition-colors"
                                >
                                  ${formatLastReceived(item.lastReceived)}
                                </td>
                                <td
                                  class="px-3 py-2.5 text-xs group-hover:bg-white/5 transition-colors"
                                >
                                  ${item.errorCount || 0}
                                </td>
                                <td
                                  class="px-3 py-2.5 group-hover:bg-white/5 last:rounded-r-lg transition-colors"
                                >
                                  <span
                                    class="inline-block w-2.5 h-2.5 rounded-full ${healthClassName(
                                      item.health,
                                    )}"
                                    title=${item.health}
                                  />
                                </td>
                                <td
                                  class="px-3 py-2.5 text-xs text-gray-400 group-hover:bg-white/5 transition-colors"
                                >
                                  ${item.managed
                                    ? html`<span
                                        class="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] bg-cyan-500/10 text-cyan-200"
                                        >Managed</span
                                      >`
                                    : html`<${Badge} tone="neutral">Custom</${Badge}>`}
                                </td>
                              </tr>
                            `,
                          )}
                        </tbody>
                      </table>
                    </div>
                  `
                : null}
            </div>
          `}

      <${CreateWebhookModal}
        visible=${isCreating && !selectedHookName}
        name=${newName}
        onNameChange=${setNewName}
        canCreate=${canCreate}
        creating=${creating}
        onCreate=${handleCreate}
        onClose=${() => setIsCreating(false)}
      />
      <${ConfirmDialog}
        visible=${showDeleteConfirm &&
        !!selectedHookName &&
        !selectedWebhookManaged}
        title="Delete webhook?"
        message=${`This removes "/hooks/${selectedHookName}" from openclaw.json.`}
        details=${html`
          <div class="rounded-lg border border-border bg-black/20 p-3">
            <label
              class="flex items-center gap-2 text-xs text-gray-300 select-none"
            >
              <input
                type="checkbox"
                checked=${deleteTransformDir}
                onInput=${(event) =>
                  setDeleteTransformDir(!!event.target.checked)}
              />
              Also delete <code>hooks/transforms/${selectedHookName}</code>
            </label>
          </div>
        `}
        confirmLabel="Delete webhook"
        confirmLoadingLabel="Deleting..."
        confirmLoading=${deleting}
        cancelLabel="Cancel"
        onCancel=${() => {
          if (deleting) return;
          setDeleteTransformDir(true);
          setShowDeleteConfirm(false);
        }}
        onConfirm=${handleDeleteConfirmed}
      />
      <${AgentSendModal}
        visible=${!!debugRequest}
        title="Ask agent to debug"
        messageLabel="Debug request"
        messageRows=${12}
        initialMessage=${debugAgentMessage}
        resetKey=${String(debugRequest?.id || "")}
        submitLabel="Send debug request"
        loadingLabel="Sending..."
        onClose=${() => setDebugRequest(null)}
        onSubmit=${async ({ selectedSessionKey, message }) => {
          try {
            await sendAgentMessage({
              message,
              sessionKey: selectedSessionKey,
            });
            showToast("Debug request sent to agent", "success");
            return true;
          } catch (err) {
            showToast(err.message || "Could not send debug request", "error");
            return false;
          }
        }}
      />
    </div>
  `;
};
