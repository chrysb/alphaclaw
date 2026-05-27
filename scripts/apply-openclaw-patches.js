/**
 * patch-package resolves paths relative to the npm/yarn project root (where the
 * lockfile lives). When this package's postinstall runs, process.cwd() is often
 * this package directory, so a plain `patch-package` call treats that as the
 * app root and looks for ./node_modules/openclaw under it — but openclaw is
 * usually hoisted to the consumer's top-level node_modules.
 *
 * This script finds the real install root (directory containing a lockfile) and
 * runs patch-package there with --patch-dir pointing at our bundled patches/.
 */
const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const kAlphaclawRoot = path.join(__dirname, "..");

const findProjectRootFromOpenclawDir = (openclawDir) => {
  let dir = path.resolve(openclawDir);
  for (let i = 0; i < 30; i += 1) {
    if (
      fs.existsSync(path.join(dir, "package-lock.json")) ||
      fs.existsSync(path.join(dir, "yarn.lock")) ||
      fs.existsSync(path.join(dir, "pnpm-lock.yaml"))
    ) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return path.dirname(path.dirname(openclawDir));
};

const main = () => {
  const patchesDir = path.join(kAlphaclawRoot, "patches");
  if (!fs.existsSync(patchesDir)) {
    return;
  }
  const hasPatch = fs
    .readdirSync(patchesDir)
    .some((name) => name.endsWith(".patch"));
  if (!hasPatch) {
    return;
  }

  let openclawMainPath;
  try {
    openclawMainPath = require.resolve("openclaw", { paths: [kAlphaclawRoot] });
  } catch {
    return;
  }

  const openclawDir = (() => {
    let dir = path.dirname(openclawMainPath);
    for (let i = 0; i < 8; i += 1) {
      const pkgPath = path.join(dir, "package.json");
      if (fs.existsSync(pkgPath)) {
        try {
          const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
          if (pkg.name === "openclaw") return dir;
        } catch {
          /* continue */
        }
      }
      const parent = path.dirname(dir);
      if (parent === dir) break;
      dir = parent;
    }
    return path.dirname(path.dirname(openclawMainPath));
  })();
  const projectRoot = findProjectRootFromOpenclawDir(openclawDir);

  let relPatchDir = path.relative(projectRoot, patchesDir);
  if (relPatchDir.startsWith("..") || path.isAbsolute(relPatchDir)) {
    console.error(
      "[@chrysb/alphaclaw] patch-package: could not resolve patch dir relative to project root",
    );
    process.exit(1);
  }
  relPatchDir = relPatchDir.split(path.sep).join("/");

  const patchPackageMain = require.resolve("patch-package/dist/index.js", {
    paths: [kAlphaclawRoot],
  });

  const result = spawnSync(
    process.execPath,
    [patchPackageMain, "--patch-dir", relPatchDir],
    { cwd: projectRoot, stdio: "inherit", env: process.env },
  );
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0 && result.status !== null) {
    process.exit(result.status);
  }
};

main();
