const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const kIgnoredDirectoryNames = new Set([".git", "node_modules"]);

const hashFile = (filePath) => {
  const buffer = fs.readFileSync(filePath);
  return crypto.createHash("sha256").update(buffer).digest("hex");
};

const normalizeRelativePath = (rootDir, filePath) =>
  path.relative(rootDir, filePath).split(path.sep).join("/");

const walkFiles = (rootDir, currentDir = rootDir) => {
  const entries = fs.readdirSync(currentDir, { withFileTypes: true });
  const sortedEntries = [...entries].sort((left, right) => left.name.localeCompare(right.name));
  const files = [];

  for (const entry of sortedEntries) {
    if (entry.isDirectory()) {
      if (kIgnoredDirectoryNames.has(entry.name)) continue;
      files.push(...walkFiles(rootDir, path.join(currentDir, entry.name)));
      continue;
    }
    if (!entry.isFile()) continue;
    files.push(path.join(currentDir, entry.name));
  }

  return files;
};

const buildWorkspaceManifest = (rootDir) => {
  const normalizedRootDir = path.resolve(String(rootDir || ""));
  const files = walkFiles(normalizedRootDir);
  return files.reduce((manifest, filePath) => {
    manifest[normalizeRelativePath(normalizedRootDir, filePath)] = hashFile(filePath);
    return manifest;
  }, {});
};

const computeWorkspaceFingerprintFromManifest = (manifest = {}) => {
  const hash = crypto.createHash("sha256");
  const entries = Object.entries(manifest).sort(([leftPath], [rightPath]) =>
    leftPath.localeCompare(rightPath),
  );

  hash.update("workspace-fingerprint-v1");
  for (const [relativePath, fileHash] of entries) {
    hash.update(relativePath);
    hash.update("\0");
    hash.update(fileHash);
    hash.update("\0");
  }

  return hash.digest("hex");
};

const computeWorkspaceSnapshot = (rootDir) => {
  const manifest = buildWorkspaceManifest(rootDir);
  return {
    fingerprint: computeWorkspaceFingerprintFromManifest(manifest),
    manifest,
  };
};

const getPathChangeWeight = (relativePath = "") => {
  const normalizedPath = String(relativePath || "").trim().toLowerCase();
  if (!normalizedPath) return 1;
  if (
    normalizedPath === "agents.md" ||
    normalizedPath === "tools.md" ||
    normalizedPath === "readme.md" ||
    normalizedPath === "bootstrap.md" ||
    normalizedPath === "memory.md" ||
    normalizedPath === "user.md" ||
    normalizedPath === "identity.md"
  ) {
    return 4;
  }
  if (normalizedPath.startsWith("hooks/bootstrap/")) return 4;
  if (normalizedPath.startsWith("skills/")) return 3;
  if (normalizedPath.endsWith(".md")) return 2;
  return 1;
};

const calculateWorkspaceDelta = ({ previousManifest = {}, currentManifest = {} } = {}) => {
  const previousPaths = Object.keys(previousManifest);
  const currentPaths = Object.keys(currentManifest);
  const allPaths = Array.from(new Set([...previousPaths, ...currentPaths])).sort((left, right) =>
    left.localeCompare(right),
  );
  const changeSummary = {
    addedFilesCount: 0,
    removedFilesCount: 0,
    modifiedFilesCount: 0,
    changedFilesCount: 0,
    deltaScore: 0,
    changedPaths: [],
  };

  for (const relativePath of allPaths) {
    const previousHash = previousManifest[relativePath] || "";
    const currentHash = currentManifest[relativePath] || "";
    if (!previousHash && currentHash) {
      changeSummary.addedFilesCount += 1;
    } else if (previousHash && !currentHash) {
      changeSummary.removedFilesCount += 1;
    } else if (previousHash !== currentHash) {
      changeSummary.modifiedFilesCount += 1;
    } else {
      continue;
    }
    changeSummary.changedFilesCount += 1;
    changeSummary.deltaScore += getPathChangeWeight(relativePath);
    changeSummary.changedPaths.push(relativePath);
  }

  return changeSummary;
};

module.exports = {
  calculateWorkspaceDelta,
  computeWorkspaceFingerprintFromManifest,
  computeWorkspaceSnapshot,
};
