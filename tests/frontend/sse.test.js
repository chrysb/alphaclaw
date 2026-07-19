const loadSseModule = async () => import("../../lib/public/js/lib/sse.js");

class FakeEventSource {
  static instances = [];

  constructor(url, options) {
    this.url = url;
    this.options = options;
    this.listeners = new Map();
    this.closed = false;
    this.onerror = undefined;
    FakeEventSource.instances.push(this);
  }

  addEventListener(type, handler) {
    const handlers = this.listeners.get(type) || [];
    handlers.push(handler);
    this.listeners.set(type, handlers);
  }

  removeEventListener(type, handler) {
    const handlers = (this.listeners.get(type) || []).filter(
      (entry) => entry !== handler,
    );
    this.listeners.set(type, handlers);
  }

  close() {
    this.closed = true;
  }

  emit(type, event = {}) {
    for (const handler of this.listeners.get(type) || []) handler(event);
  }
}

describe("frontend/sse", () => {
  beforeEach(() => {
    FakeEventSource.instances = [];
    global.window = { EventSource: FakeEventSource };
  });

  afterEach(() => {
    delete global.window;
  });

  it("throws when EventSource is not available", async () => {
    global.window = {};
    const { subscribeToSse } = await loadSseModule();

    expect(() => subscribeToSse({ url: "/api/x" })).toThrow(
      "Server events are not supported in this browser",
    );
  });

  it("opens a credentialed stream and forwards named events", async () => {
    const { subscribeToSse } = await loadSseModule();
    const messages = [];
    const onError = vi.fn();

    subscribeToSse({
      url: "/api/operations/op-1/events",
      onMessage: (message) => messages.push(message),
      onError,
    });

    const source = FakeEventSource.instances[0];
    expect(source.url).toBe("/api/operations/op-1/events");
    expect(source.options).toEqual({ withCredentials: true });

    source.emit("phase", { data: JSON.stringify({ phase: "cloning" }) });
    source.emit("done", { data: JSON.stringify({ ok: true }) });
    source.emit("error", { data: JSON.stringify({ error: "failed" }) });

    expect(messages).toEqual([
      { event: "phase", data: { phase: "cloning" } },
      { event: "done", data: { ok: true } },
      { event: "error", data: { error: "failed" } },
    ]);
    expect(onError).not.toHaveBeenCalled();
  });

  it("normalizes missing, blank, non-string, and invalid payloads to empty objects", async () => {
    const { subscribeToSse } = await loadSseModule();
    const messages = [];

    subscribeToSse({
      url: "/api/x",
      onMessage: (message) => messages.push(message),
    });

    const source = FakeEventSource.instances[0];
    source.emit("phase", {});
    source.emit("phase", { data: "   " });
    source.emit("phase", { data: 42 });
    source.emit("done", { data: "not json" });
    source.emit("error");

    expect(messages).toEqual([
      { event: "phase", data: {} },
      { event: "phase", data: {} },
      { event: "phase", data: {} },
      { event: "done", data: {} },
      { event: "error", data: {} },
    ]);
  });

  it("invokes onError for transport errors and defaults callbacks", async () => {
    const { subscribeToSse } = await loadSseModule();
    const onError = vi.fn();

    subscribeToSse({ url: "/api/x", onError });
    const source = FakeEventSource.instances[0];
    const errorEvent = { type: "error" };
    source.onerror(errorEvent);
    expect(onError).toHaveBeenCalledWith(errorEvent);

    // Defaults: no url, no callbacks — nothing should throw.
    const unsubscribe = subscribeToSse({});
    const defaultSource = FakeEventSource.instances[1];
    expect(defaultSource.url).toBe("");
    expect(() => {
      defaultSource.emit("phase", { data: "{}" });
      defaultSource.onerror({});
    }).not.toThrow();
    unsubscribe();
  });

  it("unsubscribes listeners and closes the stream", async () => {
    const { subscribeToSse } = await loadSseModule();
    const messages = [];

    const unsubscribe = subscribeToSse({
      url: "/api/x",
      onMessage: (message) => messages.push(message),
    });
    const source = FakeEventSource.instances[0];

    unsubscribe();

    expect(source.closed).toBe(true);
    expect(source.onerror).toBe(null);
    source.emit("phase", { data: "{}" });
    source.emit("done", { data: "{}" });
    source.emit("error", { data: "{}" });
    expect(messages).toEqual([]);
  });
});
