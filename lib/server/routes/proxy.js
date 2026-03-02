const registerProxyRoutes = ({
  app,
  proxy,
  SETUP_API_PREFIXES,
  requireAuth,
  webhookMiddleware,
}) => {
  app.all("/openclaw", requireAuth, (req, res) => {
    req.url = "/";
    proxy.web(req, res);
  });
  app.all("/openclaw/*splat", requireAuth, (req, res) => {
    req.url = req.url.replace(/^\/openclaw/, "");
    proxy.web(req, res);
  });
  app.all("/assets/*splat", requireAuth, (req, res) => proxy.web(req, res));

  app.all("/hooks/*splat", webhookMiddleware);
  app.all("/webhook/*splat", webhookMiddleware);

  app.all("/api/*splat", (req, res) => {
    if (SETUP_API_PREFIXES.some((p) => req.path.startsWith(p))) return;
    proxy.web(req, res);
  });
};

module.exports = { registerProxyRoutes };
