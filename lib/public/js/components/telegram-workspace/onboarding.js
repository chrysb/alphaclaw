import { h } from "https://esm.sh/preact";
import { useState, useEffect } from "https://esm.sh/preact/hooks";
import htm from "https://esm.sh/htm";
import { Badge } from "../badge.js";
import { showToast } from "../toast.js";
import { ActionButton } from "../action-button.js";
import { ConfirmDialog } from "../confirm-dialog.js";
import * as api from "../../lib/telegram-api.js";

const html = htm.bind(h);

export const StepIndicator = ({ currentStep, steps }) => html`
  <div class="flex items-center gap-1 mb-6">
    ${steps.map(
      (s, i) => html`
        <div
          class="h-1 flex-1 rounded-full transition-colors ${i <= currentStep
            ? "bg-accent"
            : "bg-border"}"
          style=${i <= currentStep ? "background: var(--accent)" : ""}
        />
      `,
    )}
  </div>
`;

// Step 1: Verify Bot
export const VerifyBotStep = ({ accountId, botInfo, setBotInfo, onNext }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const verify = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.verifyBot({ accountId });
      if (!data.ok) throw new Error(data.error);
      setBotInfo(data.bot);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!botInfo) verify();
  }, []);

  return html`
    <div class="space-y-4">
      <h3 class="text-sm font-semibold">Verify Bot Setup</h3>

      ${botInfo &&
      html`
        <div class="bg-black/20 border border-border rounded-lg p-3">
          <div class="flex items-center gap-2">
            <span class="text-sm text-gray-300 font-medium">@${botInfo.username}</span>
            <${Badge} tone="success">Connected</${Badge}>
          </div>
          <p class="text-xs text-gray-500 mt-1">${botInfo.first_name}</p>
        </div>
      `}
      ${error &&
      html`
        <div class="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
          <p class="text-sm text-red-400">${error}</p>
        </div>
      `}
      ${!botInfo &&
      !loading &&
      !error &&
      html` <p class="text-sm text-gray-400">Checking bot token...</p> `}

      <div class="bg-black/20 border border-border rounded-lg p-3 space-y-2">
        <p class="text-xs font-medium text-gray-300">
          Before continuing, configure BotFather:
        </p>
        <ol class="text-xs text-gray-400 space-y-1.5 list-decimal list-inside">
          <li>
            Open <span class="text-gray-300">@BotFather</span> in Telegram
          </li>
          <li>
            Send <code class="bg-black/40 px-1 rounded">/mybots</code> and
            select your bot
          </li>
          <li>
            Go to <span class="text-gray-300">Bot Settings</span> >
            <span class="text-gray-300">Group Privacy</span>
          </li>
          <li>Turn it <span class="text-yellow-400 font-medium">OFF</span></li>
        </ol>
      </div>

      <div class="grid grid-cols-2 gap-2">
        <div />
        <button
          onclick=${onNext}
          disabled=${!botInfo}
          class="w-full text-sm font-medium px-4 py-2 rounded-xl transition-all ac-btn-cyan ${!botInfo
            ? "opacity-50 cursor-not-allowed"
            : ""}"
        >
          Next
        </button>
      </div>
    </div>
  `;
};

