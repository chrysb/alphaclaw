const { createOperationEventsService } = require("../../lib/server/operation-events");

const createReqMock = () => {
  const handlers = new Map();
  return {
    on: vi.fn((event, handler) => {
      handlers.set(String(event || ""), handler);
    }),
    emitClose: () => {
      const closeHandler = handlers.get("close");
      if (typeof closeHandler === "function") {
        closeHandler();
      }
    },
  };
};

describe("server/operation-events", () => {
  it("stores and replays published events to subscribers", () => {
    const service = createOperationEventsService();
    const { operationId } = service.createOperation({
      type: "channel-account-create",
    });
    service.publish(operationId, {
      event: "phase",
      data: { label: "Starting" },
    });

    const req = createReqMock();
    const res = {
      status: vi.fn(() => res),
      setHeader: vi.fn(),
      flushHeaders: vi.fn(),
      write: vi.fn(),
    };
    const subscribed = service.subscribe({ operationId, req, res });

    expect(subscribed).toBe(true);
    expect(res.write).toHaveBeenNthCalledWith(1, ": connected\n\n");
    expect(res.write).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("event: phase"),
    );
    expect(res.write).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('"label":"Starting"'),
    );
  });

  it("caps buffered events to max per operation", () => {
    const service = createOperationEventsService();
    const { operationId } = service.createOperation();
    for (let idx = 1; idx <= 205; idx += 1) {
      service.publish(operationId, {
        event: "phase",
        data: { idx },
      });
    }

    const operation = service.getOperation(operationId);
    expect(operation.events).toHaveLength(200);
    expect(operation.events[0].id).toBe("6");
    expect(operation.events[199].id).toBe("205");
  });

  it("removes expired operations after subscriber disconnect", () => {
    vi.useFakeTimers();
    try {
      const service = createOperationEventsService({ ttlMs: 100 });
      const { operationId } = service.createOperation();
      service.complete(operationId, { ok: true });

      const req = createReqMock();
      const res = {
        status: vi.fn(() => res),
        setHeader: vi.fn(),
        flushHeaders: vi.fn(),
        write: vi.fn(),
      };
      expect(service.subscribe({ operationId, req, res })).toBe(true);
      vi.advanceTimersByTime(101);
      req.emitClose();

      expect(service.getOperation(operationId)).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it("returns false when subscribing to unknown operation", () => {
    const service = createOperationEventsService();
    const req = createReqMock();
    const res = {
      status: vi.fn(() => res),
      setHeader: vi.fn(),
      flushHeaders: vi.fn(),
      write: vi.fn(),
    };
    expect(
      service.subscribe({
        operationId: "missing-operation",
        req,
        res,
      }),
    ).toBe(false);
  });
});
