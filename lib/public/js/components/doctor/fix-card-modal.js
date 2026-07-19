import { h } from "preact";
import htm from "htm";
import { sendDoctorCardFix } from "../../lib/api.js";
import { showToast } from "../toast.js";
import { AgentSendModal } from "../agent-send-modal.js";

const html = htm.bind(h);

export const DoctorFixCardModal = ({
  visible = false,
  card = null,
  onClose = () => {},
  onComplete = () => {},
}) => {
  const handleSend = async ({ selectedSession, selectedSessionKey, message }) => {
    if (!card?.id) return false;
    try {
      await sendDoctorCardFix({
        cardId: card.id,
        sessionKey: selectedSessionKey,
        replyChannel: selectedSession?.replyChannel || "",
        replyTo: selectedSession?.replyTo || "",
        prompt: message,
      });
      showToast(
        "Doctor fix queued. The agent will mark it fixed after applying and verifying the change.",
        "success",
      );
      await onComplete();
      return true;
    } catch (error) {
      showToast(error.message || "Could not send Doctor fix request", "error");
      return false;
    }
  };

  return html`
    <${AgentSendModal}
      visible=${visible}
      title="Ask agent to fix"
      messageLabel="Instructions"
      initialMessage=${String(card?.fixPrompt || "")}
      resetKey=${String(card?.id || "")}
      submitLabel="Send fix request"
      loadingLabel="Queuing..."
      onClose=${onClose}
      onSubmit=${handleSend}
    />
  `;
};
