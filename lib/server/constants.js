const os = require("os");
const path = require("path");
const kBrowseFilePolicies = require("../public/shared/browse-file-policies.json");
const { parsePositiveInt } = require("./utils/number");

// Portable root directory: --root-dir flag sets ALPHACLAW_ROOT_DIR before require
const kRootDir =
  process.env.ALPHACLAW_ROOT_DIR || path.join(os.homedir(), ".alphaclaw");
const kPackageRoot = path.resolve(__dirname, "..");
const kNpmPackageRoot = path.resolve(kPackageRoot, "..");
const kSetupDir = path.join(kPackageRoot, "setup");

const PORT = parseInt(process.env.PORT || "3000", 10);
const GATEWAY_PORT = 18789;
const GATEWAY_HOST = "127.0.0.1";
const GATEWAY_URL = `http://${GATEWAY_HOST}:${GATEWAY_PORT}`;
const OPENCLAW_DIR = path.join(kRootDir, ".openclaw");
const GATEWAY_TOKEN = process.env.OPENCLAW_GATEWAY_TOKEN || "";
const ENV_FILE_PATH = path.join(kRootDir, ".env");
const WORKSPACE_DIR = path.join(OPENCLAW_DIR, "workspace");
const AUTH_PROFILES_PATH = path.join(
  OPENCLAW_DIR,
  "agents",
  "main",
  "agent",
  "auth-profiles.json",
);
const CODEX_PROFILE_ID = "openai-codex:codex-cli";
const CODEX_OAUTH_CLIENT_ID = "app_EMoamEEZ73f0CkXaXp7hrann";
const CODEX_OAUTH_AUTHORIZE_URL = "https://auth.openai.com/oauth/authorize";
const CODEX_OAUTH_TOKEN_URL = "https://auth.openai.com/oauth/token";
const CODEX_OAUTH_REDIRECT_URI = "http://localhost:1455/auth/callback";
const CODEX_OAUTH_SCOPE = "openid profile email offline_access";
const CODEX_JWT_CLAIM_PATH = "https://api.openai.com/auth";
const kCodexOauthStateTtlMs = 10 * 60 * 1000;

const kTrustProxyHops = parsePositiveInt(process.env.TRUST_PROXY_HOPS, 1);
const kLoginWindowMs = parsePositiveInt(
  process.env.LOGIN_RATE_WINDOW_MS,
  10 * 60 * 1000,
);
const kLoginMaxAttempts = parsePositiveInt(
  process.env.LOGIN_RATE_MAX_ATTEMPTS,
  5,
);
const kLoginBaseLockMs = parsePositiveInt(
  process.env.LOGIN_RATE_BASE_LOCK_MS,
  60 * 1000,
);
const kLoginMaxLockMs = parsePositiveInt(
  process.env.LOGIN_RATE_MAX_LOCK_MS,
  15 * 60 * 1000,
);
const kLoginCleanupIntervalMs = parsePositiveInt(
  process.env.LOGIN_RATE_CLEANUP_INTERVAL_MS,
  60 * 1000,
);
const kLoginStateTtlMs = Math.max(
  parsePositiveInt(
    process.env.LOGIN_RATE_STATE_TTL_MS,
    Math.max(kLoginWindowMs, kLoginMaxLockMs) * 3,
  ),
  kLoginMaxLockMs,
);

const kOnboardingModelProviders = new Set([
  "anthropic",
  "openai",
  "openai-codex",
  "google",
]);
const kFallbackOnboardingModels = [
  {
    key: "anthropic/claude-opus-4-6",
    provider: "anthropic",
    label: "Claude Opus 4.6",
  },
  {
    key: "anthropic/claude-sonnet-4-6",
    provider: "anthropic",
    label: "Claude Sonnet 4.6",
  },
  {
    key: "anthropic/claude-haiku-4-6",
    provider: "anthropic",
    label: "Claude Haiku 4.6",
  },
  {
    key: "openai-codex/gpt-5.3-codex",
    provider: "openai-codex",
    label: "Codex GPT-5.3",
  },
  {
    key: "openai/gpt-5.1-codex",
    provider: "openai",
    label: "OpenAI GPT-5.1 Codex",
  },
  {
    key: "google/gemini-3-pro-preview",
    provider: "google",
    label: "Gemini 3 Pro Preview",
  },
  {
    key: "google/gemini-3-flash-preview",
    provider: "google",
    label: "Gemini 3 Flash Preview",
  },
];

