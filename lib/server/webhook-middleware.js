const http = require("http");
const https = require("https");
const { URL } = require("url");
const { normalizeIp } = require("./utils/network");

const kRedactedHeaderKeys = new Set(["authorization", "cookie", "x-webhook-token"]);
const kRedactedPayloadKeys = new Set([
  "authorization",
  "code",
  "token",
  "access_token",
  "refresh_token",
  "id_token",
  "client_secret",
]);
const kGmailDedupeTtlMs = 24 * 60 * 60 * 1000;
const kGmailDedupeCleanupIntervalMs = 60 * 1000;

const sanitizeHeaders = (headers) => {
  const sanitized = {};
  for (const [key, value] of Object.entries(headers || {})) {
    const normalizedKey = String(key || "").toLowerCase();
    if (!normalizedKey) continue;
    if (kRedactedHeaderKeys.has(normalizedKey)) {
      sanitized[normalizedKey] = "[REDACTED]";
      continue;
    }
    sanitized[normalizedKey] = Array.isArray(value) ? value.join(", ") : String(value || "");
  }
  return sanitized;
};

const extractBodyBuffer = (req) => {
  if (Buffer.isBuffer(req.body)) return req.body;
  if (typeof req.body === "string") return Buffer.from(req.body, "utf8");
  if (req.body && typeof req.body === "object") {
    return Buffer.from(JSON.stringify(req.body), "utf8");
  }
  return Buffer.alloc(0);
};

const truncateText = (text, maxBytes) => {
  const buffer = Buffer.isBuffer(text) ? text : Buffer.from(String(text || ""), "utf8");
  if (buffer.length <= maxBytes) {
    return { text: buffer.toString("utf8"), truncated: false };
  }
  return {
    text: buffer.subarray(0, maxBytes).toString("utf8"),
    truncated: true,
  };
};

const redactPayloadData = (value, key = "") => {
  const normalizedKey = String(key || "").toLowerCase();
  if (normalizedKey && kRedactedPayloadKeys.has(normalizedKey)) {
    return "[REDACTED]";
  }

  if (Array.isArray(value)) {
    return value.map((item) => redactPayloadData(item));
  }

  if (value && typeof value === "object") {
    const redacted = {};
    for (const [childKey, childValue] of Object.entries(value)) {
      redacted[childKey] = redactPayloadData(childValue, childKey);
    }
    return redacted;
  }

  return value;
};

const sanitizePayloadForLogging = (bodyBuffer) => {
  if (!Buffer.isBuffer(bodyBuffer) || bodyBuffer.length === 0) return bodyBuffer;
  const parsedBody = parseJsonSafe(bodyBuffer.toString("utf8"));
  if (!parsedBody || typeof parsedBody !== "object") {
    return bodyBuffer;
  }
  return Buffer.from(JSON.stringify(redactPayloadData(parsedBody)), "utf8");
};

const toGatewayRequestHeaders = ({ reqHeaders, contentLength, authorization }) => {
  const headers = { ...reqHeaders };
  delete headers.host;
  delete headers["content-length"];
  delete headers["transfer-encoding"];
  headers["content-length"] = String(contentLength);
  if (authorization) headers.authorization = authorization;
  return headers;
};

const resolveHookName = (req) => {
  const paramPath =
    req?.params?.path ??
    req?.params?.[0] ??
    req?.params?.["*"] ??
    "";
  const fromParams = String(paramPath).split("/").filter(Boolean)[0] || "";
  if (fromParams) return decodeURIComponent(fromParams);

  const pathname = String(req?.path || req?.originalUrl || "").split("?")[0];
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length >= 2 && (segments[0] === "hooks" || segments[0] === "webhook")) {
    return decodeURIComponent(segments[1] || "");
  }
  return "";
};

const resolveGatewayPath = ({ pathname, search }) => {
  if (pathname.startsWith("/webhook/")) {
    return `/hooks/${pathname.slice("/webhook/".length)}${search || ""}`;
  }
  return `${pathname}${search || ""}`;
};

const parseJsonSafe = (rawValue) => {
  try {
    return JSON.parse(String(rawValue || "").trim() || "{}");
  } catch {
    return null;
  }
};

