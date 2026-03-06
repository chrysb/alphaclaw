const { kDoctorCardStatus, kDoctorDefaultRunsLimit } = require("../doctor/constants");

const registerDoctorRoutes = ({ app, requireAuth, doctorService }) => {
  app.get("/api/doctor/status", requireAuth, (req, res) => {
    try {
      res.json({ ok: true, status: doctorService.buildStatus() });
    } catch (error) {
      res.status(500).json({ ok: false, error: error.message });
    }
  });

  app.post("/api/doctor/run", requireAuth, (req, res) => {
    try {
      const result = doctorService.runDoctor();
      if (!result.ok && result.alreadyRunning) {
        return res.status(409).json(result);
      }
      return res.status(result.reusedPreviousRun ? 200 : 202).json(result);
    } catch (error) {
      return res.status(500).json({ ok: false, error: error.message });
    }
  });

  app.post("/api/doctor/import", requireAuth, (req, res) => {
    try {
      const result = doctorService.importDoctorResult({
        rawOutput: req.body?.rawOutput,
      });
      return res.status(201).json(result);
    } catch (error) {
      return res.status(400).json({ ok: false, error: error.message });
    }
  });

  app.get("/api/doctor/runs", requireAuth, (req, res) => {
    try {
      const limit = Number.parseInt(String(req.query.limit || kDoctorDefaultRunsLimit), 10);
      const runs = doctorService.listDoctorRuns({ limit });
      res.json({ ok: true, runs });
    } catch (error) {
      res.status(500).json({ ok: false, error: error.message });
    }
  });

  app.get("/api/doctor/cards", requireAuth, (req, res) => {
    try {
      const runId = String(req.query.runId || "").trim();
      const cards = doctorService.listDoctorCards({
        runId: runId || "all",
      });
      return res.json({ ok: true, cards });
    } catch (error) {
      return res.status(500).json({ ok: false, error: error.message });
    }
  });

  app.get("/api/doctor/runs/:id", requireAuth, (req, res) => {
    try {
      const run = doctorService.getDoctorRun(req.params.id);
      if (!run) {
        return res.status(404).json({ ok: false, error: "Doctor run not found" });
      }
      return res.json({ ok: true, run });
    } catch (error) {
      return res.status(500).json({ ok: false, error: error.message });
    }
  });

  app.get("/api/doctor/runs/:id/cards", requireAuth, (req, res) => {
    try {
      const run = doctorService.getDoctorRun(req.params.id);
      if (!run) {
        return res.status(404).json({ ok: false, error: "Doctor run not found" });
      }
      const cards = doctorService.getDoctorCardsByRunId(req.params.id);
      return res.json({ ok: true, cards });
    } catch (error) {
      return res.status(500).json({ ok: false, error: error.message });
    }
  });

  app.post("/api/doctor/cards/:id/status", requireAuth, (req, res) => {
    try {
      const requestedStatus = String(req.body?.status || "").trim().toLowerCase();
      if (
        requestedStatus !== kDoctorCardStatus.open &&
        requestedStatus !== kDoctorCardStatus.dismissed &&
        requestedStatus !== kDoctorCardStatus.fixed
      ) {
        return res.status(400).json({ ok: false, error: "Invalid Doctor card status" });
      }
      const card = doctorService.setCardStatus({
        cardId: req.params.id,
        status: requestedStatus,
      });
      return res.json({ ok: true, card });
    } catch (error) {
      if (/not found/i.test(error.message || "")) {
        return res.status(404).json({ ok: false, error: error.message });
      }
      return res.status(400).json({ ok: false, error: error.message });
    }
  });

  app.post("/api/doctor/findings/:id/fix", requireAuth, async (req, res) => {
    try {
      const result = await doctorService.requestCardFix({
        cardId: req.params.id,
        sessionId: req.body?.sessionId,
        replyChannel: req.body?.replyChannel,
        replyTo: req.body?.replyTo,
        prompt: req.body?.prompt,
      });
      return res.json(result);
    } catch (error) {
      if (/not found/i.test(error.message || "")) {
        return res.status(404).json({ ok: false, error: error.message });
      }
      return res.status(400).json({ ok: false, error: error.message });
    }
  });
};

module.exports = { registerDoctorRoutes };