// Step 2: Create Group
export const CreateGroupStep = ({ onNext, onBack }) => html`
  <div class="space-y-4">
    <h3 class="text-sm font-semibold">Create a Telegram Group</h3>

    <div class="bg-black/20 border border-border rounded-lg p-3 space-y-2">
      <p class="text-xs font-medium text-gray-300">Create the group</p>
      <ol class="text-xs text-gray-400 space-y-2 list-decimal list-inside">
        <li>
          Open Telegram and create a${" "}
          <span class="text-gray-300">new group</span>
        </li>
        <li>
          Search for and add <span class="text-gray-300">your bot</span> as a
          member
        </li>
        <li>
          Hit <span class="text-gray-300">Next</span>, give the group a name
          (e.g. "My Workspace"), and create it
        </li>
      </ol>
    </div>

    <div class="bg-black/20 border border-border rounded-lg p-3 space-y-2">
      <p class="text-xs font-medium text-gray-300">Enable topics</p>
      <ol class="text-xs text-gray-400 space-y-2 list-decimal list-inside">
        <li>Tap the group name at the top to open settings</li>
        <li>
          Tap <span class="text-gray-300">Edit</span> (pencil icon), scroll to
          <span class="text-gray-300"> Topics</span>, toggle it
          <span class="text-yellow-400 font-medium"> ON</span>
        </li>
      </ol>
    </div>

    <div class="bg-black/20 border border-border rounded-lg p-3 space-y-2">
      <p class="text-xs font-medium text-gray-300">Make the bot an admin</p>
      <ol class="text-xs text-gray-400 space-y-2 list-decimal list-inside">
        <li>Go to <span class="text-gray-300">Members</span>, tap your bot</li>
        <li>
          Promote it to <span class="text-yellow-400 font-medium">Admin</span>
        </li>
        <li>
          Make sure
          <span class="text-yellow-400 font-medium"> Manage Topics </span>
          permission is enabled
        </li>
      </ol>
    </div>

    <p class="text-xs text-gray-500">
      Once all three steps are done, continue to verify the setup.
    </p>

    <div class="grid grid-cols-2 gap-2">
      <button
        onclick=${onBack}
        class="w-full text-sm font-medium px-4 py-2 rounded-xl transition-all border border-border text-gray-300 hover:border-gray-500"
      >
        Back
      </button>
      <button
        onclick=${onNext}
        class="w-full text-sm font-medium px-4 py-2 rounded-xl transition-all ac-btn-cyan"
      >
        Next
      </button>
    </div>
  </div>
`;

// Step 3: Add Bot to Group / Verify Group
export const AddBotStep = ({
  accountId,
  groupId,
  setGroupId,
  groupInfo,
  setGroupInfo,
  userId,
  setUserId,
  verifyGroupError,
  setVerifyGroupError,
  onNext,
  onBack,
}) => {
  const [input, setInput] = useState(groupId || "");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const verifyWarnings = groupInfo
    ? [
        ...(!groupInfo.chat?.isForum
          ? ["Topics are OFF. Enable Topics in Telegram group settings."]
          : []),
        ...(!groupInfo.bot?.isAdmin
          ? ["Bot is not an admin. Promote it to admin in group members."]
          : []),
        ...(!groupInfo.bot?.canManageTopics
          ? [
              "Bot is missing Manage Topics permission. Enable it in admin permissions.",
            ]
          : []),
      ]
    : [];

  const verify = async () => {
    const id = input.trim();
    if (!id) return;
    setLoading(true);
    setVerifyGroupError(null);
    try {
      const data = await api.verifyGroup(id, { accountId });
      if (!data.ok) throw new Error(data.error);
      setGroupId(id);
      setGroupInfo(data);
      if (!String(userId || "").trim() && data.suggestedUserId) {
        setUserId(String(data.suggestedUserId));
      }
    } catch (e) {
      setVerifyGroupError(e.message);
      setGroupInfo(null);
    }
    setLoading(false);
  };
  const canContinue = !!(
    groupInfo &&
    groupInfo.chat?.isForum &&
    groupInfo.bot?.isAdmin &&
    groupInfo.bot?.canManageTopics
  );
  const continueWithConfig = async () => {
    if (!canContinue || saving) return;
    setVerifyGroupError(null);
    setSaving(true);
    try {
      const userIdValue = String(userId || "").trim();
      const data = await api.configureGroup(groupId, {
        ...(userIdValue ? { userId: userIdValue } : {}),
        groupName: groupInfo?.chat?.title || groupId,
        requireMention: false,
      }, { accountId });
      if (!data?.ok)
        throw new Error(data?.error || "Failed to configure Telegram group");
      if (data.userId) setUserId(String(data.userId));
      onNext();
    } catch (e) {
      setVerifyGroupError(e.message);
    }
    setSaving(false);
  };

  return html`
    <div class="space-y-4">
      <h3 class="text-sm font-semibold">Verify Group</h3>

      <div class="bg-black/20 border border-border rounded-lg p-3 space-y-2">
        <p class="text-xs text-gray-400">To get your group chat ID:</p>
        <ol class="text-xs text-gray-400 space-y-1 list-decimal list-inside">
          <li>
            Invite <span class="text-gray-300">@myidbot</span> to your group
          </li>
          <li>
            Send <code class="bg-black/40 px-1 rounded">/getgroupid</code>
          </li>
          <li>
            Copy the ID (starts with
            <code class="bg-black/40 px-1 rounded">-100</code>)
          </li>
        </ol>
      </div>

      <div class="flex gap-2">
        <input
          type="text"
          value=${input}
          onInput=${(e) => setInput(e.target.value)}
          placeholder="-100XXXXXXXXXX"
          class="flex-1 bg-black/30 border border-border rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-gray-500"
        />
        <${ActionButton}
          onClick=${verify}
          disabled=${!input.trim() || loading}
          loading=${loading}
          tone="secondary"
          size="md"
          idleLabel="Verify"
          loadingMode="inline"
          className="rounded-lg"
        />
      </div>

      ${verifyGroupError &&
      html`
        <div class="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
          <p class="text-sm text-red-400">${verifyGroupError}</p>
        </div>
      `}
      ${groupInfo &&
      html`
        <div class="bg-black/20 border border-border rounded-lg p-3 space-y-2">
          <div class="flex items-center gap-2">
            <span class="text-sm text-gray-300 font-medium">${groupInfo.chat.title}</span>
            <${Badge} tone="success">Verified</${Badge}>
          </div>
          <div class="flex gap-3 text-xs text-gray-500">
            <span>Topics: ${groupInfo.chat.isForum ? "ON" : "OFF"}</span>
            <span>Bot: ${groupInfo.bot.status}</span>
          </div>
        </div>
      `}
      ${groupInfo &&
      verifyWarnings.length === 0 &&
      html`
        <div class="bg-black/20 border border-border rounded-lg p-3 space-y-2">
          <p class="text-xs text-gray-500">Your Telegram User ID</p>
          <input
            type="text"
            value=${userId}
            onInput=${(e) => setUserId(e.target.value)}
            placeholder="e.g. 123456789"
            class="w-full bg-black/30 border border-border rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-gray-500"
          />
          <p class="text-xs text-gray-500">
            Auto-filled from Telegram admins. Edit if needed.
          </p>
        </div>
      `}
      ${verifyWarnings.length > 0 &&
      html`
        <div
          class="bg-red-500/10 border border-red-500/20 rounded-lg p-3 space-y-3"
        >
          <p class="text-xs font-medium text-red-300">
            Fix these before continuing:
          </p>
          <ul class="text-xs text-red-200 space-y-1 list-disc list-inside">
            ${verifyWarnings.map((message) => html`<li>${message}</li>`)}
          </ul>
          <p class="text-xs text-red-300 ">Once fixed, hit Verify again.</p>
        </div>
      `}

      <div class="grid grid-cols-2 gap-2">
        <button
          onclick=${onBack}
          class="w-full text-sm font-medium px-4 py-2 rounded-xl transition-all border border-border text-gray-300 hover:border-gray-500"
        >
          Back
        </button>
        <button
          onclick=${continueWithConfig}
          disabled=${!canContinue || saving}
          class="w-full text-sm font-medium px-4 py-2 rounded-xl transition-all ac-btn-cyan ${!canContinue ||
          saving
            ? "opacity-50 cursor-not-allowed"
            : ""}"
        >
          ${saving ? "Saving..." : "Next"}
        </button>
      </div>
    </div>
  `;
};

