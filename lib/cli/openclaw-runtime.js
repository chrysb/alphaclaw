const fs = require("fs");
const path = require("path");

const kDefaultOpenclawShimPath = "/usr/local/bin/openclaw";

const resolveOpenclawEntrypoint = ({
  resolveModule = require.resolve,
  fsModule = fs,
} = {}) => {
  const exportedEntrypointPath = resolveModule("openclaw");
  const exportedEntrypointDir = path.dirname(exportedEntrypointPath);
  const packageRoot =
    path.basename(exportedEntrypointDir) === "dist"
      ? path.dirname(exportedEntrypointDir)
      : exportedEntrypointDir;
  const entrypointPath = path.join(packageRoot, "openclaw.mjs");
  fsModule.accessSync(entrypointPath, fsModule.constants.X_OK);
  return entrypointPath;
};

const ensureOpenclawCliShim = ({
  fsModule = fs,
  shimPath = kDefaultOpenclawShimPath,
  entrypointPath = resolveOpenclawEntrypoint({ fsModule }),
  processId = process.pid,
  now = Date.now,
} = {}) => {
  const resolvedShimPath = path.resolve(shimPath);
  const resolvedEntrypointPath = path.resolve(entrypointPath);

  try {
    const stat = fsModule.lstatSync(resolvedShimPath);
    if (!stat.isSymbolicLink()) {
      return {
        action: "preserved",
        entrypointPath: resolvedEntrypointPath,
        shimPath: resolvedShimPath,
      };
    }

    const currentTarget = fsModule.readlinkSync(resolvedShimPath);
    const resolvedCurrentTarget = path.resolve(
      path.dirname(resolvedShimPath),
      currentTarget,
    );
    if (resolvedCurrentTarget === resolvedEntrypointPath) {
      return {
        action: "unchanged",
        entrypointPath: resolvedEntrypointPath,
        shimPath: resolvedShimPath,
      };
    }
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }

  fsModule.mkdirSync(path.dirname(resolvedShimPath), { recursive: true });
  const temporaryShimPath = `${resolvedShimPath}.alphaclaw-${processId}-${now()}`;
  try {
    fsModule.symlinkSync(resolvedEntrypointPath, temporaryShimPath);
    fsModule.renameSync(temporaryShimPath, resolvedShimPath);
  } finally {
    try {
      fsModule.unlinkSync(temporaryShimPath);
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
  }

  return {
    action: "installed",
    entrypointPath: resolvedEntrypointPath,
    shimPath: resolvedShimPath,
  };
};

module.exports = {
  kDefaultOpenclawShimPath,
  resolveOpenclawEntrypoint,
  ensureOpenclawCliShim,
};
