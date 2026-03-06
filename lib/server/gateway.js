const { spawn, execSync } = require("child_process");
const fs = require("fs");
const net = require("net");
const {
  OPENCLAW_DIR,
  GATEWAY_HOST,
  GATEWAY_PORT,
  kChannelDefs,
  kRootDir,
} = require("./constants");

let gatewayChild = null;
let gatewayExitHandler = null;
let gatewayLaunchHandler = null;
const kGatewayStderrTailLines = 50;
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

const gatewayEnv = () => ({
  ...process.env,
  OPENCLAW_HOME: kRootDir,
  OPENCLAW_CONFIG_PATH: `${OPENCLAW_DIR}/openclaw.json`,
  XDG_CONFIG_HOME: OPENCLAW_DIR,
});

const isOnboarded = () => {
  const configPath = `${OPENCLAW_DIR}/openclaw.json`;
  if (!fs.existsSync(configPath)) return false;
  try {
    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    const primaryModel = String(
      config?.agents?.defaults?.model?.primary || "",
    ).trim();
    return primaryModel.includes("/");
  } catch {
    return false;
  }
};

const isGatewayRunning = () =>
  new Promise((resolve) => {
    const sock = net.createConnection(GATEWAY_PORT, GATEWAY_HOST);
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
  console.log(`[alphaclaw] Running: openclaw gateway ${cmd}`);
  try {
    const out = execSync(`openclaw gateway ${cmd}`, {
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
  gatewayStderrTail = [];
  const child = spawn("openclaw", ["gateway", "run"], {
    env: gatewayEnv(),
    stdio: ["pipe", "pipe", "pipe"],
  });
  gatewayChild = child;
  if (gatewayLaunchHandler) {
    try {
      gatewayLaunchHandler({
        pid: child.pid,
        startedAt: Date.now(),
      });
    } catch (err) {
      console.error(`[alphaclaw] Gateway launch handler error: ${err.message}`);
    }
  }
  child.stdout.on("data", (d) => process.stdout.write(`[gateway] ${d}`));
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
  console.log("[alphaclaw] Starting openclaw gateway...");
  launchGatewayProcess();
};

const restartGateway = (reloadEnv) => {
  reloadEnv();
  markManagedGatewayExitExpected();
  runGatewayCmd("--force");
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
          execSync(`openclaw channels add --channel ${ch} --token "${token}"`, {
            env,
            timeout: 15000,
            encoding: "utf8",
          });
          const raw = fs.readFileSync(configPath, "utf8");
          if (raw.includes(token)) {
            fs.writeFileSync(
              configPath,
              raw.split(token).join("${" + def.envKey + "}"),
            );
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
          execSync(`openclaw channels remove --channel ${ch} --delete`, {
            env,
            timeout: 15000,
            encoding: "utf8",
          });
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

    for (const ch of ["telegram", "discord"]) {
      if (!config.channels?.[ch]?.enabled) continue;
      if (!process.env[kChannelDefs[ch].envKey]) continue;

      let paired = 0;
      try {
        const files = fs
          .readdirSync(credDir)
          .filter(
            (f) => f.startsWith(`${ch}-`) && f.endsWith("-allowFrom.json"),
          );
        for (const file of files) {
          const data = JSON.parse(
            fs.readFileSync(`${credDir}/${file}`, "utf8"),
          );
          paired += (data.allowFrom || []).length;
        }
      } catch {}
      const inlineAllowFrom = config.channels[ch]?.allowFrom;
      if (Array.isArray(inlineAllowFrom)) paired += inlineAllowFrom.length;

      channels[ch] = { status: paired > 0 ? "paired" : "configured", paired };
    }

    return channels;
  } catch {
    return {};
  }
};

module.exports = {
  gatewayEnv,
  isOnboarded,
  isGatewayRunning,
  launchGatewayProcess,
  setGatewayExitHandler,
  setGatewayLaunchHandler,
  runGatewayCmd,
  startGateway,
  restartGateway,
  attachGatewaySignalHandlers,
  ensureGatewayProxyConfig,
  syncChannelConfig,
  getChannelStatus,
};
