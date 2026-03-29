const { buildManagedPaths } = require("../internal-files-migration");
const { readOpenclawConfig } = require("../openclaw-config");
const https = require("https");

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
  restartRequiredState,
  topicRegistry,
  authProfiles,
  watchdog,
  doctorService,
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
  const kSystemCronPath = "/etc/cron.d/openclaw-hourly-sync";
  const kSystemCronConfigPath = `${OPENCLAW_DIR}/cron/system-sync.json`;
  const { hourlyGitSyncPath: kSystemCronScriptPath } = buildManagedPaths({
    openclawDir: OPENCLAW_DIR,
  });
  const kDefaultSystemCronSchedule = "0 * * * *";
  const isValidCronSchedule = (value) =>
    typeof value === "string" && /^(\S+\s+){4}\S+$/.test(value.trim());
  const buildSystemCronContent = (schedule) =>
    [
      "SHELL=/bin/bash",
      "PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin",
      `${schedule} root bash "${kSystemCronScriptPath}" >> /var/log/openclaw-hourly-sync.log 2>&1`,
      "",
    ].join("\n");
  const shellEscapeArg = (value) => {
    const safeValue = String(value || "");
    return `'${safeValue.replace(/'/g, `'\\''`)}'`;
  };
  const parseJsonFromStdout = (stdout) => {
    const raw = String(stdout || "").trim();
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {}
    const lines = raw
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    for (const line of lines) {
      if (!(line.startsWith("{") || line.startsWith("["))) continue;
      try {
        return JSON.parse(line);
      } catch {}
    }
    const candidateStarts = [raw.indexOf("{"), raw.indexOf("[")].filter((idx) => idx >= 0);
    for (const start of candidateStarts) {
      for (let end = raw.length; end > start; end -= 1) {
        const candidate = raw.slice(start, end).trim();
        if (!(candidate.endsWith("}") || candidate.endsWith("]"))) continue;
        try {
          return JSON.parse(candidate);
        } catch {}
      }
    }
    return null;
  };
  const getRawSessionKey = (sessionRow = {}) =>
    String(sessionRow?.key || sessionRow?.sessionKey || sessionRow?.id || "").trim();
  const getRawSessionsFromPayload = (payload) => {
    if (Array.isArray(payload)) return payload;
    const candidates = [
      payload?.sessions,
      payload?.items,
      payload?.data?.sessions,
      payload?.data?.items,
      payload?.result?.sessions,
      payload?.result?.items,
    ];
    for (const candidate of candidates) {
      if (Array.isArray(candidate)) return candidate;
    }
    return [];
  };
  const toTitleWords = (value) =>
    String(value || "")
      .trim()
      .split(/[-_\s]+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  const getDefaultAgentLabel = (config = {}) => {
    return "Main Agent";
  };
  const getFallbackAgentLabel = (agentId = "") => {
    const normalizedAgentId = String(agentId || "").trim();
    if (!normalizedAgentId) return "Agent";
    const titledAgentId = toTitleWords(normalizedAgentId) || normalizedAgentId;
    return `${titledAgentId} Agent`;
  };
  const getConfiguredAgentLabel = (config = {}, agentId = "") => {
    const normalizedAgentId = String(agentId || "").trim();
    if (!normalizedAgentId) return "Agent";
    const configuredAgents = Array.isArray(config?.agents?.list)
      ? config.agents.list
      : [];
    const configuredAgent = configuredAgents.find(
      (entry) => String(entry?.id || "").trim() === normalizedAgentId,
    );
    const configuredName =
      String(configuredAgent?.name || "").trim() ||
      String(configuredAgent?.identity?.name || "").trim();
    if (configuredName) return configuredName;
    if (normalizedAgentId === "main") return getDefaultAgentLabel(config);
    return getFallbackAgentLabel(normalizedAgentId);
  };
  const getAgentLabelFromSessionKey = (key = "", config = {}) => {
    const match = String(key || "").match(/^agent:([^:]+):/);
    const agentId = String(match?.[1] || "").trim();
    if (!agentId) return "Agent";
    return getConfiguredAgentLabel(config, agentId);
  };
  const parseChannelFromSessionKey = (key = "") => {
    const k = String(key || "");
    if (k.includes(":telegram:")) return "telegram";
    if (k.includes(":discord:")) return "discord";
    if (k.includes(":slack:")) return "slack";
    return "";
  };
  const getSessionTopicContext = (sessionKey = "") => {
    const key = String(sessionKey || "");
    const topicMatch = key.match(/:telegram:group:([^:]+):topic:([^:]+)$/);
    if (!topicMatch) {
      return {
        groupName: "",
        topicName: "",
      };
    }
    const [, groupId, topicId] = topicMatch;
    let groupEntry = null;
    try {
      groupEntry = topicRegistry?.getGroup?.(groupId) || null;
    } catch {}
    return {
      groupName: String(groupEntry?.name || "").trim(),
      topicName: String(groupEntry?.topics?.[topicId]?.name || "").trim(),
    };
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
    const sessions = getRawSessionsFromPayload(payload);
    const config = readOpenclawConfig({
      fsModule: fs,
      openclawDir: OPENCLAW_DIR,
      fallback: {},
    });
    return sessions
      .map((sessionRow) => {
        const key = getRawSessionKey(sessionRow);
        if (!key) return null;
        const replyTarget = getSessionReplyTarget(key);
        const agentKeyMatch = key.match(/^agent:([^:]+):/);
        const agentId = String(agentKeyMatch?.[1] || "").trim();
        const channel =
          parseChannelFromSessionKey(key) || replyTarget.replyChannel || "";
        const topicContext = getSessionTopicContext(key);
        return {
          key,
          sessionId: String(sessionRow?.sessionId || sessionRow?.id || ""),
          updatedAt:
            Number(
              sessionRow?.updatedAt ||
                sessionRow?.lastActivityAt ||
                sessionRow?.lastActiveAt,
            ) || 0,
          agentId,
          agentLabel: getAgentLabelFromSessionKey(key, config),
          channel,
          groupName: topicContext.groupName,
          topicName: topicContext.topicName,
          replyChannel: replyTarget.replyChannel,
          replyTo: replyTarget.replyTo,
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.updatedAt - a.updatedAt);
  };
  const readSystemCronConfig = () => {
    try {
      const raw = fs.readFileSync(kSystemCronConfigPath, "utf8");
      const parsed = JSON.parse(raw);
      const enabled = parsed.enabled !== false;
      const schedule = isValidCronSchedule(parsed.schedule)
        ? parsed.schedule.trim()
        : kDefaultSystemCronSchedule;
      return { enabled, schedule };
    } catch {
      return { enabled: true, schedule: kDefaultSystemCronSchedule };
    }
  };
  const getSystemCronStatus = () => {
    const config = readSystemCronConfig();
    return {
      enabled: config.enabled,
      schedule: config.schedule,
      installed: fs.existsSync(kSystemCronPath),
      scriptExists: fs.existsSync(kSystemCronScriptPath),
    };
  };
  const applySystemCronConfig = (nextConfig) => {
    fs.mkdirSync(`${OPENCLAW_DIR}/cron`, { recursive: true });
    fs.writeFileSync(
      kSystemCronConfigPath,
      JSON.stringify(nextConfig, null, 2),
    );
    if (nextConfig.enabled) {
      fs.writeFileSync(
        kSystemCronPath,
        buildSystemCronContent(nextConfig.schedule),
        {
          mode: 0o644,
        },
      );
    } else {
      fs.rmSync(kSystemCronPath, { force: true });
    }
    return getSystemCronStatus();
  };
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

  const buildStatusPayload = async () => {
    const configExists = fs.existsSync(`${OPENCLAW_DIR}/openclaw.json`);
    const running = await isGatewayRunning();
    const repo = process.env.GITHUB_WORKSPACE_REPO || "";
    const openclawVersion = openclawVersionService.readOpenclawVersion();
    const alphaclawVersion =
      typeof alphaclawVersionService?.readAlphaclawVersion === "function"
        ? alphaclawVersionService.readAlphaclawVersion()
        : null;
    return {
      gateway: running
        ? "running"
        : configExists
          ? "starting"
          : "not_onboarded",
      configExists,
      channels: getChannelStatus(),
      repo,
      openclawVersion,
      alphaclawVersion,
      syncCron: getSystemCronStatus(),
    };
  };

  app.get("/api/status", async (req, res) => {
    const payload = await buildStatusPayload();
    res.json(payload);
  });

  app.get("/api/events/status", async (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders?.();

    const writeStatusEvent = async () => {
      try {
        const status = await buildStatusPayload();
        const watchdogStatus =
          typeof watchdog?.getStatus === "function" ? watchdog.getStatus() : null;
        const doctorStatus =
          typeof doctorService?.buildStatus === "function"
            ? doctorService.buildStatus()
            : null;
        res.write("event: status\n");
        res.write(
          `data: ${JSON.stringify({
            status,
            watchdogStatus,
            doctorStatus,
            timestamp: new Date().toISOString(),
          })}\n\n`,
        );
      } catch {}
    };

    await writeStatusEvent();
    const statusIntervalId = setInterval(writeStatusEvent, 2000);
    const keepAliveIntervalId = setInterval(() => {
      res.write(": keepalive\n\n");
    }, 15000);

    req.on("close", () => {
      clearInterval(statusIntervalId);
      clearInterval(keepAliveIntervalId);
      res.end();
    });
  });

  app.get("/api/sync-cron", (req, res) => {
    res.json({ ok: true, ...getSystemCronStatus() });
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
    const status = applySystemCronConfig(nextConfig);
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

  app.post("/api/restart-status/dismiss", async (req, res) => {
    try {
      envRestartPending = false;
      restartRequiredState.clearRequired();
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
