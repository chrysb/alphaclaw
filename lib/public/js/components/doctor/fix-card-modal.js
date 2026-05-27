import { h } from "preact";
import htm from "htm";
import { sendDoctorCardFix, updateDoctorCardStatus } from "../../lib/api.js";
import { showToast } from "../toast.js";
import { AgentSendModal } from "../agent-send-modal.js";

const html = htm.bind(h);

export const DoctorFixCardModal = ({
  visible = false,
  card = null,
  onClose = () => {},
  onComplete = () => {},
}) => {
  const handleSend = async ({ selectedSession, message }) => {
    if (!card?.id) return false;
    try {
      await sendDoctorCardFix({
        cardId: card.id,
        sessionId: selectedSession?.sessionId || "",
        replyChannel: selectedSession?.replyChannel || "",
        replyTo: selectedSession?.replyTo || "",
        prompt: message,
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
      loadingLabel="Sending..."
      onClose=${onClose}
      onSubmit=${handleSend}
    />
  `;
};
