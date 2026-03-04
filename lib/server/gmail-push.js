const http = require("http");

const extractBodyBuffer = (body) => {
  if (Buffer.isBuffer(body)) return body;
  if (typeof body === "string") return Buffer.from(body, "utf8");
  if (body && typeof body === "object") {
    return Buffer.from(JSON.stringify(body), "utf8");
  }
  return Buffer.alloc(0);
};

const parsePushEnvelope = (bodyBuffer) => {
  const parsed = JSON.parse(String(bodyBuffer || Buffer.alloc(0)).toString("utf8"));
  const encodedData = String(parsed?.message?.data || "");
  const decodedData = encodedData
    ? JSON.parse(Buffer.from(encodedData, "base64").toString("utf8"))
    : {};
  return {
    envelope: parsed || {},
    payload: decodedData || {},
  };
};

const proxyPushToServe = async ({
  port,
  bodyBuffer,
  headers,
}) =>
  await new Promise((resolve, reject) => {
    const request = http.request(
      {
        hostname: "127.0.0.1",
        port,
        method: "POST",
        path: "/",
        headers: {
          "content-type": headers["content-type"] || "application/json",
          "content-length": String(bodyBuffer.length),
        },
      },
      (response) => {
        const chunks = [];
        response.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
        response.on("end", () => {
          resolve({
            statusCode: response.statusCode || 200,
            body: Buffer.concat(chunks).toString("utf8"),
          });
        });
      },
    );
    request.on("error", reject);
    if (bodyBuffer.length) request.write(bodyBuffer);
    request.end();
  });

const createGmailPushHandler = ({
  resolvePushToken,
  resolveTargetByEmail,
  markPushReceived,
}) =>
  async (req, res) => {
    try {
      const expectedToken = String(resolvePushToken?.() || "").trim();
      const receivedToken = String(req.query?.token || "").trim();
      if (!expectedToken || !receivedToken || expectedToken !== receivedToken) {
        return res.status(401).json({ ok: false, error: "Invalid push token" });
      }

      const bodyBuffer = extractBodyBuffer(req.body);
      const { payload } = parsePushEnvelope(bodyBuffer);
      const email = String(payload?.emailAddress || "").trim().toLowerCase();
      if (!email) {
        return res.status(200).json({ ok: true, ignored: true, reason: "missing_email" });
      }

      const target = resolveTargetByEmail?.(email);
      if (!target?.port) {
        return res.status(200).json({ ok: true, ignored: true, reason: "watch_not_enabled" });
      }

      try {
        const proxied = await proxyPushToServe({
          port: target.port,
          bodyBuffer,
          headers: req.headers || {},
        });
        await markPushReceived?.({
          accountId: target.accountId,
          at: Date.now(),
        });
        return res
          .status(proxied.statusCode)
          .send(proxied.body || "");
      } catch (err) {
        console.error(
          `[alphaclaw] Gmail push proxy error for ${email}: ${err.message || "unknown"}`,
        );
        return res.status(200).json({ ok: true, ignored: true, reason: "proxy_error" });
      }
    } catch (err) {
      console.error("[alphaclaw] Gmail push handler error:", err);
      return res.status(200).json({ ok: true, ignored: true, reason: "handler_error" });
    }
  };

module.exports = {
  createGmailPushHandler,
};
