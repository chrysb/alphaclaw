const {
  loadConfig,
  saveConfig,
  cloneJson,
  normalizeBindingMatch,
  matchesBinding,
  appendBindingToConfig,
  withNormalizedAgentsConfig,
} = require("./shared");

const createBindingsDomain = ({ fsImpl, OPENCLAW_DIR }) => {
  const getBindingsForAgent = (agentId) => {
    const normalized = String(agentId || "").trim();
    const cfg = withNormalizedAgentsConfig({
      OPENCLAW_DIR,
      cfg: loadConfig({ fsImpl, OPENCLAW_DIR }),
    });
    const bindings = Array.isArray(cfg.bindings) ? cfg.bindings : [];
    return bindings
      .filter((binding) => String(binding?.agentId || "").trim() === normalized)
      .map((binding) => cloneJson(binding));
  };

  const addBinding = (agentId, input = {}) => {
    const normalizedAgentId = String(agentId || "").trim();
    const cfg = withNormalizedAgentsConfig({
      OPENCLAW_DIR,
      cfg: loadConfig({ fsImpl, OPENCLAW_DIR }),
    });
    const agent = cfg.agents.list.find(
      (entry) => entry.id === normalizedAgentId,
    );
    if (!agent) throw new Error(`Agent "${normalizedAgentId}" not found`);
    const match = normalizeBindingMatch(input);
    const nextBinding = appendBindingToConfig({
      cfg,
      agentId: normalizedAgentId,
      match,
    });
    saveConfig({ fsImpl, OPENCLAW_DIR, config: cfg });
    return nextBinding;
  };

  const removeBinding = (agentId, input = {}) => {
    const normalizedAgentId = String(agentId || "").trim();
    const cfg = withNormalizedAgentsConfig({
      OPENCLAW_DIR,
      cfg: loadConfig({ fsImpl, OPENCLAW_DIR }),
    });
    const bindings = Array.isArray(cfg.bindings) ? cfg.bindings : [];
    const nextMatch = normalizeBindingMatch(input);
    const nextBindings = bindings.filter(
      (binding) =>
        !(
          String(binding?.agentId || "").trim() === normalizedAgentId &&
          matchesBinding(binding?.match || {}, nextMatch)
        ),
    );
    if (nextBindings.length === bindings.length) {
      throw new Error("Binding not found");
    }
    cfg.bindings = nextBindings;
    saveConfig({ fsImpl, OPENCLAW_DIR, config: cfg });
    return { ok: true };
  };

  return {
    getBindingsForAgent,
    addBinding,
    removeBinding,
  };
};

module.exports = { createBindingsDomain };
