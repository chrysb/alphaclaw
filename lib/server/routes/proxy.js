const crypto = require("crypto");
const http = require("http");
const https = require("https");
const { URL } = require("url");

const kOpenAiCompatProxyPathPattern =
  /^\/v1\/(?:chat\/completions|responses|embeddings|models(?:\/[^/?#]+)?)$/;
const kHopByHopResponseHeaders = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "trailers",
  "transfer-encoding",
  "upgrade",
]);
// Strip these even though they're not hop-by-hop: an OpenAI-compatible client
// (e.g. Sure's external assistant) has no business receiving cookies from the
// gateway, and a stray Set-Cookie crossing the AlphaClaw boundary would be a
// real leak.
const kAlwaysStrippedResponseHeaders = new Set(["set-cookie"]);

const extractBearerToken = (authorization) => {
  const match = String(authorization || "").match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : "";
};

const timingSafeStringEqual = (left, right) => {
  const leftBuffer = Buffer.from(String(left || ""), "utf8");
  const rightBuffer = Buffer.from(String(right || ""), "utf8");
  return (
    leftBuffer.length === rightBuffer.length &&
    crypto.timingSafeEqual(leftBuffer, rightBuffer)
  );
};

const extractBodyBuffer = (req) => {
  if (Buffer.isBuffer(req.body)) return req.body;
  if (typeof req.body === "string") return Buffer.from(req.body, "utf8");
  if (req.body && typeof req.body === "object") {
    return Buffer.from(JSON.stringify(req.body), "utf8");
  }
  return Buffer.alloc(0);
};

const createGatewayProxyHeaders = ({ reqHeaders, bodyBuffer }) => {
  const headers = { ...(reqHeaders || {}) };
  delete headers.host;
  delete headers.connection;
  delete headers["content-length"];
  delete headers["transfer-encoding"];
  // Express has already parsed and (if gzip/deflate) inflated the body, so
  // the bytes we reserialize are plain JSON. Forwarding the original
  // Content-Encoding would tell the gateway to gunzip plain text and fail.
  delete headers["content-encoding"];
  delete headers.cookie;
  if (bodyBuffer.length > 0) {
    headers["content-length"] = String(bodyBuffer.length);
    if (!headers["content-type"]) headers["content-type"] = "application/json";
  }
  return headers;
};

const proxyOpenAiCompatRequest = ({
  req,
  res,
  getGatewayUrl,
  getGatewayToken,
}) => {
  const bearerToken = extractBearerToken(req.headers.authorization);
  const expectedGatewayToken = String(getGatewayToken?.() || "").trim();
  if (
    !bearerToken ||
    !expectedGatewayToken ||
    !timingSafeStringEqual(bearerToken, expectedGatewayToken)
  ) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  let gateway;
  try {
    gateway = new URL(getGatewayUrl());
  } catch {
    return res.status(502).json({ error: "Gateway unavailable" });
  }

  const bodyBuffer = extractBodyBuffer(req);
  const protocolClient = gateway.protocol === "https:" ? https : http;
  const headers = createGatewayProxyHeaders({
    reqHeaders: req.headers,
    bodyBuffer,
  });
  headers.authorization = `Bearer ${bearerToken}`;

  const requestOptions = {
    protocol: gateway.protocol,
    hostname: gateway.hostname,
    port: gateway.port,
    method: req.method,
    path: req.originalUrl || req.url,
    headers,
  };

  const proxyReq = protocolClient.request(requestOptions, (proxyRes) => {
    res.statusCode = proxyRes.statusCode || 502;
    for (const [key, value] of Object.entries(proxyRes.headers || {})) {
      if (value == null) continue;
      const lowerKey = key.toLowerCase();
      if (kHopByHopResponseHeaders.has(lowerKey)) continue;
      if (kAlwaysStrippedResponseHeaders.has(lowerKey)) continue;
      res.setHeader(key, value);
    }
    proxyRes.pipe(res);
  });

  proxyReq.on("error", () => {
    if (!res.headersSent) {
      res.status(502).json({ error: "Gateway unavailable" });
    } else {
      res.end();
    }
  });

  if (bodyBuffer.length > 0) {
    proxyReq.write(bodyBuffer);
  }
  proxyReq.end();
};

const registerProxyRoutes = ({
  app,
  proxy,
  getGatewayUrl,
  getGatewayToken,
  isOpenAiCompatApiEnabled = () => true,
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

  app.all(kOpenAiCompatProxyPathPattern, (req, res) => {
    if (!isOpenAiCompatApiEnabled()) {
      return res.status(404).json({ error: "Not found" });
    }
    return proxyOpenAiCompatRequest({ req, res, getGatewayUrl, getGatewayToken });
  });

  app.all(kApiPathPattern, (req, res, next) => {
    if (SETUP_API_PREFIXES.some((p) => req.path.startsWith(p))) return next();
    proxy.web(req, res, { target: getGatewayUrl() });
  });
};

module.exports = {
  kOpenAiCompatProxyPathPattern,
  registerProxyRoutes,
  // Exported for tests.
  __testing: {
    createGatewayProxyHeaders,
    extractBearerToken,
    kHopByHopResponseHeaders,
    kAlwaysStrippedResponseHeaders,
  },
};
