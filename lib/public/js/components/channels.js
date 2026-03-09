import { h } from "https://esm.sh/preact";
import { useCallback, useEffect, useMemo, useState } from "https://esm.sh/preact/hooks";
import htm from "https://esm.sh/htm";
import { ActionButton } from "./action-button.js";
import { Badge } from "./badge.js";
import { ConfirmDialog } from "./confirm-dialog.js";
import { AddLineIcon } from "./icons.js";
import { OverflowMenu, OverflowMenuItem } from "./overflow-menu.js";
import {
  createChannelAccount,
  deleteChannelAccount,
  fetchChannelAccounts,
  updateChannelAccount,
} from "../lib/api.js";
import { CreateChannelModal } from "./agents-tab/create-channel-modal.js";
import { showToast } from "./toast.js";

const html = htm.bind(h);

const ALL_CHANNELS = ["telegram", "discord"];
const kChannelMeta = {
  telegram: { label: "Telegram", iconSrc: "/assets/icons/telegram.svg" },
  discord: { label: "Discord", iconSrc: "/assets/icons/discord.svg" },
};

const getChannelMeta = (channelId = "") => {
  const normalized = String(channelId || "").trim();
  return kChannelMeta[normalized] || {
    label: normalized ? normalized.charAt(0).toUpperCase() + normalized.slice(1) : "Channel",
    iconSrc: "",
  };
};

const resolveChannelAccountLabel = ({ channelId, account = {} }) => {
  const providerLabel = getChannelMeta(channelId).label || "Channel";
  const configuredName = String(account?.name || "").trim();
  if (configuredName) return configuredName;
  const accountId = String(account?.id || "").trim();
  if (!accountId || accountId === "default") return providerLabel;
  return `${providerLabel} ${accountId}`;
};

const isImplicitDefaultAccount = ({ accountId, boundAgentId }) =>
  String(accountId || "").trim() === "default" && !String(boundAgentId || "").trim();

export const ChannelsCard = ({
  title = "Channels",
  items = [],
  loadingLabel = "Loading...",
  actions = null,
}) => html`
  <div class="bg-surface border border-border rounded-xl p-4">
    <div class="flex items-center justify-between gap-3 mb-3">
      <h2 class="card-label">${title}</h2>
      ${actions ? html`<div class="shrink-0">${actions}</div>` : null}
    </div>
    <div class="space-y-2">
      ${items.length > 0
        ? items.map((item) => {
            const channelMeta = getChannelMeta(item.channel || item.id);
            const clickable = !!item.clickable;
            return html`
              <div
                key=${item.id || item.channel}
                class="flex justify-between items-center py-1.5 ${clickable
                  ? "cursor-pointer hover:bg-white/5 -mx-2 px-2 rounded-lg transition-colors"
                  : ""}"
                onclick=${clickable ? item.onClick : undefined}
              >
                <span class="font-medium text-sm flex items-center gap-2 min-w-0">
                  ${channelMeta.iconSrc
                    ? html`
                        <img
                          src=${channelMeta.iconSrc}
                          alt=""
                          class="w-4 h-4 rounded-sm"
                          aria-hidden="true"
                        />
                      `
                    : null}
                  <span class="truncate">${item.label || channelMeta.label}</span>
                  ${item.detailText
                    ? html`
                        <span class="text-xs text-gray-500 ml-1 shrink-0">
                          ${item.detailText}
                        </span>
                      `
                    : null}
                  ${item.detailChevron
                    ? html`
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 16 16"
                          fill="none"
                          class="text-gray-600 shrink-0"
                        >
                          <path
                            d="M6 3.5L10.5 8L6 12.5"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          />
                        </svg>
                      `
                    : null}
                </span>
                <span class="flex items-center gap-2 shrink-0">
                  ${item.trailing || null}
                </span>
              </div>
            `;
          })
        : html`<div class="text-gray-500 text-sm text-center py-2">${loadingLabel}</div>`}
    </div>
  </div>
`;

