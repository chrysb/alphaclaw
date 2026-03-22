import { h } from "preact";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "preact/hooks";
import htm from "htm";
import { AddChannelMenu } from "./add-channel-menu.js";
import { ChannelAccountStatusBadge } from "./channel-account-status-badge.js";
import { ChannelLoginModal } from "./channel-login-modal.js";
import { ConfirmDialog } from "./confirm-dialog.js";
import { OverflowMenu, OverflowMenuItem } from "./overflow-menu.js";
import {
  deleteChannelAccount,
  fetchChannelAccounts,
  fetchChannelAccountLoginStatus,
  fetchRestartStatus,
  runChannelAccountLogin,
  updateChannelAccount,
} from "../lib/api.js";
import { useCachedFetch } from "../hooks/use-cached-fetch.js";
import { usePolling } from "../hooks/usePolling.js";
import {
  isImplicitDefaultAccount,
  resolveChannelAccountLabel,
} from "../lib/channel-accounts.js";
import { createChannelAccountWithProgress } from "../lib/channel-create-operation.js";
import { isChannelProviderDisabledForAdd } from "../lib/channel-provider-availability.js";
import { CreateChannelModal } from "./agents-tab/create-channel-modal.js";
import { showToast } from "./toast.js";

const html = htm.bind(h);

