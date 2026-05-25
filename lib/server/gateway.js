const path = require("path");
const { spawn, execSync } = require("child_process");
const fs = require("fs");
const net = require("net");
const {
  ALPHACLAW_DIR,
  OPENCLAW_DIR,
  GATEWAY_HOST,
  kDefaultGatewayPort,
  kChannelDefs,
  kOnboardingMarkerPath,
  kRootDir,
  kClawRuntime,
} = require("./constants");
const { withOpenclawStartupEnv } = require("./openclaw-runtime-env");

let gatewayChild = null;
let gatewayExitHandler = null;
let gatewayLaunchHandler = null;
const kGatewayStderrTailLines = 50;
const kPluginRuntimeDepsPreflightTimeoutMs = 120 * 1000;
let gatewayStderrTail = [];
const expectedExitPids = new Set();

const appendStderrTail = (chunk) => {
  const text = Buffer.isBuffer(chunk)
    ? chunk.toString("utf8")
    : String(chunk ?? "");
  for (const line of text.split("\n")) {
    const trimmed = line.trimEnd();
    if (!trimmed) continue;
    gatewayStderrTail.push(trimmed);
  }
  if (gatewayStderrTail.length > kGatewayStderrTailLines) {
    gatewayStderrTail = gatewayStderrTail.slice(-kGatewayStderrTailLines);
  }
};

const setGatewayExitHandler = (handler) => {
  gatewayExitHandler = typeof handler === "function" ? handler : null;
};

const setGatewayLaunchHandler = (handler) => {
  gatewayLaunchHandler = typeof handler === "function" ? handler : null;
};

const gatewayEnv = () =>
  withOpenclawStartupEnv({
    ...process.env,
    HOME: kRootDir,
    OPENCLAW_HOME: kRootDir,
    ...kClawRuntime.env,
    XDG_CONFIG_HOME: OPENCLAW_DIR,
  });

const resolveOpenclawExtensionsDir = () => {
  try {
    const entryPath = require.resolve("openclaw");
    const entryDir = path.dirname(entryPath);
    const distDir =
      path.basename(entryDir) === "dist" ? entryDir : path.join(entryDir, "dist");
    return path.join(distDir, "extensions");
  } catch {
    return "";
  }
};

const isOpenclawInstallStageDir = (name) =>
  name === ".openclaw-install-stage" ||
  String(name || "").startsWith(".openclaw-install-stage-");

const cleanupOpenclawPluginInstallStages = ({
  extensionsDir = resolveOpenclawExtensionsDir(),
} = {}) => {
  if (!extensionsDir) return 0;
  let removed = 0;
  try {
    for (const entry of fs.readdirSync(extensionsDir, { withFileTypes: true })) {
      if (!entry?.isDirectory?.()) continue;
      const pluginDir = path.join(extensionsDir, entry.name);
      for (const child of fs.readdirSync(pluginDir, { withFileTypes: true })) {
        if (!child?.isDirectory?.() || !isOpenclawInstallStageDir(child.name)) {
          continue;
        }
        const stageDir = path.join(pluginDir, child.name);
        fs.rmSync(stageDir, {
          recursive: true,
          force: true,
          maxRetries: 3,
          retryDelay: 100,
        });
        removed += 1;
        console.log(`[alphaclaw] Removed stale OpenClaw plugin install stage: ${stageDir}`);
      }
    }
  } catch (err) {
    console.warn(
      `[alphaclaw] Could not clean OpenClaw plugin install stages: ${err.message}`,
    );
  }
  return removed;
};

const hasEnabledChannelConfig = () => {
  try {
    const configPath = `${OPENCLAW_DIR}/openclaw.json`;
    if (!fs.existsSync(configPath)) return false;
    const cfg = JSON.parse(fs.readFileSync(configPath, "utf8"));
    const channels = cfg?.channels && typeof cfg.channels === "object" ? cfg.channels : {};
    return Object.keys(kChannelDefs).some((channel) => channels?.[channel]?.enabled === true);
  } catch {
    return false;
  }
};

const isInstallStageFailure = (err) =>
  /ENOTEMPTY|openclaw-install-stage/i.test(
    [
      err?.message,
      err?.stdout?.toString?.(),
      err?.stderr?.toString?.(),
    ]
      .filter(Boolean)
      .join("\n"),
  );

