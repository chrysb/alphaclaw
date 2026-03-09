import { h } from "https://esm.sh/preact";
import { useCallback, useEffect, useMemo, useState } from "https://esm.sh/preact/hooks";
import htm from "https://esm.sh/htm";
import { ActionButton } from "../action-button.js";
import { Badge } from "../badge.js";
import { ALL_CHANNELS, ChannelsCard } from "../channels.js";
import { ConfirmDialog } from "../confirm-dialog.js";
import { AddLineIcon } from "../icons.js";
import { OverflowMenu, OverflowMenuItem } from "../overflow-menu.js";
import {
  createChannelAccount,
  deleteChannelAccount,
  fetchChannelAccounts,
  fetchStatus,
  updateChannelAccount,
} from "../../lib/api.js";
import { CreateChannelModal } from "./create-channel-modal.js";
import { showToast } from "../toast.js";

const html = htm.bind(h);

const announceBindingsChanged = (agentId) => {
  window.dispatchEvent(
    new CustomEvent("alphaclaw:agent-bindings-changed", {
      detail: { agentId: String(agentId || "").trim() },
    }),
  );
};

const resolveChannelAccountLabel = ({ channelId, account = {} }) => {
  const providerLabel = channelId
    ? channelId.charAt(0).toUpperCase() + channelId.slice(1)
    : "Channel";
  const configuredName = String(account?.name || "").trim();
  if (configuredName) return configuredName;
  const accountId = String(account?.id || "").trim();
  if (!accountId || accountId === "default") return providerLabel;
  return `${providerLabel} ${accountId}`;
};

const getChannelItemSortRank = (item = {}) => {
  if (item.isOwned) return 0;
  if (item.isAvailable) return 1;
  return 2;
};

const getAccountStatusInfo = ({ statusInfo, accountId }) => {
  const normalizedAccountId = String(accountId || "").trim() || "default";
  const accountStatuses =
    statusInfo?.accounts && typeof statusInfo.accounts === "object"
      ? statusInfo.accounts
      : null;
  if (accountStatuses?.[normalizedAccountId]) {
    return accountStatuses[normalizedAccountId];
  }
  if (normalizedAccountId === "default" && statusInfo) {
    return statusInfo;
  }
  return null;
};

const getResolvedAccountStatusInfo = ({ account, statusInfo, accountId }) => {
  const accountStatus = String(account?.status || "").trim();
  if (accountStatus) {
    return {
      status: accountStatus,
      paired: Number(account?.paired || 0),
    };
  }
  return getAccountStatusInfo({ statusInfo, accountId });
};

const isImplicitDefaultAccount = ({ accountId, boundAgentId }) =>
  String(accountId || "").trim() === "default" && !String(boundAgentId || "").trim();

const canAgentBindAccount = ({ accountId, boundAgentId, agentId, isDefaultAgent }) => {
  const normalizedBoundAgentId = String(boundAgentId || "").trim();
  if (normalizedBoundAgentId) {
    return normalizedBoundAgentId === String(agentId || "").trim();
  }
  if (isImplicitDefaultAccount({ accountId, boundAgentId })) {
    return !!isDefaultAgent;
  }
  return true;
};

