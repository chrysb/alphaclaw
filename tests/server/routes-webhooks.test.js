const path = require("path");
const express = require("express");
const request = require("supertest");

const { createWebhook } = require("../../lib/server/webhooks");
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
});
