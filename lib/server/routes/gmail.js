const { createGmailWatchService } = require("../gmail-watch");
const { createGmailPushHandler } = require("../gmail-push");

const registerGmailRoutes = ({
  app,
  fs,
  constants,
  gogCmd,
  getBaseUrl,
  readGoogleCredentials,
  readEnvFile,
  writeEnvFile,
  reloadEnv,
  restartRequiredState,
}) => {
  const getRestartSnapshot = async () => {
    try {
      return (await restartRequiredState?.getSnapshot?.()) || {
        restartRequired: false,
      };
    } catch {
      return { restartRequired: false };
    }
  };

  const gmailWatchService = createGmailWatchService({
    fs,
    constants,
    gogCmd,
    getBaseUrl,
    readGoogleCredentials,
    readEnvFile,
    writeEnvFile,
    reloadEnv,
    restartRequiredState,
  });

  app.get("/api/gmail/config", (req, res) => {
    try {
      const data = gmailWatchService.getConfig({ req });
      res.json(data);
    } catch (err) {
      res.status(400).json({ ok: false, error: err.message });
    }
  });

  app.post("/api/gmail/config", (req, res) => {
    try {
      const data = gmailWatchService.saveClientConfig({
        req,
        body: req.body || {},
      });
      res.json(data);
    } catch (err) {
      res.status(400).json({ ok: false, error: err.message });
    }
  });

  app.post("/api/gmail/watch/start", async (req, res) => {
    try {
      const accountId = String(req.body?.accountId || "").trim();
      if (!accountId) return res.status(400).json({ ok: false, error: "accountId is required" });
      const result = await gmailWatchService.startWatch({
        accountId,
        req,
        destination: req.body?.destination || null,
      });
      const snapshot = await getRestartSnapshot();
      return res.json({
        ...result,
        restartRequired: Boolean(snapshot?.restartRequired),
      });
    } catch (err) {
      return res.status(400).json({ ok: false, error: err.message });
    }
  });

  app.post("/api/gmail/watch/stop", async (req, res) => {
    try {
      const accountId = String(req.body?.accountId || "").trim();
      if (!accountId) return res.status(400).json({ ok: false, error: "accountId is required" });
      const result = await gmailWatchService.stopWatch({ accountId });
      return res.json(result);
    } catch (err) {
      return res.status(400).json({ ok: false, error: err.message });
    }
  });

  app.post("/api/gmail/watch/renew", async (req, res) => {
    try {
      const accountId = String(req.body?.accountId || "").trim();
      const force = Boolean(req.body?.force ?? true);
      const result = await gmailWatchService.renewWatch({ accountId, force });
      return res.json(result);
    } catch (err) {
      return res.status(400).json({ ok: false, error: err.message });
    }
  });

  app.get("/api/gmail/watch/status", (req, res) => {
    try {
      const accountId = String(req.query?.accountId || "").trim();
      const config = gmailWatchService.getConfig({ req });
      const accountStatus = accountId
        ? config.accounts.find((account) => account.accountId === accountId) || null
        : null;
      if (accountId && !accountStatus) {
        return res.status(404).json({ ok: false, error: "Account status not found" });
      }
      return res.json({
        ok: true,
        account: accountStatus,
        accounts: accountId ? undefined : config.accounts,
      });
    } catch (err) {
      return res.status(400).json({ ok: false, error: err.message });
    }
  });

  const pushHandler = createGmailPushHandler({
    resolvePushToken: () => gmailWatchService.resolvePushToken(),
    resolveTargetByEmail: (email) => gmailWatchService.getTargetByEmail(email),
    markPushReceived: (payload) => gmailWatchService.markPushReceived(payload),
  });
  app.post("/gmail-pubsub", pushHandler);

  return gmailWatchService;
};

module.exports = {
  registerGmailRoutes,
};
