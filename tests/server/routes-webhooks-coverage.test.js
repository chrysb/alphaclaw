const path = require("path");
const express = require("express");
const request = require("supertest");

const { createWebhook } = require("../../lib/server/webhooks");
const { registerWebhookRoutes } = require("../../lib/server/routes/webhooks");

const openclawDir = "/tmp/openclaw-webhook-routes";
const configPath = path.join(openclawDir, "openclaw.json");
const constants = { OPENCLAW_DIR: openclawDir };

const createMemoryFs = (initialFiles = {}) => {
  const files = new Map(
    Object.entries(initialFiles).map(([filePath, contents]) => [
      filePath,
      String(contents),
    ]),
  );

  return {
    files,
    existsSync: (filePath) => files.has(filePath),
    readFileSync: (filePath) => {
      if (!files.has(filePath)) throw new Error(`File not found: ${filePath}`);
      return files.get(filePath);
    },
    writeFileSync: (filePath, contents) => {
      files.set(filePath, String(contents));
    },
    mkdirSync: () => {},
    rmSync: (dirPath) => {
      for (const filePath of [...files.keys()]) {
        if (filePath === dirPath || filePath.startsWith(`${dirPath}/`)) {
          files.delete(filePath);
        }
      }
    },
    statSync: (filePath) => {
      if (!files.has(filePath)) throw new Error(`File not found: ${filePath}`);
      return {
        birthtime: { toISOString: () => "2026-03-08T00:00:00.000Z" },
        ctime: { toISOString: () => "2026-03-08T00:00:00.000Z" },
      };
    },
  };
};

const createConfigFs = (config = { agents: { list: [{ id: "main", default: true }] } }) =>
  createMemoryFs({ [configPath]: JSON.stringify(config) });

const kOauthRecord = {
  callbackId: "cb-0123456789abcdef",
  createdAt: "2026-01-01T00:00:00.000Z",
  rotatedAt: "2026-02-01T00:00:00.000Z",
  lastUsedAt: "2026-03-01T00:00:00.000Z",
};

const createApp = ({
  fs,
  webhooksDb,
  shellCmd,
  restartRequiredState,
  omitWebhooksDb = false,
  omitRestartState = false,
} = {}) => {
  const app = express();
  app.use(express.json());
  registerWebhookRoutes({
    app,
    fs: fs || createConfigFs(),
    constants,
    getBaseUrl: () => "https://alphaclaw.example.com",
    webhooksDb: omitWebhooksDb ? undefined : webhooksDb || {},
    shellCmd,
    restartRequiredState: omitRestartState
      ? undefined
      : restartRequiredState || {
          markRequired: () => {},
          getSnapshot: async () => ({ restartRequired: false }),
        },
  });
  return app;
};

const withWebhookTokenEnv = async (value, fn) => {
  const previous = process.env.WEBHOOK_TOKEN;
  if (value === undefined) {
    delete process.env.WEBHOOK_TOKEN;
  } else {
    process.env.WEBHOOK_TOKEN = value;
  }
  try {
    return await fn();
  } finally {
    if (previous === undefined) {
      delete process.env.WEBHOOK_TOKEN;
    } else {
      process.env.WEBHOOK_TOKEN = previous;
    }
  }
};

