const kTelegramTopicConcurrencyMultiplier = 3;
const kAgentConcurrencyFloor = 8;
const kSubagentConcurrencyFloor = 4;
const { normalizeAccountId } = require("./utils/channels");
const {
  readOpenclawConfig,
  writeOpenclawConfig,
} = require("./openclaw-config");

const resolveTelegramAccountConfig = ({ telegramConfig, accountId }) => {
  const normalizedAccountId = normalizeAccountId(accountId);
  const accounts =
    telegramConfig?.accounts && typeof telegramConfig.accounts === "object"
      ? telegramConfig.accounts
      : null;
  const hasAccounts = !!accounts && Object.keys(accounts).length > 0;
  if (hasAccounts) {
    const nextAccountConfig =
      accounts[normalizedAccountId] && typeof accounts[normalizedAccountId] === "object"
        ? accounts[normalizedAccountId]
        : {};
    return {
      normalizedAccountId,
      hasAccounts,
      accountConfig: nextAccountConfig,
    };
  }
  return {
    normalizedAccountId,
    hasAccounts: false,
    accountConfig: telegramConfig,
  };
};

const syncConfigForTelegram = ({
  fs,
  openclawDir,
  topicRegistry,
  groupId,
  accountId = "default",
  requireMention = false,
  resolvedUserId = "",
}) => {
  const cfg = readOpenclawConfig({
    fsModule: fs,
    openclawDir,
    fallback: {},
  });

  // Remove legacy root keys from older setup flow.
  delete cfg.sessions;
  delete cfg.groups;
  delete cfg.groupAllowFrom;

  if (!cfg.channels) cfg.channels = {};
  if (!cfg.channels.telegram) cfg.channels.telegram = {};
  const telegramConfig = cfg.channels.telegram;
  const { normalizedAccountId, hasAccounts, accountConfig } =
    resolveTelegramAccountConfig({
      telegramConfig,
      accountId,
    });
  if (hasAccounts) {
    if (!telegramConfig.accounts || typeof telegramConfig.accounts !== "object") {
      telegramConfig.accounts = {};
    }
    if (
      !telegramConfig.accounts[normalizedAccountId]
      || typeof telegramConfig.accounts[normalizedAccountId] !== "object"
    ) {
      telegramConfig.accounts[normalizedAccountId] = {};
    }
  }
  const targetConfig = hasAccounts
    ? telegramConfig.accounts[normalizedAccountId]
    : telegramConfig;

  if (!targetConfig.groups || typeof targetConfig.groups !== "object") {
    targetConfig.groups = {};
  }
  const existingGroupConfig = targetConfig.groups[groupId] || {};
  targetConfig.groups[groupId] = {
    ...existingGroupConfig,
    requireMention,
  };

  const registryTopics = topicRegistry.getGroup(groupId)?.topics || {};
  const promptTopics = {};
  for (const [threadId, topic] of Object.entries(registryTopics)) {
    const systemPrompt = String(topic?.systemInstructions || "").trim();
    const topicAgentId = String(topic?.agentId || "").trim();
    if (!systemPrompt && !topicAgentId) continue;
    promptTopics[threadId] = {
      ...(systemPrompt ? { systemPrompt } : {}),
      ...(topicAgentId ? { agentId: topicAgentId } : {}),
    };
  }
  if (Object.keys(promptTopics).length > 0) {
    targetConfig.groups[groupId].topics = promptTopics;
  } else {
    delete targetConfig.groups[groupId].topics;
  }

  targetConfig.groupPolicy = "allowlist";
  if (!Array.isArray(targetConfig.groupAllowFrom)) {
    targetConfig.groupAllowFrom = [];
  }
  if (
    resolvedUserId
    && !targetConfig.groupAllowFrom.includes(String(resolvedUserId))
  ) {
    targetConfig.groupAllowFrom.push(String(resolvedUserId));
  }

  // Persist thread sessions and keep concurrency in schema-valid agent defaults.
  if (!cfg.session) cfg.session = {};
  if (!cfg.session.resetByType) cfg.session.resetByType = {};
  cfg.session.resetByType.thread = { mode: "idle", idleMinutes: 525600 };

  const totalTopics = topicRegistry.getTotalTopicCount();
  const maxConcurrent = Math.max(
    totalTopics * kTelegramTopicConcurrencyMultiplier,
    kAgentConcurrencyFloor,
  );
  if (!cfg.agents) cfg.agents = {};
  if (!cfg.agents.defaults) cfg.agents.defaults = {};
  cfg.agents.defaults.maxConcurrent = maxConcurrent;
  if (!cfg.agents.defaults.subagents) cfg.agents.defaults.subagents = {};
  cfg.agents.defaults.subagents.maxConcurrent = Math.max(
    maxConcurrent - 2,
    kSubagentConcurrencyFloor,
  );

  writeOpenclawConfig({
    fsModule: fs,
    openclawDir,
    config: cfg,
    spacing: 2,
  });

  return {
    totalTopics,
    maxConcurrent: cfg.agents.defaults.maxConcurrent,
    subagentMaxConcurrent: cfg.agents.defaults.subagents.maxConcurrent,
  };
};

module.exports = { syncConfigForTelegram };
