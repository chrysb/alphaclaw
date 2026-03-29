const { spawn } = require("child_process");

const kStderrTailLines = 50;

let mcpChild = null;
let mcpStartedAt = null;
let mcpStderrTail = [];
let stdoutBuffer = Buffer.alloc(0);
let onMcpMessage = null;

const appendStderrTail = (chunk) => {
  const text = Buffer.isBuffer(chunk)
    ? chunk.toString("utf8")
    : String(chunk ?? "");
  for (const line of text.split("\n")) {
    const trimmed = line.trimEnd();
    if (!trimmed) continue;
    mcpStderrTail.push(trimmed);
  }
  if (mcpStderrTail.length > kStderrTailLines) {
    mcpStderrTail = mcpStderrTail.slice(-kStderrTailLines);
  }
};

const isMcpBridgeRunning = () =>
  mcpChild !== null && mcpChild.exitCode === null && !mcpChild.killed;

const getMcpBridgeStatus = () => ({
  running: isMcpBridgeRunning(),
  pid: isMcpBridgeRunning() ? mcpChild.pid : null,
  startedAt: isMcpBridgeRunning() ? mcpStartedAt : null,
  stderrTail: mcpStderrTail.slice(-10),
});

const setOnMcpMessage = (callback) => {
  onMcpMessage = typeof callback === "function" ? callback : null;
};

const drainStdoutLines = () => {
  while (stdoutBuffer.length > 0) {
    const newlineIndex = stdoutBuffer.indexOf("\n");
    if (newlineIndex === -1) break;

    const line = stdoutBuffer.toString("utf8", 0, newlineIndex).replace(/\r$/, "");
    stdoutBuffer = stdoutBuffer.slice(newlineIndex + 1);
    if (!line.trim()) continue;

    let parsed = null;
    try {
      parsed = JSON.parse(line);
    } catch {
      appendStderrTail(`Unparseable MCP stdout line: ${line.slice(0, 120)}`);
      continue;
    }
    console.log(`[mcp-bridge] ← child stdout: method=${parsed?.method || "(response)"} id=${parsed?.id ?? "none"}`);
    if (onMcpMessage) {
      try {
        onMcpMessage(parsed);
      } catch (err) {
        appendStderrTail(`onMcpMessage error: ${err?.message || err}`);
      }
    }
  }
};

const startMcpBridge = ({ gatewayEnv, gatewayWsUrl, gatewayToken }) => {
  if (isMcpBridgeRunning()) {
    return { ok: true, alreadyRunning: true, ...getMcpBridgeStatus() };
  }

  const args = ["mcp", "serve"];
  if (gatewayWsUrl) {
    args.push("--url", gatewayWsUrl);
  }
  const childEnv = gatewayEnv();
  if (gatewayToken) {
    childEnv.OPENCLAW_GATEWAY_TOKEN = String(gatewayToken);
  }

  mcpStderrTail = [];
  stdoutBuffer = Buffer.alloc(0);

  const child = spawn("openclaw", args, {
    env: childEnv,
    stdio: ["pipe", "pipe", "pipe"],
  });

  mcpChild = child;
  mcpStartedAt = Date.now();

  child.stdout.on("data", (data) => {
    const chunk = Buffer.isBuffer(data)
      ? data
      : Buffer.from(String(data ?? ""), "utf8");
    stdoutBuffer = Buffer.concat([stdoutBuffer, chunk]);
    drainStdoutLines();
  });

  child.stderr.on("data", (data) => {
    appendStderrTail(data);
    process.stderr.write(`[mcp-bridge] ${data}`);
  });

  child.on("exit", (code, signal) => {
    console.log(
      `[mcp-bridge] Process exited with code ${code}${signal ? ` signal ${signal}` : ""}`,
    );
    if (mcpChild === child) mcpChild = null;
    mcpStartedAt = null;
  });

  child.on("error", (error) => {
    appendStderrTail(error?.message || String(error || "unknown process error"));
    console.error(
      `[mcp-bridge] Process failed to start: ${error?.message || error}`,
    );
  });

  console.log(`[mcp-bridge] Started MCP bridge (pid ${child.pid})`);
  return { ok: true, alreadyRunning: false, ...getMcpBridgeStatus() };
};

const stopMcpBridge = () => {
  if (!isMcpBridgeRunning()) {
    return { ok: true, wasStopped: true };
  }
  const pid = mcpChild.pid;
  mcpChild.kill("SIGTERM");
  mcpChild = null;
  mcpStartedAt = null;
  console.log(`[mcp-bridge] Stopped MCP bridge (pid ${pid})`);
  return { ok: true, wasStopped: false };
};

const writeToMcpBridge = (jsonRpcMessage) => {
  if (!isMcpBridgeRunning()) return false;
  if (jsonRpcMessage == null) return false;
  const payload =
    typeof jsonRpcMessage === "string"
      ? jsonRpcMessage
      : JSON.stringify(jsonRpcMessage);
  if (!payload) return false;
  const method = jsonRpcMessage?.method;
  const id = jsonRpcMessage?.id;
  const payloadBytes = Buffer.byteLength(payload, "utf8");
  console.log(`[mcp-bridge] → child stdin: method=${method || "(response)"} id=${id ?? "none"} bytes=${payloadBytes}`);
  mcpChild.stdin.write(`${payload}\n`);
  return true;
};

module.exports = {
  isMcpBridgeRunning,
  getMcpBridgeStatus,
  startMcpBridge,
  stopMcpBridge,
  writeToMcpBridge,
  setOnMcpMessage,
};
