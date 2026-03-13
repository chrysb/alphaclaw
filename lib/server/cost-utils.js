const fs = require("fs");
const path = require("path");

const kTokensPerMillion = 1_000_000;
const kLongContextThresholdTokens = 200_000;
const kNodeModulesPricingCacheTtlMs = 60_000;

const kGlobalModelPricing = {
  "claude-opus-4-6": {
    input: (tokens) => (tokens > kLongContextThresholdTokens ? 10.0 : 5.0),
    output: (tokens) => (tokens > kLongContextThresholdTokens ? 37.5 : 25.0),
  },
  "claude-sonnet-4-5": {
    input: 3.0,
    output: 15.0,
    cacheRead: 0.3,
    cacheWrite: 3.75,
  },
  "claude-sonnet-4.5": {
    input: 3.0,
    output: 15.0,
    cacheRead: 0.3,
    cacheWrite: 3.75,
  },
  "claude-sonnet-4-6": {
    input: 3.0,
    output: 15.0,
    cacheRead: 0.3,
    cacheWrite: 3.75,
  },
  "claude-sonnet-4.6": {
    input: 3.0,
    output: 15.0,
    cacheRead: 0.3,
    cacheWrite: 3.75,
  },
  "claude-haiku-4-6": { input: 0.8, output: 4.0 },
  "gpt-5": { input: 1.25, output: 10.0 },
  "gpt-5.4": { input: 2.5, output: 10.0 },
  "gpt-5.1-codex": { input: 2.5, output: 10.0 },
  "gpt-5.3-codex": { input: 2.5, output: 10.0 },
  "gpt-4.1": { input: 2.0, output: 8.0 },
  "gpt-4o": { input: 2.5, output: 10.0 },
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
  "gemini-3.1-pro-preview": { input: 2.0, output: 12.0 },
  "gemini-3-flash-preview": { input: 0.5, output: 3.0 },
  "gemini-2.0-flash": { input: 0.1, output: 0.4 },
};

const toInt = (value, fallbackValue = 0) => {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) ? parsed : fallbackValue;
};

const toCleanString = (value = "") =>
  String(value || "")
    .trim()
    .toLowerCase();

const toFiniteRate = (value, fallbackValue = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallbackValue;
};

const parseCostObjectText = (costObjectText = "") => {
  const inputMatch = costObjectText.match(/input:\s*([0-9.]+)/);
  const outputMatch = costObjectText.match(/output:\s*([0-9.]+)/);
  const cacheReadMatch = costObjectText.match(/cacheRead:\s*([0-9.]+)/);
  const cacheWriteMatch = costObjectText.match(/cacheWrite:\s*([0-9.]+)/);
  if (!inputMatch || !outputMatch) return null;
  return {
    input: toFiniteRate(inputMatch[1]),
    output: toFiniteRate(outputMatch[1]),
    cacheRead: toFiniteRate(cacheReadMatch?.[1], 0),
    cacheWrite: toFiniteRate(cacheWriteMatch?.[1], 0),
  };
};

const setPricingCandidates = (
  pricingByModelKey,
  modelKey = "",
  pricing = null,
) => {
  const normalizedModelKey = toCleanString(modelKey);
  if (!normalizedModelKey || !pricing) return;
  pricingByModelKey.set(normalizedModelKey, pricing);
  const claudeDashVariant = normalizedModelKey.replace(
    /(claude-(?:opus|sonnet)-\d+)\.(\d+)/g,
    "$1-$2",
  );
  const claudeDotVariant = normalizedModelKey.replace(
    /(claude-(?:opus|sonnet)-\d+)-(\d+)/g,
    "$1.$2",
  );
  if (claudeDashVariant !== normalizedModelKey) {
    pricingByModelKey.set(claudeDashVariant, pricing);
  }
  if (claudeDotVariant !== normalizedModelKey) {
    pricingByModelKey.set(claudeDotVariant, pricing);
  }
  const modelId = normalizedModelKey.split("/").filter(Boolean).pop();
  if (modelId && !pricingByModelKey.has(modelId)) {
    pricingByModelKey.set(modelId, pricing);
  }
  const modelIdClaudeDashVariant = String(modelId || "").replace(
    /(claude-(?:opus|sonnet)-\d+)\.(\d+)/g,
    "$1-$2",
  );
  const modelIdClaudeDotVariant = String(modelId || "").replace(
    /(claude-(?:opus|sonnet)-\d+)-(\d+)/g,
    "$1.$2",
  );
  if (modelIdClaudeDashVariant && !pricingByModelKey.has(modelIdClaudeDashVariant)) {
    pricingByModelKey.set(modelIdClaudeDashVariant, pricing);
  }
  if (modelIdClaudeDotVariant && !pricingByModelKey.has(modelIdClaudeDotVariant)) {
    pricingByModelKey.set(modelIdClaudeDotVariant, pricing);
  }
};

