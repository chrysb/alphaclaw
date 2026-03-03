import { h } from "https://esm.sh/preact";
import { useEffect, useState } from "https://esm.sh/preact/hooks";
import htm from "https://esm.sh/htm";
import { ActionButton } from "../action-button.js";
import { ModalShell } from "../modal-shell.js";
import { PageHeader } from "../page-header.js";
import { CloseIcon } from "../icons.js";

const html = htm.bind(h);

export const AddGoogleAccountModal = ({
  visible,
  onClose,
  onSubmit,
  loading = false,
  defaultEmail = "",
  title = "Add Company Account",
}) => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!visible) return;
    setEmail(String(defaultEmail || ""));
    setError("");
  }, [visible, defaultEmail]);

  if (!visible) return null;

  const submit = async () => {
    setError("");
    const nextEmail = String(email || "").trim();
    if (!nextEmail) {
      setError("Email is required");
      return;
    }
    await onSubmit?.({
      email: nextEmail,
      setError,
    });
  };

  return html`<${ModalShell}
    visible=${visible}
    onClose=${onClose}
    closeOnOverlayClick=${false}
    panelClassName="bg-modal border border-border rounded-xl p-6 max-w-md w-full space-y-4"
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
      <div>
        <label class="text-sm text-gray-400 block mb-1"
          >Email (Google account to authorize)</label
        >
        <p class="text-xs text-gray-500 mb-2">
          This adds another account to the same company workspace. Only one company workspace is supported.
        </p>
        <input
          type="email"
          value=${email}
          onInput=${(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          class="w-full bg-black/40 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-500"
        />
      </div>
      ${error ? html`<div class="text-red-400 text-xs">${error}</div>` : null}
    </div>
    <div class="pt-2">
      <${ActionButton}
        onClick=${submit}
        disabled=${loading}
        loading=${loading}
        tone="primary"
        size="lg"
        idleLabel="Add Account"
        loadingLabel="Saving..."
        className="w-full px-4 py-2 rounded-lg text-sm"
      />
    </div>
  </${ModalShell}>`;
};
