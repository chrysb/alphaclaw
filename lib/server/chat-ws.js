const { readOpenclawConfig } = require("./openclaw-config");

const kWsOpen = 1;
const kHistoryLimit = 200;
const kEnvRefPattern = /^\$\{([A-Z0-9_]+)\}$/i;
const kConnectTimeoutMs = 8000;
const kHistoryTimeoutMs = 12000;
const kGatewayReqTimeoutMs = 15000;
const kGatewayProtocolVersion = 3;
// Gateway method auth (see OpenClaw method-scopes): chat.history needs operator.read;
// chat.send / chat.abort need operator.write. Align with CLI_DEFAULT_OPERATOR_SCOPES plus admin.
const kGatewayChatBridgeScopes = [
  "operator.admin",
  "operator.read",
  "operator.write",
  "operator.approvals",
  "operator.pairing",
];

const collectHistoryTextFragments = (value) => {
  if (typeof value === "string") {
    return value.length > 0 ? [value] : [];
  }
  if (Array.isArray(value)) {
    return value.flatMap((entry) => collectHistoryTextFragments(entry));
  }
  if (!value || typeof value !== "object") return [];

  if (typeof value.type === "string") {
    const partType = String(value.type || "").toLowerCase();
    if (partType === "text") {
      return collectHistoryTextFragments(value.text);
    }
    if (
      partType === "thinking" ||
      partType === "toolcall" ||
      partType === "tool_call" ||
      partType === "toolresult" ||
      partType === "tool_result"
    ) {
      return [];
    }
  }

  const textFields = [
    value.text,
    value.message,
    value.content,
    value.parts,
    value.value,
    value.output,
    value.input,
  ];

  const fragments = textFields.flatMap((entry) => collectHistoryTextFragments(entry));

  if (fragments.length > 0) return fragments;

  // Fallback: scan object values to catch unknown transcript block shapes.
  return Object.values(value).flatMap((entry) => collectHistoryTextFragments(entry));
};

const normalizeHistoryContent = (rawContent) => {
  const parts = collectHistoryTextFragments(rawContent);
  return parts
    .join("")
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
};

const normalizeHistoryRole = (rawRole = "") => {
  const role = String(rawRole || "").toLowerCase();
  if (
    role === "user" ||
    role === "human" ||
    role === "client" ||
    role === "input" ||
    role.includes("user")
  ) {
    return "user";
  }
  return "assistant";
};

const normalizeHistoryTimestamp = (messageRow = {}) => {
  const numericCandidate =
    Number(messageRow?.timestamp) || Number(messageRow?.createdAt) || 0;
  if (numericCandidate > 0) return numericCandidate;
  const parsedDateMs = Date.parse(
    String(messageRow?.timestamp || messageRow?.createdAt || ""),
  );
  return Number.isFinite(parsedDateMs) && parsedDateMs > 0
    ? parsedDateMs
    : Date.now();
};

const extractToolCalls = (messageRow = {}) => {
  const contentParts = Array.isArray(messageRow?.content) ? messageRow.content : [];
  return contentParts
    .filter((part) => String(part?.type || "").toLowerCase() === "toolcall")
    .map((part) => ({
      id: String(part?.id || ""),
      name: String(part?.name || ""),
      arguments: part?.arguments || null,
      partialJson: String(part?.partialJson || ""),
    }))
    .filter((toolCall) => toolCall.name || toolCall.id);
};

const extractHistoryMetadata = (messageRow = {}) => {
  const metadata = {};
  const assign = (key, value) => {
    if (value === null || value === undefined) return;
    if (typeof value === "string" && !value.trim()) return;
    metadata[key] = value;
  };
  assign("api", messageRow?.api);
  assign("provider", messageRow?.provider);
  assign("model", messageRow?.model);
  assign("stopReason", messageRow?.stopReason);
  assign("thinkingLevel", messageRow?.thinkingLevel);
  assign("senderLabel", messageRow?.senderLabel);
  assign("runId", messageRow?.runId);
  assign("inputTokens", Number(messageRow?.inputTokens) || undefined);
  assign("outputTokens", Number(messageRow?.outputTokens) || undefined);
  assign("totalTokens", Number(messageRow?.totalTokens) || undefined);
  assign(
    "cacheCreationInputTokens",
    Number(messageRow?.cacheCreationInputTokens) || undefined,
  );
  assign(
    "cacheReadInputTokens",
    Number(messageRow?.cacheReadInputTokens) || undefined,
  );
  return Object.keys(metadata).length > 0 ? metadata : null;
};