const runPluginRuntimeDepsPreflight = () =>
  execSync(kClawRuntime.buildCommand("plugins list --json"), {
    env: gatewayEnv(),
    timeout: kPluginRuntimeDepsPreflightTimeoutMs,
    encoding: "utf8",
  });

const prepareOpenclawChannelPlugins = () => {
  if (!hasEnabledChannelConfig()) return;
  cleanupOpenclawPluginInstallStages();
  try {
    runPluginRuntimeDepsPreflight();
  } catch (err) {
    if (!isInstallStageFailure(err)) {
      console.warn(
        `[alphaclaw] OpenClaw plugin preflight failed: ${(err.stderr || err.message || "").toString().trim().slice(0, 300)}`,
      );
      return;
    }
    cleanupOpenclawPluginInstallStages();
    try {
      runPluginRuntimeDepsPreflight();
      console.log("[alphaclaw] OpenClaw plugin preflight recovered after cleaning install stage");
    } catch (retryErr) {
      console.warn(
        `[alphaclaw] OpenClaw plugin preflight retry failed: ${(retryErr.stderr || retryErr.message || "").toString().trim().slice(0, 300)}`,
      );
    }
  }
};

const writeOnboardingMarker = (reason) => {
  fs.mkdirSync(ALPHACLAW_DIR, { recursive: true });
  fs.writeFileSync(
    kOnboardingMarkerPath,
    JSON.stringify(
      {
        onboarded: true,
        reason,
        markedAt: new Date().toISOString(),
      },
      null,
      2,
    ),
  );
};

// Legacy backfill: older deployments may only have the control-ui skill as
// proof of onboarding (before the dedicated marker file existed).
const kLegacyControlUiSkillPath = path.join(OPENCLAW_DIR, "skills", "control-ui", "SKILL.md");

const isOnboarded = () => {
  if (fs.existsSync(kOnboardingMarkerPath)) return true;
  if (fs.existsSync(kLegacyControlUiSkillPath)) {
    writeOnboardingMarker("legacy_artifact_backfill");
    return true;
  }
  return false;
};

const getGatewayPort = () => {
  try {
    const configPath = `${OPENCLAW_DIR}/openclaw.json`;
    if (!fs.existsSync(configPath)) return kDefaultGatewayPort;
    const cfg = JSON.parse(fs.readFileSync(configPath, "utf8"));
    const parsedPort = Number.parseInt(String(cfg?.gateway?.port || ""), 10);
    return parsedPort > 0 ? parsedPort : kDefaultGatewayPort;
  } catch {
    return kDefaultGatewayPort;
  }
};

const getGatewayUrl = () => `http://${GATEWAY_HOST}:${getGatewayPort()}`;

const normalizeChannelAccountId = (value) => String(value || "").trim() || "default";

const resolveCredentialPairingAccountId = ({ channel, fileName }) => {
  const prefix = `${String(channel || "").trim()}-`;
  const suffix = "-allowFrom.json";
  if (!String(fileName || "").startsWith(prefix) || !String(fileName || "").endsWith(suffix)) {
    return "";
  }
  const rawAccountId = String(fileName || "").slice(prefix.length, -suffix.length);
  return normalizeChannelAccountId(rawAccountId);
};

const isGatewayRunning = () =>
  new Promise((resolve) => {
    const sock = net.createConnection(getGatewayPort(), GATEWAY_HOST);
    sock.setTimeout(1000);
    sock.on("connect", () => {
      sock.destroy();
      resolve(true);
    });
    sock.on("error", () => resolve(false));
    sock.on("timeout", () => {
      sock.destroy();
      resolve(false);
    });
  });

const runGatewayCmd = (cmd) => {
  console.log(`[alphaclaw] Running: ${kClawRuntime.buildCommand(`gateway ${cmd}`)}`);
  try {
    if (cmd === "--force" || cmd === "restart") {
      prepareOpenclawChannelPlugins();
    }
    const out = execSync(kClawRuntime.buildCommand(`gateway ${cmd}`), {
      env: gatewayEnv(),
      timeout: 15000,
      encoding: "utf8",
    });
    if (out.trim()) console.log(`[alphaclaw] ${out.trim()}`);
  } catch (e) {
    if (e.stdout?.trim())
      console.log(`[alphaclaw] gateway ${cmd} stdout: ${e.stdout.trim()}`);
    if (e.stderr?.trim())
      console.log(`[alphaclaw] gateway ${cmd} stderr: ${e.stderr.trim()}`);
    if (!e.stdout?.trim() && !e.stderr?.trim())
      console.log(`[alphaclaw] gateway ${cmd} error: ${e.message}`);
    console.log(`[alphaclaw] gateway ${cmd} exit code: ${e.status}`);
  }
};

