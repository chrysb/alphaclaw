const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const kIgnoredDirectoryNames = new Set([".git", "node_modules"]);

const normalizeRelativePath = (packageRoot, absolutePath) =>
  path.relative(packageRoot, absolutePath).split(path.sep).join("/");

const addIncludedPath = ({ includeSet, value }) => {
  const normalizedValue = String(value || "").trim();
  if (!normalizedValue) return;
  includeSet.add(normalizedValue.replace(/\/+$/, ""));
};

const collectIncludedPaths = ({ packageJson = {} } = {}) => {
  const includeSet = new Set(["package.json"]);

  if (Array.isArray(packageJson.files)) {
    for (const entry of packageJson.files) {
      addIncludedPath({ includeSet, value: entry });
    }
  }

  if (typeof packageJson.bin === "string") {
    addIncludedPath({ includeSet, value: packageJson.bin });
  } else if (packageJson.bin && typeof packageJson.bin === "object") {
    for (const entry of Object.values(packageJson.bin)) {
      addIncludedPath({ includeSet, value: entry });
    }
  }

  return Array.from(includeSet).sort((left, right) => left.localeCompare(right));
};

const walkIncludedFiles = ({
  fsModule = fs,
  packageRoot,
  absolutePath,
  files,
}) => {
  if (!fsModule.existsSync(absolutePath)) return;
  const relativePath = normalizeRelativePath(packageRoot, absolutePath);
  if (!relativePath || relativePath.startsWith("..")) return;

  const stat = fsModule.lstatSync(absolutePath);
  if (stat.isSymbolicLink()) {
    files.push({
      relativePath,
      hash: `symlink:${fsModule.readlinkSync(absolutePath)}`,
    });
    return;
  }
  if (stat.isFile()) {
    files.push({
      relativePath,
      hash: crypto
        .createHash("sha256")
        .update(fsModule.readFileSync(absolutePath))
        .digest("hex"),
    });
    return;
  }
  if (!stat.isDirectory()) return;

  const entries = fsModule
    .readdirSync(absolutePath, { withFileTypes: true })
    .sort((left, right) => left.name.localeCompare(right.name));

  for (const entry of entries) {
    if (entry.isDirectory() && kIgnoredDirectoryNames.has(entry.name)) continue;
    walkIncludedFiles({
      fsModule,
      packageRoot,
      absolutePath: path.join(absolutePath, entry.name),
      files,
    });
  }
};

const computePackageFingerprint = ({
  fsModule = fs,
  packageRoot,
  packageJsonPath = path.join(packageRoot, "package.json"),
} = {}) => {
  const resolvedPackageRoot = path.resolve(String(packageRoot || ""));
  if (!resolvedPackageRoot || !fsModule.existsSync(packageJsonPath)) return null;

  let packageJson;
  try {
    packageJson = JSON.parse(fsModule.readFileSync(packageJsonPath, "utf8"));
  } catch {
    return null;
  }

  const files = [];
  for (const includePath of collectIncludedPaths({ packageJson })) {
    walkIncludedFiles({
      fsModule,
      packageRoot: resolvedPackageRoot,
      absolutePath: path.resolve(resolvedPackageRoot, includePath),
      files,
    });
  }

  const hash = crypto.createHash("sha256");
  hash.update("package-fingerprint-v1");
  for (const entry of files.sort((left, right) => left.relativePath.localeCompare(right.relativePath))) {
    hash.update(entry.relativePath);
    hash.update("\0");
    hash.update(entry.hash);
    hash.update("\0");
  }
  return hash.digest("hex");
};

module.exports = {
  computePackageFingerprint,
};
