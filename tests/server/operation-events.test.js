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

  it("returns null/false for blank or unknown operation ids", () => {
    const service = createOperationEventsService();
    expect(service.getOperation("")).toBeNull();
    expect(service.getOperation(null)).toBeNull();
    expect(service.getOperation("nope")).toBeNull();
    expect(service.publish("nope", { event: "phase", data: {} })).toBe(false);
    expect(service.complete("nope")).toBe(false);
    expect(service.fail("nope", new Error("x"))).toBe(false);
  });

  it("marks operations failed and publishes an error event", () => {
    const service = createOperationEventsService();
    const { operationId } = service.createOperation({ type: "" });

    expect(service.fail(operationId, new Error("boom"))).toBe(true);
    let operation = service.getOperation(operationId);
    expect(operation.type).toBe("operation");
    expect(operation.status).toBe("failed");
    expect(operation.events[0].event).toBe("error");
    expect(operation.events[0].data).toEqual({ error: "boom" });

    // Non-Error and empty failures fall back to string/default messages.
    service.fail(operationId, "plain failure");
    service.fail(operationId, undefined);
    operation = service.getOperation(operationId);
    expect(operation.events[1].data).toEqual({ error: "plain failure" });
    expect(operation.events[2].data).toEqual({ error: "Operation failed" });
  });

  it("swallows subscriber write failures during publish", () => {
    const service = createOperationEventsService();
    const { operationId } = service.createOperation();
    const req = createReqMock();
    let writeCalls = 0;
    const res = {
      status: vi.fn(() => res),
      setHeader: vi.fn(),
      flushHeaders: vi.fn(),
      write: vi.fn(() => {
        writeCalls += 1;
        if (writeCalls > 1) throw new Error("socket closed");
      }),
    };
    expect(service.subscribe({ operationId, req, res })).toBe(true);

    expect(
      service.publish(operationId, { event: "phase", data: { n: 1 } }),
    ).toBe(true);
    // The event is still buffered even though the subscriber write threw.
    expect(service.getOperation(operationId).events).toHaveLength(1);
  });

  it("sweeps expired operations without subscribers on the shared timer", () => {
    vi.useFakeTimers();
    try {
      const service = createOperationEventsService({ ttlMs: 50 });
      const { operationId: expiredId } = service.createOperation();
      // A second createOperation exercises the sweeper early-return guard.
      const { operationId: subscribedId } = service.createOperation();

      const req = createReqMock();
      const res = {
        status: vi.fn(() => res),
        setHeader: vi.fn(),
        flushHeaders: vi.fn(),
        write: vi.fn(),
      };
      expect(service.subscribe({ operationId: subscribedId, req, res })).toBe(true);

      vi.advanceTimersByTime(30_000);

      expect(service.getOperation(expiredId)).toBeNull();
      // Expired but still-subscribed operations survive the sweep.
      expect(service.getOperation(subscribedId)).toBeTruthy();

      // Closing before expiry leaves the operation for the sweeper.
      const fresh = createOperationEventsService({ ttlMs: 120_000 });
      const { operationId: activeId } = fresh.createOperation();
      const activeReq = createReqMock();
      expect(fresh.subscribe({ operationId: activeId, req: activeReq, res })).toBe(true);
      activeReq.emitClose();
      expect(fresh.getOperation(activeId)).toBeTruthy();
    } finally {
      vi.useRealTimers();
    }
  });

  it("marks operations completed with a done event payload", () => {
    const service = createOperationEventsService();
    const { operationId } = service.createOperation({ type: "  spaced  " });

    expect(service.complete(operationId, { result: 42 })).toBe(true);
    const operation = service.getOperation(operationId);
    expect(operation.type).toBe("spaced");
    expect(operation.status).toBe("completed");
    expect(operation.events[0].event).toBe("done");
    expect(operation.events[0].data).toEqual({ result: 42 });
  });
});