export const Channels = ({
  channels = null,
  agents = [],
  onNavigate = () => {},
  onRefreshStatuses = () => {},
}) => {
  const [channelAccounts, setChannelAccounts] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [saving, setSaving] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState("");
  const [editingAccount, setEditingAccount] = useState(null);
  const [deletingAccount, setDeletingAccount] = useState(null);

  const loadChannelAccounts = useCallback(async () => {
    setLoadingAccounts(true);
    try {
      const payload = await fetchChannelAccounts();
      setChannelAccounts(Array.isArray(payload?.channels) ? payload.channels : []);
    } catch {
      setChannelAccounts([]);
    } finally {
      setLoadingAccounts(false);
    }
  }, []);

  useEffect(() => {
    loadChannelAccounts();
  }, [loadChannelAccounts]);

  useEffect(() => {
    if (!menuOpenId) return undefined;
    const handleWindowClick = () => setMenuOpenId("");
    window.addEventListener("click", handleWindowClick);
    return () => window.removeEventListener("click", handleWindowClick);
  }, [menuOpenId]);

  const configuredChannelMap = useMemo(
    () =>
      new Map(
        channelAccounts.map((entry) => [String(entry?.channel || "").trim(), entry]),
      ),
    [channelAccounts],
  );

  const agentNameMap = useMemo(
    () =>
      new Map(
        agents.map((agent) => [
          String(agent?.id || "").trim(),
          String(agent?.name || "").trim() || String(agent?.id || "").trim(),
        ]),
      ),
    [agents],
  );

  const defaultAgentId = useMemo(
    () => String(agents.find((entry) => entry?.default)?.id || "").trim(),
    [agents],
  );
  const showAgentBadge = agents.length > 1;

  const handleUpdateChannel = async (payload) => {
    setSaving(true);
    try {
      await updateChannelAccount(payload);
      setEditingAccount(null);
      showToast("Channel updated", "success");
      await Promise.all([
        loadChannelAccounts(),
        Promise.resolve(onRefreshStatuses?.()),
      ]);
    } catch (error) {
      showToast(error.message || "Could not update channel", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateChannel = async (payload) => {
    setSaving(true);
    try {
      await createChannelAccount(payload);
      setEditingAccount(null);
      showToast("Channel configured", "success");
      await Promise.all([
        loadChannelAccounts(),
        Promise.resolve(onRefreshStatuses?.()),
      ]);
    } catch (error) {
      showToast(error.message || "Could not configure channel", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteChannel = async () => {
    if (!deletingAccount) return;
    setSaving(true);
    try {
      await deleteChannelAccount({
        provider: deletingAccount.provider,
        accountId: deletingAccount.id,
      });
      setDeletingAccount(null);
      showToast("Channel deleted", "success");
      await Promise.all([
        loadChannelAccounts(),
        Promise.resolve(onRefreshStatuses?.()),
      ]);
    } catch (error) {
      showToast(error.message || "Could not delete channel", "error");
    } finally {
      setSaving(false);
    }
  };

  const items = useMemo(
    () =>
      !loadingAccounts && channels
        ? Array.from(
            new Set([
              ...ALL_CHANNELS,
              ...channelAccounts.map((entry) => String(entry?.channel || "").trim()),
            ]),
          )
            .filter(Boolean)
            .flatMap((channelId) => {
              const info = channels[channelId];
              const configuredChannel = configuredChannelMap.get(channelId);
              const accounts = Array.isArray(configuredChannel?.accounts)
                ? configuredChannel.accounts
                : [];
              if (!configuredChannel && !info) {
                return [
                  {
                    id: `${channelId}:unconfigured`,
                    channel: channelId,
                    label: getChannelMeta(channelId).label,
                    trailing: html`
                      <button
                        type="button"
                        onclick=${(event) => {
                          event.preventDefault();
                          setEditingAccount({
                            id: "default",
                            provider: channelId,
                            name: getChannelMeta(channelId).label,
                            ownerAgentId: defaultAgentId,
                            mode: "create",
                          });
                        }}
                        class="text-xs px-2 py-1 rounded-lg ac-btn-ghost"
                      >
                        Configure
                      </button>
                    `,
                  },
                ];
              }

              if (!configuredChannel && info) {
                const accountStatus = String(info?.status || "configured").trim();
                const pairedCount = Number(info?.paired ?? 0);
                const ownerAgentName =
                  showAgentBadge && defaultAgentId
                    ? agentNameMap.get(defaultAgentId) || defaultAgentId
                    : "";
                return [
                  {
                    id: `${channelId}:default`,
                    channel: channelId,
                    label: getChannelMeta(channelId).label,
                    detailText:
                      channelId === "telegram" && accountStatus === "paired" && onNavigate
                        ? "Workspace"
                        : "",
                    detailChevron:
                      channelId === "telegram" && accountStatus === "paired" && onNavigate,
                    clickable:
                      channelId === "telegram" && accountStatus === "paired" && onNavigate,
                    onClick:
                      channelId === "telegram" && accountStatus === "paired" && onNavigate
                        ? () => onNavigate("telegram")
                        : undefined,
                    trailing: html`
                      <div class="flex items-center gap-1.5">
                        ${showAgentBadge && ownerAgentName && accountStatus === "paired"
                          ? html`<${Badge} tone="neutral">${ownerAgentName}</${Badge}>`
                          : null}
                        ${accountStatus === "paired"
                          ? html`
                              <${Badge} tone="success">
                                ${channelId === "telegram" || pairedCount <= 1
                                  ? "Paired"
                                  : `Paired (${pairedCount})`}
                              </${Badge}>
                            `
                          : html`<${Badge} tone="warning">Awaiting pairing</${Badge}>`}
                        <button
                          type="button"
                          class="text-xs px-2 py-1 rounded-lg ac-btn-ghost"
                          onclick=${(event) => {
                            event.stopPropagation();
                            setEditingAccount({
                              id: "default",
                              provider: channelId,
                              name: getChannelMeta(channelId).label,
                              ownerAgentId: defaultAgentId,
                              mode: "create",
                            });
                          }}
                        >
                          Configure
                        </button>
                      </div>
                    `,
                  },
                ];
              }

              return accounts.map((account) => {
                const accountId = String(account?.id || "").trim() || "default";
                const accountStatusInfo = info?.accounts?.[accountId] || info || null;
                const accountStatus = String(
                  accountStatusInfo?.status || account?.status || "configured",
                ).trim();
                const pairedCount = Number(
                  accountStatusInfo?.paired ?? account?.paired ?? info?.paired ?? 0,
                );
                const isClickable =
                  channelId === "telegram" && accountStatus === "paired" && onNavigate;
                const boundAgentId = String(account?.boundAgentId || "").trim();
                const ownerAgentId =
                  boundAgentId
                  || (isImplicitDefaultAccount({ accountId, boundAgentId }) ? defaultAgentId : "");
                const ownerAgentName =
                  agentNameMap.get(ownerAgentId) || ownerAgentId || "";
                const accountData = {
                  id: accountId,
                  provider: channelId,
                  name: resolveChannelAccountLabel({ channelId, account }),
                  ownerAgentId,
                };

                const trailing = html`
                  <div class="flex items-center gap-1.5">
                    ${showAgentBadge && ownerAgentName && accountStatus === "paired"
                      ? html`<${Badge} tone="neutral">${ownerAgentName}</${Badge}>`
                      : null}
                    ${accountStatus === "paired"
                      ? html`
                          <${Badge} tone="success">
                            ${channelId === "telegram" || pairedCount <= 1
                              ? "Paired"
                              : `Paired (${pairedCount})`}
                          </${Badge}>
                        `
                      : html`<${Badge} tone="warning">Awaiting pairing</${Badge}>`}
                    <${OverflowMenu}
                      open=${menuOpenId === `${channelId}:${accountId}`}
                      ariaLabel="Open channel actions"
                      title="Open channel actions"
                      onToggle=${() =>
                        setMenuOpenId((current) =>
                          current === `${channelId}:${accountId}` ? "" : `${channelId}:${accountId}`,
                        )}
                    >
                      <${OverflowMenuItem}
                        onClick=${() => {
                          setMenuOpenId("");
                          setEditingAccount(accountData);
                        }}
                      >
                        Edit
                      </${OverflowMenuItem}>
                      <${OverflowMenuItem}
                        className="text-red-300 hover:text-red-200"
                        onClick=${() => {
                          setMenuOpenId("");
                          setDeletingAccount(accountData);
                        }}
                      >
                        Delete
                      </${OverflowMenuItem}>
                    </${OverflowMenu}>
                  </div>
                `;

                return {
                  id: `${channelId}:${accountId}`,
                  channel: channelId,
                  label: resolveChannelAccountLabel({ channelId, account }),
                  detailText: isClickable ? "Workspace" : "",
                  detailChevron: isClickable,
                  clickable: isClickable,
                  onClick: isClickable ? () => onNavigate("telegram") : undefined,
                  trailing,
                };
              });
            })
        : [],
    [
      agentNameMap,
      agents.length,
      channelAccounts,
      channels,
      configuredChannelMap,
      defaultAgentId,
      loadingAccounts,
      menuOpenId,
      onNavigate,
      showAgentBadge,
    ],
  );

  return html`
    <div class="space-y-3">
      <${ChannelsCard}
        title="Channels"
        items=${items}
        loadingLabel=${loadingAccounts ? "Loading..." : "No channels configured"}
        actions=${html`
          <${ActionButton}
            onClick=${() =>
              setEditingAccount({
                id: "default",
                provider: "",
                name: "",
                ownerAgentId: defaultAgentId,
                mode: "create",
              })}
            disabled=${saving || loadingAccounts}
            loading=${saving && editingAccount?.mode === "create"}
            loadingMode="inline"
            tone="subtle"
            size="sm"
            idleLabel="Add channel"
            loadingLabel="Opening..."
            idleIcon=${AddLineIcon}
            idleIconClassName="h-4 w-4"
            iconOnly=${true}
            title="Add channel"
            ariaLabel="Add channel"
          />
        `}
      />
      <${CreateChannelModal}
        visible=${!!editingAccount}
        loading=${saving}
        agents=${agents}
        existingChannels=${channelAccounts}
        mode=${editingAccount?.mode === "create" ? "create" : "edit"}
        account=${editingAccount}
        initialAgentId=${String(editingAccount?.ownerAgentId || "").trim()}
        initialProvider=${String(editingAccount?.provider || "").trim()}
        onClose=${() => setEditingAccount(null)}
        onSubmit=${editingAccount?.mode === "create" ? handleCreateChannel : handleUpdateChannel}
      />
      <${ConfirmDialog}
        visible=${!!deletingAccount}
        title="Delete channel?"
        message=${`Remove ${String(deletingAccount?.name || "this channel").trim()} from your configured channels?`}
        confirmLabel="Delete"
        confirmLoadingLabel="Deleting..."
        confirmTone="warning"
        confirmLoading=${saving}
        onConfirm=${handleDeleteChannel}
        onCancel=${() => {
          if (saving) return;
          setDeletingAccount(null);
        }}
      />
    </div>
  `;
};

export { ALL_CHANNELS, getChannelMeta, kChannelMeta };
