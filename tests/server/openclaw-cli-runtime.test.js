const path = require("path");
const {
  resolveOpenclawEntrypoint,
  ensureOpenclawCliShim,
} = require("../../lib/cli/openclaw-runtime");

const createFsMock = ({
  existingShim = null,
  existingTarget = "",
} = {}) => {
  const entries = new Map();
  if (existingShim) entries.set(existingShim, { type: "symlink", target: existingTarget });

  return {
    constants: { X_OK: 1 },
    accessSync: vi.fn(),
    mkdirSync: vi.fn(),
    lstatSync(targetPath) {
      const entry = entries.get(targetPath);
      if (!entry) throw Object.assign(new Error("missing"), { code: "ENOENT" });
      return { isSymbolicLink: () => entry.type === "symlink" };
    },
    readlinkSync(targetPath) {
      return entries.get(targetPath).target;
    },
    symlinkSync(target, shimPath) {
      entries.set(shimPath, { type: "symlink", target });
    },
    renameSync(fromPath, toPath) {
      entries.set(toPath, entries.get(fromPath));
      entries.delete(fromPath);
    },
    unlinkSync(targetPath) {
      if (!entries.delete(targetPath)) {
        throw Object.assign(new Error("missing"), { code: "ENOENT" });
      }
    },
  };
};

describe("cli/openclaw runtime", () => {
  it("resolves the executable entrypoint next to the OpenClaw package manifest", () => {
    const fsModule = createFsMock();
    const entrypointPath = resolveOpenclawEntrypoint({
      fsModule,
      resolveModule: () => "/app/node_modules/openclaw/dist/index.js",
    });

    expect(entrypointPath).toBe("/app/node_modules/openclaw/openclaw.mjs");
    expect(fsModule.accessSync).toHaveBeenCalledWith(entrypointPath, 1);
  });

  it("installs a launcher atomically when it is missing", () => {
    const fsModule = createFsMock();
    const result = ensureOpenclawCliShim({
      fsModule,
      shimPath: "/usr/local/bin/openclaw",
      entrypointPath: "/app/node_modules/openclaw/openclaw.mjs",
      processId: 42,
      now: () => 1000,
    });

    expect(result.action).toBe("installed");
    expect(fsModule.mkdirSync).toHaveBeenCalledWith("/usr/local/bin", {
      recursive: true,
    });
    expect(fsModule.readlinkSync(result.shimPath)).toBe(result.entrypointPath);
  });

  it("keeps a correct existing launcher unchanged", () => {
    const shimPath = "/usr/local/bin/openclaw";
    const entrypointPath = "/app/node_modules/openclaw/openclaw.mjs";
    const fsModule = createFsMock({
      existingShim: shimPath,
      existingTarget: entrypointPath,
    });

    const result = ensureOpenclawCliShim({ fsModule, shimPath, entrypointPath });

    expect(result.action).toBe("unchanged");
    expect(fsModule.mkdirSync).not.toHaveBeenCalled();
  });

  it("replaces a stale launcher after an OpenClaw update", () => {
    const shimPath = "/usr/local/bin/openclaw";
    const fsModule = createFsMock({
      existingShim: shimPath,
      existingTarget: "/app/node_modules/.openclaw-old/openclaw.mjs",
    });

    const result = ensureOpenclawCliShim({
      fsModule,
      shimPath,
      entrypointPath: "/app/node_modules/openclaw/openclaw.mjs",
      processId: 42,
      now: () => 1000,
    });

    expect(result.action).toBe("installed");
    expect(fsModule.readlinkSync(shimPath)).toBe(
      "/app/node_modules/openclaw/openclaw.mjs",
    );
  });

  it("does not overwrite an unmanaged regular launcher", () => {
    const fsModule = createFsMock();
    fsModule.lstatSync = () => ({ isSymbolicLink: () => false });

    const result = ensureOpenclawCliShim({
      fsModule,
      shimPath: "/usr/local/bin/openclaw",
      entrypointPath: "/app/node_modules/openclaw/openclaw.mjs",
    });

    expect(result.action).toBe("preserved");
    expect(fsModule.mkdirSync).not.toHaveBeenCalled();
  });
});
