const path = require("path");
const { isValidImportTempDir } = require("./import-temp");
const {
  normalizeHookPath,
  normalizeTransformModulePath,
} = require("./import-config");
const {
  getCanonicalEnvVarForConfigPath,
  getEnvRefName,
  isAlreadyEnvRef,
} = require("./secret-detector");

const kEnvVarNamePattern = /^[A-Z_][A-Z0-9_]*$/;

const isValidTempDir = (tempDir) => isValidImportTempDir(tempDir);

const kTransformsRoot = path.join("hooks", "transforms");
const kTransformsBackupRoot = path.join(kTransformsRoot, "_backup");

const kReplaceableBootstrapPaths = [
  ".env",
  ".alphaclaw",
  "gogcli",
  path.join("workspace", "hooks", "bootstrap"),
  path.join("skills", "gog-cli"),
];

const removeIfExists = (fs, targetPath) => {
  try {
    if (fs.existsSync(targetPath)) {
      fs.rmSync(targetPath, { recursive: true, force: true });
    }
  } catch {}
};

const removeEmptyParents = (fs, rootDir, targetPath) => {
  let current = path.dirname(targetPath);
  while (current.startsWith(rootDir) && current !== rootDir) {
    try {
      const entries = fs.readdirSync(current);
      if (entries.length > 0) break;
      fs.rmSync(current, { recursive: true, force: true });
      current = path.dirname(current);
    } catch {
      break;
    }
  }
};

const cleanupBootstrapArtifacts = (fs, openclawDir) => {
  for (const relPath of kReplaceableBootstrapPaths) {
    const absolutePath = path.join(openclawDir, relPath);
    removeIfExists(fs, absolutePath);
    removeEmptyParents(fs, openclawDir, absolutePath);
  }
};

const promoteCloneToTarget = ({
  fs,
  tempDir,
  targetDir,
  sourceSubdir = "",
  cleanupBootstrap = false,
}) => {
  if (!isValidTempDir(tempDir)) {
    return { ok: false, error: "Invalid temp directory" };
  }

  const sourceDir = sourceSubdir ? path.join(tempDir, sourceSubdir) : tempDir;

  try {
    if (!fs.existsSync(sourceDir)) {
      return { ok: false, error: "Import source directory not found" };
    }
    if (fs.existsSync(targetDir)) {
      if (cleanupBootstrap) {
        cleanupBootstrapArtifacts(fs, targetDir);
      }
      const existingEntries = fs.readdirSync(targetDir);
      if (existingEntries.length > 0) {
        return {
          ok: false,
          error: "Import target directory already exists and is not empty",
        };
      }
      fs.rmSync(targetDir, { recursive: true, force: true });
    }
    fs.mkdirSync(path.dirname(targetDir), { recursive: true });
    fs.renameSync(sourceDir, targetDir);
    if (sourceDir !== tempDir) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
    console.log(`[import] Promoted ${sourceDir} to ${targetDir}`);
    return { ok: true };
  } catch (e) {
    // Cross-device rename falls back to copy
    if (e.code === "EXDEV") {
      try {
        copyDirRecursive(fs, sourceDir, targetDir);
        fs.rmSync(tempDir, { recursive: true, force: true });
        console.log(
          `[import] Copied ${sourceDir} to ${targetDir} (cross-device)`,
        );
        return { ok: true };
      } catch (copyErr) {
        return { ok: false, error: `Failed to copy clone: ${copyErr.message}` };
      }
    }
    return { ok: false, error: `Failed to promote clone: ${e.message}` };
  }
};

