import { h } from "preact";
import { useEffect } from "preact/hooks";
import htm from "htm";
import { ActionButton } from "./action-button.js";

const html = htm.bind(h);

export const ConfirmDialog = ({
  visible = false,
  title = "Confirm action",
  message = "Are you sure you want to continue?",
  details = null,
  confirmLabel = "Confirm",
  confirmLoadingLabel = "Working...",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  confirmTone = "primary",
  confirmLoading = false,
  confirmDisabled = false,
}) => {
  useEffect(() => {
    if (!visible) return;

    const handleKeydown = (event) => {
      if (event.key === "Escape") {
        onCancel?.();
      }
    };

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [visible, onCancel]);

  if (!visible) return null;
  const actionTone = confirmTone === "warning" ? "warning" : "primary";

  return html`
    <div
      class="fixed inset-0 bg-overlay flex items-center justify-center p-4 z-50"
      onclick=${(event) => {
        if (event.target === event.currentTarget) onCancel?.();
      }}
    >
      <div class="bg-modal border border-border rounded-xl p-5 max-w-md w-full space-y-3">
        <h2 class="text-base font-semibold">${title}</h2>
        <p class="text-sm text-fg-muted">${message}</p>
        ${details}
        <div class="pt-1 flex items-center justify-end gap-2">
          <${ActionButton}
            onClick=${onCancel}
            disabled=${confirmLoading}
            tone="secondary"
            size="md"
            idleLabel=${cancelLabel}
            className="px-4 py-2 rounded-lg text-sm"
          />
          <${ActionButton}
            onClick=${onConfirm}
            disabled=${confirmDisabled}
            loading=${confirmLoading}
            tone=${actionTone}
            size="md"
            idleLabel=${confirmLabel}
            loadingLabel=${confirmLoadingLabel}
            className="px-4 py-2 rounded-lg text-sm"
          />
        </div>
      </div>
    </div>
  `;
};
