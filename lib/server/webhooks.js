const path = require("path");

const kNamePattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const kTransformsDir = "hooks/transforms";
const kManagedWebhookConfigs = [
  {
    name: "gmail",
    preset: "gmail",
    description:
      "Managed by AlphaClaw Gmail Watch setup. Required for internal Gmail watch delivery.",
  },
];

const getConfigPath = ({ OPENCLAW_DIR }) =>
  path.join(OPENCLAW_DIR, "openclaw.json");

const readConfig = ({ fs, constants }) => {
  const configPath = getConfigPath(constants);
  const cfg = JSON.parse(fs.readFileSync(configPath, "utf8"));
  return { cfg, configPath };
};

const writeConfig = ({ fs, configPath, cfg }) => {
  fs.writeFileSync(configPath, JSON.stringify(cfg, null, 2));
};

const getTransformRelativePath = (name) =>
  `${kTransformsDir}/${name}/${name}-transform.mjs`;
const getTransformModulePath = (name) => `${name}/${name}-transform.mjs`;
const getTransformAbsolutePath = ({ OPENCLAW_DIR }, name) =>
  path.join(OPENCLAW_DIR, getTransformRelativePath(name));
const getTransformDirectoryRelativePath = (name) => `${kTransformsDir}/${name}`;
const getTransformDirectoryAbsolutePath = ({ OPENCLAW_DIR }, name) =>
  path.join(OPENCLAW_DIR, getTransformDirectoryRelativePath(name));
const normalizeTransformModulePath = ({ modulePath, name }) => {
  const rawModulePath = String(modulePath || "")
    .trim()
    .replace(/^\/+/, "");
  const fallbackModulePath = getTransformModulePath(name);
  const nextModulePath = rawModulePath || fallbackModulePath;
  if (nextModulePath.startsWith(`${kTransformsDir}/`)) {
    return nextModulePath.slice(kTransformsDir.length + 1);
  }
  return nextModulePath;
};

const ensureHooksRoot = (cfg) => {
  if (!cfg.hooks) cfg.hooks = {};
  if (!Array.isArray(cfg.hooks.mappings)) {
    cfg.hooks.mappings = [];
  }
  if (typeof cfg.hooks.enabled !== "boolean") cfg.hooks.enabled = true;
  if (typeof cfg.hooks.path !== "string" || !cfg.hooks.path.trim())
    cfg.hooks.path = "/hooks";
  if (typeof cfg.hooks.token !== "string" || !cfg.hooks.token.trim()) {
    cfg.hooks.token = "${WEBHOOK_TOKEN}";
  }
  if (
    typeof cfg.hooks.defaultSessionKey !== "string" ||
    !cfg.hooks.defaultSessionKey.trim()
  ) {
    cfg.hooks.defaultSessionKey = "hook:ingress";
  }
  if (typeof cfg.hooks.allowRequestSessionKey !== "boolean") {
    cfg.hooks.allowRequestSessionKey = false;
  }
  if (!Array.isArray(cfg.hooks.allowedSessionKeyPrefixes)) {
    cfg.hooks.allowedSessionKeyPrefixes = ["hook:"];
  }
  if (!cfg.hooks.allowedSessionKeyPrefixes.includes("hook:")) {
    cfg.hooks.allowedSessionKeyPrefixes = [
      ...cfg.hooks.allowedSessionKeyPrefixes,
      "hook:",
    ];
  }
  return cfg.hooks.mappings;
};

const getMappingHookName = (mapping) =>
  String(mapping?.match?.path || "").trim();
const isWebhookMapping = (mapping) => !!getMappingHookName(mapping);
const findMappingIndexByName = (mappings, name) =>
  mappings.findIndex((mapping) => getMappingHookName(mapping) === name);

const validateWebhookName = (name) => {
  const normalized = String(name || "")
    .trim()
    .toLowerCase();
  if (!normalized) throw new Error("Webhook name is required");
  if (!kNamePattern.test(normalized)) {
    throw new Error(
      "Webhook name must be lowercase letters, numbers, and hyphens",
    );
  }
  return normalized;
};

