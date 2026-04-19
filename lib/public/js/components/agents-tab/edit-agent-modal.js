import { h } from "preact";
import { useEffect, useState } from "preact/hooks";
import htm from "htm";
import { ActionButton } from "../action-button.js";
import { CloseIcon } from "../icons.js";
import { ModalShell } from "../modal-shell.js";
import { PageHeader } from "../page-header.js";

const html = htm.bind(h);

export const EditAgentModal = ({
  visible = false,
  loading = false,
  agent = null,
  onClose = () => {},
  onSubmit = () => {},
}) => {
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!visible) return;
    setName(String(agent?.name || ""));
    setError("");
  }, [visible, agent]);

  if (!visible) return null;

  const submit = async () => {
    const nextName = String(name || "").trim();
    if (!nextName) {
      setError("Display name is required");
      return;
    }
    setError("");
    await onSubmit({
      id: String(agent?.id || "").trim(),
      patch: {
        name: nextName,
      },
    });
  };

  return html`
    <${ModalShell}
      visible=${visible}
      onClose=${onClose}
      panelClassName="bg-modal border border-border rounded-xl p-6 max-w-lg w-full space-y-4"
    >
      <${PageHeader}
        title="Edit Agent"
        actions=${html`
          <button
            type="button"
            onclick=${onClose}
            class="h-8 w-8 inline-flex items-center justify-center rounded-lg ac-btn-secondary"
            aria-label="Close modal"
          >
            <${CloseIcon} className="w-3.5 h-3.5 text-body" />
          </button>
        `}
      />

      <div class="space-y-3">
        <label class="block space-y-1">
          <span class="text-xs text-fg-muted">Display name</span>
          <input
            type="text"
            value=${name}
            onInput=${(event) => setName(event.target.value)}
            class="w-full bg-field border border-border rounded-lg px-3 py-2 text-sm text-body outline-none focus:border-fg-muted"
          />
        </label>

        <label class="block space-y-1">
          <span class="text-xs text-fg-muted">Agent ID</span>
          <input
            type="text"
            value=${String(agent?.id || "")}
            disabled=${true}
            class="w-full bg-field border border-border rounded-lg px-3 py-2 text-sm font-mono text-fg-muted outline-none"
          />
        </label>

        ${error ? html`<p class="text-xs text-status-error-muted">${error}</p>` : null}
      </div>

      <div class="flex justify-end gap-2 pt-1">
        <${ActionButton}
          onClick=${onClose}
          disabled=${loading}
          loading=${false}
          tone="secondary"
          size="sm"
          idleLabel="Cancel"
        />
        <${ActionButton}
          onClick=${submit}
          disabled=${loading}
          loading=${loading}
          tone="primary"
          size="sm"
          idleLabel="Save"
          loadingLabel="Saving..."
        />
      </div>
    </${ModalShell}>
  `;
};
