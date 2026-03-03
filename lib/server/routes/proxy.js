const registerProxyRoutes = ({
  app,
  proxy,
  SETUP_API_PREFIXES,
  requireAuth,
  webhookMiddleware,
}) => {
  const kOpenClawPathPattern = /^\/openclaw\/.+/;
  const kAssetsPathPattern = /^\/assets\/.+/;
  const kHooksPathPattern = /^\/hooks\/.+/;
  const kWebhookPathPattern = /^\/webhook\/.+/;
  const kApiPathPattern = /^\/api\/.+/;

  app.all("/openclaw", requireAuth, (req, res) => {
    req.url = "/";
    proxy.web(req, res);
  });
  app.all(kOpenClawPathPattern, requireAuth, (req, res) => {
    req.url = req.url.replace(/^\/openclaw/, "");
    proxy.web(req, res);
  });
  app.all(kAssetsPathPattern, requireAuth, (req, res) => proxy.web(req, res));

  app.all(kHooksPathPattern, webhookMiddleware);
  app.all(kWebhookPathPattern, webhookMiddleware);

  app.all(kApiPathPattern, (req, res) => {
    if (SETUP_API_PREFIXES.some((p) => req.path.startsWith(p))) return;
    proxy.web(req, res);
  });
};

module.exports = { registerProxyRoutes };
