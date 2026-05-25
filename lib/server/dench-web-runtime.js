const net = require("net");
const { execFile } = require("child_process");
const { promisify } = require("util");

const defaultExecFileAsync = promisify(execFile);

const kDefaultStartTimeoutMs = 90 * 1000;
const kDefaultUpdateTimeoutMs = 4 * 60 * 1000;

const isDisabled = (value) =>
  ["0", "false", "off", "disabled"].includes(
    String(value || "").trim().toLowerCase(),
  );

const firstNonEmptyLine = (...values) => {
  for (const value of values) {
    const line = String(value || "")
      .split(/\r?\n/)
      .map((item) => item.trim())
      .find(Boolean);
    if (line) return line;
  }
  return "";
};

const isRuntimeMissingError = (result) =>
  /runtime.*missing|run `?npx denchclaw update`?|standalone web build is missing/i.test(
    [result?.stdout, result?.stderr, result?.error?.message]
      .filter(Boolean)
      .join("\n"),
  );

const createPortProbe = ({ host, port, timeoutMs = 1000 }) =>
  new Promise((resolve) => {
    const socket = net.createConnection({ host, port });
    socket.setTimeout(timeoutMs);
    socket.on("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.on("error", () => resolve(false));
    socket.on("timeout", () => {
      socket.destroy();
      resolve(false);
    });
  });

const createDenchWebRuntime = ({
  clawRuntime,
  gatewayEnv,
  env = process.env,
  logger = console,
  command = "denchclaw",
  host = "127.0.0.1",
  startTimeoutMs = kDefaultStartTimeoutMs,
  updateTimeoutMs = kDefaultUpdateTimeoutMs,
  execFileAsync = defaultExecFileAsync,
  portProbe = createPortProbe,
} = {}) => {
  const webPort = clawRuntime?.denchWebPort || 3100;
  let startPromise = null;

  const isEnabled = () =>
    !!clawRuntime?.isDenchclaw && !isDisabled(env.ALPHACLAW_DENCH_WEB_RUNTIME);

  const getWebUrl = () => `http://${host}:${webPort}`;

  const commandEnv = () => ({
    ...env,
    ...(typeof gatewayEnv === "function" ? gatewayEnv() : {}),
    ...(clawRuntime?.env || {}),
    DENCHCLAW_DAEMONLESS: "1",
  });

  const runDenchCommand = async (args, { timeoutMs }) => {
    try {
      const result = await execFileAsync(command, args, {
        env: commandEnv(),
        timeout: timeoutMs,
        encoding: "utf8",
      });
      return {
        ok: true,
        stdout: result.stdout || "",
        stderr: result.stderr || "",
      };
    } catch (error) {
      return {
        ok: false,
        error,
        stdout: error?.stdout || "",
        stderr: error?.stderr || "",
      };
    }
  };

  const isRunning = () => portProbe({ host, port: webPort });

  const startImpl = async ({ reason = "startup" } = {}) => {
    if (!isEnabled()) {
      return { ok: false, skipped: true, reason: "disabled" };
    }
    if (await isRunning()) {
      logger.log?.(`[alphaclaw] DenchClaw web runtime already running on :${webPort}`);
      return { ok: true, skipped: true, reason: "already_running" };
    }

    const commonArgs = [
      "--web-port",
      String(webPort),
      "--no-open",
      "--skip-daemon-install",
      "--json",
    ];
    logger.log?.(`[alphaclaw] Starting DenchClaw web runtime on :${webPort} (${reason})...`);
    let result = await runDenchCommand(["start", ...commonArgs], {
      timeoutMs: startTimeoutMs,
    });

    if (!result.ok && isRuntimeMissingError(result)) {
      logger.log?.("[alphaclaw] DenchClaw web runtime missing; installing bundled runtime...");
      result = await runDenchCommand(
        ["update", "--non-interactive", "--yes", ...commonArgs],
        { timeoutMs: updateTimeoutMs },
      );
    }

    if (result.ok) {
      logger.log?.(`[alphaclaw] DenchClaw web runtime ready on :${webPort}`);
      return { ok: true, stdout: result.stdout, stderr: result.stderr };
    }

    const detail = firstNonEmptyLine(
      result.stderr,
      result.stdout,
      result.error?.message,
    );
    logger.error?.(
      `[alphaclaw] DenchClaw web runtime start failed: ${detail || "unknown error"}`,
    );
    return {
      ok: false,
      error: detail || "DenchClaw web runtime start failed",
      stdout: result.stdout,
      stderr: result.stderr,
    };
  };

  const start = (options = {}) => {
    if (!startPromise) {
      startPromise = startImpl(options).finally(() => {
        startPromise = null;
      });
    }
    return startPromise;
  };

  return {
    isEnabled,
    isRunning,
    getWebUrl,
    start,
    _runDenchCommand: runDenchCommand,
  };
};

module.exports = {
  createDenchWebRuntime,
};
