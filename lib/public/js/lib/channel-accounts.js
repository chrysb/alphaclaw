export const resolveChannelAccountLabel = ({
  channelId,
  account = {},
  providerLabel = "",
}) => {
  const fallbackProviderLabel = channelId
    ? channelId.charAt(0).toUpperCase() + channelId.slice(1)
    : "Channel";
  const resolvedProviderLabel = String(providerLabel || "").trim()
    || fallbackProviderLabel;
  const configuredName = String(account?.name || "").trim();
  if (configuredName) return configuredName;
  const accountId = String(account?.id || "").trim();
  if (!accountId || accountId === "default") return resolvedProviderLabel;
  return `${resolvedProviderLabel} ${accountId}`;
};

export const isImplicitDefaultAccount = ({ accountId, boundAgentId }) =>
  String(accountId || "").trim() === "default" &&
  !String(boundAgentId || "").trim();
