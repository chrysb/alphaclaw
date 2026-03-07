import { h } from "https://esm.sh/preact";
import { useEffect, useState } from "https://esm.sh/preact/hooks";
import htm from "https://esm.sh/htm";
import { ModalShell } from "./modal-shell.js";
import { ActionButton } from "./action-button.js";
import { PageHeader } from "./page-header.js";
import { CloseIcon } from "./icons.js";
import { useAgentSessions } from "../hooks/useAgentSessions.js";

const html = htm.bind(h);

export const AgentSendModal = ({
  visible = false,
  title = "Send to agent",
  messageLabel = "Message",
  messageRows = 8,
  initialMessage = "",
  resetKey = "",
  submitLabel = "Send message",
  loadingLabel = "Sending...",
  cancelLabel = "Cancel",
  onClose = () => {},
  onSubmit = async () => true,
  sessionFilter = undefined,
}) => {
  const {
    sessions,
    selectedSessionKey,
    setSelectedSessionKey,
    selectedSession,
    loading: loadingSessions,
    error: loadError,
  } = useAgentSessions({ enabled: visible, filter: sessionFilter });
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setMessageText(String(initialMessage || ""));
  }, [visible, initialMessage, resetKey]);

  const handleSend = async () => {
    if (!selectedSession || sending) return;
    const trimmedMessage = String(messageText || "").trim();
    if (!trimmedMessage) return;
    setSending(true);
    try {
      const shouldClose = await onSubmit({
        selectedSession,
        selectedSessionKey,
        message: trimmedMessage,
      });
      if (shouldClose !== false) {
        onClose();
      }
    } finally {
      setSending(false);
    }
  };

  return html`
    <${ModalShell}
      visible=${visible}
      onClose=${() => {
        if (sending) return;
        onClose();
      }}
      panelClassName="bg-modal border border-border rounded-xl p-5 max-w-lg w-full space-y-4"
    >
      <${PageHeader}
        title=${title}
        actions=${html`
          <button
            type="button"
            onclick=${() => {
              if (sending) return;
              onClose();
            }}
            class="h-8 w-8 inline-flex items-center justify-center rounded-lg ac-btn-secondary"
            aria-label="Close modal"
          >
            <${CloseIcon} className="w-3.5 h-3.5 text-gray-300" />
          </button>
        `}
      />
      <div class="space-y-2">
        <label class="text-xs text-gray-500">Send to session</label>
        <select
          value=${selectedSessionKey}
          onChange=${(event) =>
            setSelectedSessionKey(String(event.currentTarget?.value || ""))}
          disabled=${loadingSessions || sending}
          class="w-full bg-black/30 border border-border rounded-lg px-3 py-2 text-xs text-gray-200 focus:border-gray-500"
        >
          ${sessions.length === 0
            ? html`<option value="">No sessions available</option>`
            : null}
          ${sessions.map(
            (sessionRow) => html`
              <option value=${String(sessionRow?.key || "")}>
                ${String(sessionRow?.label || sessionRow?.key || "Session")}
              </option>
            `,
          )}
        </select>
        ${loadingSessions
          ? html`<div class="text-xs text-gray-500">Loading sessions...</div>`
          : null}
        ${loadError ? html`<div class="text-xs text-red-400">${loadError}</div>` : null}
      </div>
      <div class="space-y-2">
        <label class="text-xs text-gray-500">${messageLabel}</label>
        <textarea
          value=${messageText}
          onInput=${(event) =>
            setMessageText(String(event.currentTarget?.value || ""))}
          disabled=${sending}
          rows=${messageRows}
          class="w-full bg-black/30 border border-border rounded-lg px-3 py-2 text-xs text-gray-200 focus:border-gray-500 font-mono leading-5"
        ></textarea>
      </div>
      <div class="flex items-center justify-end gap-2">
        <${ActionButton}
          onClick=${onClose}
          disabled=${sending}
          tone="secondary"
          size="md"
          idleLabel=${cancelLabel}
        />
        <${ActionButton}
          onClick=${handleSend}
          disabled=${!selectedSession || loadingSessions || !!loadError || !String(messageText || "").trim()}
          loading=${sending}
          tone="primary"
          size="md"
          idleLabel=${submitLabel}
          loadingLabel=${loadingLabel}
        />
      </div>
    </${ModalShell}>
  `;
};
