export const getModelProvider = (modelKey) => String(modelKey || "").split("/")[0] || "";

export const getAuthProviderFromModelProvider = (provider) => {
  const normalized = String(provider || "").trim();
  if (normalized === "openai-codex") return "openai";
  if (normalized === "volcengine-plan") return "volcengine";
  if (normalized === "byteplus-plan") return "byteplus";
  return normalized;
};

export const kFeaturedModelDefs = [
  {
    label: "Opus 4.8",
    preferredKeys: ["anthropic/claude-opus-4-8"],
  },
  {
    label: "Opus 4.7",
    preferredKeys: ["anthropic/claude-opus-4-7"],
  },
  {
    label: "Opus 4.6",
    preferredKeys: ["anthropic/claude-opus-4-6"],
  },
  {
    label: "Sonnet 4.6",
    preferredKeys: ["anthropic/claude-sonnet-4-6"],
  },
  {
    label: "GPT-5.6 Sol",
    preferredKeys: ["openai/gpt-5.6-sol", "openai-codex/gpt-5.6-sol"],
  },
  {
    label: "GPT-5.5",
    preferredKeys: ["openai/gpt-5.5", "openai-codex/gpt-5.5"],
  },
  {
    label: "Gemini 3.1 Pro",
    preferredKeys: ["google/gemini-3.1-pro-preview"],
  },
];

const kDeprecatedOnboardingModelKeys = new Set([
  "openai/gpt-5.3-codex",
  "openai-codex/gpt-5.3-codex",
]);
const kCanonicalCodexOauthModelKeys = new Set([
  "openai/gpt-5.4-mini",
  "openai/gpt-5.5",
  "openai/gpt-5.6-sol",
  "openai/gpt-5.6-terra",
  "openai/gpt-5.6-luna",
]);
const kFriendlyModelLabels = {
  "openai/gpt-5.4-mini": "GPT-5.4 Mini",
  "openai/gpt-5.5": "GPT-5.5",
  "openai/gpt-5.6-sol": "GPT-5.6 Sol",
  "openai/gpt-5.6-terra": "GPT-5.6 Terra",
  "openai/gpt-5.6-luna": "GPT-5.6 Luna",
};

export const getFriendlyModelLabel = (modelKey, fallback = "") => {
  const normalizedKey = String(modelKey || "").trim();
  return kFriendlyModelLabels[normalizedKey] || fallback || normalizedKey;
};

export const isDeprecatedOnboardingModelKey = (modelKey) =>
  kDeprecatedOnboardingModelKeys.has(String(modelKey || "").trim());

export const getOnboardingModels = (models = []) =>
  models.filter(
    (model) => !isDeprecatedOnboardingModelKey(model?.key),
  );

export const getOnboardingModelProvider = ({ modelKey, models = [] } = {}) => {
  const normalizedKey = String(modelKey || "").trim();
  const model = models.find((candidate) => candidate?.key === normalizedKey);
  if (
    getModelProvider(normalizedKey) === "openai-codex" ||
    kCanonicalCodexOauthModelKeys.has(normalizedKey) ||
    model?.agentRuntime?.id === "codex"
  ) {
    return "openai-codex";
  }
  return getModelProvider(normalizedKey);
};

export const kAlwaysAvailableModelDefs = [
  {
    key: "openai/gpt-5.6-sol",
    provider: "openai",
    label: "GPT-5.6 Sol",
    agentRuntime: { id: "codex" },
  },
  {
    key: "openai/gpt-5.6-terra",
    provider: "openai",
    label: "GPT-5.6 Terra",
    agentRuntime: { id: "codex" },
  },
  {
    key: "openai/gpt-5.6-luna",
    provider: "openai",
    label: "GPT-5.6 Luna",
    agentRuntime: { id: "codex" },
  },
  {
    key: "openai/gpt-5.4-mini",
    provider: "openai",
    label: "GPT-5.4 Mini",
    agentRuntime: { id: "codex" },
  },
  {
    key: "openai/gpt-5.5",
    provider: "openai",
    label: "GPT-5.5",
    agentRuntime: { id: "codex" },
  },
];

