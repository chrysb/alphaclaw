const registerProxyRoutes = ({
  app,
  proxy,
  getGatewayUrl,
  SETUP_API_PREFIXES,
  requireAuth,
  oauthCallbackMiddleware,
  webhookMiddleware,
}) => {
  const kOpenClawPathPattern = /^\/openclaw\/.+/;
  const kAssetsPathPattern = /^\/assets\/.+/;
  const kHooksPathPattern = /^\/hooks\/.+/;
  const kWebhookPathPattern = /^\/webhook\/.+/;
  const kApiPathPattern = /^\/api\/.+/;

  app.all("/openclaw", requireAuth, (req, res) => {
    req.url = "/";
    proxy.web(req, res, { target: getGatewayUrl() });
  });
  app.all(kOpenClawPathPattern, requireAuth, (req, res) => {
    req.url = req.url.replace(/^\/openclaw/, "");
    proxy.web(req, res, { target: getGatewayUrl() });
  });
  app.all(kAssetsPathPattern, requireAuth, (req, res) =>
    proxy.web(req, res, { target: getGatewayUrl() }),
  );

  app.all("/oauth/:id", oauthCallbackMiddleware);
  app.all(kHooksPathPattern, webhookMiddleware);
  app.all(kWebhookPathPattern, webhookMiddleware);

  app.all(kApiPathPattern, (req, res) => {
    if (SETUP_API_PREFIXES.some((p) => req.path.startsWith(p))) return;
    proxy.web(req, res, { target: getGatewayUrl() });
  });
};

module.exports = { registerProxyRoutes };
