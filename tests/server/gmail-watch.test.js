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
});