const normalizeDestination = (destination = null) => {
  if (!destination || typeof destination !== "object") return null;
  const channel = String(destination?.channel || "").trim();
  const to = String(destination?.to || "").trim();
  const agentId = String(destination?.agentId || "").trim();
  if (!channel && !to) return null;
  if (!channel || !to) {
    throw new Error("destination.channel and destination.to are required");
  }
  return {
    channel,
    to,
    ...(agentId ? { agentId } : {}),
  };
};

const resolveTransformPathFromMapping = (name, mapping) => {
  const modulePath = normalizeTransformModulePath({
    modulePath: mapping?.transform?.module,
    name,
  });
  return `${kTransformsDir}/${modulePath}`;
};

const normalizeMappingTransformModules = (mappings) => {
  let changed = false;
  for (const mapping of mappings || []) {
    const name = getMappingHookName(mapping);
    if (!name) continue;
    const normalizedModulePath = normalizeTransformModulePath({
      modulePath: mapping?.transform?.module,
      name,
    });
    if (
      !mapping.transform ||
      mapping.transform.module !== normalizedModulePath
    ) {
      mapping.transform = {
        ...(mapping.transform || {}),
        module: normalizedModulePath,
      };
      changed = true;
    }
  }
  return changed;
};

const buildDefaultTransformSource = (name) => {
  return [
    "export default async function transform(payload, context) {",
    "  const data = payload.payload || payload;",
    "  return {",
    "    message: data.message,",
    `    name: data.name || "${name}",`,
    '    wakeMode: data.wakeMode || "now",',
    "  };",
    "}",
    "",
  ].join("\n");
};

const ensureWebhookTransform = ({
  fs,
  constants,
  name,
  source = "",
  destination = null,
  forceWrite = false,
}) => {
  const webhookName = validateWebhookName(name);
  const transformAbsolutePath = getTransformAbsolutePath(
    constants,
    webhookName,
  );
  fs.mkdirSync(path.dirname(transformAbsolutePath), { recursive: true });
  if (fs.existsSync(transformAbsolutePath) && !forceWrite) {
    return { changed: false, path: transformAbsolutePath };
  }
  fs.writeFileSync(
    transformAbsolutePath,
    String(source || "").trim()
      ? `${String(source).replace(/\s+$/, "")}\n`
      : buildDefaultTransformSource(webhookName),
  );
  return { changed: true, path: transformAbsolutePath };
};

const ensureWebhookMapping = ({ cfg, name, mapping = {} }) => {
  const webhookName = validateWebhookName(name);
  const mappings = ensureHooksRoot(cfg);
  const normalizedModulesChanged = normalizeMappingTransformModules(mappings);
  const index = findMappingIndexByName(mappings, webhookName);
  const defaults = {
    match: { path: webhookName },
    action: "agent",
    name: webhookName,
    wakeMode: "now",
    transform: { module: getTransformModulePath(webhookName) },
  };
  if (index === -1) {
    mappings.push({
      ...defaults,
      ...mapping,
      match: { ...defaults.match, ...(mapping.match || {}) },
      transform: { ...defaults.transform, ...(mapping.transform || {}) },
    });
    return { changed: true, created: true, normalizedModulesChanged };
  }
  const current = mappings[index] || {};
  const next = {
    ...current,
    ...mapping,
    match: {
      ...(current.match || {}),
      ...(mapping.match || {}),
      path: webhookName,
    },
    action: mapping.action || current.action || defaults.action,
    wakeMode: mapping.wakeMode || current.wakeMode || defaults.wakeMode,
    transform: {
      ...(current.transform || {}),
      ...(mapping.transform || {}),
      module:
        String(mapping?.transform?.module || "").trim() ||
        String(current?.transform?.module || "").trim() ||
        defaults.transform.module,
    },
  };
  if (JSON.stringify(current) !== JSON.stringify(next)) {
    mappings[index] = next;
    return { changed: true, created: false, normalizedModulesChanged };
  }
  return {
    changed: normalizedModulesChanged,
    created: false,
    normalizedModulesChanged,
  };
};

