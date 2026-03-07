const path = require("path");
const { kSystemVars } = require("../constants");

const kWorkspaceFiles = [
  "AGENTS.md",
  "SOUL.md",
  "USER.md",
  "TOOLS.md",
  "MEMORY.md",
  "IDENTITY.md",
  "HEARTBEAT.md",
  "BOOTSTRAP.md",
  "IDEAS.md",
  "INTERESTS.md",
];

const kConfigLocations = [
  "openclaw.json",
  ".openclaw/openclaw.json",
  "openclaw.json5",
  ".openclaw/openclaw.json5",
];

const kEnvFileLocations = [
  ".env",
  ".env.local",
  ".env.production",
  ".env.development",
  ".openclaw/.env",
];

const kCredentialDirs = ["credentials", "identity", "devices", "gogcli"];

const kManagedFiles = [
  "hooks/bootstrap/AGENTS.md",
  "hooks/bootstrap/TOOLS.md",
  "cron/system-sync.json",
  ".gitignore",
];

const kManagedDirs = [".alphaclaw"];

const fileExists = (fs, filePath) => {
  try {
    return fs.statSync(filePath).isFile();
  } catch {
    return false;
  }
};

const dirExists = (fs, dirPath) => {
  try {
    return fs.statSync(dirPath).isDirectory();
  } catch {
    return false;
  }
};

const globDir = (fs, dirPath, pattern) => {
  const results = [];
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const subPath = path.join(dirPath, entry.name);
        const target = path.join(subPath, pattern);
        if (fileExists(fs, target)) {
          results.push(path.relative(dirPath, target));
        }
      }
    }
  } catch {}
  return results;
};

const listRootMarkdown = (fs, baseDir) => {
  const files = [];
  try {
    const entries = fs.readdirSync(baseDir, { withFileTypes: true });
    for (const entry of entries) {
      if (
        entry.isFile() &&
        entry.name.endsWith(".md") &&
        !kWorkspaceFiles.includes(entry.name)
      ) {
        files.push(entry.name);
      }
    }
  } catch {}
  return files;
};

const scanCategory = (fs, baseDir, relativePaths) => {
  const found = [];
  for (const rel of relativePaths) {
    if (fileExists(fs, path.join(baseDir, rel))) {
      found.push(rel);
    }
  }
  return { found: found.length > 0, files: found };
};

const scanDirCategory = (fs, baseDir, relativeDirs) => {
  const found = [];
  for (const rel of relativeDirs) {
    if (dirExists(fs, path.join(baseDir, rel))) {
      found.push(rel);
    }
  }
  return { found: found.length > 0, dirs: found };
};

const parseCronJobs = (fs, baseDir, cronFile) => {
  try {
    const raw = fs.readFileSync(path.join(baseDir, cronFile), "utf8");
    const parsed = JSON.parse(raw);
    const jobs = Array.isArray(parsed) ? parsed : parsed?.jobs;
    if (!Array.isArray(jobs)) return [];
    return jobs
      .filter((job) => job && typeof job === "object")
      .map((job, index) => {
        const name = String(job.name || "").trim();
        const id = String(job.id || "").trim();
        return name || id || `Job ${index + 1}`;
      });
  } catch {
    return [];
  }
};

