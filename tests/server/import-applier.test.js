const fs = require("fs");
const os = require("os");
const path = require("path");

const {
  promoteCloneToTarget,
  alignHookTransforms,
  applySecretExtraction,
} = require("../../lib/server/onboarding/import/import-applier");

const kTempDirs = [];

const createTempDir = () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "alphaclaw-import-applier-"));
  kTempDirs.push(tempDir);
  return tempDir;
};

afterEach(() => {
  while (kTempDirs.length > 0) {
    fs.rmSync(kTempDirs.pop(), { recursive: true, force: true });
  }
});

describe("import-applier", () => {
  it("merges imported files into an existing target directory", () => {
    const tempDir = createTempDir();
    const targetDir = createTempDir();

    fs.writeFileSync(
      path.join(tempDir, "openclaw.json"),
      JSON.stringify({ channels: { telegram: { enabled: true } } }, null, 2),
      "utf8",
    );
    fs.mkdirSync(path.join(tempDir, "workspace"), { recursive: true });
    fs.writeFileSync(
      path.join(tempDir, "workspace", "AGENTS.md"),
      "# imported workspace\n",
      "utf8",
    );

    fs.writeFileSync(
      path.join(targetDir, "openclaw.json"),
      JSON.stringify({ channels: { telegram: { enabled: false } } }, null, 2),
      "utf8",
    );
    fs.writeFileSync(
      path.join(targetDir, "exec-approvals.json"),
      JSON.stringify({ version: 1, defaults: { security: "full" } }, null, 2),
      "utf8",
    );

    const result = promoteCloneToTarget({
      fs,
      tempDir,
      targetDir,
    });

    expect(result).toEqual({ ok: true });
    expect(
      JSON.parse(fs.readFileSync(path.join(targetDir, "openclaw.json"), "utf8")),
    ).toEqual({
      channels: { telegram: { enabled: true } },
    });
    expect(
      fs.readFileSync(path.join(targetDir, "workspace", "AGENTS.md"), "utf8"),
    ).toBe("# imported workspace\n");
    expect(fs.existsSync(path.join(targetDir, "exec-approvals.json"))).toBe(true);
    expect(fs.existsSync(tempDir)).toBe(false);
  });

  it("relocates mismatched hook transforms into _backup and writes a shim", () => {
    const baseDir = createTempDir();
    const legacyTransformDir = path.join(
      baseDir,
      "hooks",
      "transforms",
      "fathom-webhook",
      "scripts",
    );
    fs.mkdirSync(legacyTransformDir, { recursive: true });
    fs.writeFileSync(
      path.join(legacyTransformDir, "fathom-transform.mjs"),
      "export default async function transform(payload) {\n  return payload;\n}\n",
      "utf8",
    );
    fs.writeFileSync(
      path.join(legacyTransformDir, "helper.mjs"),
      "export const helper = true;\n",
      "utf8",
    );
    fs.writeFileSync(
      path.join(baseDir, "openclaw.json"),
      JSON.stringify(
        {
          hooks: {
            mappings: [
              {
                name: "Fathom",
                match: { path: "/fathom" },
                transform: {
                  module: "fathom-webhook/scripts/fathom-transform.mjs",
                },
              },
            ],
          },
        },
        null,
        2,
      ),
      "utf8",
    );

    const result = alignHookTransforms({
      fs,
      baseDir,
      configFiles: ["openclaw.json"],
    });

    expect(result).toEqual({ alignedCount: 1 });
    expect(
      fs.existsSync(
        path.join(baseDir, "hooks", "transforms", "fathom-webhook"),
      ),
    ).toBe(false);
    expect(
      fs.existsSync(
        path.join(
          baseDir,
          "hooks",
          "transforms",
          "_backup",
          "fathom-webhook",
          "scripts",
          "fathom-transform.mjs",
        ),
      ),
    ).toBe(true);
    expect(
      fs.existsSync(
        path.join(
          baseDir,
          "hooks",
          "transforms",
          "_backup",
          "fathom-webhook",
          "scripts",
          "helper.mjs",
        ),
      ),
    ).toBe(true);

    const shimPath = path.join(
      baseDir,
      "hooks",
      "transforms",
      "fathom",
      "fathom-transform.mjs",
    );
    expect(fs.existsSync(shimPath)).toBe(true);
    expect(fs.readFileSync(shimPath, "utf8")).toContain(
      '../_backup/fathom-webhook/scripts/fathom-transform.mjs',
    );

    const updatedConfig = JSON.parse(
      fs.readFileSync(path.join(baseDir, "openclaw.json"), "utf8"),
    );
    expect(updatedConfig.hooks.mappings[0].match.path).toBe("fathom");
    expect(updatedConfig.hooks.mappings[0].transform.module).toBe(
      "fathom/fathom-transform.mjs",
    );
  });

  it("normalizes imported hook paths with leading slashes", () => {
    const baseDir = createTempDir();
    const configPath = path.join(baseDir, "openclaw.json");
    fs.writeFileSync(
      configPath,
      JSON.stringify(
        {
          hooks: {
            mappings: [
              {
                name: "Notion",
                match: { path: "//notion-comments" },
                transform: {
                  module: "notion-comments/notion-comments-transform.mjs",
                },
              },
            ],
          },
        },
        null,
        2,
      ),
      "utf8",
    );

    const result = alignHookTransforms({
      fs,
      baseDir,
      configFiles: ["openclaw.json"],
    });

    expect(result).toEqual({ alignedCount: 0 });
    const updatedConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
    expect(updatedConfig.hooks.mappings[0].match.path).toBe("notion-comments");
    expect(updatedConfig.hooks.mappings[0].transform.module).toBe(
      "notion-comments/notion-comments-transform.mjs",
    );
  });

  it("rewrites approved config secrets by config path before fallback replacement", () => {
    const baseDir = createTempDir();
    const configPath = path.join(baseDir, "openclaw.json");
    fs.writeFileSync(
      configPath,
      JSON.stringify(
        {
          channels: {
            discord: {
              token: "discord-live-secret",
            },
          },
          notes: {
            repeatedToken: "discord-live-secret",
          },
        },
        null,
        2,
      ),
      "utf8",
    );

    const result = applySecretExtraction({
      fs,
      baseDir,
      approvedSecrets: [
        {
          file: "openclaw.json",
          configPath: "channels.discord.token",
          value: "discord-live-secret",
          suggestedEnvVar: "DISCORD_BOT_TOKEN",
        },
      ],
    });

    expect(result).toEqual({
      envVars: [
        {
          key: "DISCORD_BOT_TOKEN",
          value: "discord-live-secret",
        },
      ],
    });

    const updatedConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
    expect(updatedConfig.channels.discord.token).toBe("${DISCORD_BOT_TOKEN}");
    expect(updatedConfig.notes.repeatedToken).toBe("${DISCORD_BOT_TOKEN}");
  });
});

