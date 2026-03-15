import { h } from "https://esm.sh/preact";
import { useMemo } from "https://esm.sh/preact/hooks";
import htm from "https://esm.sh/htm";
import { sendAgentMessage } from "../../../lib/api.js";
import { ActionButton } from "../../action-button.js";
import { AgentSendModal } from "../../agent-send-modal.js";
import { showToast } from "../../toast.js";
import {
  buildWebhookDebugMessage,
  formatBytes,
  formatLastReceived,
  getRequestStatusTone,
  jsonPretty,
  kStatusFilters,
} from "../helpers.js";
import { useRequestHistory } from "./use-request-history.js";

const html = htm.bind(h);

export const RequestHistory = ({
  selectedHookName = "",
  effectiveAuthMode = "headers",
  webhookUrl = "",
  webhookUrlWithQueryToken = "",
  bearerTokenValue = "",
  selectedWebhook = null,
}) => {
  const { state, actions } = useRequestHistory({
    selectedHookName,
    effectiveAuthMode,
    webhookUrl,
    webhookUrlWithQueryToken,
    bearerTokenValue,
  });

  const {
    requests,
    statusFilter,
    expandedRows,
    replayingRequestId,
    debugLoadingRequestId,
    debugRequest,
  } = state;

  const debugAgentMessage = useMemo(
    () =>
      buildWebhookDebugMessage({
        hookName: selectedHookName,
        webhook: selectedWebhook,
        request: debugRequest,
      }),
    [debugRequest, selectedHookName, selectedWebhook],
  );

  return html`
    <div class="bg-surface border border-border rounded-xl p-4 space-y-3">
      <div class="flex items-center justify-between gap-3">
        <h3 class="card-label">Request history</h3>
        <div class="flex items-center gap-2">
          ${kStatusFilters.map(
            (filter) => html`
              <button
                class="text-xs px-2 py-1 rounded border ${statusFilter === filter
                  ? "border-cyan-400 text-cyan-200 bg-cyan-400/10"
                  : "border-border text-gray-400 hover:text-gray-200"}"
                onclick=${() => actions.handleSetStatusFilter(filter)}
              >
                ${filter}
              </button>
            `,
          )}
        </div>
      </div>

      ${requests.length === 0
        ? html`<p class="text-sm text-gray-500">No requests logged yet.</p>`
        : html`
            <div class="ac-history-list">
              ${requests.map((item) => {
                const statusTone = getRequestStatusTone(item.status);
                return html`
                  <details
                    class="ac-history-item"
                    open=${expandedRows.has(item.id)}
                    ontoggle=${(e) =>
                      actions.handleRequestRowToggle(item.id, !!e.currentTarget?.open)}
                  >
                    <summary class="ac-history-summary">
                      <div class="ac-history-summary-row">
                        <span class="inline-flex items-center gap-2 min-w-0">
                          <span class="ac-history-toggle shrink-0" aria-hidden="true"
                            >▸</span
                          >
                          <span class="truncate text-xs text-gray-300">
                            ${formatLastReceived(item.createdAt)}
                          </span>
                        </span>
                        <span class="inline-flex items-center gap-2 shrink-0">
                          <span class="text-xs text-gray-500"
                            >${formatBytes(item.payloadSize)}</span
                          >
                          <span class=${`text-xs font-medium ${statusTone.textClass}`}
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
                              <p class="text-[11px] text-gray-500 mb-1">Headers</p>
                              <pre
                                class="text-xs bg-black/30 border border-border rounded p-2 overflow-auto"
                              >
${jsonPretty(item.headers)}</pre
                              >
                              <div class="mt-2 flex justify-start gap-2">
                                <button
                                  class="h-7 text-xs px-2.5 rounded-lg ac-btn-secondary"
                                  onclick=${() =>
                                    actions.handleCopyRequestField(
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
                                Payload ${item.payloadTruncated ? "(truncated)" : ""}
                              </p>
                              <pre
                                class="text-xs bg-black/30 border border-border rounded p-2 overflow-auto"
                              >
${jsonPretty(item.payload)}</pre
                              >
                              <div class="mt-2 flex justify-start gap-2">
                                <button
                                  class="h-7 text-xs px-2.5 rounded-lg ac-btn-secondary"
                                  onclick=${() =>
                                    actions.handleCopyRequestField(
                                      item.payload,
                                      "Payload",
                                    )}
                                >
                                  Copy
                                </button>
                                <button
                                  class="h-7 text-xs px-2.5 rounded-lg ac-btn-secondary disabled:opacity-60"
                                  onclick=${() => actions.handleReplayRequest(item)}
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
                                Gateway response (${item.gatewayStatus || "n/a"})
                              </p>
                              <pre
                                class="text-xs bg-black/30 border border-border rounded p-2 overflow-auto"
                              >
${jsonPretty(item.gatewayBody)}</pre
                              >
                              <div class="mt-2 flex justify-start gap-2">
                                <button
                                  class="h-7 text-xs px-2.5 rounded-lg ac-btn-secondary"
                                  onclick=${() =>
                                    actions.handleCopyRequestField(
                                      item.gatewayBody,
                                      "Gateway response",
                                    )}
                                >
                                  Copy
                                </button>
                                ${item.status === "error"
                                  ? html`<${ActionButton}
                                      onClick=${() =>
                                        actions.handleAskAgentToDebug(item)}
                                      loading=${debugLoadingRequestId === item.id}
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
      <${AgentSendModal}
        visible=${!!debugRequest}
        title="Ask agent to debug"
        messageLabel="Debug request"
        messageRows=${12}
        initialMessage=${debugAgentMessage}
        resetKey=${String(debugRequest?.id || "")}
        submitLabel="Send debug request"
        loadingLabel="Sending..."
        onClose=${() => actions.setDebugRequest(null)}
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