const queryParamsToObject = (searchParams) => {
  const params = {};
  for (const [key, value] of searchParams.entries()) {
    if (Object.prototype.hasOwnProperty.call(params, key)) {
      const currentValue = params[key];
      if (Array.isArray(currentValue)) {
        currentValue.push(value);
      } else {
        params[key] = [currentValue, value];
      }
      continue;
    }
    params[key] = value;
  }
  return params;
};

const buildBodyFromQueryParams = ({ bodyBuffer, queryParams }) => {
  if (!queryParams || Object.keys(queryParams).length === 0) {
    return null;
  }

  if (bodyBuffer.length === 0) {
    return Buffer.from(JSON.stringify(queryParams), "utf8");
  }

  const parsedBody = parseJsonSafe(bodyBuffer.toString("utf8"));
  if (!parsedBody || typeof parsedBody !== "object" || Array.isArray(parsedBody)) {
    return null;
  }

  // Keep explicit body values authoritative when both are provided.
  const mergedBody = { ...queryParams, ...parsedBody };
  return Buffer.from(JSON.stringify(mergedBody), "utf8");
};

const getGmailPayloadData = (parsedBody) => {
  if (!parsedBody || typeof parsedBody !== "object") return null;
  if (parsedBody.payload && typeof parsedBody.payload === "object") {
    return parsedBody.payload;
  }
  return parsedBody;
};

const getGmailMessageId = (message = {}) => {
  const preferredId = String(message?.id || "").trim();
  if (preferredId) return preferredId;
  const fallbackId = String(message?.messageId || "").trim();
  return fallbackId;
};

const buildGmailDedupedBodyBuffer = ({ parsedBody, filteredMessages }) => {
  if (parsedBody?.payload && typeof parsedBody.payload === "object") {
    return Buffer.from(
      JSON.stringify({
        ...parsedBody,
        payload: {
          ...parsedBody.payload,
          messages: filteredMessages,
        },
      }),
      "utf8",
    );
  }
  return Buffer.from(
    JSON.stringify({
      ...(parsedBody || {}),
      messages: filteredMessages,
    }),
    "utf8",
  );
};

