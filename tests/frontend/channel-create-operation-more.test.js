import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../lib/public/js/lib/api.js", () => ({
  createChannelAccount: vi.fn(),
  createChannelAccountJob: vi.fn(),
  subscribeOperationEvents: vi.fn(),
}));

import { createChannelAccountWithProgress } from "../../lib/public/js/lib/channel-create-operation.js";
import {
  createChannelAccountJob,
  subscribeOperationEvents,
} from "../../lib/public/js/lib/api.js";

describe("frontend/channel-create-operation (extended)", () => {
  let handlers = null;
  let close = null;

  beforeEach(() => {
    global.window = { EventSource: function EventSource() {} };
    handlers = null;
    close = vi.fn();
    subscribeOperationEvents.mockImplementation((nextHandlers) => {
      handlers = nextHandlers;
      return close;
    });
    createChannelAccountJob.mockResolvedValue({ operationId: "op-x" });
  });

  afterEach(() => {
    vi.useRealTimers();
    delete global.window;
  });

  it("throws when the job start returns no operation id", async () => {
    createChannelAccountJob.mockResolvedValue({});
    await expect(
      createChannelAccountWithProgress({ payload: {}, onPhase: vi.fn() }),
    ).rejects.toThrow("Could not start channel creation operation");
  });

  it("ignores phases without labels and replaces deferred phases", async () => {
    vi.useFakeTimers();
    const onPhase = vi.fn();
    const operationPromise = createChannelAccountWithProgress({
      payload: {},
      onPhase,
    });
    await Promise.resolve();
    expect(handlers).toBeTruthy();

    // Unknown events and label-less phases are ignored.
    handlers.onMessage({ event: "unknown-event", data: {} });
    handlers.onMessage({ event: "phase", data: { phase: "x", label: "  " } });
    expect(onPhase.mock.calls.map((call) => call[0])).toEqual(["Loading..."]);

    handlers.onMessage({
      event: "phase",
      data: { phase: "restarting", label: "Restarting gateway..." },
    });
    // Two updates inside the restart minimum-visibility window: the second
    // deferral must clear the first deferred timer.
    handlers.onMessage({
      event: "phase",
      data: { phase: "step-1", label: "Step 1" },
    });
    handlers.onMessage({
      event: "phase",
      data: { phase: "step-2", label: "Step 2" },
    });
    vi.advanceTimersByTime(1200);
    expect(onPhase.mock.calls.map((call) => call[0])).toEqual([
      "Loading...",
      "Restarting gateway...",
      "Step 2",
    ]);

    handlers.onMessage({ event: "done", data: { ok: true } });
    await expect(operationPromise).resolves.toEqual({ ok: true });
    expect(close).toHaveBeenCalledTimes(1);
  });

  it("ignores error events after the operation already resolved", async () => {
    const operationPromise = createChannelAccountWithProgress({
      payload: {},
      onPhase: vi.fn(),
    });
    await Promise.resolve();

    handlers.onMessage({ event: "done", data: { created: true } });
    handlers.onMessage({ event: "error", data: { error: "too late" } });

    await expect(operationPromise).resolves.toEqual({ created: true });
    expect(close).toHaveBeenCalledTimes(1);
  });

  it("rejects with a fallback message when the error payload is empty", async () => {
    const operationPromise = createChannelAccountWithProgress({
      payload: {},
      onPhase: vi.fn(),
    });
    await Promise.resolve();

    handlers.onMessage({ event: "error", data: {} });
    await expect(operationPromise).rejects.toThrow(
      "Could not create channel",
    );
  });

  it("rejects when the stream disconnects before settling", async () => {
    const operationPromise = createChannelAccountWithProgress({
      payload: {},
      onPhase: vi.fn(),
    });
    await Promise.resolve();

    handlers.onError();
    await expect(operationPromise).rejects.toThrow(
      "Channel operation stream disconnected",
    );
    expect(close).toHaveBeenCalledTimes(1);
  });

  it("resolves done events with a default payload object", async () => {
    const operationPromise = createChannelAccountWithProgress({
      payload: {},
      onPhase: vi.fn(),
    });
    await Promise.resolve();

    handlers.onMessage({ event: "done" });
    await expect(operationPromise).resolves.toEqual({});
  });
});
