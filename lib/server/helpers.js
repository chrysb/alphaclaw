const fs = require("fs");
const crypto = require("crypto");
const {
  CODEX_JWT_CLAIM_PATH,
  kOnboardingModelProviders,
  GOG_CREDENTIALS_PATH,
} = require("./constants");

const normalizeOpenclawVersion = (rawVersion) => {
  if (!rawVersion) return null;
  return String(rawVersion).trim().replace(/^openclaw\s*/i, "") || null;
};

const compareVersionParts = (a, b) => {
  const aParts = String(a || "")
    .split(".")
    .map((part) => Number.parseInt(part, 10) || 0);
  const bParts = String(b || "")
    .split(".")
    .map((part) => Number.parseInt(part, 10) || 0);
  const maxParts = Math.max(aParts.length, bParts.length);
  for (let i = 0; i < maxParts; i += 1) {
    const aPart = aParts[i] ?? 0;
    const bPart = bParts[i] ?? 0;
    if (aPart > bPart) return 1;
    if (aPart < bPart) return -1;
  }
  return 0;
};

const parseJsonFromNoisyOutput = (raw) => {
  const text = String(raw || "");
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    return null;
  }
  try {
    return JSON.parse(text.slice(firstBrace, lastBrace + 1));
  } catch {
    return null;
  }
};

const parseJwtPayload = (token) => {
  try {
    const parts = String(token || "").split(".");
    if (parts.length !== 3) return null;
    return JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
  } catch {
    return null;
  }
};

const getCodexAccountId = (accessToken) => {
  const payload = parseJwtPayload(accessToken);
  const auth = payload?.[CODEX_JWT_CLAIM_PATH];
  const accountId = auth?.chatgpt_account_id;
  return typeof accountId === "string" && accountId ? accountId : null;
};

const normalizeIp = (ip) => String(ip || "").replace(/^::ffff:/, "");

const isTruthyEnvFlag = (value) =>
  ["1", "true", "yes", "on"].includes(String(value || "").trim().toLowerCase());

const getClientKey = (req) =>
  normalizeIp(
    req.ip || req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "",
  ) || "unknown";

const resolveGithubRepoUrl = (repoInput) => {
  const cleaned = String(repoInput || "")
    .trim()
    .replace(/^git@github\.com:/, "")
    .replace(/^https:\/\/github\.com\//, "")
    .replace(/\.git$/, "");
  if (!cleaned) return "";
  if (!cleaned.includes("/")) {
    throw new Error('GITHUB_WORKSPACE_REPO must be in "owner/repo" format.');
  }
  return cleaned;
};

const createPkcePair = () => {
  const verifier = crypto.randomBytes(48).toString("base64url");
  const challenge = crypto
    .createHash("sha256")
    .update(verifier)
    .digest("base64url");
  return { verifier, challenge };
};

const resolveModelProvider = (modelKey) =>
  String(modelKey || "").split("/")[0] || "";

const parseCodexAuthorizationInput = (input) => {
  const value = String(input || "").trim();
  if (!value) return {};
  try {
    const url = new URL(value);
    return {
      code: url.searchParams.get("code") || "",
      state: url.searchParams.get("state") || "",
    };
  } catch {}
  if (value.includes("#")) {
    const [code, state] = value.split("#", 2);
    return { code: code || "", state: state || "" };
  }
  if (value.includes("code=")) {
    const params = new URLSearchParams(value);
    return {
      code: params.get("code") || "",
      state: params.get("state") || "",
    };
  }
  return { code: value, state: "" };
};

const normalizeOnboardingModels = (models) => {
  const deduped = new Map();
  for (const model of models || []) {
    if (!model?.key || typeof model.key !== "string") continue;
    const provider = resolveModelProvider(model.key);
    if (!kOnboardingModelProviders.has(provider)) continue;
    if (!deduped.has(model.key)) {
      deduped.set(model.key, {
        key: model.key,
        provider,
        label: model.name || model.key,
      });
    }
  }
  return Array.from(deduped.values()).sort((a, b) =>
    a.key.localeCompare(b.key),
  );
};

const getBaseUrl = (req) => {
  const proto = req.headers["x-forwarded-proto"] || req.protocol || "https";
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  return `${proto}://${host}`;
};

const getApiEnableUrl = (svc, projectId) => {
  const apiMap = {
    gmail: "gmail.googleapis.com",
    calendar: "calendar-json.googleapis.com",
    tasks: "tasks.googleapis.com",
    docs: "docs.googleapis.com",
    meet: "meet.googleapis.com",
    drive: "drive.googleapis.com",
    contacts: "people.googleapis.com",
    sheets: "sheets.googleapis.com",
  };
  const api = apiMap[svc] || "";
  const project = projectId ? `?project=${projectId}` : "";
  return `https://console.developers.google.com/apis/api/${api}/overview${project}`;
};

const readGoogleCredentials = () => {
  try {
    const c = JSON.parse(fs.readFileSync(GOG_CREDENTIALS_PATH, "utf8"));
    return {
      clientId: c.web?.client_id || c.installed?.client_id || c.client_id || null,
      clientSecret:
        c.web?.client_secret || c.installed?.client_secret || c.client_secret || null,
    };
  } catch {
    return { clientId: null, clientSecret: null };
  }
};

module.exports = {
  normalizeOpenclawVersion,
  compareVersionParts,
  parseJsonFromNoisyOutput,
  parseJwtPayload,
  getCodexAccountId,
  normalizeIp,
  isTruthyEnvFlag,
  getClientKey,
  resolveGithubRepoUrl,
  createPkcePair,
  resolveModelProvider,
  parseCodexAuthorizationInput,
  normalizeOnboardingModels,
  getBaseUrl,
  getApiEnableUrl,
  readGoogleCredentials,
};