const normalizePartType = (value = "") =>
  String(value || "")
    .toLowerCase()
    .replaceAll("_", "")
    .replaceAll("-", "");

const collectTextFromUnknownShape = (value) =>
  normalizeHistoryContent(value?.content ?? value?.result ?? value?.text ?? value?.message);

const extractToolCallFromUnknownShape = (value) => {
  if (!value || typeof value !== "object") return null;
  if (Array.isArray(value)) {
    for (const entry of value) {
      const match = extractToolCallFromUnknownShape(entry);
      if (match) return match;
    }
    return null;
  }
  const partType = normalizePartType(value?.type);
  if (partType === "toolcall") {
    const normalized = {
      id: String(value?.id || value?.toolCallId || value?.callId || ""),
      name: String(value?.name || value?.toolName || ""),
      arguments: value?.arguments || value?.args || null,
      partialJson: String(value?.partialJson || ""),
    };
    return normalized.name || normalized.id ? normalized : null;
  }
  const nestedCandidates = [
    value?.part,
    value?.delta,
    value?.item,
    value?.message,
    value?.payload,
    value?.data,
    value?.value,
    value?.content,
  ];
  for (const candidate of nestedCandidates) {
    const match = extractToolCallFromUnknownShape(candidate);
    if (match) return match;
  }
  return null;
};

const extractToolResultFromUnknownShape = (value) => {
  if (!value || typeof value !== "object") return null;
  if (Array.isArray(value)) {
    for (const entry of value) {
      const match = extractToolResultFromUnknownShape(entry);
      if (match) return match;
    }
    return null;
  }
  const partType = normalizePartType(value?.type);
  const rawRole = normalizePartType(value?.role);
  const looksLikeToolResult =
    partType === "toolresult" ||
    rawRole === "toolresult" ||
    (String(value?.toolCallId || value?.callId || "").trim().length > 0 &&
      (value?.isError !== undefined ||
        value?.status !== undefined ||
        value?.content !== undefined ||
        value?.result !== undefined ||
        value?.text !== undefined));
  if (looksLikeToolResult) {
    const text = collectTextFromUnknownShape(value);
    const content =
      Array.isArray(value?.content) && value.content.length > 0
        ? value.content
        : text
          ? [{ type: "text", text }]
          : [];
    return {
      role: "toolResult",
      toolCallId: String(value?.toolCallId || value?.callId || value?.id || ""),
      toolName: String(value?.toolName || value?.name || ""),
      content,
      isError:
        value?.isError === true ||
        String(value?.status || "").toLowerCase() === "error",
      timestamp: normalizeHistoryTimestamp(value),
    };
  }
  const nestedCandidates = [
    value?.part,
    value?.delta,
    value?.item,
    value?.message,
    value?.payload,
    value?.data,
    value?.value,
    value?.content,
    value?.result,
  ];
  for (const candidate of nestedCandidates) {
    const match = extractToolResultFromUnknownShape(candidate);
    if (match) return match;
  }
  return null;
};

const resolveRunIdFromPayload = (payload = {}) =>
  String(
    payload?.runId ||
      payload?.run?.id ||
      payload?.data?.runId ||
      payload?.data?.run?.id ||
      payload?.meta?.runId ||
      "",
  ).trim();

const resolveSessionKeyFromPayload = (payload = {}) =>
  String(
    payload?.sessionKey ||
      payload?.session?.key ||
      payload?.data?.sessionKey ||
      payload?.data?.session?.key ||
      payload?.meta?.sessionKey ||
      "",
  ).trim();

