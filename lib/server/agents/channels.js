const path = require("path");

const {
  kChannelTokenFields,
  kChannelLabels,
  kMaskedChannelToken,
  shellEscapeArg,
  resolveCredentialsDirPath,
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
  withNormalizedAgentsConfig,
} = require("./shared");

const createChannelsDomain = ({
  fsImpl,
  OPENCLAW_DIR,
  readEnvFile,
  writeEnvFile,
  reloadEnv,
  restartGateway,
  clawCmd,
}) => {
  let createChannelAccountInProgress = false;

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
    const extraEnvKeys = deriveChannelExtraEnvKeys({ provider, accountId });
    const envVars = readEnvFile();
    const envEntry = (Array.isArray(envVars) ? envVars : []).find(
      (entry) => String(entry?.key || "").trim() === envKey,
    );
    const appEnvKey = extraEnvKeys[0] || "";
    const appEnvEntry = appEnvKey
      ? (Array.isArray(envVars) ? envVars : []).find(
          (entry) => String(entry?.key || "").trim() === appEnvKey,
        )
      : null;
    return {
      provider,
      accountId,
      envKey,
      token: String(envEntry?.value || ""),
      ...(provider === "slack"
        ? {
            appEnvKey,
            appToken: String(appEnvEntry?.value || ""),
          }
        : {}),
    };
  };

  const createChannelAccount = async (
    input = {},
    { onProgress = () => {} } = {},
  ) => {
    if (createChannelAccountInProgress) {
      throw new Error("A channel account creation is already in progress");
    }
    createChannelAccountInProgress = true;
    try {
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
      if (
        (provider === "discord" || provider === "slack") &&
        Object.keys(existingAccounts).length > 0
      ) {
        throw new Error(
          `${kChannelLabels[provider] || "This provider"} supports a single channel account`,
        );
      }

      const envKey = deriveChannelEnvKey({ provider, accountId });
      const extraEnvKeys = deriveChannelExtraEnvKeys({ provider, accountId });
      const appToken = String(input.appToken || "").trim();
      if (provider === "slack" && !appToken) {
        throw new Error("Slack App Token is required");
      }
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
      let orphanedExtraEnvKey = null;
      if (provider === "slack") {
        const appEnvKey = extraEnvKeys[0];
        const duplicateAppTokenEntry = previousEnvVars.find((entry) => {
          const existingKey = String(entry?.key || "").trim();
          const existingValue = String(entry?.value || "").trim();
          if (!existingKey || !existingValue) return false;
          if (existingKey === envKey || existingKey === appEnvKey) return false;
          return existingValue === appToken;
        });
        if (duplicateAppTokenEntry) {
          const dupKey = String(duplicateAppTokenEntry.key || "").trim();
          const configuredKeys = getConfiguredChannelEnvKeys(cfg);
          if (configuredKeys.has(dupKey)) {
            throw new Error(`Channel token already exists in ${dupKey}`);
          }
          orphanedExtraEnvKey = dupKey;
          console.log(
            `[alphaclaw] Overwriting orphaned channel env var ${dupKey} (no matching config entry)`,
          );
        }
      }
      const nextEnvVars = previousEnvVars.filter((entry) => {
        const key = String(entry?.key || "").trim();
        return (
          key !== envKey &&
          key !== orphanedEnvKey &&
          !extraEnvKeys.includes(key) &&
          key !== orphanedExtraEnvKey
        );
      });
      nextEnvVars.push({ key: envKey, value: token });
      if (provider === "slack" && extraEnvKeys[0]) {
        nextEnvVars.push({ key: extraEnvKeys[0], value: appToken });
      }

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
          accountId !== "default"
            ? `--account ${shellEscapeArg(accountId)}`
            : "",
          name ? `--name ${shellEscapeArg(name)}` : "",
          provider === "slack"
            ? `--bot-token ${shellEscapeArg(token)}`
            : `--token ${shellEscapeArg(token)}`,
          provider === "slack" && appToken
            ? `--app-token ${shellEscapeArg(appToken)}`
            : "",
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
          ...(provider === "slack" && extraEnvKeys[0]
            ? { appToken: `\${${extraEnvKeys[0]}}` }
            : {}),
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
    } finally {
      createChannelAccountInProgress = false;
    }
  };

  const updateChannelAccount = (input = {}) => {
    const provider = normalizeChannelProvider(input.provider);
    const accountId = String(input.accountId || "").trim() || "default";
    const nextName = String(input.name || "").trim();
    const nextAgentId = String(input.agentId || "").trim();
    const nextToken = String(input.token || "").trim();
    const nextAppToken = String(input.appToken || "").trim();
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
    if (provider === "slack" && nextAppToken) {
      const appEnvKey = deriveChannelExtraEnvKeys({ provider, accountId })[0];
      const currentEnvVars = readEnvFile();
      const previousEnvVars = Array.isArray(currentEnvVars)
        ? currentEnvVars
        : [];
      const existingAppToken = String(
        previousEnvVars.find(
          (entry) => String(entry?.key || "").trim() === appEnvKey,
        )?.value || "",
      );
      const duplicateEnvEntry = previousEnvVars.find((entry) => {
        const existingKey = String(entry?.key || "").trim();
        const existingValue = String(entry?.value || "").trim();
        if (!existingKey || !existingValue) return false;
        if (existingKey === appEnvKey) return false;
        return existingValue === nextAppToken;
      });
      if (duplicateEnvEntry) {
        const dupKey = String(duplicateEnvEntry.key || "").trim();
        const configuredKeys = getConfiguredChannelEnvKeys(cfg);
        if (configuredKeys.has(dupKey)) {
          throw new Error(`Channel token already exists in ${dupKey}`);
        }
      }
      if (existingAppToken !== nextAppToken) {
        const nextEnvVars = previousEnvVars.filter(
          (entry) => String(entry?.key || "").trim() !== appEnvKey,
        );
        nextEnvVars.push({ key: appEnvKey, value: nextAppToken });
        writeEnvFile(nextEnvVars);
        reloadEnv();
        tokenUpdated = true;
      }
    }
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
      const extraEnvKeys = deriveChannelExtraEnvKeys({ provider, accountId });
      const currentEnvVars = readEnvFile();
      const previousEnvVars = Array.isArray(currentEnvVars)
        ? currentEnvVars
        : [];
      const nextEnvVars = previousEnvVars.filter(
        (entry) =>
          String(entry?.key || "").trim() !== envKey &&
          !extraEnvKeys.includes(String(entry?.key || "").trim()),
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
    const extraEnvKeys = deriveChannelExtraEnvKeys({ provider, accountId });
    const currentEnvVars = readEnvFile();
    const previousEnvVars = Array.isArray(currentEnvVars) ? currentEnvVars : [];
    const nextEnvVars = previousEnvVars.filter(
      (entry) =>
        String(entry?.key || "").trim() !== envKey &&
        !extraEnvKeys.includes(String(entry?.key || "").trim()),
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

  const listConfiguredChannelAccountsWithMaskedTokens = () => {
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
  };

  return {
    getChannelAccountToken,
    createChannelAccount,
    updateChannelAccount,
    deleteChannelAccount,
    listConfiguredChannelAccountsWithMaskedTokens,
  };
};

module.exports = { createChannelsDomain };
