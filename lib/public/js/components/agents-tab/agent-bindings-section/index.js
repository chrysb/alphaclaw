import { h } from "https://esm.sh/preact";
import { useMemo } from "https://esm.sh/preact/hooks";
import htm from "https://esm.sh/htm";
import { ActionButton } from "../../action-button.js";
import { Badge } from "../../badge.js";
import { ChannelAccountStatusBadge } from "../../channel-account-status-badge.js";
import { ALL_CHANNELS, ChannelsCard } from "../../channels.js";
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

  const channelItems = useMemo(() => {
    const channelIds = Array.from(
      new Set([
        ...ALL_CHANNELS,
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

        let trailing = null;
        if (!configuredChannel && !statusInfo) {
          trailing = html`
            <button
              type="button"
              onclick=${(event) => {
                event.stopPropagation();
                openCreateChannelModal(channelId);
              }}
              class="text-xs px-2 py-1 rounded-lg ac-btn-ghost"
            >
              Configure
            </button>
          `;
          return [
            {
              id: `${channelId}:unconfigured`,
              channel: channelId,
              label: resolveChannelAccountLabel({
                channelId,
                account: { id: "default", name: "" },
              }),
              trailing,
              isOwned: false,
              isAvailable: true,
              isUnconfigured: true,
            },
          ];
        }

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
            label: resolveChannelAccountLabel({ channelId, account }),
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
      .sort((a, b) => {
        const rankDiff = getChannelItemSortRank(a) - getChannelItemSortRank(b);
        if (rankDiff !== 0) return rankDiff;
        const channelDiff = String(a?.channel || "").localeCompare(
          String(b?.channel || ""),
        );
        if (channelDiff !== 0) return channelDiff;
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
                <${ActionButton}
                  onClick=${() => openCreateChannelModal("")}
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
              `}
            />
          `
        : html`
            <div class="space-y-3">
              <${ChannelsCard}
                title="Channels"
                items=${channelItems}
                actions=${html`
                  <${ActionButton}
                    onClick=${() => openCreateChannelModal("")}
                    disabled=${saving}
                    loading=${saving && showCreateModal}
                    loadingMode="inline"
                    tone="subtle"
                    size="sm"
                    loadingLabel="Opening..."
                    idleIcon=${AddLineIcon}
                    idleIconClassName="h-3.5 w-3.5"
                    iconOnly=${true}
                    title="Add channel"
                    ariaLabel="Add channel"
                    idleLabel="Add channel"
                  />
                `}
              />
            </div>
          `}
      <${CreateChannelModal}
        visible=${showCreateModal}
        loading=${saving}
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
