const {
  listWebhooks,
  getWebhookDetail,
  createWebhook,
  deleteWebhook,
  validateWebhookName,
} = require("../webhooks");
const { isTruthyFlag } = require("../utils/boolean");

const isFiniteInteger = (value) =>
  Number.isFinite(value) && Number.isInteger(value);
const parseBooleanFlag = (value) => isTruthyFlag(value);

const buildHealth = ({ totalCount, errorCount }) => {
  if (!totalCount || totalCount <= 0) return "green";
  if (!errorCount || errorCount <= 0) return "green";
  if (errorCount >= totalCount) return "red";
  return "yellow";
};

const mapSummaryByHook = (summaries) => {
  const byHook = new Map();
  for (const summary of summaries || []) byHook.set(summary.hookName, summary);
  return byHook;
};

const mergeWebhookAndSummary = ({ webhook, summary }) => {
  const totalCount = Number(summary?.totalCount || 0);
  const errorCount = Number(summary?.errorCount || 0);
  const successCount = Number(summary?.successCount || 0);
  return {
    ...webhook,
    lastReceived: summary?.lastReceived || null,
    totalCount,
    successCount,
    errorCount,
    health: buildHealth({ totalCount, errorCount }),
  };
};

const normalizeStatusFilter = (rawStatus) => {
  const status = String(rawStatus || "all")
    .trim()
    .toLowerCase();
  if (["all", "success", "error"].includes(status)) return status;
  return "all";
};

const buildWebhookUrls = ({ baseUrl, name, oauthCallback = null }) => {
  const fullUrl = `${baseUrl}/hooks/${name}`;
  const token = String(process.env.WEBHOOK_TOKEN || "").trim();
  const queryStringUrl = token
    ? `${fullUrl}?token=${encodeURIComponent(token)}`
    : `${fullUrl}?token=<WEBHOOK_TOKEN>`;
  const authHeaderValue = token
    ? `Authorization: Bearer ${token}`
    : "Authorization: Bearer <WEBHOOK_TOKEN>";
  const callbackId = String(oauthCallback?.callbackId || "").trim();
  return {
    fullUrl,
    queryStringUrl,
    authHeaderValue,
    hasRuntimeToken: !!token,
    oauthCallbackId: callbackId || "",
    oauthCallbackUrl: callbackId ? `${baseUrl}/oauth/${callbackId}` : "",
    oauthCallbackCreatedAt: oauthCallback?.createdAt || null,
    oauthCallbackRotatedAt: oauthCallback?.rotatedAt || null,
    oauthCallbackLastUsedAt: oauthCallback?.lastUsedAt || null,
  };
};

