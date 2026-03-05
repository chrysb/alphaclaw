const http = require("http");
const { parsePositiveInt } = require("./utils/number");

const kGmailPushDedupeWindowMs = parsePositiveInt(
  process.env.GMAIL_PUSH_DEDUPE_WINDOW_MS,
  24 * 60 * 60 * 1000,
);
const kGmailPushDedupeMaxEntries = parsePositiveInt(
  process.env.GMAIL_PUSH_DEDUPE_MAX_ENTRIES,
  50000,
);

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

const createPushEventDedupeKey = ({ envelope, payload }) => {
  const messageId = String(
    envelope?.message?.messageId || envelope?.message?.message_id || "",
  ).trim();
  if (messageId) return `msg:${messageId}`;
  const email = String(payload?.emailAddress || "")
    .trim()
    .toLowerCase();
  const historyId = String(payload?.historyId || "").trim();
  if (email && historyId) return `hist:${email}:${historyId}`;
  if (historyId) return `hist:${historyId}`;
  return "";
};

const createGmailPushEventDeduper = ({
  ttlMs = kGmailPushDedupeWindowMs,
  maxEntries = kGmailPushDedupeMaxEntries,
} = {}) => {
  const seenEvents = new Map();

  const pruneExpiredEntries = (receivedAt) => {
    const cutoff = receivedAt - ttlMs;
    for (const [eventKey, seenAt] of seenEvents.entries()) {
      if (seenAt > cutoff) break;
      seenEvents.delete(eventKey);
    }
    while (seenEvents.size > maxEntries) {
      const oldestKey = seenEvents.keys().next().value;
      if (!oldestKey) break;
      seenEvents.delete(oldestKey);
    }
  };

  const shouldProcessPushEvent = ({ envelope, payload, receivedAt = Date.now() }) => {
    const timestamp = Number.isFinite(receivedAt) ? receivedAt : Date.now();
    pruneExpiredEntries(timestamp);
    const eventKey = createPushEventDedupeKey({ envelope, payload });
    if (!eventKey) return true;
    return !seenEvents.has(eventKey);
  };

  shouldProcessPushEvent.markProcessed = ({
    envelope,
    payload,
    receivedAt = Date.now(),
  }) => {
    const timestamp = Number.isFinite(receivedAt) ? receivedAt : Date.now();
    pruneExpiredEntries(timestamp);
    const eventKey = createPushEventDedupeKey({ envelope, payload });
    if (!eventKey) return true;
    seenEvents.set(eventKey, timestamp);
    return true;
  };

  return shouldProcessPushEvent;
};

const isSuccessfulProxyStatus = (statusCode) => {
  const numericStatus = Number.parseInt(String(statusCode || 0), 10);
  return numericStatus >= 200 && numericStatus < 300;
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
  shouldProcessPushEvent = createGmailPushEventDeduper(),
  proxyPushToServeImpl = proxyPushToServe,
}) =>
  async (req, res) => {
    try {
      const expectedToken = String(resolvePushToken?.() || "").trim();
      const receivedToken = String(req.query?.token || "").trim();
      if (!expectedToken || !receivedToken || expectedToken !== receivedToken) {
        return res.status(401).json({ ok: false, error: "Invalid push token" });
      }

      const bodyBuffer = extractBodyBuffer(req.body);
      const { envelope, payload } = parsePushEnvelope(bodyBuffer);
      const email = String(payload?.emailAddress || "").trim().toLowerCase();
      if (!email) {
        return res.status(200).json({ ok: true, ignored: true, reason: "missing_email" });
      }
      if (
        !shouldProcessPushEvent({
          envelope,
          payload,
          receivedAt: Date.now(),
        })
      ) {
        return res.status(200).json({
          ok: true,
          ignored: true,
          reason: "duplicate_event",
        });
      }

      const target = resolveTargetByEmail?.(email);
      if (!target?.port) {
        return res.status(200).json({ ok: true, ignored: true, reason: "watch_not_enabled" });
      }

      try {
        const proxied = await proxyPushToServeImpl({
          port: target.port,
          bodyBuffer,
          headers: req.headers || {},
        });
        if (isSuccessfulProxyStatus(proxied.statusCode)) {
          shouldProcessPushEvent.markProcessed?.({
            envelope,
            payload,
            receivedAt: Date.now(),
          });
          await markPushReceived?.({
            accountId: target.accountId,
            at: Date.now(),
          });
        }
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
  createGmailPushEventDeduper,
  createPushEventDedupeKey,
};
