const { randomUUID } = require("crypto");
const { createRequire } = require("module");

// Load the SDK through openclaw's dependency tree so its express@5 peer
// stays nested and never hoists over AlphaClaw's express@4 at the app root.
const openclawRequire = createRequire(require.resolve("openclaw"));
const {
  StreamableHTTPServerTransport,
} = openclawRequire("@modelcontextprotocol/sdk/server/streamableHttp.js");

const {
  isMcpBridgeRunning,
  getMcpBridgeStatus,
  startMcpBridge,
  stopMcpBridge,
  writeToMcpBridge,
  setOnMcpMessage,
} = require("../mcp-bridge");
const { getGatewayPort } = require("../gateway");
const { readOpenclawConfig } = require("../openclaw-config");

const resolveGatewayWsUrl = ({ openclawDir, gatewayPort }) => {
  const cfg = readOpenclawConfig({ openclawDir, fallback: {} });
  const gatewayTlsEnabled = cfg?.gateway?.tls?.enabled === true;
  const scheme = gatewayTlsEnabled ? "wss" : "ws";
  return `${scheme}://127.0.0.1:${gatewayPort}`;
};

let activeTransport = null;

const closeActiveTransport = async () => {
  if (!activeTransport) return;
  const t = activeTransport;
  activeTransport = null;
  try {
    await t.close();
  } catch {
    /* already closed */
  }
};

const registerMcpRoutes = ({
  app,
  requireAuth,
  constants,
  gatewayEnv,
  openclawDir,
}) => {
  // Wire bridge stdout messages → active transport
  setOnMcpMessage((message) => {
    if (!activeTransport) return;
    activeTransport.send(message).catch((err) => {
      console.error("[mcp] Failed to forward to transport:", err?.message);
    });
  });

  // ── Internal API (session auth) ────────────────────────────────

  app.get("/api/mcp/info", requireAuth, (_req, res) => {
    const port = getGatewayPort();
    const gatewayWsUrl = resolveGatewayWsUrl({
      openclawDir,
      gatewayPort: port,
    });
    res.json({
      ok: true,
      ...getMcpBridgeStatus(),
      gatewayPort: port,
      gatewayWsUrl,
      tokenAvailable: !!constants.GATEWAY_TOKEN,
      gatewayToken: constants.GATEWAY_TOKEN || "",
    });
  });

  app.post("/api/mcp/start", requireAuth, (_req, res) => {
    const port = getGatewayPort();
    const result = startMcpBridge({
      gatewayEnv,
      gatewayWsUrl: resolveGatewayWsUrl({
        openclawDir,
        gatewayPort: port,
      }),
      gatewayToken: constants.GATEWAY_TOKEN,
    });
    res.json(result);
  });

  app.post("/api/mcp/stop", requireAuth, async (_req, res) => {
    await closeActiveTransport();
    const result = stopMcpBridge();
    res.json(result);
  });

  // ── MCP transport endpoint (token auth) ────────────────────────

  const validateMcpToken = (req, res) => {
    const bearerToken = String(req.get("authorization") || "")
      .replace(/^Bearer\s+/i, "")
      .trim();
    const queryToken = String(req.query?.token || "");
    const rawToken = bearerToken || queryToken;
    const normalizedToken = rawToken.replace(/ /g, "+");
    if (!constants.GATEWAY_TOKEN) {
      res
        .status(503)
        .json({ error: "Gateway token is not configured for MCP transport" });
      return false;
    }
    if (!normalizedToken || normalizedToken !== constants.GATEWAY_TOKEN) {
      res.status(401).json({ error: "Invalid or missing token" });
      return false;
    }
    return true;
  };

  // Primary MCP endpoint – Streamable HTTP (GET / POST / DELETE)
  app.all("/mcp/sse", async (req, res) => {
    if (!validateMcpToken(req, res)) return;

    if (!isMcpBridgeRunning()) {
      res.status(503).json({ error: "MCP bridge is not running" });
      return;
    }

    const sessionId = req.headers["mcp-session-id"];

    // ── Existing session ───────────────────────────────────────
    if (sessionId && activeTransport) {
      try {
        await activeTransport.handleRequest(req, res, req.body);
      } catch (err) {
        console.error("[mcp] handleRequest error (existing session):", err?.message);
        if (!res.headersSent) {
          res.status(500).json({ error: "Internal transport error" });
        }
      }
      return;
    }

    // ── Stale / unknown session ────────────────────────────────
    if (sessionId && !activeTransport) {
      res.status(404).json({
        jsonrpc: "2.0",
        error: {
          code: -32000,
          message: "Session not found. The server may have been restarted.",
        },
        id: null,
      });
      return;
    }

    // ── New session (POST without session ID) ────────────────
    // Let the transport validate the body internally — it will reject
    // non-initialize requests and return the proper JSON-RPC error.
    if (!sessionId && req.method === "POST") {
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        enableJsonResponse: true,
      });

      transport.onmessage = (message) => {
        writeToMcpBridge(message);
      };

      transport.onclose = () => {
        if (activeTransport === transport) {
          activeTransport = null;
          console.log("[mcp] Transport closed");
        }
      };

      transport.onerror = (err) => {
        console.error("[mcp] Transport error:", err?.message);
      };

      await transport.start();

      // Set activeTransport BEFORE handleRequest so the onMcpMessage
      // callback can forward the child's response to this transport.
      const prev = activeTransport;
      activeTransport = transport;

      try {
        await transport.handleRequest(req, res, req.body);
      } catch (err) {
        console.error("[mcp] handleRequest error (new session):", err?.message);
        if (!res.headersSent) {
          res.status(500).json({ error: "Failed to initialize MCP session" });
        }
      }

      if (transport.sessionId) {
        if (prev) prev.close().catch(() => {});
        console.log(`[mcp] Session established: ${transport.sessionId}`);
      } else {
        // Session was not established — roll back
        if (activeTransport === transport) activeTransport = prev;
      }
      return;
    }

    res.status(400).json({
      jsonrpc: "2.0",
      error: { code: -32600, message: "Bad Request" },
      id: null,
    });
  });

  // Legacy endpoint for SSE-transport clients that POST to /mcp/message
  app.post("/mcp/message", async (req, res) => {
    if (!validateMcpToken(req, res)) return;
    if (!isMcpBridgeRunning()) {
      res.status(503).json({ error: "MCP bridge is not running" });
      return;
    }
    if (!activeTransport) {
      res.status(503).json({ error: "No active MCP session" });
      return;
    }
    try {
      await activeTransport.handleRequest(req, res, req.body);
    } catch (err) {
      console.error("[mcp] handleRequest error (/mcp/message):", err?.message);
      if (!res.headersSent) {
        res.status(500).json({ error: "Internal transport error" });
      }
    }
  });
};

module.exports = { registerMcpRoutes };
