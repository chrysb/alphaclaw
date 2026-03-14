import { h } from "https://esm.sh/preact";
import htm from "https://esm.sh/htm";
import { ActionButton } from "../../action-button.js";
import { Badge } from "../../badge.js";
import { ConfirmDialog } from "../../confirm-dialog.js";
import { ComputerLineIcon, FileCopyLineIcon } from "../../icons.js";
import { LoadingSpinner } from "../../loading-spinner.js";
import { OverflowMenu, OverflowMenuItem } from "../../overflow-menu.js";
import { useConnectedNodesCard } from "./use-connected-nodes-card.js";

const html = htm.bind(h);

const escapeDoubleQuotes = (value) => String(value || "").replace(/"/g, '\\"');

const buildReconnectCommand = ({ node, connectInfo, maskToken = false }) => {
  const host = String(connectInfo?.gatewayHost || "").trim() || "localhost";
  const port = Number(connectInfo?.gatewayPort) || 3000;
  const token = String(connectInfo?.gatewayToken || "").trim();
  const tlsFlag = connectInfo?.tls === true ? "--tls" : "";
  const displayName = String(
    node?.displayName || node?.nodeId || "My Node",
  ).trim();
  const tokenValue = maskToken ? "****" : token;

  return [
    tokenValue ? `OPENCLAW_GATEWAY_TOKEN=${tokenValue}` : "",
    "openclaw node run",
    `--host ${host}`,
    `--port ${port}`,
    tlsFlag,
    `--display-name "${escapeDoubleQuotes(displayName)}"`,
  ]
    .filter(Boolean)
    .join(" ");
};

const renderNodeStatusBadge = (node) => {
  if (node?.connected) {
    return html`<${Badge} tone="success">Connected</${Badge}>`;
  }
  if (node?.paired) {
    return html`<${Badge} tone="warning">Disconnected</${Badge}>`;
  }
  return html`<${Badge} tone="danger">Pending approval</${Badge}>`;
};

const isBrowserCapableNode = (node) => {
  const caps = Array.isArray(node?.caps) ? node.caps : [];
  const commands = Array.isArray(node?.commands) ? node.commands : [];
  return caps.includes("browser") || commands.includes("browser.proxy");
};

const getBrowserStatusTone = (status) => {
  if (status.running) return "success";
  return "warning";
};

const getBrowserStatusLabel = (status) => {
  if (status.running) return "Attached";
  return "Not connected";
};

export const ConnectedNodesCard = ({
  nodes = [],
  pending = [],
  loading = false,
  error = "",
  connectInfo = null,
  onRefreshNodes = async () => {},
}) => {
  const state = useConnectedNodesCard({ nodes, onRefreshNodes });
  const {
    browserStatusByNodeId,
    browserErrorByNodeId,
    checkingBrowserNodeId,
    browserAttachStateByNodeId,
    menuOpenNodeId,
    removeDialogNode,
    removingNodeId,
    handleCopyText,
    handleCheckNodeBrowser,
    handleAttachNodeBrowser,
    handleDetachNodeBrowser,
    handleOpenNodeMenu,
    handleRemoveNode,
    setMenuOpenNodeId,
    setRemoveDialogNode,
  } = state;

  return html`
    <div class="space-y-3">
      ${pending.length
        ? html`
            <div
              class="bg-surface border border-yellow-500/40 rounded-xl px-4 py-3 text-xs text-yellow-300"
            >
              ${pending.length} pending node${pending.length === 1 ? "" : "s"}
              waiting for approval.
            </div>
          `
        : null}
      ${loading
        ? html`
            <div class="bg-surface border border-border rounded-xl p-4">
              <div class="flex items-center gap-3 text-sm text-gray-400">
                <${LoadingSpinner} className="h-4 w-4" />
                <span>Loading nodes...</span>
              </div>
            </div>
          `
        : error
          ? html`
              <div
                class="bg-surface border border-border rounded-xl p-4 text-xs text-red-400"
              >
                ${error}
              </div>
            `
          : !nodes.length
            ? html`
                <div
                  class="bg-surface border border-border rounded-xl px-6 py-10 min-h-[26rem] flex flex-col items-center justify-center text-center"
                >
                  <div class="max-w-md w-full flex flex-col items-center gap-4">
                    <${ComputerLineIcon} className="h-12 w-12 text-cyan-400" />
                    <div class="space-y-2">
                      <h2 class="font-semibold text-lg text-gray-100">
                        No connected nodes yet
                      </h2>
                      <p class="text-xs text-gray-400 leading-5">
                        Connect a Mac, iOS, Android, or headless node to run
                        system and browser commands through this gateway.
                      </p>
                    </div>
                  </div>
                </div>
              `
            : html`
                <div class="space-y-2">
                  ${nodes.map((node) => {
                    const nodeId = String(node?.nodeId || "").trim();
                    const browserStatus = browserStatusByNodeId[nodeId] || null;
                    const browserError = browserErrorByNodeId[nodeId] || "";
                    const checkingBrowser = checkingBrowserNodeId === nodeId;
                    const canCheckBrowser =
                      node?.connected && isBrowserCapableNode(node) && nodeId;
                    const browserAttachEnabled =
                      browserAttachStateByNodeId?.[nodeId] === true;
                    const hasBrowserCheckResult =
                      !!browserStatus || !!browserError;
                    const browserAttached = browserStatus?.running === true;
                    const showResolvingSpinner =
                      browserAttachEnabled &&
                      !hasBrowserCheckResult &&
                      !checkingBrowser;
                    const showBrowserCheckButton =
                      canCheckBrowser &&
                      browserAttachEnabled &&
                      !checkingBrowser &&
                      hasBrowserCheckResult &&
                      !browserAttached;
                    return html`
                      <div
                        class="bg-surface border border-border rounded-xl p-4 space-y-2"
                      >
                        <div class="flex items-center justify-between gap-2">
                          <div class="min-w-0 space-y-1">
                            <div class="flex items-center gap-2 min-w-0 mb-2">
                              <div class="text-sm font-medium truncate">
                                ${node?.displayName ||
                                node?.nodeId ||
                                "Unnamed node"}
                              </div>
                              ${nodeId
                                ? html`
                                    <button
                                      type="button"
                                      class="shrink-0 inline-flex items-center gap-1 text-[11px] text-gray-500 hover:text-gray-300"
                                      onclick=${() =>
                                        handleCopyText(nodeId, {
                                          successMessage: "Device ID copied",
                                          errorMessage:
                                            "Could not copy device ID",
                                        })}
                                    >
                                      <${FileCopyLineIcon}
                                        className="w-3.5 h-3.5"
                                      />
                                      <span>Copy device id</span>
                                    </button>
                                  `
                                : null}
                            </div>
                          </div>
                          <div class="flex items-center gap-1.5">
                            ${renderNodeStatusBadge(node)}
                            ${node?.paired
                              ? html`
                                <${OverflowMenu}
                                  open=${menuOpenNodeId === nodeId}
                                  ariaLabel="Open node actions"
                                  title="Open node actions"
                                  onClose=${() => setMenuOpenNodeId("")}
                                  onToggle=${() => handleOpenNodeMenu(nodeId)}
                                >
                                  <${OverflowMenuItem}
                                    className="text-red-300 hover:text-red-200"
                                    onClick=${() => {
                                      setMenuOpenNodeId("");
                                      setRemoveDialogNode(node);
                                    }}
                                  >
                                    Remove device
                                  </${OverflowMenuItem}>
                                </${OverflowMenu}>
                              `
                              : null}
                          </div>
                        </div>
                        <div class="flex flex-wrap gap-2 text-[11px]">
                          <div class="ac-surface-inset rounded-lg px-2.5 py-1">
                            <span class="text-gray-500">platform: </span>
                            <code>${node?.platform || "unknown"}</code>
                          </div>
                          <div class="ac-surface-inset rounded-lg px-2.5 py-1">
                            <span class="text-gray-500">version: </span>
                            <code>${node?.version || "unknown"}</code>
                          </div>
                          <div class="ac-surface-inset rounded-lg px-2.5 py-1">
                            <span class="text-gray-500">capabilities: </span>
                            <code
                              >${Array.isArray(node?.caps)
                                ? node.caps.join(", ")
                                : "none"}</code
                            >
                          </div>
                        </div>
                        ${canCheckBrowser
                          ? html`
                              <div class="space-y-2">
                                <div
                                  class="ac-surface-inset rounded-lg px-3 py-2 space-y-2"
                                >
                                  <div
                                    class="flex items-start justify-between gap-2"
                                  >
                                    <div class="space-y-0.5">
                                      <div class="text-sm font-medium">
                                        Browser
                                      </div>
                                      ${browserAttachEnabled
                                        ? html`
                                            <div
                                              class="text-[11px] text-gray-500"
                                            >
                                              profile: <code>user</code>
                                            </div>
                                          `
                                        : html`
                                            <div
                                              class="text-[11px] text-gray-500"
                                            >
                                              Attach is disabled until you click
                                              ${" "}
                                              <code>Attach</code>
                                              ${" "} (prevents control prompts
                                              when opening this tab).
                                            </div>
                                          `}
                                    </div>
                                    <div class="flex items-start gap-2">
                                      ${browserStatus
                                        ? html`
                                          <span class="inline-flex mt-0.5">
                                            <${Badge} tone=${getBrowserStatusTone(browserStatus)}
                                              >${getBrowserStatusLabel(browserStatus)}</${Badge}
                                            >
                                          </span>
                                        `
                                        : null}
                                      ${showResolvingSpinner
                                        ? html`
                                            <${LoadingSpinner}
                                              className="h-3.5 w-3.5"
                                            />
                                          `
                                        : null}
                                      ${checkingBrowser
                                        ? html`
                                            <${LoadingSpinner}
                                              className="h-3.5 w-3.5"
                                            />
                                          `
                                        : null}
                                      ${canCheckBrowser && !browserAttachEnabled
                                        ? html`
                                            <${ActionButton}
                                              onClick=${() =>
                                                handleAttachNodeBrowser(nodeId)}
                                              idleLabel="Attach"
                                              tone="primary"
                                              size="sm"
                                            />
                                          `
                                        : null}
                                      ${showBrowserCheckButton
                                        ? html`
                                            <${ActionButton}
                                              onClick=${() =>
                                                handleCheckNodeBrowser(nodeId)}
                                              idleLabel="Check"
                                              tone="secondary"
                                              size="sm"
                                            />
                                          `
                                        : null}
                                    </div>
                                  </div>
                                  ${browserStatus
                                    ? html`
                                        <div
                                          class="flex items-center justify-between gap-2"
                                        >
                                          <div
                                            class="flex flex-wrap gap-2 text-[11px] text-gray-500"
                                          >
                                            <span
                                              >driver:
                                              <code
                                                >${browserStatus?.driver ||
                                                "unknown"}</code
                                              ></span
                                            >
                                            <span
                                              >transport:
                                              <code
                                                >${browserStatus?.transport ||
                                                "unknown"}</code
                                              ></span
                                            >
                                          </div>
                                          ${browserAttachEnabled
                                            ? html`
                                                <button
                                                  type="button"
                                                  onclick=${() =>
                                                    handleDetachNodeBrowser(
                                                      nodeId,
                                                    )}
                                                  class="shrink-0 text-[11px] text-gray-500 hover:text-gray-300"
                                                >
                                                  Detach
                                                </button>
                                              `
                                            : null}
                                        </div>
                                      `
                                    : null}
                                  ${browserError
                                    ? html`<div
                                        class="text-[11px] text-red-400"
                                      >
                                        ${browserError}
                                      </div>`
                                    : null}
                                </div>
                              </div>
                            `
                          : null}
                        ${node?.paired && !node?.connected && connectInfo
                          ? html`
                              <div
                                class="border-t border-border pt-2 space-y-2"
                              >
                                <div class="text-[11px] text-gray-500">
                                  Reconnect command
                                </div>
                                <div class="flex items-center gap-2">
                                  <input
                                    type="text"
                                    readonly
                                    value=${buildReconnectCommand({
                                      node,
                                      connectInfo,
                                      maskToken: true,
                                    })}
                                    class="flex-1 min-w-0 bg-black/30 border border-border rounded-lg px-2 py-1.5 text-[11px] font-mono text-gray-300"
                                  />
                                  <${ActionButton}
                                    onClick=${() =>
                                      handleCopyText(
                                        buildReconnectCommand({
                                          node,
                                          connectInfo,
                                          maskToken: false,
                                        }),
                                        {
                                          successMessage:
                                            "Connection command copied",
                                          errorMessage:
                                            "Could not copy connection command",
                                        },
                                      )}
                                    tone="secondary"
                                    size="sm"
                                    iconOnly=${true}
                                    idleIcon=${FileCopyLineIcon}
                                    idleIconClassName="w-3.5 h-3.5"
                                    ariaLabel="Copy reconnect command"
                                    title="Copy reconnect command"
                                  />
                                </div>
                              </div>
                            `
                          : null}
                      </div>
                    `;
                  })}
                </div>
              `}
    </div>
    <${ConfirmDialog}
      visible=${!!removeDialogNode}
      title="Remove device?"
      message=${removeDialogNode?.connected
        ? "This device is currently connected. Removing it will disconnect and remove the paired device from this gateway (equivalent to running openclaw devices remove for this device id). The device can reconnect and pair again later."
        : "This removes the paired device from this gateway (equivalent to running openclaw devices remove for this device id). The device can reconnect and pair again later."}
      confirmLabel="Remove device"
      confirmLoadingLabel="Removing..."
      confirmTone="warning"
      confirmLoading=${Boolean(removingNodeId)}
      confirmDisabled=${Boolean(removingNodeId)}
      onCancel=${() => {
        if (removingNodeId) return;
        setRemoveDialogNode(null);
      }}
      onConfirm=${handleRemoveNode}
    />
  `;
};