const {
  canonicalizeConfigEnvRefs,
} = require("../../lib/server/onboarding/import/import-applier");

describe("import-applier promoteCloneToTarget edge cases", () => {
  it("rejects invalid temp directories", () => {
    const result = promoteCloneToTarget({
      fs,
      tempDir: "/etc/not-a-temp-dir",
      targetDir: createTempDir(),
    });
    expect(result).toEqual({ ok: false, error: "Invalid temp directory" });
  });

  it("rejects missing import source directories", () => {
    const tempDir = createTempDir();
    const result = promoteCloneToTarget({
      fs,
      tempDir,
      targetDir: path.join(tempDir, "target"),
      sourceSubdir: "missing-subdir",
    });
    expect(result).toEqual({
      ok: false,
      error: "Import source directory not found",
    });
  });

  it("merges a source subdir into a non-empty target and removes the temp dir", () => {
    const tempDir = createTempDir();
    const targetDir = createTempDir();
    fs.mkdirSync(path.join(tempDir, "workspace"), { recursive: true });
    fs.writeFileSync(
      path.join(tempDir, "workspace", "AGENTS.md"),
      "# imported\n",
      "utf8",
    );
    fs.writeFileSync(path.join(targetDir, "existing.md"), "keep\n", "utf8");

    const result = promoteCloneToTarget({
      fs,
      tempDir,
      targetDir,
      sourceSubdir: "workspace",
    });

    expect(result).toEqual({ ok: true });
    expect(fs.readFileSync(path.join(targetDir, "AGENTS.md"), "utf8")).toBe(
      "# imported\n",
    );
    expect(fs.existsSync(path.join(targetDir, "existing.md"))).toBe(true);
    expect(fs.existsSync(tempDir)).toBe(false);
  });

  it("replaces an existing empty target directory", () => {
    const tempDir = createTempDir();
    const parentDir = createTempDir();
    const targetDir = path.join(parentDir, "target");
    fs.mkdirSync(targetDir, { recursive: true });
    fs.writeFileSync(path.join(tempDir, "openclaw.json"), "{}", "utf8");

    const result = promoteCloneToTarget({ fs, tempDir, targetDir });

    expect(result).toEqual({ ok: true });
    expect(fs.existsSync(path.join(targetDir, "openclaw.json"))).toBe(true);
    expect(fs.existsSync(tempDir)).toBe(false);
  });

  it("cleans up replaceable bootstrap artifacts and their empty parents", () => {
    const tempDir = createTempDir();
    const targetDir = createTempDir();
    fs.writeFileSync(path.join(tempDir, "openclaw.json"), "{}", "utf8");
    fs.mkdirSync(path.join(targetDir, "workspace", "hooks", "bootstrap"), {
      recursive: true,
    });
    fs.writeFileSync(
      path.join(targetDir, "workspace", "hooks", "bootstrap", "AGENTS.md"),
      "managed\n",
      "utf8",
    );
    fs.writeFileSync(path.join(targetDir, ".env"), "SECRET=1\n", "utf8");
    fs.writeFileSync(path.join(targetDir, "keep.md"), "keep\n", "utf8");

    const result = promoteCloneToTarget({
      fs,
      tempDir,
      targetDir,
      cleanupBootstrap: true,
    });

    expect(result).toEqual({ ok: true });
    expect(fs.existsSync(path.join(targetDir, "workspace", "hooks"))).toBe(false);
    expect(fs.existsSync(path.join(targetDir, ".env"))).toBe(false);
    expect(fs.existsSync(path.join(targetDir, "keep.md"))).toBe(true);
    expect(fs.existsSync(path.join(targetDir, "openclaw.json"))).toBe(true);
  });

  it("falls back to a recursive copy on cross-device rename errors", () => {
    const tempDir = path.join(os.tmpdir(), "alphaclaw-import-exdev-src");
    const targetDir = "/mnt/other-device/openclaw";
    const copies = [];
    const removed = [];
    const mockFs = {
      existsSync: (p) => p === tempDir,
      mkdirSync: vi.fn(),
      renameSync: () => {
        throw Object.assign(new Error("cross-device link"), { code: "EXDEV" });
      },
      readdirSync: (p) => {
        if (p === tempDir) {
          return [
            { name: "sub", isDirectory: () => true },
            { name: "a.txt", isDirectory: () => false },
          ];
        }
        if (p === path.join(tempDir, "sub")) {
          return [{ name: "b.txt", isDirectory: () => false }];
        }
        return [];
      },
      copyFileSync: (src, dest) => copies.push([src, dest]),
      rmSync: (p) => removed.push(p),
    };

    const result = promoteCloneToTarget({
      fs: mockFs,
      tempDir,
      targetDir,
    });

    expect(result).toEqual({ ok: true });
    expect(copies).toEqual([
      [path.join(tempDir, "sub", "b.txt"), path.join(targetDir, "sub", "b.txt")],
      [path.join(tempDir, "a.txt"), path.join(targetDir, "a.txt")],
    ]);
    expect(removed).toContain(tempDir);
  });

  it("reports cross-device copy failures", () => {
    const tempDir = path.join(os.tmpdir(), "alphaclaw-import-exdev-fail");
    const mockFs = {
      existsSync: (p) => p === tempDir,
      mkdirSync: vi.fn(),
      renameSync: () => {
        throw Object.assign(new Error("cross-device link"), { code: "EXDEV" });
      },
      readdirSync: () => [{ name: "a.txt", isDirectory: () => false }],
      copyFileSync: () => {
        throw new Error("disk full");
      },
      rmSync: vi.fn(),
    };

    const result = promoteCloneToTarget({
      fs: mockFs,
      tempDir,
      targetDir: "/mnt/other-device/openclaw",
    });

    expect(result).toEqual({
      ok: false,
      error: "Failed to copy clone: disk full",
    });
  });

  it("reports non-EXDEV rename failures", () => {
    const tempDir = path.join(os.tmpdir(), "alphaclaw-import-rename-fail");
    const mockFs = {
      existsSync: (p) => p === tempDir,
      mkdirSync: vi.fn(),
      renameSync: () => {
        throw new Error("EPERM: operation not permitted");
      },
    };

    const result = promoteCloneToTarget({
      fs: mockFs,
      tempDir,
      targetDir: "/opt/openclaw",
    });

    expect(result).toEqual({
      ok: false,
      error: "Failed to promote clone: EPERM: operation not permitted",
    });
  });

  it("merges entries via copy when per-entry renames hit EXDEV", () => {
    const tempDir = path.join(os.tmpdir(), "alphaclaw-import-exdev-merge");
    const targetDir = "/opt/openclaw-target";
    const copies = [];
    const removed = [];
    const mockFs = {
      existsSync: (p) => p === tempDir || p === targetDir,
      mkdirSync: vi.fn(),
      renameSync: () => {
        throw Object.assign(new Error("cross-device link"), { code: "EXDEV" });
      },
      readdirSync: (p, opts) => {
        if (p === targetDir) return ["existing.txt"];
        if (p === tempDir) {
          return [
            {},
            { name: "dir1", isDirectory: () => true },
            { name: "file1.txt", isDirectory: () => false },
          ];
        }
        if (p === path.join(tempDir, "dir1")) {
          return [{ name: "inner.txt", isDirectory: () => false }];
        }
        return [];
      },
      statSync: (p) => ({
        isDirectory: () => p === path.join(tempDir, "dir1"),
      }),
      copyFileSync: (src, dest) => copies.push([src, dest]),
      rmSync: (p) => removed.push(p),
    };

    const result = promoteCloneToTarget({ fs: mockFs, tempDir, targetDir });

    expect(result).toEqual({ ok: true });
    expect(copies).toEqual([
      [
        path.join(tempDir, "dir1", "inner.txt"),
        path.join(targetDir, "dir1", "inner.txt"),
      ],
      [path.join(tempDir, "file1.txt"), path.join(targetDir, "file1.txt")],
    ]);
    expect(removed).toContain(path.join(tempDir, "dir1"));
    expect(removed).toContain(path.join(tempDir, "file1.txt"));
    expect(removed).toContain(tempDir);
  });

  it("fails the merge when a per-entry rename raises a non-EXDEV error", () => {
    const tempDir = path.join(os.tmpdir(), "alphaclaw-import-merge-fail");
    const targetDir = "/opt/openclaw-target";
    const mockFs = {
      existsSync: (p) => p === tempDir || p === targetDir,
      mkdirSync: vi.fn(),
      renameSync: () => {
        throw new Error("EACCES: permission denied");
      },
      readdirSync: (p) => {
        if (p === targetDir) return ["existing.txt"];
        if (p === tempDir) {
          return [{ name: "file1.txt", isDirectory: () => false }];
        }
        return [];
      },
      rmSync: vi.fn(),
    };

    const result = promoteCloneToTarget({ fs: mockFs, tempDir, targetDir });

    expect(result).toEqual({
      ok: false,
      error: "Failed to promote clone: EACCES: permission denied",
    });
  });
});

