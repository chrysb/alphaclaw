const {
  isMcpBridgeRunning,
  getMcpBridgeStatus,
  startMcpBridge,
  stopMcpBridge,
  attachSseClient,
  detachSseClient,
  writeToMcpBridge,
} = require("../mcp-bridge");
const { getGatewayPort } = require("../gateway");

const registerMcpRoutes = ({
  app,
  requireAuth,
  constants,
  gatewayEnv,
}) => {
  // ── Internal API (session auth) ────────────────────────────────

  app.get("/api/mcp/info", requireAuth, (_req, res) => {
    const port = getGatewayPort();
    res.json({
      ok: true,
      ...getMcpBridgeStatus(),
      gatewayPort: port,
      gatewayWsUrl: `ws://127.0.0.1:${port}`,
      tokenAvailable: !!constants.GATEWAY_TOKEN,
      gatewayToken: constants.GATEWAY_TOKEN || "",
    });
  });

  app.post("/api/mcp/start", requireAuth, (_req, res) => {
    const result = startMcpBridge({
      gatewayEnv,
      gatewayPort: getGatewayPort(),
      gatewayToken: constants.GATEWAY_TOKEN,
    });
    res.json(result);
  });

  app.post("/api/mcp/stop", requireAuth, (_req, res) => {
    const result = stopMcpBridge();
    res.json(result);
  });

  // ── MCP transport endpoints (token auth) ───────────────────────

  const validateMcpToken = (req, res) => {
    const token = req.query?.token || "";
    if (!token || token !== constants.GATEWAY_TOKEN) {
      res.status(401).json({ error: "Invalid or missing token" });
      return false;
    }
    return true;
  };

  app.get("/mcp/sse", (req, res) => {
    if (!validateMcpToken(req, res)) return;

    if (!isMcpBridgeRunning()) {
      res.status(503).json({ error: "MCP bridge is not running" });
      return;
    }

    res.status(200);
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders?.();

    // Send the endpoint event per MCP SSE spec
    const messageUrl = `${req.protocol}://${req.get("host")}/mcp/message?token=${encodeURIComponent(req.query.token)}`;
    res.write(`event: endpoint\ndata: ${messageUrl}\n\n`);

    attachSseClient(res);

    req.on("close", () => {
      detachSseClient(res);
    });
  });

  app.post("/mcp/message", (req, res) => {
    if (!validateMcpToken(req, res)) return;

    if (!isMcpBridgeRunning()) {
      res.status(503).json({ error: "MCP bridge is not running" });
      return;
    }

    const wrote = writeToMcpBridge(req.body);
    if (!wrote) {
      res.status(503).json({ error: "Failed to write to MCP bridge" });
      return;
    }
    res.status(202).json({ ok: true });
  });
};

module.exports = { registerMcpRoutes };
