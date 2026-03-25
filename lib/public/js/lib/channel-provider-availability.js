const kSingleAccountChannelProviders = new Set(["discord", "slack"]);

const hasConfiguredAccounts = ({ configuredChannelMap, provider }) => {
  const channelEntry = configuredChannelMap instanceof Map
    ? configuredChannelMap.get(String(provider || "").trim())
    : null;
  return (
    Array.isArray(channelEntry?.accounts) &&
    channelEntry.accounts.length > 0
  );
};

export const isSingleAccountChannelProvider = (provider = "") =>
  kSingleAccountChannelProviders.has(String(provider || "").trim());

export const isChannelProviderDisabledForAdd = ({
  configuredChannelMap = new Map(),
  provider = "",
} = {}) => {
  if (!isSingleAccountChannelProvider(provider)) return false;
  return hasConfiguredAccounts({ configuredChannelMap, provider });
};