const parseHookDefinitions = (fs, baseDir, configFiles) => {
  const hookNames = [];
  const transformWarnings = [];
  const seen = new Set();
  const normalizeHookPath = (value) => String(value || "").trim().replace(/^\/+/, "");
  const normalizeTransformModulePath = (value) =>
    String(value || "")
      .trim()
      .replace(/^\/+/, "")
      .replace(/^hooks\/transforms\/+/, "");

  const addHookName = (value) => {
    const name = String(value || "").trim();
    if (!name || seen.has(name)) return;
    seen.add(name);
    hookNames.push(name);
    return name;
  };

  for (const configFile of configFiles) {
    try {
      const raw = fs.readFileSync(path.join(baseDir, configFile), "utf8");
      const cfg = JSON.parse(raw);
      const mappings = Array.isArray(cfg?.hooks?.mappings) ? cfg.hooks.mappings : [];
      mappings.forEach((mapping, index) => {
        const name = String(
          mapping?.name || mapping?.id || mapping?.match?.path || `Hook ${index + 1}`,
        ).trim();
        const matchPath = normalizeHookPath(mapping?.match?.path);
        const hookLabel = addHookName(matchPath ? `${name} (${matchPath})` : name);
        if (matchPath) {
          const actualModule = normalizeTransformModulePath(
            mapping?.transform?.module,
          );
          const expectedModule = `${matchPath}/${matchPath}-transform.mjs`;
          if (hookLabel && actualModule && actualModule !== expectedModule) {
            transformWarnings.push(
              {
                hookLabel,
                actualPath: `hooks/transforms/${actualModule}`,
                expectedPath: `hooks/transforms/${expectedModule}`,
                message: `Uses hooks/transforms/${actualModule}; expected hooks/transforms/${expectedModule}`,
              },
            );
          }
        }
      });

      const internalEntries = cfg?.hooks?.internal?.entries;
      if (internalEntries && typeof internalEntries === "object") {
        for (const [key, entry] of Object.entries(internalEntries)) {
          const enabled = entry?.enabled;
          addHookName(
            enabled === false ? `internal:${key} (disabled)` : `internal:${key}`,
          );
        }
      }
    } catch {}
  }

  return { hookNames, transformWarnings };
};

const resolveConfigIncludes = (fs, baseDir, configPath) => {
  const extras = [];
  try {
    const raw = fs.readFileSync(path.join(baseDir, configPath), "utf8");
    const cfg = JSON.parse(raw);
    const walk = (obj) => {
      if (!obj || typeof obj !== "object") return;
      for (const [key, val] of Object.entries(obj)) {
        if (key === "$include" && typeof val === "string") {
          extras.push(val);
        } else if (typeof val === "object") {
          walk(val);
        }
      }
    };
    walk(cfg);
  } catch {}
  return extras;
};

const kEnvRefPattern = /\$\{([A-Z_][A-Z0-9_]*)\}/g;

