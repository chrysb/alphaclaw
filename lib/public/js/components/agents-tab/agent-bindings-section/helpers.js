import {
  isImplicitDefaultAccount,
  resolveChannelAccountLabel,
} from "../../../lib/channel-accounts.js";

export const announceBindingsChanged = (agentId) => {
  window.dispatchEvent(
    new CustomEvent("alphaclaw:agent-bindings-changed", {
      detail: { agentId: String(agentId || "").trim() },
    }),
  );
};

export const announceRestartRequired = () => {
  window.dispatchEvent(new CustomEvent("alphaclaw:restart-required"));
};

export { resolveChannelAccountLabel };

export const getChannelItemSortRank = (item = {}) => {
  if (item.isAwaitingPairing) return 99;
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

export { isImplicitDefaultAccount };

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
