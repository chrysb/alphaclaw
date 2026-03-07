const path = require("path");
const {
  scanWorkspace,
} = require("../../lib/server/onboarding/import/import-scanner");

const createMockFs = (files = {}, dirs = []) => {
  const fileMap = new Map(Object.entries(files));
  const dirSet = new Set(dirs);

  return {
    statSync: (p) => {
      const rel = p;
      if (fileMap.has(rel))
        return { isFile: () => true, isDirectory: () => false };
      if (dirSet.has(rel))
        return { isFile: () => false, isDirectory: () => true };
      throw Object.assign(new Error("ENOENT"), { code: "ENOENT" });
    },
    readFileSync: (p, enc) => {
      const rel = p;
      if (fileMap.has(rel)) return fileMap.get(rel);
      throw Object.assign(new Error("ENOENT"), { code: "ENOENT" });
    },
    readdirSync: (dirPath, opts) => {
      const entries = [];
      for (const [fp] of fileMap) {
        const parent = path.dirname(fp);
        if (parent === dirPath) {
          const name = path.basename(fp);
          entries.push({
            name,
            isFile: () => true,
            isDirectory: () => false,
          });
        }
      }
      for (const dp of dirSet) {
        const parent = path.dirname(dp);
        if (parent === dirPath) {
          const name = path.basename(dp);
          if (!entries.some((e) => e.name === name)) {
            entries.push({
              name,
              isFile: () => false,
              isDirectory: () => true,
            });
          }
        }
      }
      return entries;
    },
  };
};

