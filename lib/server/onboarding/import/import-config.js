const path = require("path");

const normalizeHookPath = (value) =>
  String(value || "")
    .trim()
    .replace(/^\/+/, "");

const normalizeTransformModulePath = (value) =>
  String(value || "")
    .trim()
    .replace(/^\/+/, "")
    .replace(/^hooks\/transforms\/+/, "");

const resolveConfigIncludes = ({ fs, absoluteConfigPath }) => {
  const includes = [];
  try {
    const raw = fs.readFileSync(absoluteConfigPath, "utf8");
    const cfg = JSON.parse(raw);
    const walk = (entry) => {
      if (!entry || typeof entry !== "object") return;
      for (const [key, value] of Object.entries(entry)) {
        if (key === "$include" && typeof value === "string" && value.trim()) {
          includes.push(value.trim());
          continue;
        }
        walk(value);
      }
    };
    walk(cfg);
  } catch {}
  return includes;
};

const resolveImportedConfigPaths = ({ fs, openclawDir }) => {
  const discovered = new Set();
  const queue = [path.join(openclawDir, "openclaw.json")].filter((configPath) =>
    fs.existsSync(configPath),
  );

  while (queue.length > 0) {
    const absoluteConfigPath = queue.shift();
    if (!absoluteConfigPath || discovered.has(absoluteConfigPath)) continue;
    if (!fs.existsSync(absoluteConfigPath)) continue;
    discovered.add(absoluteConfigPath);

    const includes = resolveConfigIncludes({ fs, absoluteConfigPath });
    for (const includePath of includes) {
      const candidatePaths = [
        path.join(openclawDir, includePath),
        path.join(path.dirname(absoluteConfigPath), includePath),
      ];
      for (const candidatePath of candidatePaths) {
        if (fs.existsSync(candidatePath) && !discovered.has(candidatePath)) {
          queue.push(candidatePath);
          break;
        }
      }
    }
  }

  return [...discovered];
};

module.exports = {
  normalizeHookPath,
  normalizeTransformModulePath,
  resolveConfigIncludes,
  resolveImportedConfigPaths,
};