export const AgentBindingsSection = ({
  agent = {},
  agents = [],
  onSetLocation = () => {},
}) => {
  const [channels, setChannels] = useState([]);
  const [channelStatus, setChannelStatus] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createProvider, setCreateProvider] = useState("");
  const [menuOpenId, setMenuOpenId] = useState("");
  const [editingAccount, setEditingAccount] = useState(null);
  const [deletingAccount, setDeletingAccount] = useState(null);
  const [pendingBindAccount, setPendingBindAccount] = useState(null);

  const agentId = String(agent?.id || "").trim();
  const isDefaultAgent = !!agent?.default;
  const defaultAgentId = useMemo(
    () => String(agents.find((entry) => entry?.default)?.id || "").trim(),
    [agents],
  );
  const agentNameMap = useMemo(
    () =>
      new Map(
        agents.map((entry) => [
          String(entry?.id || "").trim(),
          String(entry?.name || "").trim() || String(entry?.id || "").trim(),
        ]),
      ),
    [agents],
  );

  const load = useCallback(async ({ includeStatus = true } = {}) => {
    setLoading(true);
    try {
      const requests = [fetchChannelAccounts(), includeStatus ? fetchStatus() : Promise.resolve(null)];
      const [channelsResult, statusResult] = await Promise.all(requests);
      setChannels(Array.isArray(channelsResult?.channels) ? channelsResult.channels : []);
      if (includeStatus && statusResult) {
        setChannelStatus(statusResult?.channels || {});
      }
    } finally {
      setLoading(false);
    }
  }, [agentId]);

  useEffect(() => {
    if (!agentId) return;
    load().catch(() => {});
  }, [agentId, load]);

  useEffect(() => {
    const handlePairingsChanged = (event) => {
      const changedAgentId = String(event?.detail?.agentId || "").trim();
      if (changedAgentId && changedAgentId !== agentId) return;
      load({ includeStatus: true }).catch(() => {});
    };
    window.addEventListener("alphaclaw:pairings-changed", handlePairingsChanged);
    return () => {
      window.removeEventListener("alphaclaw:pairings-changed", handlePairingsChanged);
    };
  }, [agentId, load]);

  useEffect(() => {
    if (!menuOpenId) return undefined;
    const handleWindowClick = () => setMenuOpenId("");
    window.addEventListener("click", handleWindowClick);
    return () => window.removeEventListener("click", handleWindowClick);
  }, [menuOpenId]);

  const configuredChannels = useMemo(
    () =>
      channels.filter(
        (entry) =>
          String(entry?.channel || "").trim()
          && Array.isArray(entry?.accounts)
          && entry.accounts.length > 0,
      ),
    [channels],
  );

  const configuredChannelMap = useMemo(
    () =>
      new Map(
        configuredChannels.map((entry) => [
          String(entry.channel || "").trim(),
          entry,
        ]),
      ),
    [configuredChannels],
  );

  const openCreateChannelModal = (channelId = "") => {
    setCreateProvider(String(channelId || "").trim());
    setShowCreateModal(true);
  };

  const openEditChannelModal = (account) => {
    setMenuOpenId("");
    setEditingAccount(account);
  };

  const openDeleteChannelDialog = (account) => {
    setMenuOpenId("");
    setDeletingAccount(account);
  };

  const requestBindAccount = (account) => {
    if (!account) return;
    const ownerAgentId = String(account?.ownerAgentId || "").trim();
    const ownerAgentName = String(account?.ownerAgentName || "").trim();
    if (ownerAgentId && ownerAgentId !== agentId && ownerAgentName) {
      setMenuOpenId("");
      setPendingBindAccount(account);
      return;
    }
    handleQuickBind(account);
  };

  const handleCreateChannel = async (payload) => {
    setSaving(true);
    try {
      const result = await createChannelAccount(payload);
      setShowCreateModal(false);
      setCreateProvider("");
      announceBindingsChanged(String(result?.binding?.agentId || payload.agentId || "").trim());
      showToast("Channel added", "success");
      load({ includeStatus: false }).catch(() => {});
    } catch (error) {
      showToast(error.message || "Could not add channel", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateChannel = async (payload) => {
    setSaving(true);
    try {
      await updateChannelAccount(payload);
      setEditingAccount(null);
      announceBindingsChanged(String(payload.agentId || "").trim());
      showToast("Channel updated", "success");
      await load();
    } catch (error) {
      showToast(error.message || "Could not update channel", "error");
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
      announceBindingsChanged(agentId);
      showToast("Channel deleted", "success");
      await load({ includeStatus: false });
    } catch (error) {
      showToast(error.message || "Could not delete channel", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleQuickBind = async (account) => {
    if (!account) return;
    setSaving(true);
    try {
      await updateChannelAccount({
        provider: account.provider,
        accountId: account.id,
        name: account.name,
        agentId,
      });
      setMenuOpenId("");
      setPendingBindAccount(null);
      announceBindingsChanged(agentId);
      showToast("Channel bound", "success");
      await load();
    } catch (error) {
      showToast(error.message || "Could not bind channel", "error");
    } finally {
      setSaving(false);
    }
  };

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
            isDefaultAgent && isImplicitDefaultAccount({ accountId, boundAgentId });
          const isOwned = boundAgentId === agentId || isImplicitDefaultOwned;
          const isImplicitDefaultElsewhere =
            !isDefaultAgent && isImplicitDefaultAccount({ accountId, boundAgentId });
          const isAvailable = canAgentBindAccount({
            accountId,
            boundAgentId,
            agentId,
            isDefaultAgent,
          });
          const ownerAgentId =
            boundAgentId || (isImplicitDefaultAccount({ accountId, boundAgentId }) ? defaultAgentId : "");
          const ownerAgentName = String(agentNameMap.get(ownerAgentId) || ownerAgentId || "").trim();
          const canNavigateToOwnerAgent =
            !!ownerAgentId && ownerAgentId !== agentId && !!ownerAgentName;
          const canOpenWorkspace =
            channelId === "telegram"
            && isOwned
            && accountStatusInfo?.status === "paired"
            && isDefaultAgent;

          const accountData = {
            id: accountId,
            provider: channelId,
            name: resolveChannelAccountLabel({ channelId, account }),
            rawName: String(account?.name || "").trim(),
            ownerAgentId,
            ownerAgentName,
            boundAgentId,
            isOwned,
            isAvailable,
            isBoundElsewhere: !isOwned && (!isAvailable || isImplicitDefaultElsewhere || !!ownerAgentId),
          };

          let statusTrailing = null;
          if (isOwned) {
            statusTrailing =
              accountStatusInfo?.status === "paired"
                ? html`<${Badge} tone="success">Paired</${Badge}>`
                : html`<${Badge} tone="warning">Awaiting pairing</${Badge}>`;
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
                    current === `${channelId}:${accountId}` ? "" : `${channelId}:${accountId}`,
                  )}
              >
                <${OverflowMenuItem} onClick=${() => openEditChannelModal(accountData)}>
                  Edit
                </${OverflowMenuItem}>
                ${showBindAction
                  ? html`
                      <${OverflowMenuItem} onClick=${() => requestBindAccount(accountData)}>
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
            onClick: canOpenWorkspace ? () => onSetLocation("/telegram") : undefined,
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
        const channelDiff = String(a?.channel || "").localeCompare(String(b?.channel || ""));
        if (channelDiff !== 0) return channelDiff;
        return String(a?.label || "").localeCompare(String(b?.label || ""));
      });
  }, [
    agentId,
    channelStatus,
    configuredChannelMap,
    configuredChannels,
    defaultAgentId,
    agentNameMap,
    isDefaultAgent,
    menuOpenId,
    onSetLocation,
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
                  idleIconClassName="h-4 w-4"
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
                    idleIconClassName="h-4 w-4"
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