describe("server/routes/webhooks coverage", () => {
  describe("GET /api/webhooks", () => {
    it("returns 500 when the config cannot be read", async () => {
      const app = createApp({ fs: createMemoryFs() });
      const res = await request(app).get("/api/webhooks");
      expect(res.status).toBe(500);
      expect(res.body).toEqual({ ok: false, error: "Could not read openclaw.json" });
    });

    it("computes health colors across hooks", async () => {
      const fs = createConfigFs();
      createWebhook({ fs, constants, name: "red-hook" });
      createWebhook({ fs, constants, name: "yellow-hook" });
      createWebhook({ fs, constants, name: "legacy-hook" });
      createWebhook({ fs, constants, name: "quiet-hook" });
      const app = createApp({
        fs,
        webhooksDb: {
          getHookSummaries: () => [
            {
              hookName: "red-hook",
              recentTotalCount: 5,
              recentErrorCount: 5,
              totalCount: 10,
              errorCount: 5,
            },
            {
              hookName: "yellow-hook",
              recentTotalCount: 5,
              recentErrorCount: 2,
              totalCount: 5,
              errorCount: 2,
            },
            {
              hookName: "legacy-hook",
              recentTotalCount: 0,
              recentErrorCount: 0,
              totalCount: 4,
              errorCount: 4,
            },
          ],
          getOauthCallbackByHook: (hookName) =>
            hookName === "red-hook" ? kOauthRecord : null,
        },
      });

      const res = await request(app).get("/api/webhooks");
      expect(res.status).toBe(200);
      const byName = Object.fromEntries(
        res.body.webhooks.map((hook) => [hook.name, hook]),
      );
      expect(byName["red-hook"].health).toBe("red");
      expect(byName["red-hook"].oauthCallbackEnabled).toBe(true);
      expect(byName["yellow-hook"].health).toBe("yellow");
      expect(byName["yellow-hook"].oauthCallbackEnabled).toBe(false);
      expect(byName["legacy-hook"].health).toBe("red");
      expect(byName["quiet-hook"].health).toBe("green");
      expect(byName["quiet-hook"].lastReceived).toBe(null);
      expect(byName["quiet-hook"].totalCount).toBe(0);
    });
  });

  describe("GET /api/webhooks/:name", () => {
    it("rejects invalid names", async () => {
      const app = createApp();
      const res = await request(app).get("/api/webhooks/Bad_Name");
      expect(res.status).toBe(400);
      expect(res.body.error).toContain("lowercase letters");
    });

    it("returns 404 for unknown webhooks", async () => {
      const app = createApp();
      const res = await request(app).get("/api/webhooks/missing-hook");
      expect(res.status).toBe(404);
      expect(res.body).toEqual({ ok: false, error: "Webhook not found" });
    });

    it("includes runtime token URLs when WEBHOOK_TOKEN is set", async () => {
      await withWebhookTokenEnv("secret+token", async () => {
        const fs = createConfigFs();
        createWebhook({ fs, constants, name: "detail-hook" });
        const app = createApp({
          fs,
          webhooksDb: {
            getHookSummaries: () => [
              { hookName: "detail-hook", totalCount: 2, errorCount: 0 },
            ],
            getOauthCallbackByHook: () => kOauthRecord,
          },
        });

        const res = await request(app).get("/api/webhooks/detail-hook");
        expect(res.status).toBe(200);
        expect(res.body.webhook.fullUrl).toBe(
          "https://alphaclaw.example.com/hooks/detail-hook",
        );
        expect(res.body.webhook.queryStringUrl).toBe(
          "https://alphaclaw.example.com/hooks/detail-hook?token=secret%2Btoken",
        );
        expect(res.body.webhook.authHeaderValue).toBe(
          "Authorization: Bearer secret+token",
        );
        expect(res.body.webhook.hasRuntimeToken).toBe(true);
        expect(res.body.webhook.oauthCallbackId).toBe(kOauthRecord.callbackId);
        expect(res.body.webhook.oauthCallbackUrl).toBe(
          `https://alphaclaw.example.com/oauth/${kOauthRecord.callbackId}`,
        );
        expect(res.body.webhook.oauthCallbackCreatedAt).toBe(kOauthRecord.createdAt);
        expect(res.body.webhook.oauthCallbackRotatedAt).toBe(kOauthRecord.rotatedAt);
        expect(res.body.webhook.oauthCallbackLastUsedAt).toBe(
          kOauthRecord.lastUsedAt,
        );
        expect(res.body.webhook.authNote).toContain("WEBHOOK_TOKEN");
      });
    });

    it("uses placeholder token values when WEBHOOK_TOKEN is unset", async () => {
      await withWebhookTokenEnv(undefined, async () => {
        const fs = createConfigFs();
        createWebhook({ fs, constants, name: "detail-hook" });
        const app = createApp({ fs });

        const res = await request(app).get("/api/webhooks/detail-hook");
        expect(res.status).toBe(200);
        expect(res.body.webhook.queryStringUrl).toBe(
          "https://alphaclaw.example.com/hooks/detail-hook?token=<WEBHOOK_TOKEN>",
        );
        expect(res.body.webhook.authHeaderValue).toBe(
          "Authorization: Bearer <WEBHOOK_TOKEN>",
        );
        expect(res.body.webhook.hasRuntimeToken).toBe(false);
        expect(res.body.webhook.oauthCallbackId).toBe("");
        expect(res.body.webhook.oauthCallbackUrl).toBe("");
      });
    });
  });

  describe("POST /api/webhooks", () => {
    it("rejects invalid webhook names", async () => {
      const app = createApp();
      const res = await request(app).post("/api/webhooks").send({ name: "" });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Webhook name is required");
    });

    it("returns 409 when the webhook already exists", async () => {
      const fs = createConfigFs();
      createWebhook({ fs, constants, name: "dupe-hook" });
      const app = createApp({ fs });
      const res = await request(app)
        .post("/api/webhooks")
        .send({ name: "dupe-hook" });
      expect(res.status).toBe(409);
      expect(res.body.error).toContain("already exists");
    });

    it("works with default webhooksDb and restart state fallbacks", async () => {
      const app = createApp({
        fs: createConfigFs(),
        omitWebhooksDb: true,
        omitRestartState: true,
      });
      const res = await request(app)
        .post("/api/webhooks")
        .send({ name: "fallback-hook", oauthCallback: true });
      expect(res.status).toBe(201);
      expect(res.body.ok).toBe(true);
      expect(res.body.webhook.oauthCallbackId).toBe("");
      expect(res.body.restartRequired).toBe(false);
      expect(res.body.syncWarning).toBe(null);
    });

    it("runs git sync and reports restart state", async () => {
      const shellCmd = vi.fn(async () => ({ stdout: "", stderr: "" }));
      const markRequired = vi.fn();
      const app = createApp({
        fs: createConfigFs(),
        shellCmd,
        restartRequiredState: {
          markRequired,
          getSnapshot: async () => ({ restartRequired: true }),
        },
      });

      const res = await request(app)
        .post("/api/webhooks")
        .send({ name: "sync-hook" });

      expect(res.status).toBe(201);
      expect(res.body.syncWarning).toBe(null);
      expect(res.body.restartRequired).toBe(true);
      expect(markRequired).toHaveBeenCalledWith("webhooks");
      expect(shellCmd).toHaveBeenCalledWith(
        'alphaclaw git-sync -m "webhooks: create sync-hook"',
        { timeout: 30000 },
      );
    });

    it("reports git sync failures as warnings", async () => {
      const shellCmd = vi.fn(async () => {
        throw new Error("git sync down");
      });
      const app = createApp({ fs: createConfigFs(), shellCmd });
      const res = await request(app)
        .post("/api/webhooks")
        .send({ name: "warn-hook" });
      expect(res.status).toBe(201);
      expect(res.body.syncWarning).toBe("git sync down");
    });

    it("falls back to a generic git sync warning without an error message", async () => {
      const shellCmd = vi.fn(async () => {
        throw {};
      });
      const app = createApp({ fs: createConfigFs(), shellCmd });
      const res = await request(app)
        .post("/api/webhooks")
        .send({ name: "warn-hook-2" });
      expect(res.status).toBe(201);
      expect(res.body.syncWarning).toBe("alphaclaw git-sync failed");
    });
  });

  describe("PUT /api/webhooks/:name/destination", () => {
    it("rejects invalid names", async () => {
      const app = createApp();
      const res = await request(app)
        .put("/api/webhooks/BAD!/destination")
        .send({ destination: null });
      expect(res.status).toBe(400);
    });

    it("returns 404 when the webhook is missing", async () => {
      const app = createApp();
      const res = await request(app)
        .put("/api/webhooks/nope/destination")
        .send({ destination: { channel: "direct", to: "x" } });
      expect(res.status).toBe(404);
      expect(res.body.error).toBe("Webhook not found");
    });
  });

  describe("oauth callback management", () => {
    it("rejects invalid names when creating an alias", async () => {
      const app = createApp();
      const res = await request(app).post("/api/webhooks/BAD!/oauth-callback");
      expect(res.status).toBe(400);
    });

    it("returns 404 when creating an alias for a missing webhook", async () => {
      const app = createApp();
      const res = await request(app).post("/api/webhooks/nope/oauth-callback");
      expect(res.status).toBe(404);
      expect(res.body.error).toBe("Webhook not found");
    });

    it("returns 409 when an alias already exists", async () => {
      const fs = createConfigFs();
      createWebhook({ fs, constants, name: "aliased" });
      const app = createApp({
        fs,
        webhooksDb: { getOauthCallbackByHook: () => kOauthRecord },
      });
      const res = await request(app).post("/api/webhooks/aliased/oauth-callback");
      expect(res.status).toBe(409);
      expect(res.body.error).toBe("OAuth callback alias already exists");
    });

    it("creates an alias for an existing webhook", async () => {
      const fs = createConfigFs();
      createWebhook({ fs, constants, name: "aliased" });
      const createOauthCallback = vi.fn(() => kOauthRecord);
      const app = createApp({
        fs,
        webhooksDb: {
          getOauthCallbackByHook: () => null,
          createOauthCallback,
        },
      });
      const res = await request(app).post("/api/webhooks/aliased/oauth-callback");
      expect(res.status).toBe(201);
      expect(createOauthCallback).toHaveBeenCalledWith({ hookName: "aliased" });
      expect(res.body).toEqual({
        ok: true,
        oauthCallbackId: kOauthRecord.callbackId,
        oauthCallbackUrl: `https://alphaclaw.example.com/oauth/${kOauthRecord.callbackId}`,
        oauthCallbackCreatedAt: kOauthRecord.createdAt,
        oauthCallbackRotatedAt: kOauthRecord.rotatedAt,
        oauthCallbackLastUsedAt: kOauthRecord.lastUsedAt,
      });
    });

    it("returns 404 when rotating an alias for a missing webhook", async () => {
      const app = createApp();
      const res = await request(app).post(
        "/api/webhooks/nope/oauth-callback/rotate",
      );
      expect(res.status).toBe(404);
      expect(res.body.error).toBe("Webhook not found");
    });

    it("rotates an existing alias", async () => {
      const fs = createConfigFs();
      createWebhook({ fs, constants, name: "aliased" });
      const rotateOauthCallback = vi.fn(() => ({
        ...kOauthRecord,
        callbackId: "cb-rotated",
      }));
      const app = createApp({
        fs,
        webhooksDb: { rotateOauthCallback },
      });
      const res = await request(app).post(
        "/api/webhooks/aliased/oauth-callback/rotate",
      );
      expect(res.status).toBe(200);
      expect(rotateOauthCallback).toHaveBeenCalledWith("aliased");
      expect(res.body.oauthCallbackId).toBe("cb-rotated");
      expect(res.body.oauthCallbackUrl).toBe(
        "https://alphaclaw.example.com/oauth/cb-rotated",
      );
    });

    it("maps rotate errors mentioning not found to 404", async () => {
      const fs = createConfigFs();
      createWebhook({ fs, constants, name: "aliased" });
      const app = createApp({
        fs,
        webhooksDb: {
          rotateOauthCallback: () => {
            throw new Error("oauth callback not found");
          },
        },
      });
      const res = await request(app).post(
        "/api/webhooks/aliased/oauth-callback/rotate",
      );
      expect(res.status).toBe(404);
      expect(res.body.error).toBe("oauth callback not found");
    });

    it("maps other rotate errors to 400", async () => {
      const fs = createConfigFs();
      createWebhook({ fs, constants, name: "aliased" });
      const app = createApp({
        fs,
        webhooksDb: {
          rotateOauthCallback: () => {
            throw new Error("rotation exploded");
          },
        },
      });
      const res = await request(app).post(
        "/api/webhooks/aliased/oauth-callback/rotate",
      );
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("rotation exploded");
    });

    it("deletes aliases and reports whether one existed", async () => {
      const fs = createConfigFs();
      createWebhook({ fs, constants, name: "aliased" });
      const app = createApp({
        fs,
        webhooksDb: {
          deleteOauthCallback: (hookName) => (hookName === "aliased" ? 1 : 0),
        },
      });
      const deleted = await request(app).delete(
        "/api/webhooks/aliased/oauth-callback",
      );
      expect(deleted.status).toBe(200);
      expect(deleted.body).toEqual({ ok: true, deleted: true });

      const missing = await request(app).delete(
        "/api/webhooks/other-hook/oauth-callback",
      );
      expect(missing.status).toBe(200);
      expect(missing.body).toEqual({ ok: true, deleted: false });
    });

    it("rejects invalid names when deleting an alias", async () => {
      const app = createApp();
      const res = await request(app).delete("/api/webhooks/BAD!/oauth-callback");
      expect(res.status).toBe(400);
    });
  });

  describe("DELETE /api/webhooks/:name", () => {
    it("rejects invalid names", async () => {
      const app = createApp();
      const res = await request(app).delete("/api/webhooks/BAD!");
      expect(res.status).toBe(400);
    });

    it("refuses to delete managed webhooks", async () => {
      const fs = createConfigFs({
        agents: { list: [{ id: "main", default: true }] },
        hooks: { presets: ["gmail"] },
      });
      const app = createApp({ fs });
      const res = await request(app).delete("/api/webhooks/gmail");
      expect(res.status).toBe(409);
      expect(res.body.error).toContain("managed by system setup");
    });

    it("returns 404 when nothing was removed", async () => {
      const app = createApp();
      const res = await request(app).delete("/api/webhooks/ghost-hook");
      expect(res.status).toBe(404);
      expect(res.body.error).toBe("Webhook not found");
    });

    it("deletes the transform directory when requested", async () => {
      const fs = createConfigFs();
      createWebhook({ fs, constants, name: "cleanup-hook" });
      const transformDir = path.join(
        openclawDir,
        "hooks/transforms/cleanup-hook",
      );
      fs.files.set(transformDir, "");
      const deleteRequestsByHook = vi.fn(() => 7);
      const app = createApp({
        fs,
        webhooksDb: { deleteRequestsByHook, deleteOauthCallback: () => 0 },
      });

      const res = await request(app)
        .delete("/api/webhooks/cleanup-hook")
        .send({ deleteTransformDir: "true" });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        ok: true,
        restartRequired: false,
        syncWarning: null,
        deletedRequestCount: 7,
        deletedTransformDir: true,
      });
      expect(deleteRequestsByHook).toHaveBeenCalledWith("cleanup-hook");
      expect(fs.files.has(transformDir)).toBe(false);
    });
  });

  describe("GET /api/webhooks/:name/requests", () => {
    it("rejects invalid names", async () => {
      const app = createApp();
      const res = await request(app).get("/api/webhooks/BAD!/requests");
      expect(res.status).toBe(400);
    });

    it("rejects invalid paging values", async () => {
      const app = createApp();
      for (const query of ["limit=0", "limit=abc", "offset=-1"]) {
        const res = await request(app).get(`/api/webhooks/some-hook/requests?${query}`);
        expect(res.status).toBe(400);
        expect(res.body.error).toBe("Invalid limit/offset");
      }
    });

    it("applies defaults and normalizes the status filter", async () => {
      const getRequests = vi.fn(() => [{ id: 1 }]);
      const app = createApp({ fs: createConfigFs(), webhooksDb: { getRequests } });

      const defaults = await request(app).get("/api/webhooks/some-hook/requests");
      expect(defaults.status).toBe(200);
      expect(defaults.body).toEqual({ ok: true, requests: [{ id: 1 }] });
      expect(getRequests).toHaveBeenCalledWith("some-hook", {
        limit: 50,
        offset: 0,
        status: "all",
      });

      await request(app).get(
        "/api/webhooks/some-hook/requests?limit=5&offset=10&status=ERROR",
      );
      expect(getRequests).toHaveBeenLastCalledWith("some-hook", {
        limit: 5,
        offset: 10,
        status: "error",
      });

      await request(app).get("/api/webhooks/some-hook/requests?status=bogus");
      expect(getRequests).toHaveBeenLastCalledWith("some-hook", {
        limit: 50,
        offset: 0,
        status: "all",
      });
    });
  });

  describe("webhooksDb default fallbacks", () => {
    it("serves requests, rotation, and deletion with an empty webhooksDb", async () => {
      const fs = createConfigFs();
      createWebhook({ fs, constants, name: "default-hook" });
      const app = createApp({ fs, webhooksDb: {} });

      const list = await request(app).get("/api/webhooks/default-hook/requests");
      expect(list.status).toBe(200);
      expect(list.body).toEqual({ ok: true, requests: [] });

      const byId = await request(app).get("/api/webhooks/default-hook/requests/3");
      expect(byId.status).toBe(404);

      const rotated = await request(app).post(
        "/api/webhooks/default-hook/oauth-callback/rotate",
      );
      expect(rotated.status).toBe(200);
      expect(rotated.body.oauthCallbackId).toBe("");

      const removed = await request(app).delete("/api/webhooks/default-hook");
      expect(removed.status).toBe(200);
      expect(removed.body.deletedRequestCount).toBe(0);
    });
  });

  describe("GET /api/webhooks/:name/requests/:id", () => {
    it("rejects invalid names", async () => {
      const app = createApp();
      const res = await request(app).get("/api/webhooks/BAD!/requests/1");
      expect(res.status).toBe(400);
    });

    it("rejects non-positive or non-numeric request ids", async () => {
      const app = createApp();
      for (const id of ["0", "-3", "abc"]) {
        const res = await request(app).get(`/api/webhooks/some-hook/requests/${id}`);
        expect(res.status).toBe(400);
        expect(res.body.error).toBe("Invalid request id");
      }
    });

    it("returns 404 when the request is missing", async () => {
      const app = createApp({
        fs: createConfigFs(),
        webhooksDb: { getRequestById: () => null },
      });
      const res = await request(app).get("/api/webhooks/some-hook/requests/12");
      expect(res.status).toBe(404);
      expect(res.body.error).toBe("Request not found");
    });

    it("returns the stored request", async () => {
      const getRequestById = vi.fn(() => ({ id: 12, payload: "{}" }));
      const app = createApp({
        fs: createConfigFs(),
        webhooksDb: { getRequestById },
      });
      const res = await request(app).get("/api/webhooks/some-hook/requests/12");
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ ok: true, request: { id: 12, payload: "{}" } });
      expect(getRequestById).toHaveBeenCalledWith("some-hook", 12);
    });
  });
});