const registerWebhookRoutes = ({
  app,
  fs,
  constants,
  getBaseUrl,
  webhooksDb,
  shellCmd,
  restartRequiredState,
}) => {
  const {
    getRequests = () => [],
    getRequestById = () => null,
    getHookSummaries = () => [],
    deleteRequestsByHook = () => 0,
    createOauthCallback: createOauthCallbackEntry = () => null,
    getOauthCallbackByHook: getOauthCallbackByHookEntry = () => null,
    rotateOauthCallback: rotateOauthCallbackEntry = () => null,
    deleteOauthCallback: deleteOauthCallbackEntry = () => 0,
  } = webhooksDb || {};
  const fallbackRestartState = {
    markRequired: () => {},
    getSnapshot: async () => ({ restartRequired: false }),
  };
  const resolvedRestartState = restartRequiredState || fallbackRestartState;
  const { markRequired: markRestartRequired, getSnapshot: getRestartSnapshot } =
    resolvedRestartState;
  const runWebhookGitSync = async (action, name) => {
    if (typeof shellCmd !== "function") return null;
    const safeName = String(name || "").trim();
    const message = `webhooks: ${action} ${safeName}`.replace(/"/g, "");
    try {
      await shellCmd(`alphaclaw git-sync -m "${message}"`, {
        timeout: 30000,
      });
      return null;
    } catch (err) {
      return err?.message || "alphaclaw git-sync failed";
    }
  };

  app.get("/api/webhooks", (req, res) => {
    try {
      const hooks = listWebhooks({ fs, constants });
      const summaries = getHookSummaries();
      const summaryByHook = mapSummaryByHook(summaries);
      const webhooks = hooks.map((webhook) => {
        const oauthCallback = getOauthCallbackByHookEntry(webhook.name);
        return {
          ...mergeWebhookAndSummary({
            webhook,
            summary: summaryByHook.get(webhook.name),
          }),
          oauthCallbackEnabled: !!String(oauthCallback?.callbackId || "").trim(),
        };
      });
      res.json({ ok: true, webhooks });
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  app.get("/api/webhooks/:name", (req, res) => {
    try {
      const name = validateWebhookName(req.params.name);
      const detail = getWebhookDetail({ fs, constants, name });
      if (!detail)
        return res.status(404).json({ ok: false, error: "Webhook not found" });
      const summary = getHookSummaries().find((item) => item.hookName === name);
      const oauthCallback = getOauthCallbackByHookEntry(name);
      const merged = mergeWebhookAndSummary({ webhook: detail, summary });
      const baseUrl = getBaseUrl(req);
      const urls = buildWebhookUrls({ baseUrl, name, oauthCallback });
      return res.json({
        ok: true,
        webhook: {
          ...merged,
          fullUrl: urls.fullUrl,
          queryStringUrl: urls.queryStringUrl,
          authHeaderValue: urls.authHeaderValue,
          hasRuntimeToken: urls.hasRuntimeToken,
          oauthCallbackId: urls.oauthCallbackId,
          oauthCallbackUrl: urls.oauthCallbackUrl,
          oauthCallbackCreatedAt: urls.oauthCallbackCreatedAt,
          oauthCallbackRotatedAt: urls.oauthCallbackRotatedAt,
          oauthCallbackLastUsedAt: urls.oauthCallbackLastUsedAt,
          authNote:
            "All hooks use WEBHOOK_TOKEN. Use Authorization: Bearer <token> or x-openclaw-token header.",
        },
      });
    } catch (err) {
      return res.status(400).json({ ok: false, error: err.message });
    }
  });

  app.post("/api/webhooks", async (req, res) => {
    try {
      const {
        name: rawName,
        destination = null,
        oauthCallback = false,
      } = req.body || {};
      const name = validateWebhookName(rawName);
      const webhook = createWebhook({ fs, constants, name, destination });
      const oauthCallbackRecord = oauthCallback
        ? createOauthCallbackEntry({ hookName: name })
        : null;
      const baseUrl = getBaseUrl(req);
      const urls = buildWebhookUrls({
        baseUrl,
        name,
        oauthCallback: oauthCallbackRecord,
      });
      const syncWarning = await runWebhookGitSync("create", name);
      markRestartRequired("webhooks");
      const snapshot = await getRestartSnapshot();
      return res.status(201).json({
        ok: true,
        webhook: {
          ...webhook,
          fullUrl: urls.fullUrl,
          queryStringUrl: urls.queryStringUrl,
          authHeaderValue: urls.authHeaderValue,
          hasRuntimeToken: urls.hasRuntimeToken,
          oauthCallbackId: urls.oauthCallbackId,
          oauthCallbackUrl: urls.oauthCallbackUrl,
          oauthCallbackCreatedAt: urls.oauthCallbackCreatedAt,
          oauthCallbackRotatedAt: urls.oauthCallbackRotatedAt,
          oauthCallbackLastUsedAt: urls.oauthCallbackLastUsedAt,
        },
        restartRequired: snapshot.restartRequired,
        syncWarning,
      });
    } catch (err) {
      const status = String(err.message || "").includes("already exists")
        ? 409
        : 400;
      return res.status(status).json({ ok: false, error: err.message });
    }
  });

  app.post("/api/webhooks/:name/oauth-callback", (req, res) => {
    try {
      const name = validateWebhookName(req.params.name);
      const detail = getWebhookDetail({ fs, constants, name });
      if (!detail)
        return res.status(404).json({ ok: false, error: "Webhook not found" });
      const existing = getOauthCallbackByHookEntry(name);
      if (existing?.callbackId) {
        return res.status(409).json({
          ok: false,
          error: "OAuth callback alias already exists",
        });
      }
      const oauthCallback = createOauthCallbackEntry({ hookName: name });
      const baseUrl = getBaseUrl(req);
      const urls = buildWebhookUrls({ baseUrl, name, oauthCallback });
      return res.status(201).json({
        ok: true,
        oauthCallbackId: urls.oauthCallbackId,
        oauthCallbackUrl: urls.oauthCallbackUrl,
        oauthCallbackCreatedAt: urls.oauthCallbackCreatedAt,
        oauthCallbackRotatedAt: urls.oauthCallbackRotatedAt,
        oauthCallbackLastUsedAt: urls.oauthCallbackLastUsedAt,
      });
    } catch (err) {
      return res.status(400).json({ ok: false, error: err.message });
    }
  });

  app.post("/api/webhooks/:name/oauth-callback/rotate", (req, res) => {
    try {
      const name = validateWebhookName(req.params.name);
      const detail = getWebhookDetail({ fs, constants, name });
      if (!detail)
        return res.status(404).json({ ok: false, error: "Webhook not found" });
      const oauthCallback = rotateOauthCallbackEntry(name);
      const baseUrl = getBaseUrl(req);
      const urls = buildWebhookUrls({ baseUrl, name, oauthCallback });
      return res.json({
        ok: true,
        oauthCallbackId: urls.oauthCallbackId,
        oauthCallbackUrl: urls.oauthCallbackUrl,
        oauthCallbackCreatedAt: urls.oauthCallbackCreatedAt,
        oauthCallbackRotatedAt: urls.oauthCallbackRotatedAt,
        oauthCallbackLastUsedAt: urls.oauthCallbackLastUsedAt,
      });
    } catch (err) {
      const status = String(err?.message || "").includes("not found") ? 404 : 400;
      return res.status(status).json({ ok: false, error: err.message });
    }
  });

  app.delete("/api/webhooks/:name/oauth-callback", (req, res) => {
    try {
      const name = validateWebhookName(req.params.name);
      const deletedCount = deleteOauthCallbackEntry(name);
      return res.json({ ok: true, deleted: deletedCount > 0 });
    } catch (err) {
      return res.status(400).json({ ok: false, error: err.message });
    }
  });

  app.delete("/api/webhooks/:name", async (req, res) => {
    try {
      const name = validateWebhookName(req.params.name);
      const deleteTransformDir = parseBooleanFlag(
        req?.body?.deleteTransformDir,
      );
      const deletion = deleteWebhook({
        fs,
        constants,
        name,
        deleteTransformDir,
      });
      if (deletion?.managed) {
        return res.status(409).json({
          ok: false,
          error: `Webhook "${name}" is managed by system setup and cannot be deleted`,
        });
      }
      if (!deletion?.removed)
        return res.status(404).json({ ok: false, error: "Webhook not found" });
      deleteOauthCallbackEntry(name);
      const deletedRequestCount = deleteRequestsByHook(name);
      const syncWarning = await runWebhookGitSync("delete", name);
      markRestartRequired("webhooks");
      const snapshot = await getRestartSnapshot();
      return res.json({
        ok: true,
        restartRequired: snapshot.restartRequired,
        syncWarning,
        deletedRequestCount,
        deletedTransformDir: !!deletion.deletedTransformDir,
      });
    } catch (err) {
      return res.status(400).json({ ok: false, error: err.message });
    }
  });

  app.get("/api/webhooks/:name/requests", (req, res) => {
    try {
      const name = validateWebhookName(req.params.name);
      const limit = Number.parseInt(String(req.query.limit || 50), 10);
      const offset = Number.parseInt(String(req.query.offset || 0), 10);
      const status = normalizeStatusFilter(req.query.status);
      const hasBadPaging =
        !isFiniteInteger(limit) ||
        limit <= 0 ||
        !isFiniteInteger(offset) ||
        offset < 0;
      if (hasBadPaging) {
        return res
          .status(400)
          .json({ ok: false, error: "Invalid limit/offset" });
      }
      const requests = getRequests(name, { limit, offset, status });
      return res.json({ ok: true, requests });
    } catch (err) {
      return res.status(400).json({ ok: false, error: err.message });
    }
  });

  app.get("/api/webhooks/:name/requests/:id", (req, res) => {
    try {
      const name = validateWebhookName(req.params.name);
      const requestId = Number.parseInt(String(req.params.id || 0), 10);
      if (!isFiniteInteger(requestId) || requestId <= 0) {
        return res.status(400).json({ ok: false, error: "Invalid request id" });
      }
      const request = getRequestById(name, requestId);
      if (!request)
        return res.status(404).json({ ok: false, error: "Request not found" });
      return res.json({ ok: true, request });
    } catch (err) {
      return res.status(400).json({ ok: false, error: err.message });
    }
  });
};

module.exports = { registerWebhookRoutes };