describe("import-scanner", () => {
  it("detects an empty repo", () => {
    const fs = createMockFs({}, []);
    const result = scanWorkspace({ fs, baseDir: "/tmp/test" });
    expect(result.isEmpty).toBe(true);
    expect(result.hasOpenclawSetup).toBe(false);
    expect(result.gatewayConfig.found).toBe(false);
  });

  it("detects openclaw.json as gateway config", () => {
    const fs = createMockFs({
      "/tmp/test/openclaw.json": JSON.stringify({
        channels: { telegram: { botToken: "123" } },
      }),
    });
    const result = scanWorkspace({ fs, baseDir: "/tmp/test" });
    expect(result.hasOpenclawSetup).toBe(true);
    expect(result.gatewayConfig.found).toBe(true);
    expect(result.gatewayConfig.files).toContain("openclaw.json");
    expect(result.sourceLayout).toEqual({
      kind: "full-openclaw-root",
      supported: true,
      promoteSourceSubdir: "",
    });
  });

  it("ignores openclaw.json5 as an unsupported config filename", () => {
    const fs = createMockFs({
      "/tmp/test/openclaw.json5": JSON.stringify({
        channels: { telegram: { botToken: "123" } },
      }),
    });
    const result = scanWorkspace({ fs, baseDir: "/tmp/test" });
    expect(result.hasOpenclawSetup).toBe(false);
    expect(result.gatewayConfig.found).toBe(false);
    expect(result.sourceLayout).toEqual({
      kind: "empty",
      supported: true,
      promoteSourceSubdir: "",
    });
  });

  it("rejects nested .openclaw/openclaw.json sources", () => {
    const fs = createMockFs({
      "/tmp/test/.openclaw/openclaw.json": "{}",
    });
    const result = scanWorkspace({ fs, baseDir: "/tmp/test" });
    expect(result.gatewayConfig.found).toBe(false);
    expect(result.unsupportedNested).toEqual({
      found: true,
      files: [".openclaw/openclaw.json"],
    });
    expect(result.sourceLayout).toEqual({
      kind: "unsupported-nested-openclaw",
      supported: false,
      error:
        "This import source contains a nested .openclaw config. Point the source at the OpenClaw root itself, or at a workspace-only repo instead.",
    });
  });

  it("rejects nested .openclaw env files as unsupported", () => {
    const fs = createMockFs({
      "/tmp/test/.openclaw/.env": "FOO=bar",
    });
    const result = scanWorkspace({ fs, baseDir: "/tmp/test" });
    expect(result.envFiles.found).toBe(false);
    expect(result.unsupportedNested).toEqual({
      found: true,
      files: [".openclaw/.env"],
    });
    expect(result.sourceLayout).toEqual({
      kind: "unsupported-nested-openclaw",
      supported: false,
      error:
        "This import source contains a nested .openclaw config. Point the source at the OpenClaw root itself, or at a workspace-only repo instead.",
    });
  });

  it("detects .env files", () => {
    const fs = createMockFs({
      "/tmp/test/.env": "FOO=bar",
      "/tmp/test/.env.local": "BAZ=qux",
    });
    const result = scanWorkspace({ fs, baseDir: "/tmp/test" });
    expect(result.envFiles.found).toBe(true);
    expect(result.envFiles.files).toEqual([".env", ".env.local"]);
  });

  it("detects workspace markdown files", () => {
    const fs = createMockFs({
      "/tmp/test/AGENTS.md": "# agents",
      "/tmp/test/SOUL.md": "# soul",
      "/tmp/test/CUSTOM.md": "# custom",
    });
    const result = scanWorkspace({ fs, baseDir: "/tmp/test" });
    expect(result.workspaceFiles.found).toBe(true);
    expect(result.workspaceFiles.files).toContain("AGENTS.md");
    expect(result.workspaceFiles.files).toContain("SOUL.md");
    expect(result.workspaceFiles.extraMarkdown).toContain("CUSTOM.md");
  });

  it("detects cron jobs", () => {
    const fs = createMockFs({
      "/tmp/test/cron/jobs.json": JSON.stringify({
        version: 1,
        jobs: [
          { id: "job-1", name: "Weekday Morning Briefing" },
          { id: "job-2", name: "Sunday Weekly Briefing" },
          { id: "job-3" },
        ],
      }),
    });
    const result = scanWorkspace({ fs, baseDir: "/tmp/test" });
    expect(result.cronJobs.found).toBe(true);
    expect(result.cronJobs.files).toContain("cron/jobs.json");
    expect(result.cronJobs.jobCount).toBe(3);
    expect(result.cronJobs.jobNames).toEqual([
      "Weekday Morning Briefing",
      "Sunday Weekly Briefing",
      "job-3",
    ]);
  });

  it("detects hook definitions from openclaw.json", () => {
    const fs = createMockFs({
      "/tmp/test/openclaw.json": JSON.stringify({
        hooks: {
          mappings: [
            {
              id: "fathom",
              name: "Fathom",
              match: { path: "/fathom" },
            },
            {
              id: "gmail",
              name: "Gmail",
              match: { path: "/gmail" },
            },
          ],
          internal: {
            entries: {
              "session-memory": { enabled: true },
              "command-logger": { enabled: false },
            },
          },
        },
      }),
    });
    const result = scanWorkspace({ fs, baseDir: "/tmp/test" });
    expect(result.webhooks.found).toBe(true);
    expect(result.webhooks.hookCount).toBe(4);
    expect(result.webhooks.hookNames).toEqual([
      "Fathom (fathom)",
      "Gmail (gmail)",
      "internal:session-memory",
      "internal:command-logger (disabled)",
    ]);
  });

  it("flags hook transform modules that do not match the expected layout", () => {
    const fs = createMockFs({
      "/tmp/test/openclaw.json": JSON.stringify({
        hooks: {
          mappings: [
            {
              id: "fathom",
              name: "Fathom",
              match: { path: "/fathom" },
              transform: {
                module: "fathom-webhook/scripts/fathom-transform.mjs",
              },
            },
            {
              id: "gmail",
              name: "Gmail",
              match: { path: "/gmail" },
              transform: {
                module: "gmail/gmail-transform.mjs",
              },
            },
          ],
        },
      }),
    });
    const result = scanWorkspace({ fs, baseDir: "/tmp/test" });
    expect(result.webhooks.warningCount).toBe(1);
    expect(result.webhooks.transformWarnings).toEqual([
      {
        hookLabel: "Fathom (fathom)",
        actualPath:
          "hooks/transforms/fathom-webhook/scripts/fathom-transform.mjs",
        expectedPath: "hooks/transforms/fathom/fathom-transform.mjs",
        message:
          "Uses hooks/transforms/fathom-webhook/scripts/fathom-transform.mjs; expected hooks/transforms/fathom/fathom-transform.mjs",
      },
    ]);
  });

  it("detects managed file conflicts", () => {
    const fs = createMockFs(
      {
        "/tmp/test/hooks/bootstrap/AGENTS.md": "custom",
        "/tmp/test/.gitignore": "# user gitignore",
      },
      ["/tmp/test/.alphaclaw"],
    );
    const result = scanWorkspace({ fs, baseDir: "/tmp/test" });
    expect(result.managedConflicts.found).toBe(true);
    expect(result.managedConflicts.files).toContain(
      "hooks/bootstrap/AGENTS.md",
    );
    expect(result.managedConflicts.files).toContain(".gitignore");
    expect(result.managedConflicts.dirs).toContain(".alphaclaw");
  });

  it("detects deployment-managed env vars referenced by imported config", () => {
    const fs = createMockFs({
      "/tmp/test/openclaw.json": JSON.stringify({
        hooks: {
          token: "${WEBHOOK_TOKEN}",
        },
        gateway: {
          auth: {
            token: "${GATEWAY_AUTH_TOKEN}",
          },
        },
      }),
      "/tmp/test/.env":
        "OPENCLAW_GATEWAY_TOKEN=runtime\nWEBHOOK_TOKEN=repo-value\n",
    });
    const result = scanWorkspace({ fs, baseDir: "/tmp/test" });
    expect(result.managedEnvConflicts).toEqual({
      found: true,
      vars: ["OPENCLAW_GATEWAY_TOKEN", "WEBHOOK_TOKEN"],
      gatewayAuthNormalized: true,
    });
  });

  it("flags credential dirs without importing", () => {
    const fs = createMockFs({}, [
      "/tmp/test/credentials",
      "/tmp/test/identity",
    ]);
    const result = scanWorkspace({ fs, baseDir: "/tmp/test" });
    expect(result.credentials.found).toBe(true);
    expect(result.credentials.dirs).toContain("credentials");
    expect(result.credentials.dirs).toContain("identity");
  });

  it("follows $include references in config", () => {
    const fs = createMockFs({
      "/tmp/test/openclaw.json": JSON.stringify({
        channels: { $include: "channels.json" },
      }),
      "/tmp/test/channels.json": JSON.stringify({ telegram: {} }),
    });
    const result = scanWorkspace({ fs, baseDir: "/tmp/test" });
    expect(result.gatewayConfig.files).toContain("channels.json");
  });

  it("classifies root workspace content as workspace-only", () => {
    const fs = createMockFs({
      "/tmp/test/AGENTS.md": "# agents",
      "/tmp/test/skills/email/SKILL.md": "# skill",
    });
    const result = scanWorkspace({ fs, baseDir: "/tmp/test" });
    expect(result.sourceLayout).toEqual({
      kind: "workspace-only",
      supported: true,
      promoteSourceSubdir: "",
    });
  });

  it("classifies nested workspace directory repos as workspace-only", () => {
    const fs = createMockFs(
      {
        "/tmp/test/workspace/skills/email/SKILL.md": "# skill",
      },
      [
        "/tmp/test/workspace",
        "/tmp/test/workspace/skills",
        "/tmp/test/workspace/skills/email",
      ],
    );
    const result = scanWorkspace({ fs, baseDir: "/tmp/test" });
    expect(result.skills.files).toContain("email/SKILL.md");
    expect(result.sourceLayout).toEqual({
      kind: "workspace-only",
      supported: true,
      promoteSourceSubdir: "workspace",
    });
  });
});
