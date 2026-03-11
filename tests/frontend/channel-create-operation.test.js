const loadChannelCreateOperationModule = async () =>
  import("../../lib/public/js/lib/channel-create-operation.js");

describe("frontend/channel-create-operation", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useRealTimers();
    global.window = {
      EventSource: function EventSource() {},
    };
  });

  it("falls back to direct create when EventSource is unavailable", async () => {
    const createChannelAccount = vi.fn(async () => ({ ok: true, mode: "direct" }));
    const createChannelAccountJob = vi.fn();
    const subscribeOperationEvents = vi.fn();
    global.window = {};
    vi.doMock("../../lib/public/js/lib/api.js", () => ({
      createChannelAccount,
      createChannelAccountJob,
      subscribeOperationEvents,
    }));
    const { createChannelAccountWithProgress } =
      await loadChannelCreateOperationModule();

    const result = await createChannelAccountWithProgress({
      payload: { provider: "telegram" },
      onPhase: vi.fn(),
    });

    expect(result).toEqual({ ok: true, mode: "direct" });
    expect(createChannelAccount).toHaveBeenCalledWith({
      provider: "telegram",
    });
    expect(createChannelAccountJob).not.toHaveBeenCalled();
    expect(subscribeOperationEvents).not.toHaveBeenCalled();
  });

  it("debounces phase transitions and applies deferred phase after minimum visibility", async () => {
    vi.useFakeTimers();
    const createChannelAccount = vi.fn();
    const createChannelAccountJob = vi.fn(async () => ({ operationId: "op-1" }));
    let handlers = null;
    const close = vi.fn();
    const subscribeOperationEvents = vi.fn((nextHandlers) => {
      handlers = nextHandlers;
      return close;
    });
    vi.doMock("../../lib/public/js/lib/api.js", () => ({
      createChannelAccount,
      createChannelAccountJob,
      subscribeOperationEvents,
    }));
    const { createChannelAccountWithProgress } =
      await loadChannelCreateOperationModule();
    const onPhase = vi.fn();

    const operationPromise = createChannelAccountWithProgress({
      payload: { provider: "telegram" },
      onPhase,
    });
    await Promise.resolve();

    handlers.onMessage({
      event: "phase",
      data: { phase: "restarting", label: "Restarting gateway..." },
    });
    handlers.onMessage({
      event: "phase",
      data: { phase: "finalizing", label: "Finalizing..." },
    });

    expect(onPhase.mock.calls.map((call) => call[0])).toEqual([
      "Loading...",
      "Restarting gateway...",
    ]);

    vi.advanceTimersByTime(1000);
    expect(onPhase.mock.calls.map((call) => call[0])).toEqual([
      "Loading...",
      "Restarting gateway...",
    ]);

    vi.advanceTimersByTime(200);
    expect(onPhase.mock.calls.map((call) => call[0])).toEqual([
      "Loading...",
      "Restarting gateway...",
      "Finalizing...",
    ]);

    handlers.onMessage({
      event: "done",
      data: { ok: true },
    });
    await expect(operationPromise).resolves.toEqual({ ok: true });
    expect(close).toHaveBeenCalledTimes(1);
  });

  it("settles only once even if stream emits more terminal events", async () => {
    const createChannelAccount = vi.fn();
    const createChannelAccountJob = vi.fn(async () => ({ operationId: "op-2" }));
    let handlers = null;
    const close = vi.fn();
    const subscribeOperationEvents = vi.fn((nextHandlers) => {
      handlers = nextHandlers;
      return close;
    });
    vi.doMock("../../lib/public/js/lib/api.js", () => ({
      createChannelAccount,
      createChannelAccountJob,
      subscribeOperationEvents,
    }));
    const { createChannelAccountWithProgress } =
      await loadChannelCreateOperationModule();

    const operationPromise = createChannelAccountWithProgress({
      payload: { provider: "discord" },
      onPhase: vi.fn(),
    });
    await Promise.resolve();

    handlers.onMessage({
      event: "error",
      data: { error: "first failure" },
    });
    handlers.onMessage({
      event: "done",
      data: { ok: true },
    });
    handlers.onError();

    await expect(operationPromise).rejects.toThrow("first failure");
    expect(close).toHaveBeenCalledTimes(1);
  });
});
