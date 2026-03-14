import { h } from "https://esm.sh/preact";
import htm from "https://esm.sh/htm";
import { ActionButton } from "../../action-button.js";
import { Badge } from "../../badge.js";
import { FileCopyLineIcon } from "../../icons.js";
import { copyTextToClipboard } from "../../../lib/clipboard.js";
import { showToast } from "../../toast.js";

const html = htm.bind(h);

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

export const ConnectedNodesCard = ({
  nodes = [],
  pending = [],
  loading = false,
  error = "",
  onRefresh = () => {},
  connectInfo = null,
}) => {
  const handleCopyCommand = async (command) => {
    const copied = await copyTextToClipboard(command);
    if (copied) {
      showToast("Connection command copied", "success");
      return;
    }
    showToast("Could not copy connection command", "error");
  };

  return html`
  <div class="bg-surface border border-border rounded-xl p-4 space-y-3">
    <div class="flex items-center justify-between gap-2">
      <div class="space-y-1">
        <h3 class="font-semibold text-sm">Connected Nodes</h3>
        <p class="text-xs text-gray-500">
          Nodes can run <code>system.run</code> and browser proxy commands for this gateway.
        </p>
      </div>
      <${ActionButton}
        onClick=${onRefresh}
        idleLabel="Refresh"
        tone="secondary"
        size="sm"
      />
    </div>

    ${pending.length
      ? html`
          <div class="rounded-lg border border-yellow-500/40 bg-yellow-500/10 px-3 py-2 text-xs text-yellow-300">
            ${pending.length} pending node${pending.length === 1 ? "" : "s"} waiting for approval.
          </div>
        `
      : null}

    ${loading
      ? html`<div class="text-xs text-gray-500">Loading nodes...</div>`
      : error
        ? html`<div class="text-xs text-red-400">${error}</div>`
        : !nodes.length
          ? html`<div class="text-xs text-gray-500">No nodes are connected yet.</div>`
          : html`
              <div class="space-y-2">
                ${nodes.map(
                  (node) => html`
                    <div class="ac-surface-inset rounded-lg px-3 py-2 space-y-2">
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
                  `,
                )}
              </div>
            `}
  </div>
`;
};
