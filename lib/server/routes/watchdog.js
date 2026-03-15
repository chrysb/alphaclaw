const { getSystemResources } = require("../system-resources");

const registerWatchdogRoutes = ({
  app,
  requireAuth,
  watchdog,
  getRecentEvents,
  readLogTail,
  watchdogTerminal,
}) => {
  app.get("/api/watchdog/status", requireAuth, (req, res) => {
    try {
      const status = watchdog.getStatus();
      res.json({ ok: true, status });
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  app.get("/api/watchdog/events", requireAuth, (req, res) => {
    try {
      const limit = Number.parseInt(String(req.query.limit || "20"), 10) || 20;
      const includeRoutine =
        String(req.query.includeRoutine || "").trim() === "1" ||
        String(req.query.includeRoutine || "").trim().toLowerCase() === "true";
      const events = getRecentEvents({ limit, includeRoutine });
      res.json({ ok: true, events });
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  app.get("/api/watchdog/logs", requireAuth, (req, res) => {
    try {
      const tail = Number.parseInt(String(req.query.tail || "65536"), 10) || 65536;
      const logs = readLogTail(tail);
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.status(200).send(logs);
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  app.post("/api/watchdog/repair", requireAuth, async (req, res) => {
    try {
      const result = await watchdog.triggerRepair();
      res.json({ ok: !!result?.ok, result });
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  app.get("/api/watchdog/settings", requireAuth, (req, res) => {
    try {
      res.json({ ok: true, settings: watchdog.getSettings() });
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  app.get("/api/watchdog/resources", requireAuth, (req, res) => {
    try {
      const status = watchdog.getStatus();
      res.json({ ok: true, resources: getSystemResources({ gatewayPid: status.gatewayPid }) });
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  app.put("/api/watchdog/settings", requireAuth, (req, res) => {
    try {
      const settings = watchdog.updateSettings(req.body || {});
      res.json({ ok: true, settings });
    } catch (err) {
      res.status(400).json({ ok: false, error: err.message });
    }
  });

  app.post("/api/watchdog/terminal/session", requireAuth, (req, res) => {
    try {
      const terminalSession = watchdogTerminal.createOrReuseSession();
      res.json({ ok: true, session: terminalSession });
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  app.get("/api/watchdog/terminal/output", requireAuth, (req, res) => {
    try {
      const sessionId = String(req.query.sessionId || "");
      if (!sessionId) {
        res.status(400).json({ ok: false, error: "Missing sessionId" });
        return;
      }
      const cursor = Number.parseInt(String(req.query.cursor || "0"), 10) || 0;
      const output = watchdogTerminal.readOutput({ sessionId, cursor });
      if (!output.found) {
        res.status(404).json({ ok: false, error: "Terminal session not found" });
        return;
      }
      res.json({ ok: true, ...output });
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  app.post("/api/watchdog/terminal/input", requireAuth, (req, res) => {
    try {
      const sessionId = String(req.body?.sessionId || "");
      const input = String(req.body?.input || "");
      if (!sessionId) {
        res.status(400).json({ ok: false, error: "Missing sessionId" });
        return;
      }
      const result = watchdogTerminal.writeInput({ sessionId, input });
      if (!result.ok) {
        res.status(400).json({ ok: false, error: result.error || "Write failed" });
        return;
      }
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  app.post("/api/watchdog/terminal/close", requireAuth, (req, res) => {
    try {
      const sessionId = String(req.body?.sessionId || "");
      if (!sessionId) {
        res.status(400).json({ ok: false, error: "Missing sessionId" });
        return;
      }
      watchdogTerminal.closeSession({ sessionId });
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });
};

module.exports = { registerWatchdogRoutes };
