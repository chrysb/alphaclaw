const createOauthCallbackMiddleware = ({
  getOauthCallbackById,
  markOauthCallbackUsed = () => {},
  webhookMiddleware,
}) => {
  return (req, res) => {
    const callbackId = String(req.params?.id || "").trim();
    if (!callbackId) {
      return res.status(404).json({ error: "Not found" });
    }
    const callback = getOauthCallbackById(callbackId);
    if (!callback?.hookName) {
      return res.status(404).json({ error: "Not found" });
    }
    try {
      markOauthCallbackUsed(callbackId);
    } catch {}
    const originalUrl = String(req.originalUrl || req.url || "");
    const queryIndex = originalUrl.indexOf("?");
    const querySuffix = queryIndex >= 0 ? originalUrl.slice(queryIndex) : "";
    const rewrittenUrl = `/hooks/${callback.hookName}${querySuffix}`;
    req.url = rewrittenUrl;
    req.originalUrl = rewrittenUrl;
    const webhookToken = String(process.env.WEBHOOK_TOKEN || "").trim();
    if (webhookToken) {
      req.headers.authorization = `Bearer ${webhookToken}`;
    }
    return webhookMiddleware(req, res);
  };
};

module.exports = {
  createOauthCallbackMiddleware,
};
