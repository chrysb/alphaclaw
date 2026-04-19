import { h } from "preact";
import { useEffect, useMemo, useState } from "preact/hooks";
import htm from "htm";
import { ActionButton } from "../action-button.js";
import { CloseIcon, FileCopyLineIcon } from "../icons.js";
import { ModalShell } from "../modal-shell.js";
import { PageHeader } from "../page-header.js";
import { SecretInput } from "../secret-input.js";
import { fetchChannelAccountToken } from "../../lib/api.js";
import { copyTextToClipboard } from "../../lib/clipboard.js";
import { isSingleAccountChannelProvider } from "../../lib/channel-provider-availability.js";
import { ALL_CHANNELS, getChannelMeta } from "../channels.js";
import { showToast } from "../toast.js";

const html = htm.bind(h);

const kChannelEnvKeys = {
  telegram: "TELEGRAM_BOT_TOKEN",
  discord: "DISCORD_BOT_TOKEN",
  slack: "SLACK_BOT_TOKEN",
  whatsapp: "WHATSAPP_OWNER_NUMBER",
};

const kChannelExtraEnvKeys = {
  slack: "SLACK_APP_TOKEN",
};
const kSlackBotScopes = [
  "app_mentions:read",
  "channels:history",
  "channels:read",
  "chat:write",
  "commands",
  "emoji:read",
  "files:read",
  "files:write",
  "groups:read",
  "groups:history",
  "im:history",
  "im:read",
  "im:write",
  "mpim:history",
  "mpim:read",
  "mpim:write",
  "pins:read",
  "pins:write",
  "reactions:read",
  "reactions:write",
  "users:read",
];
const kSlackBotEvents = [
  "app_mention",
  "message.channels",
  "message.groups",
  "message.im",
  "message.mpim",
  "reaction_added",
  "reaction_removed",
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
const deriveChannelExtraEnvKey = ({ provider, accountId, index = 0 }) => {
  const baseKeys = [kChannelExtraEnvKeys[String(provider || "").trim()]].filter(
    Boolean,
  );
  const baseKey = String(baseKeys[index] || "").trim();
  const normalizedAccountId = String(accountId || "").trim();
  if (!baseKey) return "";
  if (!normalizedAccountId || normalizedAccountId === "default") return baseKey;
  return `${baseKey}_${normalizedAccountId.replace(/-/g, "_").toUpperCase()}`;
};
const isMaskedTokenValue = (value) => /^\*+$/.test(String(value || "").trim());
const buildSlackManifest = (appName = "AlphaClaw") =>
  JSON.stringify(
    {
      _metadata: {
        major_version: 1,
      },
      display_information: {
        name: String(appName || "").trim() || "AlphaClaw",
        description: "Slack connector for AlphaClaw",
      },
      features: {
        bot_user: {
          display_name: String(appName || "").trim() || "AlphaClaw",
          always_online: false,
        },
        app_home: {
          messages_tab_enabled: true,
          messages_tab_read_only_enabled: false,
        },
      },
      oauth_config: {
        scopes: {
          bot: kSlackBotScopes,
        },
      },
      settings: {
        event_subscriptions: {
          bot_events: kSlackBotEvents,
        },
        org_deploy_enabled: false,
        socket_mode_enabled: true,
        is_hosted: false,
        token_rotation_enabled: false,
      },
    },
    null,
    2,
  );
const copyAndToast = async (value, label = "text") => {
  const copied = await copyTextToClipboard(value);
  if (copied) {
    showToast("Copied to clipboard", "success");
    return;
  }
  showToast(`Could not copy ${label}`, "error");
};

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
  const normalizedProvider = String(provider || "").trim();
  const isSingleAccountProvider = isSingleAccountChannelProvider(provider);
  const needsAppToken = normalizedProvider === "slack";
  const isWhatsApp = normalizedProvider === "whatsapp";

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
  const extraEnvKey = useMemo(
    () =>
      deriveChannelExtraEnvKey({
        provider,
        accountId,
      }),
    [provider, accountId],
  );
  const slackManifestName = useMemo(() => {
    const normalizedName = String(name || "").trim();
    if (!normalizedName) return "AlphaClaw";
    if (normalizedName.toLowerCase() === "slack") return "AlphaClaw";
    return normalizedName;
  }, [name]);
  const slackManifest = useMemo(
    () => buildSlackManifest(slackManifestName),
    [slackManifestName],
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
      panelClassName="bg-modal border border-border rounded-xl p-6 max-w-lg w-full max-h-[calc(100vh-2rem)] overflow-y-auto space-y-4"
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
            <${CloseIcon} className="w-3.5 h-3.5 text-body" />
          </button>
        `}
      />

      <div class="space-y-3">
        <label class="block space-y-1">
          <span class="text-xs text-fg-muted">Name</span>
          <input
            type="text"
            value=${name}
            onInput=${(event) => {
              setNameEditedManually(true);
              setName(event.target.value);
            }}
            placeholder=${getChannelMeta(provider).label || "Channel"}
            class="w-full bg-field border border-border rounded-lg px-3 py-2 text-sm text-body outline-none focus:border-fg-muted"
          />
        </label>

        <label class="block space-y-1">
          <span class="text-xs text-fg-muted">Id</span>
          <input
            type="text"
            value=${accountId}
            readOnly=${true}
            class="w-full bg-field border border-border rounded-lg px-3 py-2 text-sm font-mono text-fg-muted outline-none"
          />
          <p class="text-xs text-fg-muted">
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
            ${isWhatsApp ? "Owner Number" : needsAppToken ? "Bot Token" : "Token"}
          </span>
          ${isWhatsApp
            ? html`
                <input
                  type="text"
                  value=${token}
                  onInput=${(event) => setToken(event.target.value)}
                  placeholder="+15551234567"
                  class="w-full bg-field border border-border rounded-lg px-3 py-2 text-sm font-mono text-body outline-none focus:border-fg-muted"
                />
              `
            : html`
                <${SecretInput}
                  value=${token}
                  onInput=${(event) => setToken(event.target.value)}
                  placeholder=${token ? "" : "Paste bot token"}
                  loading=${loadingToken}
                  isSecret=${true}
                  inputClass="w-full bg-field border border-border rounded-lg px-3 py-2 text-sm font-mono text-body outline-none focus:border-fg-muted"
                />
              `}
          <p class="text-xs text-fg-muted">
            ${isWhatsApp
              ? "E.164 format phone number used for allowlist pairing."
              : html`Saved behind the scenes as
                <code class="font-mono text-fg-muted ml-1">${envKey || "CHANNEL_TOKEN"}</code>.`}
          </p>
        </label>

        ${
          needsAppToken
            ? html`
                <label class="block space-y-1">
                  <span class="text-xs text-fg-muted"
                    >App Token (Socket Mode)</span
                  >
                  <${SecretInput}
                    value=${appToken}
                    onInput=${(event) => setAppToken(event.target.value)}
                    placeholder="xapp-..."
                    isSecret=${true}
                    inputClass="w-full bg-field border border-border rounded-lg px-3 py-2 text-sm font-mono text-body outline-none focus:border-fg-muted"
                  />
                  <p class="text-xs text-fg-muted">
                    Saved behind the scenes as
                    <code class="font-mono text-fg-muted ml-1">
                      ${extraEnvKey || kChannelExtraEnvKeys.slack}
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
                <div class="space-y-2">
                  <details
                    class="rounded-lg border border-border bg-field px-3 py-2.5"
                  >
                    <summary
                      class="cursor-pointer text-xs text-body hover:text-body"
                    >
                      <span class="inline-block ml-1">
                        Create app from manifest (recommended)
                      </span>
                    </summary>
                    <div class="mt-2 space-y-2 text-xs text-fg-muted">
                      <div class="flex items-center justify-between gap-3 pt-1">
                        <div class="space-y-0.5">
                          <p class="text-[12px] text-fg-muted">
                            ${slackManifestName} App Manifest
                          </p>
                        </div>
                        <button
                          type="button"
                          onclick=${() =>
                            copyAndToast(slackManifest, "Slack manifest")}
                          class="text-xs px-2 py-1 rounded-lg ac-btn-cyan inline-flex items-center gap-1.5 shrink-0"
                        >
                          <${FileCopyLineIcon} className="w-3.5 h-3.5" />
                          Copy
                        </button>
                      </div>
                      <pre
                        class="max-h-72 overflow-auto rounded-lg border border-border bg-field p-3 text-[11px] leading-5 whitespace-pre-wrap break-all font-mono text-body"
                      >
${slackManifest}</pre
                      >
                      <ol
                        class="list-decimal list-inside space-y-1.5 text-[11px] text-fg-muted"
                      >
                        <li>
                          In Slack, click ${" "}
                          <span class="text-body"
                            >Create app from manifest</span
                          >
                          ${" "} and paste this manifest.
                        </li>
                        <li>
                          Open ${" "}
                          <span class="text-body">Basic Information</span>
                          ${" "} and create an ${" "}
                          <span class="text-body">App-Level Token</span>
                          ${" "} with
                          <code class="font-mono text-fg-muted ml-1"
                            >connections:write</code
                          >.
                        </li>
                        <li>
                          Open ${" "}
                          <span class="text-body">OAuth & Permissions</span>
                          ${" "} and use ${" "}
                          <span class="text-body">Install to Workspace</span>
                          ${" "} or ${" "}
                          <span class="text-body">Reinstall to Workspace</span>
                          ${" "} so Slack issues a bot token.
                        </li>
                        <li>
                          In ${" "}
                          <span class="text-body">OAuth & Permissions</span>
                          ${" "} copy the ${" "}
                          <span class="text-body">Bot User OAuth Token</span>
                          ${" "} (
                          <code class="font-mono text-fg-muted">xoxb-...</code>
                          ).
                        </li>
                        <li>
                          Paste the generated ${" "}
                          <code class="font-mono text-fg-muted">xoxb-...</code>
                          ${" "} and ${" "}
                          <code class="font-mono text-fg-muted">xapp-...</code>
                          ${" "} tokens here.
                        </li>
                      </ol>
                    </div>
                  </details>
                  <details
                    class="rounded-lg border border-border bg-field px-3 py-2.5"
                  >
                    <summary
                      class="cursor-pointer text-xs text-body hover:text-body"
                    >
                      <span class="inline-block ml-1">
                        Manual setup instructions
                      </span>
                    </summary>
                    <div class="mt-2 space-y-2 text-xs text-fg-muted">
                      <p>
                        Use this if you want to configure the Slack app by hand
                        instead of importing a manifest.
                      </p>
                      <ol class="list-decimal list-inside space-y-1.5">
                        <li>
                          In Slack app settings, turn on ${" "}
                          <span class="text-body">Socket Mode</span>.
                        </li>
                        <li>
                          In ${" "}
                          <span class="text-body">App Home</span>, enable
                          <code class="font-mono text-fg-muted ml-1">
                            Allow users to send Slash commands and messages from
                            the messages tab </code
                          >.
                        </li>
                        <li>
                          In ${" "}
                          <span class="text-body">Event Subscriptions</span>,
                          toggle on
                          <code class="font-mono text-fg-muted ml-1"
                            >Subscribe to bot events</code
                          >
                          ${" "} and add
                          <code class="font-mono text-fg-muted ml-1"
                            >message.im</code
                          >.
                        </li>
                        <li>
                          In ${" "}
                          <span class="text-body">OAuth & Permissions</span>,
                          add the bot scopes:
                          <code class="font-mono text-fg-muted ml-1">
                            ${kSlackBotScopes.join(", ")}
                          </code>
                        </li>
                        <li>
                          In ${" "}
                          <span class="text-body">Basic Information</span>,
                          create an App Token (<code
                            class="font-mono text-fg-muted"
                            >xapp-...</code
                          >) with
                          <code class="font-mono text-fg-muted ml-1"
                            >connections:write</code
                          >.
                        </li>
                        <li>
                          Back in ${" "}
                          <span class="text-body">OAuth & Permissions</span>,
                          install or reinstall the app, then copy the ${" "}
                          <span class="text-body">Bot User OAuth Token</span>
                          ${" "} (
                          <code class="font-mono text-fg-muted">xoxb-...</code>
                          ).
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
                </div>
              `
            : null
        }

        <label class="block space-y-1">
          <span class="text-xs text-fg-muted">Agent</span>
          <select
            value=${agentId}
            onInput=${(event) => setAgentId(event.target.value)}
            class="w-full bg-field border border-border rounded-lg px-3 py-2 text-sm text-body outline-none focus:border-fg-muted"
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
                <p class="text-xs text-status-error-muted">
                  ${isSingleAccountProvider
                    ? `${getChannelMeta(provider).label} already has a configured channel account.`
                    : `A ${getChannelMeta(provider).label} account with this id already exists.`}
                </p>
              `
            : null
        }
        ${error ? html`<p class="text-xs text-status-error-muted">${error}</p>` : null}
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
