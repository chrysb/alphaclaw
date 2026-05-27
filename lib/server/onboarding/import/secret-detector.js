const path = require("path");

const kSecretKeyPatterns = [
  /token$/i,
  /^bot_?token$/i,
  /api_?key$/i,
  /secret$/i,
  /password$/i,
  /private_?key$/i,
  /credential/i,
];

const kSafeKeyExclusions = [
  /^auth_?dir$/i,
  /^auth_?store$/i,
  /^auto_?select/i,
  /^public_?key$/i,
];

const kValuePrefixes = [
  { prefix: "sk-", label: "OpenAI/Anthropic/Stripe" },
  { prefix: "sk-ant-", label: "Anthropic" },
  { prefix: "sk-proj-", label: "OpenAI project" },
  { prefix: "ghp_", label: "GitHub classic PAT" },
  { prefix: "github_pat_", label: "GitHub fine-grained PAT" },
  { prefix: "ghs_", label: "GitHub App token" },
  { prefix: "gho_", label: "GitHub OAuth" },
  { prefix: "xoxb-", label: "Slack bot" },
  { prefix: "xoxp-", label: "Slack user" },
  { prefix: "xoxe-", label: "Slack enterprise" },
  { prefix: "xoxa-", label: "Slack app" },
  { prefix: "AIza", label: "Google API key" },
  { prefix: "ya29.", label: "Google OAuth" },
  { prefix: "AKIA", label: "AWS access key" },
  { prefix: "ntn_", label: "Notion" },
  { prefix: "nvapi-", label: "NVIDIA" },
  { prefix: "r8_", label: "Replicate" },
  { prefix: "hf_", label: "Hugging Face" },
  { prefix: "pk_live_", label: "Stripe publishable" },
  { prefix: "sk_live_", label: "Stripe secret" },
  { prefix: "pk_test_", label: "Stripe test pub" },
  { prefix: "sk_test_", label: "Stripe test secret" },
  { prefix: "whsec_", label: "Stripe webhook" },
  { prefix: "SG.", label: "SendGrid" },
  { prefix: "xai-", label: "xAI/Grok" },
  { prefix: "eyJ", label: "JWT" },
];

// Explicit config path -> env var name mapping
const kConfigPathToEnvVar = {
  "channels.telegram.botToken": "TELEGRAM_BOT_TOKEN",
  "channels.discord.token": "DISCORD_BOT_TOKEN",
  "channels.slack.botToken": "SLACK_BOT_TOKEN",
  "channels.slack.appToken": "SLACK_APP_TOKEN",
  "channels.googlechat.serviceAccount": "GOOGLE_CHAT_SERVICE_ACCOUNT",
  "channels.mattermost.botToken": "MATTERMOST_BOT_TOKEN",
  "channels.mattermost.url": "MATTERMOST_URL",
  "channels.twitch.accessToken": "OPENCLAW_TWITCH_ACCESS_TOKEN",
  "models.providers.openai.apiKey": "OPENAI_API_KEY",
  "models.providers.anthropic.apiKey": "ANTHROPIC_API_KEY",
  "models.providers.google.apiKey": "GEMINI_API_KEY",
  "models.providers.opencode.apiKey": "OPENCODE_API_KEY",
  "models.providers.openrouter.apiKey": "OPENROUTER_API_KEY",
  "models.providers.zai.apiKey": "ZAI_API_KEY",
  "models.providers.vercel-ai-gateway.apiKey": "AI_GATEWAY_API_KEY",
  "models.providers.kilocode.apiKey": "KILOCODE_API_KEY",
  "models.providers.xai.apiKey": "XAI_API_KEY",
  "models.providers.mistral.apiKey": "MISTRAL_API_KEY",
  "models.providers.groq.apiKey": "GROQ_API_KEY",
  "models.providers.cerebras.apiKey": "CEREBRAS_API_KEY",
  "models.providers.moonshot.apiKey": "MOONSHOT_API_KEY",
  "models.providers.kimi-coding.apiKey": "KIMI_API_KEY",
  "models.providers.volcengine.apiKey": "VOLCANO_ENGINE_API_KEY",
  "models.providers.byteplus.apiKey": "BYTEPLUS_API_KEY",
  "models.providers.synthetic.apiKey": "SYNTHETIC_API_KEY",
  "models.providers.minimax.apiKey": "MINIMAX_API_KEY",
  "models.providers.voyage.apiKey": "VOYAGE_API_KEY",
  "models.providers.vllm.apiKey": "VLLM_API_KEY",
  "tools.web.search.apiKey": "BRAVE_API_KEY",
  "audio.apiKey": "ELEVENLABS_API_KEY",
  "talk.apiKey": "ELEVENLABS_API_KEY",
  "hooks.token": null, // Dropped — normalized to WEBHOOK_TOKEN at deploy/import time
  "gateway.auth.token": null, // Dropped — set at deploy time
};

