const { createGmailWatchService } = require("../../lib/server/gmail-watch");

const createMemoryFs = (initialFiles = {}) => {
  const files = new Map(
    Object.entries(initialFiles).map(([filePath, contents]) => [
      filePath,
      String(contents),
    ]),
  );

  return {
    existsSync: (filePath) => files.has(filePath),
    readFileSync: (filePath) => {
      if (!files.has(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }
      return files.get(filePath);
    },
    writeFileSync: (filePath, contents) => {
      files.set(filePath, String(contents));
    },
    mkdirSync: () => {},
    readJson: (filePath) => JSON.parse(String(files.get(filePath) || "null")),
  };
};

describe("server/gmail-watch", () => {
  it("replaces the saved topic path when the project id changes", () => {
    const statePath = "/tmp/gogcli/state.json";
    const configDir = "/tmp/gogcli";
    const fs = createMemoryFs({
      [statePath]: JSON.stringify({
        version: 2,
        accounts: [],
        gmailPush: {
          token: "push-token",
          topics: {
            default: "projects/old-project/topics/gog-gmail-watch",
          },
        },
      }),
    });
    const service = createGmailWatchService({
      fs,
      constants: {
        GOG_STATE_PATH: statePath,
        GOG_CONFIG_DIR: configDir,
        OPENCLAW_DIR: "/tmp/.openclaw",
      },
      gogCmd: async () => ({ ok: true, stdout: "", stderr: "" }),
      getBaseUrl: () => "https://alphaclaw.example",
      readGoogleCredentials: () => ({
        projectId: null,
      }),
      readEnvFile: () => [],
      writeEnvFile: () => {},
      reloadEnv: () => {},
      restartRequiredState: null,
    });

    const result = service.saveClientConfig({
      req: {},
      body: {
        client: "default",
        projectId: "new-project",
      },
    });

    expect(result.topicPath).toBe(
      "projects/new-project/topics/gog-gmail-watch",
    );
    expect(result.client.projectId).toBe("new-project");
    expect(fs.readJson(statePath)?.gmailPush?.topics?.default).toBe(
      "projects/new-project/topics/gog-gmail-watch",
    );
  });

  it("reports whether the Gmail transform already exists in client config", () => {
    const statePath = "/tmp/gogcli/state.json";
    const configDir = "/tmp/gogcli";
    const openclawDir = "/tmp/.openclaw";
    const fs = createMemoryFs({
      [statePath]: JSON.stringify({
        version: 2,
        accounts: [
          {
            id: "acct-1",
            email: "ops@example.com",
            client: "default",
            services: ["gmail:read"],
            gmailWatch: {},
          },
        ],
        gmailPush: {
          token: "push-token",
          topics: {
            default: "projects/my-project/topics/gog-gmail-watch",
          },
        },
      }),
      [`${openclawDir}/hooks/transforms/gmail/gmail-transform.mjs`]:
        "export default async function transform() {}",
    });
    const service = createGmailWatchService({
      fs,
      constants: {
        GOG_STATE_PATH: statePath,
        GOG_CONFIG_DIR: configDir,
        OPENCLAW_DIR: openclawDir,
      },
      gogCmd: async () => ({ ok: true, stdout: "", stderr: "" }),
      getBaseUrl: () => "https://alphaclaw.example",
      readGoogleCredentials: () => ({
        projectId: "my-project",
      }),
      readEnvFile: () => [],
      writeEnvFile: () => {},
      reloadEnv: () => {},
      restartRequiredState: null,
    });

    const result = service.getConfig({ req: {} });

    expect(result.clients).toEqual([
      expect.objectContaining({
        client: "default",
        configured: true,
        transformExists: true,
        webhookExists: false,
      }),
    ]);
  });

  it("reports webhookExists when gmail mapping is present in openclaw config", () => {
    const statePath = "/tmp/gogcli/state.json";
    const configDir = "/tmp/gogcli";
    const openclawDir = "/tmp/.openclaw";
    const fs = createMemoryFs({
      [statePath]: JSON.stringify({
        version: 2,
        accounts: [
          {
            id: "acct-1",
            email: "ops@example.com",
            client: "default",
            services: ["gmail:read"],
            gmailWatch: {},
          },
        ],
        gmailPush: {
          token: "push-token",
          topics: {
            default: "projects/my-project/topics/gog-gmail-watch",
          },
        },
      }),
      [`${openclawDir}/openclaw.json`]: JSON.stringify({
        hooks: {
          mappings: [{ match: { path: "gmail" } }],
        },
      }),
    });
    const service = createGmailWatchService({
      fs,
      constants: {
        GOG_STATE_PATH: statePath,
        GOG_CONFIG_DIR: configDir,
        OPENCLAW_DIR: openclawDir,
      },
      gogCmd: async () => ({ ok: true, stdout: "", stderr: "" }),
      getBaseUrl: () => "https://alphaclaw.example",
      readGoogleCredentials: () => ({
        projectId: "my-project",
      }),
      readEnvFile: () => [],
      writeEnvFile: () => {},
      reloadEnv: () => {},
      restartRequiredState: null,
    });

    const result = service.getConfig({ req: {} });
    expect(result.clients).toEqual([
      expect.objectContaining({
        client: "default",
        webhookExists: true,
      }),
    ]);
  });

  it("preserves an existing custom Gmail transform while ensuring hook wiring", () => {
    const statePath = "/tmp/gogcli/state.json";
    const configDir = "/tmp/gogcli";
    const openclawDir = "/tmp/.openclaw";
    const configPath = `${openclawDir}/openclaw.json`;
    const transformPath = `${openclawDir}/hooks/transforms/gmail/gmail-transform.mjs`;
    const customTransformSource =
      "export default async function transform(payload) {\n" +
      "  return { message: payload?.custom || \"custom\" };\n" +
      "}\n";
    const fs = createMemoryFs({
      [statePath]: JSON.stringify({
        version: 2,
        accounts: [],
        gmailPush: {
          token: "push-token",
          topics: {},
        },
      }),
      [configPath]: JSON.stringify({
        agents: {
          list: [{ id: "main", default: true }],
        },
        hooks: {
          enabled: true,
          token: "${WEBHOOK_TOKEN}",
          presets: ["gmail"],
          mappings: [
            {
              match: { path: "gmail" },
              action: "agent",
              name: "Gmail",
              wakeMode: "now",
              transform: { module: "gmail/gmail-transform.mjs" },
            },
          ],
        },
      }),
      [transformPath]: customTransformSource,
    });
    const service = createGmailWatchService({
      fs,
      constants: {
        GOG_STATE_PATH: statePath,
        GOG_CONFIG_DIR: configDir,
        OPENCLAW_DIR: openclawDir,
      },
      gogCmd: async () => ({ ok: true, stdout: "", stderr: "" }),
      getBaseUrl: () => "https://alphaclaw.example",
      readGoogleCredentials: () => ({
        projectId: "my-project",
      }),
      readEnvFile: () => [{ key: "WEBHOOK_TOKEN", value: "existing-token" }],
      writeEnvFile: () => {},
      reloadEnv: () => {},
      restartRequiredState: null,
    });

    service.ensureHookWiring({
      destination: {
        channel: "telegram",
        to: "-100123",
        agentId: "main",
      },
    });

    expect(fs.readFileSync(transformPath, "utf8")).toBe(customTransformSource);
  });
});
