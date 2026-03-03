const { buildManagedPaths } = require("../internal-files-migration");

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
  clawCmd,
  restartGateway,
  onExpectedGatewayRestart,
  OPENCLAW_DIR,
  restartRequiredState,
}) => {
  let envRestartPending = false;
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

  app.get("/api/env", (req, res) => {
    const fileVars = readEnvFile();
    const merged = [];

    for (const def of kKnownVars) {
      if (isReservedUserEnvVar(def.key)) continue;
      const fileEntry = fileVars.find((v) => v.key === def.key);
      const value = fileEntry?.value || "";
      merged.push({
        key: def.key,
        value,
        label: def.label,
        group: def.group,
        hint: def.hint,
        source: fileEntry?.value ? "env_file" : "unset",
        editable: true,
      });
    }

    for (const v of fileVars) {
      if (kKnownKeys.has(v.key) || isReservedUserEnvVar(v.key)) continue;
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

    const filtered = vars.filter((v) => !isReservedUserEnvVar(v.key));
    const existingLockedVars = readEnvFile().filter((v) =>
      isReservedUserEnvVar(v.key),
    );
    const nextEnvVars = [...filtered, ...existingLockedVars];
    syncChannelConfig(nextEnvVars, "remove");
    writeEnvFile(nextEnvVars);
    const changed = reloadEnv();
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
    const configExists = fs.existsSync(`${OPENCLAW_DIR}/openclaw.json`);
    const running = await isGatewayRunning();
    const repo = process.env.GITHUB_WORKSPACE_REPO || "";
    const openclawVersion = openclawVersionService.readOpenclawVersion();
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
      syncCron: getSystemCronStatus(),
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
      if (typeof onExpectedGatewayRestart === "function") {
        onExpectedGatewayRestart();
      }
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
