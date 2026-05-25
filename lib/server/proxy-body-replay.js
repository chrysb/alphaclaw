const kBodyReplayMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);

const hasJsonContentType = (value = "") =>
  String(value || "")
    .toLowerCase()
    .split(";")[0]
    .trim()
    .includes("json");

const shouldReplayParsedBody = (req) =>
  kBodyReplayMethods.has(String(req.method || "").toUpperCase()) &&
  hasJsonContentType(req.headers?.["content-type"]) &&
  req.body !== undefined &&
  req.body !== null;

const replayParsedJsonBody = (proxyReq, req) => {
  if (!shouldReplayParsedBody(req)) return false;

  const bodyData = Buffer.from(JSON.stringify(req.body));
  proxyReq.setHeader("content-type", "application/json");
  proxyReq.setHeader("content-length", String(bodyData.length));
  proxyReq.write(bodyData);
  return true;
};

const attachProxyBodyReplay = (proxy) => {
  proxy.on("proxyReq", replayParsedJsonBody);
  return proxy;
};

module.exports = {
  attachProxyBodyReplay,
  replayParsedJsonBody,
};
