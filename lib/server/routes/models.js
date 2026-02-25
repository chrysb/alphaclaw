const { kFallbackOnboardingModels } = require("../constants");

const registerModelRoutes = ({ app, shellCmd, gatewayEnv, parseJsonFromNoisyOutput, normalizeOnboardingModels }) => {
  app.get("/api/models", async (req, res) => {
    try {
      const output = await shellCmd("openclaw models list --all --json", {
        env: gatewayEnv(),
        timeout: 20000,
      });
      const parsed = parseJsonFromNoisyOutput(output);
      const models = normalizeOnboardingModels(parsed?.models || []);
      if (models.length > 0) {
        return res.json({ ok: true, source: "openclaw", models });
      }
      return res.json({
        ok: true,
        source: "fallback",
        models: kFallbackOnboardingModels,
      });
    } catch (err) {
      console.error("[models] Failed to load dynamic models:", err.message);
      return res.json({
        ok: true,
        source: "fallback",
        models: kFallbackOnboardingModels,
      });
    }
  });

  app.get("/api/models/status", async (req, res) => {
    try {
      const output = await shellCmd("openclaw models status --json", {
        env: gatewayEnv(),
        timeout: 20000,
      });
      const parsed = parseJsonFromNoisyOutput(output) || {};
      res.json({
        ok: true,
        modelKey: parsed.resolvedDefault || parsed.defaultModel || null,
        fallbacks: parsed.fallbacks || [],
        imageModel: parsed.imageModel || null,
      });
    } catch (err) {
      res.json({
        ok: false,
        error: err.message || "Failed to read model status",
      });
    }
  });

  app.post("/api/models/set", async (req, res) => {
    const { modelKey } = req.body || {};
    if (!modelKey || typeof modelKey !== "string" || !modelKey.includes("/")) {
      return res.status(400).json({ ok: false, error: "Missing modelKey" });
    }
    try {
      await shellCmd(`openclaw models set "${modelKey}"`, {
        env: gatewayEnv(),
        timeout: 30000,
      });
      res.json({ ok: true });
    } catch (err) {
      res.status(400).json({ ok: false, error: err.message || "Failed to set model" });
    }
  });
};

module.exports = { registerModelRoutes };