const kVersionCacheTtlMs = 60 * 1000;
const kLatestVersionCacheTtlMs = 10 * 60 * 1000;
const kOpenclawRegistryUrl = "https://registry.npmjs.org/openclaw";
const kAlphaclawRegistryUrl = "https://registry.npmjs.org/@chrysb%2falphaclaw";
const kAppDir = kNpmPackageRoot;
const kMaxPayloadBytes = parsePositiveInt(process.env.WEBHOOK_LOG_MAX_BYTES, 50 * 1024);
const kWebhookPruneDays = parsePositiveInt(process.env.WEBHOOK_LOG_RETENTION_DAYS, 30);
const kWatchdogCheckIntervalMs =
  parsePositiveInt(process.env.WATCHDOG_CHECK_INTERVAL, 120) * 1000;
const kWatchdogDegradedCheckIntervalMs =
  parsePositiveInt(process.env.WATCHDOG_DEGRADED_CHECK_INTERVAL, 5) * 1000;
const kWatchdogStartupFailureThreshold = parsePositiveInt(
  process.env.WATCHDOG_STARTUP_FAILURE_THRESHOLD,
  3,
);
const kWatchdogMaxRepairAttempts = parsePositiveInt(
  process.env.WATCHDOG_MAX_REPAIR_ATTEMPTS,
  2,
);
const kWatchdogCrashLoopWindowMs =
  parsePositiveInt(process.env.WATCHDOG_CRASH_LOOP_WINDOW, 300) * 1000;
const kWatchdogCrashLoopThreshold = parsePositiveInt(
  process.env.WATCHDOG_CRASH_LOOP_THRESHOLD,
  3,
);
const kWatchdogLogRetentionDays = parsePositiveInt(
  process.env.WATCHDOG_LOG_RETENTION_DAYS,
  30,
);
const kLogMaxBytes = parsePositiveInt(
  process.env.LOG_MAX_BYTES,
  2 * 1024 * 1024,
);

const kSystemVars = new Set([
  "WEBHOOK_TOKEN",
  "OPENCLAW_GATEWAY_TOKEN",
  "SETUP_PASSWORD",
  "PORT",
  "WATCHDOG_AUTO_REPAIR",
  "WATCHDOG_NOTIFICATIONS_DISABLED",
]);
const kKnownVars = [
  {
    key: "ANTHROPIC_API_KEY",
    label: "Anthropic API Key",
    group: "ai",
    hint: "From console.anthropic.com",
    features: ["Models"],
  },
  {
    key: "ANTHROPIC_TOKEN",
    label: "Anthropic Setup Token",
    group: "ai",
    hint: "From claude setup-token",
    features: ["Models"],
    visibleInEnvars: false,
  },
  {
    key: "OPENAI_API_KEY",
    label: "OpenAI API Key",
    group: "ai",
    hint: "From platform.openai.com",
    features: ["Models", "Embeddings", "TTS", "STT"],
  },
  {
    key: "GEMINI_API_KEY",
    label: "Gemini API Key",
    group: "ai",
    hint: "From aistudio.google.com",
    features: ["Models", "Embeddings", "Image", "STT"],
  },
  {
    key: "ELEVENLABS_API_KEY",
    label: "ElevenLabs API Key",
    group: "ai",
    hint: "From elevenlabs.io (XI_API_KEY also works)",
    features: ["TTS"],
  },
  {
    key: "GITHUB_TOKEN",
    label: "GitHub Access Token",
    group: "github",
    hint: "Create one with repo scope at github.com/settings/tokens",
  },
  {
    key: "GITHUB_WORKSPACE_REPO",
    label: "Workspace Repo",
    group: "github",
    hint: "username/repo or https://github.com/username/repo",
  },
  {
    key: "TELEGRAM_BOT_TOKEN",
    label: "Telegram Bot Token",
    group: "channels",
    hint: "From @BotFather",
  },
  {
    key: "DISCORD_BOT_TOKEN",
    label: "Discord Bot Token",
    group: "channels",
    hint: "From Discord Developer Portal",
  },
  {
    key: "MISTRAL_API_KEY",
    label: "Mistral API Key",
    group: "ai",
    hint: "From console.mistral.ai",
    features: ["Models", "Embeddings", "STT"],
  },
  {
    key: "VOYAGE_API_KEY",
    label: "Voyage API Key",
    group: "ai",
    hint: "From dash.voyageai.com",
    features: ["Embeddings"],
  },
  {
    key: "GROQ_API_KEY",
    label: "Groq API Key",
    group: "ai",
    hint: "From console.groq.com",
    features: ["Models", "STT"],
  },
  {
    key: "DEEPGRAM_API_KEY",
    label: "Deepgram API Key",
    group: "ai",
    hint: "From console.deepgram.com",
    features: ["STT"],
  },
  {
    key: "BRAVE_API_KEY",
    label: "Brave Search API Key",
    group: "tools",
    hint: "From brave.com/search/api",
  },
];
const kKnownKeys = new Set(kKnownVars.map((v) => v.key));

