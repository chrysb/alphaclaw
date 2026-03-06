import { h } from "https://esm.sh/preact";
import { useEffect, useState } from "https://esm.sh/preact/hooks";
import htm from "https://esm.sh/htm";
import { ModalShell } from "../modal-shell.js";
import { ActionButton } from "../action-button.js";
import { sendDoctorCardFix, updateDoctorCardStatus } from "../../lib/api.js";
import { showToast } from "../toast.js";
import { useAgentSessions } from "../../hooks/useAgentSessions.js";

const html = htm.bind(h);

export const DoctorFixCardModal = ({
  visible = false,
  card = null,
  onClose = () => {},
  onComplete = () => {},
}) => {
  const {
    sessions,
    selectedSessionKey,
    setSelectedSessionKey,
    selectedSession,
    loading: loadingSessions,
    error: loadError,
  } = useAgentSessions({ enabled: visible });

  const [sending, setSending] = useState(false);
  const [promptText, setPromptText] = useState("");

  useEffect(() => {
    if (!visible) return;
    setPromptText(String(card?.fixPrompt || ""));
  }, [visible, card?.fixPrompt, card?.id]);

  const handleSend = async () => {
    if (!card?.id || sending) return;
    try {
      setSending(true);
      await sendDoctorCardFix({
        cardId: card.id,
        sessionId: selectedSession?.sessionId || "",
        replyChannel: selectedSession?.replyChannel || "",
        replyTo: selectedSession?.replyTo || "",
        prompt: promptText,
      });
      try {
        await updateDoctorCardStatus({ cardId: card.id, status: "fixed" });
        showToast(
          "Doctor fix request sent and finding marked fixed",
          "success",
        );
      } catch (statusError) {
        showToast(
          statusError.message ||
            "Doctor fix request sent, but could not mark the finding fixed",
          "warning",
        );
      }
      await onComplete();
      onClose();
    } catch (error) {
      showToast(error.message || "Could not send Doctor fix request", "error");
    } finally {
      setSending(false);
    }
  };

  return html`
    <${ModalShell}
      visible=${visible}
      onClose=${onClose}
      panelClassName="bg-modal border border-border rounded-xl p-5 max-w-lg w-full space-y-4"
    >
      <div class="space-y-1">
        <h2 class="text-base font-semibold">Ask agent to fix</h2>
        <p class="text-xs text-gray-400">
          Send this Doctor finding to one of your agent sessions as a focused fix request.
        </p>
      </div>
      <div class="space-y-2">
        <label class="text-xs text-gray-500">Send to session</label>
        <select
          value=${selectedSessionKey}
          onChange=${(event) => setSelectedSessionKey(String(event.currentTarget?.value || ""))}
          disabled=${loadingSessions || sending}
          class="w-full bg-black/30 border border-border rounded-lg px-3 py-2 text-xs text-gray-200 focus:border-gray-500"
        >
          ${sessions.map(
            (sessionRow) => html`
              <option value=${String(sessionRow?.key || "")}>
                ${String(sessionRow?.label || sessionRow?.key || "Session")}
              </option>
            `,
          )}
        </select>
        ${
          loadingSessions
            ? html`<div class="text-xs text-gray-500">Loading sessions...</div>`
            : null
        }
        ${loadError ? html`<div class="text-xs text-red-400">${loadError}</div>` : null}
      </div>
      <div class="space-y-2">
        <label class="text-xs text-gray-500">Instructions</label>
        <textarea
          value=${promptText}
          onInput=${(event) => setPromptText(String(event.currentTarget?.value || ""))}
          disabled=${sending}
          rows="8"
          class="w-full bg-black/30 border border-border rounded-lg px-3 py-2 text-xs text-gray-200 focus:border-gray-500 font-mono leading-5"
        ></textarea>
      </div>
      <div class="flex items-center justify-end gap-2">
        <${ActionButton}
          onClick=${onClose}
          disabled=${sending}
          tone="secondary"
          size="md"
          idleLabel="Cancel"
        />
        <${ActionButton}
          onClick=${handleSend}
          disabled=${!selectedSession || loadingSessions || !!loadError || !String(promptText || "").trim()}
          loading=${sending}
          tone="primary"
          size="md"
          idleLabel="Send fix request"
          loadingLabel="Sending..."
        />
      </div>
    </${ModalShell}>
  `;
};
