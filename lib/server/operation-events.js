const crypto = require("crypto");

const kDefaultTtlMs = 5 * 60 * 1000;
const kMaxEventsPerOperation = 200;

const formatSseEvent = ({ id, event, data }) => {
  const lines = [];
  if (id) lines.push(`id: ${id}`);
  if (event) lines.push(`event: ${event}`);
  const payload = JSON.stringify(data === undefined ? {} : data);
  for (const line of payload.split("\n")) {
    lines.push(`data: ${line}`);
  }
  return `${lines.join("\n")}\n\n`;
};

const createOperationEventsService = ({ ttlMs = kDefaultTtlMs } = {}) => {
  const operations = new Map();
  let sweepTimer = null;

  const ensureSweeper = () => {
    if (sweepTimer) return;
    sweepTimer = setInterval(() => {
      const now = Date.now();
      for (const [operationId, state] of operations.entries()) {
        if (state.expiresAt <= now && state.subscribers.size === 0) {
          operations.delete(operationId);
        }
      }
    }, 30_000);
    sweepTimer.unref();
  };

  const getOperation = (operationId) => {
    const normalized = String(operationId || "").trim();
    if (!normalized) return null;
    return operations.get(normalized) || null;
  };

  const createOperation = ({ type = "operation" } = {}) => {
    const operationId = crypto.randomUUID();
    operations.set(operationId, {
      id: operationId,
      type: String(type || "operation").trim() || "operation",
      createdAt: Date.now(),
      expiresAt: Date.now() + ttlMs,
      status: "pending",
      nextEventId: 1,
      events: [],
      subscribers: new Set(),
    });
    ensureSweeper();
    return { operationId };
  };

  const publish = (operationId, { event = "message", data = {} } = {}) => {
    const state = getOperation(operationId);
    if (!state) return false;
    const entry = {
      id: String(state.nextEventId++),
      event: String(event || "message").trim() || "message",
      data: data === undefined ? {} : data,
      ts: Date.now(),
    };
    state.events.push(entry);
    if (state.events.length > kMaxEventsPerOperation) {
      state.events = state.events.slice(-kMaxEventsPerOperation);
    }
    for (const res of state.subscribers) {
      try {
        res.write(formatSseEvent(entry));
      } catch {}
    }
    return true;
  };

  const complete = (operationId, payload = {}) => {
    const state = getOperation(operationId);
    if (!state) return false;
    state.status = "completed";
    state.expiresAt = Date.now() + ttlMs;
    publish(operationId, {
      event: "done",
      data: payload,
    });
    return true;
  };

  const fail = (operationId, error) => {
    const state = getOperation(operationId);
    if (!state) return false;
    state.status = "failed";
    state.expiresAt = Date.now() + ttlMs;
    publish(operationId, {
      event: "error",
      data: {
        error: String(error?.message || error || "Operation failed"),
      },
    });
    return true;
  };

  const subscribe = ({ operationId, req, res }) => {
    const state = getOperation(operationId);
    if (!state) {
      return false;
    }
    res.status(200);
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders?.();
    res.write(": connected\n\n");
    for (const event of state.events) {
      res.write(formatSseEvent(event));
    }
    state.subscribers.add(res);
    const close = () => {
      state.subscribers.delete(res);
      if (state.expiresAt <= Date.now() && state.subscribers.size === 0) {
        operations.delete(state.id);
      }
    };
    req.on("close", close);
    return true;
  };

  return {
    createOperation,
    publish,
    complete,
    fail,
    subscribe,
    getOperation,
  };
};

module.exports = {
  createOperationEventsService,
};