const ALL_CHANNELS = ["telegram", "discord", "slack", "whatsapp"];
const kChannelMeta = {
  telegram: { label: "Telegram", iconSrc: "/assets/icons/telegram.svg" },
  discord: { label: "Discord", iconSrc: "/assets/icons/discord.svg" },
  slack: { label: "Slack", iconSrc: "/assets/icons/slack.svg" },
  whatsapp: { label: "WhatsApp", iconSrc: "/assets/icons/whatsapp.svg" },
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

const appendTerminalOutput = (previousOutput = "", nextChunk = "") =>
  [String(previousOutput || "").trim(), String(nextChunk || "").trim()]
    .filter(Boolean)
    .join("\n\n");

const cloneLoginModalState = (state = {}) => ({
  loginAccount: state.loginAccount || null,
  loginOutput: String(state.loginOutput || ""),
  loginError: String(state.loginError || ""),
  loginRunning: !!state.loginRunning,
  loginMonitoring: !!state.loginMonitoring,
  loginCompleted: !!state.loginCompleted,
  loginLinked: !!state.loginLinked,
  loginRestartingGateway: !!state.loginRestartingGateway,
  loginRestartedGateway: !!state.loginRestartedGateway,
});

let kPreservedChannelLoginModalState = null;

const clearChannelLoginModalState = ({
  setLoginAccount,
  setLoginOutput,
  setLoginError,
  setLoginRunning,
  setLoginMonitoring,
  setLoginCompleted,
  setLoginLinked,
  setLoginRestartingGateway,
  setLoginRestartedGateway,
}) => {
  kPreservedChannelLoginModalState = null;
  setLoginAccount(null);
  setLoginOutput("");
  setLoginError("");
  setLoginRunning(false);
  setLoginMonitoring(false);
  setLoginCompleted(false);
  setLoginLinked(false);
  setLoginRestartingGateway(false);
  setLoginRestartedGateway(false);
};

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
                  ? "cursor-pointer hover:bg-surface -mx-2 px-2 rounded-lg transition-colors"
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
                    class="truncate ${item.dimmedLabel ? "text-fg-muted" : ""} ${item.labelClassName || ""}"
                    >${item.label || channelMeta.label}</span
                  >
                  ${item.detailText
                    ? html`
                        <span class="text-xs text-fg-muted ml-1 shrink-0">
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
                          class="text-fg-dim shrink-0"
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
        : html`<div class="text-fg-muted text-sm text-center py-2">
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
  onRestartGateway = async () => ({ ok: false }),
}) => {
  const preservedLoginState = cloneLoginModalState(kPreservedChannelLoginModalState || {});
  const [saving, setSaving] = useState(false);
  const [createLoadingLabel, setCreateLoadingLabel] = useState("Creating...");
  const [menuOpenId, setMenuOpenId] = useState("");
  const [editingAccount, setEditingAccount] = useState(null);
  const [deletingAccount, setDeletingAccount] = useState(null);
  const {
    data: channelAccountsPayload,
    loading: loadingAccounts,
    refresh: refreshChannelAccounts,
  } = useCachedFetch("/api/channels/accounts", fetchChannelAccounts, {
    maxAgeMs: 30000,
  });
  const channelAccounts = Array.isArray(channelAccountsPayload?.channels)
    ? channelAccountsPayload.channels
    : [];
  const [loginAccount, setLoginAccount] = useState(preservedLoginState.loginAccount);
  const [loginOutput, setLoginOutput] = useState(preservedLoginState.loginOutput);
  const [loginError, setLoginError] = useState(preservedLoginState.loginError);
  const [loginRunning, setLoginRunning] = useState(preservedLoginState.loginRunning);
  const [loginMonitoring, setLoginMonitoring] = useState(preservedLoginState.loginMonitoring);
  const [loginCompleted, setLoginCompleted] = useState(preservedLoginState.loginCompleted);
  const [loginLinked, setLoginLinked] = useState(preservedLoginState.loginLinked);
  const [loginRestartingGateway, setLoginRestartingGateway] = useState(
    preservedLoginState.loginRestartingGateway,
  );
  const [loginRestartedGateway, setLoginRestartedGateway] = useState(
    preservedLoginState.loginRestartedGateway,
  );
  const [loginRestartStatusChecked, setLoginRestartStatusChecked] = useState(false);

  const loadChannelAccounts = useCallback(async () => {
    try {
      await refreshChannelAccounts({ force: true });
    } catch {}
  }, [refreshChannelAccounts]);

  const loginStatusPoll = usePolling(
    () =>
      fetchChannelAccountLoginStatus({
        provider: loginAccount?.provider,
        accountId: loginAccount?.id,
      }),
    1000,
    {
      enabled:
        !!loginAccount &&
        !!loginMonitoring &&
        String(loginAccount?.provider || "").trim() === "whatsapp",
    },
  );
  const restartStatusPoll = usePolling(fetchRestartStatus, 2000, {
    enabled: !!loginAccount && !!loginRestartingGateway,
  });

  const appendLoginOutput = useCallback((nextChunk = "") => {
    setLoginOutput((currentOutput) => appendTerminalOutput(currentOutput, nextChunk));
  }, []);

  useEffect(() => {
    const nextState = cloneLoginModalState({
      loginAccount,
      loginOutput,
      loginError,
      loginRunning,
      loginMonitoring,
      loginCompleted,
      loginLinked,
      loginRestartingGateway,
      loginRestartedGateway,
    });
    const hasActiveLoginState =
      !!nextState.loginAccount ||
      !!nextState.loginOutput ||
      !!nextState.loginError ||
      !!nextState.loginRunning ||
      !!nextState.loginMonitoring ||
      !!nextState.loginCompleted ||
      !!nextState.loginLinked ||
      !!nextState.loginRestartingGateway ||
      !!nextState.loginRestartedGateway;
    kPreservedChannelLoginModalState = hasActiveLoginState ? nextState : null;
  }, [
    loginAccount,
    loginCompleted,
    loginError,
    loginLinked,
    loginMonitoring,
    loginOutput,
    loginRestartedGateway,
    loginRestartingGateway,
    loginRunning,
  ]);

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

  useEffect(() => {
    const handleOpenWhatsAppQr = () => {
      const configuredWhatsApp = channelAccounts.find(
        (entry) => String(entry?.channel || "").trim() === "whatsapp",
      );
      const account = Array.isArray(configuredWhatsApp?.accounts)
        ? configuredWhatsApp.accounts[0]
        : null;
      if (!account) return;
      const accountId = String(account?.id || "").trim() || "default";
      const boundAgentId = String(account?.boundAgentId || "").trim();
      const ownerAgentId =
        boundAgentId ||
        (isImplicitDefaultAccount({ accountId, boundAgentId })
          ? defaultAgentId
          : "");
      const accountData = {
        id: accountId,
        provider: "whatsapp",
        name: resolveChannelAccountLabel({
          channelId: "whatsapp",
          account,
          providerLabel: getChannelMeta("whatsapp").label || "WhatsApp",
        }),
        ownerAgentId,
        envKey: String(account?.envKey || "").trim(),
        token: String(account?.token || "").trim(),
      };
      setLoginAccount(accountData);
      setLoginOutput("");
      setLoginError("");
      setLoginRunning(false);
      setLoginMonitoring(false);
      setLoginCompleted(false);
      setLoginLinked(false);
      setLoginRestartingGateway(false);
      setLoginRestartedGateway(false);
      setLoginRestartStatusChecked(false);
    };
    window.addEventListener("alphaclaw:open-whatsapp-qr", handleOpenWhatsAppQr);
    return () => {
      window.removeEventListener("alphaclaw:open-whatsapp-qr", handleOpenWhatsAppQr);
    };
  }, [channelAccounts, defaultAgentId]);

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
  const handleRunChannelLogin = async () => {
    if (!loginAccount) return;
    setLoginRunning(true);
    setLoginMonitoring(true);
    setLoginCompleted(false);
    setLoginLinked(false);
    setLoginRestartingGateway(false);
    setLoginRestartedGateway(false);
    setLoginRestartStatusChecked(false);
    setLoginError("");
    setLoginOutput("");
    try {
      const result = await runChannelAccountLogin({
        provider: loginAccount.provider,
        accountId: loginAccount.id,
      });
      const combinedOutput = appendTerminalOutput(result?.stdout || "", result?.stderr || "");
      setLoginOutput(combinedOutput || "No terminal output captured.");
      setLoginCompleted(!!result?.completed);
      if (result?.completed) {
        await loginStatusPoll.refresh();
      }
    } catch (error) {
      setLoginError(String(error?.message || "Could not start channel login"));
      setLoginMonitoring(false);
    } finally {
      setLoginRunning(false);
    }
  };

  useEffect(() => {
    if (!loginAccount || !loginMonitoring || loginLinked || loginRestartingGateway) {
      return;
    }
    if (!loginStatusPoll.data?.linked) return;

    let cancelled = false;
    setLoginLinked(true);
    setLoginError("");
    appendLoginOutput("✅ Saved WhatsApp credentials detected.");

    (async () => {
      setLoginRestartingGateway(true);
      setLoginRestartStatusChecked(false);
      appendLoginOutput("Restarting the gateway so the new WhatsApp session comes online...");
      try {
        const restartResult = await onRestartGateway();
        if (restartResult && restartResult.ok === false) {
          throw new Error(restartResult.error || "Could not restart gateway");
        }
        if (cancelled) return;
        appendLoginOutput("✅ Gateway restart triggered. Waiting for it to come back online...");
        await restartStatusPoll.refresh();
        if (cancelled) return;
        setLoginRestartStatusChecked(true);
      } catch (error) {
        if (cancelled) return;
        setLoginError(String(error?.message || "Could not restart gateway"));
        appendLoginOutput(
          "WhatsApp linked, but the gateway restart failed. You may need to restart it manually.",
        );
        setLoginRestartStatusChecked(false);
        setLoginRestartingGateway(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    appendLoginOutput,
    loadChannelAccounts,
    loginAccount,
    loginLinked,
    loginMonitoring,
    loginRestartingGateway,
    loginStatusPoll.data?.linked,
    onRefreshStatuses,
    onRestartGateway,
    restartStatusPoll.refresh,
  ]);

  useEffect(() => {
    if (!loginAccount || !loginRestartingGateway) return;
    if (!loginRestartStatusChecked) return;
    const restartInProgress = !!restartStatusPoll.data?.restartInProgress;
    const gatewayRunning = restartStatusPoll.data?.gatewayRunning !== false;
    if (restartInProgress || !gatewayRunning) return;

    let cancelled = false;

    (async () => {
      setLoginRestartedGateway(true);
      setLoginMonitoring(false);
      appendLoginOutput("✅ Gateway restart complete.");
      showToast("Channel linked", "success");
      await Promise.all([
        loadChannelAccounts(),
        Promise.resolve(onRefreshStatuses?.()),
      ]);
      if (cancelled) return;
      clearChannelLoginModalState({
        setLoginAccount,
        setLoginOutput,
        setLoginError,
        setLoginRunning,
        setLoginMonitoring,
        setLoginCompleted,
        setLoginLinked,
        setLoginRestartingGateway,
        setLoginRestartedGateway,
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [
    appendLoginOutput,
    loadChannelAccounts,
    loginAccount,
    loginRestartStatusChecked,
    loginRestartingGateway,
    onRefreshStatuses,
    restartStatusPoll.data?.gatewayRunning,
    restartStatusPoll.data?.restartInProgress,
  ]);

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
                      ${channelId === "whatsapp"
                        ? html`
                            <${OverflowMenuItem}
                              onClick=${() => {
                                setMenuOpenId("");
                                setLoginAccount(accountData);
                                setLoginOutput("");
                                setLoginError("");
                                setLoginRunning(false);
                                setLoginMonitoring(false);
                                setLoginCompleted(false);
                                setLoginLinked(false);
                                setLoginRestartingGateway(false);
                                setLoginRestartedGateway(false);
                                setLoginRestartStatusChecked(false);
                              }}
                            >
                              Link WhatsApp (QR)
                            </${OverflowMenuItem}>
                          `
                        : null}
                      <${OverflowMenuItem}
                        className="text-status-error hover:text-status-error"
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
      <${ChannelLoginModal}
        visible=${!!loginAccount}
        loading=${loginRunning || loginRestartingGateway}
        title=${`Link ${String(loginAccount?.name || "WhatsApp").trim()} via QR`}
        output=${loginOutput}
        error=${loginError}
        onRun=${handleRunChannelLogin}
        onClose=${() => {
          if (loginRunning || loginRestartingGateway) return;
          clearChannelLoginModalState({
            setLoginAccount,
            setLoginOutput,
            setLoginError,
            setLoginRunning,
            setLoginMonitoring,
            setLoginCompleted,
            setLoginLinked,
            setLoginRestartingGateway,
            setLoginRestartedGateway,
          });
        }}
        runDisabled=${loginRunning || loginRestartingGateway || loginRestartedGateway}
        runLabel=${loginLinked
          ? loginRestartingGateway
            ? "Restarting..."
            : loginRestartedGateway
              ? "Linked"
              : "Awaiting restart..."
          : "Generate QR"}
        runLoadingLabel=${loginRestartingGateway ? "Restarting..." : "Running..."}
        closeLabel=${loginRestartedGateway ? "Done" : "Close"}
      />
    </div>
  `;
};

export { ALL_CHANNELS, getChannelMeta, kChannelMeta };
