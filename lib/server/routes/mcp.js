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

const sessions = new Map();
let activeTransport = null;
const kSessionGraceMs = 15_000;
const kSseKeepAliveMs = 15_000;

const closeSession = (sessionId) => {
  const t = sessions.get(sessionId);
  if (!t) return;
  sessions.delete(sessionId);
  if (activeTransport === t) activeTransport = null;
  t.close().catch(() => {});
};

const closeAllSessions = () => {
  for (const [id] of sessions) closeSession(id);
  activeTransport = null;
};

const retireStaleSessions = (keepId) => {
  const staleIds = [...sessions.keys()].filter((id) => id !== keepId);
  if (staleIds.length === 0) return;
  setTimeout(() => {
    for (const id of staleIds) {
      if (sessions.has(id) && sessions.get(id) !== activeTransport) {
        console.log(`[mcp] Cleaning up stale session: ${id}`);
        closeSession(id);
      }
    }
  }, kSessionGraceMs);
};

const registerMcpRoutes = ({
  app,
  requireAuth,
  constants,
  gatewayEnv,
  openclawDir,
}) => {
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
    closeAllSessions();
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

    if (req.method === "GET") {
      res.setHeader("X-Accel-Buffering", "no");
      const keepAliveId = setInterval(() => {
        if (res.headersSent && !res.writableEnded) {
          res.write(": keepalive\n\n");
        }
      }, kSseKeepAliveMs);
      res.on("close", () => clearInterval(keepAliveId));
    }

    const sessionId = req.headers["mcp-session-id"];

    // ── Existing session ───────────────────────────────────────
    if (sessionId) {
      const transport = sessions.get(sessionId);
      if (transport) {
        console.log(
          `[mcp] ${req.method} sessionId=${sessionId} → routed to transport (sessions=${sessions.size})`,
        );
        try {
          await transport.handleRequest(req, res, req.body);
        } catch (err) {
          console.error(
            "[mcp] handleRequest error (existing session):",
            err?.message,
          );
          if (!res.headersSent) {
            res.status(500).json({ error: "Internal transport error" });
          }
        }
      } else {
        console.log(
          `[mcp] ${req.method} sessionId=${sessionId} → NOT FOUND (known=[${[...sessions.keys()].join(", ")}])`,
        );
        res.status(404).json({
          jsonrpc: "2.0",
          error: {
            code: -32001,
            message: "Session not found. The server may have been restarted.",
          },
          id: null,
        });
      }
      return;
    }

    // ── New session (POST without session ID) ────────────────
    if (req.method === "POST") {
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        enableJsonResponse: true,
        onsessioninitialized: (newSessionId) => {
          sessions.set(newSessionId, transport);
          activeTransport = transport;
          retireStaleSessions(newSessionId);
          console.log(
            `[mcp] Session registered: ${newSessionId} (sessions=${sessions.size})`,
          );
        },
      });

      transport.onmessage = (message) => {
        writeToMcpBridge(message);
      };

      transport.onclose = () => {
        for (const [id, t] of sessions) {
          if (t === transport) {
            sessions.delete(id);
            break;
          }
        }
        if (activeTransport === transport) activeTransport = null;
        console.log(`[mcp] Transport closed (sessions=${sessions.size})`);
      };

      transport.onerror = (err) => {
        console.error("[mcp] Transport error:", err?.message);
      };

      await transport.start();

      try {
        await transport.handleRequest(req, res, req.body);
      } catch (err) {
        console.error(
          "[mcp] handleRequest error (new session):",
          err?.message,
        );
        if (!res.headersSent) {
          res.status(500).json({ error: "Failed to initialize MCP session" });
        }
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
