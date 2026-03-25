const { parsePositiveInt } = require("../utils/number");

const registerCronRoutes = ({
  app,
  requireAuth,
  cronService,
}) => {
  app.get("/api/cron/jobs", requireAuth, (req, res) => {
    try {
      const sortBy = String(req.query.sortBy || "nextRunAtMs").trim();
      const sortDir = String(req.query.sortDir || "asc").trim();
      const result = cronService.listJobs({ sortBy, sortDir });
      res.json({
        ok: true,
        storePath: result.storePath,
        jobs: result.jobs,
      });
    } catch (error) {
      res.status(500).json({ ok: false, error: error.message });
    }
  });

  app.get("/api/cron/status", requireAuth, (req, res) => {
    try {
      const status = cronService.getStatus();
      res.json({ ok: true, status });
    } catch (error) {
      res.status(500).json({ ok: false, error: error.message });
    }
  });

  app.get("/api/cron/jobs/:id/runs", requireAuth, (req, res) => {
    try {
      const runs = cronService.getJobRuns({
        jobId: req.params.id,
        limit: parsePositiveInt(req.query.limit, 20),
        offset: Math.max(0, Number.parseInt(String(req.query.offset || "0"), 10) || 0),
        status: String(req.query.status || "all"),
        deliveryStatus: String(req.query.deliveryStatus || "all"),
        sortDir: String(req.query.sortDir || "desc"),
        query: String(req.query.query || ""),
      });
      res.json({
        ok: true,
        runs: {
          entries: runs.entries,
          total: runs.total,
          offset: runs.offset,
          limit: runs.limit,
          hasMore: runs.hasMore,
          nextOffset: runs.nextOffset,
        },
      });
    } catch (error) {
      res.status(400).json({ ok: false, error: error.message });
    }
  });

  app.post("/api/cron/jobs/:id/run", requireAuth, async (req, res) => {
    try {
      const result = await cronService.runJobNow(req.params.id);
      res.json({ ok: true, result: result.parsed || result.raw || {} });
    } catch (error) {
      res.status(400).json({ ok: false, error: error.message });
    }
  });

  app.post("/api/cron/jobs/:id/enable", requireAuth, async (req, res) => {
    try {
      const result = await cronService.setJobEnabled({
        jobId: req.params.id,
        enabled: true,
      });
      res.json({ ok: true, result: result.parsed || result.raw || {} });
    } catch (error) {
      res.status(400).json({ ok: false, error: error.message });
    }
  });

  app.post("/api/cron/jobs/:id/disable", requireAuth, async (req, res) => {
    try {
      const result = await cronService.setJobEnabled({
        jobId: req.params.id,
        enabled: false,
      });
      res.json({ ok: true, result: result.parsed || result.raw || {} });
    } catch (error) {
      res.status(400).json({ ok: false, error: error.message });
    }
  });

  app.put("/api/cron/jobs/:id/prompt", requireAuth, async (req, res) => {
    try {
      const message = String(req.body?.message || "");
      const result = await cronService.updateJobPrompt({
        jobId: req.params.id,
        message,
      });
      res.json({ ok: true, result: result.parsed || result.raw || {} });
    } catch (error) {
      res.status(400).json({ ok: false, error: error.message });
    }
  });

  app.put("/api/cron/jobs/:id/routing", requireAuth, async (req, res) => {
    try {
      const sessionTarget = String(req.body?.sessionTarget || "").trim();
      const wakeMode = String(req.body?.wakeMode || "").trim();
      const deliveryMode = String(req.body?.deliveryMode || "").trim();
      const deliveryChannel = String(req.body?.deliveryChannel || "").trim();
      const deliveryTo = String(req.body?.deliveryTo || "").trim();
      const result = await cronService.updateJobRouting({
        jobId: req.params.id,
        sessionTarget,
        wakeMode,
        deliveryMode,
        deliveryChannel,
        deliveryTo,
      });
      res.json({ ok: true, result: result.parsed || result.raw || {} });
    } catch (error) {
      res.status(400).json({ ok: false, error: error.message });
    }
  });

  app.get("/api/cron/jobs/:id/usage", requireAuth, (req, res) => {
    try {
      const days = parsePositiveInt(req.query.days, 0);
      const sinceMs = days > 0 ? Date.now() - days * 24 * 60 * 60 * 1000 : 0;
      const usage = cronService.getJobUsage({
        jobId: req.params.id,
        sinceMs,
      });
      res.json({ ok: true, usage });
    } catch (error) {
      res.status(400).json({ ok: false, error: error.message });
    }
  });
  app.get("/api/cron/jobs/:id/trends", requireAuth, (req, res) => {
    try {
      const trends = cronService.getJobRunTrends({
        jobId: req.params.id,
        range: String(req.query.range || "7d"),
      });
      res.json({ ok: true, trends });
    } catch (error) {
      res.status(400).json({ ok: false, error: error.message });
    }
  });

  app.get("/api/cron/usage/bulk", requireAuth, (req, res) => {
    try {
      const days = parsePositiveInt(req.query.days, 0);
      const sinceMs = days > 0 ? Date.now() - days * 24 * 60 * 60 * 1000 : 0;
      const usage = cronService.getBulkJobUsage({ sinceMs });
      res.json({ ok: true, usage });
    } catch (error) {
      res.status(400).json({ ok: false, error: error.message });
    }
  });

  app.get("/api/cron/runs/bulk", requireAuth, (req, res) => {
    try {
      const sinceMs = Math.max(0, Number.parseInt(String(req.query.sinceMs || "0"), 10) || 0);
      const limitPerJob = parsePositiveInt(req.query.limitPerJob, 20);
      const runs = cronService.getBulkJobRuns({
        sinceMs,
        limitPerJob,
        status: String(req.query.status || "all"),
        deliveryStatus: String(req.query.deliveryStatus || "all"),
        sortDir: String(req.query.sortDir || "desc"),
      });
      res.json({ ok: true, runs });
    } catch (error) {
      res.status(400).json({ ok: false, error: error.message });
    }
  });
};

module.exports = { registerCronRoutes };
