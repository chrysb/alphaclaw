const fs = require("fs");
const path = require("path");

const kDefaultAgentId = "main";
const kAgentIdPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const kChannelAccountIdPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const kDefaultWorkspaceBasename = "workspace";
const kWorkspaceFolderPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const kDefaultAgentFiles = ["SOUL.md", "AGENTS.md", "USER.md", "IDENTITY.md"];
const kChannelEnvKeys = {
  telegram: "TELEGRAM_BOT_TOKEN",
  discord: "DISCORD_BOT_TOKEN",
};
const kChannelTokenFields = {
  telegram: "botToken",
  discord: "token",
};
const kChannelLabels = {
  telegram: "Telegram",
  discord: "Discord",
};
const kMaskedChannelToken = "********";

const shellEscapeArg = (value) =>
  `'${String(value || "").replace(/'/g, `'\\''`)}'`;

const resolveConfigPath = ({ OPENCLAW_DIR }) =>
  path.join(OPENCLAW_DIR, "openclaw.json");

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

const parseConfig = ({ fsImpl, configPath }) => {
  try {
    return JSON.parse(fsImpl.readFileSync(configPath, "utf8"));
  } catch {
    return {};
  }
};

const loadConfig = ({ fsImpl, OPENCLAW_DIR }) =>
  parseConfig({
    fsImpl,
    configPath: resolveConfigPath({ OPENCLAW_DIR }),
  });

const saveConfig = ({ fsImpl, OPENCLAW_DIR, config }) => {
  const configPath = resolveConfigPath({ OPENCLAW_DIR });
  fsImpl.mkdirSync(path.dirname(configPath), { recursive: true });
  fsImpl.writeFileSync(configPath, JSON.stringify(config, null, 2));
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
    }
    if (Object.keys(accounts).length === 0 && providerConfig?.enabled) {
      keys.add(kChannelEnvKeys[provider]);
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
  if (Object.keys(existingAccounts).length > 0) {
    if (tokenField) {
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

const createAgentsService = ({
  fs: fsImpl = fs,
  OPENCLAW_DIR,
  readEnvFile = () => [],
  writeEnvFile = () => {},
  reloadEnv = () => false,
  restartGateway = async () => {},
  clawCmd = async () => ({
    ok: false,
    stdout: "",
    stderr: "openclaw command unavailable",
  }),
}) => {
  const getChannelAccountToken = ({
    provider: rawProvider,
    accountId: rawAccountId,
  } = {}) => {
    const provider = normalizeChannelProvider(rawProvider);
    const accountId = String(rawAccountId || "").trim() || "default";
    const cfg = withNormalizedAgentsConfig({
      OPENCLAW_DIR,
      cfg: loadConfig({ fsImpl, OPENCLAW_DIR }),
    });
    const providerConfig =
      cfg.channels?.[provider] && typeof cfg.channels[provider] === "object"
        ? cfg.channels[provider]
        : null;
    if (!providerConfig) {
      throw new Error(`Channel "${provider}" not found`);
    }
    const hasAccounts =
      providerConfig.accounts && typeof providerConfig.accounts === "object";
    const hasLegacyDefault =
      accountId === "default" &&
      !hasAccounts &&
      hasLegacyDefaultChannelAccount({ config: providerConfig });
    if (!hasLegacyDefault && !providerConfig.accounts?.[accountId]) {
      throw new Error(`Channel account "${provider}/${accountId}" not found`);
    }
    const envKey = deriveChannelEnvKey({ provider, accountId });
    const envVars = readEnvFile();
    const envEntry = (Array.isArray(envVars) ? envVars : []).find(
      (entry) => String(entry?.key || "").trim() === envKey,
    );
    return {
      provider,
      accountId,
      envKey,
      token: String(envEntry?.value || ""),
    };
  };

  const listAgents = () => {
    const cfg = withNormalizedAgentsConfig({
      OPENCLAW_DIR,
      cfg: loadConfig({ fsImpl, OPENCLAW_DIR }),
    });
    return (cfg.agents?.list || []).map((entry) => ({
      ...entry,
      id: String(entry.id || "").trim(),
      name: String(entry.name || "").trim() || String(entry.id || "").trim(),
      default: !!entry.default,
    }));
  };

  const getAgent = (agentId) => {
    const normalized = String(agentId || "").trim();
    return listAgents().find((entry) => entry.id === normalized) || null;
  };

  const getAgentWorkspaceSize = (agentId) => {
    const normalized = String(agentId || "").trim();
    const agent = getAgent(normalized);
    if (!agent) throw new Error(`Agent "${normalized}" not found`);
    const workspacePath = String(
      agent.workspace ||
        resolveAgentWorkspacePath({ OPENCLAW_DIR, agentId: normalized }),
    ).trim();
    if (!workspacePath) {
      return { workspacePath: "", exists: false, sizeBytes: 0 };
    }
    const stat = getSafeStat({ fsImpl, targetPath: workspacePath });
    if (!stat) {
      return { workspacePath, exists: false, sizeBytes: 0 };
    }
    return {
      workspacePath,
      exists: true,
      sizeBytes: calculatePathSizeBytes({ fsImpl, targetPath: workspacePath }),
    };
  };

  const getBindingsForAgent = (agentId) => {
    const normalized = String(agentId || "").trim();
    const cfg = withNormalizedAgentsConfig({
      OPENCLAW_DIR,
      cfg: loadConfig({ fsImpl, OPENCLAW_DIR }),
    });
    const bindings = Array.isArray(cfg.bindings) ? cfg.bindings : [];
    return bindings
      .filter((binding) => String(binding?.agentId || "").trim() === normalized)
      .map((binding) => cloneJson(binding));
  };

  const createAgent = (input = {}) => {
    const agentId = String(input.id || "").trim();
    if (!isValidAgentId(agentId)) {
      throw new Error(
        "Agent id must be lowercase letters, numbers, and hyphens only",
      );
    }

    const cfg = withNormalizedAgentsConfig({
      OPENCLAW_DIR,
      cfg: loadConfig({ fsImpl, OPENCLAW_DIR }),
    });
    const existing = cfg.agents.list.find((entry) => entry.id === agentId);
    if (existing) {
      throw new Error(`Agent "${agentId}" already exists`);
    }

    const workspacePath = resolveRequestedWorkspacePath({
      OPENCLAW_DIR,
      agentId,
      workspaceFolder: input.workspaceFolder,
    });
    const { workspacePath: scaffoldWorkspacePath, agentDirPath } =
      ensureAgentScaffold({
        fsImpl,
        workspacePath,
        OPENCLAW_DIR,
        agentId,
      });
    const nextAgent = {
      id: agentId,
      name: String(input.name || "").trim() || agentId,
      default: false,
      workspace: scaffoldWorkspacePath,
      agentDir: agentDirPath,
      ...(input.model ? { model: input.model } : {}),
      ...(input.identity && typeof input.identity === "object"
        ? { identity: { ...input.identity } }
        : {}),
    };
    cfg.agents.list = [...cfg.agents.list, nextAgent];
    saveConfig({ fsImpl, OPENCLAW_DIR, config: cfg });
    return nextAgent;
  };

  const updateAgent = (agentId, patch = {}) => {
    const normalized = String(agentId || "").trim();
    const cfg = withNormalizedAgentsConfig({
      OPENCLAW_DIR,
      cfg: loadConfig({ fsImpl, OPENCLAW_DIR }),
    });
    const index = cfg.agents.list.findIndex((entry) => entry.id === normalized);
    if (index < 0) throw new Error(`Agent "${normalized}" not found`);
    const current = cfg.agents.list[index];
    const next = {
      ...current,
      ...(patch.name !== undefined
        ? { name: String(patch.name || "").trim() }
        : {}),
      ...(patch.identity !== undefined
        ? {
            identity:
              patch.identity && typeof patch.identity === "object"
                ? { ...patch.identity }
                : {},
          }
        : {}),
    };
    if (patch.model !== undefined) {
      if (patch.model === null) {
        delete next.model;
      } else {
        next.model = patch.model;
      }
    }
    if (!String(next.name || "").trim()) next.name = normalized;
    cfg.agents.list[index] = next;
    saveConfig({ fsImpl, OPENCLAW_DIR, config: cfg });
    return next;
  };

  const setDefaultAgent = (agentId) => {
    const normalized = String(agentId || "").trim();
    const cfg = withNormalizedAgentsConfig({
      OPENCLAW_DIR,
      cfg: loadConfig({ fsImpl, OPENCLAW_DIR }),
    });
    const exists = cfg.agents.list.some((entry) => entry.id === normalized);
    if (!exists) throw new Error(`Agent "${normalized}" not found`);
    cfg.agents.list = cfg.agents.list.map((entry) => ({
      ...entry,
      default: entry.id === normalized,
    }));
    saveConfig({ fsImpl, OPENCLAW_DIR, config: cfg });
    return cfg.agents.list.find((entry) => entry.id === normalized) || null;
  };

  const addBinding = (agentId, input = {}) => {
    const normalizedAgentId = String(agentId || "").trim();
    const cfg = withNormalizedAgentsConfig({
      OPENCLAW_DIR,
      cfg: loadConfig({ fsImpl, OPENCLAW_DIR }),
    });
    const agent = cfg.agents.list.find(
      (entry) => entry.id === normalizedAgentId,
    );
    if (!agent) throw new Error(`Agent "${normalizedAgentId}" not found`);
    const match = normalizeBindingMatch(input);
    const nextBinding = appendBindingToConfig({
      cfg,
      agentId: normalizedAgentId,
      match,
    });
    saveConfig({ fsImpl, OPENCLAW_DIR, config: cfg });
    return nextBinding;
  };

  const removeBinding = (agentId, input = {}) => {
    const normalizedAgentId = String(agentId || "").trim();
    const cfg = withNormalizedAgentsConfig({
      OPENCLAW_DIR,
      cfg: loadConfig({ fsImpl, OPENCLAW_DIR }),
    });
    const bindings = Array.isArray(cfg.bindings) ? cfg.bindings : [];
    const nextMatch = normalizeBindingMatch(input);
    const nextBindings = bindings.filter(
      (binding) =>
        !(
          String(binding?.agentId || "").trim() === normalizedAgentId &&
          matchesBinding(binding?.match || {}, nextMatch)
        ),
    );
    if (nextBindings.length === bindings.length) {
      throw new Error("Binding not found");
    }
    cfg.bindings = nextBindings;
    saveConfig({ fsImpl, OPENCLAW_DIR, config: cfg });
    return { ok: true };
  };

  const createChannelAccount = async (
    input = {},
    { onProgress = () => {} } = {},
  ) => {
    const provider = normalizeChannelProvider(input.provider);
    const name =
      String(input.name || "").trim() || kChannelLabels[provider] || provider;
    const token = String(input.token || "").trim();
    if (!token) throw new Error("Channel token is required");

    const cfg = withNormalizedAgentsConfig({
      OPENCLAW_DIR,
      cfg: loadConfig({ fsImpl, OPENCLAW_DIR }),
    });

    const agentId = String(input.agentId || "").trim();
    const agent = cfg.agents.list.find((entry) => entry.id === agentId);
    if (!agent) throw new Error(`Agent "${agentId}" not found`);

    const existingChannelConfig =
      cfg.channels?.[provider] && typeof cfg.channels[provider] === "object"
        ? cfg.channels[provider]
        : {};
    const normalizedChannelConfig = normalizeChannelConfig({
      provider,
      channelConfig: existingChannelConfig,
    });
    const existingAccounts =
      normalizedChannelConfig.accounts &&
      typeof normalizedChannelConfig.accounts === "object"
        ? normalizedChannelConfig.accounts
        : {};
    const requestedAccountId = String(input.accountId || "").trim();
    const accountId =
      requestedAccountId ||
      (Object.keys(existingAccounts).length > 0 ? "" : "default");
    if (!accountId) {
      throw new Error("Channel account id is required");
    }
    if (!isValidChannelAccountId(accountId)) {
      throw new Error(
        "Channel account id must be lowercase letters, numbers, and hyphens only",
      );
    }
    if (existingAccounts[accountId]) {
      throw new Error(
        `Channel account "${provider}/${accountId}" already exists`,
      );
    }
    if (provider === "discord" && Object.keys(existingAccounts).length > 0) {
      throw new Error("Discord supports a single channel account");
    }

    const envKey = deriveChannelEnvKey({ provider, accountId });
    const tokenField = kChannelTokenFields[provider];
    const currentEnvVars = readEnvFile();
    const previousEnvVars = Array.isArray(currentEnvVars) ? currentEnvVars : [];
    const duplicateEnvEntry = previousEnvVars.find((entry) => {
      const existingKey = String(entry?.key || "").trim();
      const existingValue = String(entry?.value || "").trim();
      if (!existingKey || !existingValue) return false;
      if (existingKey === envKey) return false;
      return existingValue === token;
    });
    let orphanedEnvKey = null;
    if (duplicateEnvEntry) {
      const dupKey = String(duplicateEnvEntry.key || "").trim();
      const configuredKeys = getConfiguredChannelEnvKeys(cfg);
      if (configuredKeys.has(dupKey)) {
        throw new Error(`Channel token already exists in ${dupKey}`);
      }
      orphanedEnvKey = dupKey;
      console.log(
        `[alphaclaw] Overwriting orphaned channel env var ${dupKey} (no matching config entry)`,
      );
    }
    const nextEnvVars = previousEnvVars.filter((entry) => {
      const key = String(entry?.key || "").trim();
      return key !== envKey && key !== orphanedEnvKey;
    });
    nextEnvVars.push({ key: envKey, value: token });

    const previousConfig = cloneJson(cfg);
    try {
      onProgress({ phase: "restarting", label: "Rebooting..." });
      writeEnvFile(nextEnvVars);
      reloadEnv();
      assertActiveChannelTokenEnvVars({
        cfg: withNormalizedAgentsConfig({
          OPENCLAW_DIR,
          cfg: loadConfig({ fsImpl, OPENCLAW_DIR }),
        }),
        envVars: nextEnvVars,
      });
      await restartGateway();
      const pluginEnabledCfg = withNormalizedAgentsConfig({
        OPENCLAW_DIR,
        cfg: loadConfig({ fsImpl, OPENCLAW_DIR }),
      });
      ensurePluginAllowed({ cfg: pluginEnabledCfg, pluginKey: provider });
      saveConfig({ fsImpl, OPENCLAW_DIR, config: pluginEnabledCfg });
      const addArgs = [
        "channels add",
        `--channel ${shellEscapeArg(provider)}`,
        accountId !== "default" ? `--account ${shellEscapeArg(accountId)}` : "",
        name ? `--name ${shellEscapeArg(name)}` : "",
        `--token ${shellEscapeArg(token)}`,
      ].filter(Boolean);
      const addResult = await clawCmd(addArgs.join(" "), {
        quiet: true,
        timeoutMs: 30000,
      });
      if (!addResult?.ok) {
        throw new Error(
          addResult?.stderr ||
            addResult?.stdout ||
            "Could not add channel account",
        );
      }
      const nextCfg = withNormalizedAgentsConfig({
        OPENCLAW_DIR,
        cfg: loadConfig({ fsImpl, OPENCLAW_DIR }),
      });
      const nextProviderConfig = normalizeChannelConfig({
        provider,
        channelConfig:
          nextCfg.channels?.[provider] &&
          typeof nextCfg.channels[provider] === "object"
            ? nextCfg.channels[provider]
            : {},
      });
      const nextAccounts =
        nextProviderConfig.accounts &&
        typeof nextProviderConfig.accounts === "object"
          ? { ...nextProviderConfig.accounts }
          : {};
      nextAccounts[accountId] = {
        ...(nextAccounts[accountId] &&
        typeof nextAccounts[accountId] === "object"
          ? nextAccounts[accountId]
          : {}),
        ...(name ? { name } : {}),
        [tokenField]: `\${${envKey}}`,
        dmPolicy: "pairing",
      };
      nextProviderConfig.accounts = nextAccounts;
      nextProviderConfig.enabled = true;
      if (
        nextProviderConfig.accounts &&
        typeof nextProviderConfig.accounts === "object" &&
        !String(nextProviderConfig.defaultAccount || "").trim()
      ) {
        nextProviderConfig.defaultAccount = "default";
      }
      nextCfg.channels =
        nextCfg.channels && typeof nextCfg.channels === "object"
          ? { ...nextCfg.channels }
          : {};
      nextCfg.channels[provider] = nextProviderConfig;
      saveConfig({ fsImpl, OPENCLAW_DIR, config: nextCfg });
      onProgress({ phase: "binding", label: "Binding agent..." });
      const bindSpec = buildBindingSpec({ provider, accountId });
      const bindResult = await clawCmd(
        `agents bind --agent ${shellEscapeArg(agentId)} --bind ${shellEscapeArg(bindSpec)}`,
        { quiet: true, timeoutMs: 30000 },
      );
      if (!bindResult?.ok) {
        throw new Error(
          bindResult?.stderr ||
            bindResult?.stdout ||
            "Could not bind channel account",
        );
      }
    } catch (error) {
      try {
        await clawCmd(
          [
            "channels remove",
            `--channel ${shellEscapeArg(provider)}`,
            accountId !== "default"
              ? `--account ${shellEscapeArg(accountId)}`
              : "",
            "--delete",
          ]
            .filter(Boolean)
            .join(" "),
          { quiet: true, timeoutMs: 30000 },
        );
      } catch {}
      try {
        writeEnvFile(previousEnvVars);
        reloadEnv();
      } catch {}
      try {
        saveConfig({ fsImpl, OPENCLAW_DIR, config: previousConfig });
      } catch {}
      throw error;
    }

    const binding = {
      agentId,
      match: normalizeBindingMatch({
        channel: provider,
        accountId,
      }),
    };
    return {
      channel: provider,
      account: {
        id: accountId,
        name,
        envKey,
      },
      binding,
    };
  };

  const updateChannelAccount = (input = {}) => {
    const provider = normalizeChannelProvider(input.provider);
    const accountId = String(input.accountId || "").trim() || "default";
    const nextName = String(input.name || "").trim();
    const nextAgentId = String(input.agentId || "").trim();
    const nextToken = String(input.token || "").trim();
    if (!nextName) throw new Error("Channel name is required");
    if (!nextAgentId) throw new Error("Agent is required");

    const cfg = withNormalizedAgentsConfig({
      OPENCLAW_DIR,
      cfg: loadConfig({ fsImpl, OPENCLAW_DIR }),
    });
    const agent = cfg.agents.list.find((entry) => entry.id === nextAgentId);
    if (!agent) throw new Error(`Agent "${nextAgentId}" not found`);

    const providerConfig =
      cfg.channels?.[provider] && typeof cfg.channels[provider] === "object"
        ? { ...cfg.channels[provider] }
        : null;
    if (!providerConfig) {
      throw new Error(`Channel "${provider}" not found`);
    }

    const hasAccounts =
      providerConfig.accounts && typeof providerConfig.accounts === "object";
    const hasLegacyDefault =
      accountId === "default" &&
      !hasAccounts &&
      hasLegacyDefaultChannelAccount({ config: providerConfig });
    if (!hasLegacyDefault && !providerConfig.accounts?.[accountId]) {
      throw new Error(`Channel account "${provider}/${accountId}" not found`);
    }

    let tokenUpdated = false;
    if (nextToken) {
      const envKey = deriveChannelEnvKey({ provider, accountId });
      const currentEnvVars = readEnvFile();
      const previousEnvVars = Array.isArray(currentEnvVars)
        ? currentEnvVars
        : [];
      const existingToken = String(
        previousEnvVars.find(
          (entry) => String(entry?.key || "").trim() === envKey,
        )?.value || "",
      );
      const duplicateEnvEntry = previousEnvVars.find((entry) => {
        const existingKey = String(entry?.key || "").trim();
        const existingValue = String(entry?.value || "").trim();
        if (!existingKey || !existingValue) return false;
        if (existingKey === envKey) return false;
        return existingValue === nextToken;
      });
      if (duplicateEnvEntry) {
        const dupKey = String(duplicateEnvEntry.key || "").trim();
        const configuredKeys = getConfiguredChannelEnvKeys(cfg);
        if (configuredKeys.has(dupKey)) {
          throw new Error(`Channel token already exists in ${dupKey}`);
        }
      }
      if (existingToken !== nextToken) {
        const nextEnvVars = previousEnvVars.filter(
          (entry) => String(entry?.key || "").trim() !== envKey,
        );
        nextEnvVars.push({ key: envKey, value: nextToken });
        writeEnvFile(nextEnvVars);
        reloadEnv();
        tokenUpdated = true;
      }
    }

    if (hasLegacyDefault) {
      providerConfig.name = nextName;
    } else {
      providerConfig.accounts = { ...providerConfig.accounts };
      providerConfig.accounts[accountId] = {
        ...(providerConfig.accounts[accountId] || {}),
        name: nextName,
      };
    }
    cfg.channels =
      cfg.channels && typeof cfg.channels === "object"
        ? { ...cfg.channels }
        : {};
    cfg.channels[provider] = providerConfig;

    const bindings = Array.isArray(cfg.bindings) ? cfg.bindings : [];
    const targetMatch = normalizeBindingMatch({ channel: provider, accountId });
    const nextBindings = bindings.filter((binding) => {
      const match = binding?.match || {};
      const hasScopedFields =
        !!match.peer ||
        !!match.parentPeer ||
        !!String(match.guildId || "").trim() ||
        !!String(match.teamId || "").trim() ||
        (Array.isArray(match.roles) && match.roles.length > 0);
      if (hasScopedFields) return true;
      return !matchesBinding(match, targetMatch);
    });
    cfg.bindings = nextBindings;
    appendBindingToConfig({
      cfg,
      agentId: nextAgentId,
      match: targetMatch,
    });
    saveConfig({ fsImpl, OPENCLAW_DIR, config: cfg });

    return {
      channel: provider,
      account: {
        id: accountId,
        name: nextName,
        boundAgentId: nextAgentId,
      },
      tokenUpdated,
    };
  };

  const cleanupChannelAccountPairingFiles = ({ provider, accountId }) => {
    const credDir = resolveCredentialsDirPath({ OPENCLAW_DIR });
    const normalizedAccountId =
      String(accountId || "")
        .trim()
        .toLowerCase() || "default";

    const pairingFilePath = path.join(credDir, `${provider}-pairing.json`);
    try {
      const raw = fsImpl.readFileSync(pairingFilePath, "utf8");
      const parsed = JSON.parse(raw);
      const requests = Array.isArray(parsed?.requests) ? parsed.requests : [];
      const nextRequests = requests.filter((entry) => {
        const entryAccountId =
          String(entry?.meta?.accountId || "")
            .trim()
            .toLowerCase() || "default";
        return entryAccountId !== normalizedAccountId;
      });
      if (nextRequests.length !== requests.length) {
        fsImpl.writeFileSync(
          pairingFilePath,
          JSON.stringify({ version: 1, requests: nextRequests }, null, 2),
        );
      }
    } catch {}

    const allowFromPatterns = [
      `${provider}-${normalizedAccountId}-allowFrom.json`,
      ...(normalizedAccountId === "default"
        ? [`${provider}-allowFrom.json`]
        : []),
    ];
    for (const fileName of allowFromPatterns) {
      try {
        fsImpl.rmSync(path.join(credDir, fileName), { force: true });
      } catch {}
    }
  };

  const deleteChannelAccount = async (input = {}) => {
    const provider = normalizeChannelProvider(input.provider);
    const accountId = String(input.accountId || "").trim() || "default";

    const cfg = withNormalizedAgentsConfig({
      OPENCLAW_DIR,
      cfg: loadConfig({ fsImpl, OPENCLAW_DIR }),
    });
    const providerConfig =
      cfg.channels?.[provider] && typeof cfg.channels[provider] === "object"
        ? cfg.channels[provider]
        : null;
    if (!providerConfig) {
      throw new Error(`Channel "${provider}" not found`);
    }
    const hasAccounts =
      providerConfig.accounts && typeof providerConfig.accounts === "object";
    const hasLegacyDefault =
      accountId === "default" &&
      !hasAccounts &&
      hasLegacyDefaultChannelAccount({ config: providerConfig });
    if (!hasLegacyDefault && !providerConfig.accounts?.[accountId]) {
      throw new Error(`Channel account "${provider}/${accountId}" not found`);
    }

    if (provider === "discord") {
      const nextCfg = withNormalizedAgentsConfig({
        OPENCLAW_DIR,
        cfg: loadConfig({ fsImpl, OPENCLAW_DIR }),
      });
      const nextChannels =
        nextCfg.channels && typeof nextCfg.channels === "object"
          ? { ...nextCfg.channels }
          : {};
      const nextProviderConfig = normalizeChannelConfig({
        provider,
        channelConfig:
          nextChannels[provider] && typeof nextChannels[provider] === "object"
            ? nextChannels[provider]
            : {},
      });
      const nextAccounts =
        nextProviderConfig.accounts &&
        typeof nextProviderConfig.accounts === "object"
          ? { ...nextProviderConfig.accounts }
          : {};
      delete nextAccounts[accountId];
      if (Object.keys(nextAccounts).length > 0) {
        nextProviderConfig.accounts = nextAccounts;
        nextChannels[provider] = nextProviderConfig;
      } else {
        delete nextChannels[provider];
      }
      nextCfg.channels = nextChannels;

      const targetMatch = normalizeBindingMatch({
        channel: provider,
        accountId,
      });
      const existingBindings = Array.isArray(nextCfg.bindings)
        ? nextCfg.bindings
        : [];
      nextCfg.bindings = existingBindings.filter((binding) => {
        const match = binding?.match || {};
        const hasScopedFields =
          !!match.peer ||
          !!match.parentPeer ||
          !!String(match.guildId || "").trim() ||
          !!String(match.teamId || "").trim() ||
          (Array.isArray(match.roles) && match.roles.length > 0);
        if (hasScopedFields) return true;
        return !matchesBinding(match, targetMatch);
      });
      if (!nextChannels[provider] && nextCfg.plugins?.entries?.[provider]) {
        nextCfg.plugins.entries[provider] = {
          ...(nextCfg.plugins.entries[provider] || {}),
          enabled: false,
        };
      }
      saveConfig({ fsImpl, OPENCLAW_DIR, config: nextCfg });

      const envKey = deriveChannelEnvKey({ provider, accountId });
      const currentEnvVars = readEnvFile();
      const previousEnvVars = Array.isArray(currentEnvVars)
        ? currentEnvVars
        : [];
      const nextEnvVars = previousEnvVars.filter(
        (entry) => String(entry?.key || "").trim() !== envKey,
      );
      if (nextEnvVars.length !== previousEnvVars.length) {
        writeEnvFile(nextEnvVars);
        reloadEnv();
      }

      cleanupChannelAccountPairingFiles({ provider, accountId });
      return { ok: true };
    }

    const removeArgs = [
      "channels remove",
      `--channel ${shellEscapeArg(provider)}`,
      `--account ${shellEscapeArg(accountId)}`,
      "--delete",
    ].filter(Boolean);
    const removeResult = await clawCmd(removeArgs.join(" "), {
      quiet: true,
      timeoutMs: 30000,
    });
    if (!removeResult?.ok) {
      throw new Error(
        removeResult?.stderr ||
          removeResult?.stdout ||
          "Could not delete channel account",
      );
    }

    const envKey = deriveChannelEnvKey({ provider, accountId });
    const currentEnvVars = readEnvFile();
    const previousEnvVars = Array.isArray(currentEnvVars) ? currentEnvVars : [];
    const nextEnvVars = previousEnvVars.filter(
      (entry) => String(entry?.key || "").trim() !== envKey,
    );
    if (nextEnvVars.length !== previousEnvVars.length) {
      writeEnvFile(nextEnvVars);
      reloadEnv();
    }

    const nextCfg = withNormalizedAgentsConfig({
      OPENCLAW_DIR,
      cfg: loadConfig({ fsImpl, OPENCLAW_DIR }),
    });
    const nextChannels =
      nextCfg.channels && typeof nextCfg.channels === "object"
        ? { ...nextCfg.channels }
        : {};
    const nextProviderConfig = normalizeChannelConfig({
      provider,
      channelConfig:
        nextChannels[provider] && typeof nextChannels[provider] === "object"
          ? nextChannels[provider]
          : {},
    });
    const nextAccounts =
      nextProviderConfig.accounts &&
      typeof nextProviderConfig.accounts === "object"
        ? { ...nextProviderConfig.accounts }
        : {};
    delete nextAccounts[accountId];
    if (Object.keys(nextAccounts).length > 0) {
      nextProviderConfig.accounts = nextAccounts;
      nextChannels[provider] = nextProviderConfig;
    } else {
      delete nextChannels[provider];
    }
    nextCfg.channels = nextChannels;
    const targetMatch = normalizeBindingMatch({ channel: provider, accountId });
    const existingBindings = Array.isArray(nextCfg.bindings)
      ? nextCfg.bindings
      : [];
    nextCfg.bindings = existingBindings.filter((binding) => {
      const match = binding?.match || {};
      const hasScopedFields =
        !!match.peer ||
        !!match.parentPeer ||
        !!String(match.guildId || "").trim() ||
        !!String(match.teamId || "").trim() ||
        (Array.isArray(match.roles) && match.roles.length > 0);
      if (hasScopedFields) return true;
      return !matchesBinding(match, targetMatch);
    });
    saveConfig({ fsImpl, OPENCLAW_DIR, config: nextCfg });

    cleanupChannelAccountPairingFiles({ provider, accountId });
    return { ok: true };
  };

  const deleteAgent = (agentId, { keepWorkspace = true } = {}) => {
    const normalized = String(agentId || "").trim();
    if (!normalized || normalized === kDefaultAgentId) {
      throw new Error("The default main agent cannot be deleted");
    }
    const cfg = withNormalizedAgentsConfig({
      OPENCLAW_DIR,
      cfg: loadConfig({ fsImpl, OPENCLAW_DIR }),
    });
    const target = cfg.agents.list.find((entry) => entry.id === normalized);
    if (!target) throw new Error(`Agent "${normalized}" not found`);
    if (target.default) {
      throw new Error("Default agent cannot be deleted");
    }
    cfg.agents.list = cfg.agents.list.filter(
      (entry) => entry.id !== normalized,
    );
    if (Array.isArray(cfg.bindings)) {
      cfg.bindings = cfg.bindings.filter(
        (binding) => String(binding?.agentId || "") !== normalized,
      );
    }
    saveConfig({ fsImpl, OPENCLAW_DIR, config: cfg });

    if (!keepWorkspace) {
      const workspacePath = resolveAgentWorkspacePath({
        OPENCLAW_DIR,
        agentId: normalized,
      });
      const agentDirPath = path.join(OPENCLAW_DIR, "agents", normalized);
      fsImpl.rmSync(workspacePath, { recursive: true, force: true });
      fsImpl.rmSync(agentDirPath, { recursive: true, force: true });
    }
    return { ok: true };
  };

  return {
    listAgents,
    getAgent,
    getAgentWorkspaceSize,
    getBindingsForAgent,
    getChannelAccountToken,
    createAgent,
    updateAgent,
    setDefaultAgent,
    addBinding,
    removeBinding,
    createChannelAccount,
    updateChannelAccount,
    deleteChannelAccount,
    listConfiguredChannelAccounts: () => {
      const channels = listConfiguredChannelAccounts({
        fsImpl,
        OPENCLAW_DIR,
        cfg: withNormalizedAgentsConfig({
          OPENCLAW_DIR,
          cfg: loadConfig({ fsImpl, OPENCLAW_DIR }),
        }),
      });
      const envVars = readEnvFile();
      const envKeySet = new Set(
        (Array.isArray(envVars) ? envVars : [])
          .filter((v) => v?.key && String(v?.value || "").trim())
          .map((v) => String(v.key).trim()),
      );
      return channels.map((entry) => ({
        ...entry,
        accounts: entry.accounts.map((account) => ({
          ...account,
          token: envKeySet.has(String(account.envKey || "").trim())
            ? kMaskedChannelToken
            : "",
        })),
      }));
    },
    deleteAgent,
  };
};

module.exports = { createAgentsService };