describe("import-applier alignHookTransforms edge cases", () => {
  it("skips config files that are not valid JSON", () => {
    const tempDir = createTempDir();
    fs.writeFileSync(path.join(tempDir, "openclaw.json"), "not json", "utf8");

    const result = alignHookTransforms({
      fs,
      baseDir: tempDir,
      configFiles: ["openclaw.json"],
    });

    expect(result).toEqual({ alignedCount: 0 });
  });

  it("writes shims with non-relative-looking import paths for _backup hooks", () => {
    const baseDir = "/tmp/align-backup-hook";
    const configPath = path.join(baseDir, "openclaw.json");
    const files = new Map([
      [
        configPath,
        JSON.stringify({
          hooks: {
            mappings: [
              {
                match: { path: "_backup" },
                transform: { module: "_backup/legacy.mjs" },
              },
            ],
          },
        }),
      ],
    ]);
    const writes = new Map();
    const actualAbsolutePath = path.join(
      baseDir,
      "hooks",
      "transforms",
      "_backup",
      "legacy.mjs",
    );
    const sourceRoot = path.join(baseDir, "hooks", "transforms", "_backup");
    const mockFs = {
      readFileSync: (p) => {
        if (files.has(p)) return files.get(p);
        throw Object.assign(new Error("ENOENT"), { code: "ENOENT" });
      },
      existsSync: (p) => p === actualAbsolutePath || p === sourceRoot,
      mkdirSync: vi.fn(),
      renameSync: vi.fn(),
      writeFileSync: (p, content) => writes.set(p, content),
    };

    const result = alignHookTransforms({
      fs: mockFs,
      baseDir,
      configFiles: ["openclaw.json"],
    });

    expect(result).toEqual({ alignedCount: 1 });
    const shimPath = path.join(
      baseDir,
      "hooks",
      "transforms",
      "_backup",
      "_backup-transform.mjs",
    );
    expect(writes.get(shimPath)).toContain('from "./_backup/legacy.mjs"');
    const updatedConfig = JSON.parse(writes.get(configPath));
    expect(updatedConfig.hooks.mappings[0].transform.module).toBe(
      "_backup/_backup-transform.mjs",
    );
  });

  it("treats existence check failures as missing transform modules", () => {
    const baseDir = "/tmp/align-throwing-fs";
    const configPath = path.join(baseDir, "openclaw.json");
    const mockFs = {
      readFileSync: (p) => {
        if (p === configPath) {
          return JSON.stringify({
            hooks: {
              mappings: [
                {
                  match: { path: "gmail" },
                  transform: { module: "old-gmail/transform.mjs" },
                },
              ],
            },
          });
        }
        throw Object.assign(new Error("ENOENT"), { code: "ENOENT" });
      },
      existsSync: () => {
        throw new Error("stat failure");
      },
      writeFileSync: vi.fn(),
    };

    const result = alignHookTransforms({
      fs: mockFs,
      baseDir,
      configFiles: ["openclaw.json"],
    });

    expect(result).toEqual({ alignedCount: 0 });
  });
});

