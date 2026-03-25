const path = require("path");
const {
  readOpenclawConfig,
  writeOpenclawConfig,
} = require("../openclaw-config");

const kDefaultAgentId = "main";
const kAgentIdPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const kChannelAccountIdPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const kDefaultWorkspaceBasename = "workspace";
const kWorkspaceFolderPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const kDefaultAgentFiles = ["SOUL.md", "AGENTS.md", "USER.md", "IDENTITY.md"];
const kChannelEnvKeys = {
  telegram: "TELEGRAM_BOT_TOKEN",
  discord: "DISCORD_BOT_TOKEN",
  slack: "SLACK_BOT_TOKEN",
};
const kChannelExtraEnvKeys = {
  slack: ["SLACK_APP_TOKEN"],
};
const kChannelTokenFields = {
  telegram: "botToken",
  discord: "token",
  slack: "botToken",
};
const kChannelExtraTokenFields = {
  slack: ["appToken"],
};
const kChannelLabels = {
  telegram: "Telegram",
  discord: "Discord",
  slack: "Slack",
};
const kMaskedChannelToken = "********";

const shellEscapeArg = (value) =>
  `'${String(value || "").replace(/'/g, `'\\''`)}'`;

const resolveCredentialsDirPath = ({ OPENCLAW_DIR }) =>
  path.join(OPENCLAW_DIR, "credentials");

const resolveAgentWorkspacePath = ({ OPENCLAW_DIR, agentId }) =>
  path.join(
    OPENCLAW_DIR,
    agentId === kDefaultAgentId
      ? kDefaultWorkspaceBasename
      : `${kDefaultWorkspaceBasename}-${agentId}`,
  );

const resolveAgentDirPath = ({ OPENCLAW_DIR, agentId }) =>
  path.join(OPENCLAW_DIR, "agents", agentId, "agent");

const loadConfig = ({ fsImpl, OPENCLAW_DIR }) =>
  readOpenclawConfig({
    fsModule: fsImpl,
    openclawDir: OPENCLAW_DIR,
    fallback: {},
  });

const saveConfig = ({ fsImpl, OPENCLAW_DIR, config }) => {
  writeOpenclawConfig({
    fsModule: fsImpl,
    openclawDir: OPENCLAW_DIR,
    config,
    spacing: 2,
  });
};

const ensurePluginAllowed = ({ cfg, pluginKey }) => {
  if (!cfg.plugins || typeof cfg.plugins !== "object") cfg.plugins = {};
  if (!Array.isArray(cfg.plugins.allow)) cfg.plugins.allow = [];
  if (!cfg.plugins.entries || typeof cfg.plugins.entries !== "object") {
    cfg.plugins.entries = {};
  }
  if (!cfg.plugins.allow.includes(pluginKey)) {
    cfg.plugins.allow.push(pluginKey);
  }
  cfg.plugins.entries[pluginKey] = {
    ...(cfg.plugins.entries[pluginKey] &&
    typeof cfg.plugins.entries[pluginKey] === "object"
      ? cfg.plugins.entries[pluginKey]
      : {}),
    enabled: true,
  };
};

const normalizeAgentsList = ({ list }) =>
  (Array.isArray(list) ? list : [])
    .filter((entry) => entry && typeof entry === "object")
    .map((entry) => ({ ...entry }));

const normalizeAgentDefaults = ({ cfg }) => ({
  model: cfg?.agents?.defaults?.model || {},
});

const cloneJson = (value) => JSON.parse(JSON.stringify(value));
const isEnvRef = (value) =>
  /^\$\{[A-Z_][A-Z0-9_]*\}$/.test(String(value || "").trim());

const normalizePeerMatch = (value) => {
  if (!value || typeof value !== "object") return undefined;
  const kind = String(value.kind || "").trim();
  const id = String(value.id || "").trim();
  if (!kind || !id) return undefined;
  return { kind, id };
};

const normalizeBindingMatch = (input = {}) => {
  const channel = String(input.channel || "").trim();
  if (!channel) {
    throw new Error("Binding channel is required");
  }
  const accountId = String(input.accountId || "").trim();
  const guildId = String(input.guildId || "").trim();
  const teamId = String(input.teamId || "").trim();
  const peer = normalizePeerMatch(input.peer);
  const parentPeer = normalizePeerMatch(input.parentPeer);
  const roles = Array.isArray(input.roles)
    ? input.roles.map((entry) => String(entry || "").trim()).filter(Boolean)
    : [];
  return {
    channel,
    ...(accountId ? { accountId } : {}),
    ...(guildId ? { guildId } : {}),
    ...(teamId ? { teamId } : {}),
    ...(peer ? { peer } : {}),
    ...(parentPeer ? { parentPeer } : {}),
    ...(roles.length > 0 ? { roles } : {}),
  };
};

const toComparableBindingMatch = (input = {}) => {
  const match = normalizeBindingMatch(input);
  return {
    ...match,
    ...(match.accountId ? {} : { accountId: "default" }),
  };
};

const matchesBinding = (left, right) =>
  JSON.stringify(toComparableBindingMatch(left)) ===
  JSON.stringify(toComparableBindingMatch(right));

const isValidChannelAccountId = (value) =>
  kChannelAccountIdPattern.test(String(value || "").trim());

const normalizeChannelProvider = (value) => {
  const provider = String(value || "")
    .trim()
    .toLowerCase();
  if (!provider || !kChannelEnvKeys[provider]) {
    throw new Error("Unsupported channel provider");
  }
  return provider;
};

const deriveChannelEnvKey = ({ provider, accountId }) => {
  const envKey = kChannelEnvKeys[normalizeChannelProvider(provider)];
  const normalizedAccountId = String(accountId || "").trim();
  if (!normalizedAccountId || normalizedAccountId === "default") return envKey;
  return `${envKey}_${normalizedAccountId.replace(/-/g, "_").toUpperCase()}`;
};

const deriveChannelExtraEnvKeys = ({ provider, accountId }) => {
  const normalizedProvider = normalizeChannelProvider(provider);
  const baseEnvKeys = Array.isArray(kChannelExtraEnvKeys[normalizedProvider])
    ? kChannelExtraEnvKeys[normalizedProvider]
    : [];
  const normalizedAccountId = String(accountId || "").trim();
  if (!normalizedAccountId || normalizedAccountId === "default") {
    return [...baseEnvKeys];
  }
  const suffix = normalizedAccountId.replace(/-/g, "_").toUpperCase();
  return baseEnvKeys.map((baseKey) => `${baseKey}_${suffix}`);
};

const getConfiguredChannelEnvKeys = (cfg) => {
  const keys = new Set();
  const channels =
    cfg?.channels && typeof cfg.channels === "object" ? cfg.channels : {};
  for (const [provider, providerConfig] of Object.entries(channels)) {
    if (!kChannelEnvKeys[provider]) continue;
    const accounts =
      providerConfig?.accounts && typeof providerConfig.accounts === "object"
        ? providerConfig.accounts
        : {};
    for (const accountId of Object.keys(accounts)) {
      keys.add(deriveChannelEnvKey({ provider, accountId }));
      const extraEnvKeys = deriveChannelExtraEnvKeys({ provider, accountId });
      for (const extraEnvKey of extraEnvKeys) {
        keys.add(extraEnvKey);
      }
    }
    if (Object.keys(accounts).length === 0 && providerConfig?.enabled) {
      keys.add(kChannelEnvKeys[provider]);
      for (const extraEnvKey of deriveChannelExtraEnvKeys({
        provider,
        accountId: "default",
      })) {
        keys.add(extraEnvKey);
      }
    }
  }
  return keys;
};

const assertActiveChannelTokenEnvVars = ({ cfg, envVars }) => {
  const envMap = new Map(
    (Array.isArray(envVars) ? envVars : [])
      .map((entry) => [
        String(entry?.key || "").trim(),
        String(entry?.value || "").trim(),
      ])
      .filter(([key]) => key),
  );
  const channels =
    cfg?.channels && typeof cfg.channels === "object" ? cfg.channels : {};
  for (const [provider, providerConfig] of Object.entries(channels)) {
    if (!kChannelEnvKeys[provider]) continue;
    if (providerConfig?.enabled === false) continue;
    const normalizedProviderConfig = normalizeChannelConfig({
      provider,
      channelConfig: providerConfig,
    });
    const accounts =
      normalizedProviderConfig.accounts &&
      typeof normalizedProviderConfig.accounts === "object"
        ? normalizedProviderConfig.accounts
        : {};
    const accountEntries =
      Object.keys(accounts).length > 0
        ? Object.entries(accounts)
        : [["default", {}]];
    for (const [accountId, accountConfig] of accountEntries) {
      if (accountConfig?.enabled === false) continue;
      const envKey = deriveChannelEnvKey({ provider, accountId });
      const envValue = String(envMap.get(envKey) || "").trim();
      if (!envValue) {
        throw new Error(
          `Missing required channel token env var ${envKey} for active channel ${provider}/${accountId}`,
        );
      }
      const extraEnvKeys = deriveChannelExtraEnvKeys({ provider, accountId });
      for (const extraEnvKey of extraEnvKeys) {
        const extraEnvValue = String(envMap.get(extraEnvKey) || "").trim();
        if (!extraEnvValue) {
          throw new Error(
            `Missing required channel token env var ${extraEnvKey} for active channel ${provider}/${accountId}`,
          );
        }
      }
    }
  }
};

const normalizeChannelConfig = ({ provider, channelConfig }) => {
  const normalizedProvider = normalizeChannelProvider(provider);
  const nextConfig =
    channelConfig && typeof channelConfig === "object"
      ? cloneJson(channelConfig)
      : {};
  const existingAccounts =
    nextConfig.accounts && typeof nextConfig.accounts === "object"
      ? { ...nextConfig.accounts }
      : {};
  const tokenField = kChannelTokenFields[normalizedProvider];
  const extraTokenFields = Array.isArray(
    kChannelExtraTokenFields[normalizedProvider],
  )
    ? kChannelExtraTokenFields[normalizedProvider]
    : [];
  if (Object.keys(existingAccounts).length > 0) {
    if (tokenField || extraTokenFields.length > 0) {
      for (const [accountId, accountConfig] of Object.entries(
        existingAccounts,
      )) {
        if (!accountConfig || typeof accountConfig !== "object") continue;
        const nextAccountConfig = { ...accountConfig };
        const rawTokenFieldValue = String(
          nextAccountConfig[tokenField] || "",
        ).trim();
        if (rawTokenFieldValue && !isEnvRef(rawTokenFieldValue)) {
          nextAccountConfig[tokenField] = `\${${deriveChannelEnvKey({
            provider: normalizedProvider,
            accountId,
          })}}`;
        }
        const extraEnvKeys = deriveChannelExtraEnvKeys({
          provider: normalizedProvider,
          accountId,
        });
        extraTokenFields.forEach((fieldName, index) => {
          const rawValue = String(nextAccountConfig[fieldName] || "").trim();
          if (!rawValue) return;
          if (isEnvRef(rawValue)) return;
          if (!extraEnvKeys[index]) return;
          nextAccountConfig[fieldName] = `\${${extraEnvKeys[index]}}`;
        });
        existingAccounts[accountId] = nextAccountConfig;
      }
    }
    nextConfig.accounts = existingAccounts;
    return nextConfig;
  }

  const defaultAccountConfig = {};
  for (const [key, value] of Object.entries(nextConfig)) {
    if (key === "enabled" || key === "accounts" || key === "defaultAccount")
      continue;
    defaultAccountConfig[key] = cloneJson(value);
    delete nextConfig[key];
  }

  const defaultTokenEnvRef = `\${${deriveChannelEnvKey({
    provider: normalizedProvider,
    accountId: "default",
  })}}`;
  if (tokenField && defaultAccountConfig[tokenField]) {
    const rawTokenFieldValue = String(
      defaultAccountConfig[tokenField] || "",
    ).trim();
    if (rawTokenFieldValue && !isEnvRef(rawTokenFieldValue)) {
      defaultAccountConfig[tokenField] = defaultTokenEnvRef;
    }
  }
  const defaultExtraEnvKeys = deriveChannelExtraEnvKeys({
    provider: normalizedProvider,
    accountId: "default",
  });
  extraTokenFields.forEach((fieldName, index) => {
    const rawValue = String(defaultAccountConfig[fieldName] || "").trim();
    if (!rawValue) return;
    if (isEnvRef(rawValue)) return;
    if (!defaultExtraEnvKeys[index]) return;
    defaultAccountConfig[fieldName] = `\${${defaultExtraEnvKeys[index]}}`;
  });
  if (
    Object.keys(defaultAccountConfig).length > 0 ||
    defaultAccountConfig[tokenField]
  ) {
    nextConfig.accounts = { default: defaultAccountConfig };
    if (!String(nextConfig.defaultAccount || "").trim()) {
      nextConfig.defaultAccount = "default";
    }
  } else {
    nextConfig.accounts = {};
  }
  return nextConfig;
};

const appendBindingToConfig = ({ cfg, agentId, match }) => {
  const normalizedAgentId = String(agentId || "").trim();
  const existingBindings = Array.isArray(cfg.bindings) ? cfg.bindings : [];
  const conflictingBinding = existingBindings.find((binding) =>
    matchesBinding(binding?.match || {}, match),
  );
  if (conflictingBinding) {
    const conflictingAgentId = String(conflictingBinding.agentId || "").trim();
    if (conflictingAgentId === normalizedAgentId) {
      return cloneJson(conflictingBinding);
    }
    throw new Error(
      `Binding already assigned to agent "${conflictingAgentId}"`,
    );
  }
  const nextBinding = {
    agentId: normalizedAgentId,
    match,
  };
  cfg.bindings = [...existingBindings, nextBinding];
  return cloneJson(nextBinding);
};

const buildBindingSpec = ({ provider, accountId }) => {
  const channel = normalizeChannelProvider(provider);
  const normalizedAccountId = String(accountId || "").trim();
  return normalizedAccountId ? `${channel}:${normalizedAccountId}` : channel;
};

const hasLegacyDefaultChannelAccount = ({ config }) =>
  Object.keys(config || {}).some(
    (entry) =>
      entry !== "accounts" && entry !== "defaultAccount" && entry !== "enabled",
  );

const normalizeChannelAccountId = (value) =>
  String(value || "").trim() || "default";

const resolveCredentialPairingAccountId = ({ channelId, fileName }) => {
  const prefix = `${String(channelId || "").trim()}-`;
  const suffix = "-allowFrom.json";
  const rawFileName = String(fileName || "").trim();
  if (!rawFileName.startsWith(prefix) || !rawFileName.endsWith(suffix)) {
    return "";
  }
  const rawAccountId = rawFileName.slice(prefix.length, -suffix.length);
  return normalizeChannelAccountId(rawAccountId);
};

const readPairedCountsByAccount = ({
  fsImpl,
  OPENCLAW_DIR,
  channelId,
  accountIds,
  config,
}) => {
  const counts = new Map(
    (Array.isArray(accountIds) ? accountIds : []).map((accountId) => [
      normalizeChannelAccountId(accountId),
      0,
    ]),
  );
  const credentialsDir = resolveCredentialsDirPath({ OPENCLAW_DIR });
  try {
    const files = fsImpl
      .readdirSync(credentialsDir)
      .filter(
        (fileName) =>
          String(fileName || "").startsWith(
            `${String(channelId || "").trim()}-`,
          ) && String(fileName || "").endsWith("-allowFrom.json"),
      );
    for (const fileName of files) {
      const accountId = resolveCredentialPairingAccountId({
        channelId,
        fileName,
      });
      if (!accountId || !counts.has(accountId)) continue;
      const filePath = path.join(credentialsDir, fileName);
      const parsed = JSON.parse(fsImpl.readFileSync(filePath, "utf8"));
      const pairedCount = Array.isArray(parsed?.allowFrom)
        ? parsed.allowFrom.length
        : 0;
      counts.set(accountId, Number(counts.get(accountId) || 0) + pairedCount);
    }
  } catch {}

  for (const accountId of counts.keys()) {
    const accountConfig =
      accountId === "default" &&
      !(config.accounts && typeof config.accounts === "object")
        ? config
        : config.accounts?.[accountId] || {};
    const inlineAllowFrom = accountConfig?.allowFrom;
    if (!Array.isArray(inlineAllowFrom)) continue;
    counts.set(
      accountId,
      Number(counts.get(accountId) || 0) + inlineAllowFrom.length,
    );
  }

  return counts;
};

const listConfiguredChannelAccounts = ({ fsImpl, OPENCLAW_DIR, cfg }) => {
  const bindings = Array.isArray(cfg?.bindings) ? cfg.bindings : [];
  const boundAccountMap = new Map();
  for (const binding of bindings) {
    const match = binding?.match || {};
    const hasScopedFields =
      !!match.peer ||
      !!match.parentPeer ||
      !!String(match.guildId || "").trim() ||
      !!String(match.teamId || "").trim() ||
      (Array.isArray(match.roles) && match.roles.length > 0);
    if (hasScopedFields) continue;
    const channel = String(match.channel || "").trim();
    if (!channel) continue;
    const accountId = String(match.accountId || "").trim() || "default";
    const agentId = String(binding?.agentId || "").trim();
    if (!agentId) continue;
    const key = `${channel}:${accountId}`;
    if (!boundAccountMap.has(key)) {
      boundAccountMap.set(key, agentId);
    }
  }
  const channels =
    cfg?.channels && typeof cfg.channels === "object" ? cfg.channels : {};
  return Object.entries(channels)
    .map(([channelId, channelConfig]) => {
      if (!kChannelEnvKeys[String(channelId || "").trim()]) return null;
      const config =
        channelConfig && typeof channelConfig === "object" ? channelConfig : {};
      const accountsConfig =
        config.accounts && typeof config.accounts === "object"
          ? config.accounts
          : {};
      const accountIds = Object.keys(accountsConfig)
        .map((entry) => String(entry || "").trim())
        .filter(Boolean);
      const topLevelKeys = Object.keys(config).filter(
        (entry) =>
          entry !== "accounts" &&
          entry !== "defaultAccount" &&
          entry !== "enabled",
      );
      if (accountIds.length === 0 && topLevelKeys.length === 0) return null;
      const normalizedAccountIds = accountIds.includes("default")
        ? accountIds
        : topLevelKeys.length > 0
          ? ["default", ...accountIds]
          : accountIds;
      const pairedCounts = readPairedCountsByAccount({
        fsImpl,
        OPENCLAW_DIR,
        channelId,
        accountIds: normalizedAccountIds,
        config,
      });
      return {
        channel: String(channelId || "").trim(),
        accounts: normalizedAccountIds
          .map((accountId) => {
            const accountConfig =
              accountId === "default" && accountIds.length === 0
                ? config
                : accountsConfig?.[accountId] || {};
            return {
              id: accountId,
              name: String(accountConfig?.name || "").trim(),
              envKey: deriveChannelEnvKey({ provider: channelId, accountId }),
              boundAgentId:
                boundAccountMap.get(
                  `${String(channelId || "").trim()}:${accountId}`,
                ) || "",
              paired: Number(pairedCounts.get(accountId) || 0),
              status:
                Number(pairedCounts.get(accountId) || 0) > 0
                  ? "paired"
                  : "configured",
            };
          }),
      };
    })
    .filter(Boolean);
};

const getSafeStat = ({ fsImpl, targetPath }) => {
  try {
    if (typeof fsImpl.lstatSync === "function") {
      return fsImpl.lstatSync(targetPath);
    }
    if (typeof fsImpl.statSync === "function") {
      return fsImpl.statSync(targetPath);
    }
  } catch {}
  return null;
};

const calculatePathSizeBytes = ({ fsImpl, targetPath }) => {
  const stat = getSafeStat({ fsImpl, targetPath });
  if (!stat) return 0;
  if (typeof stat.isSymbolicLink === "function" && stat.isSymbolicLink())
    return 0;
  if (typeof stat.isFile === "function" && stat.isFile()) {
    return Number(stat.size || 0);
  }
  if (!(typeof stat.isDirectory === "function" && stat.isDirectory())) {
    return 0;
  }
  let entries = [];
  try {
    entries = fsImpl.readdirSync(targetPath) || [];
  } catch {
    return 0;
  }
  return entries.reduce(
    (total, entry) =>
      total +
      calculatePathSizeBytes({
        fsImpl,
        targetPath: path.join(targetPath, String(entry || "")),
      }),
    0,
  );
};

const getImplicitMainAgent = ({ OPENCLAW_DIR, cfg }) => {
  const defaults = normalizeAgentDefaults({ cfg });
  const defaultPrimaryModel = String(defaults?.model?.primary || "").trim();
  return {
    id: kDefaultAgentId,
    default: true,
    name: "Main Agent",
    workspace: resolveAgentWorkspacePath({
      OPENCLAW_DIR,
      agentId: kDefaultAgentId,
    }),
    agentDir: resolveAgentDirPath({ OPENCLAW_DIR, agentId: kDefaultAgentId }),
    ...(defaultPrimaryModel ? { model: { primary: defaultPrimaryModel } } : {}),
  };
};

const withNormalizedAgentsConfig = ({ OPENCLAW_DIR, cfg }) => {
  const nextCfg = cfg && typeof cfg === "object" ? { ...cfg } : {};
  const existingAgents =
    nextCfg.agents && typeof nextCfg.agents === "object" ? nextCfg.agents : {};
  const existingList = normalizeAgentsList({ list: existingAgents.list });
  const hasMain = existingList.some(
    (entry) => String(entry.id || "").trim() === kDefaultAgentId,
  );
  const nextList = hasMain
    ? existingList
    : [getImplicitMainAgent({ OPENCLAW_DIR, cfg: nextCfg }), ...existingList];

  let hasDefault = false;
  const listWithSingleDefault = nextList.map((entry) => {
    if (!entry.default) return entry;
    if (hasDefault) return { ...entry, default: false };
    hasDefault = true;
    return { ...entry, default: true };
  });
  if (!hasDefault && listWithSingleDefault.length > 0) {
    listWithSingleDefault[0] = { ...listWithSingleDefault[0], default: true };
  }

  nextCfg.agents = {
    ...existingAgents,
    list: listWithSingleDefault,
  };
  return nextCfg;
};

const isValidAgentId = (value) =>
  kAgentIdPattern.test(String(value || "").trim());

const isValidWorkspaceFolder = (value) =>
  kWorkspaceFolderPattern.test(String(value || "").trim());

const resolveRequestedWorkspacePath = ({
  OPENCLAW_DIR,
  agentId,
  workspaceFolder,
}) => {
  const normalizedFolder = String(workspaceFolder || "").trim();
  if (!normalizedFolder)
    return resolveAgentWorkspacePath({ OPENCLAW_DIR, agentId });
  if (!isValidWorkspaceFolder(normalizedFolder)) {
    throw new Error(
      "Workspace folder must be lowercase letters, numbers, and hyphens only",
    );
  }
  return path.join(OPENCLAW_DIR, normalizedFolder);
};

const ensureAgentScaffold = ({
  fsImpl,
  agentId,
  workspacePath,
  OPENCLAW_DIR,
}) => {
  const agentDirPath = resolveAgentDirPath({ OPENCLAW_DIR, agentId });
  fsImpl.mkdirSync(workspacePath, { recursive: true });
  fsImpl.mkdirSync(agentDirPath, { recursive: true });
  for (const fileName of kDefaultAgentFiles) {
    const targetPath = path.join(workspacePath, fileName);
    if (fsImpl.existsSync(targetPath)) continue;
    fsImpl.writeFileSync(
      targetPath,
      `# ${fileName}\n\nCreated for agent "${agentId}".\n`,
    );
  }
  return {
    workspacePath,
    agentDirPath,
  };
};

module.exports = {
  kDefaultAgentId,
  kChannelTokenFields,
  kChannelLabels,
  kMaskedChannelToken,
  shellEscapeArg,
  resolveCredentialsDirPath,
  resolveAgentWorkspacePath,
  loadConfig,
  saveConfig,
  ensurePluginAllowed,
  cloneJson,
  normalizeBindingMatch,
  matchesBinding,
  isValidChannelAccountId,
  normalizeChannelProvider,
  deriveChannelEnvKey,
  deriveChannelExtraEnvKeys,
  getConfiguredChannelEnvKeys,
  assertActiveChannelTokenEnvVars,
  normalizeChannelConfig,
  appendBindingToConfig,
  buildBindingSpec,
  hasLegacyDefaultChannelAccount,
  listConfiguredChannelAccounts,
  getSafeStat,
  calculatePathSizeBytes,
  withNormalizedAgentsConfig,
  isValidAgentId,
  resolveRequestedWorkspacePath,
  ensureAgentScaffold,
};
