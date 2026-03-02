const { getSystemResources } = require("../system-resources");

const registerWatchdogRoutes = ({
  app,
  requireAuth,
  watchdog,
  getRecentEvents,
  readLogTail,
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
      res.json({ ok: true, resources: getSystemResources() });
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
};

module.exports = { registerWatchdogRoutes };
