import { h } from "preact";
import { useState, useCallback } from "preact/hooks";
import htm from "htm";
import {
  fetchMcpInfo,
  startMcpBridge,
  stopMcpBridge,
} from "../../lib/api.js";
import { usePolling } from "../../hooks/usePolling.js";
import { showToast } from "../toast.js";
import { PageHeader } from "../page-header.js";
import { ActionButton } from "../action-button.js";
import { PaneShell } from "../pane-shell.js";

const html = htm.bind(h);

const kMcpTools = [
  { name: "conversations_list", desc: "List recent routed conversations with filters" },
  { name: "conversation_get", desc: "Return a single conversation by session key" },
  { name: "messages_read", desc: "Retrieve transcript history for a conversation" },
  { name: "attachments_fetch", desc: "Extract non-text content metadata from messages" },
  { name: "events_poll", desc: "Read queued live events since a cursor position" },
  { name: "events_wait", desc: "Long-poll for next matching event with timeout" },
  { name: "messages_send", desc: "Send text replies through existing routes" },
  { name: "permissions_list_open", desc: "List pending exec/plugin approval requests" },
  { name: "permissions_respond", desc: "Resolve approvals (allow-once, allow-always, deny)" },
];

const StatusDot = ({ active }) => html`
  <span
    class="inline-block w-2 h-2 rounded-full shrink-0 ${active
      ? "bg-green-500"
      : "bg-gray-600"}"
  />
`;

const buildConfigSnippet = ({ origin, token }) => {
  const encodedToken = encodeURIComponent(String(token || ""));
  const sseUrl = `${origin}/mcp/sse?token=${encodedToken}`;
  return JSON.stringify(
    {
      mcpServers: {
        openclaw: {
          url: sseUrl,
        },
      },
    },
    null,
    2,
  );
};

export const McpTab = () => {
  const [acting, setActing] = useState(false);

  const {
    data: info,
    refresh,
  } = usePolling(fetchMcpInfo, 8000, {
    cacheKey: "/api/mcp/info",
  });
  const loading = !info;

  const running = !!info?.running;
  const tokenAvailable = !!info?.tokenAvailable;
  const gatewayToken = info?.gatewayToken || "";

  const handleStart = useCallback(async () => {
    if (acting) return;
    setActing(true);
    try {
      const result = await startMcpBridge();
      if (result?.ok) {
        showToast(
          result.alreadyRunning
            ? "MCP bridge already running"
            : "MCP bridge started",
          "success",
        );
      } else {
        showToast("Failed to start MCP bridge", "error");
      }
      await refresh({ force: true });
    } catch (err) {
      showToast("Failed to start: " + err.message, "error");
    } finally {
      setActing(false);
    }
  }, [acting, refresh]);

  const handleStop = useCallback(async () => {
    if (acting) return;
    setActing(true);
    try {
      const result = await stopMcpBridge();
      if (result?.ok) {
        showToast("MCP bridge stopped", "success");
      } else {
        showToast("Failed to stop MCP bridge", "error");
      }
      await refresh({ force: true });
    } catch (err) {
      showToast("Failed to stop: " + err.message, "error");
    } finally {
      setActing(false);
    }
  }, [acting, refresh]);

  const handleCopy = useCallback(() => {
    const origin = window.location.origin;
    const snippet = buildConfigSnippet({ origin, token: gatewayToken });
    navigator.clipboard
      .writeText(snippet)
      .then(() => showToast("Copied to clipboard", "success"))
      .catch(() => showToast("Failed to copy", "error"));
  }, [gatewayToken]);

  const configSnippet = buildConfigSnippet({
    origin: typeof window !== "undefined" ? window.location.origin : "https://your-host",
    token: gatewayToken || "<gateway-token>",
  });

  if (loading && !info) {
    return html`
      <${PaneShell} header=${html`<${PageHeader} title="MCP" />`}>
        <div class="bg-surface border border-border rounded-xl p-4 text-sm text-fg-muted">
          Loading...
        </div>
      </${PaneShell}>
    `;
  }

  return html`
    <${PaneShell}
      header=${html`
        <${PageHeader}
          title="MCP"
          actions=${html`
            ${running
              ? html`<${ActionButton}
                  onClick=${handleStop}
                  disabled=${acting}
                  loading=${acting}
                  loadingMode="inline"
                  tone="secondary"
                  size="sm"
                  idleLabel="Stop bridge"
                  loadingLabel="Stopping…"
                  className="text-xs"
                />`
              : html`<${ActionButton}
                  onClick=${handleStart}
                  disabled=${acting}
                  loading=${acting}
                  loadingMode="inline"
                  tone="primary"
                  size="sm"
                  idleLabel="Start bridge"
                  loadingLabel="Starting…"
                  className="text-xs"
                />`}
          `}
        />
      `}
    >
      <!-- Status -->
      <div class="bg-surface border border-border rounded-xl overflow-hidden">
        <h3 class="card-label text-xs px-4 pt-3 pb-2">Status</h3>
        <div class="px-4 pb-3 space-y-2">
          <div class="flex items-center gap-2 text-sm">
            <${StatusDot} active=${running} />
            <span class="text-body">
              MCP Bridge: ${running ? "Running" : "Stopped"}
            </span>
            ${running && info?.pid
              ? html`<span class="text-fg-dim text-xs">(PID ${info.pid})</span>`
              : null}
          </div>
          <div class="flex items-center gap-2 text-sm">
            <${StatusDot} active=${tokenAvailable} />
            <span class="text-body">
              Gateway token: ${tokenAvailable ? "Configured" : "Not set"}
            </span>
          </div>
          ${info?.gatewayWsUrl
            ? html`<div class="text-xs text-fg-dim">
                Gateway: <code class="bg-field px-1 rounded">${info.gatewayWsUrl}</code>
              </div>`
            : null}
        </div>
      </div>

      <!-- Config Snippet -->
      <div class="bg-surface border border-border rounded-xl overflow-hidden">
        <div class="flex items-center justify-between px-4 pt-3 pb-2">
          <h3 class="card-label text-xs">Client Config</h3>
          <button
            onclick=${handleCopy}
            class="text-xs px-2 py-0.5 rounded border border-border text-fg-muted hover:text-body hover:border-fg-muted"
          >
            Copy
          </button>
        </div>
        <div class="px-4 pb-3">
          <p class="text-xs text-fg-dim mb-2">
            Add this to your MCP client config (Cursor, Claude Desktop, etc.):
          </p>
          <pre
            class="bg-field border border-border rounded-lg p-3 text-xs text-body font-mono overflow-x-auto whitespace-pre"
          >${configSnippet}</pre>
          ${!running
            ? html`<p class="text-xs text-status-warning-muted mt-2">
                Start the MCP bridge above before connecting a client.
              </p>`
            : null}
        </div>
      </div>

      <!-- Available Tools -->
      <div class="bg-surface border border-border rounded-xl overflow-hidden">
        <h3 class="card-label text-xs px-4 pt-3 pb-2">Available Tools</h3>
        <div class="divide-y divide-border">
          ${kMcpTools.map(
            (tool) => html`
              <div class="flex items-start gap-3 px-4 py-2">
                <code class="text-xs shrink-0 pt-0.5" style="min-width: 170px"
                  >${tool.name}</code
                >
                <span class="text-xs text-fg-dim">${tool.desc}</span>
              </div>
            `,
          )}
        </div>
      </div>
    </${PaneShell}>
  `;
};