const copyDirRecursive = (fs, src, dest) => {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(fs, srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
};

const toPosixPath = (value) => String(value || "").replace(/\\/g, "/");
const ensureRelativeImportPath = (value) => {
  const normalized = toPosixPath(value);
  if (normalized.startsWith(".")) return normalized;
  return `./${normalized}`;
};
const pathExists = (fs, targetPath) => {
  try {
    return fs.existsSync(targetPath);
  } catch {
    return false;
  }
};

const resolveExtractionTargetPath = (baseDir, file) => {
  const relativeFile = String(file || "").trim();
  if (!relativeFile || path.isAbsolute(relativeFile)) return "";
  const resolvedBaseDir = path.resolve(baseDir);
  const resolvedFilePath = path.resolve(resolvedBaseDir, relativeFile);
  if (
    resolvedFilePath !== resolvedBaseDir &&
    !resolvedFilePath.startsWith(`${resolvedBaseDir}${path.sep}`)
  ) {
    return "";
  }
  return resolvedFilePath;
};
const isConfigPathIndex = (segment) => /^\d+$/.test(String(segment || ""));
const setConfigValueAtPath = ({
  root,
  dotPath,
  expectedValue,
  nextValue,
}) => {
  const pathSegments = String(dotPath || "")
    .split(".")
    .filter(Boolean);
  if (!root || typeof root !== "object" || pathSegments.length === 0) {
    return false;
  }

  let current = root;
  for (let index = 0; index < pathSegments.length - 1; index += 1) {
    const segment = pathSegments[index];
    const nextNode = isConfigPathIndex(segment)
      ? current?.[Number(segment)]
      : current?.[segment];
    if (!nextNode || typeof nextNode !== "object") {
      return false;
    }
    current = nextNode;
  }

  const lastSegment = pathSegments[pathSegments.length - 1];
  const targetKey = isConfigPathIndex(lastSegment)
    ? Number(lastSegment)
    : lastSegment;
  if (typeof current?.[targetKey] !== "string") return false;
  if (current[targetKey] !== expectedValue) return false;
  current[targetKey] = nextValue;
  return true;
};
const movePath = (fs, src, dest) => {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  try {
    fs.renameSync(src, dest);
    return;
  } catch (error) {
    if (error?.code !== "EXDEV") throw error;
  }
  const stats = fs.statSync(src);
  if (stats.isDirectory()) {
    copyDirRecursive(fs, src, dest);
    fs.rmSync(src, { recursive: true, force: true });
    return;
  }
  fs.copyFileSync(src, dest);
  fs.rmSync(src, { force: true });
};
const buildTransformShim = (targetImportPath) =>
  [
    `export { default } from ${JSON.stringify(targetImportPath)};`,
    `export * from ${JSON.stringify(targetImportPath)};`,
    "",
  ].join("\n");

const alignHookTransforms = ({ fs, baseDir, configFiles = [] }) => {
  const movedRoots = new Map();
  let alignedCount = 0;

  for (const configFile of configFiles) {
    const fullConfigPath = path.join(baseDir, configFile);
    let cfg = null;
    try {
      cfg = JSON.parse(fs.readFileSync(fullConfigPath, "utf8"));
    } catch {
      continue;
    }
    const mappings = Array.isArray(cfg?.hooks?.mappings)
      ? cfg.hooks.mappings
      : [];
    let changed = false;

    mappings.forEach((mapping, index) => {
      const hookPath = normalizeHookPath(mapping?.match?.path);
      const actualModule = normalizeTransformModulePath(
        mapping?.transform?.module,
      );
      if (!hookPath) return;
      if (mapping?.match?.path !== hookPath) {
        mappings[index] = {
          ...mapping,
          match: {
            ...(mapping?.match || {}),
            path: hookPath,
          },
        };
        changed = true;
      }
      if (!actualModule) return;

      const expectedModule = `${hookPath}/${hookPath}-transform.mjs`;
      if (actualModule === expectedModule) return;

      const actualRelativePath = path.join(kTransformsRoot, actualModule);
      const expectedRelativePath = path.join(kTransformsRoot, expectedModule);
      const actualAbsolutePath = path.join(baseDir, actualRelativePath);
      const expectedAbsolutePath = path.join(baseDir, expectedRelativePath);
      if (!pathExists(fs, actualAbsolutePath)) return;

      const actualParts = actualModule.split("/").filter(Boolean);
      const sourceRootRelativePath =
        actualParts.length > 1
          ? path.join(kTransformsRoot, actualParts[0])
          : actualRelativePath;
      const sourceRootAbsolutePath = path.join(baseDir, sourceRootRelativePath);
      const backupRootRelativePath = path.join(
        kTransformsBackupRoot,
        sourceRootRelativePath.slice(kTransformsRoot.length + 1),
      );
      const backupRootAbsolutePath = path.join(baseDir, backupRootRelativePath);

      if (!movedRoots.has(sourceRootAbsolutePath)) {
        if (
          !pathExists(fs, backupRootAbsolutePath) &&
          pathExists(fs, sourceRootAbsolutePath)
        ) {
          movePath(fs, sourceRootAbsolutePath, backupRootAbsolutePath);
        }
        movedRoots.set(sourceRootAbsolutePath, backupRootAbsolutePath);
      }

      const backupActualAbsolutePath = path.join(
        movedRoots.get(sourceRootAbsolutePath),
        path.relative(sourceRootAbsolutePath, actualAbsolutePath),
      );

      fs.mkdirSync(path.dirname(expectedAbsolutePath), { recursive: true });
      const shimImportPath = ensureRelativeImportPath(
        path.relative(
          path.dirname(expectedAbsolutePath),
          backupActualAbsolutePath,
        ),
      );
      fs.writeFileSync(
        expectedAbsolutePath,
        buildTransformShim(shimImportPath),
      );

      const currentMapping = mappings[index] || mapping;
      mappings[index] = {
        ...currentMapping,
        transform: {
          ...(currentMapping?.transform || {}),
          module: expectedModule,
        },
      };
      changed = true;
      alignedCount += 1;
    });

    if (changed) {
      fs.writeFileSync(fullConfigPath, JSON.stringify(cfg, null, 2));
    }
  }

  return { alignedCount };
};

const applySecretExtraction = ({ fs, baseDir, approvedSecrets }) => {
  const envVars = [];
  const rewriteMap = new Map();

  for (const secret of approvedSecrets) {
    const envVar = String(secret.suggestedEnvVar || "").trim();
    const value = String(secret.value || "").trim();
    if (!envVar || !value || !kEnvVarNamePattern.test(envVar)) continue;

    envVars.push({ key: envVar, value });

    if (secret.file && !secret.file.startsWith(".env")) {
      const fullPath = resolveExtractionTargetPath(baseDir, secret.file);
      if (!fullPath) continue;
      if (!rewriteMap.has(fullPath)) {
        rewriteMap.set(fullPath, []);
      }
      rewriteMap.get(fullPath).push({
        configPath: secret.configPath,
        value,
        envRef: `\${${envVar}}`,
        relativeFile: secret.file,
      });
    }
  }

  for (const [fullPath, replacements] of rewriteMap) {
    try {
      let content = fs.readFileSync(fullPath, "utf8");
      let parsed = null;
      try {
        parsed = JSON.parse(content);
      } catch {}
      const sorted = [...replacements].sort(
        (a, b) => b.value.length - a.value.length,
      );
      let structuredChanged = false;
      if (parsed && typeof parsed === "object") {
        for (const { configPath, value, envRef } of sorted) {
          if (
            setConfigValueAtPath({
              root: parsed,
              dotPath: configPath,
              expectedValue: value,
              nextValue: envRef,
            })
          ) {
            structuredChanged = true;
          }
        }
      }
      if (structuredChanged) {
        content = JSON.stringify(parsed, null, 2);
      }
      for (const { value, envRef } of sorted) {
        const secretJson = JSON.stringify(value);
        const envRefJson = JSON.stringify(envRef);
        content = content.replace(
          new RegExp(secretJson.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&"), "g"),
          envRefJson,
        );
      }
      fs.writeFileSync(fullPath, content);
      console.log(
        `[import] Rewrote secrets in ${replacements[0]?.relativeFile || fullPath}`,
      );
    } catch (e) {
      console.error(`[import] Rewrite error for ${fullPath}: ${e.message}`);
    }
  }

  return { envVars };
};

const remapEnvVars = (envVars, renameMap) => {
  const mapped = [];
  for (const entry of envVars) {
    const key = String(entry?.key || "").trim();
    if (!key) continue;
    const nextKey = renameMap.get(key) || key;
    const existing = mapped.find((item) => item.key === nextKey);
    if (existing) {
      existing.value = entry.value;
    } else {
      mapped.push({ key: nextKey, value: entry.value });
    }
  }
  return mapped;
};

const canonicalizeConfigEnvRefs = ({ fs, baseDir, configFiles = [], envVars = [] }) => {
  const renameMap = new Map();
  let rewrittenRefs = 0;

  const rewriteNode = (node, parentPath = "") => {
    if (!node || typeof node !== "object") return false;
    let changed = false;
    for (const [key, value] of Object.entries(node)) {
      const dotPath = parentPath ? `${parentPath}.${key}` : key;
      if (typeof value === "string" && isAlreadyEnvRef(value)) {
        const currentEnvRef = getEnvRefName(value);
        const canonicalEnvVar = getCanonicalEnvVarForConfigPath(dotPath);
        if (canonicalEnvVar && currentEnvRef && currentEnvRef !== canonicalEnvVar) {
          node[key] = `\${${canonicalEnvVar}}`;
          renameMap.set(currentEnvRef, canonicalEnvVar);
          rewrittenRefs += 1;
          changed = true;
        }
        continue;
      }
      if (value && typeof value === "object") {
        changed = rewriteNode(value, dotPath) || changed;
      }
    }
    return changed;
  };

  for (const configFile of configFiles) {
    const fullPath = resolveExtractionTargetPath(baseDir, configFile);
    if (!fullPath) continue;
    try {
      const parsed = JSON.parse(fs.readFileSync(fullPath, "utf8"));
      if (!parsed || typeof parsed !== "object") continue;
      const changed = rewriteNode(parsed);
      if (changed) {
        fs.writeFileSync(fullPath, JSON.stringify(parsed, null, 2));
      }
    } catch {}
  }

  return {
    envVars: remapEnvVars(envVars, renameMap),
    rewrittenRefs,
    renamedEnvVars: renameMap.size,
  };
};

module.exports = {
  promoteCloneToTarget,
  alignHookTransforms,
  applySecretExtraction,
  canonicalizeConfigEnvRefs,
  isValidTempDir,
};