const sanitizeError = (error) => {
  const message = error instanceof Error ? error.message : String(error || "");
  const lower = message.toLowerCase();
  console.error(`[alphaclaw] chat websocket handler error: ${message}`);
  if (lower.includes("not connected")) {
    return "Agent runtime is not connected right now.";
  }
  if (
    lower.includes("gateway is not connected") ||
    lower.includes("econnrefused") ||
    lower.includes("connect failed")
  ) {
    return "Could not connect to the OpenClaw gateway. Check that the gateway is running and reachable.";
  }
  if (lower.includes("timed out") || lower.includes("timeout")) {
    return "The gateway did not respond in time. Try again after the gateway finishes starting.";
  }
  if (
    lower.includes("auth") ||
    lower.includes("token") ||
    lower.includes("unauthorized") ||
    lower.includes("forbidden")
  ) {
    return "Gateway authentication failed. Verify OPENCLAW_GATEWAY_TOKEN matches the gateway.";
  }
  if (lower.includes("method not found") || lower.includes("unknown method")) {
    return "This gateway build does not support chat APIs. Update OpenClaw.";
  }
  if (lower.includes("gateway request failed")) {
    return "The gateway could not start this chat run. Check gateway logs.";
  }
  return "Something went wrong. Please try again.";
};

const resolveTokenValue = (candidate = "") => {
  const normalizedCandidate = String(candidate || "").trim();
  if (!normalizedCandidate) return "";
  const envMatch = normalizedCandidate.match(kEnvRefPattern);
  if (!envMatch) return normalizedCandidate;
  const envKey = String(envMatch[1] || "").trim();
  if (!envKey) return "";
  return String(process.env[envKey] || "").trim();
};

const withTimeout = async (promise, timeoutMs, label) => {
  let timeoutId = null;
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error(`${label} timed out after ${timeoutMs}ms`));
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
};

