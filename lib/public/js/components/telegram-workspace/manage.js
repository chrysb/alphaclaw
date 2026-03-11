import { h } from "https://esm.sh/preact";
import { useState, useEffect } from "https://esm.sh/preact/hooks";
import htm from "https://esm.sh/htm";
import { showToast } from "../toast.js";
import { ActionButton } from "../action-button.js";
import { ConfirmDialog } from "../confirm-dialog.js";
import * as api from "../../lib/telegram-api.js";
import { fetchAgents } from "../../lib/api.js";

const html = htm.bind(h);

const AgentSelect = ({ value, agents, onChange, className = "" }) => html`
  <select
    value=${value}
    onChange=${(e) => onChange(e.target.value)}
    class="bg-black/30 border border-border rounded-lg px-2 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-gray-500 ${className}"
  >
    <option value="">Default</option>
    ${agents.map(
      (a) => html`<option value=${a.id}>${a.name || a.id}</option>`,
    )}
  </select>
`;

export const ManageTelegramWorkspace = ({
  accountId,
  groupId,
  groupName,
  initialTopics,
  configAgentMaxConcurrent,
  configSubagentMaxConcurrent,
  debugEnabled,
  onResetOnboarding,
}) => {
  const [topics, setTopics] = useState(initialTopics || {});
  const [newTopicName, setNewTopicName] = useState("");
  const [newTopicInstructions, setNewTopicInstructions] = useState("");
  const [newTopicAgentId, setNewTopicAgentId] = useState("");
  const [showCreateTopic, setShowCreateTopic] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [editingTopicId, setEditingTopicId] = useState("");
  const [editingTopicName, setEditingTopicName] = useState("");
  const [editingTopicInstructions, setEditingTopicInstructions] = useState("");
  const [editingTopicAgentId, setEditingTopicAgentId] = useState("");
  const [renamingTopicId, setRenamingTopicId] = useState("");
  const [error, setError] = useState(null);
  const [deleteTopicConfirm, setDeleteTopicConfirm] = useState(null);
  const [agents, setAgents] = useState([]);

  const loadTopics = async () => {
    const data = await api.listTopics(groupId, { accountId });
    if (data.ok) setTopics(data.topics || {});
  };

  useEffect(() => {
    loadTopics();
  }, [groupId]);
  useEffect(() => {
    if (initialTopics && Object.keys(initialTopics).length > 0) {
      setTopics(initialTopics);
    }
  }, [initialTopics]);

  useEffect(() => {
    fetchAgents()
      .then((data) => setAgents(Array.isArray(data?.agents) ? data.agents : []))
      .catch(() => {});
  }, []);

  const createSingle = async () => {
    const name = newTopicName.trim();
    const systemInstructions = newTopicInstructions.trim();
    const agentId = newTopicAgentId.trim();
    if (!name) return;
    setCreating(true);
    setError(null);
    try {
      const data = await api.createTopicsBulk(groupId, [
        {
          name,
          ...(systemInstructions ? { systemInstructions } : {}),
          ...(agentId ? { agentId } : {}),
        },
      ], { accountId });
      if (!data.ok)
        throw new Error(data.results?.[0]?.error || "Failed to create topic");
      const failed = data.results.filter((r) => !r.ok);
      if (failed.length > 0) throw new Error(failed[0].error);
      setNewTopicName("");
      setNewTopicInstructions("");
      setNewTopicAgentId("");
      setShowCreateTopic(false);
      await loadTopics();
      showToast(`Created topic: ${name}`, "success");
    } catch (e) {
      setError(e.message);
    }
    setCreating(false);
  };

  const handleDelete = async (topicId, topicName) => {
    setDeleting(topicId);
    try {
      const data = await api.deleteTopic(groupId, topicId, { accountId });
      if (!data.ok) throw new Error(data.error);
      await loadTopics();
      if (data.removedFromRegistryOnly) {
        showToast(`Removed stale topic from registry: ${topicName}`, "success");
      } else {
        showToast(`Deleted topic: ${topicName}`, "success");
      }
    } catch (e) {
      showToast(`Failed to delete: ${e.message}`, "error");
    }
    setDeleting(null);
  };

  const startRename = (topicId, topicName, topicInstructions = "", topicAgentId = "") => {
    setEditingTopicId(String(topicId));
    setEditingTopicName(String(topicName || ""));
    setEditingTopicInstructions(String(topicInstructions || ""));
    setEditingTopicAgentId(String(topicAgentId || ""));
  };

  const cancelRename = () => {
    setEditingTopicId("");
    setEditingTopicName("");
    setEditingTopicInstructions("");
    setEditingTopicAgentId("");
  };

  const saveRename = async (topicId) => {
    const nextName = editingTopicName.trim();
    const nextSystemInstructions = editingTopicInstructions.trim();
    const nextAgentId = editingTopicAgentId.trim();
    if (!nextName) {
      setError("Topic name is required");
      return;
    }
    setRenamingTopicId(String(topicId));
    setError(null);
    try {
      const data = await api.updateTopic(groupId, topicId, {
        name: nextName,
        systemInstructions: nextSystemInstructions,
        agentId: nextAgentId,
      }, { accountId });
      if (!data.ok) throw new Error(data.error || "Failed to update topic");
      await loadTopics();
      showToast(`Updated topic: ${nextName}`, "success");
      cancelRename();
    } catch (e) {
      setError(e.message);
    }
    setRenamingTopicId("");
  };

  const topicEntries = Object.entries(topics || {});
  const topicCount = topicEntries.length;
  const computedMaxConcurrent = Math.max(topicCount * 3, 8);
  const computedSubagentMaxConcurrent = Math.max(computedMaxConcurrent - 2, 4);
  const maxConcurrent = Number.isFinite(configAgentMaxConcurrent)
    ? configAgentMaxConcurrent
    : computedMaxConcurrent;
  const subagentMaxConcurrent = Number.isFinite(configSubagentMaxConcurrent)
    ? configSubagentMaxConcurrent
    : computedSubagentMaxConcurrent;

  return html`
    <div class="space-y-4">
      ${debugEnabled &&
      html`
        <div class="flex justify-end">
          <button
            onclick=${onResetOnboarding}
            class="text-xs px-3 py-1.5 rounded-lg border border-border text-gray-400 hover:text-gray-200 hover:border-gray-500 transition-colors"
          >
            Reset onboarding
          </button>
        </div>
      `}
      <div class="bg-black/20 border border-border rounded-lg p-3 space-y-1">
        <p class="text-sm text-gray-300 font-medium">${groupName || groupId}</p>
        <p class="text-xs text-gray-500 font-mono">${groupId}</p>
      </div>

      <div class="space-y-2">
        <h2 class="card-label mb-3">Existing Topics</h2>
        ${topicEntries.length > 0
          ? html`
              <div
                class="bg-black/20 border border-border rounded-lg overflow-hidden"
              >
                <table class="w-full text-xs table-fixed">
                  <thead>
                    <tr class="border-b border-border">
                      <th class="text-left px-3 py-2 text-gray-500 font-medium">
                        Topic
                      </th>
                      <th
                        class="text-left px-3 py-2 text-gray-500 font-medium w-36"
                      >
                        Thread ID
                      </th>
                      ${agents.length > 0 &&
                      html`
                        <th
                          class="text-left px-3 py-2 text-gray-500 font-medium w-32"
                        >
                          Agent
                        </th>
                      `}
                      <th class="px-3 py-2 w-28" />
                    </tr>
                  </thead>
                  <tbody>
                    ${topicEntries.map(
                      ([id, topic]) => html`
                        ${editingTopicId === String(id)
                          ? html`
                              <tr
                                class="border-b border-border last:border-0 align-top"
                              >
                                <td class="px-3 py-2" colspan=${agents.length > 0 ? 4 : 3}>
                                  <div class="space-y-2">
                                    <input
                                      type="text"
                                      value=${editingTopicName}
                                      onInput=${(e) =>
                                        setEditingTopicName(e.target.value)}
                                      onKeyDown=${(e) => {
                                        if (e.key === "Enter") saveRename(id);
                                        if (e.key === "Escape") cancelRename();
                                      }}
                                      class="w-full bg-black/30 border border-border rounded-lg px-2 py-1.5 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-gray-500"
                                    />
                                    <textarea
                                      value=${editingTopicInstructions}
                                      onInput=${(e) =>
                                        setEditingTopicInstructions(
                                          e.target.value,
                                        )}
                                      placeholder="System instructions (optional)"
                                      rows="6"
                                      class="w-full bg-black/30 border border-border rounded-lg px-2 py-1.5 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-gray-500 resize-y"
                                    />
                                    ${agents.length > 0 &&
                                    html`
                                      <div class="flex items-center gap-2">
                                        <label class="text-xs text-gray-500">Agent:</label>
                                        <${AgentSelect}
                                          value=${editingTopicAgentId}
                                          agents=${agents}
                                          onChange=${setEditingTopicAgentId}
                                        />
                                      </div>
                                    `}
                                    <div class="flex items-center gap-2">
                                      <button
                                        onclick=${() => saveRename(id)}
                                        disabled=${renamingTopicId ===
                                        String(id)}
                                        class="text-xs px-2 py-1 rounded transition-all ac-btn-cyan ${renamingTopicId ===
                                        String(id)
                                          ? "opacity-50 cursor-not-allowed"
                                          : ""}"
                                      >
                                        Save
                                      </button>
                                      <button
                                        onclick=${cancelRename}
                                        class="text-xs px-2 py-1 rounded border border-border text-gray-400 hover:text-gray-200 hover:border-gray-500"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            `
                          : html`
                              <tr
                                class="border-b border-border last:border-0 align-middle"
                              >
                                <td class="px-3 py-2 text-gray-300">
                                  <div class="flex items-center gap-2">
                                    <span>${topic.name}</span>
                                    <button
                                      onclick=${() =>
                                        startRename(
                                          id,
                                          topic.name,
                                          topic.systemInstructions,
                                          topic.agentId,
                                        )}
                                      class="inline-flex items-center justify-center text-white/80 hover:text-white transition-colors"
                                      title="Edit topic"
                                      aria-label="Edit topic"
                                    >
                                      <svg
                                        width="14"
                                        height="14"
                                        viewBox="0 0 16 16"
                                        fill="currentColor"
                                        aria-hidden="true"
                                      >
                                        <path
                                          d="M11.854 1.146a.5.5 0 00-.708 0L3 9.293V13h3.707l8.146-8.146a.5.5 0 000-.708l-3-3zM3.5 12.5v-2.793l7-7L13.793 6l-7 7H3.5z"
                                        />
                                      </svg>
                                    </button>
                                  </div>
                                  ${topic.systemInstructions &&
                                  html`
                                    <p
                                      class="text-[11px] text-gray-500 mt-1 line-clamp-1"
                                    >
                                      ${topic.systemInstructions}
                                    </p>
                                  `}
                                </td>
                                <td
                                  class="px-3 py-2 text-gray-500 font-mono w-36"
                                >
                                  ${id}
                                </td>
                                ${agents.length > 0 &&
                                html`
                                  <td class="px-3 py-2 text-gray-400 w-32">
                                    ${topic.agentId
                                      ? html`<span class="text-gray-300">${agents.find((a) => a.id === topic.agentId)?.name || topic.agentId}</span>`
                                      : html`<span class="text-gray-600">default</span>`}
                                  </td>
                                `}
                                <td class="px-3 py-2">
                                  <div
                                    class="flex items-center gap-2 justify-end"
                                  >
                                    <button
                                      onclick=${() =>
                                        setDeleteTopicConfirm({
                                          id: String(id),
                                          name: String(topic.name || ""),
                                        })}
                                      disabled=${deleting === id}
                                      class="text-xs px-2 py-1 rounded border border-border text-gray-500 hover:text-red-300 hover:border-red-500 ${deleting ===
                                      id
                                        ? "opacity-50 cursor-not-allowed"
                                        : ""}"
                                      title="Delete topic"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            `}
                      `,
                    )}
                  </tbody>
                </table>
              </div>
            `
          : html`<p class="text-xs text-gray-500">No topics yet.</p>`}
      </div>

      ${showCreateTopic &&
      html`
        <div class="space-y-2 bg-black/20 border border-border rounded-lg p-3">
          <label class="text-xs text-gray-500">Create new topic</label>
          <div class="space-y-2">
            <input
              type="text"
              value=${newTopicName}
              onInput=${(e) => setNewTopicName(e.target.value)}
              onKeyDown=${(e) => {
                if (e.key === "Enter") createSingle();
              }}
              placeholder="Topic name"
              class="w-full bg-black/30 border border-border rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-gray-500"
            />
            <textarea
              value=${newTopicInstructions}
              onInput=${(e) => setNewTopicInstructions(e.target.value)}
              placeholder="System instructions (optional)"
              rows="5"
              class="w-full bg-black/30 border border-border rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-gray-500 resize-y"
            />
            ${agents.length > 0 &&
            html`
              <div class="flex items-center gap-2">
                <label class="text-xs text-gray-500">Agent:</label>
                <${AgentSelect}
                  value=${newTopicAgentId}
                  agents=${agents}
                  onChange=${setNewTopicAgentId}
                />
              </div>
            `}
            <div class="flex justify-end">
              <${ActionButton}
                onClick=${createSingle}
                disabled=${creating || !newTopicName.trim()}
                loading=${creating}
                tone="secondary"
                size="lg"
                idleLabel="Add topic"
                loadingLabel="Creating..."
              />
            </div>
          </div>
        </div>
      `}
      ${error &&
      html`
        <div class="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
          <p class="text-sm text-red-400">${error}</p>
        </div>
      `}

      <div class="flex items-center justify-start">
        <button
          onclick=${() => setShowCreateTopic((v) => !v)}
          class="${showCreateTopic
            ? "w-auto text-sm font-medium px-4 py-2 rounded-xl transition-all border border-border text-gray-300 hover:border-gray-500"
            : "w-auto text-sm font-medium px-4 py-2 rounded-xl transition-all ac-btn-cyan"}"
        >
          ${showCreateTopic ? "Close create topic" : "Create topic"}
        </button>
      </div>

      <div class="border-t border-white/10" />

      <p class="text-xs text-gray-500">
        Concurrency is auto-scaled to support your group:
        <span class="text-gray-300"> agent ${maxConcurrent}</span>,
        <span class="text-gray-300"> subagent ${subagentMaxConcurrent}</span>
        <span class="text-gray-600"> (${topicCount} topics)</span>.
      </p>
      <p class="text-[11px] text-gray-500">
        This registry can drift if topics are created, renamed, or removed
        outside this page. Your agent will update the registry if it notices a
        discrepancy.
      </p>
      <${ConfirmDialog}
        visible=${!!deleteTopicConfirm}
        title="Delete topic?"
        message=${deleteTopicConfirm
          ? `This will delete "${deleteTopicConfirm.name}" (thread ${deleteTopicConfirm.id}) from your Telegram workspace.`
          : "This will delete this topic from your Telegram workspace."}
        confirmLabel="Delete topic"
        confirmLoadingLabel="Deleting..."
        confirmTone="warning"
        confirmLoading=${!!deleting}
        cancelLabel="Cancel"
        onCancel=${() => {
          if (deleting) return;
          setDeleteTopicConfirm(null);
        }}
        onConfirm=${async () => {
          if (!deleteTopicConfirm) return;
          const pendingDelete = deleteTopicConfirm;
          setDeleteTopicConfirm(null);
          await handleDelete(pendingDelete.id, pendingDelete.name);
        }}
      />
    </div>
  `;
};
