import { h } from "https://esm.sh/preact";
import htm from "https://esm.sh/htm";
import { ActionButton } from "../../action-button.js";
import { ALL_CHANNELS, ChannelsCard, getChannelMeta } from "../../channels.js";
import { ConfirmDialog } from "../../confirm-dialog.js";
import { AddLineIcon } from "../../icons.js";
import { OverflowMenu, OverflowMenuItem } from "../../overflow-menu.js";
import { CreateChannelModal } from "../create-channel-modal.js";
import { ChannelCardItem } from "./channel-item-trailing.js";
import { useAgentBindings } from "./use-agent-bindings.js";
import { useChannelItems } from "./use-channel-items.js";

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
  const { hasDiscordAccount, mergedChannelItems } = useChannelItems({
    agentId,
    agentNameMap,
    channelStatus,
    configuredChannelMap,
    configuredChannels,
    defaultAgentId,
    isDefaultAgent,
  });

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
                items=${mergedChannelItems}
                loadingLabel="No channels assigned to this agent."
                renderItem=${({ item, channelMeta }) => {
                  if (String(item?.id || "").trim() === "__assigned_elsewhere_toggle") {
                    return null;
                  }
                  return html`<${ChannelCardItem}
                    item=${item}
                    channelMeta=${channelMeta}
                    menuOpenId=${menuOpenId}
                    setMenuOpenId=${setMenuOpenId}
                    openDeleteChannelDialog=${openDeleteChannelDialog}
                    openEditChannelModal=${openEditChannelModal}
                    requestBindAccount=${requestBindAccount}
                    onSetLocation=${onSetLocation}
                  />`;
                }}
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
