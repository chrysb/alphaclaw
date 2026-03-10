import { h } from "https://esm.sh/preact";
import { useMemo } from "https://esm.sh/preact/hooks";
import htm from "https://esm.sh/htm";
import { ActionButton } from "../../action-button.js";
import { Badge } from "../../badge.js";
import { ChannelAccountStatusBadge } from "../../channel-account-status-badge.js";
import { ALL_CHANNELS, ChannelsCard, getChannelMeta } from "../../channels.js";
import { ConfirmDialog } from "../../confirm-dialog.js";
import { AddLineIcon } from "../../icons.js";
import { OverflowMenu, OverflowMenuItem } from "../../overflow-menu.js";
import { CreateChannelModal } from "../create-channel-modal.js";
import {
  canAgentBindAccount,
  getChannelItemSortRank,
  getResolvedAccountStatusInfo,
  isImplicitDefaultAccount,
  resolveChannelAccountLabel,
} from "./helpers.js";
import { useAgentBindings } from "./use-agent-bindings.js";

const html = htm.bind(h);

export const AgentBindingsSection = ({
  agent = {},
  agents = [],
  onSetLocation = () => {},
}) => {
  const {
    agentId,
    agentNameMap,
    channelStatus,
    channels,
    configuredChannelMap,
    configuredChannels,
    createLoadingLabel,
    createProvider,
    defaultAgentId,
    deletingAccount,
    editingAccount,
    handleCreateChannel,
    handleDeleteChannel,
    handleQuickBind,
    handleUpdateChannel,
    isDefaultAgent,
    loading,
    menuOpenId,
    openCreateChannelModal,
    openDeleteChannelDialog,
    openEditChannelModal,
    pendingBindAccount,
    requestBindAccount,
    saving,
    setCreateProvider,
    setDeletingAccount,
    setEditingAccount,
    setMenuOpenId,
    setPendingBindAccount,
    setShowCreateModal,
    showCreateModal,
  } = useAgentBindings({ agent, agents });
  const hasDiscordAccount = useMemo(() => {
    const discordChannel = configuredChannelMap.get("discord");
    return Array.isArray(discordChannel?.accounts) && discordChannel.accounts.length > 0;
  }, [configuredChannelMap]);

  const channelItems = useMemo(() => {
    const channelOrderMap = new Map(
      configuredChannels.map((entry, index) => [
        String(entry?.channel || "").trim(),
        index,
      ]),
    );
    const accountOrderMap = new Map(
      configuredChannels.flatMap((entry) =>
        (Array.isArray(entry?.accounts) ? entry.accounts : []).map(
          (account, accountIndex) => [
            `${String(entry?.channel || "").trim()}:${String(account?.id || "").trim() || "default"}`,
            accountIndex,
          ],
        ),
      ),
    );
    const channelIds = Array.from(
      new Set([
        ...configuredChannels.map((entry) => String(entry.channel || "").trim()),
      ]),
    ).filter(Boolean);

    return channelIds
      .flatMap((channelId) => {
        const configuredChannel = configuredChannelMap.get(channelId);
        const statusInfo = channelStatus?.[channelId] || null;
        const accounts = Array.isArray(configuredChannel?.accounts)
          ? configuredChannel.accounts
          : [];

        if (!configuredChannel && !statusInfo) return [];

        return accounts.map((account) => {
          const accountId = String(account?.id || "").trim() || "default";
          const boundAgentId = String(account?.boundAgentId || "").trim();
          const accountStatusInfo = getResolvedAccountStatusInfo({
            account,
            statusInfo,
            accountId,
          });
          const isImplicitDefaultOwned =
            isDefaultAgent &&
            isImplicitDefaultAccount({ accountId, boundAgentId });
          const isOwned = boundAgentId === agentId || isImplicitDefaultOwned;
          const isImplicitDefaultElsewhere =
            !isDefaultAgent &&
            isImplicitDefaultAccount({ accountId, boundAgentId });
          const isAvailable = canAgentBindAccount({
            accountId,
            boundAgentId,
            agentId,
            isDefaultAgent,
          });
          const ownerAgentId =
            boundAgentId ||
            (isImplicitDefaultAccount({ accountId, boundAgentId })
              ? defaultAgentId
              : "");
          const ownerAgentName = String(
            agentNameMap.get(ownerAgentId) || ownerAgentId || "",
          ).trim();
          const canNavigateToOwnerAgent =
            !!ownerAgentId && ownerAgentId !== agentId && !!ownerAgentName;
          const canOpenWorkspace =
            channelId === "telegram" &&
            isOwned &&
            accountStatusInfo?.status === "paired" &&
            isDefaultAgent;

          const accountData = {
            id: accountId,
            provider: channelId,
            name: resolveChannelAccountLabel({ channelId, account }),
            rawName: String(account?.name || "").trim(),
            ownerAgentId,
            ownerAgentName,
            boundAgentId,
            isOwned,
            envKey: String(account?.envKey || "").trim(),
            token: String(account?.token || "").trim(),
            isAvailable,
            isBoundElsewhere:
              !isOwned &&
              (!isAvailable || isImplicitDefaultElsewhere || !!ownerAgentId),
          };
          if (accountData.isBoundElsewhere) return null;

          let statusTrailing = null;
          if (isOwned) {
            statusTrailing =
              accountStatusInfo?.status === "paired"
                ? html`<${ChannelAccountStatusBadge}
                    status=${accountStatusInfo?.status}
                    ownerAgentName=${ownerAgentName}
                    showAgentBadge=${true}
                    channelId=${channelId}
                    pairedCount=${accountStatusInfo?.paired ?? 0}
                  />`
                : html`<${ChannelAccountStatusBadge}
                    status=${accountStatusInfo?.status}
                    ownerAgentName=""
                    showAgentBadge=${false}
                    channelId=${channelId}
                    pairedCount=${accountStatusInfo?.paired ?? 0}
                  />`;
          } else if (isAvailable) {
            statusTrailing = html`
              <button
                type="button"
                onclick=${(event) => {
                  event.stopPropagation();
                  requestBindAccount(accountData);
                }}
                class="text-xs px-2 py-1 rounded-lg ac-btn-ghost"
              >
                Bind
              </button>
            `;
          } else {
            statusTrailing = html`
              ${canNavigateToOwnerAgent
                ? html`
                    <button
                      type="button"
                      class="inline-flex rounded-full transition-[filter] hover:brightness-125 focus:outline-none focus:ring-1 focus:ring-border"
                      onclick=${(event) => {
                        event.stopPropagation();
                        onSetLocation(`/agents/${encodeURIComponent(ownerAgentId)}`);
                      }}
                      title=${`Open ${ownerAgentName}`}
                      aria-label=${`Open ${ownerAgentName}`}
                    >
                      <${Badge} tone="neutral">${ownerAgentName}</${Badge}>
                    </button>
                  `
                : html`<${Badge} tone="neutral">${ownerAgentName || "Bound elsewhere"}</${Badge}>`}
            `;
          }

          const showBindAction = accountData.isBoundElsewhere;
          const accountTrailing = html`
            <div class="flex items-center gap-1.5">
              ${statusTrailing}
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
                  onClick=${() => openEditChannelModal(accountData)}
                >
                  Edit
                </${OverflowMenuItem}>
                ${showBindAction
                  ? html`
                      <${OverflowMenuItem}
                        onClick=${() => requestBindAccount(accountData)}
                      >
                        Bind
                      </${OverflowMenuItem}>
                    `
                  : null}
                <${OverflowMenuItem}
                  className="text-red-300 hover:text-red-200"
                  onClick=${() => openDeleteChannelDialog(accountData)}
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
            label: resolveChannelAccountLabel({ channelId, account }),
            isAwaitingPairing: accountStatusInfo?.status !== "paired",
            clickable: canOpenWorkspace,
            onClick: canOpenWorkspace ? () => onSetLocation(`/telegram/${encodeURIComponent(account?.id || "default")}`) : undefined,
            detailText: canOpenWorkspace ? "Workspace" : "",
            detailChevron: canOpenWorkspace,
            trailing: accountTrailing,
            isOwned,
            isAvailable,
          };
        });
      })
      .filter(Boolean)
      .sort((a, b) => {
        const rankDiff = getChannelItemSortRank(a) - getChannelItemSortRank(b);
        if (rankDiff !== 0) return rankDiff;
        const channelOrderDiff =
          Number(a?.channelOrder ?? 9999) - Number(b?.channelOrder ?? 9999);
        if (channelOrderDiff !== 0) return channelOrderDiff;
        const accountOrderDiff =
          Number(a?.accountOrder ?? 9999) - Number(b?.accountOrder ?? 9999);
        if (accountOrderDiff !== 0) return accountOrderDiff;
        return String(a?.label || "").localeCompare(String(b?.label || ""));
      });
  }, [
    agentId,
    agentNameMap,
    channelStatus,
    configuredChannelMap,
    configuredChannels,
    defaultAgentId,
    isDefaultAgent,
    menuOpenId,
    onSetLocation,
    openCreateChannelModal,
    openDeleteChannelDialog,
    openEditChannelModal,
    requestBindAccount,
    setMenuOpenId,
  ]);

  return html`
    <div class="space-y-3">
      ${loading
        ? html`
            <${ChannelsCard}
              title="Channels"
              items=${[]}
              loadingLabel="Loading channels..."
              actions=${html`
                <div class="relative">
                  <${ActionButton}
                    onClick=${() => {}}
                    disabled=${true}
                    tone="subtle"
                    size="sm"
                    idleIcon=${AddLineIcon}
                    idleIconClassName="h-3.5 w-3.5"
                    iconOnly=${true}
                    title="Add channel"
                    ariaLabel="Add channel"
                    idleLabel="Add channel"
                  />
                </div>
              `}
            />
          `
        : html`
            <div class="space-y-3">
              <${ChannelsCard}
                title="Channels"
                items=${channelItems}
                actions=${html`
                  <${OverflowMenu}
                    open=${menuOpenId === "__create_channel"}
                    ariaLabel="Add channel"
                    title="Add channel"
                    onClose=${() => setMenuOpenId("")}
                    onToggle=${() =>
                      setMenuOpenId((current) =>
                        current === "__create_channel" ? "" : "__create_channel",
                      )}
                    renderTrigger=${({ onToggle, ariaLabel, title }) => html`
                      <${ActionButton}
                        onClick=${onToggle}
                        disabled=${saving}
                        loading=${false}
                        loadingMode="inline"
                        tone="subtle"
                        size="sm"
                        loadingLabel="Opening..."
                        idleIcon=${AddLineIcon}
                        idleIconClassName="h-3.5 w-3.5"
                        iconOnly=${true}
                        title=${title}
                        ariaLabel=${ariaLabel}
                        idleLabel="Add channel"
                      />
                    `}
                  >
                    ${ALL_CHANNELS.map((channelId) => {
                      const channelMeta = getChannelMeta(channelId);
                      const isDisabled = channelId === "discord" && hasDiscordAccount;
                      return html`
                        <${OverflowMenuItem}
                          key=${channelId}
                          iconSrc=${channelMeta.iconSrc}
                          disabled=${isDisabled}
                          onClick=${() => openCreateChannelModal(channelId)}
                        >
                          ${channelMeta.label}
                        </${OverflowMenuItem}>
                      `;
                    })}
                  </${OverflowMenu}>
                `}
              />
            </div>
          `}
      <${CreateChannelModal}
        visible=${showCreateModal}
        loading=${saving}
        createLoadingLabel=${createLoadingLabel}
        agents=${agents}
        existingChannels=${channels}
        initialAgentId=${agentId}
        initialProvider=${createProvider}
        onClose=${() => {
          setShowCreateModal(false);
          setCreateProvider("");
        }}
        onSubmit=${handleCreateChannel}
      />
      <${CreateChannelModal}
        visible=${!!editingAccount}
        loading=${saving}
        agents=${agents}
        existingChannels=${channels}
        mode="edit"
        account=${editingAccount}
        initialAgentId=${String(editingAccount?.ownerAgentId || agentId || "").trim()}
        initialProvider=${String(editingAccount?.provider || "").trim()}
        onClose=${() => setEditingAccount(null)}
        onSubmit=${handleUpdateChannel}
      />
      <${ConfirmDialog}
        visible=${!!pendingBindAccount}
        title=${`Bind ${String(pendingBindAccount?.name || "this channel").trim()} to ${String(agent?.name || agentId).trim()}?`}
        message=""
        details=${pendingBindAccount
          ? html`
              <p class="text-xs text-gray-500">
                This will remove access for ${String(
                  pendingBindAccount?.ownerAgentName || "the other agent",
                ).trim()} to this channel.
              </p>
            `
          : null}
        confirmLabel="Bind channel"
        confirmLoadingLabel="Binding..."
        confirmTone="warning"
        confirmLoading=${saving}
        onConfirm=${() => handleQuickBind(pendingBindAccount)}
        onCancel=${() => {
          if (saving) return;
          setPendingBindAccount(null);
        }}
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
