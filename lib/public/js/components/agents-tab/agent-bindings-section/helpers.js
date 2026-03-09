export const announceBindingsChanged = (agentId) => {
  window.dispatchEvent(
    new CustomEvent("alphaclaw:agent-bindings-changed", {
      detail: { agentId: String(agentId || "").trim() },
    }),
  );
};

export const resolveChannelAccountLabel = ({ channelId, account = {} }) => {
  const providerLabel = channelId
    ? channelId.charAt(0).toUpperCase() + channelId.slice(1)
    : "Channel";
  const configuredName = String(account?.name || "").trim();
  if (configuredName) return configuredName;
  const accountId = String(account?.id || "").trim();
  if (!accountId || accountId === "default") return providerLabel;
  return `${providerLabel} ${accountId}`;
};

export const getChannelItemSortRank = (item = {}) => {
  if (item.isOwned) return 0;
  if (item.isUnconfigured) return 3;
  if (item.isAvailable) return 1;
  return 2;
};

export const getAccountStatusInfo = ({ statusInfo, accountId }) => {
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

export const getResolvedAccountStatusInfo = ({
  account,
  statusInfo,
  accountId,
}) => {
  const accountStatus = String(account?.status || "").trim();
  if (accountStatus) {
    return {
      status: accountStatus,
      paired: Number(account?.paired || 0),
    };
  }
  return getAccountStatusInfo({ statusInfo, accountId });
};

export const isImplicitDefaultAccount = ({ accountId, boundAgentId }) =>
  String(accountId || "").trim() === "default" &&
  !String(boundAgentId || "").trim();

export const canAgentBindAccount = ({
  accountId,
  boundAgentId,
  agentId,
  isDefaultAgent,
}) => {
  const normalizedBoundAgentId = String(boundAgentId || "").trim();
  if (normalizedBoundAgentId) {
    return normalizedBoundAgentId === String(agentId || "").trim();
  }
  if (isImplicitDefaultAccount({ accountId, boundAgentId })) {
    return !!isDefaultAgent;
  }
  return true;
};
