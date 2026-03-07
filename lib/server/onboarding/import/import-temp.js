const fs = require("fs");
const os = require("os");
const path = require("path");

const kImportTempPrefix = "alphaclaw-import-";
const kImportTempTtlMs = 24 * 60 * 60 * 1000;

const resolveImportTempDir = (tempDir) => {
  const value = String(tempDir || "").trim();
  if (!value) return "";
  return path.resolve(value);
};

const isValidImportTempDir = (tempDir) => {
  const resolved = resolveImportTempDir(tempDir);
  if (!resolved) return false;
  const tempRoot = path.resolve(os.tmpdir());
  const relative = path.relative(tempRoot, resolved);
  if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) {
    return false;
  }
  return path.basename(resolved).startsWith(kImportTempPrefix);
};

const cleanupStaleImportTempDirs = ({
  fsModule = fs,
  maxAgeMs = kImportTempTtlMs,
  nowMs = Date.now(),
} = {}) => {
  const tempRoot = path.resolve(os.tmpdir());
  let removedCount = 0;

  let entries = [];
  try {
    entries = fsModule.readdirSync(tempRoot, { withFileTypes: true });
  } catch {
    return { removedCount };
  }

  for (const entry of entries) {
    if (!entry?.isDirectory?.()) continue;
    if (!String(entry.name || "").startsWith(kImportTempPrefix)) continue;
    const candidate = path.join(tempRoot, entry.name);
    if (!isValidImportTempDir(candidate)) continue;
    try {
      const stats = fsModule.statSync(candidate);
      const ageMs = nowMs - Number(stats?.mtimeMs || 0);
      if (ageMs < maxAgeMs) continue;
      fsModule.rmSync(candidate, { recursive: true, force: true });
      removedCount += 1;
    } catch {}
  }

  return { removedCount };
};

module.exports = {
  kImportTempPrefix,
  kImportTempTtlMs,
  resolveImportTempDir,
  isValidImportTempDir,
  cleanupStaleImportTempDirs,
};
