import { h } from "https://esm.sh/preact";
import htm from "https://esm.sh/htm";
import {
  kNoDestinationSessionValue,
  useDestinationSessionSelection,
} from "../../../hooks/use-destination-session-selection.js";
import { ActionButton } from "../../action-button.js";
import { CloseIcon } from "../../icons.js";
import { ModalShell } from "../../modal-shell.js";
import { PageHeader } from "../../page-header.js";
import { SessionSelectField } from "../../session-select-field.js";

const html = htm.bind(h);

export const CreateWebhookModal = ({
  visible,
  name,
  mode = "webhook",
  onModeChange = () => {},
  onNameChange = () => {},
  canCreate = false,
  creating = false,
  onCreate = () => {},
  onClose = () => {},
}) => {
  const {
    sessions: selectableSessions,
    loading: loadingSessions,
    error: destinationLoadError,
    destinationSessionKey,
    setDestinationSessionKey,
    selectedDestination,
  } = useDestinationSessionSelection({
    enabled: visible,
    resetKey: String(visible),
  });

  const normalized = String(name || "")
    .trim()
    .toLowerCase();
  const previewName = normalized || "{name}";
  const previewPath = `/hooks/${previewName}`;
  const previewUrl =
    mode === "oauth"
      ? `${window.location.origin}/oauth/{id}`
      : `${window.location.origin}${previewPath}`;
  if (!visible) return null;

  return html`
    <${ModalShell}
      visible=${visible}
      onClose=${onClose}
      panelClassName="bg-modal border border-border rounded-xl p-5 max-w-lg w-full space-y-4"
    >
      <${PageHeader}
        title="Create Webhook"
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
      <div class="space-y-2">
        <p class="text-xs text-gray-500">Endpoint mode</p>
        <div class="flex items-center gap-2">
          <button
            class="text-xs px-2 py-1 rounded border transition-colors ${mode ===
            "webhook"
              ? "border-cyan-400 text-cyan-200 bg-cyan-400/10"
              : "border-border text-gray-400 hover:text-gray-200"}"
            onclick=${() => onModeChange("webhook")}
          >
            Webhook
          </button>
          <button
            class="text-xs px-2 py-1 rounded border transition-colors ${mode ===
            "oauth"
              ? "border-cyan-400 text-cyan-200 bg-cyan-400/10"
              : "border-border text-gray-400 hover:text-gray-200"}"
            onclick=${() => onModeChange("oauth")}
          >
            OAuth Callback
          </button>
        </div>
      </div>
      <div class="space-y-2">
        <p class="text-xs text-gray-500">Name</p>
        <input
          type="text"
          value=${name}
          placeholder="fathom"
          onInput=${(e) => onNameChange(e.target.value)}
          onKeyDown=${(e) => {
            if (e.key === "Enter" && canCreate && !creating) {
              onCreate(selectedDestination, mode);
            }
            if (e.key === "Escape") onClose();
          }}
          class="w-full bg-black/30 border border-border rounded-lg px-3 py-1.5 text-sm text-gray-200 outline-none focus:border-gray-500 font-mono"
        />
      </div>
      <${SessionSelectField}
        label="Deliver to"
        sessions=${selectableSessions}
        selectedSessionKey=${destinationSessionKey}
        onChangeSessionKey=${setDestinationSessionKey}
        disabled=${loadingSessions || creating}
        loading=${loadingSessions}
        error=${destinationLoadError}
        allowNone=${true}
        noneValue=${kNoDestinationSessionValue}
        noneLabel="Default"
        emptyStateText="No paired chat sessions found yet. You can still create the webhook without a default destination."
        loadingLabel="Loading destinations..."
      />
      <div class="border border-border rounded-lg overflow-hidden">
        <table class="w-full text-xs">
          <tbody>
            <tr class="border-b border-border">
              <td class="w-24 px-3 py-2 text-gray-500">Path</td>
              <td class="px-3 py-2 text-gray-300 font-mono">
                <code>${previewPath}</code>
              </td>
            </tr>
            <tr class="border-b border-border">
              <td class="w-24 px-3 py-2 text-gray-500">URL</td>
              <td class="px-3 py-2 text-gray-300 font-mono break-all">
                <code>${previewUrl}</code>
              </td>
            </tr>
            <tr>
              <td class="w-24 px-3 py-2 text-gray-500">Transform</td>
              <td class="px-3 py-2 text-gray-300 font-mono">
                <code>hooks/transforms/${previewName}/${previewName}-transform.mjs</code>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      ${mode === "oauth"
        ? html`
            <div class="space-y-1">
              <p class="text-xs text-gray-500">
                For OAuth providers that can't send auth headers. AlphaClaw
                injects webhook auth before forwarding to /hooks/{name}.
              </p>
            </div>
          `
        : null}
      <div class="pt-1 flex items-center justify-end gap-2">
        <${ActionButton}
          onClick=${onClose}
          tone="secondary"
          size="md"
          idleLabel="Cancel"
          className="px-4 py-2 rounded-lg text-sm"
        />
        <${ActionButton}
          onClick=${() => onCreate(selectedDestination, mode)}
          disabled=${!canCreate || creating}
          loading=${creating}
          tone="primary"
          size="md"
          idleLabel="Create"
          loadingLabel="Creating..."
          className="px-4 py-2 rounded-lg text-sm"
        />
      </div>
    </${ModalShell}>
  `;
};