const createWebhookMiddleware = ({
  gatewayUrl,
  getGatewayUrl,
  insertRequest,
  maxPayloadBytes = 50 * 1024,
}) => {
  const gmailSeenMessageIds = new Map();
  let lastGmailDedupeCleanupAt = 0;

  const pruneGmailSeenMessageIds = (nowMs) => {
    if (nowMs - lastGmailDedupeCleanupAt < kGmailDedupeCleanupIntervalMs) return;
    for (const [messageKey, seenAt] of gmailSeenMessageIds.entries()) {
      if (nowMs - seenAt > kGmailDedupeTtlMs) {
        gmailSeenMessageIds.delete(messageKey);
      }
    }
    lastGmailDedupeCleanupAt = nowMs;
  };

  return (req, res) => {
    const resolvedGatewayUrl =
      typeof getGatewayUrl === "function" ? getGatewayUrl() : gatewayUrl;
    const gateway = new URL(resolvedGatewayUrl);
    const protocolClient = gateway.protocol === "https:" ? https : http;
    const inboundUrl = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    let tokenFromQuery = "";
    if (inboundUrl.searchParams.has("token")) {
      const tokenValue = String(inboundUrl.searchParams.get("token") || "");
      if (!req.headers.authorization) {
        tokenFromQuery = tokenValue;
      }
      inboundUrl.searchParams.delete("token");
    }

    let bodyBuffer = extractBodyBuffer(req);
    const queryBody = queryParamsToObject(inboundUrl.searchParams);
    const bodyWithQueryParams = buildBodyFromQueryParams({
      bodyBuffer,
      queryParams: queryBody,
    });
    if (bodyWithQueryParams) {
      bodyBuffer = bodyWithQueryParams;
    }
    const hookName = resolveHookName(req);

    if (hookName === "gmail" && bodyBuffer.length > 0) {
      const parsedBody = parseJsonSafe(bodyBuffer.toString("utf8"));
      const payloadData = getGmailPayloadData(parsedBody);
      const accountKey = String(
        payloadData?.account || payloadData?.email || payloadData?.inbox || "unknown",
      )
        .trim()
        .toLowerCase();
      const messages = Array.isArray(payloadData?.messages) ? payloadData.messages : [];
      if (messages.length > 0) {
        const nowMs = Date.now();
        pruneGmailSeenMessageIds(nowMs);
        const unseenMessages = [];
        for (const message of messages) {
          const messageId = getGmailMessageId(message);
          if (!messageId) {
            unseenMessages.push(message);
            continue;
          }
          const dedupeKey = `${accountKey}:${messageId}`;
          if (gmailSeenMessageIds.has(dedupeKey)) {
            continue;
          }
          gmailSeenMessageIds.set(dedupeKey, nowMs);
          unseenMessages.push(message);
        }
        if (unseenMessages.length === 0) {
          return res.status(200).json({ ok: true, deduped: true });
        }
        if (unseenMessages.length < messages.length && parsedBody) {
          bodyBuffer = buildGmailDedupedBodyBuffer({
            parsedBody,
            filteredMessages: unseenMessages,
          });
        }
      }
    }

    const sourceIp = normalizeIp(
      req.ip || req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "",
    );
    const sanitizedHeaders = sanitizeHeaders(req.headers);
    const payload = truncateText(sanitizePayloadForLogging(bodyBuffer), maxPayloadBytes);

    const gatewayHeaders = toGatewayRequestHeaders({
      reqHeaders: req.headers,
      contentLength: bodyBuffer.length,
      authorization: tokenFromQuery ? `Bearer ${tokenFromQuery}` : req.headers.authorization,
    });
    if (bodyWithQueryParams && !gatewayHeaders["content-type"]) {
      gatewayHeaders["content-type"] = "application/json";
    }

    const requestOptions = {
      protocol: gateway.protocol,
      hostname: gateway.hostname,
      port: gateway.port,
      method: req.method,
      path: resolveGatewayPath({
        pathname: inboundUrl.pathname,
        search: inboundUrl.search,
      }),
      headers: gatewayHeaders,
    };

    const proxyReq = protocolClient.request(requestOptions, (proxyRes) => {
      const responseChunks = [];
      let responseSize = 0;
      let responseTruncated = false;

      proxyRes.on("data", (chunk) => {
        if (!Buffer.isBuffer(chunk)) return;
        if (responseSize >= maxPayloadBytes) {
          responseTruncated = true;
          return;
        }
        const remaining = maxPayloadBytes - responseSize;
        if (chunk.length > remaining) {
          responseChunks.push(chunk.subarray(0, remaining));
          responseSize += remaining;
          responseTruncated = true;
          return;
        }
        responseChunks.push(chunk);
        responseSize += chunk.length;
      });

      proxyRes.on("end", () => {
        const responseText = Buffer.concat(responseChunks).toString("utf8");
        const gatewayBody = responseTruncated ? `${responseText}\n[TRUNCATED]` : responseText;
        try {
          insertRequest({
            hookName,
            method: req.method,
            headers: sanitizedHeaders,
            payload: payload.text,
            payloadTruncated: payload.truncated,
            payloadSize: bodyBuffer.length,
            sourceIp,
            gatewayStatus: proxyRes.statusCode || null,
            gatewayBody,
          });
        } catch (err) {
          console.error("[webhook] failed to write request log:", err.message);
        }
      });

      res.statusCode = proxyRes.statusCode || 502;
      for (const [key, value] of Object.entries(proxyRes.headers || {})) {
        if (value == null) continue;
        res.setHeader(key, value);
      }
      proxyRes.pipe(res);
    });

    proxyReq.on("error", (err) => {
      try {
        insertRequest({
          hookName,
          method: req.method,
          headers: sanitizedHeaders,
          payload: payload.text,
          payloadTruncated: payload.truncated,
          payloadSize: bodyBuffer.length,
          sourceIp,
          gatewayStatus: 502,
          gatewayBody: err.message || "Gateway unavailable",
        });
      } catch {}
      if (!res.headersSent) {
        res.status(502).json({ error: "Gateway unavailable" });
      }
    });

    if (bodyBuffer.length > 0) {
      proxyReq.write(bodyBuffer);
    }
    proxyReq.end();
  };
};

module.exports = { createWebhookMiddleware };
