const { spawn } = require("child_process");

const kStderrTailLines = 50;

let mcpChild = null;
let mcpStartedAt = null;
let mcpStderrTail = [];
let sseClient = null;
let stdoutBuffer = "";

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

const startMcpBridge = ({ gatewayEnv, gatewayPort, gatewayToken }) => {
  if (isMcpBridgeRunning()) {
    return { ok: true, alreadyRunning: true, ...getMcpBridgeStatus() };
  }

  const args = ["mcp", "serve"];
  if (gatewayPort) {
    args.push("--url", `wss://127.0.0.1:${gatewayPort}`);
  }
  if (gatewayToken) {
    args.push("--token", gatewayToken);
  }

  mcpStderrTail = [];
  stdoutBuffer = "";

  const child = spawn("openclaw", args, {
    env: gatewayEnv(),
    stdio: ["pipe", "pipe", "pipe"],
  });

  mcpChild = child;
  mcpStartedAt = Date.now();

  child.stdout.on("data", (data) => {
    const text = Buffer.isBuffer(data) ? data.toString("utf8") : String(data ?? "");
    stdoutBuffer += text;

    // MCP JSON-RPC messages are newline-delimited
    let newlineIdx;
    while ((newlineIdx = stdoutBuffer.indexOf("\n")) !== -1) {
      const line = stdoutBuffer.slice(0, newlineIdx).trim();
      stdoutBuffer = stdoutBuffer.slice(newlineIdx + 1);
      if (!line) continue;
      if (sseClient) {
        try {
          sseClient.write(`event: message\ndata: ${line}\n\n`);
        } catch {}
      }
    }
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
    if (sseClient) {
      try {
        sseClient.write(`event: error\ndata: ${JSON.stringify({ error: "MCP bridge process exited" })}\n\n`);
        sseClient.end();
      } catch {}
      sseClient = null;
    }
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
  if (sseClient) {
    try {
      sseClient.end();
    } catch {}
    sseClient = null;
  }
  console.log(`[mcp-bridge] Stopped MCP bridge (pid ${pid})`);
  return { ok: true, wasStopped: false };
};

const attachSseClient = (res) => {
  if (sseClient) {
    try {
      sseClient.end();
    } catch {}
  }
  sseClient = res;
};

const detachSseClient = (res) => {
  if (sseClient === res) {
    sseClient = null;
  }
};

const writeToMcpBridge = (jsonRpcMessage) => {
  if (!isMcpBridgeRunning()) {
    return false;
  }
  const payload =
    typeof jsonRpcMessage === "string"
      ? jsonRpcMessage
      : JSON.stringify(jsonRpcMessage);
  mcpChild.stdin.write(payload + "\n");
  return true;
};

module.exports = {
  isMcpBridgeRunning,
  getMcpBridgeStatus,
  startMcpBridge,
  stopMcpBridge,
  attachSseClient,
  detachSseClient,
  writeToMcpBridge,
};