// Step 4: Create Topics
export const TopicsStep = ({ accountId, groupId, topics, setTopics, onNext, onBack }) => {
  const [newTopicName, setNewTopicName] = useState("");
  const [newTopicInstructions, setNewTopicInstructions] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [deleteTopicConfirm, setDeleteTopicConfirm] = useState(null);

  const loadTopics = async () => {
    const data = await api.listTopics(groupId, { accountId });
    if (data.ok) setTopics(data.topics);
  };

  useEffect(() => {
    loadTopics();
  }, [groupId]);

  const createSingle = async () => {
    const name = newTopicName.trim();
    const systemInstructions = newTopicInstructions.trim();
    if (!name) return;
    setCreating(true);
    setError(null);
    try {
      const data = await api.createTopicsBulk(groupId, [
        { name, ...(systemInstructions ? { systemInstructions } : {}) },
      ], { accountId });
      if (!data.ok)
        throw new Error(data.results?.[0]?.error || "Failed to create topic");
      const failed = data.results.filter((r) => !r.ok);
      if (failed.length > 0) throw new Error(failed[0].error);
      setNewTopicName("");
      setNewTopicInstructions("");
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

  const topicEntries = Object.entries(topics || {});

  return html`
    <div class="space-y-4">
      <h3 class="text-sm font-semibold">Create Topics</h3>

      ${topicEntries.length > 0 &&
      html`
        <div
          class="bg-black/20 border border-border rounded-lg overflow-hidden"
        >
          <table class="w-full text-xs">
            <thead>
              <tr class="border-b border-border">
                <th class="text-left px-3 py-2 text-gray-500 font-medium">
                  Topic
                </th>
                <th class="text-left px-3 py-2 text-gray-500 font-medium">
                  Thread ID
                </th>
                <th class="px-3 py-2 w-8" />
              </tr>
            </thead>
            <tbody>
              ${topicEntries.map(
                ([id, t]) => html`
                  <tr class="border-b border-border last:border-0">
                    <td class="px-3 py-2 text-gray-300">${t.name}</td>
                    <td class="px-3 py-2 text-gray-500 font-mono">${id}</td>
                    <td class="px-3 py-2">
                      <button
                        onclick=${() =>
                          setDeleteTopicConfirm({
                            id: String(id),
                            name: String(t.name || ""),
                          })}
                        disabled=${deleting === id}
                        class="text-gray-600 hover:text-red-400 transition-colors ${deleting ===
                        id
                          ? "opacity-50"
                          : ""}"
                        title="Delete topic"
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 16 16"
                          fill="currentColor"
                        >
                          <path
                            d="M4.646 4.646a.5.5 0 01.708 0L8 7.293l2.646-2.647a.5.5 0 01.708.708L8.707 8l2.647 2.646a.5.5 0 01-.708.708L8 8.707l-2.646 2.647a.5.5 0 01-.708-.708L7.293 8 4.646 5.354a.5.5 0 010-.708z"
                          />
                        </svg>
                      </button>
                    </td>
                  </tr>
                `,
              )}
            </tbody>
          </table>
        </div>
      `}

      <div class="space-y-2">
        <label class="text-xs text-gray-500">Add a topic</label>
        <div class="space-y-2">
          <div class="flex gap-2">
            <input
              type="text"
              value=${newTopicName}
              onInput=${(e) => setNewTopicName(e.target.value)}
              onKeyDown=${(e) => {
                if (e.key === "Enter") createSingle();
              }}
              placeholder="Topic name"
              class="flex-1 bg-black/30 border border-border rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-gray-500"
            />
          </div>
          <textarea
            value=${newTopicInstructions}
            onInput=${(e) => setNewTopicInstructions(e.target.value)}
            placeholder="System instructions (optional)"
            rows="4"
            class="w-full bg-black/30 border border-border rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-gray-500 resize-y"
          />
          <div class="flex justify-end">
            <${ActionButton}
              onClick=${createSingle}
              disabled=${creating || !newTopicName.trim()}
              loading=${creating}
              tone="secondary"
              size="lg"
              idleLabel="Add"
              loadingMode="inline"
              className="min-w-[88px]"
            />
          </div>
        </div>
      </div>
      <div class="border-t border-white/10 pt-2" />

      ${error &&
      html`
        <div class="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
          <p class="text-sm text-red-400">${error}</p>
        </div>
      `}

      <div class="grid grid-cols-2 gap-2">
        <button
          onclick=${onBack}
          class="w-full text-sm font-medium px-4 py-2 rounded-xl transition-all border border-border text-gray-300 hover:border-gray-500"
        >
          Back
        </button>
        <button
          onclick=${onNext}
          disabled=${topicEntries.length === 0}
          class="w-full text-sm font-medium px-4 py-2 rounded-xl transition-all ac-btn-cyan"
        >
          Next
        </button>
      </div>
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

// Step 5: Summary
export const SummaryStep = ({ groupId, groupInfo, topics, onBack, onDone }) => {
  return html`
    <div class="space-y-4">
      <div class="max-w-xl mx-auto text-center space-y-10 mt-10">
        <p class="text-sm font-medium text-green-300">🎉 Setup complete</p>
        <p class="text-xs text-gray-400">
          The topic registry has been injected into
          <code class="bg-black/40 px-1 rounded">TOOLS.md</code> so your agent
          knows which thread ID maps to which topic name.
        </p>

        <div class="bg-black/20 border border-border rounded-lg p-3">
          <p class="text-xs text-gray-500">
            If you used <span class="text-gray-300">@myidbot</span> to find IDs,
            you can remove it from the group now.
          </p>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-2">
        <button
          onclick=${onBack}
          class="w-full text-sm font-medium px-4 py-2 rounded-xl transition-all border border-border text-gray-300 hover:border-gray-500"
        >
          Back
        </button>
        <button
          onclick=${onDone}
          class="w-full text-sm font-medium px-4 py-2 rounded-xl transition-all ac-btn-cyan"
        >
          Done
        </button>
      </div>
    </div>
  `;
};
