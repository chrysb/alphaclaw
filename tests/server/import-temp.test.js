const path = require("path");

const {
  cleanupStaleImportTempDirs,
  isValidImportTempDir,
  kImportTempTtlMs,
} = require("../../lib/server/onboarding/import/import-temp");

describe("server/onboarding/import-temp", () => {
  it("rejects paths that escape the temp root", () => {
    const escapedPath = path.join(
      require("os").tmpdir(),
      "..",
      "outside",
      "alphaclaw-import-evil",
    );

    expect(isValidImportTempDir(escapedPath)).toBe(false);
  });

  it("cleans up only stale managed import temp dirs", () => {
    const tempRoot = path.resolve(require("os").tmpdir());
    const staleDir = path.join(tempRoot, "alphaclaw-import-stale");
    const freshDir = path.join(tempRoot, "alphaclaw-import-fresh");
    const otherDir = path.join(tempRoot, "other-dir");
    const removed = [];

    const fsModule = {
      readdirSync: vi.fn(() => [
        { name: "alphaclaw-import-stale", isDirectory: () => true },
        { name: "alphaclaw-import-fresh", isDirectory: () => true },
        { name: "other-dir", isDirectory: () => true },
      ]),
      statSync: vi.fn((targetPath) => {
        if (targetPath === staleDir) {
          return { mtimeMs: 1000 };
        }
        if (targetPath === freshDir) {
          return { mtimeMs: 5000 };
        }
        throw Object.assign(new Error("ENOENT"), { code: "ENOENT" });
      }),
      rmSync: vi.fn((targetPath) => {
        removed.push(targetPath);
      }),
    };

    const result = cleanupStaleImportTempDirs({
      fsModule,
      nowMs: 1000 + kImportTempTtlMs + 1,
    });

    expect(result).toEqual({ removedCount: 1 });
    expect(removed).toEqual([staleDir]);
  });
});