const isSensitiveKey = (key) => {
  const str = String(key || "");
  if (kSafeKeyExclusions.some((p) => p.test(str))) return false;
  return kSecretKeyPatterns.some((p) => p.test(str));
};

const matchesValuePrefix = (value) => {
  const str = String(value || "");
  for (const { prefix, label } of kValuePrefixes) {
    if (str.startsWith(prefix)) return { matched: true, label };
  }
  return { matched: false };
};

const isLikelyNonSecret = (value) => {
  const str = String(value || "").trim();
  if (str.length < 16) return true;
  if (/^(true|false)$/i.test(str)) return true;
  if (/^https?:\/\//.test(str) && !str.includes("token") && !str.includes("key")) return true;
  if (/^[a-z0-9/-]+$/.test(str) && str.includes("/")) return true;
  return false;
};

const maskValue = (value) => {
  const str = String(value || "");
  if (str.length <= 8) return "****";
  return str.slice(0, 4) + "****" + str.slice(-4);
};

const toEnvSegment = (value) =>
  String(value || "")
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .toUpperCase()
    .replace(/[^A-Z0-9_]/g, "_");

const getCanonicalEnvVarForConfigPath = (dotPath) => {
  if (kConfigPathToEnvVar[dotPath] !== undefined) {
    return kConfigPathToEnvVar[dotPath];
  }
  const providerPathMatch = String(dotPath || "").match(
    /^models\.providers\.([^.]+)\.([^.]+)$/,
  );
  if (providerPathMatch) {
    const [, providerKey, fieldKey] = providerPathMatch;
    return `${toEnvSegment(providerKey)}_${toEnvSegment(fieldKey)}`;
  }
  return "";
};

const configPathToEnvName = (dotPath) => {
  const canonicalName = getCanonicalEnvVarForConfigPath(dotPath);
  if (canonicalName) return canonicalName;
  const lastKey = dotPath.split(".").pop() || "";
  return toEnvSegment(lastKey);
};

const walkConfig = (obj, parentPath, results) => {
  if (!obj || typeof obj !== "object") return;
  for (const [key, value] of Object.entries(obj)) {
    const dotPath = parentPath ? `${parentPath}.${key}` : key;

    if (typeof value === "string" && value.trim()) {
      const explicitEnvVar = kConfigPathToEnvVar[dotPath];
      if (explicitEnvVar !== undefined) {
        if (explicitEnvVar === null) continue;
        if (!isAlreadyEnvRef(value)) {
          results.push({
            configPath: dotPath,
            key,
            value,
            maskedValue: maskValue(value),
            suggestedEnvVar: explicitEnvVar,
            confidence: "high",
            source: "config-path",
          });
        }
        continue;
      }

      const prefixMatch = matchesValuePrefix(value);
      if (prefixMatch.matched) {
        if (!isAlreadyEnvRef(value)) {
          results.push({
            configPath: dotPath,
            key,
            value,
            maskedValue: maskValue(value),
            suggestedEnvVar: configPathToEnvName(dotPath),
            confidence: "high",
            source: "value-prefix",
            prefixLabel: prefixMatch.label,
          });
        }
        continue;
      }

      if (isSensitiveKey(key) && !isLikelyNonSecret(value)) {
        if (!isAlreadyEnvRef(value)) {
          results.push({
            configPath: dotPath,
            key,
            value,
            maskedValue: maskValue(value),
            suggestedEnvVar: configPathToEnvName(dotPath),
            confidence: "medium",
            source: "key-name",
          });
        }
      }
    } else if (typeof value === "object" && value !== null) {
      walkConfig(value, dotPath, results);
    }
  }
};

const isAlreadyEnvRef = (value) =>
  /^\$\{[A-Z_][A-Z0-9_]*\}$/.test(String(value || "").trim());

const getEnvRefName = (value) => {
  const match = String(value || "")
    .trim()
    .match(/^\$\{([A-Z_][A-Z0-9_]*)\}$/);
  return match?.[1] || "";
};

const parseEnvFileSecrets = (content, fileName) => {
  const results = [];
  const lines = String(content || "").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    if (!key || !value) continue;
    results.push({
      configPath: `${fileName}:${key}`,
      key,
      value,
      maskedValue: maskValue(value),
      suggestedEnvVar: key,
      confidence: "high",
      source: "env-file",
      fileName,
    });
  }
  return results;
};

