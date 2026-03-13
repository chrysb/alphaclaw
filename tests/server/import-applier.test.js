const fs = require("fs");
const os = require("os");
const path = require("path");

const {
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
