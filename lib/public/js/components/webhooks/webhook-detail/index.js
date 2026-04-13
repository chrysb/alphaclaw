import { h } from "preact";
import { useCallback, useState } from "preact/hooks";
import htm from "htm";
import { ActionButton } from "../../action-button.js";
import { Badge } from "../../badge.js";
import { ConfirmDialog } from "../../confirm-dialog.js";
import { showToast } from "../../toast.js";
import { kNoDestinationSessionValue } from "../../../hooks/use-destination-session-selection.js";
import {
  getSessionDisplayLabel,
  getSessionRowKey,
} from "../../../lib/session-keys.js";
import { formatDateTime } from "../helpers.js";
import { RequestHistory } from "../request-history/index.js";
import { useWebhookDetail } from "./use-webhook-detail.js";

const html = htm.bind(h);

export const WebhookDetail = ({
  selectedHookName = "",
  onBackToList = () => {},
  onRestartRequired = () => {},
  onOpenFile = () => {},
}) => {
  const [historyRefreshNonce, setHistoryRefreshNonce] = useState(0);
  const handleTestWebhookSent = useCallback(() => {
    setHistoryRefreshNonce((value) => value + 1);
  }, []);
  const { state, actions } = useWebhookDetail({
    selectedHookName,
    onBackToList,
    onRestartRequired,
    onTestWebhookSent: handleTestWebhookSent,
  });

  const {
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
    sendingTestWebhook,
    rotatingOauthCallback,
    showRotateOauthConfirm,
  } = state;

  return html`
    <div class="space-y-4">
      <div class="bg-surface border border-border rounded-xl p-4 space-y-4">
        <div>
          <h2 class="font-semibold text-sm">
            ${selectedWebhook?.path || `/hooks/${selectedHookName}`}
          </h2>
        </div>

        ${isWebhookLoading
          ? html`<div class="bg-field border border-border rounded-lg p-3">
              <p class="text-xs text-fg-muted">Loading webhook details...</p>
            </div>`
          : webhookLoadError
            ? html`<div class="bg-field border border-border rounded-lg p-3">
                <p class="text-xs text-status-error">
                  ${webhookLoadError?.message || "Could not load webhook details"}
                </p>
              </div>`
            : hasOauthCallback
              ? null
              : html`<div class="bg-field border border-border rounded-lg p-3 space-y-4">
              ${selectedWebhookManaged
                ? null
                : html`
                    <div class="space-y-2">
                      <p class="text-xs text-fg-muted">Auth mode</p>
                      <div class="flex items-center gap-2">
                        <button
                          class="text-xs px-2 py-1 rounded border transition-colors ${authMode ===
                          "headers"
                            ? "border-cyan-400 text-status-info bg-cyan-400/10"
                            : "border-border text-fg-muted hover:text-body"}"
                          onclick=${() => actions.setAuthMode("headers")}
                        >
                          Headers
                        </button>
                        <button
                          class="text-xs px-2 py-1 rounded border transition-colors ${authMode ===
                          "query"
                            ? "border-cyan-400 text-status-info bg-cyan-400/10"
                            : "border-border text-fg-muted hover:text-body"}"
                          onclick=${() => actions.setAuthMode("query")}
                        >
                          Query string
                        </button>
                      </div>
                    </div>
                  `}
              <div class="space-y-2">
                <p class="text-xs text-fg-muted">Webhook URL</p>
                <div class="flex items-center gap-2">
                  <input
                    type="text"
                    readonly
                    value=${effectiveAuthMode === "query"
                      ? webhookUrlWithQueryToken
                      : webhookUrl}
                    class="h-8 flex-1 bg-field border border-border rounded-lg px-3 text-xs text-body outline-none font-mono"
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
                        <p class="text-xs text-fg-muted">Auth headers</p>
                        <div class="flex items-center gap-2">
                          <input
                            type="text"
                            readonly
                            value=${authHeaderValue}
                            class="h-8 flex-1 bg-field border border-border rounded-lg px-3 text-xs text-body outline-none font-mono"
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
                              showToast("Could not copy bearer token", "error");
                              }
                            }}
                          >
                            Copy
                          </button>
                        </div>
                      </div>
                    `
                  : html`
                      <p class="text-xs text-status-warning">
                        Always use auth headers when possible. Query string is
                        less secure.
                      </p>
                    `}
            </div>`}

        ${isWebhookLoading || webhookLoadError || selectedWebhookManaged || !hasOauthCallback
          ? null
          : html`
              <div class="bg-field border border-border rounded-lg p-3 space-y-2">
                <div class="flex items-center gap-2">
                  <p class="text-xs text-fg-muted">OAuth Callback URL</p>
                  ${hasOauthCallback
                    ? html`<${Badge} tone="neutral">OAuth alias</${Badge}>`
                    : null}
                </div>
                <div class="flex items-center gap-2">
                  <input
                    type="text"
                    readonly
                    value=${hasOauthCallback ? oauthCallbackUrl : "Not enabled"}
                    class="h-8 flex-1 bg-field border border-border rounded-lg px-3 text-xs text-body outline-none font-mono"
                  />
                  ${hasOauthCallback
                    ? html`
                        <button
                          class="h-8 text-xs px-2.5 rounded-lg ac-btn-secondary shrink-0"
                          onclick=${async () => {
                            try {
                              await navigator.clipboard.writeText(
                                oauthCallbackUrl,
                              );
                              showToast("OAuth callback URL copied", "success");
                            } catch {
                              showToast("Could not copy URL", "error");
                            }
                          }}
                        >
                          Copy
                        </button>
                      `
                    : null}
                </div>
                <div class="flex items-center justify-start gap-3 flex-wrap">
                  <div class="flex items-center gap-2">
                    <button
                      class="h-8 text-xs px-2.5 rounded-lg ac-btn-secondary disabled:opacity-60"
                      onclick=${() => {
                        if (rotatingOauthCallback) return;
                        actions.setShowRotateOauthConfirm(true);
                      }}
                      disabled=${rotatingOauthCallback}
                    >
                      ${rotatingOauthCallback ? "Rotating..." : "Rotate"}
                    </button>
                  </div>
                  <p class="text-xs text-status-warning">
                    Keep this URL private. Rotate if exposed.
                  </p>
                </div>
              </div>
            `}

        <div class="bg-field border border-border rounded-lg p-3 space-y-2">
          ${selectedWebhookManaged
            ? html`
                <p class="text-xs text-fg-muted">Deliver to</p>
                <p class="text-xs text-body font-mono">
                  ${selectedDeliveryAgentName}${" "}
                  <span class="text-xs text-fg-muted font-mono"
                    >(${selectedDeliveryChannel})</span
                  >
                </p>
              `
            : html`
                <p class="text-xs text-fg-muted">Deliver to</p>
                <div class="flex items-center gap-2">
                  <select
                    value=${destinationSessionKey || kNoDestinationSessionValue}
                    onInput=${(event) => {
                      const nextValue = String(event.currentTarget?.value || "");
                      actions.setDestinationSessionKey(
                        nextValue === kNoDestinationSessionValue ? "" : nextValue,
                      );
                    }}
                    disabled=${loadingDestinationSessions || savingDestination}
                    class="h-8 flex-1 bg-field border border-border rounded-lg px-3 text-xs text-body focus:border-fg-muted"
                  >
                    <option value=${kNoDestinationSessionValue}>Default</option>
                    ${loadingDestinationSessions
                      ? html`<option value="" disabled>Loading...</option>`
                      : selectableSessions.map(
                          (sessionRow) => html`
                            <option value=${getSessionRowKey(sessionRow)}>
                              ${String(
                                getSessionDisplayLabel(sessionRow) ||
                                getSessionRowKey(sessionRow) ||
                                "Session",
                              )}
                            </option>
                          `,
                        )}
                  </select>
                  <${ActionButton}
                    onClick=${actions.handleSaveDestination}
                    disabled=${!destinationDirty || savingDestination}
                    loading=${savingDestination}
                    tone="secondary"
                    size="sm"
                    idleLabel="Save"
                    loadingLabel="Saving..."
                    className="px-2.5 py-1"
                  />
                </div>
                ${destinationLoadError
                  ? html`<p class="text-xs text-status-error-muted">${destinationLoadError}</p>`
                  : null}
              `}
        </div>

        <div class="bg-field border border-border rounded-lg p-3 space-y-2">
          <p class="text-xs text-fg-muted">Test webhook</p>
          <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              type="text"
              readonly
              value=${activeCurlCommand}
              class="h-8 w-full sm:flex-1 sm:min-w-0 bg-field border border-border rounded-lg px-3 text-xs text-body outline-none font-mono overflow-x-auto scrollbar-hidden"
            />
            <div class="grid grid-cols-2 gap-2 w-full sm:w-auto sm:flex sm:items-center">
              <button
                class="h-8 text-xs px-2.5 rounded-lg ac-btn-secondary w-full sm:w-auto sm:shrink-0"
                onclick=${async () => {
                  try {
                    await navigator.clipboard.writeText(activeCurlCommand);
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
                onclick=${actions.handleSendTestWebhook}
                disabled=${sendingTestWebhook}
              >
                ${sendingTestWebhook ? "Sending..." : "Send"}
              </button>
            </div>
          </div>
        </div>

        <div class="bg-field border border-border rounded-lg p-3">
          <div class="flex items-center gap-2 text-xs text-body">
            <span class="text-fg-muted">Transform:</span>
            ${selectedWebhook?.transformPath
              ? html`<button
                  type="button"
                  class="ac-tip-link flex-1 min-w-0 truncate block text-left font-mono"
                  title=${selectedWebhook.transformPath}
                  onclick=${() => onOpenFile(selectedWebhook.transformPath)}
                >
                  ${selectedWebhook.transformPath}
                </button>`
              : html`<code class="flex-1 min-w-0 truncate block">—</code>`}
            <span
              class=${`ml-auto inline-flex items-center gap-1 px-1.5 py-0.5 rounded border font-sans ${
                selectedWebhook?.transformExists
                  ? "border-green-500/30 text-status-success bg-green-500/10"
                  : "border-yellow-500/30 text-status-warning bg-yellow-500/10"
              }`}
            >
              <span class="font-sans text-sm leading-none">
                ${selectedWebhook?.transformExists ? "✓" : "!"}
              </span>
              ${selectedWebhook?.transformExists ? null : html`<span>missing</span>`}
            </span>
          </div>
        </div>

        <div class="flex items-center justify-between gap-3">
          <p class="text-xs text-fg-dim">
            Created: ${formatDateTime(selectedWebhook?.createdAt)}
          </p>
          ${selectedWebhookManaged
            ? null
            : html`<${ActionButton}
                onClick=${() => {
                  if (deleting) return;
                  actions.setDeleteTransformDir(true);
                  actions.setShowDeleteConfirm(true);
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

      ${selectedWebhookManaged && !isWebhookLoading && !webhookLoadError
        ? html`
            <div class="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3">
              <p class="text-xs text-status-warning">
                This webhook is managed by Gmail Watch setup and cannot be
                deleted or edited from this page.
              </p>
            </div>
          `
        : null}
      <${RequestHistory}
        selectedHookName=${selectedHookName}
        selectedWebhook=${selectedWebhook}
        effectiveAuthMode=${effectiveAuthMode}
        webhookUrl=${webhookUrl}
        webhookUrlWithQueryToken=${webhookUrlWithQueryToken}
        bearerTokenValue=${bearerTokenValue}
        refreshNonce=${historyRefreshNonce}
      />
      <${ConfirmDialog}
        visible=${showRotateOauthConfirm &&
        !!selectedHookName &&
        !selectedWebhookManaged &&
        hasOauthCallback}
        title="Rotate OAuth callback?"
        message="Rotating will generate a new callback URL and immediately invalidate the current URL."
        confirmLabel="Rotate callback URL"
        confirmLoadingLabel="Rotating..."
        confirmLoading=${rotatingOauthCallback}
        cancelLabel="Cancel"
        onCancel=${() => {
          if (rotatingOauthCallback) return;
          actions.setShowRotateOauthConfirm(false);
        }}
        onConfirm=${actions.handleRotateOauthCallback}
      />
      <${ConfirmDialog}
        visible=${showDeleteConfirm &&
        !!selectedHookName &&
        !selectedWebhookManaged}
        title="Delete webhook?"
        message=${`This removes "/hooks/${selectedHookName}" from openclaw.json.`}
        details=${html`
          <div class="rounded-lg border border-border bg-field p-3">
            <label class="flex items-center gap-2 text-xs text-body select-none">
              <input
                type="checkbox"
                checked=${deleteTransformDir}
                onInput=${(event) =>
                  actions.setDeleteTransformDir(!!event.target.checked)}
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
          actions.setDeleteTransformDir(true);
          actions.setShowDeleteConfirm(false);
        }}
        onConfirm=${actions.handleDeleteConfirmed}
      />
    </div>
  `;
};
