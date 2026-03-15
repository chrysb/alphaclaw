import { h } from "https://esm.sh/preact";
import { useEffect, useMemo, useState } from "https://esm.sh/preact/hooks";
import htm from "https://esm.sh/htm";
import { ActionButton } from "../action-button.js";
import { CloseIcon } from "../icons.js";
import { ModalShell } from "../modal-shell.js";
import { PageHeader } from "../page-header.js";

const html = htm.bind(h);

const kAgentIdPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const kWorkspaceFolderPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const slugifyAgentId = (value) =>
  String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const CreateAgentModal = ({
  visible = false,
  loading = false,
  onClose = () => {},
  onSubmit = () => {},
}) => {
  const [displayName, setDisplayName] = useState("");
  const [agentId, setAgentId] = useState("");
  const [workspaceSuffix, setWorkspaceSuffix] = useState("");
  const [error, setError] = useState("");
  const [idEditedManually, setIdEditedManually] = useState(false);
  const [workspaceEditedManually, setWorkspaceEditedManually] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setDisplayName("");
    setAgentId("");
    setWorkspaceSuffix("");
    setError("");
    setIdEditedManually(false);
    setWorkspaceEditedManually(false);
  }, [visible]);

  useEffect(() => {
    if (idEditedManually) return;
    const derivedId = slugifyAgentId(displayName);
    setAgentId(derivedId);
  }, [displayName, idEditedManually]);

  useEffect(() => {
    if (workspaceEditedManually) return;
    const trimmedId = String(agentId || "").trim();
    if (!trimmedId) {
      setWorkspaceSuffix("");
      return;
    }
    setWorkspaceSuffix(trimmedId);
  }, [agentId, workspaceEditedManually]);

  const workspaceFolder = useMemo(
    () => `workspace-${String(workspaceSuffix || "").trim()}`,
    [workspaceSuffix],
  );

  const canSubmit =
    String(displayName || "").trim().length > 0 &&
    kAgentIdPattern.test(String(agentId || "").trim()) &&
    kWorkspaceFolderPattern.test(String(workspaceSuffix || "").trim());

  if (!visible) return null;

  const submit = async () => {
    const nextDisplayName = String(displayName || "").trim();
    const nextAgentId = String(agentId || "").trim();
    const nextWorkspaceSuffix = String(workspaceSuffix || "").trim();
    const nextWorkspaceFolder = `workspace-${nextWorkspaceSuffix}`;

    if (!nextDisplayName) {
      setError("Display name is required");
      return;
    }
    if (!kAgentIdPattern.test(nextAgentId)) {
      setError("Agent ID must be lowercase letters, numbers, and hyphens");
      return;
    }
    if (!kWorkspaceFolderPattern.test(nextWorkspaceSuffix)) {
      setError("Workspace folder must be lowercase letters, numbers, and hyphens");
      return;
    }

    setError("");
    const payload = {
      name: nextDisplayName,
      id: nextAgentId,
      workspaceFolder: nextWorkspaceFolder,
    };
    await onSubmit(payload);
  };

  return html`
    <${ModalShell}
      visible=${visible}
      onClose=${onClose}
      panelClassName="bg-modal border border-border rounded-xl p-6 max-w-lg w-full space-y-4"
    >
      <${PageHeader}
        title="Add Agent"
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
        <label class="block space-y-1">
          <span class="text-xs text-gray-400">Display name</span>
          <input
            type="text"
            value=${displayName}
            onInput=${(event) => setDisplayName(event.target.value)}
            placeholder="Ops Agent"
            class="w-full bg-black/30 border border-border rounded-lg px-3 py-2 text-sm text-gray-200 outline-none focus:border-gray-500"
          />
        </label>

        <label class="block space-y-1">
          <span class="text-xs text-gray-400">Agent ID</span>
          <input
            type="text"
            value=${agentId}
            onInput=${(event) => {
              setIdEditedManually(true);
              setAgentId(slugifyAgentId(event.target.value));
            }}
            placeholder="ops-agent"
            class="w-full bg-black/30 border border-border rounded-lg px-3 py-2 text-sm font-mono text-gray-200 outline-none focus:border-gray-500"
          />
        </label>

        <label class="block space-y-1">
          <span class="text-xs text-gray-400">Workspace folder</span>
          <div class="flex items-center bg-black/30 border border-border rounded-lg focus-within:border-gray-500">
            <span class="px-3 py-2 text-xs font-mono text-gray-500 border-r border-border">
              .openclaw/workspace-
            </span>
            <input
              type="text"
              value=${workspaceSuffix}
              onInput=${(event) => {
                setWorkspaceEditedManually(true);
                setWorkspaceSuffix(slugifyAgentId(event.target.value));
              }}
              placeholder="ops-agent"
              class="flex-1 bg-transparent px-3 py-2 text-sm font-mono text-gray-200 outline-none"
            />
          </div>
        </label>

        ${error ? html`<p class="text-xs text-red-400">${error}</p>` : null}
      </div>

      <div class="flex justify-end gap-2 pt-1">
        <${ActionButton}
          onClick=${onClose}
          disabled=${loading}
          loading=${false}
          tone="secondary"
          size="md"
          idleLabel="Cancel"
        />
        <${ActionButton}
          onClick=${submit}
          disabled=${loading || !canSubmit}
          loading=${loading}
          tone="primary"
          size="md"
          idleLabel="Create Agent"
          loadingLabel="Creating..."
        />
      </div>
    </${ModalShell}>
  `;
};
