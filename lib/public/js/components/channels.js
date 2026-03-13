import { h } from "https://esm.sh/preact";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "https://esm.sh/preact/hooks";
import htm from "https://esm.sh/htm";
import { AddChannelMenu } from "./add-channel-menu.js";
import { ChannelAccountStatusBadge } from "./channel-account-status-badge.js";
import { ConfirmDialog } from "./confirm-dialog.js";
import { OverflowMenu, OverflowMenuItem } from "./overflow-menu.js";
import {
  deleteChannelAccount,
  fetchChannelAccounts,
  updateChannelAccount,
} from "../lib/api.js";
import {
  isImplicitDefaultAccount,
  resolveChannelAccountLabel,
} from "../lib/channel-accounts.js";
import { createChannelAccountWithProgress } from "../lib/channel-create-operation.js";
import { isChannelProviderDisabledForAdd } from "../lib/channel-provider-availability.js";
import { CreateChannelModal } from "./agents-tab/create-channel-modal.js";
import { showToast } from "./toast.js";

const html = htm.bind(h);

const ALL_CHANNELS = ["telegram", "discord", "slack"];
const kChannelMeta = {
  telegram: { label: "Telegram", iconSrc: "/assets/icons/telegram.svg" },
  discord: { label: "Discord", iconSrc: "/assets/icons/discord.svg" },
  slack: { label: "Slack", iconSrc: "/assets/icons/slack.svg" },
};

const getChannelMeta = (channelId = "") => {
  const normalized = String(channelId || "").trim();
  return (
    kChannelMeta[normalized] || {
      label: normalized
        ? normalized.charAt(0).toUpperCase() + normalized.slice(1)
        : "Channel",
      iconSrc: "",
    }
  );
};

const announceRestartRequired = () =>
  window.dispatchEvent(new CustomEvent("alphaclaw:restart-required"));

