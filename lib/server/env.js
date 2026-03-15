const fs = require("fs");
const { ENV_FILE_PATH, kKnownVars } = require("./constants");

const readEnvFile = () => {
  try {
    const content = fs.readFileSync(ENV_FILE_PATH, "utf8");
    const vars = [];
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      vars.push({
        key: trimmed.slice(0, eqIdx),
        value: trimmed.slice(eqIdx + 1),
      });
    }
    return vars;
  } catch {
    return [];
  }
};

const writeEnvFile = (vars) => {
  const lines = [];
  for (const { key, value } of vars || []) {
    if (!key) continue;
    lines.push(`${key}=${String(value || "")}`);
  }
  fs.writeFileSync(ENV_FILE_PATH, lines.join("\n"));
};

const reloadEnv = () => {
  const vars = readEnvFile();
  const fileKeys = new Set(vars.map((v) => v.key));
  let changed = false;

  for (const { key, value } of vars) {
    if (value && value !== process.env[key]) {
      console.log(
        `[alphaclaw] Env updated: ${key}=${key.toLowerCase().includes("token") || key.toLowerCase().includes("key") || key.toLowerCase().includes("password") ? "***" : value}`,
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

  return changed;
};

const startEnvWatcher = () => {
  try {
    fs.watchFile(ENV_FILE_PATH, { interval: 2000 }, () => {
      console.log(
        `[alphaclaw] ${ENV_FILE_PATH} changed externally, reloading...`,
      );
      reloadEnv();
    });
  } catch {}
};

module.exports = {
  readEnvFile,
  writeEnvFile,
  reloadEnv,
  startEnvWatcher,
};