const extractPricingFromDistFile = (
  filePath = "",
  pricingByModelKey = new Map(),
) => {
  let sourceText = "";
  try {
    sourceText = fs.readFileSync(filePath, "utf8");
  } catch {
    return;
  }

  const directEntryPattern =
    /id:\s*"([^"]+)"[\s\S]{0,260}?cost:\s*(\{[\s\S]{0,180}?\})/g;
  let directEntryMatch = directEntryPattern.exec(sourceText);
  while (directEntryMatch) {
    const pricing = parseCostObjectText(directEntryMatch[2] || "");
    if (pricing) {
      setPricingCandidates(pricingByModelKey, directEntryMatch[1], pricing);
    }
    directEntryMatch = directEntryPattern.exec(sourceText);
  }

  const defaultModelPattern =
    /const\s+([A-Z0-9_]+)_DEFAULT_MODEL_(?:ID|REF)\s*=\s*(?:`([^`]+)`|"([^"]+)"|'([^']+)')/g;
  let defaultModelMatch = defaultModelPattern.exec(sourceText);
  while (defaultModelMatch) {
    const constantPrefix = defaultModelMatch[1];
    const modelKey =
      defaultModelMatch[2] || defaultModelMatch[3] || defaultModelMatch[4] || "";
    const defaultCostPattern = new RegExp(
      `const\\s+${constantPrefix}_DEFAULT_COST\\s*=\\s*(\\{[\\s\\S]{0,180}?\\})`,
      "m",
    );
    const defaultCostMatch = sourceText.match(defaultCostPattern);
    const pricing = parseCostObjectText(defaultCostMatch?.[1] || "");
    if (pricing) {
      setPricingCandidates(pricingByModelKey, modelKey, pricing);
    }
    defaultModelMatch = defaultModelPattern.exec(sourceText);
  }
};

let cachedNodeModulesPricingMap = null;
let cachedNodeModulesPricingLoadedAt = 0;
const kOpenclawPricingDistFilePatterns = [
  /^model-selection(?:-.+)?\.js$/,
  /^config(?:-.+)?\.js$/,
  /^onboard-custom(?:-.+)?\.js$/,
  /^configure(?:-.+)?\.js$/,
];

const loadOpenclawNodeModulesPricingMap = () => {
  const nowMs = Date.now();
  if (
    cachedNodeModulesPricingMap &&
    nowMs - cachedNodeModulesPricingLoadedAt < kNodeModulesPricingCacheTtlMs
  ) {
    return cachedNodeModulesPricingMap;
  }

  let distDirPath = "";
  try {
    const openclawEntryPath = require.resolve("openclaw");
    distDirPath = path.dirname(openclawEntryPath);
  } catch {
    cachedNodeModulesPricingMap = new Map();
    cachedNodeModulesPricingLoadedAt = nowMs;
    return cachedNodeModulesPricingMap;
  }

  const pricingByModelKey = new Map();
  let distFileNames = [];
  try {
    distFileNames = fs
      .readdirSync(distDirPath)
      .filter((fileName) => fileName.endsWith(".js"));
  } catch {
    cachedNodeModulesPricingMap = new Map();
    cachedNodeModulesPricingLoadedAt = nowMs;
    return cachedNodeModulesPricingMap;
  }

  distFileNames.forEach((fileName) => {
    const shouldScanFile = kOpenclawPricingDistFilePatterns.some((pattern) =>
      pattern.test(fileName),
    );
    if (!shouldScanFile) return;
    extractPricingFromDistFile(
      path.join(distDirPath, fileName),
      pricingByModelKey,
    );
  });

  cachedNodeModulesPricingMap = pricingByModelKey;
  cachedNodeModulesPricingLoadedAt = nowMs;
  return pricingByModelKey;
};

const resolvePricingFromOpenclawNodeModules = ({
  provider = "",
  model = "",
} = {}) => {
  const normalizedProvider = toCleanString(provider);
  const normalizedModel = toCleanString(model);
  if (!normalizedModel) return null;
  const pricingByModelKey = loadOpenclawNodeModulesPricingMap();
  const modelId =
    normalizedModel.split("/").filter(Boolean).pop() || normalizedModel;
  const lookupCandidates = [];
  if (normalizedProvider && modelId) {
    lookupCandidates.push(`${normalizedProvider}/${modelId}`);
  }
  lookupCandidates.push(normalizedModel);
  if (modelId) lookupCandidates.push(modelId);

  for (const candidate of lookupCandidates) {
    const pricing = pricingByModelKey.get(candidate);
    if (pricing) return pricing;
  }
  return null;
};

const resolvePricingFromFallbackMap = (model = "") => {
  const normalized = String(model || "").toLowerCase();
  if (!normalized) return null;
  const exact = kGlobalModelPricing[normalized];
  if (exact) return exact;
  const matchKey = Object.keys(kGlobalModelPricing).find((key) =>
    normalized.includes(key),
  );
  return matchKey ? kGlobalModelPricing[matchKey] : null;
};

const resolvePerMillionRate = (rate, tokens) => {
  if (typeof rate === "function") {
    return Number(rate(toInt(tokens)));
  }
  return Number(rate || 0);
};

const deriveCostBreakdown = ({
  inputTokens = 0,
  outputTokens = 0,
  cacheReadTokens = 0,
  cacheWriteTokens = 0,
  provider = "",
  model = "",
} = {}) => {
  const pricing =
    resolvePricingFromOpenclawNodeModules({ provider, model }) ||
    resolvePricingFromFallbackMap(model);
  if (!pricing) {
    return {
      inputCost: 0,
      outputCost: 0,
      cacheReadCost: 0,
      cacheWriteCost: 0,
      totalCost: 0,
      pricingFound: false,
    };
  }
  const inputRate = resolvePerMillionRate(pricing.input, inputTokens);
  const outputRate = resolvePerMillionRate(pricing.output, outputTokens);
  const inputCost = (inputTokens / kTokensPerMillion) * inputRate;
  const outputCost = (outputTokens / kTokensPerMillion) * outputRate;
  const cacheReadRate = resolvePerMillionRate(
    pricing.cacheRead,
    cacheReadTokens,
  );
  const cacheReadCost = (cacheReadTokens / kTokensPerMillion) * cacheReadRate;
  const cacheWriteRate = resolvePerMillionRate(
    pricing.cacheWrite == null ? pricing.input : pricing.cacheWrite,
    cacheWriteTokens,
  );
  const cacheWriteCost =
    (cacheWriteTokens / kTokensPerMillion) * cacheWriteRate;
  return {
    inputCost,
    outputCost,
    cacheReadCost,
    cacheWriteCost,
    totalCost: inputCost + outputCost + cacheReadCost + cacheWriteCost,
    pricingFound: true,
  };
};

module.exports = {
  kGlobalModelPricing,
  deriveCostBreakdown,
  resolvePricingFromOpenclawNodeModules,
  loadOpenclawNodeModulesPricingMap,
};
