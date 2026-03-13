import { h } from "https://esm.sh/preact";
import { useEffect, useMemo, useState } from "https://esm.sh/preact/hooks";
import htm from "https://esm.sh/htm";
import { ActionButton } from "../action-button.js";
import { CloseIcon } from "../icons.js";
import { ModalShell } from "../modal-shell.js";
import { PageHeader } from "../page-header.js";
import { SecretInput } from "../secret-input.js";
import { fetchChannelAccountToken } from "../../lib/api.js";
import { ALL_CHANNELS, getChannelMeta } from "../channels.js";

const html = htm.bind(h);

const kChannelEnvKeys = {
  telegram: "TELEGRAM_BOT_TOKEN",
  discord: "DISCORD_BOT_TOKEN",
  slack: "SLACK_BOT_TOKEN",
};

const kChannelExtraEnvKeys = {
  slack: "SLACK_APP_TOKEN",
};
const kSlackBotScopes = [
  "app_mentions:read",
  "channels:history",
  "channels:read",
  "chat:write",
  "groups:history",
  "im:history",
  "im:read",
  "im:write",
  "mpim:history",
  "reactions:read",
  "reactions:write",
  "users:read",
];
const kSlackInstructionsLink = "https://docs.openclaw.ai/channels/slack";

const slugifyChannelAccountId = (value) =>
  String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const deriveChannelEnvKey = ({ provider, accountId }) => {
  const baseKey = kChannelEnvKeys[String(provider || "").trim()] || "";
  const normalizedAccountId = String(accountId || "").trim();
  if (!baseKey) return "";
  if (!normalizedAccountId || normalizedAccountId === "default") return baseKey;
  return `${baseKey}_${normalizedAccountId.replace(/-/g, "_").toUpperCase()}`;
};
const isMaskedTokenValue = (value) => /^\*+$/.test(String(value || "").trim());