export const withAlwaysAvailableModels = (models = []) => {
  const merged = [...models];
  for (const model of kAlwaysAvailableModelDefs) {
    const existingIndex = merged.findIndex((candidate) => candidate?.key === model.key);
    if (existingIndex < 0) {
      merged.push(model);
      continue;
    }
    const existing = merged[existingIndex];
    merged[existingIndex] = {
      ...model,
      ...existing,
      label: getFriendlyModelLabel(model.key, existing?.label || model.label),
      agentRuntime: existing?.agentRuntime || model.agentRuntime,
    };
  }
  return merged;
};

export const getFeaturedModels = (allModels) => {
  const picked = [];
  const used = new Set();
  kFeaturedModelDefs.forEach((def) => {
    const found = def.preferredKeys
      .map((key) => allModels.find((model) => model.key === key))
      .find(Boolean);
    if (!found || used.has(found.key)) return;
    picked.push({ ...found, featuredLabel: def.label });
    used.add(found.key);
  });
  return picked;
};

export const kProviderAuthFields = {
  anthropic: [
    {
      key: "ANTHROPIC_API_KEY",
      label: "Anthropic API Key",
      url: "https://console.anthropic.com",
      linkText: "Get key",
      placeholder: "sk-ant-...",
    },
    // Temporarily hidden — setup-token flow is not supported in onboarding yet.
    // {
    //   key: "ANTHROPIC_TOKEN",
    //   label: "Anthropic Setup Token",
    //   hint: "From claude setup-token (uses your Claude subscription)",
    //   linkText: "Get token",
    //   placeholder: "Token...",
    // },
  ],
  openai: [
    {
      key: "OPENAI_API_KEY",
      label: "OpenAI API Key",
      url: "https://platform.openai.com",
      linkText: "Get key",
      placeholder: "sk-...",
    },
  ],
  google: [
    {
      key: "GEMINI_API_KEY",
      label: "Gemini API Key",
      url: "https://aistudio.google.com",
      linkText: "Get key",
      placeholder: "AI...",
    },
  ],
  opencode: [
    {
      key: "OPENCODE_API_KEY",
      label: "OpenCode API Key",
      placeholder: "oc-...",
    },
  ],
  openrouter: [
    {
      key: "OPENROUTER_API_KEY",
      label: "OpenRouter API Key",
      url: "https://openrouter.ai",
      linkText: "Get key",
      placeholder: "sk-or-...",
    },
  ],
  zai: [
    {
      key: "ZAI_API_KEY",
      label: "Z.AI API Key",
      placeholder: "zai-...",
    },
  ],
  "vercel-ai-gateway": [
    {
      key: "AI_GATEWAY_API_KEY",
      label: "AI Gateway API Key",
      placeholder: "aigw_...",
    },
  ],
  kilocode: [
    {
      key: "KILOCODE_API_KEY",
      label: "KiloCode API Key",
      placeholder: "kilo_...",
    },
  ],
  xai: [
    {
      key: "XAI_API_KEY",
      label: "xAI API Key",
      placeholder: "xai-...",
    },
  ],
  mistral: [
    {
      key: "MISTRAL_API_KEY",
      label: "Mistral API Key",
      url: "https://console.mistral.ai",
      linkText: "Get key",
      placeholder: "sk-...",
    },
  ],
  voyage: [
    {
      key: "VOYAGE_API_KEY",
      label: "Voyage API Key",
      url: "https://dash.voyageai.com",
      linkText: "Get key",
      placeholder: "pa-...",
    },
  ],
  groq: [
    {
      key: "GROQ_API_KEY",
      label: "Groq API Key",
      url: "https://console.groq.com",
      linkText: "Get key",
      placeholder: "gsk_...",
    },
  ],
  cerebras: [
    {
      key: "CEREBRAS_API_KEY",
      label: "Cerebras API Key",
      placeholder: "csk-...",
    },
  ],
  moonshot: [
    {
      key: "MOONSHOT_API_KEY",
      label: "Moonshot API Key",
      placeholder: "sk-...",
    },
  ],
  "kimi-coding": [
    {
      key: "KIMI_API_KEY",
      label: "Kimi API Key",
      placeholder: "sk-...",
    },
  ],
  volcengine: [
    {
      key: "VOLCANO_ENGINE_API_KEY",
      label: "Volcano Engine API Key",
      placeholder: "ve-...",
    },
  ],
  byteplus: [
    {
      key: "BYTEPLUS_API_KEY",
      label: "BytePlus API Key",
      placeholder: "bp-...",
    },
  ],
  synthetic: [
    {
      key: "SYNTHETIC_API_KEY",
      label: "Synthetic API Key",
      placeholder: "syn-...",
    },
  ],
  minimax: [
    {
      key: "MINIMAX_API_KEY",
      label: "MiniMax API Key",
      placeholder: "minimax-...",
    },
  ],
  deepgram: [
    {
      key: "DEEPGRAM_API_KEY",
      label: "Deepgram API Key",
      url: "https://console.deepgram.com",
      linkText: "Get key",
      placeholder: "dg-...",
    },
  ],
  vllm: [
    {
      key: "VLLM_API_KEY",
      label: "vLLM API Key",
      placeholder: "vllm-local",
    },
  ],
};

