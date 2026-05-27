import { h } from "preact";
import htm from "htm";
import { ActionButton } from "./action-button.js";

const html = htm.bind(h);

export const UpdateActionButton = ({
  onClick,
  disabled = false,
  loading = false,
  warning = false,
  idleLabel = "Check updates",
  loadingLabel = "Checking...",
  className = "",
}) => html`
  <${ActionButton}
    onClick=${onClick}
    disabled=${disabled}
    loading=${loading}
    tone=${warning ? "warning" : "neutral"}
    size="sm"
    idleLabel=${idleLabel}
    loadingLabel=${loadingLabel}
    className=${className}
  />
`;