const createChatWsService = ({
  fs,
  openclawDir = "",
  getGatewayPort = () => 18789,
}) => {
  let WebSocketServer = null;
  let GatewayWebSocket = null;
  try {
    const wsModule = require("ws");
    ({ WebSocketServer } = wsModule);
    GatewayWebSocket = wsModule.WebSocket || wsModule;
  } catch (err) {
    console.warn(
      `[alphaclaw] chat websocket disabled: missing ws dependency (${err.message})`,
    );
    return {
      handleUpgrade: (request, socket) => {
        socket.write(
          "HTTP/1.1 503 Service Unavailable\r\nContent-Type: text/plain\r\nConnection: close\r\n\r\nChat websocket unavailable",
        );
        socket.destroy();
      },
      fetchHistory: async () => {
        throw new Error("Chat websocket unavailable");
      },
    };
  }

  const wss = new WebSocketServer({
    noServer: true,
    maxPayload: 1 * 1024 * 1024,
  });
  let gatewaySocket = null;
  let gatewayConnectPromise = null;
  const pendingGatewayRequests = new Map();
  const runTargets = new Map();
  const browserRuns = new WeakMap();

  const sendJson = (ws, payload = {}) => {
    if (!ws || ws.readyState !== kWsOpen) return;
    ws.send(JSON.stringify(payload));
  };

  const getGatewayToken = () => {
    const config = readOpenclawConfig({
      fsModule: fs,
      openclawDir,
      fallback: {},
    });
    const envToken = String(process.env.OPENCLAW_GATEWAY_TOKEN || "").trim();
    if (envToken) return envToken;
    return resolveTokenValue(config?.gateway?.auth?.token);
  };

  const registerRunForBrowser = (ws, runId) => {
    const existingRuns = browserRuns.get(ws);
    if (existingRuns) {
      existingRuns.add(runId);
      return;
    }
    browserRuns.set(ws, new Set([runId]));
  };

  const clearRunTargetsForBrowser = (ws) => {
    const runs = browserRuns.get(ws);
    if (!runs) return;
    for (const runId of runs) runTargets.delete(runId);
    runs.clear();
    browserRuns.delete(ws);
  };

  const settleGatewayRequest = (id, payload) => {
    const pending = pendingGatewayRequests.get(id);
    if (!pending) return;
    pendingGatewayRequests.delete(id);
    if (payload?.ok) {
      pending.resolve(payload.payload || null);
      return;
    }
    pending.reject(
      new Error(
        payload?.error?.message ||
          payload?.error?.code ||
          "Gateway request failed",
      ),
    );
  };

  const rejectAllGatewayRequests = (reason = "Gateway disconnected") => {
    for (const [id, pending] of pendingGatewayRequests.entries()) {
      pendingGatewayRequests.delete(id);
      pending.reject(new Error(reason));
    }
  };

  const markGatewayDisconnected = (reason = "Gateway disconnected") => {
    gatewaySocket = null;
    gatewayConnectPromise = null;
    rejectAllGatewayRequests(reason);
  };

  const handleGatewayEvent = (eventPayload = {}) => {
    const eventName = String(eventPayload.event || "");
    const payload = eventPayload.payload || {};
    const resolveTargetForPayload = () => {
      const runId = resolveRunIdFromPayload(payload);
      if (runId) {
        const runTarget = runTargets.get(runId);
        if (runTarget) return { runId, target: runTarget };
      }
      const sessionKey = resolveSessionKeyFromPayload(payload);
      if (sessionKey) {
        let sessionTarget = null;
        for (const [, targetRow] of runTargets.entries()) {
          if (String(targetRow?.sessionKey || "") !== sessionKey) continue;
          sessionTarget = targetRow;
        }
        if (sessionTarget) return { runId: "", target: sessionTarget };
      }
      if (runTargets.size === 1) {
        for (const [singleRunId, singleTarget] of runTargets.entries()) {
          return { runId: String(singleRunId || ""), target: singleTarget };
        }
      }
      return { runId: "", target: null };
    };
    if (eventName === "agent") {
      const { runId, target } = resolveTargetForPayload();
      if (!target) return;
      const stream = String(payload?.stream || "");
      const data = payload?.data || {};
      const toolCall =
        extractToolCallFromUnknownShape(payload) ||
        extractToolCallFromUnknownShape(data);
      if (toolCall) {
        sendJson(target.ws, {
          type: "tool",
          phase: "call",
          messageId: target.messageId,
          sessionKey: target.sessionKey,
          timestamp: Date.now(),
          toolCall,
          toolResult: null,
          rawEvent: eventPayload || null,
        });
      }
      const toolResult =
        extractToolResultFromUnknownShape(payload) ||
        extractToolResultFromUnknownShape(data);
      if (toolResult) {
        sendJson(target.ws, {
          type: "tool",
          phase: "result",
          messageId: target.messageId,
          sessionKey: target.sessionKey,
          timestamp: Number(toolResult?.timestamp) || Date.now(),
          toolCall: null,
          toolResult,
          rawEvent: eventPayload || null,
        });
      }
      if (stream === "assistant") {
        const rawDelta =
          data?.delta == null || data?.delta === ""
            ? data?.text
            : data?.delta;
        const delta = String(rawDelta || "");
        if (!delta) return;
        sendJson(target.ws, {
          type: "chunk",
          messageId: target.messageId,
          content: delta,
          sessionKey: target.sessionKey,
        });
        return;
      }
      if (stream === "lifecycle" && String(data?.phase || "") === "end") {
        sendJson(target.ws, {
          type: "done",
          messageId: target.messageId,
          sessionKey: target.sessionKey,
        });
        if (runId) {
          runTargets.delete(runId);
        } else {
          for (const [candidateRunId, candidateTarget] of runTargets.entries()) {
            if (candidateTarget !== target) continue;
            runTargets.delete(candidateRunId);
            break;
          }
        }
        const runs = browserRuns.get(target.ws);
        if (runs && runId) runs.delete(runId);
      }
      return;
    }
    if (eventName === "chat") {
      const { runId, target } = resolveTargetForPayload();
      if (!target) return;
      if (String(payload?.state || "") === "error") {
        sendJson(target.ws, {
          type: "error",
          message: "Something went wrong connecting to the agent.",
          messageId: target.messageId,
          sessionKey: target.sessionKey,
        });
        if (runId) {
          runTargets.delete(runId);
        } else {
          for (const [candidateRunId, candidateTarget] of runTargets.entries()) {
            if (candidateTarget !== target) continue;
            runTargets.delete(candidateRunId);
            break;
          }
        }
        const runs = browserRuns.get(target.ws);
        if (runs && runId) runs.delete(runId);
      }
    }
  };

  const ensureGatewayConnected = async () => {
    if (gatewaySocket && gatewaySocket.readyState === kWsOpen) return gatewaySocket;
    if (!gatewayConnectPromise) {
      gatewayConnectPromise = withTimeout(
        new Promise((resolve, reject) => {
          const socket = new GatewayWebSocket(`ws://127.0.0.1:${getGatewayPort()}`);
          const connectRequestId = crypto.randomUUID();
          const connectParams = {
            minProtocol: kGatewayProtocolVersion,
            maxProtocol: kGatewayProtocolVersion,
            client: {
              id: "gateway-client",
              version: "0.1.0",
              platform: process.platform,
              mode: "backend",
            },
            role: "operator",
            scopes: kGatewayChatBridgeScopes,
            caps: [],
            commands: [],
            permissions: {},
            auth: { token: getGatewayToken() },
            locale: "en-US",
            userAgent: "alphaclaw-chat-bridge/0.1.0",
          };

          socket.on("message", (rawData) => {
            let payload = null;
            try {
              payload = JSON.parse(String(rawData || ""));
            } catch {
              return;
            }
            if (!payload || typeof payload !== "object") return;
            if (
              payload.type === "event" &&
              String(payload.event || "") === "connect.challenge"
            ) {
              socket.send(
                JSON.stringify({
                  type: "req",
                  id: connectRequestId,
                  method: "connect",
                  params: connectParams,
                }),
              );
              return;
            }
            if (payload.type === "res") {
              if (String(payload.id || "") === connectRequestId) {
                if (payload.ok && payload?.payload?.type === "hello-ok") {
                  gatewaySocket = socket;
                  resolve(socket);
                  return;
                }
                reject(
                  new Error(
                    payload?.error?.message ||
                      payload?.error?.code ||
                      "OpenClaw gateway connect failed",
                  ),
                );
                try {
                  socket.close();
                } catch {}
                return;
              }
              settleGatewayRequest(String(payload.id || ""), payload);
              return;
            }
            if (payload.type === "event") {
              handleGatewayEvent(payload);
            }
          });

          socket.on("error", (err) => {
            const message = err instanceof Error ? err.message : String(err || "");
            reject(new Error(message || "OpenClaw gateway websocket failed"));
            markGatewayDisconnected("OpenClaw gateway websocket failed");
          });

          socket.on("close", (code) => {
            markGatewayDisconnected(`Gateway disconnected (code ${code})`);
          });
        }),
        kConnectTimeoutMs,
        "OpenClaw client connect",
      )
        .finally(() => {
          gatewayConnectPromise = null;
        });
    }
    return gatewayConnectPromise;
  };

  const requestGateway = async (
    method = "",
    params = {},
    timeoutMs = kGatewayReqTimeoutMs,
  ) => {
    const socket = await ensureGatewayConnected();
    if (!socket || socket.readyState !== kWsOpen) {
      throw new Error("OpenClaw gateway is not connected");
    }
    const requestId = crypto.randomUUID();
    const responsePromise = new Promise((resolve, reject) => {
      pendingGatewayRequests.set(requestId, { resolve, reject });
    });
    socket.send(
      JSON.stringify({
        type: "req",
        id: requestId,
        method,
        params,
      }),
    );
    return withTimeout(responsePromise, timeoutMs, `OpenClaw ${method} request`).finally(
      () => {
        pendingGatewayRequests.delete(requestId);
      },
    );
  };

  const handleHistory = async ({ ws, payload }) => {
    const sessionKey = String(payload?.sessionKey || "").trim();
    if (!sessionKey) {
      sendJson(ws, { type: "history", messages: [] });
      return;
    }
    const { messages, rawHistory } = await fetchHistory(sessionKey);
    sendJson(ws, {
      type: "history",
      sessionKey,
      messages,
      rawHistory,
    });
  };

  const handleMessage = async ({ ws, payload }) => {
    const sessionKey = String(payload?.sessionKey || "").trim();
    const content = String(payload?.content || "").trim();
    const messageId = crypto.randomUUID();
    if (!sessionKey || !content) {
      sendJson(ws, {
        type: "error",
        message: "sessionKey and content are required",
        messageId,
      });
      return;
    }
    const result = await requestGateway("chat.send", {
      sessionKey,
      message: content,
      idempotencyKey: crypto.randomUUID(),
    });
    const runId = String(result?.runId || "").trim();
    if (!runId) {
      sendJson(ws, {
        type: "error",
        message: "Something went wrong connecting to the agent.",
        messageId,
        sessionKey,
      });
      return;
    }
    runTargets.set(runId, { ws, messageId, sessionKey });
    registerRunForBrowser(ws, runId);
    sendJson(ws, {
      type: "started",
      sessionKey,
      runId,
      messageId,
    });
  };

  const handleStop = async ({ ws, payload }) => {
    const sessionKey = String(payload?.sessionKey || "").trim();
    if (!sessionKey) {
      sendJson(ws, {
        type: "error",
        message: "sessionKey is required",
      });
      return;
    }
    const runs = browserRuns.get(ws);
    if (runs) {
      for (const runId of Array.from(runs)) {
        const target = runTargets.get(runId);
        if (!target || String(target.sessionKey || "") !== sessionKey) continue;
        runTargets.delete(runId);
        runs.delete(runId);
      }
    }
    await requestGateway("chat.abort", { sessionKey });
    sendJson(ws, {
      type: "done",
      sessionKey,
      stopped: true,
    });
  };

  wss.on("connection", (ws) => {
    ws.on("close", () => {
      clearRunTargetsForBrowser(ws);
    });
    ws.on("message", (rawData) => {
      let payload = null;
      try {
        payload = JSON.parse(String(rawData || ""));
      } catch {
        return;
      }
      if (!payload || typeof payload !== "object") return;
      const type = String(payload.type || "");
      const run = async () => {
        if (type === "history") {
          await handleHistory({ ws, payload });
          return;
        }
        if (type === "message") {
          await handleMessage({ ws, payload });
          return;
        }
        if (type === "stop") {
          await handleStop({ ws, payload });
        }
      };
      run().catch((err) => {
        const sessionKey = String(payload?.sessionKey || "").trim();
        sendJson(ws, {
          type: "error",
          message: sanitizeError(err),
          ...(sessionKey ? { sessionKey } : {}),
          messageId: crypto.randomUUID(),
        });
      });
    });
  });

  const fetchHistory = async (sessionKey = "") => {
    const normalizedSessionKey = String(sessionKey || "").trim();
    if (!normalizedSessionKey) {
      return { messages: [], rawHistory: null };
    }
    const history = await requestGateway(
      "chat.history",
      {
        sessionKey: normalizedSessionKey,
        limit: kHistoryLimit,
      },
      kHistoryTimeoutMs,
    );
    const rawMessages = Array.isArray(history?.messages)
      ? history.messages
      : Array.isArray(history?.history)
        ? history.history
        : Array.isArray(history?.items)
          ? history.items
          : [];
    const toolResultsByCallId = {};
    for (const messageRow of rawMessages) {
      if (String(messageRow?.role || "").toLowerCase() !== "toolresult") continue;
      const toolCallId = String(messageRow?.toolCallId || "");
      if (!toolCallId) continue;
      toolResultsByCallId[toolCallId] = messageRow;
    }

    const messages = rawMessages
      .flatMap((messageRow) => {
        const rawRole = String(messageRow?.role || "").toLowerCase();
        if (rawRole === "toolresult") return [];
        let content = normalizeHistoryContent(
          messageRow?.content ?? messageRow?.text ?? messageRow?.message,
        );
        const role = normalizeHistoryRole(messageRow?.role ?? messageRow?.author);
        if (role === "user") {
          content = content.replace(/^\[.*?\]\s*/, "");
        }
        const toolCalls = extractToolCalls(messageRow);
        const normalizedContent = String(content || "").trim();
        const timestamp = normalizeHistoryTimestamp(messageRow);
        const metadata = extractHistoryMetadata(messageRow);
        const basePayload = {
          timestamp,
          metadata,
          rawMessage: messageRow || null,
        };
        const rows = [];
        if (normalizedContent) {
          rows.push({
            role,
            content: normalizedContent,
            ...basePayload,
            toolCalls: [],
            toolResult: null,
          });
        }
        for (const toolCall of toolCalls) {
          const toolCallId = String(toolCall?.id || "");
          rows.push({
            role: "tool",
            content: `Tool call: ${String(toolCall?.name || "unknown")}`,
            ...basePayload,
            toolCalls: [toolCall],
            toolResult: toolCallId ? toolResultsByCallId[toolCallId] || null : null,
          });
        }
        return rows;
      })
      .filter(
        (messageRow) =>
          String(messageRow.content || "").trim() ||
          (Array.isArray(messageRow.toolCalls) && messageRow.toolCalls.length > 0),
      );
    return {
      messages,
      rawHistory: history || null,
    };
  };

  return {
    handleUpgrade: (request, socket, head) => {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
      });
    },
    fetchHistory,
  };
};

module.exports = { createChatWsService };
