export const getModelProvider = (modelKey) => String(modelKey || "").split("/")[0] || "";

export const getAuthProviderFromModelProvider = (provider) =>
  provider === "openai-codex" ? "openai" : provider;

export const kFeaturedModelDefs = [
  {
    label: "Opus 4.6",
    preferredKeys: ["anthropic/claude-opus-4-6", "anthropic/claude-opus-4-5"],
  },
  {
    label: "Sonnet 4.6",
    preferredKeys: ["anthropic/claude-sonnet-4-6", "anthropic/claude-sonnet-4-5"],
  },
  {
    label: "Codex 5.3",
    preferredKeys: ["openai-codex/gpt-5.3-codex", "openai-codex/gpt-5.2-codex"],
  },
  {
    label: "Gemini 3",
    preferredKeys: ["google/gemini-3-pro-preview", "google/gemini-3-flash-preview"],
  },
];

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
    {
      key: "ANTHROPIC_TOKEN",
      label: "Anthropic Setup Token",
      hint: "From claude setup-token (uses your Claude subscription)",
      linkText: "Get token",
      placeholder: "Token...",
    },
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
  deepgram: [
    {
      key: "DEEPGRAM_API_KEY",
      label: "Deepgram API Key",
      url: "https://console.deepgram.com",
      linkText: "Get key",
      placeholder: "dg-...",
    },
  ],
};

export const kProviderLabels = {
  anthropic: "Anthropic",
  openai: "OpenAI",
  google: "Gemini",
  mistral: "Mistral",
  voyage: "Voyage",
  groq: "Groq",
  deepgram: "Deepgram",
};

export const kProviderOrder = [
  "anthropic",
  "openai",
  "google",
  "mistral",
  "voyage",
  "groq",
  "deepgram",
];

export const kCoreProviders = new Set(["anthropic", "openai", "google"]);

export const kProviderFeatures = {
  anthropic: ["Agent Model"],
  openai: ["Agent Model", "Embeddings", "Audio"],
  google: ["Agent Model", "Embeddings", "Audio"],
  mistral: ["Agent Model", "Embeddings", "Audio"],
  voyage: ["Embeddings"],
  groq: ["Agent Model", "Audio"],
  deepgram: ["Audio"],
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
  if (provider === "openai-codex") return new Set();
  const authProvider = getAuthProviderFromModelProvider(provider);
  const fields = kProviderAuthFields[authProvider] || [];
  return new Set(fields.map((field) => field.key));
};

export const kAllAiAuthFields = Object.values(kProviderAuthFields)
  .flat()
  .filter((field, idx, arr) => arr.findIndex((item) => item.key === field.key) === idx);