const resolveDefaultAgentId = (cfg) => {
  const agents = Array.isArray(cfg?.agents?.list) ? cfg.agents.list : [];
  const explicitDefault = agents.find((entry) => !!entry?.default);
  const defaultId = String(explicitDefault?.id || "").trim();
  if (defaultId) return defaultId;
  const firstId = String(agents[0]?.id || "").trim();
  return firstId || "main";
};

const resolveWebhookAgentId = ({ cfg, requestedAgentId = "" }) => {
  const normalizedRequested = String(requestedAgentId || "").trim();
  const agents = Array.isArray(cfg?.agents?.list) ? cfg.agents.list : [];
  if (
    normalizedRequested &&
    agents.some((entry) => String(entry?.id || "").trim() === normalizedRequested)
  ) {
    return normalizedRequested;
  }
  return resolveDefaultAgentId(cfg);
};

const listManagedWebhooksFromConfig = ({ cfg }) => {
  const presets = Array.isArray(cfg?.hooks?.presets) ? cfg.hooks.presets : [];
  return kManagedWebhookConfigs
    .filter((managed) => presets.includes(managed.preset))
    .map((managed) => ({
      name: managed.name,
      enabled: true,
      createdAt: null,
      path: `/hooks/${managed.name}`,
      transformPath: null,
      transformExists: true,
      managed: true,
      managedReason: managed.description,
    }));
};

const isManagedWebhook = ({ cfg, name }) => {
  const normalized = String(name || "")
    .trim()
    .toLowerCase();
  if (!normalized) return false;
  return listManagedWebhooksFromConfig({ cfg }).some(
    (webhook) => webhook.name === normalized,
  );
};

const listWebhooks = ({ fs, constants }) => {
  const { cfg } = readConfig({ fs, constants });
  const mappings = ensureHooksRoot(cfg);
  const managedWebhooks = listManagedWebhooksFromConfig({ cfg });
  const managedByName = new Map(
    managedWebhooks.map((item) => [item.name, item]),
  );
  const mappingWebhooks = mappings.filter(isWebhookMapping).map((mapping) => {
    const name = getMappingHookName(mapping);
    const managed = managedByName.get(name);
    const transformPath = resolveTransformPathFromMapping(name, mapping);
    const transformAbsolutePath = path.join(
      constants.OPENCLAW_DIR,
      transformPath,
    );
    let createdAt = null;
    try {
      const stat = fs.statSync(transformAbsolutePath);
      createdAt =
        stat.birthtime?.toISOString?.() || stat.ctime?.toISOString?.() || null;
    } catch {}
    return {
      name,
      enabled: true,
      createdAt,
      path: `/hooks/${name}`,
      transformPath,
      transformExists: fs.existsSync(transformAbsolutePath),
      deliver: Boolean(mapping?.deliver),
      channel: String(mapping?.channel || "").trim(),
      to: String(mapping?.to || "").trim(),
      agentId: String(mapping?.agentId || "").trim(),
      managed: Boolean(managed),
      managedReason: managed?.managedReason || "",
    };
  });
  const mappingNames = new Set(mappingWebhooks.map((item) => item.name));
  const syntheticManagedWebhooks = managedWebhooks.filter(
    (item) => !mappingNames.has(item.name),
  );
  return [...mappingWebhooks, ...syntheticManagedWebhooks].sort((a, b) =>
    a.name.localeCompare(b.name),
  );
};