const launchGatewayProcess = () => {
  if (gatewayChild && gatewayChild.exitCode === null && !gatewayChild.killed) {
    console.log(
      "[alphaclaw] Managed gateway process already running — skipping launch",
    );
    return gatewayChild;
  }
  prepareOpenclawChannelPlugins();
  gatewayStderrTail = [];
  const child = spawn(kClawRuntime.command, kClawRuntime.buildArgs(["gateway", "run"]), {
    env: gatewayEnv(),
    stdio: ["pipe", "pipe", "pipe"],
  });
  gatewayChild = child;
  let didSignalGatewayReady = false;
  child.stdout.on("data", (d) => {
    const text = Buffer.isBuffer(d) ? d.toString("utf8") : String(d ?? "");
    if (
      !didSignalGatewayReady &&
      gatewayLaunchHandler &&
      text.toLowerCase().includes("listening on")
    ) {
      didSignalGatewayReady = true;
      try {
        gatewayLaunchHandler({
          pid: child.pid,
          startedAt: Date.now(),
        });
      } catch (err) {
        console.error(`[alphaclaw] Gateway launch handler error: ${err.message}`);
      }
    }
    process.stdout.write(`[gateway] ${d}`);
  });
  child.stderr.on("data", (d) => {
    appendStderrTail(d);
    process.stderr.write(`[gateway] ${d}`);
  });
  child.on("exit", (code, signal) => {
    const expectedExit = expectedExitPids.has(child.pid);
    expectedExitPids.delete(child.pid);
    console.log(
      `[alphaclaw] Gateway launcher exited with code ${code}${signal ? ` signal ${signal}` : ""}`,
    );
    if (gatewayExitHandler) {
      try {
        gatewayExitHandler({
          code,
          signal,
          expectedExit,
          stderrTail: gatewayStderrTail.slice(-kGatewayStderrTailLines),
        });
      } catch (err) {
        console.error(`[alphaclaw] Gateway exit handler error: ${err.message}`);
      }
    }
    if (gatewayChild === child) gatewayChild = null;
  });
  return child;
};

const markManagedGatewayExitExpected = () => {
  if (
    !gatewayChild ||
    gatewayChild.exitCode !== null ||
    gatewayChild.killed ||
    !gatewayChild.pid
  ) {
    return false;
  }
  expectedExitPids.add(gatewayChild.pid);
  return true;
};

const startGateway = async () => {
  if (!isOnboarded()) {
    console.log("[alphaclaw] Not onboarded yet — skipping gateway start");
    return;
  }
  if (await isGatewayRunning()) {
    console.log("[alphaclaw] Gateway already running — skipping start");
    return;
  }
  console.log(`[alphaclaw] Starting ${kClawRuntime.label} gateway...`);
  launchGatewayProcess();
};

const restartGateway = (reloadEnv) => {
  reloadEnv();
  markManagedGatewayExitExpected();
  runGatewayCmd("--force");
};

const restartGatewayLight = (reloadEnv) => {
  reloadEnv();
  markManagedGatewayExitExpected();
  runGatewayCmd("restart");
};

const attachGatewaySignalHandlers = () => {
  process.on("SIGTERM", () => {
    runGatewayCmd("stop");
    process.exit(0);
  });
  process.on("SIGINT", () => {
    runGatewayCmd("stop");
    process.exit(0);
  });
};

const ensureGatewayProxyConfig = (origin) => {
  if (!isOnboarded()) return false;
  try {
    const configPath = `${OPENCLAW_DIR}/openclaw.json`;
    const cfg = JSON.parse(fs.readFileSync(configPath, "utf8"));
    if (!cfg.gateway) cfg.gateway = {};
    let changed = false;

    if (!Array.isArray(cfg.gateway.trustedProxies)) {
      cfg.gateway.trustedProxies = [];
    }
    if (!cfg.gateway.trustedProxies.includes("127.0.0.1")) {
      cfg.gateway.trustedProxies.push("127.0.0.1");
      console.log("[alphaclaw] Added 127.0.0.1 to gateway.trustedProxies");
      changed = true;
    }

    if (origin) {
      if (!cfg.gateway.controlUi) cfg.gateway.controlUi = {};
      if (!Array.isArray(cfg.gateway.controlUi.allowedOrigins)) {
        cfg.gateway.controlUi.allowedOrigins = [];
      }
      if (!cfg.gateway.controlUi.allowedOrigins.includes(origin)) {
        cfg.gateway.controlUi.allowedOrigins.push(origin);
        console.log(`[alphaclaw] Added dashboard origin: ${origin}`);
        changed = true;
      }
    }

    if (changed) {
      fs.writeFileSync(configPath, JSON.stringify(cfg, null, 2));
    }
    return changed;
  } catch (e) {
    console.error(`[alphaclaw] ensureGatewayProxyConfig error: ${e.message}`);
    return false;
  }
};