export const kProviderLabels = {
  anthropic: "Anthropic",
  openai: "OpenAI",
  google: "Gemini",
  opencode: "OpenCode Zen",
  openrouter: "OpenRouter",
  zai: "Z.AI",
  "vercel-ai-gateway": "Vercel AI Gateway",
  kilocode: "Kilo Gateway",
  xai: "xAI",
  mistral: "Mistral",
  cerebras: "Cerebras",
  moonshot: "Moonshot",
  "kimi-coding": "Kimi Coding",
  volcengine: "Volcano Engine",
  byteplus: "BytePlus",
  synthetic: "Synthetic",
  minimax: "MiniMax",
  voyage: "Voyage",
  groq: "Groq",
  deepgram: "Deepgram",
  vllm: "vLLM",
};

export const kProviderOrder = [
  "anthropic",
  "openai",
  "google",
  "zai",
  "xai",
  "openrouter",
  "opencode",
  "kilocode",
  "vercel-ai-gateway",
  "minimax",
  "moonshot",
  "kimi-coding",
  "volcengine",
  "byteplus",
  "synthetic",
  "mistral",
  "cerebras",
  "voyage",
  "groq",
  "deepgram",
  "vllm",
];

export const kCoreProviders = new Set(["anthropic", "openai", "google", "openrouter"]);

export const kProviderFeatures = {
  anthropic: ["Agent Model"],
  openai: ["Agent Model", "Embeddings", "Audio"],
  google: ["Agent Model", "Embeddings", "Audio"],
  opencode: ["Agent Model"],
  openrouter: ["Agent Model"],
  zai: ["Agent Model"],
  "vercel-ai-gateway": ["Agent Model"],
  kilocode: ["Agent Model"],
  xai: ["Agent Model"],
  mistral: ["Agent Model", "Embeddings", "Audio"],
  cerebras: ["Agent Model"],
  moonshot: ["Agent Model"],
  "kimi-coding": ["Agent Model"],
  volcengine: ["Agent Model"],
  byteplus: ["Agent Model"],
  synthetic: ["Agent Model"],
  minimax: ["Agent Model"],
  voyage: ["Embeddings"],
  groq: ["Agent Model", "Audio"],
  deepgram: ["Audio"],
  vllm: ["Agent Model"],
};

export const kFeatureDefs = [
  {
    id: "embeddings",
    label: "Memory Embeddings",
    tag: "Embeddings",
    providers: ["openai", "google", "voyage", "mistral"],
  },
  {
    id: "audio",
    label: "Audio Transcription",
    tag: "Audio",
    hasDefault: true,
    providers: ["openai", "groq", "deepgram", "google", "mistral"],
  },
];

export const getVisibleAiFieldKeys = (provider) => {
  const authProvider = getAuthProviderFromModelProvider(provider);
  const fields = kProviderAuthFields[authProvider] || [];
  return new Set(fields.map((field) => field.key));
};

export const kAllAiAuthFields = Object.values(kProviderAuthFields)
  .flat()
  .filter((field, idx, arr) => arr.findIndex((item) => item.key === field.key) === idx);
