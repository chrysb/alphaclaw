import { h } from "https://esm.sh/preact";
import { useEffect, useState } from "https://esm.sh/preact/hooks";
import htm from "https://esm.sh/htm";
import { ActionButton } from "../action-button.js";

const html = htm.bind(h);

const kPropertyRowClass =
  "flex items-start justify-between gap-4 py-2.5 border-b border-border last:border-b-0";
const kLabelClass = "text-xs text-gray-400 shrink-0 w-28";
const kValueClass = "text-sm text-gray-200 text-right min-w-0 break-all";

const normalizeIdentity = (identity = {}) => ({
  name: String(identity?.name || "").trim(),
  emoji: String(identity?.emoji || "").trim(),
  avatar: String(identity?.avatar || "").trim(),
  theme: String(identity?.theme || "").trim(),
});

export const AgentIdentitySection = ({
  agent = {},
  saving = false,
  onUpdateAgent = async () => {},
}) => {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(() => normalizeIdentity(agent.identity));
  const [error, setError] = useState("");

  useEffect(() => {
    setEditing(false);
    setError("");
    setForm(normalizeIdentity(agent.identity));
  }, [agent.id, agent.identity]);

  const identity = normalizeIdentity(agent.identity);

  const updateField = (key, value) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const handleSave = async () => {
    setError("");
    try {
      const nextIdentity = normalizeIdentity(form);
      await onUpdateAgent(String(agent.id || "").trim(), {
        identity: nextIdentity,
      });
      setEditing(false);
    } catch (nextError) {
      setError(nextError.message || "Could not save identity");
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setError("");
    setForm(normalizeIdentity(agent.identity));
  };

  return html`
    <div class="bg-surface border border-border rounded-xl p-4">
      <div class="flex items-center justify-between gap-3 mb-3">
        <h3 class="card-label">Identity</h3>
        ${editing
          ? html`
              <div class="flex items-center gap-2">
                <${ActionButton}
                  onClick=${handleCancel}
                  disabled=${saving}
                  tone="secondary"
                  size="sm"
                  idleLabel="Cancel"
                />
                <${ActionButton}
                  onClick=${handleSave}
                  disabled=${saving}
                  loading=${saving}
                  tone="primary"
                  size="sm"
                  idleLabel="Save"
                  loadingLabel="Saving..."
                />
              </div>
            `
          : html`
              <${ActionButton}
                onClick=${() => setEditing(true)}
                disabled=${saving}
                tone="secondary"
                size="sm"
                idleLabel="Edit identity"
              />
            `}
      </div>

      ${editing
        ? html`
            <div class="space-y-3">
              <label class="block space-y-1">
                <span class="text-xs text-gray-400">Identity name</span>
                <input
                  type="text"
                  value=${form.name}
                  onInput=${(event) => updateField("name", event.target.value)}
                  class="w-full bg-black/30 border border-border rounded-lg px-3 py-2 text-sm text-gray-200 outline-none focus:border-gray-500"
                  placeholder="Optional persona name"
                />
              </label>
              <label class="block space-y-1">
                <span class="text-xs text-gray-400">Emoji</span>
                <input
                  type="text"
                  value=${form.emoji}
                  onInput=${(event) => updateField("emoji", event.target.value)}
                  class="w-full bg-black/30 border border-border rounded-lg px-3 py-2 text-sm text-gray-200 outline-none focus:border-gray-500"
                  placeholder="Optional emoji"
                />
              </label>
              <label class="block space-y-1">
                <span class="text-xs text-gray-400">Avatar</span>
                <input
                  type="text"
                  value=${form.avatar}
                  onInput=${(event) => updateField("avatar", event.target.value)}
                  class="w-full bg-black/30 border border-border rounded-lg px-3 py-2 text-sm text-gray-200 outline-none focus:border-gray-500"
                  placeholder="Workspace-relative path, URL, or data URI"
                />
              </label>
              <label class="block space-y-1">
                <span class="text-xs text-gray-400">Theme</span>
                <input
                  type="text"
                  value=${form.theme}
                  onInput=${(event) => updateField("theme", event.target.value)}
                  class="w-full bg-black/30 border border-border rounded-lg px-3 py-2 text-sm text-gray-200 outline-none focus:border-gray-500"
                  placeholder="Optional persona theme"
                />
              </label>
              ${error ? html`<p class="text-xs text-red-400">${error}</p>` : null}
            </div>
          `
        : html`
            <div class="divide-y divide-border">
              <div class=${kPropertyRowClass}>
                <span class=${kLabelClass}>Name</span>
                <span class=${kValueClass}>
                  ${identity.name || html`<span class="text-gray-500">—</span>`}
                </span>
              </div>
              <div class=${kPropertyRowClass}>
                <span class=${kLabelClass}>Emoji</span>
                <span class=${kValueClass}>
                  ${identity.emoji || html`<span class="text-gray-500">—</span>`}
                </span>
              </div>
              <div class=${kPropertyRowClass}>
                <span class=${kLabelClass}>Avatar</span>
                <span class="${kValueClass} font-mono">
                  ${identity.avatar || html`<span class="text-gray-500">—</span>`}
                </span>
              </div>
              <div class=${kPropertyRowClass}>
                <span class=${kLabelClass}>Theme</span>
                <span class=${kValueClass}>
                  ${identity.theme || html`<span class="text-gray-500">—</span>`}
                </span>
              </div>
            </div>
          `}
    </div>
  `;
};
