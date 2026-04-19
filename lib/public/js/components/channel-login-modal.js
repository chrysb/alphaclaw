import { h } from "https://esm.sh/preact";
import htm from "https://esm.sh/htm";
import { ActionButton } from "./action-button.js";
import { CloseIcon } from "./icons.js";
import { ModalShell } from "./modal-shell.js";
import { PageHeader } from "./page-header.js";

const html = htm.bind(h);

export const ChannelLoginModal = ({
  visible = false,
  loading = false,
  title = "Link Channel",
  output = "",
  error = "",
  runDisabled = false,
  runLabel = "Generate QR",
  runLoadingLabel = "Running...",
  closeLabel = "Close",
  onRun = async () => {},
  onClose = () => {},
}) => {
  if (!visible) return null;
  const hasOutput = !!String(output || "").trim();
  const hasError = !!String(error || "").trim();
  const displayOutput = hasOutput
    ? String(output)
    : hasError
      ? String(error)
      : "No output yet. Generate QR to start login.";
  return html`
    <${ModalShell}
      visible=${visible}
      onClose=${onClose}
      panelClassName="bg-modal border border-border rounded-xl p-6 max-w-2xl w-full space-y-4"
    >
      <${PageHeader}
        title=${title}
        actions=${html`
          <button
            type="button"
            onclick=${onClose}
            class="h-8 w-8 inline-flex items-center justify-center rounded-lg ac-btn-secondary"
            aria-label="Close modal"
          >
            <${CloseIcon} className="w-3.5 h-3.5 text-gray-300" />
          </button>
        `}
      />
      <div class="space-y-3">
        <p class="text-xs text-gray-500">
          Click "Generate QR" to run channel login and capture terminal output.
        </p>
        <textarea
          readonly
          wrap="off"
          value=${displayOutput}
          class="w-full h-[440px] max-h-[70vh] text-[11px] leading-[1.1] font-mono text-gray-300 bg-black/30 border border-border rounded-lg p-3 outline-none resize-y overflow-auto"
        />
      </div>
      <div class="flex justify-end gap-2 pt-1">
        <${ActionButton}
          onClick=${onClose}
          disabled=${loading}
          loading=${false}
          tone="secondary"
          size="sm"
          idleLabel=${closeLabel}
        />
        <${ActionButton}
          onClick=${onRun}
          disabled=${loading || runDisabled}
          loading=${loading}
          tone="primary"
          size="sm"
          idleLabel=${runLabel}
          loadingLabel=${runLoadingLabel}
        />
      </div>
    </${ModalShell}>
  `;
};
