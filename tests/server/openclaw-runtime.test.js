const fs = require("fs");
const os = require("os");
const path = require("path");

const {
  applyManagedOpenclawPatch,
  ensureManagedOpenclawRuntimeProject,
  getBundledOpenclawPackageRoot,
  getManagedOpenclawBinDir,
  getManagedOpenclawBinPath,
  getManagedOpenclawPackageJsonPath,
  getManagedOpenclawPackageRoot,
  getManagedOpenclawRuntimeDir,
  installManagedOpenclawRuntime,
  prependManagedOpenclawBinToPath,
  readBundledOpenclawVersion,
  readManagedOpenclawRuntimeVersion,
  syncManagedOpenclawRuntimeWithBundled,
} = require("../../lib/server/openclaw-runtime");

const writeOpenclawPackage = ({
  packageRoot,
  version,
  markerBody = "module.exports = 'openclaw';\n",
} = {}) => {
  fs.mkdirSync(path.join(packageRoot, "lib"), { recursive: true });
  fs.writeFileSync(
    path.join(packageRoot, "package.json"),
    JSON.stringify(
      {
        name: "openclaw",
        version,
        files: ["lib/"],
      },
      null,
      2,
    ),
  );
  fs.writeFileSync(path.join(packageRoot, "lib", "runtime.js"), markerBody);
};

const parsePackDestination = (command) => {
  const match = String(command || "").match(/--pack-destination '([^']+)'/);
  return match ? match[1] : "";
};