const detectSecrets = ({ fs, baseDir, configFiles = [], envFiles = [] }) => {
  const secrets = [];
  const seen = new Set();

  for (const cfgFile of configFiles) {
    try {
      const fullPath = path.join(baseDir, cfgFile);
      const raw = fs.readFileSync(fullPath, "utf8");
      const cfg = JSON.parse(raw);
      const configSecrets = [];
      walkConfig(cfg, "", configSecrets);
      for (const secret of configSecrets) {
        const dedupeKey = `${secret.suggestedEnvVar}:${secret.value}`;
        if (seen.has(dedupeKey)) continue;
        seen.add(dedupeKey);
        secrets.push({ ...secret, file: cfgFile });
      }
    } catch {}
  }

  for (const envFile of envFiles) {
    try {
      const fullPath = path.join(baseDir, envFile);
      const content = fs.readFileSync(fullPath, "utf8");
      const envSecrets = parseEnvFileSecrets(content, envFile);
      for (const secret of envSecrets) {
        const dedupeKey = `${secret.suggestedEnvVar}:${secret.value}`;
        if (seen.has(dedupeKey)) {
          const existing = secrets.find(
            (s) => s.suggestedEnvVar === secret.suggestedEnvVar,
          );
          if (existing) {
            existing.duplicateIn = envFile;
          }
          continue;
        }
        seen.add(dedupeKey);
        secrets.push({ ...secret, file: envFile });
      }
    } catch {}
  }

  return secrets;
};

const extractPreFillValues = ({ fs, baseDir, configFiles = [] }) => {
  const preFill = {};
  for (const cfgFile of configFiles) {
    try {
      const raw = fs.readFileSync(path.join(baseDir, cfgFile), "utf8");
      const cfg = JSON.parse(raw);
      const configFileName = path.basename(String(cfgFile || "")).toLowerCase();

      if (cfg.models?.active) preFill.MODEL_KEY = cfg.models.active;

      const providers = cfg.models?.providers || {};
      if (providers.anthropic?.apiKey && !isAlreadyEnvRef(providers.anthropic.apiKey)) {
        preFill.ANTHROPIC_API_KEY = providers.anthropic.apiKey;
      }
      if (providers.openai?.apiKey && !isAlreadyEnvRef(providers.openai.apiKey)) {
        preFill.OPENAI_API_KEY = providers.openai.apiKey;
      }
      if (providers.google?.apiKey && !isAlreadyEnvRef(providers.google.apiKey)) {
        preFill.GEMINI_API_KEY = providers.google.apiKey;
      }

      const channels =
        cfg.channels && typeof cfg.channels === "object"
          ? cfg.channels
          : configFileName.includes("channel")
            ? cfg
            : {};
      if (channels.telegram?.botToken && !isAlreadyEnvRef(channels.telegram.botToken)) {
        preFill.TELEGRAM_BOT_TOKEN = channels.telegram.botToken;
      }
      if (channels.discord?.token && !isAlreadyEnvRef(channels.discord.token)) {
        preFill.DISCORD_BOT_TOKEN = channels.discord.token;
      }
      const whatsAppAllowFrom = Array.isArray(channels.whatsapp?.allowFrom)
        ? channels.whatsapp.allowFrom
        : [];
      const whatsAppOwner = whatsAppAllowFrom.find(
        (v) => v && !isAlreadyEnvRef(String(v)),
      );
      if (whatsAppOwner) {
        preFill.WHATSAPP_OWNER_NUMBER = String(whatsAppOwner);
      }

      const braveKey = cfg.tools?.web?.search?.apiKey;
      if (braveKey && !isAlreadyEnvRef(braveKey)) {
        preFill.BRAVE_API_KEY = braveKey;
      }
    } catch {}
  }
  return preFill;
};

module.exports = {
  configPathToEnvName,
  detectSecrets,
  extractPreFillValues,
  getCanonicalEnvVarForConfigPath,
  getEnvRefName,
  isSensitiveKey,
  isAlreadyEnvRef,
  matchesValuePrefix,
  maskValue,
  parseEnvFileSecrets,
};
