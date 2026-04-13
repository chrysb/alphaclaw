import { h } from "preact";
import { useEffect } from "preact/hooks";
import { createPortal } from "preact/compat";
import htm from "htm";

const html = htm.bind(h);

export const ModalShell = ({
  visible = false,
  onClose = () => {},
  closeOnOverlayClick = true,
  closeOnEscape = true,
  panelClassName = "bg-modal border border-border rounded-xl p-5 max-w-md w-full space-y-3",
  children = null,
}) => {
  useEffect(() => {
    if (!visible || !closeOnEscape) return;

    const handleKeydown = (event) => {
      if (event.key === "Escape") onClose?.();
    };

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [visible, closeOnEscape, onClose]);

  if (!visible) return null;

  return createPortal(
    html`
      <div
        class="fixed inset-0 bg-overlay flex items-start justify-center overflow-y-auto p-4 sm:items-center z-50"
        onclick=${(event) => {
          if (closeOnOverlayClick && event.target === event.currentTarget) onClose?.();
        }}
      >
        <div class=${panelClassName}>${children}</div>
      </div>
    `,
    document.body,
  );
};
