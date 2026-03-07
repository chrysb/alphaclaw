const path = require("path");
const os = require("os");

const isValidTempDir = (tempDir) =>
  typeof tempDir === "string" &&
  tempDir.startsWith(os.tmpdir()) &&
  tempDir.includes("alphaclaw-import-");

const kTransformsRoot = path.join("hooks", "transforms");
const kTransformsBackupRoot = path.join(kTransformsRoot, "_backup");

const kReplaceableBootstrapPaths = [
  ".env",
  ".alphaclaw",
  "gogcli",
  path.join("workspace", "hooks", "bootstrap"),
  path.join("skills", "control-ui"),
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

const promoteCloneToWorkspace = ({ fs, tempDir, openclawDir }) => {
  if (!isValidTempDir(tempDir)) {
    return { ok: false, error: "Invalid temp directory" };
  }

  try {
    if (fs.existsSync(openclawDir)) {
      cleanupBootstrapArtifacts(fs, openclawDir);
      const existingEntries = fs.readdirSync(openclawDir);
      if (existingEntries.length > 0) {
        return {
          ok: false,
          error: "OpenClaw directory already exists and is not empty",
        };
      }
      fs.rmSync(openclawDir, { recursive: true, force: true });
    }
    fs.mkdirSync(path.dirname(openclawDir), { recursive: true });
    fs.renameSync(tempDir, openclawDir);
    console.log(`[import] Promoted ${tempDir} to ${openclawDir}`);
    return { ok: true };
  } catch (e) {
    // Cross-device rename falls back to copy
    if (e.code === "EXDEV") {
      try {
        copyDirRecursive(fs, tempDir, openclawDir);
        fs.rmSync(tempDir, { recursive: true, force: true });
        console.log(`[import] Copied ${tempDir} to ${openclawDir} (cross-device)`);
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

const normalizeHookPath = (value) => String(value || "").trim().replace(/^\/+/, "");
const normalizeTransformModulePath = (value) =>
  String(value || "")
    .trim()
    .replace(/^\/+/, "")
    .replace(/^hooks\/transforms\/+/, "");
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
    const mappings = Array.isArray(cfg?.hooks?.mappings) ? cfg.hooks.mappings : [];
    let changed = false;

    mappings.forEach((mapping, index) => {
      const hookPath = normalizeHookPath(mapping?.match?.path);
      const actualModule = normalizeTransformModulePath(mapping?.transform?.module);
      if (!hookPath || !actualModule) return;

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
        if (!pathExists(fs, backupRootAbsolutePath) && pathExists(fs, sourceRootAbsolutePath)) {
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
        path.relative(path.dirname(expectedAbsolutePath), backupActualAbsolutePath),
      );
      fs.writeFileSync(expectedAbsolutePath, buildTransformShim(shimImportPath));

      mappings[index] = {
        ...mapping,
        transform: {
          ...(mapping?.transform || {}),
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

const applySecretExtraction = ({
  fs,
  baseDir,
  approvedSecrets,
}) => {
  const envVars = [];
  const rewriteMap = new Map();

  for (const secret of approvedSecrets) {
    const envVar = String(secret.suggestedEnvVar || "").trim();
    const value = String(secret.value || "").trim();
    if (!envVar || !value) continue;

    envVars.push({ key: envVar, value });

    if (secret.file && !secret.file.startsWith(".env")) {
      if (!rewriteMap.has(secret.file)) {
        rewriteMap.set(secret.file, []);
      }
      rewriteMap.get(secret.file).push({ value, envRef: `\${${envVar}}` });
    }
  }

  for (const [file, replacements] of rewriteMap) {
    try {
      const fullPath = path.join(baseDir, file);
      let content = fs.readFileSync(fullPath, "utf8");
      const sorted = [...replacements].sort(
        (a, b) => b.value.length - a.value.length,
      );
      for (const { value, envRef } of sorted) {
        const secretJson = JSON.stringify(value);
        const envRefJson = JSON.stringify(envRef);
        content = content.replace(
          new RegExp(
            secretJson.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&"),
            "g",
          ),
          envRefJson,
        );
      }
      fs.writeFileSync(fullPath, content);
      console.log(`[import] Rewrote secrets in ${file}`);
    } catch (e) {
      console.error(`[import] Rewrite error for ${file}: ${e.message}`);
    }
  }

  return { envVars };
};

module.exports = {
  promoteCloneToWorkspace,
  alignHookTransforms,
  applySecretExtraction,
  isValidTempDir,
};