const SCOPE_MAP = {
  "gmail:read": "https://www.googleapis.com/auth/gmail.readonly",
  "gmail:write": "https://www.googleapis.com/auth/gmail.modify",
  "calendar:read": "https://www.googleapis.com/auth/calendar.readonly",
  "calendar:write": "https://www.googleapis.com/auth/calendar",
  "tasks:read": "https://www.googleapis.com/auth/tasks.readonly",
  "tasks:write": "https://www.googleapis.com/auth/tasks",
  "docs:read": "https://www.googleapis.com/auth/documents.readonly",
  "docs:write": "https://www.googleapis.com/auth/documents",
  "meet:read": "https://www.googleapis.com/auth/meetings.space.readonly",
  "meet:write": "https://www.googleapis.com/auth/meetings.space.created",
  "drive:read": "https://www.googleapis.com/auth/drive.readonly",
  "drive:write": "https://www.googleapis.com/auth/drive",
  "contacts:read": "https://www.googleapis.com/auth/contacts.readonly",
  "contacts:write": "https://www.googleapis.com/auth/contacts",
  "sheets:read": "https://www.googleapis.com/auth/spreadsheets.readonly",
  "sheets:write": "https://www.googleapis.com/auth/spreadsheets",
};
const REVERSE_SCOPE_MAP = Object.fromEntries(
  Object.entries(SCOPE_MAP).map(([k, v]) => [v, k]),
);
const BASE_SCOPES = [
  "openid",
  "https://www.googleapis.com/auth/userinfo.email",
];

const GOG_CONFIG_DIR = path.join(OPENCLAW_DIR, "gogcli");
const GOG_CREDENTIALS_PATH = path.join(GOG_CONFIG_DIR, "credentials.json");
const GOG_STATE_PATH = path.join(GOG_CONFIG_DIR, "state.json");
const GOG_KEYRING_PASSWORD = process.env.GOG_KEYRING_PASSWORD || "alphaclaw";
const kMaxGoogleAccounts = 5;
const kGmailServeBasePort = parsePositiveInt(
  process.env.GMAIL_SERVE_BASE_PORT,
  18801,
);
const kGmailWatchRenewalIntervalMs =
  parsePositiveInt(process.env.GMAIL_WATCH_RENEWAL_INTERVAL_SECONDS, 6 * 60 * 60) *
  1000;
const kGmailWatchRenewalThresholdMs =
  parsePositiveInt(process.env.GMAIL_WATCH_RENEWAL_THRESHOLD_SECONDS, 24 * 60 * 60) *
  1000;
const kGmailMaxBodyBytes = parsePositiveInt(
  process.env.GMAIL_WATCH_MAX_BODY_BYTES,
  20000,
);
const gogClientCredentialsPath = (clientName = "default") =>
  clientName === "default"
    ? GOG_CREDENTIALS_PATH
    : path.join(GOG_CONFIG_DIR, `credentials-${clientName}.json`);