const syncChannelConfig = (savedVars, mode = "all") => {
  try {
    const configPath = `${OPENCLAW_DIR}/openclaw.json`;
    const cfg = JSON.parse(fs.readFileSync(configPath, "utf8"));
    const savedMap = Object.fromEntries(
      savedVars.filter((v) => v.value).map((v) => [v.key, v.value]),
    );
    const env = gatewayEnv();

    for (const [ch, def] of Object.entries(kChannelDefs)) {
      const token = savedMap[def.envKey];
      const isConfigured = cfg.channels?.[ch]?.enabled;

      if (token && !isConfigured && (mode === "add" || mode === "all")) {
        console.log(`[alphaclaw] Adding channel: ${ch}`);
        try {
          if (ch === "slack") {
            const appToken = savedMap[def.extraEnvKeys?.[0]];
            if (!appToken) continue;
            execSync(
              kClawRuntime.buildCommand(
                `channels add --channel slack --bot-token "${token}" --app-token "${appToken}"`,
              ),
              { env, timeout: 15000, encoding: "utf8" },
            );
            let raw = fs.readFileSync(configPath, "utf8");
            if (raw.includes(token)) {
              raw = raw.split(token).join("${" + def.envKey + "}");
            }
            if (raw.includes(appToken)) {
              raw = raw.split(appToken).join("${" + def.extraEnvKeys[0] + "}");
            }
            fs.writeFileSync(configPath, raw);
          } else {
            execSync(
              kClawRuntime.buildCommand(
                `channels add --channel ${ch} --token "${token}"`,
              ),
              {
                env,
                timeout: 15000,
                encoding: "utf8",
              },
            );
            const raw = fs.readFileSync(configPath, "utf8");
            if (raw.includes(token)) {
              fs.writeFileSync(
                configPath,
                raw.split(token).join("${" + def.envKey + "}"),
              );
            }
          }
          console.log(`[alphaclaw] Channel ${ch} added`);
        } catch (e) {
          console.error(
            `[alphaclaw] channels add ${ch}: ${(e.stderr || e.message || "").toString().trim().slice(0, 200)}`,
          );
        }
      } else if (
        !token &&
        isConfigured &&
        (mode === "remove" || mode === "all")
      ) {
        console.log(`[alphaclaw] Removing channel: ${ch}`);
        try {
          execSync(
            kClawRuntime.buildCommand(`channels remove --channel ${ch} --delete`),
            {
              env,
              timeout: 15000,
              encoding: "utf8",
            },
          );
          console.log(`[alphaclaw] Channel ${ch} removed`);
        } catch (e) {
          console.error(
            `[alphaclaw] channels remove ${ch}: ${(e.stderr || e.message || "").toString().trim().slice(0, 200)}`,
          );
        }
      }
    }
  } catch (e) {
    console.error("[alphaclaw] syncChannelConfig error:", e.message);
  }
};

