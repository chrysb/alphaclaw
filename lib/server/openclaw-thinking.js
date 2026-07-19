const fs = require("fs");
const path = require("path");
const { pathToFileURL } = require("url");

const kThinkingModuleSentinel = "listThinkingLevelOptions";

let thinkingModulePromise = null;

const resolveOpenclawDistDir = () => path.dirname(require.resolve("openclaw"));

const resolveThinkingModulePath = (distDir = resolveOpenclawDistDir()) => {
  for (const name of fs.readdirSync(distDir)) {
    if (!/^thinking-.*\.js$/.test(name)) continue;
    if (name.includes("api") || name.includes("policy")) continue;
    const fullPath = path.join(distDir, name);
    const source = fs.readFileSync(fullPath, "utf8");
    if (source.includes(kThinkingModuleSentinel)) return fullPath;
  }
  throw new Error("OpenClaw thinking module not found");
};

const loadThinkingModule = async () => {
  if (!thinkingModulePromise) {
    const modulePath = resolveThinkingModulePath();
    thinkingModulePromise = import(pathToFileURL(modulePath).href);
  }
  return thinkingModulePromise;
};

const isNormalizeThinkLevel = (candidate) => {
  if (typeof candidate !== "function") return false;
  try {
    return (
      candidate("off") === "off" &&
      candidate("low") === "low" &&
      candidate("high") === "high"
    );
  } catch {
    return false;
  }
};

const findNormalizeThinkLevel = (mod) => {
  const candidates = [
    mod.normalizeThinkLevel,
    mod.f,
    mod.p,
    ...Object.values(mod),
  ];
  return candidates.find(isNormalizeThinkLevel) || null;
};

let normalizeThinkLevelPromise = null;

// OpenClaw 2026.7.1+ moved normalizeThinkLevel out of the sentinel chunk
// into a thinking.shared-*.js chunk, which the sentinel scan does not cover.
const resolveNormalizeThinkLevel = async (mod) => {
  const direct = findNormalizeThinkLevel(mod);
  if (direct) return direct;
  if (!normalizeThinkLevelPromise) {
    normalizeThinkLevelPromise = (async () => {
      const distDir = resolveOpenclawDistDir();
      for (const name of fs.readdirSync(distDir)) {
        if (!/^thinking\.shared-.*\.js$/.test(name)) continue;
        const sharedMod = await import(
          pathToFileURL(path.join(distDir, name)).href
        );
        const match = findNormalizeThinkLevel(sharedMod);
        if (match) return match;
      }
      throw new Error("OpenClaw normalizeThinkLevel export not found");
    })();
    normalizeThinkLevelPromise.catch(() => {
      normalizeThinkLevelPromise = null;
    });
  }
  return normalizeThinkLevelPromise;
};

const splitModelKey = (modelKey = "") => {
  const normalized = String(modelKey || "").trim();
  const slashIndex = normalized.indexOf("/");
  if (slashIndex <= 0) return { provider: "", model: normalized };
  return {
    provider: normalized.slice(0, slashIndex),
    model: normalized.slice(slashIndex + 1),
  };
};

const buildCatalogEntry = ({ provider, model, reasoning, compat } = {}) => {
  const normalizedProvider = String(provider || "").trim();
  const normalizedModel = String(model || "").trim();
  if (!normalizedProvider || !normalizedModel) return null;
  const entry = {
    provider: normalizedProvider,
    id: normalizedModel,
  };
  if (typeof reasoning === "boolean") entry.reasoning = reasoning;
  if (compat && typeof compat === "object") entry.compat = compat;
  return entry;
};

const resolveThinkingApi = async () => {
  const mod = await loadThinkingModule();
  return {
    listThinkingLevelOptions: mod.listThinkingLevelOptions || mod.i,
    resolveThinkingDefaultForModel: mod.resolveThinkingDefaultForModel || mod.s,
    normalizeThinkLevel: await resolveNormalizeThinkLevel(mod),
  };
};

const resolveThinkingOptionsForModel = async ({
  modelKey = "",
  catalog = [],
} = {}) => {
  const { provider, model } = splitModelKey(modelKey);
  if (!provider || !model) {
    return {
      levels: [],
      modelDefault: "off",
    };
  }
  const api = await resolveThinkingApi();
  const levels = api.listThinkingLevelOptions(provider, model, catalog) || [];
  const modelDefault =
    api.resolveThinkingDefaultForModel({
      provider,
      model,
      catalog,
    }) || "off";
  return {
    levels: levels.map((entry) => ({
      id: String(entry?.id || "").trim(),
      label: String(entry?.label || entry?.id || "").trim(),
    })),
    modelDefault: String(modelDefault || "off").trim() || "off",
  };
};

const normalizeThinkingDefaultValue = async (raw) => {
  if (raw === null || raw === undefined || raw === "") return null;
  const api = await resolveThinkingApi();
  const normalized = api.normalizeThinkLevel(String(raw || "").trim());
  return normalized || null;
};

module.exports = {
  buildCatalogEntry,
  loadThinkingModule,
  normalizeThinkingDefaultValue,
  resolveThinkingOptionsForModel,
  splitModelKey,
};