const API_TEST_COMMANDS = {
  gmail: "gmail labels list",
  calendar: "calendar calendars",
  tasks: "tasks lists",
  docs: "docs info __api_check__",
  meet: "meet spaces list",
  drive: "drive ls",
  contacts: "contacts list",
  sheets: "sheets metadata __api_check__",
};

const kChannelDefs = {
  telegram: { envKey: "TELEGRAM_BOT_TOKEN" },
  discord: { envKey: "DISCORD_BOT_TOKEN" },
};
const kProtectedBrowsePaths = new Set(
  Array.isArray(kBrowseFilePolicies?.protectedPaths)
    ? kBrowseFilePolicies.protectedPaths
    : [],
);
const kLockedBrowsePaths = new Set(
  Array.isArray(kBrowseFilePolicies?.lockedPaths)
    ? kBrowseFilePolicies.lockedPaths
    : [],
);

const SETUP_API_PREFIXES = [
  "/api/status",
  "/api/pairings",
  "/api/google",
  "/api/codex",
  "/api/models",
  "/api/browse",
  "/api/gateway",
  "/api/restart-status",
  "/api/onboard",
  "/api/env",
  "/api/auth",
  "/api/openclaw",
  "/api/devices",
  "/api/sync-cron",
  "/api/telegram",
  "/api/webhooks",
  "/api/gmail",
  "/api/watchdog",
  "/api/usage",
];

module.exports = {
  kRootDir,
  kPackageRoot,
  kNpmPackageRoot,
  kSetupDir,
  PORT,
  GATEWAY_PORT,
  GATEWAY_HOST,
  GATEWAY_URL,
  OPENCLAW_DIR,
  GATEWAY_TOKEN,
  ENV_FILE_PATH,
  WORKSPACE_DIR,
  AUTH_PROFILES_PATH,
  CODEX_PROFILE_ID,
  CODEX_OAUTH_CLIENT_ID,
  CODEX_OAUTH_AUTHORIZE_URL,
  CODEX_OAUTH_TOKEN_URL,
  CODEX_OAUTH_REDIRECT_URI,
  CODEX_OAUTH_SCOPE,
  CODEX_JWT_CLAIM_PATH,
  kCodexOauthStateTtlMs,
  kTrustProxyHops,
  kLoginWindowMs,
  kLoginMaxAttempts,
  kLoginBaseLockMs,
  kLoginMaxLockMs,
  kLoginCleanupIntervalMs,
  kLoginStateTtlMs,
  kOnboardingModelProviders,
  kFallbackOnboardingModels,
  kVersionCacheTtlMs,
  kLatestVersionCacheTtlMs,
  kOpenclawRegistryUrl,
  kAlphaclawRegistryUrl,
  kAppDir,
  kMaxPayloadBytes,
  kWebhookPruneDays,
  kWatchdogCheckIntervalMs,
  kWatchdogDegradedCheckIntervalMs,
  kWatchdogStartupFailureThreshold,
  kWatchdogMaxRepairAttempts,
  kWatchdogCrashLoopWindowMs,
  kWatchdogCrashLoopThreshold,
  kWatchdogLogRetentionDays,
  kLogMaxBytes,
  kSystemVars,
  kKnownVars,
  kKnownKeys,
  kProtectedBrowsePaths,
  kLockedBrowsePaths,
  SCOPE_MAP,
  REVERSE_SCOPE_MAP,
  BASE_SCOPES,
  GOG_CONFIG_DIR,
  GOG_CREDENTIALS_PATH,
  GOG_STATE_PATH,
  GOG_KEYRING_PASSWORD,
  kMaxGoogleAccounts,
  kGmailServeBasePort,
  kGmailWatchRenewalIntervalMs,
  kGmailWatchRenewalThresholdMs,
  kGmailMaxBodyBytes,
  gogClientCredentialsPath,
  API_TEST_COMMANDS,
  kChannelDefs,
  SETUP_API_PREFIXES,
};
