const path = require("path");

const kNamePattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const kTransformsDir = "hooks/transforms";

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

const listWebhooks = ({ fs, constants }) => {
  const { cfg } = readConfig({ fs, constants });
  const mappings = ensureHooksRoot(cfg);
  return mappings
    .filter(isWebhookMapping)
    .map((mapping) => {
      const name = getMappingHookName(mapping);
      const transformPath = resolveTransformPathFromMapping(name, mapping);
      const transformAbsolutePath = path.join(
        constants.OPENCLAW_DIR,
        transformPath,
      );
      let createdAt = null;
      try {
        const stat = fs.statSync(transformAbsolutePath);
        createdAt =
          stat.birthtime?.toISOString?.() ||
          stat.ctime?.toISOString?.() ||
          null;
      } catch {}
      return {
        name,
        enabled: true,
        createdAt,
        path: `/hooks/${name}`,
        transformPath,
        transformExists: fs.existsSync(transformAbsolutePath),
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
};

const getWebhookDetail = ({ fs, constants, name }) => {
  const webhookName = validateWebhookName(name);
  const hooks = listWebhooks({ fs, constants });
  const detail = hooks.find((item) => item.name === webhookName);
  if (!detail) return null;
  const transformAbsolutePath = path.join(
    constants.OPENCLAW_DIR,
    detail.transformPath,
  );
  return {
    ...detail,
    transformExists: fs.existsSync(transformAbsolutePath),
  };
};

const ensureStarterTransform = ({ fs, constants, name }) => {
  const transformAbsolutePath = getTransformAbsolutePath(constants, name);
  fs.mkdirSync(path.dirname(transformAbsolutePath), { recursive: true });
  if (fs.existsSync(transformAbsolutePath)) return transformAbsolutePath;
  fs.writeFileSync(
    transformAbsolutePath,
    [
      "export default async function transform(payload, context) {",
      "  const data = payload.payload || payload;",
      "  return {",
      "    message: data.message,",
      `    name: data.name || "${name}",`,
      '    wakeMode: data.wakeMode || "now",',
      "  };",
      "}",
      "",
    ].join("\n"),
  );
  return transformAbsolutePath;
};

const createWebhook = ({ fs, constants, name }) => {
  const webhookName = validateWebhookName(name);
  const { cfg, configPath } = readConfig({ fs, constants });
  if (!cfg.hooks) cfg.hooks = {};
  const mappings = ensureHooksRoot(cfg);
  const normalizedModules = normalizeMappingTransformModules(mappings);
  if (findMappingIndexByName(mappings, webhookName) !== -1) {
    throw new Error(`Webhook "${webhookName}" already exists`);
  }
  mappings.push({
    match: { path: webhookName },
    action: "agent",
    name: webhookName,
    wakeMode: "now",
    transform: { module: getTransformModulePath(webhookName) },
  });

  if (normalizedModules) {
    // Keep all existing mappings consistent with transformsDir-relative module paths.
    cfg.hooks.mappings = mappings;
  }
  writeConfig({ fs, configPath, cfg });
  ensureStarterTransform({ fs, constants, name: webhookName });
  return getWebhookDetail({ fs, constants, name: webhookName });
};

const deleteWebhook = ({ fs, constants, name, deleteTransformDir = false }) => {
  const webhookName = validateWebhookName(name);
  const { cfg, configPath } = readConfig({ fs, constants });
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
