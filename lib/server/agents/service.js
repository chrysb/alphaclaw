const fs = require("fs");
const path = require("path");

const kDefaultAgentId = "main";
const kAgentIdPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const kDefaultWorkspaceBasename = "workspace";
const kWorkspaceFolderPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const kDefaultAgentFiles = ["SOUL.md", "AGENTS.md", "USER.md", "IDENTITY.md"];

const resolveConfigPath = ({ OPENCLAW_DIR }) =>
  path.join(OPENCLAW_DIR, "openclaw.json");

const resolveAgentWorkspacePath = ({ OPENCLAW_DIR, agentId }) =>
  path.join(
    OPENCLAW_DIR,
    agentId === kDefaultAgentId
      ? kDefaultWorkspaceBasename
      : `${kDefaultWorkspaceBasename}-${agentId}`,
  );

const resolveAgentDirPath = ({ OPENCLAW_DIR, agentId }) =>
  path.join(OPENCLAW_DIR, "agents", agentId, "agent");

const parseConfig = ({ fsImpl, configPath }) => {
  try {
    return JSON.parse(fsImpl.readFileSync(configPath, "utf8"));
  } catch {
    return {};
  }
};

const loadConfig = ({ fsImpl, OPENCLAW_DIR }) =>
  parseConfig({
    fsImpl,
    configPath: resolveConfigPath({ OPENCLAW_DIR }),
  });

const saveConfig = ({ fsImpl, OPENCLAW_DIR, config }) => {
  const configPath = resolveConfigPath({ OPENCLAW_DIR });
  fsImpl.mkdirSync(path.dirname(configPath), { recursive: true });
  fsImpl.writeFileSync(configPath, JSON.stringify(config, null, 2));
};

const normalizeAgentsList = ({ list }) =>
  (Array.isArray(list) ? list : [])
    .filter((entry) => entry && typeof entry === "object")
    .map((entry) => ({ ...entry }));

const normalizeAgentDefaults = ({ cfg }) => ({
  model: cfg?.agents?.defaults?.model || {},
});

const getImplicitMainAgent = ({ OPENCLAW_DIR, cfg }) => {
  const defaults = normalizeAgentDefaults({ cfg });
  const defaultPrimaryModel = String(defaults?.model?.primary || "").trim();
  return {
    id: kDefaultAgentId,
    default: true,
    name: "Main Agent",
    workspace: resolveAgentWorkspacePath({ OPENCLAW_DIR, agentId: kDefaultAgentId }),
    agentDir: resolveAgentDirPath({ OPENCLAW_DIR, agentId: kDefaultAgentId }),
    ...(defaultPrimaryModel ? { model: { primary: defaultPrimaryModel } } : {}),
  };
};

const withNormalizedAgentsConfig = ({ OPENCLAW_DIR, cfg }) => {
  const nextCfg = cfg && typeof cfg === "object" ? { ...cfg } : {};
  const existingAgents = nextCfg.agents && typeof nextCfg.agents === "object" ? nextCfg.agents : {};
  const existingList = normalizeAgentsList({ list: existingAgents.list });
  const hasMain = existingList.some((entry) => String(entry.id || "").trim() === kDefaultAgentId);
  const nextList = hasMain
    ? existingList
    : [getImplicitMainAgent({ OPENCLAW_DIR, cfg: nextCfg }), ...existingList];

  let hasDefault = false;
  const listWithSingleDefault = nextList.map((entry) => {
    if (!entry.default) return entry;
    if (hasDefault) return { ...entry, default: false };
    hasDefault = true;
    return { ...entry, default: true };
  });
  if (!hasDefault && listWithSingleDefault.length > 0) {
    listWithSingleDefault[0] = { ...listWithSingleDefault[0], default: true };
  }

  nextCfg.agents = {
    ...existingAgents,
    list: listWithSingleDefault,
  };
  return nextCfg;
};

const isValidAgentId = (value) => kAgentIdPattern.test(String(value || "").trim());

const isValidWorkspaceFolder = (value) =>
  kWorkspaceFolderPattern.test(String(value || "").trim());

const resolveRequestedWorkspacePath = ({ OPENCLAW_DIR, agentId, workspaceFolder }) => {
  const normalizedFolder = String(workspaceFolder || "").trim();
  if (!normalizedFolder) return resolveAgentWorkspacePath({ OPENCLAW_DIR, agentId });
  if (!isValidWorkspaceFolder(normalizedFolder)) {
    throw new Error(
      "Workspace folder must be lowercase letters, numbers, and hyphens only",
    );
  }
  return path.join(OPENCLAW_DIR, normalizedFolder);
};

const ensureAgentScaffold = ({ fsImpl, agentId, workspacePath, OPENCLAW_DIR }) => {
  const agentDirPath = resolveAgentDirPath({ OPENCLAW_DIR, agentId });
  fsImpl.mkdirSync(workspacePath, { recursive: true });
  fsImpl.mkdirSync(agentDirPath, { recursive: true });
  for (const fileName of kDefaultAgentFiles) {
    const targetPath = path.join(workspacePath, fileName);
    if (fsImpl.existsSync(targetPath)) continue;
    fsImpl.writeFileSync(
      targetPath,
      `# ${fileName}\n\nCreated for agent "${agentId}".\n`,
    );
  }
  return {
    workspacePath,
    agentDirPath,
  };
};

const createAgentsService = ({ fs: fsImpl = fs, OPENCLAW_DIR }) => {
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
    const { workspacePath: scaffoldWorkspacePath, agentDirPath } = ensureAgentScaffold({
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
      ...(patch.name !== undefined ? { name: String(patch.name || "").trim() } : {}),
      ...(patch.model !== undefined ? { model: patch.model } : {}),
      ...(patch.identity !== undefined
        ? { identity: patch.identity && typeof patch.identity === "object" ? { ...patch.identity } : {} }
        : {}),
    };
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
    cfg.agents.list = cfg.agents.list.filter((entry) => entry.id !== normalized);
    if (Array.isArray(cfg.bindings)) {
      cfg.bindings = cfg.bindings.filter(
        (binding) => String(binding?.agentId || "") !== normalized,
      );
    }
    saveConfig({ fsImpl, OPENCLAW_DIR, config: cfg });

    if (!keepWorkspace) {
      const workspacePath = resolveAgentWorkspacePath({ OPENCLAW_DIR, agentId: normalized });
      const agentDirPath = path.join(OPENCLAW_DIR, "agents", normalized);
      fsImpl.rmSync(workspacePath, { recursive: true, force: true });
      fsImpl.rmSync(agentDirPath, { recursive: true, force: true });
    }
    return { ok: true };
  };

  return {
    listAgents,
    getAgent,
    createAgent,
    updateAgent,
    setDefaultAgent,
    deleteAgent,
  };
};

module.exports = { createAgentsService };
