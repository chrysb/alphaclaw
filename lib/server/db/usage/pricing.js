const kTokensPerMillion = 1_000_000;
const kLongContextThresholdTokens = 200_000;
const kGlobalModelPricing = {
  "claude-opus-4-6": {
    input: (tokens) => (tokens > kLongContextThresholdTokens ? 10.0 : 5.0),
    output: (tokens) => (tokens > kLongContextThresholdTokens ? 37.5 : 25.0),
  },
  "claude-sonnet-4-6": { input: 3.0, output: 15.0 },
  "claude-haiku-4-6": { input: 0.8, output: 4.0 },
  "gpt-5": { input: 1.25, output: 10.0 },
  "gpt-5.1-codex": { input: 2.5, output: 10.0 },
  "gpt-5.3-codex": { input: 2.5, output: 10.0 },
  "gpt-4.1": { input: 2.0, output: 8.0 },
  "gpt-4o": { input: 2.5, output: 10.0 },
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
  "gemini-3-pro-preview": { input: 2.0, output: 12.0 },
  "gemini-3-flash-preview": { input: 0.5, output: 3.0 },
  "gemini-2.0-flash": { input: 0.1, output: 0.4 },
};

const toInt = (value, fallbackValue = 0) => {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) ? parsed : fallbackValue;
};

const resolvePricing = (model) => {
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
  model = "",
}) => {
  const pricing = resolvePricing(model);
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
  const cacheReadCost = 0;
  const cacheWriteRate = resolvePerMillionRate(pricing.input, cacheWriteTokens);
  const cacheWriteCost = (cacheWriteTokens / kTokensPerMillion) * cacheWriteRate;
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
};