export const CreateChannelModal = ({
  visible = false,
  loading = false,
  createLoadingLabel = "Creating...",
  agents = [],
  existingChannels = [],
  mode = "create",
  account = null,
  initialAgentId = "",
  initialProvider = "",
  onClose = () => {},
  onSubmit = async () => {},
}) => {
  const isEditMode = mode === "edit";
  const [provider, setProvider] = useState("telegram");
  const [name, setName] = useState("");
  const [token, setToken] = useState("");
  const [initialToken, setInitialToken] = useState("");
  const [appToken, setAppToken] = useState("");
  const [agentId, setAgentId] = useState("");
  const [error, setError] = useState("");
  const [nameEditedManually, setNameEditedManually] = useState(false);
  const [loadingToken, setLoadingToken] = useState(false);

  useEffect(() => {
    if (!visible) return;
    const nextProvider = isEditMode
      ? String(account?.provider || "").trim() || "telegram"
      : ALL_CHANNELS.includes(initialProvider)
        ? initialProvider
        : ALL_CHANNELS[0] || "telegram";
    const providerLabel = getChannelMeta(nextProvider).label || "Channel";
    const nextSelectedChannel =
      existingChannels.find(
        (entry) =>
          String(entry?.channel || "").trim() ===
          String(nextProvider || "").trim(),
      ) || null;
    const nextProviderHasAccounts =
      Array.isArray(nextSelectedChannel?.accounts) &&
      nextSelectedChannel.accounts.length > 0;
    const nextName = isEditMode
      ? String(account?.name || "").trim() || providerLabel
      : nextProviderHasAccounts
        ? ""
        : providerLabel;
    const nextAgentId = isEditMode
      ? String(account?.ownerAgentId || "").trim() ||
        String(initialAgentId || "").trim() ||
        String(agents[0]?.id || "").trim()
      : String(initialAgentId || "").trim() ||
        String(agents[0]?.id || "").trim();
    setProvider(nextProvider);
    setName(nextName);
    const nextToken = isEditMode
      ? (() => {
          const raw = String(account?.token || "").trim();
          return isMaskedTokenValue(raw) ? "" : raw;
        })()
      : "";
    setToken(nextToken);
    setInitialToken(nextToken);
    setAppToken("");
    setAgentId(nextAgentId);
    setError("");
    setNameEditedManually(isEditMode);
  }, [
    visible,
    initialAgentId,
    initialProvider,
    agents,
    existingChannels,
    isEditMode,
    account,
  ]);

  const selectedChannel = useMemo(
    () =>
      existingChannels.find(
        (entry) =>
          String(entry?.channel || "").trim() === String(provider || "").trim(),
      ) || null,
    [existingChannels, provider],
  );

  const providerHasAccounts = useMemo(
    () =>
      Array.isArray(selectedChannel?.accounts) &&
      selectedChannel.accounts.length > 0,
    [selectedChannel],
  );
  useEffect(() => {
    if (nameEditedManually) return;
    const providerLabel = getChannelMeta(provider).label || "Channel";
    if (!isEditMode && providerHasAccounts) {
      setName("");
      return;
    }
    setName(providerLabel);
  }, [provider, providerHasAccounts, nameEditedManually, isEditMode]);
  const isSingleAccountProvider =
    String(provider || "").trim() === "discord" ||
    String(provider || "").trim() === "slack";
  const needsAppToken = String(provider || "").trim() === "slack";

  const accountId = useMemo(() => {
    if (isEditMode) {
      return String(account?.id || "").trim() || "default";
    }
    if (isSingleAccountProvider) return "default";
    if (!providerHasAccounts) return "default";
    return slugifyChannelAccountId(name);
  }, [name, providerHasAccounts, isEditMode, account, isSingleAccountProvider]);

  const envKey = useMemo(
    () => deriveChannelEnvKey({ provider, accountId }),
    [provider, accountId],
  );

  const accountExists = useMemo(
    () =>
      Array.isArray(selectedChannel?.accounts) &&
      selectedChannel.accounts.some(
        (entry) =>
          String(entry?.id || "").trim() === String(accountId || "").trim(),
      ),
    [selectedChannel, accountId],
  );
  useEffect(() => {
    if (!visible || !isEditMode) return;
    let cancelled = false;
    const loadToken = async () => {
      setLoadingToken(true);
      try {
        const result = await fetchChannelAccountToken({
          provider,
          accountId,
        });
        if (cancelled) return;
        const nextToken = String(result?.token || "");
        const nextAppToken = String(result?.appToken || "");
        setToken(nextToken);
        setInitialToken(nextToken);
        setAppToken(nextAppToken);
      } catch {
        // Keep existing fallback value.
      } finally {
        if (!cancelled) {
          setLoadingToken(false);
        }
      }
    };
    loadToken();
    return () => {
      cancelled = true;
    };
  }, [visible, isEditMode, provider, accountId]);

  const canSubmit =
    !!String(provider || "").trim() &&
    !!String(name || "").trim() &&
    !!String(accountId || "").trim() &&
    !!String(agentId || "").trim() &&
    (isEditMode || !!String(token || "").trim()) &&
    (isEditMode || !needsAppToken || !!String(appToken || "").trim()) &&
    (isEditMode || !accountExists) &&
    !loadingToken;

  if (!visible) return null;

  const handleSubmit = async () => {
    if (!String(name || "").trim()) {
      setError("Name is required");
      return;
    }
    if (!String(accountId || "").trim()) {
      setError("Channel id could not be derived from the name");
      return;
    }
    if (!isEditMode && !String(token || "").trim()) {
      setError("Token is required");
      return;
    }
    if (!isEditMode && needsAppToken && !String(appToken || "").trim()) {
      setError("App Token is required for Slack");
      return;
    }
    if (!String(agentId || "").trim()) {
      setError("Agent is required");
      return;
    }
    if (!isEditMode && accountExists) {
      setError("That channel id is already configured for this provider");
      return;
    }

    setError("");
    const trimmedToken = String(token || "").trim();
    const tokenWasUpdated =
      trimmedToken && trimmedToken !== String(initialToken || "").trim();
    const trimmedAppToken = String(appToken || "").trim();
    await onSubmit({
      provider,
      name: String(name || "").trim(),
      accountId,
      agentId,
      ...(tokenWasUpdated ? { token: trimmedToken } : {}),
      ...(needsAppToken && trimmedAppToken
        ? { appToken: trimmedAppToken }
        : {}),
    });
  };

  return html`
    <${ModalShell}
      visible=${visible}
      onClose=${onClose}
      panelClassName="bg-modal border border-border rounded-xl p-6 max-w-lg w-full space-y-4"
    >
      <${PageHeader}
        title=${
          isEditMode
            ? "Edit Channel"
            : `Add ${getChannelMeta(provider).label || "Channel"} Channel`
        }
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
          <span class="text-xs text-gray-400">Name</span>
          <input
            type="text"
            value=${name}
            onInput=${(event) => {
              setNameEditedManually(true);
              setName(event.target.value);
            }}
            placeholder=${getChannelMeta(provider).label || "Channel"}
            class="w-full bg-black/30 border border-border rounded-lg px-3 py-2 text-sm text-gray-200 outline-none focus:border-gray-500"
          />
        </label>

        <label class="block space-y-1">
          <span class="text-xs text-gray-400">Id</span>
          <input
            type="text"
            value=${accountId}
            readOnly=${true}
            class="w-full bg-black/30 border border-border rounded-lg px-3 py-2 text-sm font-mono text-gray-400 outline-none"
          />
          <p class="text-xs text-gray-500">
            ${
              isEditMode
                ? "Channel id is fixed after creation."
                : isSingleAccountProvider
                  ? `${getChannelMeta(provider).label} supports one channel account and uses the default id.`
                  : providerHasAccounts
                    ? "Derived from the channel name."
                    : "First account uses the default id for this provider."
            }
          </p>
        </label>

        <label class="block space-y-1">
          <span class="text-xs text-gray-400">
            ${needsAppToken ? "Bot Token" : "Token"}
          </span>
          <${SecretInput}
            value=${token}
            onInput=${(event) => setToken(event.target.value)}
            placeholder=${token ? "" : "Paste bot token"}
            loading=${loadingToken}
            isSecret=${true}
            inputClass="w-full bg-black/30 border border-border rounded-lg px-3 py-2 text-sm font-mono text-gray-200 outline-none focus:border-gray-500"
          />
          <p class="text-xs text-gray-500">
            Saved behind the scenes as
            <code class="font-mono text-gray-400 ml-1">${envKey || "CHANNEL_TOKEN"}</code>.
          </p>
        </label>

        ${
          needsAppToken
            ? html`
                <label class="block space-y-1">
                  <span class="text-xs text-gray-400"
                    >App Token (Socket Mode)</span
                  >
                  <${SecretInput}
                    value=${appToken}
                    onInput=${(event) => setAppToken(event.target.value)}
                    placeholder="xapp-..."
                    isSecret=${true}
                    inputClass="w-full bg-black/30 border border-border rounded-lg px-3 py-2 text-sm font-mono text-gray-200 outline-none focus:border-gray-500"
                  />
                  <p class="text-xs text-gray-500">
                    Saved behind the scenes as
                    <code class="font-mono text-gray-400 ml-1">
                      ${kChannelExtraEnvKeys.slack}
                    </code>
                    .
                  </p>
                </label>
              `
            : null
        }
        ${
          needsAppToken
            ? html`
                <details class="rounded-lg border border-border bg-black/20 px-3 py-2.5">
                  <summary class="cursor-pointer text-xs text-gray-300 hover:text-gray-200">
                    Slack-specific instructions (step-by-step)
                  </summary>
                  <div class="mt-2 space-y-2 text-xs text-gray-500">
                    <ol class="list-decimal list-inside space-y-1.5">
                      <li>
                        In Slack app settings, turn on
                        ${" "}
                        <span class="text-gray-300">Socket Mode</span>.
                      </li>
                      <li>
                        In
                        ${" "}
                        <span class="text-gray-300">App Home</span>, enable
                        <code class="font-mono text-gray-400 ml-1">
                          Allow users to send Slash commands and messages from the messages tab
                        </code>.
                      </li>
                      <li>
                        In
                        ${" "}
                        <span class="text-gray-300">Event Subscriptions</span>, toggle on
                        <code class="font-mono text-gray-400 ml-1">Subscribe to bot events</code>
                        ${" "}
                        and add
                        <code class="font-mono text-gray-400 ml-1">message.im</code>.
                      </li>
                      <li>
                        Create a Bot Token (<code class="font-mono text-gray-400">xoxb-...</code>)
                        with scopes:
                        <code class="font-mono text-gray-400 ml-1">
                          ${kSlackBotScopes.join(", ")}
                        </code>
                      </li>
                      <li>
                        Create an App Token (<code class="font-mono text-gray-400">xapp-...</code>)
                        with
                        <code class="font-mono text-gray-400 ml-1">connections:write</code>.
                      </li>
                      <li>
                        Reinstall the app after changing scopes.
                      </li>
                    </ol>
                    <a
                      href=${kSlackInstructionsLink}
                      target="_blank"
                      class="hover:underline"
                      style="color: var(--accent-link)"
                    >
                      Open full Slack setup guide
                    </a>
                  </div>
                </details>
              `
            : null
        }

        <label class="block space-y-1">
          <span class="text-xs text-gray-400">Agent</span>
          <select
            value=${agentId}
            onInput=${(event) => setAgentId(event.target.value)}
            class="w-full bg-black/30 border border-border rounded-lg px-3 py-2 text-sm text-gray-200 outline-none focus:border-gray-500"
          >
            ${agents.map(
              (agent) => html`
                <option key=${agent.id} value=${agent.id}>
                  ${agent.name || agent.id}
                </option>
              `,
            )}
          </select>
        </label>

        ${
          !isEditMode && accountExists
            ? html`
                <p class="text-xs text-red-400">
                  ${isSingleAccountProvider
                    ? `${getChannelMeta(provider).label} already has a configured channel account.`
                    : `A ${getChannelMeta(provider).label} account with this id already exists.`}
                </p>
              `
            : null
        }
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
          onClick=${handleSubmit}
          disabled=${loading || !canSubmit}
          loading=${loading}
          tone="primary"
          size="md"
          idleLabel=${isEditMode ? "Save Changes" : "Create Channel"}
          loadingLabel=${isEditMode ? "Saving..." : createLoadingLabel}
        />
      </div>
    </${ModalShell}>
  `;
};
