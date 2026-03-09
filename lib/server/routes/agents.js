const parseKeepWorkspace = (value) => {
  if (value === undefined || value === null) return true;
  const normalized = String(value).trim().toLowerCase();
  if (!normalized) return true;
  return !["0", "false", "no", "off"].includes(normalized);
};

const registerAgentRoutes = ({ app, agentsService }) => {
  app.get("/api/agents", (_req, res) => {
    try {
      res.json({ ok: true, agents: agentsService.listAgents() });
    } catch (error) {
      res.status(500).json({ ok: false, error: error.message });
    }
  });

  app.get("/api/agents/:id", (req, res) => {
    try {
      const agent = agentsService.getAgent(req.params.id);
      if (!agent) return res.status(404).json({ ok: false, error: "Agent not found" });
      return res.json({ ok: true, agent });
    } catch (error) {
      return res.status(500).json({ ok: false, error: error.message });
    }
  });

  app.post("/api/agents", (req, res) => {
    try {
      const body = req.body || {};
      if (!String(body.id || "").trim()) {
        return res.status(400).json({ ok: false, error: "id is required" });
      }
      const agent = agentsService.createAgent(body);
      return res.status(201).json({ ok: true, agent });
    } catch (error) {
      const status = String(error.message || "").includes("already exists") ? 409 : 400;
      return res.status(status).json({ ok: false, error: error.message });
    }
  });

  app.put("/api/agents/:id", (req, res) => {
    try {
      const agent = agentsService.updateAgent(req.params.id, req.body || {});
      return res.json({ ok: true, agent });
    } catch (error) {
      const status = String(error.message || "").includes("not found") ? 404 : 400;
      return res.status(status).json({ ok: false, error: error.message });
    }
  });

  app.delete("/api/agents/:id", (req, res) => {
    try {
      const keepWorkspace = parseKeepWorkspace(req.query.keepWorkspace);
      agentsService.deleteAgent(req.params.id, { keepWorkspace });
      return res.json({ ok: true });
    } catch (error) {
      const status = String(error.message || "").includes("not found") ? 404 : 400;
      return res.status(status).json({ ok: false, error: error.message });
    }
  });

  app.post("/api/agents/:id/default", (req, res) => {
    try {
      const agent = agentsService.setDefaultAgent(req.params.id);
      return res.json({ ok: true, agent });
    } catch (error) {
      const status = String(error.message || "").includes("not found") ? 404 : 400;
      return res.status(status).json({ ok: false, error: error.message });
    }
  });
};

module.exports = { registerAgentRoutes };
