const registerProxyRoutes = ({ app, proxy, SETUP_API_PREFIXES }) => {
  app.all("/openclaw", (req, res) => {
    req.url = "/";
    proxy.web(req, res);
  });
  app.all("/openclaw/*", (req, res) => {
    req.url = req.url.replace(/^\/openclaw/, "");
    proxy.web(req, res);
  });
  app.all("/assets/*", (req, res) => proxy.web(req, res));

  app.all("/webhook/*", (req, res) => {
    if (!req.headers.authorization && req.query.token) {
      req.headers.authorization = `Bearer ${req.query.token}`;
      delete req.query.token;
      const url = new URL(req.url, `http://${req.headers.host}`);
      url.searchParams.delete("token");
      req.url = url.pathname + url.search;
    }
    proxy.web(req, res);
  });

  app.all("/api/*", (req, res) => {
    if (SETUP_API_PREFIXES.some((p) => req.path.startsWith(p))) return;
    proxy.web(req, res);
  });
};

module.exports = { registerProxyRoutes };
