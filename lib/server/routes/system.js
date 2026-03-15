const { execFileSync } = require("child_process");
const path = require("path");
const https = require("https");
const { buildManagedPaths } = require("../internal-files-migration");
const { readOpenclawConfig } = require("../openclaw-config");
const { hasScopedBindingFields } = require("../utils/channels");
const {
  applySystemCronConfig,
  getSystemCronStatus,
  isValidCronSchedule,
} = require("../system-cron");
const { readOnboardingMarker } = require("../onboarding/state");

const registerSystemRoutes = ({
  app,
  fs,
  readEnvFile,
  writeEnvFile,
  reloadEnv,
  kKnownVars,
  kKnownKeys,
  kSystemVars,
  syncChannelConfig,
  isGatewayRunning,
  isOnboarded,
  getChannelStatus,
  openclawVersionService,
  alphaclawVersionService,
  kAlphaclawGithubReleasesBaseUrl,
  clawCmd,
  restartGateway,
  OPENCLAW_DIR,
  kOnboardingMarkerPath = "",
  kControlUiSkillPath = "",
  restartRequiredState,
  topicRegistry,
  authProfiles,
  platform = process.platform,
  execFileSyncImpl = execFileSync,
}) => {
  let envRestartPending = false;
  const kManagedChannelTokenPattern =
    /^(?:TELEGRAM_BOT_TOKEN|DISCORD_BOT_TOKEN|SLACK_BOT_TOKEN|SLACK_APP_TOKEN)(?:_[A-Z0-9_]+)?$/;
  const kEnvVarsReservedForUserInput = new Set([
    "GITHUB_WORKSPACE_REPO",
    "GOG_KEYRING_PASSWORD",
    "ALPHACLAW_ROOT_DIR",
    "OPENCLAW_HOME",
    "OPENCLAW_CONFIG_PATH",
    "XDG_CONFIG_HOME",
  ]);
  const kReservedUserEnvVarKeys = Array.from(
    new Set([...kSystemVars, ...kEnvVarsReservedForUserInput]),
  );
  const isManagedChannelTokenKey = (key) =>
    kManagedChannelTokenPattern.test(String(key || "").trim().toUpperCase());
  const isReservedUserEnvVar = (key) =>
    kSystemVars.has(key) || kEnvVarsReservedForUserInput.has(key);
  const shellEscapeArg = (value) => {
    const safeValue = String(value || "");
    return `'${safeValue.replace(/'/g, `'\\''`)}'`;
  };
  const parseJsonFromStdout = (stdout) => {
    const raw = String(stdout || "").trim();
    if (!raw) return null;
    const candidateStarts = [raw.indexOf("{"), raw.indexOf("[")].filter(
      (idx) => idx >= 0,
    );
    for (const start of candidateStarts) {
      const candidate = raw.slice(start);
      try {
        return JSON.parse(candidate);
      } catch {}
    }
    return null;
  };
  const safeRealpath = (targetPath) => {
    try {
      if (!targetPath || !fs.existsSync(targetPath)) return "";
      return fs.realpathSync(targetPath);
    } catch {
      return "";
    }
  };
  const readSymlinkTarget = (targetPath) => {
    try {
      if (!targetPath || !fs.existsSync(targetPath)) return "";
      return fs.readlinkSync(targetPath);
    } catch {
      return "";
    }
  };
  const isSymlink = (targetPath) => {
    try {
      if (!targetPath || !fs.existsSync(targetPath)) return false;
      return !!fs.lstatSync(targetPath)?.isSymbolicLink?.();
    } catch {
      return false;
    }
  };
  const toTitleWords = (value) =>
    String(value || "")
      .trim()
      .split(/[-_\s]+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  const resolveTelegramAccountIdForAgent = ({ config, agentId }) => {
    const normalizedAgentId = String(agentId || "").trim();
    if (!normalizedAgentId) return "default";
    const bindings = Array.isArray(config?.bindings) ? config.bindings : [];
    for (const binding of bindings) {
      if (String(binding?.agentId || "").trim() !== normalizedAgentId) continue;
      const match = binding?.match || {};
      if (String(match.channel || "").trim() !== "telegram") continue;
      if (hasScopedBindingFields(match)) continue;
      return String(match.accountId || "").trim() || "default";
    }
    return normalizedAgentId === "main" ? "default" : "";
  };
  const resolveTelegramChannelNameForAgent = ({ config, agentId }) => {
    const telegramConfig =
      config?.channels?.telegram && typeof config.channels.telegram === "object"
        ? config.channels.telegram
        : {};
    const accountId = resolveTelegramAccountIdForAgent({ config, agentId });
    const hasAccounts =
      telegramConfig.accounts && typeof telegramConfig.accounts === "object";
    if (hasAccounts) {
      const accountConfig =
        accountId && telegramConfig.accounts?.[accountId]
          ? telegramConfig.accounts[accountId]
          : {};
      const accountName = String(accountConfig?.name || "").trim();
      if (accountName) return accountName;
    } else if (accountId === "default") {
      const legacyName = String(telegramConfig?.name || "").trim();
      if (legacyName) return legacyName;
    }
    return "Telegram";
  };
  const getAgentLabelFromSessionKey = (key = "") => {
    const match = String(key || "").match(/^agent:([^:]+):/);
    const agentId = String(match?.[1] || "").trim();
    if (!agentId) return "Agent";
    if (agentId === "main") return "Main Agent";
    return toTitleWords(agentId);
  };
  const buildSessionLabel = (sessionRow = {}, config = {}) => {
    const key = String(sessionRow?.key || "");
    const agentLabel = getAgentLabelFromSessionKey(key);
    const agentKeyMatch = key.match(/^agent:([^:]+):/);
    const agentId = String(agentKeyMatch?.[1] || "").trim();
    const telegramChannelName = resolveTelegramChannelNameForAgent({
      config,
      agentId,
    });
    if (key.endsWith(":main")) return `${agentLabel} - Main Thread`;
    const telegramMatch = key.match(/:telegram:direct:([^:]+)$/);
    if (telegramMatch) {
      return `${agentLabel} - Telegram DM (${telegramChannelName})`;
    }
    const telegramTopicMatch = key.match(
      /:telegram:group:([^:]+):topic:([^:]+)$/,
    );
    if (telegramTopicMatch) {
      const [, groupId, topicId] = telegramTopicMatch;
      let groupEntry = null;
      try {
        groupEntry = topicRegistry?.getGroup?.(groupId) || null;
      } catch {}
      const groupName = String(groupEntry?.name || "").trim();
      const topicName = String(
        groupEntry?.topics?.[topicId]?.name || "",
      ).trim();
      if (groupName && topicName) {
        return `${agentLabel} - ${telegramChannelName} ${groupName} · ${topicName}`;
      }
      if (topicName) return `${agentLabel} - ${telegramChannelName} Topic ${topicName}`;
      return `${agentLabel} - ${telegramChannelName} Topic ${topicId}`;
    }
    const directMatch = key.match(/:direct:([^:]+)$/);
    if (directMatch) {
      return `${agentLabel} - Direct ${directMatch[1]}`;
    }
    return key || "Session";
  };
  const syncApiKeyAuthProfilesFromEnvVars = (nextEnvVars) => {
    if (!authProfiles) return;
    const envMap = new Map(
      (nextEnvVars || []).map((entry) => [
        String(entry?.key || "").trim(),
        String(entry?.value || ""),
      ]),
    );
    const providers = authProfiles.listApiKeyProviders?.() || [];
    for (const provider of providers) {
      const envKey = authProfiles.getEnvVarForApiKeyProvider?.(provider);
      if (!envKey) continue;
      const value = envMap.get(envKey) || "";
      if (!value.trim()) {
        authProfiles.removeApiKeyProfileForEnvVar?.(provider);
        continue;
      }
      authProfiles.upsertApiKeyProfileForEnvVar(provider, value);
    }
  };
  const getSessionReplyTarget = (sessionKey = "") => {
    const key = String(sessionKey || "");
    const telegramDirectMatch = key.match(/:telegram:direct:([^:]+)$/);
    if (telegramDirectMatch) {
      return {
        replyChannel: "telegram",
        replyTo: String(telegramDirectMatch[1] || ""),
      };
    }
    const telegramTopicMatch = key.match(
      /:telegram:group:([^:]+):topic:([^:]+)$/,
    );
    if (telegramTopicMatch) {
      return {
        replyChannel: "telegram",
        replyTo: `${String(telegramTopicMatch[1] || "")}:${String(telegramTopicMatch[2] || "")}`,
      };
    }
    return {
      replyChannel: "",
      replyTo: "",
    };
  };

  const listSendableAgentSessions = async () => {
    const result = await clawCmd("sessions --json --all-agents", {
      quiet: true,
    });
    if (!result.ok) {
      throw new Error(result.stderr || "Could not load agent sessions");
    }
    const payload = parseJsonFromStdout(result.stdout);
    const sessions = Array.isArray(payload?.sessions) ? payload.sessions : [];
    const config = readOpenclawConfig({
      fsModule: fs,
      openclawDir: OPENCLAW_DIR,
      fallback: {},
    });
    return sessions
      .filter((sessionRow) => {
        const key = String(sessionRow?.key || "").toLowerCase();
        if (!key) return false;
        if (
          key.includes(":hook:") ||
          key.includes(":cron:") ||
          key.includes(":doctor:")
        ) {
          return false;
        }
        return true;
      })
      .map((sessionRow) => {
        const key = String(sessionRow?.key || "");
        const replyTarget = getSessionReplyTarget(key);
        return {
          key,
          sessionId: String(sessionRow?.sessionId || ""),
          updatedAt: Number(sessionRow?.updatedAt) || 0,
          label: buildSessionLabel(sessionRow, config),
          replyChannel: replyTarget.replyChannel,
          replyTo: replyTarget.replyTo,
        };
      })
      .sort((a, b) => b.updatedAt - a.updatedAt);
  };
  const readSystemCronConfig = () =>
    getSystemCronStatus({
      fs,
      openclawDir: OPENCLAW_DIR,
      platform,
      execFileSyncImpl,
    });
  const applyManagedCronConfig = (nextConfig) =>
    applySystemCronConfig({
      fs,
      openclawDir: OPENCLAW_DIR,
      nextConfig,
      platform,
      execFileSyncImpl,
    });
  const isVisibleInEnvars = (def) => def?.visibleInEnvars !== false;
  const kReleaseNotesCacheTtlMs = 5 * 60 * 1000;
  let kReleaseNotesCache = {
    key: "",
    fetchedAt: 0,
    payload: null,
  };
  const isValidReleaseTag = (value) =>
    /^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(String(value || ""));
  const fetchGitHubRelease = (tag = "") =>
    new Promise((resolve, reject) => {
      const normalizedTag = String(tag || "").trim();
      const endpointPath = normalizedTag
        ? `/tags/${encodeURIComponent(normalizedTag)}`
        : "/latest";
      const requestUrl = `${kAlphaclawGithubReleasesBaseUrl}${endpointPath}`;
      const token = String(process.env.GITHUB_TOKEN || "").trim();
      const headers = {
        Accept: "application/vnd.github+json",
        "User-Agent": "alphaclaw-release-notes",
      };
      if (token) headers.Authorization = `Bearer ${token}`;
      const request = https.get(
        requestUrl,
        { headers, timeout: 7000 },
        (response) => {
          let raw = "";
          response.setEncoding("utf8");
          response.on("data", (chunk) => {
            raw += chunk;
          });
          response.on("end", () => {
            let parsed = null;
            try {
              parsed = raw ? JSON.parse(raw) : null;
            } catch {
              parsed = null;
            }
            const statusCode = Number(response.statusCode) || 500;
            if (statusCode >= 400) {
              const message =
                parsed?.message ||
                `GitHub release lookup failed with status ${statusCode}`;
              return reject(
                Object.assign(new Error(message), {
                  statusCode,
                }),
              );
            }
            resolve({
              tag: String(parsed?.tag_name || normalizedTag || ""),
              name: String(parsed?.name || "").trim(),
              body: String(parsed?.body || ""),
              htmlUrl: String(parsed?.html_url || "").trim(),
              publishedAt: String(parsed?.published_at || "").trim(),
            });
          });
        },
      );
      request.on("timeout", () => {
        request.destroy(new Error("GitHub release request timed out"));
      });
      request.on("error", (error) => {
        reject(error);
      });
    });

  app.get("/api/env", (req, res) => {
    const fileVars = readEnvFile();
    const merged = [];

    for (const def of kKnownVars) {
      if (isReservedUserEnvVar(def.key)) continue;
      if (!isVisibleInEnvars(def)) continue;
      const fileEntry = fileVars.find((v) => v.key === def.key);
      const value = fileEntry?.value || "";
      merged.push({
        key: def.key,
        value,
        label: def.label,
        group: def.group,
        hint: def.hint,
        features: def.features,
        source: fileEntry?.value ? "env_file" : "unset",
        editable: true,
      });
    }

    for (const v of fileVars) {
      if (
        kKnownKeys.has(v.key) ||
        isReservedUserEnvVar(v.key) ||
        isManagedChannelTokenKey(v.key)
      ) {
        continue;
      }
      merged.push({
        key: v.key,
        value: v.value,
        label: v.key,
        group: "custom",
        hint: "",
        source: "env_file",
        editable: true,
      });
    }

    res.json({
      vars: merged,
      reservedKeys: kReservedUserEnvVarKeys,
      restartRequired: envRestartPending && isOnboarded(),
    });
  });

  app.put("/api/env", (req, res) => {
    const { vars } = req.body;
    if (!Array.isArray(vars)) {
      return res.status(400).json({ ok: false, error: "Missing vars array" });
    }

    const blockedKeys = Array.from(
      new Set(
        vars
          .map((v) => String(v?.key || "").trim())
          .filter((key) => key && isReservedUserEnvVar(key)),
      ),
    );
    if (blockedKeys.length) {
      return res.status(400).json({
        ok: false,
        error: `Reserved environment variables cannot be edited: ${blockedKeys.join(", ")}`,
      });
    }

    const filtered = vars.filter(
      (v) => !isReservedUserEnvVar(v.key) && !isManagedChannelTokenKey(v.key),
    );
    const existingLockedVars = readEnvFile().filter((v) =>
      isReservedUserEnvVar(v.key),
    );
    const existingManagedChannelVars = readEnvFile().filter((v) =>
      isManagedChannelTokenKey(v.key),
    );
    const hiddenKnownVarKeys = new Set(
      kKnownVars
        .filter(
          (def) => !isReservedUserEnvVar(def.key) && !isVisibleInEnvars(def),
        )
        .map((def) => def.key),
    );
    const existingHiddenKnownVars = readEnvFile().filter((v) =>
      hiddenKnownVarKeys.has(v.key),
    );
    const nextEnvVars = [
      ...filtered,
      ...existingHiddenKnownVars,
      ...existingManagedChannelVars,
      ...existingLockedVars,
    ];
    syncChannelConfig(nextEnvVars, "remove");
    writeEnvFile(nextEnvVars);
    const changed = reloadEnv();
    syncApiKeyAuthProfilesFromEnvVars(nextEnvVars);
    if (changed && isOnboarded()) {
      envRestartPending = true;
    }
    const restartRequired = envRestartPending && isOnboarded();
    console.log(
      `[alphaclaw] Env vars saved (${nextEnvVars.length} vars, changed=${changed})`,
    );
    syncChannelConfig(nextEnvVars, "add");

    res.json({ ok: true, changed, restartRequired });
  });

  app.get("/api/status", async (req, res) => {
    const configPath = `${OPENCLAW_DIR}/openclaw.json`;
    const configExists = fs.existsSync(configPath);
    const running = await isGatewayRunning();
    const repo = process.env.GITHUB_WORKSPACE_REPO || "";
    const openclawVersion = openclawVersionService.readOpenclawVersion();
    const onboardingMarker =
      kOnboardingMarkerPath
        ? readOnboardingMarker({
            fsModule: fs,
            markerPath: kOnboardingMarkerPath,
          })
        : null;
    res.json({
      gateway: running
        ? "running"
        : configExists
          ? "starting"
          : "not_onboarded",
      configExists,
      channels: getChannelStatus(),
      repo,
      openclawVersion,
      syncCron: readSystemCronConfig(),
      diagnostics: {
        readOnlyMode: !!onboardingMarker?.readOnly,
        onboardingReason: String(onboardingMarker?.reason || ""),
        onboardingMarkerPath: kOnboardingMarkerPath || "",
        onboardingMarkerExists: !!(
          kOnboardingMarkerPath && fs.existsSync(kOnboardingMarkerPath)
        ),
        openclawDir: OPENCLAW_DIR,
        openclawDirIsSymlink: isSymlink(OPENCLAW_DIR),
        openclawDirLinkTarget: readSymlinkTarget(OPENCLAW_DIR),
        resolvedOpenclawDir: safeRealpath(OPENCLAW_DIR),
        configPath,
        resolvedConfigPath: safeRealpath(configPath),
        controlUiSkillPath: kControlUiSkillPath || "",
        controlUiSkillExists: !!(
          kControlUiSkillPath && fs.existsSync(kControlUiSkillPath)
        ),
        resolvedControlUiSkillPath: safeRealpath(kControlUiSkillPath),
        cwd: process.cwd(),
        openclawVersionSource: "openclaw --version",
        openclawHomeEnv: String(process.env.OPENCLAW_HOME || ""),
        openclawConfigPathEnv: String(process.env.OPENCLAW_CONFIG_PATH || ""),
        xdgConfigHomeEnv: String(process.env.XDG_CONFIG_HOME || ""),
        rootPathBasename: path.basename(OPENCLAW_DIR),
      },
    });
  });

  app.get("/api/sync-cron", (req, res) => {
    res.json({ ok: true, ...readSystemCronConfig() });
  });

  app.put("/api/sync-cron", (req, res) => {
    const current = readSystemCronConfig();
    const { enabled, schedule } = req.body || {};
    if (enabled !== undefined && typeof enabled !== "boolean") {
      return res
        .status(400)
        .json({ ok: false, error: "enabled must be a boolean" });
    }
    if (schedule !== undefined && !isValidCronSchedule(schedule)) {
      return res
        .status(400)
        .json({ ok: false, error: "schedule must be a 5-field cron string" });
    }
    const nextConfig = {
      enabled: typeof enabled === "boolean" ? enabled : current.enabled,
      schedule:
        typeof schedule === "string" && schedule.trim()
          ? schedule.trim()
          : current.schedule,
    };
    const status = applyManagedCronConfig(nextConfig);
    res.json({ ok: true, syncCron: status });
  });

  app.get("/api/openclaw/version", async (req, res) => {
    const refresh = String(req.query.refresh || "") === "1";
    const status = await openclawVersionService.getVersionStatus(refresh);
    res.json(status);
  });

  app.post("/api/openclaw/update", async (req, res) => {
    console.log("[alphaclaw] /api/openclaw/update requested");
    const result = await openclawVersionService.updateOpenclaw();
    console.log(
      `[alphaclaw] /api/openclaw/update result: status=${result.status} ok=${result.body?.ok === true}`,
    );
    res.status(result.status).json(result.body);
  });

  app.get("/api/alphaclaw/version", async (req, res) => {
    const refresh = String(req.query.refresh || "") === "1";
    const status = await alphaclawVersionService.getVersionStatus(refresh);
    res.json(status);
  });

  app.get("/api/alphaclaw/release-notes", async (req, res) => {
    const requestedTag = String(req.query.tag || "").trim();
    if (requestedTag && !isValidReleaseTag(requestedTag)) {
      return res.status(400).json({ ok: false, error: "Invalid release tag" });
    }
    const cacheKey = requestedTag || "latest";
    const now = Date.now();
    if (
      kReleaseNotesCache.payload &&
      kReleaseNotesCache.key === cacheKey &&
      now - kReleaseNotesCache.fetchedAt < kReleaseNotesCacheTtlMs
    ) {
      return res.json({ ok: true, ...kReleaseNotesCache.payload });
    }
    try {
      const payload = await fetchGitHubRelease(requestedTag);
      kReleaseNotesCache = {
        key: cacheKey,
        fetchedAt: Date.now(),
        payload,
      };
      return res.json({ ok: true, ...payload });
    } catch (err) {
      const statusCode = Number(err?.statusCode) || 502;
      return res.status(statusCode).json({
        ok: false,
        error: err?.message || "Could not fetch release notes",
      });
    }
  });

  app.post("/api/alphaclaw/update", async (req, res) => {
    console.log("[alphaclaw] /api/alphaclaw/update requested");
    const result = await alphaclawVersionService.updateAlphaclaw();
    console.log(
      `[alphaclaw] /api/alphaclaw/update result: status=${result.status} ok=${result.body?.ok === true}`,
    );
    if (result.status === 200 && result.body?.ok) {
      res.json(result.body);
      setTimeout(() => alphaclawVersionService.restartProcess(), 1000);
    } else {
      res.status(result.status).json(result.body);
    }
  });

  app.get("/api/gateway-status", async (req, res) => {
    const result = await clawCmd("status");
    res.json(result);
  });

  app.get("/api/agent/sessions", async (req, res) => {
    try {
      const sessions = await listSendableAgentSessions();
      return res.json({ ok: true, sessions });
    } catch (err) {
      return res.status(502).json({ ok: false, error: err.message });
    }
  });

  app.post("/api/agent/message", async (req, res) => {
    const rawMessage = String(req.body?.message || "");
    const message = rawMessage.trim();
    const sessionKey = String(req.body?.sessionKey || "").trim();
    if (!message) {
      return res.status(400).json({ ok: false, error: "message is required" });
    }
    if (message.length > 4000) {
      return res
        .status(400)
        .json({ ok: false, error: "message must be 4000 characters or fewer" });
    }
    let command = `agent --agent main --message ${shellEscapeArg(message)}`;
    if (sessionKey) {
      let selectedSession = null;
      try {
        const sessions = await listSendableAgentSessions();
        selectedSession =
          sessions.find((sessionRow) => sessionRow.key === sessionKey) || null;
      } catch (err) {
        return res.status(502).json({ ok: false, error: err.message });
      }
      if (!selectedSession) {
        return res
          .status(400)
          .json({ ok: false, error: "Selected session was not found" });
      }
      if (selectedSession.replyChannel && selectedSession.replyTo) {
        command +=
          ` --deliver --reply-channel ${shellEscapeArg(selectedSession.replyChannel)}` +
          ` --reply-to ${shellEscapeArg(selectedSession.replyTo)}`;
      } else if (selectedSession.sessionId) {
        command += ` --session-id ${shellEscapeArg(selectedSession.sessionId)}`;
      }
    }
    const result = await clawCmd(command, { quiet: true });
    if (!result.ok) {
      return res
        .status(502)
        .json({
          ok: false,
          error: result.stderr || "Could not send message to agent",
        });
    }
    return res.json({ ok: true, stdout: result.stdout || "" });
  });

  app.get("/api/gateway/dashboard", async (req, res) => {
    if (!isOnboarded()) return res.json({ ok: false, url: "/openclaw" });
    const result = await clawCmd("dashboard --no-open");
    if (result.ok && result.stdout) {
      const tokenMatch = result.stdout.match(/#token=([a-zA-Z0-9]+)/);
      if (tokenMatch) {
        return res.json({ ok: true, url: `/openclaw/#token=${tokenMatch[1]}` });
      }
    }
    res.json({ ok: true, url: "/openclaw" });
  });

  app.get("/api/restart-status", async (req, res) => {
    try {
      const snapshot = await restartRequiredState.getSnapshot();
      res.json({
        ok: true,
        restartRequired: snapshot.restartRequired || envRestartPending,
        restartInProgress: snapshot.restartInProgress,
        gatewayRunning: snapshot.gatewayRunning,
      });
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  app.post("/api/gateway/restart", async (req, res) => {
    if (!isOnboarded()) {
      return res.status(400).json({ ok: false, error: "Not onboarded" });
    }
    restartRequiredState.markRestartInProgress();
    try {
      restartGateway();
      envRestartPending = false;
      restartRequiredState.clearRequired();
      restartRequiredState.markRestartComplete();
      const snapshot = await restartRequiredState.getSnapshot();
      res.json({ ok: true, restartRequired: snapshot.restartRequired });
    } catch (err) {
      restartRequiredState.markRestartComplete();
      res.status(500).json({ ok: false, error: err.message });
    }
  });
};

module.exports = { registerSystemRoutes };