const getWebhookDetail = ({ fs, constants, name }) => {
  const webhookName = validateWebhookName(name);
  const hooks = listWebhooks({ fs, constants });
  const detail = hooks.find((item) => item.name === webhookName);
  if (!detail) return null;
  if (detail.managed || !detail.transformPath) {
    return {
      ...detail,
      transformExists: true,
    };
  }
  const transformAbsolutePath = path.join(
    constants.OPENCLAW_DIR,
    detail.transformPath,
  );
  return {
    ...detail,
    transformExists: fs.existsSync(transformAbsolutePath),
  };
};

const createWebhook = ({
  fs,
  constants,
  name,
  upsert = false,
  allowManagedName = false,
  mapping = {},
  transformSource = "",
  destination = null,
  overwriteTransform = false,
}) => {
  const webhookName = validateWebhookName(name);
  const normalizedDestination = normalizeDestination(destination);
  const { cfg, configPath } = readConfig({ fs, constants });
  if (!allowManagedName && isManagedWebhook({ cfg, name: webhookName })) {
    throw new Error(
      `Webhook "${webhookName}" is managed and cannot be created manually`,
    );
  }
  const existingMappings = ensureHooksRoot(cfg);
  const exists = findMappingIndexByName(existingMappings, webhookName) !== -1;
  if (exists && !upsert) {
    throw new Error(`Webhook "${webhookName}" already exists`);
  }
  const agentId = resolveWebhookAgentId({
    cfg,
    requestedAgentId:
      String(mapping?.agentId || "").trim() ||
      String(normalizedDestination?.agentId || "").trim(),
  });
  const resolvedMapping = {
    ...mapping,
    deliver: true,
    channel:
      String(mapping?.channel || "").trim() ||
      String(normalizedDestination?.channel || "").trim() ||
      "last",
    ...(String(mapping?.to || "").trim() || String(normalizedDestination?.to || "").trim()
      ? {
          to:
            String(mapping?.to || "").trim() ||
            String(normalizedDestination?.to || "").trim(),
        }
      : {}),
    agentId,
  };
  const ensuredMapping = ensureWebhookMapping({
    cfg,
    name: webhookName,
    mapping: resolvedMapping,
  });
  const ensuredTransform = ensureWebhookTransform({
    fs,
    constants,
    name: webhookName,
    source: transformSource,
    destination: normalizedDestination,
    forceWrite: overwriteTransform,
  });
  if (ensuredMapping.changed || ensuredTransform.changed || !exists) {
    writeConfig({ fs, configPath, cfg });
  }
  return getWebhookDetail({ fs, constants, name: webhookName });
};

const deleteWebhook = ({ fs, constants, name, deleteTransformDir = false }) => {
  const webhookName = validateWebhookName(name);
  const { cfg, configPath } = readConfig({ fs, constants });
  if (isManagedWebhook({ cfg, name: webhookName })) {
    return {
      removed: false,
      managed: true,
      deletedTransformDir: false,
    };
  }
  const mappings = ensureHooksRoot(cfg);
  const normalizedModules = normalizeMappingTransformModules(mappings);
  const index = findMappingIndexByName(mappings, webhookName);
  if (index === -1) {
    if (normalizedModules) writeConfig({ fs, configPath, cfg });
    return false;
  }
  mappings.splice(index, 1);
  writeConfig({ fs, configPath, cfg });
  let deletedTransformDir = false;
  if (deleteTransformDir) {
    const transformDirAbsolutePath = getTransformDirectoryAbsolutePath(
      constants,
      webhookName,
    );
    if (fs.existsSync(transformDirAbsolutePath)) {
      fs.rmSync(transformDirAbsolutePath, { recursive: true, force: true });
      deletedTransformDir = !fs.existsSync(transformDirAbsolutePath);
      if (!deletedTransformDir) {
        throw new Error(
          `Failed to delete transform directory: ${getTransformDirectoryRelativePath(webhookName)}`,
        );
      }
    }
  }
  return {
    removed: true,
    deletedTransformDir,
  };
};

module.exports = {
  listWebhooks,
  getWebhookDetail,
  createWebhook,
  deleteWebhook,
  validateWebhookName,
  getTransformRelativePath,
};
