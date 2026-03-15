const parseKeepWorkspace = (value) => {
  if (value === undefined || value === null) return true;
  const normalized = String(value).trim().toLowerCase();
  if (!normalized) return true;
  return !["0", "false", "no", "off"].includes(normalized);
};

const registerAgentRoutes = ({
  app,
  agentsService,
  restartRequiredState = null,
  operationEvents = null,
}) => {
  app.get("/api/channels/accounts", (_req, res) => {
    try {
      res.json({
        ok: true,
        channels: agentsService.listConfiguredChannelAccounts(),
      });
    } catch (error) {
      res.status(500).json({ ok: false, error: error.message });
    }
  });

  app.get("/api/channels/accounts/token", (req, res) => {
    try {
      const provider = String(req.query?.provider || "").trim();
      const accountId = String(req.query?.accountId || "").trim() || "default";
      const result = agentsService.getChannelAccountToken({
        provider,
        accountId,
      });
      return res.json({ ok: true, ...result });
    } catch (error) {
      const status = String(error.message || "").includes("not found")
        ? 404
        : 400;
      return res.status(status).json({ ok: false, error: error.message });
    }
  });

  app.post("/api/channels/accounts", async (req, res) => {
    try {
      const body = req.body || {};
      const result = await agentsService.createChannelAccount(body);
      return res.status(201).json({ ok: true, ...result });
    } catch (error) {
      const message = String(error.message || "");
      const status = message.includes("already exists")
        ? 409
        : message.includes("already assigned")
          ? 409
          : message.includes("not found")
            ? 404
            : 400;
      return res.status(status).json({ ok: false, error: error.message });
    }
  });

  app.post("/api/channels/accounts/jobs", (req, res) => {
    if (!operationEvents?.createOperation) {
      return res
        .status(503)
        .json({ ok: false, error: "Operation events unavailable" });
    }
    const body = req.body || {};
    const { operationId } = operationEvents.createOperation({
      type: "channel-account-create",
    });
    (async () => {
      try {
        const result = await agentsService.createChannelAccount(body, {
          onProgress: ({ phase = "", label = "" } = {}) => {
            operationEvents.publish(operationId, {
              event: "phase",
              data: {
                phase: String(phase || "").trim(),
                label: String(label || "").trim(),
              },
            });
          },
        });
        operationEvents.complete(operationId, { ok: true, ...result });
      } catch (error) {
        operationEvents.fail(operationId, error);
      }
    })();
    return res.status(202).json({
      ok: true,
      operationId,
      streamUrl: `/api/operations/${encodeURIComponent(operationId)}/events`,
    });
  });

  app.get("/api/operations/:operationId/events", (req, res) => {
    if (!operationEvents?.subscribe) {
      return res
        .status(503)
        .json({ ok: false, error: "Operation events unavailable" });
    }
    const subscribed = operationEvents.subscribe({
      operationId: req.params.operationId,
      req,
      res,
    });
    if (!subscribed) {
      return res.status(404).json({ ok: false, error: "Operation not found" });
    }
  });

  app.put("/api/channels/accounts", (req, res) => {
    try {
      const result = agentsService.updateChannelAccount(req.body || {});
      const restartRequired = !!result?.tokenUpdated;
      if (restartRequired) {
        restartRequiredState?.markRequired?.("channel_token_updated");
      }
      return res.json({ ok: true, restartRequired, ...result });
    } catch (error) {
      const status = String(error.message || "").includes("not found")
        ? 404
        : 400;
      return res.status(status).json({ ok: false, error: error.message });
    }
  });

  app.delete("/api/channels/accounts", async (req, res) => {
    try {
      const body = req.body || {};
      await agentsService.deleteChannelAccount(body);
      return res.json({ ok: true });
    } catch (error) {
      const status = String(error.message || "").includes("not found")
        ? 404
        : 400;
      return res.status(status).json({ ok: false, error: error.message });
    }
  });

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
      if (!agent)
        return res.status(404).json({ ok: false, error: "Agent not found" });
      return res.json({ ok: true, agent });
    } catch (error) {
      return res.status(500).json({ ok: false, error: error.message });
    }
  });

  app.get("/api/agents/:id/workspace-size", (req, res) => {
    try {
      const workspace = agentsService.getAgentWorkspaceSize(req.params.id);
      return res.json({ ok: true, ...workspace });
    } catch (error) {
      const status = String(error.message || "").includes("not found")
        ? 404
        : 500;
      return res.status(status).json({ ok: false, error: error.message });
    }
  });

  app.get("/api/agents/:id/bindings", (req, res) => {
    try {
      const agent = agentsService.getAgent(req.params.id);
      if (!agent)
        return res.status(404).json({ ok: false, error: "Agent not found" });
      return res.json({
        ok: true,
        bindings: agentsService.getBindingsForAgent(req.params.id),
      });
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
      const status = String(error.message || "").includes("already exists")
        ? 409
        : 400;
      return res.status(status).json({ ok: false, error: error.message });
    }
  });

  app.put("/api/agents/:id", (req, res) => {
    try {
      const agent = agentsService.updateAgent(req.params.id, req.body || {});
      return res.json({ ok: true, agent });
    } catch (error) {
      const status = String(error.message || "").includes("not found")
        ? 404
        : 400;
      return res.status(status).json({ ok: false, error: error.message });
    }
  });

  app.post("/api/agents/:id/bindings", (req, res) => {
    try {
      const binding = agentsService.addBinding(req.params.id, req.body || {});
      return res.status(201).json({ ok: true, binding });
    } catch (error) {
      const message = String(error.message || "");
      const status = message.includes("not found")
        ? 404
        : message.includes("already assigned")
          ? 409
          : 400;
      return res.status(status).json({ ok: false, error: error.message });
    }
  });

  app.delete("/api/agents/:id/bindings", (req, res) => {
    try {
      agentsService.removeBinding(req.params.id, req.body || {});
      return res.json({ ok: true });
    } catch (error) {
      const status = String(error.message || "").includes("not found")
        ? 404
        : 400;
      return res.status(status).json({ ok: false, error: error.message });
    }
  });

  app.delete("/api/agents/:id", (req, res) => {
    try {
      const keepWorkspace = parseKeepWorkspace(req.query.keepWorkspace);
      agentsService.deleteAgent(req.params.id, { keepWorkspace });
      return res.json({ ok: true });
    } catch (error) {
      const status = String(error.message || "").includes("not found")
        ? 404
        : 400;
      return res.status(status).json({ ok: false, error: error.message });
    }
  });

  app.post("/api/agents/:id/default", (req, res) => {
    try {
      const agent = agentsService.setDefaultAgent(req.params.id);
      return res.json({ ok: true, agent });
    } catch (error) {
      const status = String(error.message || "").includes("not found")
        ? 404
        : 400;
      return res.status(status).json({ ok: false, error: error.message });
    }
  });
};

module.exports = { registerAgentRoutes };