export const ChannelsCard = ({
  title = "Channels",
  items = [],
  loadingLabel = "Loading...",
  actions = null,
  renderItem = null,
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
            const customItem = renderItem
              ? renderItem({ item, channelMeta, clickable })
              : null;
            if (customItem) return customItem;
            return html`
              <div
                key=${item.id || item.channel}
                class="flex justify-between items-center py-1.5 ${clickable
                  ? "cursor-pointer hover:bg-white/5 -mx-2 px-2 rounded-lg transition-colors"
                  : ""}"
                onclick=${clickable ? item.onClick : undefined}
              >
                <span
                  class="font-medium text-sm flex items-center gap-2 min-w-0"
                >
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
                  <span
                    class="truncate ${item.dimmedLabel ? "text-gray-500" : ""} ${item.labelClassName || ""}"
                    >${item.label || channelMeta.label}</span
                  >
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
        : html`<div class="text-gray-500 text-sm text-center py-2">
            ${loadingLabel}
          </div>`}
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
  const [createLoadingLabel, setCreateLoadingLabel] = useState("Creating...");
  const [menuOpenId, setMenuOpenId] = useState("");
  const [editingAccount, setEditingAccount] = useState(null);
  const [deletingAccount, setDeletingAccount] = useState(null);

  const loadChannelAccounts = useCallback(async () => {
    setLoadingAccounts(true);
    try {
      const payload = await fetchChannelAccounts();
      setChannelAccounts(
        Array.isArray(payload?.channels) ? payload.channels : [],
      );
    } catch {
      setChannelAccounts([]);
    } finally {
      setLoadingAccounts(false);
    }
  }, []);

  useEffect(() => {
    loadChannelAccounts();
  }, [loadChannelAccounts]);


  const configuredChannelMap = useMemo(
    () =>
      new Map(
        channelAccounts.map((entry) => [
          String(entry?.channel || "").trim(),
          entry,
        ]),
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
  const showAgentBadge = agents.length > 0;

  const handleUpdateChannel = async (payload) => {
    setSaving(true);
    try {
      const result = await updateChannelAccount(payload);
      setEditingAccount(null);
      showToast("Channel updated", "success");
      if (result?.restartRequired) {
        announceRestartRequired();
      }
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
    setCreateLoadingLabel("Creating...");
    try {
      const result = await createChannelAccountWithProgress({
        payload,
        onPhase: (label) => {
          setCreateLoadingLabel(String(label || "").trim() || "Creating...");
        },
      });
      setEditingAccount(null);
      showToast("Channel configured", "success");
      if (result?.restartRequired) {
        announceRestartRequired();
      }
      await Promise.all([
        loadChannelAccounts(),
        Promise.resolve(onRefreshStatuses?.()),
      ]);
    } catch (error) {
      showToast(error.message || "Could not configure channel", "error");
    } finally {
      setSaving(false);
      setCreateLoadingLabel("Creating...");
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
  const openCreateChannelModal = (provider) => {
    setMenuOpenId("");
    setEditingAccount({
      id: "default",
      provider,
      name: getChannelMeta(provider).label,
      ownerAgentId: defaultAgentId,
      mode: "create",
    });
  };
  const items = useMemo(
    () => {
      if (loadingAccounts || !channels) return [];
      const channelOrderMap = new Map(
        channelAccounts.map((entry, index) => [
          String(entry?.channel || "").trim(),
          index,
        ]),
      );
      const accountOrderMap = new Map(
        channelAccounts.flatMap((entry) =>
          (Array.isArray(entry?.accounts) ? entry.accounts : []).map(
            (account, accountIndex) => [
              `${String(entry?.channel || "").trim()}:${String(account?.id || "").trim() || "default"}`,
              accountIndex,
            ],
          ),
        ),
      );
      return Array.from(
        new Set([
          ...channelAccounts.map((entry) =>
            String(entry?.channel || "").trim(),
          ),
        ]),
      )
            .filter(Boolean)
            .flatMap((channelId) => {
              const info = channels[channelId];
              const configuredChannel = configuredChannelMap.get(channelId);
              const accounts = Array.isArray(configuredChannel?.accounts)
                ? configuredChannel.accounts
                : [];
              if (!configuredChannel) return [];

              return accounts.map((account) => {
                const accountId = String(account?.id || "").trim() || "default";
                const accountStatusInfo =
                  info?.accounts?.[accountId] || info || null;
                const accountStatus = String(
                  accountStatusInfo?.status || account?.status || "configured",
                ).trim();
                const pairedCount = Number(
                  accountStatusInfo?.paired ??
                    account?.paired ??
                    info?.paired ??
                    0,
                );
                const isClickable =
                  channelId === "telegram" &&
                  accountStatus === "paired" &&
                  onNavigate;
                const boundAgentId = String(account?.boundAgentId || "").trim();
                const ownerAgentId =
                  boundAgentId ||
                  (isImplicitDefaultAccount({ accountId, boundAgentId })
                    ? defaultAgentId
                    : "");
                const ownerAgentName =
                  agentNameMap.get(ownerAgentId) || ownerAgentId || "";
                const accountData = {
                  id: accountId,
                  provider: channelId,
                  name: resolveChannelAccountLabel({
                    channelId,
                    account,
                    providerLabel: getChannelMeta(channelId).label || "Channel",
                  }),
                  ownerAgentId,
                  envKey: String(account?.envKey || "").trim(),
                  token: String(account?.token || "").trim(),
                };

                const trailing = html`
                  <div class="flex items-center gap-1.5">
                    ${
                      showAgentBadge &&
                      ownerAgentName &&
                      accountStatus === "paired"
                        ? html`<${ChannelAccountStatusBadge}
                            status=${accountStatus}
                            ownerAgentName=${ownerAgentName}
                            showAgentBadge=${showAgentBadge}
                            channelId=${channelId}
                            pairedCount=${pairedCount}
                          />`
                        : null
                    }
                    ${
                      accountStatus === "paired"
                        ? showAgentBadge && ownerAgentName
                          ? null
                          : html`<${ChannelAccountStatusBadge}
                              status=${accountStatus}
                              ownerAgentName=""
                              showAgentBadge=${false}
                              channelId=${channelId}
                              pairedCount=${pairedCount}
                            />`
                        : html`<${ChannelAccountStatusBadge}
                            status=${accountStatus}
                            ownerAgentName=""
                            showAgentBadge=${false}
                            channelId=${channelId}
                            pairedCount=${pairedCount}
                          />`
                    }
                    <${OverflowMenu}
                      open=${menuOpenId === `${channelId}:${accountId}`}
                      ariaLabel="Open channel actions"
                      title="Open channel actions"
                      onClose=${() => setMenuOpenId("")}
                      onToggle=${() =>
                        setMenuOpenId((current) =>
                          current === `${channelId}:${accountId}`
                            ? ""
                            : `${channelId}:${accountId}`,
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
                  channelOrder: Number(channelOrderMap.get(channelId) ?? 9999),
                  accountOrder: Number(
                    accountOrderMap.get(`${channelId}:${accountId}`) ?? 9999,
                  ),
                  label: resolveChannelAccountLabel({
                    channelId,
                    account,
                    providerLabel: getChannelMeta(channelId).label || "Channel",
                  }),
                  isAwaitingPairing: accountStatus !== "paired",
                  detailText: isClickable ? "Workspace" : "",
                  detailChevron: isClickable,
                  clickable: isClickable,
                  onClick: isClickable
                    ? () =>
                        onNavigate(`telegram/${encodeURIComponent(accountId)}`)
                    : undefined,
                  trailing,
                };
              });
            })
            .sort((a, b) => {
              const awaitingDiff =
                Number(!!a?.isAwaitingPairing) - Number(!!b?.isAwaitingPairing);
              if (awaitingDiff !== 0) return awaitingDiff;
              const channelOrderDiff =
                Number(a?.channelOrder ?? 9999) - Number(b?.channelOrder ?? 9999);
              if (channelOrderDiff !== 0) return channelOrderDiff;
              const accountOrderDiff =
                Number(a?.accountOrder ?? 9999) - Number(b?.accountOrder ?? 9999);
              if (accountOrderDiff !== 0) return accountOrderDiff;
              return String(a?.label || "").localeCompare(String(b?.label || ""));
            })
        ;
    },
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
        loadingLabel=${loadingAccounts
          ? "Loading..."
          : "No channels configured"}
        actions=${html`
          <${AddChannelMenu}
            open=${menuOpenId === "__create_channel"}
            onClose=${() => setMenuOpenId("")}
            onToggle=${() =>
              setMenuOpenId((current) =>
                current === "__create_channel" ? "" : "__create_channel",
              )}
            triggerDisabled=${saving || loadingAccounts}
            channelIds=${ALL_CHANNELS}
            getChannelMeta=${getChannelMeta}
            isChannelDisabled=${(channelId) =>
              isChannelProviderDisabledForAdd({
                configuredChannelMap,
                provider: channelId,
              })}
            onSelectChannel=${openCreateChannelModal}
          />
        `}
      />
      <${CreateChannelModal}
        visible=${!!editingAccount}
        loading=${saving}
        createLoadingLabel=${createLoadingLabel}
        agents=${agents}
        existingChannels=${channelAccounts}
        mode=${editingAccount?.mode === "create" ? "create" : "edit"}
        account=${editingAccount}
        initialAgentId=${String(editingAccount?.ownerAgentId || "").trim()}
        initialProvider=${String(editingAccount?.provider || "").trim()}
        onClose=${() => setEditingAccount(null)}
        onSubmit=${editingAccount?.mode === "create"
          ? handleCreateChannel
          : handleUpdateChannel}
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