const collectManagedEnvRefs = (value, found) => {
  if (typeof value === "string") {
    for (const match of value.matchAll(kEnvRefPattern)) {
      const envKey = match[1];
      if (kSystemVars.has(envKey)) {
        found.add(envKey);
      }
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((entry) => collectManagedEnvRefs(entry, found));
    return;
  }
  if (value && typeof value === "object") {
    Object.values(value).forEach((entry) => collectManagedEnvRefs(entry, found));
  }
};

const collectManagedEnvConflicts = (fs, baseDir, configFiles, envFiles) => {
  const managedVars = new Set();
  let gatewayAuthNormalized = false;

  for (const configFile of configFiles) {
    try {
      const raw = fs.readFileSync(path.join(baseDir, configFile), "utf8");
      const cfg = JSON.parse(raw);
      collectManagedEnvRefs(cfg, managedVars);
      const gatewayToken = String(cfg?.gateway?.auth?.token || "").trim();
      if (gatewayToken && gatewayToken !== "${OPENCLAW_GATEWAY_TOKEN}") {
        gatewayAuthNormalized = true;
        managedVars.add("OPENCLAW_GATEWAY_TOKEN");
      }
    } catch {}
  }

  for (const envFile of envFiles) {
    try {
      const raw = fs.readFileSync(path.join(baseDir, envFile), "utf8");
      for (const line of String(raw || "").split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eqIndex = trimmed.indexOf("=");
        if (eqIndex === -1) continue;
        const key = trimmed.slice(0, eqIndex).trim();
        if (kSystemVars.has(key)) {
          managedVars.add(key);
        }
      }
    } catch {}
  }

  return {
    found: managedVars.size > 0 || gatewayAuthNormalized,
    vars: [...managedVars].sort(),
    gatewayAuthNormalized,
  };
};

const scanWorkspace = ({ fs, baseDir }) => {
  const gatewayConfig = scanCategory(fs, baseDir, kConfigLocations);
  for (const cfgFile of gatewayConfig.files) {
    const includes = resolveConfigIncludes(fs, baseDir, cfgFile);
    for (const inc of includes) {
      if (fileExists(fs, path.join(baseDir, inc)) && !gatewayConfig.files.includes(inc)) {
        gatewayConfig.files.push(inc);
      }
    }
  }
  for (const loc of kConfigLocations) {
    const bakPath = `${loc}.bak`;
    if (fileExists(fs, path.join(baseDir, bakPath))) {
      if (!gatewayConfig.backups) gatewayConfig.backups = [];
      gatewayConfig.backups.push(bakPath);
    }
  }

  const envFiles = scanCategory(fs, baseDir, kEnvFileLocations);

  const workspaceFilesScan = scanCategory(fs, baseDir, kWorkspaceFiles);
  const extraMarkdown = listRootMarkdown(fs, baseDir);
  const workspaceFiles = {
    found: workspaceFilesScan.found || extraMarkdown.length > 0,
    files: workspaceFilesScan.files,
    extraMarkdown,
  };

  const workspaceDir = path.join(baseDir, "workspace");
  const skillsBase = dirExists(fs, path.join(workspaceDir, "skills"))
    ? path.join(workspaceDir, "skills")
    : dirExists(fs, path.join(baseDir, "skills"))
      ? path.join(baseDir, "skills")
      : null;
  const skillFiles = skillsBase ? globDir(fs, skillsBase, "SKILL.md") : [];
  const skills = { found: skillFiles.length > 0, files: skillFiles };

  const cronJobs = scanCategory(fs, baseDir, [
    "cron/jobs.json",
    "config/cron-definitions.json",
  ]);
  const cronJobNames = [];
  for (const cronFile of cronJobs.files) {
    for (const jobName of parseCronJobs(fs, baseDir, cronFile)) {
      cronJobNames.push(jobName);
    }
  }
  cronJobs.jobNames = cronJobNames;
  cronJobs.jobCount = cronJobNames.length;
  cronJobs.found = cronJobs.found || cronJobNames.length > 0;
  if (fileExists(fs, path.join(baseDir, "cron/jobs.json.bak"))) {
    cronJobs.backups = ["cron/jobs.json.bak"];
  }

  const hooksTransformsDir = path.join(baseDir, "hooks", "transforms");
  const webhookDirs = [];
  if (dirExists(fs, hooksTransformsDir)) {
    try {
      const entries = fs.readdirSync(hooksTransformsDir, {
        withFileTypes: true,
      });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          webhookDirs.push(`hooks/transforms/${entry.name}`);
        }
      }
    } catch {}
  }
  const { hookNames, transformWarnings } = parseHookDefinitions(
    fs,
    baseDir,
    gatewayConfig.files,
  );
  const webhooks = {
    found: webhookDirs.length > 0 || hookNames.length > 0,
    dirs: webhookDirs,
    hookNames,
    hookCount: hookNames.length,
    transformWarnings,
    warningCount: transformWarnings.length,
  };

  const memory = scanDirCategory(fs, baseDir, ["memory"]);

  const credentials = scanDirCategory(fs, baseDir, kCredentialDirs);

  const managedFileConflicts = scanCategory(fs, baseDir, kManagedFiles);
  const managedDirConflicts = scanDirCategory(fs, baseDir, kManagedDirs);
  const managedConflicts = {
    found: managedFileConflicts.found || managedDirConflicts.found,
    files: managedFileConflicts.files,
    dirs: managedDirConflicts.dirs || [],
  };
  const managedEnvConflicts = collectManagedEnvConflicts(
    fs,
    baseDir,
    gatewayConfig.files,
    envFiles.files,
  );

  const hasOpenclawSetup = gatewayConfig.found;
  const isEmpty =
    !gatewayConfig.found &&
    !envFiles.found &&
    !workspaceFiles.found &&
    !skills.found;

  return {
    hasOpenclawSetup,
    isEmpty,
    gatewayConfig,
    envFiles,
    workspaceFiles,
    skills,
    cronJobs,
    webhooks,
    memory,
    credentials,
    managedConflicts,
    managedEnvConflicts,
  };
};

module.exports = { scanWorkspace };