const getChannelStatus = () => {
  try {
    const config = JSON.parse(
      fs.readFileSync(`${OPENCLAW_DIR}/openclaw.json`, "utf8"),
    );
    const credDir = `${OPENCLAW_DIR}/credentials`;
    const channels = {};
    const hasImplicitWhatsAppSelfPairing = ({ accountId, accountConfig }) => {
      if (!accountConfig || typeof accountConfig !== "object") return false;
      if (accountConfig.selfChatMode === false) return false;
      if (String(accountConfig.dmPolicy || "").trim().toLowerCase() === "disabled") {
        return false;
      }
      const candidatePaths = [
        `${credDir}/whatsapp/${accountId}/creds.json`,
        ...(accountId === "default" ? [`${credDir}/creds.json`] : []),
      ];
      const matches = candidatePaths.map((targetPath) => {
        try {
          return {
            path: targetPath,
            exists: !!String(fs.readFileSync(targetPath, "utf8") || "").trim(),
          };
        } catch (error) {
          return {
            path: targetPath,
            exists: false,
            error: String(error?.message || error || "read failed"),
          };
        }
      });
      return matches.some((entry) => entry.exists);
    };

    for (const ch of Object.keys(kChannelDefs)) {
      const channelConfig =
        config.channels?.[ch] && typeof config.channels[ch] === "object"
          ? config.channels[ch]
          : null;
      if (!channelConfig?.enabled) continue;

      const rawAccounts =
        channelConfig.accounts && typeof channelConfig.accounts === "object"
          ? channelConfig.accounts
          : {};
      const accountEntries = Object.keys(rawAccounts).length > 0
        ? Object.entries(rawAccounts)
        : [["default", channelConfig]];
      const configuredAccountIds = new Set(
        accountEntries.map(([accountId]) => normalizeChannelAccountId(accountId)),
      );
      const hasConfiguredToken = accountEntries.some(([accountId, accountConfig]) => {
        const normalizedAccountId = normalizeChannelAccountId(accountId);
        const envKey = normalizedAccountId === "default"
          ? kChannelDefs[ch].envKey
          : `${kChannelDefs[ch].envKey}_${normalizedAccountId.replace(/-/g, "_").toUpperCase()}`;
        return !!process.env[envKey]
          || !!accountConfig?.botToken
          || !!accountConfig?.token;
      });
      if (!hasConfiguredToken) continue;

      const pairedByAccount = new Map(
        Array.from(configuredAccountIds).map((accountId) => [accountId, 0]),
      );
      try {
        if (ch !== "whatsapp") {
          const files = fs
            .readdirSync(credDir)
            .filter(
              (f) => f.startsWith(`${ch}-`) && f.endsWith("-allowFrom.json"),
            );
          for (const file of files) {
            const accountId = resolveCredentialPairingAccountId({
              channel: ch,
              fileName: file,
            });
            if (!accountId || !configuredAccountIds.has(accountId)) continue;
            const data = JSON.parse(
              fs.readFileSync(`${credDir}/${file}`, "utf8"),
            );
            const nextCount =
              Number(pairedByAccount.get(accountId) || 0)
              + (Array.isArray(data.allowFrom) ? data.allowFrom.length : 0);
            pairedByAccount.set(accountId, nextCount);
          }
        }
      } catch {}
      for (const [accountId, accountConfig] of accountEntries) {
        if (ch === "whatsapp") continue;
        const inlineAllowFrom = accountConfig?.allowFrom;
        if (!Array.isArray(inlineAllowFrom)) continue;
        const normalizedAccountId = normalizeChannelAccountId(accountId);
        const nextCount =
          Number(pairedByAccount.get(normalizedAccountId) || 0) + inlineAllowFrom.length;
        pairedByAccount.set(normalizedAccountId, nextCount);
      }
      if (ch === "whatsapp") {
        for (const [accountId, accountConfig] of accountEntries) {
          const normalizedAccountId = normalizeChannelAccountId(accountId);
          if (Number(pairedByAccount.get(normalizedAccountId) || 0) > 0) continue;
          if (
            hasImplicitWhatsAppSelfPairing({
              accountId: normalizedAccountId,
              accountConfig,
            })
          ) {
            pairedByAccount.set(normalizedAccountId, 1);
          }
        }
      }
      const accounts = Object.fromEntries(
        Array.from(pairedByAccount.entries()).map(([accountId, paired]) => [
          accountId,
          { status: paired > 0 ? "paired" : "configured", paired },
        ]),
      );
      const paired = Array.from(pairedByAccount.values()).reduce(
        (total, count) => total + Number(count || 0),
        0,
      );
      channels[ch] = {
        status: paired > 0 ? "paired" : "configured",
        paired,
        accounts,
      };
    }

    return channels;
  } catch {
    return {};
  }
};

module.exports = {
  gatewayEnv,
  getGatewayPort,
  getGatewayUrl,
  isOnboarded,
  isGatewayRunning,
  launchGatewayProcess,
  cleanupOpenclawPluginInstallStages,
  prepareOpenclawChannelPlugins,
  setGatewayExitHandler,
  setGatewayLaunchHandler,
  runGatewayCmd,
  startGateway,
  restartGateway,
  restartGatewayLight,
  attachGatewaySignalHandlers,
  ensureGatewayProxyConfig,
  syncChannelConfig,
  getChannelStatus,
};