describe("server/openclaw-runtime", () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "openclaw-runtime-"));
  });

  afterEach(() => {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {}
  });

  it("builds the managed runtime directory under the AlphaClaw root", () => {
    expect(getManagedOpenclawRuntimeDir({ rootDir: tmpDir })).toBe(
      path.join(tmpDir, ".openclaw-runtime"),
    );
  });

  it("seeds a minimal runtime package.json when needed", () => {
    const runtimeDir = getManagedOpenclawRuntimeDir({ rootDir: tmpDir });

    const result = ensureManagedOpenclawRuntimeProject({
      fsModule: fs,
      runtimeDir,
    });

    expect(result.runtimeDir).toBe(runtimeDir);
    expect(
      JSON.parse(fs.readFileSync(path.join(runtimeDir, "package.json"), "utf8")),
    ).toEqual({
      name: "alphaclaw-openclaw-runtime",
      private: true,
    });
  });

  it("reads the managed runtime version from its package.json", () => {
    const runtimeDir = getManagedOpenclawRuntimeDir({ rootDir: tmpDir });
    const openclawPkgPath = getManagedOpenclawPackageJsonPath({ runtimeDir });
    fs.mkdirSync(path.dirname(openclawPkgPath), { recursive: true });
    fs.writeFileSync(
      openclawPkgPath,
      JSON.stringify({ name: "openclaw", version: "2026.4.5" }),
    );

    expect(
      readManagedOpenclawRuntimeVersion({
        fsModule: fs,
        runtimeDir,
      }),
    ).toBe("2026.4.5");
  });

  it("reads the bundled OpenClaw version from the installed package metadata", () => {
    const bundleDir = path.join(tmpDir, "bundle");
    const bundledPkgPath = path.join(bundleDir, "package.json");
    const bundledEntryPath = path.join(bundleDir, "dist", "index.js");
    fs.mkdirSync(path.dirname(bundledEntryPath), { recursive: true });
    fs.writeFileSync(bundledEntryPath, "export default {};\n");
    writeOpenclawPackage({
      packageRoot: bundleDir,
      version: "2026.4.6",
    });

    expect(
      readBundledOpenclawVersion({
        fsModule: fs,
        resolveImpl: (request) => {
          if (request === "openclaw") return bundledEntryPath;
          throw new Error(`unexpected resolve ${request}`);
        },
      }),
    ).toBe("2026.4.6");
  });

  it("applies a bundled patch when there is a matching patch file", () => {
    const runtimeDir = getManagedOpenclawRuntimeDir({ rootDir: tmpDir });
    const alphaclawRoot = path.join(tmpDir, "alphaclaw");
    const patchPackageMain = path.join(
      alphaclawRoot,
      "node_modules",
      "patch-package",
      "dist",
      "index.js",
    );
    fs.mkdirSync(path.dirname(patchPackageMain), { recursive: true });
    fs.writeFileSync(patchPackageMain, "module.exports = {};\n");
    fs.mkdirSync(path.join(alphaclawRoot, "patches"), { recursive: true });
    fs.writeFileSync(
      path.join(alphaclawRoot, "patches", "openclaw+2026.4.1.patch"),
      "diff --git a/a b/b\n",
    );
    fs.mkdirSync(runtimeDir, { recursive: true });
    const execSyncImpl = vi.fn();

    const applied = applyManagedOpenclawPatch({
      execSyncImpl,
      fsModule: fs,
      logger: { log: vi.fn() },
      runtimeDir,
      version: "2026.4.1",
      alphaclawRoot,
    });

    expect(applied).toBe(true);
    expect(fs.lstatSync(path.join(runtimeDir, ".alphaclaw-patches")).isSymbolicLink()).toBe(
      true,
    );
    expect(execSyncImpl).toHaveBeenCalledWith(
      expect.stringContaining("--patch-dir '.alphaclaw-patches'"),
      {
        cwd: runtimeDir,
        stdio: "inherit",
        timeout: 120000,
      },
    );
  });

  it("installs into the managed runtime and patches the bundled version when needed", () => {
    const runtimeDir = getManagedOpenclawRuntimeDir({ rootDir: tmpDir });
    const alphaclawRoot = path.join(tmpDir, "alphaclaw");
    const patchPackageMain = path.join(
      alphaclawRoot,
      "node_modules",
      "patch-package",
      "dist",
      "index.js",
    );
    fs.mkdirSync(path.dirname(patchPackageMain), { recursive: true });
    fs.writeFileSync(patchPackageMain, "module.exports = {};\n");
    fs.mkdirSync(path.join(alphaclawRoot, "patches"), { recursive: true });
    fs.writeFileSync(
      path.join(alphaclawRoot, "patches", "openclaw+2026.4.1.patch"),
      "diff --git a/a b/b\n",
    );
    const execSyncImpl = vi.fn((command, options) => {
      if (!String(command).includes("npm install")) return;
      const pkgPath = getManagedOpenclawPackageJsonPath({ runtimeDir: options.cwd });
      fs.mkdirSync(path.dirname(pkgPath), { recursive: true });
      fs.writeFileSync(
        pkgPath,
        JSON.stringify({ name: "openclaw", version: "2026.4.1" }),
      );
    });

    const result = installManagedOpenclawRuntime({
      execSyncImpl,
      fsModule: fs,
      logger: { log: vi.fn() },
      runtimeDir,
      spec: "openclaw@2026.4.1",
      alphaclawRoot,
    });

    expect(result).toEqual({
      spec: "openclaw@2026.4.1",
      version: "2026.4.1",
    });
    expect(execSyncImpl).toHaveBeenCalledWith(
      "npm install 'openclaw@2026.4.1' --omit=dev --no-save --save=false --package-lock=false --prefer-online",
      {
        cwd: runtimeDir,
        stdio: "inherit",
        timeout: 180000,
      },
    );
    expect(execSyncImpl.mock.calls.some(([command]) => String(command).includes("patch-package"))).toBe(
      true,
    );
  });

  it("seeds the managed runtime from the bundled OpenClaw version when missing", () => {
    const runtimeDir = getManagedOpenclawRuntimeDir({ rootDir: tmpDir });
    const bundleDir = path.join(tmpDir, "bundle");
    const bundledPkgPath = path.join(bundleDir, "package.json");
    const bundledEntryPath = path.join(bundleDir, "dist", "index.js");
    fs.mkdirSync(path.dirname(bundledEntryPath), { recursive: true });
    fs.writeFileSync(bundledEntryPath, "export default {};\n");
    writeOpenclawPackage({
      packageRoot: bundleDir,
      version: "2026.4.5",
    });
    const execSyncImpl = vi.fn((command, options) => {
      if (String(command).startsWith("npm pack ")) {
        const packDestination = parsePackDestination(command);
        const tarballPath = path.join(packDestination, "openclaw-runtime.tgz");
        fs.mkdirSync(packDestination, { recursive: true });
        fs.writeFileSync(tarballPath, "tarball");
        return "openclaw-runtime.tgz\n";
      }
      if (!String(command).includes("npm install")) return;
      writeOpenclawPackage({
        packageRoot: getManagedOpenclawPackageRoot({ runtimeDir: options.cwd }),
        version: "2026.4.5",
      });
    });

    const result = syncManagedOpenclawRuntimeWithBundled({
      execSyncImpl,
      fsModule: fs,
      logger: { log: vi.fn() },
      runtimeDir,
      resolveImpl: (request) => {
        if (request === "openclaw") return bundledEntryPath;
        throw new Error(`unexpected resolve ${request}`);
      },
      alphaclawRoot: path.join(tmpDir, "alphaclaw-no-patches"),
    });

    expect(result).toEqual({
      checked: true,
      synced: true,
      bundledVersion: "2026.4.5",
      runtimeVersion: "2026.4.5",
    });
    expect(execSyncImpl.mock.calls[0][0]).toContain(`npm pack '${bundleDir}'`);
    expect(execSyncImpl).toHaveBeenCalledWith(
      expect.stringMatching(/npm install '.*openclaw-runtime\.tgz' --omit=dev --no-save --save=false --package-lock=false --prefer-online/),
      {
        cwd: runtimeDir,
        stdio: "inherit",
        timeout: 180000,
      },
    );
  });

  it("refreshes the managed runtime when bundled contents change without a version bump", () => {
    const runtimeDir = getManagedOpenclawRuntimeDir({ rootDir: tmpDir });
    const bundleDir = path.join(tmpDir, "bundle");
    const bundledPkgPath = path.join(bundleDir, "package.json");
    const bundledEntryPath = path.join(bundleDir, "dist", "index.js");
    fs.mkdirSync(path.dirname(bundledEntryPath), { recursive: true });
    fs.writeFileSync(bundledEntryPath, "export default {};\n");
    writeOpenclawPackage({
      packageRoot: bundleDir,
      version: "2026.4.5",
      markerBody: "module.exports = 'new';\n",
    });
    writeOpenclawPackage({
      packageRoot: getManagedOpenclawPackageRoot({ runtimeDir }),
      version: "2026.4.5",
      markerBody: "module.exports = 'old';\n",
    });
    const execSyncImpl = vi.fn((command, options) => {
      if (String(command).startsWith("npm pack ")) {
        const packDestination = parsePackDestination(command);
        const tarballPath = path.join(packDestination, "openclaw-runtime.tgz");
        fs.mkdirSync(packDestination, { recursive: true });
        fs.writeFileSync(tarballPath, "tarball");
        return "openclaw-runtime.tgz\n";
      }
      if (!String(command).includes("npm install")) return;
      writeOpenclawPackage({
        packageRoot: getManagedOpenclawPackageRoot({ runtimeDir: options.cwd }),
        version: "2026.4.5",
        markerBody: "module.exports = 'new';\n",
      });
    });

    const result = syncManagedOpenclawRuntimeWithBundled({
      execSyncImpl,
      fsModule: fs,
      logger: { log: vi.fn() },
      runtimeDir,
      resolveImpl: (request) => {
        if (request === "openclaw") return bundledEntryPath;
        throw new Error(`unexpected resolve ${request}`);
      },
      alphaclawRoot: path.join(tmpDir, "alphaclaw-no-patches"),
    });

    expect(result).toEqual({
      checked: true,
      synced: true,
      bundledVersion: "2026.4.5",
      runtimeVersion: "2026.4.5",
    });
    expect(execSyncImpl.mock.calls[0][0]).toContain(`npm pack '${bundleDir}'`);
    expect(execSyncImpl).toHaveBeenCalledWith(
      expect.stringMatching(/npm install '.*openclaw-runtime\.tgz' --omit=dev --no-save --save=false --package-lock=false --prefer-online/),
      {
        cwd: runtimeDir,
        stdio: "inherit",
        timeout: 180000,
      },
    );
  });

  it("refreshes the managed runtime when the installed package root is symlinked", () => {
    const runtimeDir = getManagedOpenclawRuntimeDir({ rootDir: tmpDir });
    const bundleDir = path.join(tmpDir, "bundle");
    const bundledEntryPath = path.join(bundleDir, "dist", "index.js");
    const runtimePackageRoot = getManagedOpenclawPackageRoot({ runtimeDir });
    fs.mkdirSync(path.dirname(bundledEntryPath), { recursive: true });
    fs.writeFileSync(bundledEntryPath, "export default {};\n");
    writeOpenclawPackage({
      packageRoot: bundleDir,
      version: "2026.4.5",
    });
    fs.mkdirSync(path.dirname(runtimePackageRoot), { recursive: true });
    fs.symlinkSync(bundleDir, runtimePackageRoot, "dir");
    const execSyncImpl = vi.fn((command, options) => {
      if (String(command).startsWith("npm pack ")) {
        const packDestination = parsePackDestination(command);
        const tarballPath = path.join(packDestination, "openclaw-runtime.tgz");
        fs.mkdirSync(packDestination, { recursive: true });
        fs.writeFileSync(tarballPath, "tarball");
        return "openclaw-runtime.tgz\n";
      }
      if (!String(command).includes("npm install")) return;
      fs.rmSync(runtimePackageRoot, { recursive: true, force: true });
      writeOpenclawPackage({
        packageRoot: getManagedOpenclawPackageRoot({ runtimeDir: options.cwd }),
        version: "2026.4.5",
      });
    });

    const result = syncManagedOpenclawRuntimeWithBundled({
      execSyncImpl,
      fsModule: fs,
      logger: { log: vi.fn() },
      runtimeDir,
      resolveImpl: (request) => {
        if (request === "openclaw") return bundledEntryPath;
        throw new Error(`unexpected resolve ${request}`);
      },
      alphaclawRoot: path.join(tmpDir, "alphaclaw-no-patches"),
    });

    expect(result).toEqual({
      checked: true,
      synced: true,
      bundledVersion: "2026.4.5",
      runtimeVersion: "2026.4.5",
    });
    expect(execSyncImpl.mock.calls[0][0]).toContain(`npm pack '${bundleDir}'`);
    expect(execSyncImpl).toHaveBeenCalledWith(
      expect.stringMatching(/npm install '.*openclaw-runtime\.tgz' --omit=dev --no-save --save=false --package-lock=false --prefer-online/),
      {
        cwd: runtimeDir,
        stdio: "inherit",
        timeout: 180000,
      },
    );
  });

  it("does not downgrade a newer managed runtime during bundled sync", () => {
    const runtimeDir = getManagedOpenclawRuntimeDir({ rootDir: tmpDir });
    const bundledPkgPath = path.join(tmpDir, "bundle", "package.json");
    const bundledEntryPath = path.join(tmpDir, "bundle", "dist", "index.js");
    const runtimePkgPath = getManagedOpenclawPackageJsonPath({ runtimeDir });
    fs.mkdirSync(path.dirname(bundledEntryPath), { recursive: true });
    fs.writeFileSync(bundledEntryPath, "export default {};\n");
    writeOpenclawPackage({
      packageRoot: path.dirname(bundledPkgPath),
      version: "2026.4.1",
    });
    writeOpenclawPackage({
      packageRoot: getManagedOpenclawPackageRoot({ runtimeDir }),
      version: "2026.4.5",
    });
    const execSyncImpl = vi.fn();

    const result = syncManagedOpenclawRuntimeWithBundled({
      execSyncImpl,
      fsModule: fs,
      logger: { log: vi.fn() },
      runtimeDir,
      resolveImpl: (request) => {
        if (request === "openclaw") return bundledEntryPath;
        throw new Error(`unexpected resolve ${request}`);
      },
    });

    expect(result).toEqual({
      checked: true,
      synced: false,
      bundledVersion: "2026.4.1",
      runtimeVersion: "2026.4.5",
    });
    expect(execSyncImpl).not.toHaveBeenCalled();
  });

  it("prepends the managed openclaw bin dir to PATH when a runtime exists", () => {
    const runtimeDir = getManagedOpenclawRuntimeDir({ rootDir: tmpDir });
    const binDir = getManagedOpenclawBinDir({ runtimeDir });
    const binPath = getManagedOpenclawBinPath({ runtimeDir });
    fs.mkdirSync(binDir, { recursive: true });
    fs.writeFileSync(binPath, "#!/bin/sh\n");
    const env = { PATH: "/usr/local/bin:/usr/bin" };

    const applied = prependManagedOpenclawBinToPath({
      env,
      fsModule: fs,
      logger: { log: vi.fn() },
      runtimeDir,
    });

    expect(applied).toBe(true);
    expect(env.PATH.split(path.delimiter)[0]).toBe(binDir);
  });

  it("does not change PATH when the managed runtime is absent", () => {
    const runtimeDir = getManagedOpenclawRuntimeDir({ rootDir: tmpDir });
    const env = { PATH: "/usr/local/bin:/usr/bin" };

    const applied = prependManagedOpenclawBinToPath({
      env,
      fsModule: fs,
      logger: { log: vi.fn() },
      runtimeDir,
    });

    expect(applied).toBe(false);
    expect(env.PATH).toBe("/usr/local/bin:/usr/bin");
  });
});
