const path = require("path");
const express = require("express");
const request = require("supertest");

const {
  createWebhook,
  getTransformRelativePath,
} = require("../../lib/server/webhooks");
const { registerWebhookRoutes } = require("../../lib/server/routes/webhooks");

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
      if (!files.has(filePath)) throw new Error(`File not found: ${filePath}`);
      return files.get(filePath);
    },
    writeFileSync: (filePath, contents) => {
      files.set(filePath, String(contents));
    },
    mkdirSync: () => {},
    rmSync: () => {},
    statSync: (filePath) => {
      if (!files.has(filePath)) throw new Error(`File not found: ${filePath}`);
      return {
        birthtime: { toISOString: () => "2026-03-08T00:00:00.000Z" },
        ctime: { toISOString: () => "2026-03-08T00:00:00.000Z" },
      };
    },
  };
};

const createApp = ({ fs, constants, webhooksDb }) => {
  const app = express();
  app.use(express.json());
  registerWebhookRoutes({
    app,
    fs,
    constants,
    getBaseUrl: () => "https://alphaclaw.example.com",
    webhooksDb,
    restartRequiredState: {
      markRequired: () => {},
      getSnapshot: async () => ({ restartRequired: false }),
    },
  });
  return app;
};

describe("server/routes/webhooks", () => {
  it("creates webhook oauth callback alias when requested at creation", async () => {
    const openclawDir = "/tmp/openclaw";
    const configPath = path.join(openclawDir, "openclaw.json");
    const fs = createMemoryFs({
      [configPath]: JSON.stringify({
        agents: {
          list: [{ id: "main", default: true }],
        },
      }),
    });
    const createOauthCallbackCalls = [];
    const app = createApp({
      fs,
      constants: { OPENCLAW_DIR: openclawDir },
      webhooksDb: {
        getHookSummaries: () => [],
        getRequests: () => [],
        getRequestById: () => null,
        deleteRequestsByHook: () => 0,
        createOauthCallback: ({ hookName }) => {
          createOauthCallbackCalls.push(hookName);
          return {
            callbackId: "0123456789abcdef0123456789abcdef",
            hookName,
            createdAt: "2026-03-15T12:00:00.000Z",
            rotatedAt: null,
            lastUsedAt: null,
          };
        },
        getOauthCallbackByHook: () => null,
        rotateOauthCallback: () => null,
        deleteOauthCallback: () => 0,
      },
    });

    const response = await request(app).post("/api/webhooks").send({
      name: "schwab-oauth",
      oauthCallback: true,
    });

    expect(response.status).toBe(201);
    expect(createOauthCallbackCalls).toEqual(["schwab-oauth"]);
    expect(response.body?.webhook?.path).toBe("/hooks/schwab-oauth");
    expect(response.body?.webhook?.oauthCallbackId).toBe(
      "0123456789abcdef0123456789abcdef",
    );
    expect(response.body?.webhook?.oauthCallbackUrl).toBe(
      "https://alphaclaw.example.com/oauth/0123456789abcdef0123456789abcdef",
    );
    const transformPath = path.join(
      openclawDir,
      getTransformRelativePath("schwab-oauth"),
    );
    const transformSource = fs.readFileSync(transformPath, "utf8");
    expect(transformSource).toContain("message: message || fallbackMessage");
    expect(transformSource).toContain(
      "OAuth callback received (authorization code present)",
    );
  });

  it("deletes oauth callback alias when deleting webhook", async () => {
    const openclawDir = "/tmp/openclaw";
    const configPath = path.join(openclawDir, "openclaw.json");
    const fs = createMemoryFs({
      [configPath]: JSON.stringify({
        agents: {
          list: [{ id: "main", default: true }],
        },
      }),
    });
    createWebhook({
      fs,
      constants: { OPENCLAW_DIR: openclawDir },
      name: "schwab-oauth",
    });
    const deleteOauthCallbackCalls = [];
    const app = createApp({
      fs,
      constants: { OPENCLAW_DIR: openclawDir },
      webhooksDb: {
        getHookSummaries: () => [],
        getRequests: () => [],
        getRequestById: () => null,
        deleteRequestsByHook: () => 0,
        createOauthCallback: () => null,
        getOauthCallbackByHook: () => null,
        rotateOauthCallback: () => null,
        deleteOauthCallback: (hookName) => {
          deleteOauthCallbackCalls.push(hookName);
          return 1;
        },
      },
    });

    const response = await request(app)
      .delete("/api/webhooks/schwab-oauth")
      .send({ deleteTransformDir: false });

    expect(response.status).toBe(200);
    expect(deleteOauthCallbackCalls).toEqual(["schwab-oauth"]);
    expect(response.body?.ok).toBe(true);
  });

  it("updates webhook destination mapping", async () => {
    const openclawDir = "/tmp/openclaw";
    const configPath = path.join(openclawDir, "openclaw.json");
    const fs = createMemoryFs({
      [configPath]: JSON.stringify({
        agents: {
          list: [
            { id: "main", default: true },
            { id: "alpha" },
          ],
        },
      }),
    });
    createWebhook({
      fs,
      constants: { OPENCLAW_DIR: openclawDir },
      name: "route-test",
      destination: {
        channel: "direct",
        to: "old-session",
        agentId: "main",
      },
    });
    const app = createApp({
      fs,
      constants: { OPENCLAW_DIR: openclawDir },
      webhooksDb: {
        getHookSummaries: () => [],
        getRequests: () => [],
        getRequestById: () => null,
        deleteRequestsByHook: () => 0,
        createOauthCallback: () => null,
        getOauthCallbackByHook: () => null,
        rotateOauthCallback: () => null,
        deleteOauthCallback: () => 0,
      },
    });

    const response = await request(app)
      .put("/api/webhooks/route-test/destination")
      .send({
        destination: {
          channel: "group",
          to: "new-session",
          agentId: "alpha",
        },
      });

    expect(response.status).toBe(200);
    expect(response.body?.ok).toBe(true);
    expect(response.body?.webhook?.channel).toBe("group");
    expect(response.body?.webhook?.to).toBe("new-session");
    expect(response.body?.webhook?.agentId).toBe("alpha");
  });

  it("uses the recent request window for webhook health", async () => {
    const openclawDir = "/tmp/openclaw";
    const configPath = path.join(openclawDir, "openclaw.json");
    const fs = createMemoryFs({
      [configPath]: JSON.stringify({
        agents: {
          list: [{ id: "main", default: true }],
        },
      }),
    });
    createWebhook({
      fs,
      constants: { OPENCLAW_DIR: openclawDir },
      name: "recent-health",
    });
    const app = createApp({
      fs,
      constants: { OPENCLAW_DIR: openclawDir },
      webhooksDb: {
        getHookSummaries: () => [
          {
            hookName: "recent-health",
            lastReceived: "2026-04-02T12:00:00.000Z",
            totalCount: 30,
            successCount: 25,
            errorCount: 5,
            recentTotalCount: 25,
            recentSuccessCount: 25,
            recentErrorCount: 0,
            healthWindowSize: 25,
          },
        ],
        getRequests: () => [],
        getRequestById: () => null,
        deleteRequestsByHook: () => 0,
        createOauthCallback: () => null,
        getOauthCallbackByHook: () => null,
        rotateOauthCallback: () => null,
        deleteOauthCallback: () => 0,
      },
    });

    const response = await request(app).get("/api/webhooks");

    expect(response.status).toBe(200);
    expect(response.body?.webhooks).toHaveLength(1);
    expect(response.body?.webhooks?.[0]?.errorCount).toBe(5);
    expect(response.body?.webhooks?.[0]?.recentErrorCount).toBe(0);
    expect(response.body?.webhooks?.[0]?.healthWindowSize).toBe(25);
    expect(response.body?.webhooks?.[0]?.health).toBe("green");
  });
});
