const kSetupApiAliasPattern = /^\/setup-api(?:\/|\?|$)/;

const kDenchStaticPathPattern =
  /^\/(?:_next|fonts|icons|integrations|logo|logos|models)(?:\/|$)/;
const kDenchPublicAssetPattern =
  /^\/(?:dench-[^/]+\.png|favicon\.ico|apple-icon\.png|icon\.png|opengraph-image\.png)$/;
const kExcludedPagePathPattern =
  /^\/(?:setup(?:\/|$)|login\.html$|css(?:\/|$)|dist(?:\/|$)|img(?:\/|$)|js(?:\/|$)|shared(?:\/|$)|openclaw(?:\/|$)|hooks(?:\/|$)|webhook(?:\/|$)|oauth(?:\/|$)|auth(?:\/|$)|gmail-pubsub(?:\/|$))/;

const proxyToDench = ({ proxy, denchWebRuntime }) => (req, res) =>
  proxy.web(req, res, { target: denchWebRuntime.getWebUrl() });

const registerDenchWebPriorityProxyRoutes = ({
  app,
  proxy,
  requireAuth,
  denchWebRuntime,
}) => {
  if (!denchWebRuntime?.isEnabled?.()) return;
  const forward = proxyToDench({ proxy, denchWebRuntime });

  app.all(/^\/api(?:\/|$)/, (req, res, next) => {
    if (kSetupApiAliasPattern.test(req.originalUrl || "")) return next();
    return forward(req, res);
  });

  app.all(kDenchStaticPathPattern, requireAuth, forward);
  app.all(kDenchPublicAssetPattern, requireAuth, forward);
};

const registerDenchWebFallbackProxyRoutes = ({
  app,
  proxy,
  requireAuth,
  denchWebRuntime,
}) => {
  if (!denchWebRuntime?.isEnabled?.()) return;
  const forward = proxyToDench({ proxy, denchWebRuntime });

  app.all(/^\/.+/, requireAuth, (req, res, next) => {
    if (kSetupApiAliasPattern.test(req.originalUrl || "")) return next();
    if (kExcludedPagePathPattern.test(req.path || "")) return next();
    return forward(req, res);
  });
};

module.exports = {
  registerDenchWebPriorityProxyRoutes,
  registerDenchWebFallbackProxyRoutes,
};
