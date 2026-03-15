const path = require("path");

const {
  kDefaultAgentId,
  resolveAgentWorkspacePath,
  loadConfig,
  saveConfig,
  cloneJson,
  getSafeStat,
  calculatePathSizeBytes,
  withNormalizedAgentsConfig,
  isValidAgentId,
  resolveRequestedWorkspacePath,
  ensureAgentScaffold,
} = require("./shared");

const createAgentsDomain = ({ fsImpl, OPENCLAW_DIR }) => {
  const listAgents = () => {
    const cfg = withNormalizedAgentsConfig({
      OPENCLAW_DIR,
      cfg: loadConfig({ fsImpl, OPENCLAW_DIR }),
    });
    return (cfg.agents?.list || []).map((entry) => ({
      ...entry,
      id: String(entry.id || "").trim(),
      name: String(entry.name || "").trim() || String(entry.id || "").trim(),
      default: !!entry.default,
    }));
  };

  const getAgent = (agentId) => {
    const normalized = String(agentId || "").trim();
    return listAgents().find((entry) => entry.id === normalized) || null;
  };

  const getAgentWorkspaceSize = (agentId) => {
    const normalized = String(agentId || "").trim();
    const agent = getAgent(normalized);
    if (!agent) throw new Error(`Agent "${normalized}" not found`);
    const workspacePath = String(
      agent.workspace ||
        resolveAgentWorkspacePath({ OPENCLAW_DIR, agentId: normalized }),
    ).trim();
    if (!workspacePath) {
      return { workspacePath: "", exists: false, sizeBytes: 0 };
    }
    const stat = getSafeStat({ fsImpl, targetPath: workspacePath });
    if (!stat) {
      return { workspacePath, exists: false, sizeBytes: 0 };
    }
    return {
      workspacePath,
      exists: true,
      sizeBytes: calculatePathSizeBytes({ fsImpl, targetPath: workspacePath }),
    };
  };

  const createAgent = (input = {}) => {
    const agentId = String(input.id || "").trim();
    if (!isValidAgentId(agentId)) {
      throw new Error(
        "Agent id must be lowercase letters, numbers, and hyphens only",
      );
    }

    const cfg = withNormalizedAgentsConfig({
      OPENCLAW_DIR,
      cfg: loadConfig({ fsImpl, OPENCLAW_DIR }),
    });
    const existing = cfg.agents.list.find((entry) => entry.id === agentId);
    if (existing) {
      throw new Error(`Agent "${agentId}" already exists`);
    }

    const workspacePath = resolveRequestedWorkspacePath({
      OPENCLAW_DIR,
      agentId,
      workspaceFolder: input.workspaceFolder,
    });
    const { workspacePath: scaffoldWorkspacePath, agentDirPath } =
      ensureAgentScaffold({
        fsImpl,
        workspacePath,
        OPENCLAW_DIR,
        agentId,
      });
    const nextAgent = {
      id: agentId,
      name: String(input.name || "").trim() || agentId,
      default: false,
      workspace: scaffoldWorkspacePath,
      agentDir: agentDirPath,
      ...(input.model ? { model: input.model } : {}),
      ...(input.identity && typeof input.identity === "object"
        ? { identity: { ...input.identity } }
        : {}),
    };
    cfg.agents.list = [...cfg.agents.list, nextAgent];
    saveConfig({ fsImpl, OPENCLAW_DIR, config: cfg });
    return nextAgent;
  };

  const updateAgent = (agentId, patch = {}) => {
    const normalized = String(agentId || "").trim();
    const cfg = withNormalizedAgentsConfig({
      OPENCLAW_DIR,
      cfg: loadConfig({ fsImpl, OPENCLAW_DIR }),
    });
    const index = cfg.agents.list.findIndex((entry) => entry.id === normalized);
    if (index < 0) throw new Error(`Agent "${normalized}" not found`);
    const current = cfg.agents.list[index];
    const next = {
      ...current,
      ...(patch.name !== undefined
        ? { name: String(patch.name || "").trim() }
        : {}),
      ...(patch.identity !== undefined
        ? {
            identity:
              patch.identity && typeof patch.identity === "object"
                ? { ...patch.identity }
                : {},
          }
        : {}),
    };
    if (patch.model !== undefined) {
      if (patch.model === null) {
        delete next.model;
      } else {
        next.model = patch.model;
      }
    }
    if (patch.tools !== undefined) {
      if (patch.tools && typeof patch.tools === "object") {
        const toolsCfg = {};
        if (patch.tools.profile) toolsCfg.profile = String(patch.tools.profile);
        if (Array.isArray(patch.tools.alsoAllow) && patch.tools.alsoAllow.length) {
          toolsCfg.alsoAllow = patch.tools.alsoAllow.map(String);
        }
        if (Array.isArray(patch.tools.deny) && patch.tools.deny.length) {
          toolsCfg.deny = patch.tools.deny.map(String);
        }
        next.tools = toolsCfg;
      } else {
        delete next.tools;
      }
    }
    if (!String(next.name || "").trim()) next.name = normalized;
    cfg.agents.list[index] = next;
    saveConfig({ fsImpl, OPENCLAW_DIR, config: cfg });
    return next;
  };

  const setDefaultAgent = (agentId) => {
    const normalized = String(agentId || "").trim();
    const cfg = withNormalizedAgentsConfig({
      OPENCLAW_DIR,
      cfg: loadConfig({ fsImpl, OPENCLAW_DIR }),
    });
    const exists = cfg.agents.list.some((entry) => entry.id === normalized);
    if (!exists) throw new Error(`Agent "${normalized}" not found`);
    cfg.agents.list = cfg.agents.list.map((entry) => ({
      ...entry,
      default: entry.id === normalized,
    }));
    saveConfig({ fsImpl, OPENCLAW_DIR, config: cfg });
    return cfg.agents.list.find((entry) => entry.id === normalized) || null;
  };

  const deleteAgent = (agentId, { keepWorkspace = true } = {}) => {
    const normalized = String(agentId || "").trim();
    if (!normalized || normalized === kDefaultAgentId) {
      throw new Error("The default main agent cannot be deleted");
    }
    const cfg = withNormalizedAgentsConfig({
      OPENCLAW_DIR,
      cfg: loadConfig({ fsImpl, OPENCLAW_DIR }),
    });
    const target = cfg.agents.list.find((entry) => entry.id === normalized);
    if (!target) throw new Error(`Agent "${normalized}" not found`);
    if (target.default) {
      throw new Error("Default agent cannot be deleted");
    }
    cfg.agents.list = cfg.agents.list.filter(
      (entry) => entry.id !== normalized,
    );
    if (Array.isArray(cfg.bindings)) {
      cfg.bindings = cfg.bindings.filter(
        (binding) => String(binding?.agentId || "") !== normalized,
      );
    }
    saveConfig({ fsImpl, OPENCLAW_DIR, config: cfg });

    if (!keepWorkspace) {
      const workspacePath = String(
        target.workspace ||
          resolveAgentWorkspacePath({
            OPENCLAW_DIR,
            agentId: normalized,
          }),
      ).trim();
      const agentDirPath = path.join(OPENCLAW_DIR, "agents", normalized);
      if (workspacePath) {
        fsImpl.rmSync(workspacePath, { recursive: true, force: true });
      }
      fsImpl.rmSync(agentDirPath, { recursive: true, force: true });
    }
    return { ok: true };
  };

  return {
    listAgents,
    getAgent,
    getAgentWorkspaceSize,
    createAgent,
    updateAgent,
    setDefaultAgent,
    deleteAgent,
  };
};

module.exports = { createAgentsDomain };
