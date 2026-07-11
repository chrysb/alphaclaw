const fs = require("fs");
const { ENV_FILE_PATH, kKnownVars } = require("./constants");

const kSensitiveEnvKeyPattern = /token|key|password/i;
const kEnvWatchDebounceMs = 250;
let envWatchDebounceTimer = null;
let lastLoadedEnvSignature = null;
let pendingSelfWriteSignature = null;

const normalizeEnvVars = (vars) => {
  const byKey = new Map();
  for (const entry of vars || []) {
    const key = String(entry?.key || "").trim();
    if (!key) continue;
    if (byKey.has(key)) byKey.delete(key);
    byKey.set(key, {
      key,
      value: String(entry?.value || ""),
    });
  }
  return Array.from(byKey.values());
};

const buildEnvSignature = (vars) =>
  JSON.stringify(normalizeEnvVars(vars).map(({ key, value }) => [key, value]));

const readRawEnvFile = () => {
  const content = fs.readFileSync(ENV_FILE_PATH, "utf8");
  const vars = [];
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    vars.push({
      key: trimmed.slice(0, eqIdx).trim(),
      value: trimmed.slice(eqIdx + 1),
    });
  }
  return vars;
};

const readEnvFile = () => {
  try {
    return normalizeEnvVars(readRawEnvFile());
  } catch {
    return [];
  }
};

const writeEnvFile = (vars) => {
  const lines = [];
  const normalizedVars = normalizeEnvVars(vars);
  for (const { key, value } of normalizedVars) {
    lines.push(`${key}=${String(value || "")}`);
  }
  fs.writeFileSync(ENV_FILE_PATH, lines.join("\n"));
  pendingSelfWriteSignature = buildEnvSignature(normalizedVars);
};

const reloadEnv = () => {
  const vars = readEnvFile();
  const signature = buildEnvSignature(vars);
  const fileKeys = new Set(vars.map((v) => v.key));
  let changed = false;

  for (const { key, value } of vars) {
    if (value && value !== process.env[key]) {
      console.log(
        `[alphaclaw] Env updated: ${key}=${kSensitiveEnvKeyPattern.test(key) ? "***" : value}`,
      );
      process.env[key] = value;
      changed = true;
    } else if (!value && process.env[key]) {
      console.log(`[alphaclaw] Env cleared: ${key}`);
      delete process.env[key];
      changed = true;
    }
  }

  const allKnownKeys = kKnownVars.map((v) => v.key);
  for (const key of allKnownKeys) {
    if (!fileKeys.has(key) && process.env[key]) {
      console.log(`[alphaclaw] Env removed: ${key}`);
      delete process.env[key];
      changed = true;
    }
  }

  lastLoadedEnvSignature = signature;
  return changed;
};

const readEnvFileSignature = () => {
  try {
    return buildEnvSignature(readRawEnvFile());
  } catch {
    return null;
  }
};

const startEnvWatcher = () => {
  try {
    fs.watchFile(ENV_FILE_PATH, { interval: 2000 }, () => {
      if (envWatchDebounceTimer) clearTimeout(envWatchDebounceTimer);
      envWatchDebounceTimer = setTimeout(() => {
        envWatchDebounceTimer = null;
        const signature = readEnvFileSignature();
        if (signature && signature === pendingSelfWriteSignature) {
          pendingSelfWriteSignature = null;
          lastLoadedEnvSignature = signature;
          return;
        }
        pendingSelfWriteSignature = null;
        if (signature && signature === lastLoadedEnvSignature) return;
        console.log(
          `[alphaclaw] ${ENV_FILE_PATH} changed externally, reloading...`,
        );
        reloadEnv();
      }, kEnvWatchDebounceMs);
    });
  } catch {}
};

module.exports = {
  normalizeEnvVars,
  readEnvFile,
  writeEnvFile,
  reloadEnv,
  startEnvWatcher,
};
