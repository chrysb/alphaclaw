import { h } from "https://esm.sh/preact";
import htm from "https://esm.sh/htm";
import { useEffect, useRef, useState } from "https://esm.sh/preact/hooks";
import { ActionButton } from "../../action-button.js";
import { Badge } from "../../badge.js";
import { ComputerLineIcon, FileCopyLineIcon } from "../../icons.js";
import { LoadingSpinner } from "../../loading-spinner.js";
import { copyTextToClipboard } from "../../../lib/clipboard.js";
import { fetchNodeBrowserStatusForNode } from "../../../lib/api.js";
import { showToast } from "../../toast.js";

const html = htm.bind(h);
const kBrowserCheckTimeoutMs = 10000;

const escapeDoubleQuotes = (value) => String(value || "").replace(/"/g, '\\"');

const buildReconnectCommand = ({ node, connectInfo, maskToken = false }) => {
  const host = String(connectInfo?.gatewayHost || "").trim() || "localhost";
  const port = Number(connectInfo?.gatewayPort) || 3000;
  const token = String(connectInfo?.gatewayToken || "").trim();
  const tlsFlag = connectInfo?.tls === true ? "--tls" : "";
  const displayName = String(node?.displayName || node?.nodeId || "My Node").trim();
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

const withTimeout = async (promise, timeoutMs = kBrowserCheckTimeoutMs) => {
  let timeoutId = null;
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error("Browser check timed out"));
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
};

export const ConnectedNodesCard = ({
  nodes = [],
  pending = [],
  loading = false,
  error = "",
  connectInfo = null,
}) => {
  const [browserStatusByNodeId, setBrowserStatusByNodeId] = useState({});
  const [browserErrorByNodeId, setBrowserErrorByNodeId] = useState({});
  const [checkingBrowserNodeId, setCheckingBrowserNodeId] = useState("");
  const autoCheckedNodeIdsRef = useRef(new Set());

  const handleCopyCommand = async (command) => {
    const copied = await copyTextToClipboard(command);
    if (copied) {
      showToast("Connection command copied", "success");
      return;
    }
    showToast("Could not copy connection command", "error");
  };

  const handleCheckNodeBrowser = async (nodeId, { silent = false } = {}) => {
    const normalizedNodeId = String(nodeId || "").trim();
    if (!normalizedNodeId || checkingBrowserNodeId) return;
    setCheckingBrowserNodeId(normalizedNodeId);
    setBrowserErrorByNodeId((prev) => ({
      ...prev,
      [normalizedNodeId]: "",
    }));
    try {
      const result = await withTimeout(
        fetchNodeBrowserStatusForNode(normalizedNodeId, "user"),
      );
      const status = result?.status && typeof result.status === "object" ? result.status : null;
      setBrowserStatusByNodeId((prev) => ({
        ...prev,
        [normalizedNodeId]: status,
      }));
    } catch (error) {
      const message = error.message || "Could not check node browser status";
      setBrowserErrorByNodeId((prev) => ({
        ...prev,
        [normalizedNodeId]: message,
      }));
      if (!silent) {
        showToast(message, "error");
      }
    } finally {
      setCheckingBrowserNodeId("");
    }
  };

  useEffect(() => {
    if (checkingBrowserNodeId) return;
    for (const node of nodes) {
      const nodeId = String(node?.nodeId || "").trim();
      if (!nodeId) continue;
      if (!node?.connected || !isBrowserCapableNode(node)) continue;
      if (autoCheckedNodeIdsRef.current.has(nodeId)) continue;
      autoCheckedNodeIdsRef.current.add(nodeId);
      handleCheckNodeBrowser(nodeId, { silent: true });
      break;
    }
  }, [checkingBrowserNodeId, nodes]);

  return html`
  <div class="space-y-3">
    ${pending.length
      ? html`
          <div class="bg-surface border border-yellow-500/40 rounded-xl px-4 py-3 text-xs text-yellow-300">
            ${pending.length} pending node${pending.length === 1 ? "" : "s"} waiting for approval.
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
            <div class="bg-surface border border-border rounded-xl p-4 text-xs text-red-400">
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
                ${nodes.map(
                  (node) => {
                    const nodeId = String(node?.nodeId || "").trim();
                    const browserStatus = browserStatusByNodeId[nodeId] || null;
                    const browserError = browserErrorByNodeId[nodeId] || "";
                    const checkingBrowser = checkingBrowserNodeId === nodeId;
                    const canCheckBrowser =
                      node?.connected && isBrowserCapableNode(node) && nodeId;
                    const hasBrowserCheckResult = !!browserStatus || !!browserError;
                    const showBrowserCheckButton =
                      canCheckBrowser && !checkingBrowser && !hasBrowserCheckResult;
                    return html`
                    <div class="bg-surface border border-border rounded-xl p-4 space-y-3">
                      <div class="flex items-center justify-between gap-2">
                        <div class="min-w-0">
                          <div class="text-sm font-medium truncate">
                            ${node?.displayName || node?.nodeId || "Unnamed node"}
                          </div>
                          <div class="text-[11px] text-gray-500 font-mono truncate">
                            ${node?.nodeId || ""}
                          </div>
                        </div>
                        ${renderNodeStatusBadge(node)}
                      </div>
                      <div class="flex flex-wrap gap-2 text-[11px] text-gray-500">
                        <span>platform: <code>${node?.platform || "unknown"}</code></span>
                        <span>version: <code>${node?.version || "unknown"}</code></span>
                        <span>
                          caps:
                          <code>${Array.isArray(node?.caps) ? node.caps.join(", ") : "none"}</code>
                        </span>
                      </div>
                      ${canCheckBrowser
                        ? html`
                            <div class="space-y-2">
                              <div class="ac-surface-inset rounded-lg px-3 py-2 space-y-2">
                                <div class="flex items-start justify-between gap-2">
                                  <div class="space-y-0.5">
                                    <div class="text-sm font-medium">Browser</div>
                                    <div class="text-[11px] text-gray-500">
                                      profile: <code>user</code>
                                    </div>
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
                                    ${checkingBrowser
                                      ? html`
                                          <${LoadingSpinner} className="h-3.5 w-3.5" />
                                        `
                                      : null}
                                    ${showBrowserCheckButton
                                      ? html`
                                          <${ActionButton}
                                            onClick=${() => handleCheckNodeBrowser(nodeId)}
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
                                      <div class="flex flex-wrap gap-2 text-[11px] text-gray-500">
                                        <span>tabs: <code>${Number(browserStatus?.tabCount || 0)}</code></span>
                                        <span>driver: <code>${browserStatus?.driver || "unknown"}</code></span>
                                        <span>transport: <code>${browserStatus?.transport || "unknown"}</code></span>
                                      </div>
                                    `
                                  : null}
                                ${browserError
                                  ? html`<div class="text-[11px] text-red-400">${browserError}</div>`
                                  : null}
                              </div>
                            </div>
                          `
                        : null}
                      ${node?.paired && !node?.connected && connectInfo
                        ? html`
                            <div class="border-t border-border pt-2 space-y-2">
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
                                    handleCopyCommand(
                                      buildReconnectCommand({
                                        node,
                                        connectInfo,
                                        maskToken: false,
                                      }),
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
                  },
                )}
              </div>
            `}
  </div>
`;
};