describe("import-applier applySecretExtraction edge cases", () => {
  it("skips rewrites for files that escape the import directory", () => {
    const writeFileSync = vi.fn();
    const mockFs = {
      readFileSync: vi.fn(),
      writeFileSync,
    };

    const result = applySecretExtraction({
      fs: mockFs,
      baseDir: "/tmp/import-base",
      approvedSecrets: [
        {
          file: "nested/../../evil.json",
          configPath: "models.providers.openai.apiKey",
          value: "sk-escape-secret",
          suggestedEnvVar: "OPENAI_API_KEY",
        },
      ],
    });

    expect(result.envVars).toEqual([
      { key: "OPENAI_API_KEY", value: "sk-escape-secret" },
    ]);
    expect(writeFileSync).not.toHaveBeenCalled();
  });

  it("falls back to string replacement when config paths do not resolve", () => {
    const tempDir = createTempDir();
    fs.writeFileSync(
      path.join(tempDir, "config.json"),
      JSON.stringify({ token: "secret-value-one", other: "secret-value-two" }),
      "utf8",
    );

    const result = applySecretExtraction({
      fs,
      baseDir: tempDir,
      approvedSecrets: [
        {
          file: "config.json",
          configPath: "",
          value: "secret-value-one",
          suggestedEnvVar: "TOKEN_ONE",
        },
        {
          file: "config.json",
          configPath: "missing.branch.path",
          value: "secret-value-two",
          suggestedEnvVar: "TOKEN_TWO",
        },
      ],
    });

    expect(result.envVars).toEqual([
      { key: "TOKEN_ONE", value: "secret-value-one" },
      { key: "TOKEN_TWO", value: "secret-value-two" },
    ]);
    const content = fs.readFileSync(path.join(tempDir, "config.json"), "utf8");
    expect(content).toContain('"${TOKEN_ONE}"');
    expect(content).toContain('"${TOKEN_TWO}"');
    expect(content).not.toContain("secret-value-one");
    expect(content).not.toContain("secret-value-two");
  });

  it("rewrites secrets in non-JSON files via string replacement", () => {
    const tempDir = createTempDir();
    fs.writeFileSync(
      path.join(tempDir, "notes.txt"),
      'token: "plain-text-secret"\n',
      "utf8",
    );

    const result = applySecretExtraction({
      fs,
      baseDir: tempDir,
      approvedSecrets: [
        {
          file: "notes.txt",
          configPath: "token",
          value: "plain-text-secret",
          suggestedEnvVar: "PLAIN_TOKEN",
        },
      ],
    });

    expect(result.envVars).toEqual([
      { key: "PLAIN_TOKEN", value: "plain-text-secret" },
    ]);
    expect(fs.readFileSync(path.join(tempDir, "notes.txt"), "utf8")).toBe(
      'token: "${PLAIN_TOKEN}"\n',
    );
  });

  it("logs rewrite errors without throwing", () => {
    const mockFs = {
      readFileSync: () => {
        throw new Error("EACCES: read denied");
      },
      writeFileSync: vi.fn(),
    };
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = applySecretExtraction({
      fs: mockFs,
      baseDir: "/tmp/import-base",
      approvedSecrets: [
        {
          file: "config.json",
          configPath: "token",
          value: "some-secret",
          suggestedEnvVar: "SOME_TOKEN",
        },
      ],
    });

    expect(result.envVars).toEqual([{ key: "SOME_TOKEN", value: "some-secret" }]);
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining("[import] Rewrite error for"),
    );
  });
});

describe("import-applier canonicalizeConfigEnvRefs env var remapping", () => {
  it("drops empty keys and keeps the last value for duplicate keys", () => {
    const result = canonicalizeConfigEnvRefs({
      fs,
      baseDir: "/tmp/never-used",
      configFiles: [],
      envVars: [
        { key: "", value: "ignored" },
        { key: "SHARED_KEY", value: "first" },
        { key: "SHARED_KEY", value: "second" },
      ],
    });

    expect(result.envVars).toEqual([{ key: "SHARED_KEY", value: "second" }]);
    expect(result.rewrittenRefs).toBe(0);
    expect(result.renamedEnvVars).toBe(0);
  });
});
