const { createWatchdog } = require("../../lib/server/watchdog");

const flushMicrotasks = async () =>
  new Promise((resolve) => {
    setImmediate(resolve);
  });

const kOriginalAutoRepair = process.env.WATCHDOG_AUTO_REPAIR;
const kOriginalNotificationsDisabled = process.env.WATCHDOG_NOTIFICATIONS_DISABLED;

const createHarness = ({
  autoRepair = true,
  notificationsDisabled = false,
  clawCmdImpl,
  resolveSetupUrl = () => "https://setup.example.com",
} = {}) => {
  process.env.WATCHDOG_AUTO_REPAIR = autoRepair ? "true" : "false";
  process.env.WATCHDOG_NOTIFICATIONS_DISABLED = notificationsDisabled ? "true" : "false";

  const insertWatchdogEvent = vi.fn();
  const clawCmd = vi.fn(
    clawCmdImpl ||
      (async () => ({
        ok: true,
        stdout: JSON.stringify({ ok: true }),
      })),
  );
  const notifier = { notify: vi.fn(async () => ({ ok: true })) };
  const launchGatewayProcess = vi.fn(() => ({ pid: 4242 }));
  const readEnvFile = vi.fn(() => []);
  const writeEnvFile = vi.fn();
  const reloadEnv = vi.fn();

  const watchdog = createWatchdog({
    clawCmd,
    launchGatewayProcess,
    insertWatchdogEvent,
    notifier,
    readEnvFile,
    writeEnvFile,
    reloadEnv,
    resolveSetupUrl,
  });

  return {
    watchdog,
    insertWatchdogEvent,
    clawCmd,
    notifier,
    launchGatewayProcess,
    readEnvFile,
    writeEnvFile,
    reloadEnv,
  };
};

describe("server/watchdog", () => {
  afterEach(() => {
    if (kOriginalAutoRepair == null) {
      delete process.env.WATCHDOG_AUTO_REPAIR;
    } else {
      process.env.WATCHDOG_AUTO_REPAIR = kOriginalAutoRepair;
    }
    if (kOriginalNotificationsDisabled == null) {
      delete process.env.WATCHDOG_NOTIFICATIONS_DISABLED;
    } else {
      process.env.WATCHDOG_NOTIFICATIONS_DISABLED = kOriginalNotificationsDisabled;
    }
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("logs startup-grace health failures as skipped ok events", async () => {
    const { watchdog, insertWatchdogEvent } = createHarness({
      clawCmdImpl: async (command) => {
        if (command === "health --json") {
          return { ok: false, stderr: "gateway unavailable" };
        }
        return { ok: true, stdout: "" };
      },
    });

    watchdog.start();
    await flushMicrotasks();

    expect(insertWatchdogEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "health_check",
        status: "ok",
        details: expect.objectContaining({
          skipped: true,
          startupGraceActive: true,
        }),
      }),
    );
    watchdog.stop();
  });

  it("retries startup health checks before marking degraded", async () => {
    vi.useFakeTimers();
    let healthChecks = 0;
    const { watchdog, clawCmd, insertWatchdogEvent } = createHarness({
      autoRepair: false,
      clawCmdImpl: async (command) => {
        if (command === "health --json") {
          healthChecks += 1;
          if (healthChecks === 1) return { ok: false, stderr: "gateway unavailable" };
          return { ok: true, stdout: JSON.stringify({ ok: true }) };
        }
        return { ok: true, stdout: "" };
      },
    });

    watchdog.onGatewayLaunch({ startedAt: Date.now() - 60_000 });
    await vi.advanceTimersByTimeAsync(0);
    expect(watchdog.getStatus().health).toBe("unknown");

    await vi.advanceTimersByTimeAsync(5_000);

    expect(clawCmd).toHaveBeenCalledWith("health --json", { quiet: true });
    expect(clawCmd).not.toHaveBeenCalledWith("doctor --fix --yes", { quiet: true });
    expect(watchdog.getStatus()).toEqual(
      expect.objectContaining({
        lifecycle: "running",
        health: "healthy",
      }),
    );
    expect(insertWatchdogEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "health_check",
        status: "ok",
        details: expect.objectContaining({
          skipped: true,
          startupFailureRetryActive: true,
          startupConsecutiveFailures: 1,
          startupFailureThreshold: 3,
        }),
      }),
    );
    watchdog.stop();
  });

  it("uses 5s degraded retries to recover before regular interval", async () => {
    vi.useFakeTimers();
    let healthChecks = 0;
    const { watchdog, clawCmd } = createHarness({
      autoRepair: false,
      clawCmdImpl: async (command) => {
        if (command === "health --json") {
          healthChecks += 1;
          if (healthChecks <= 3) return { ok: false, stderr: "temporarily unavailable" };
          return { ok: true, stdout: JSON.stringify({ ok: true }) };
        }
        return { ok: true, stdout: "" };
      },
    });

    watchdog.onGatewayLaunch({ startedAt: Date.now() - 60_000 });
    await vi.advanceTimersByTimeAsync(10_000);
    expect(watchdog.getStatus().health).toBe("degraded");
    expect(clawCmd).toHaveBeenCalledTimes(3);

    await vi.advanceTimersByTimeAsync(5_000);

    expect(clawCmd).toHaveBeenCalledTimes(4);
    expect(watchdog.getStatus()).toEqual(
      expect.objectContaining({
        lifecycle: "running",
        health: "healthy",
      }),
    );
    watchdog.stop();
  });

  it("triggers auto-repair in crash-loop mode when enabled", async () => {
    const { watchdog, clawCmd } = createHarness({
      autoRepair: true,
      clawCmdImpl: async (command) => {
        if (command === "doctor --fix --yes") return { ok: true, stdout: "fixed" };
        if (command === "health --json") return { ok: false, stderr: "still unhealthy" };
        return { ok: true, stdout: "" };
      },
    });

    watchdog.onGatewayExit({ code: 1, expectedExit: false });
    watchdog.onGatewayExit({ code: 1, expectedExit: false });
    watchdog.onGatewayExit({ code: 1, expectedExit: false });
    await flushMicrotasks();
    await flushMicrotasks();

    expect(clawCmd).toHaveBeenCalledWith("doctor --fix --yes", { quiet: true });
  });

  it("clears crash-loop lifecycle after a healthy check recovery", async () => {
    vi.useFakeTimers();
    let healthChecks = 0;
    const { watchdog, insertWatchdogEvent, notifier } = createHarness({
      autoRepair: false,
      clawCmdImpl: async (command) => {
        if (command === "health --json") {
          healthChecks += 1;
          if (healthChecks === 1) {
            return { ok: false, stderr: "gateway unavailable" };
          }
          return { ok: true, stdout: JSON.stringify({ ok: true }) };
        }
        return { ok: true, stdout: "" };
      },
    });

    watchdog.onGatewayLaunch({ startedAt: Date.now() - 60_000 });
    watchdog.onGatewayExit({ code: 1, expectedExit: false });
    watchdog.onGatewayExit({ code: 1, expectedExit: false });
    watchdog.onGatewayExit({ code: 1, expectedExit: false });

    expect(watchdog.getStatus()).toEqual(
      expect.objectContaining({
        lifecycle: "crash_loop",
        health: "unhealthy",
      }),
    );

    await vi.advanceTimersByTimeAsync(120_000);

    expect(watchdog.getStatus()).toEqual(
      expect.objectContaining({
        lifecycle: "running",
        health: "healthy",
      }),
    );
    expect(insertWatchdogEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "recovery",
        source: "health_timer",
        status: "ok",
        details: expect.objectContaining({
          previousLifecycle: "crash_loop",
          health: "healthy",
        }),
      }),
    );
    expect(
      notifier.notify.mock.calls.some((call) =>
        String(call?.[0] || "").includes("🟢 Gateway healthy again"),
      ),
    ).toBe(true);
    watchdog.stop();
  });

  it("suppresses notifier sends when notifications are disabled", async () => {
    const { watchdog, notifier } = createHarness({
      notificationsDisabled: true,
      autoRepair: false,
    });

    watchdog.onGatewayExit({ code: 1, expectedExit: false });
    watchdog.onGatewayExit({ code: 1, expectedExit: false });
    watchdog.onGatewayExit({ code: 1, expectedExit: false });
    await flushMicrotasks();

    expect(notifier.notify).not.toHaveBeenCalled();
  });

  it("suppresses failed health checks during expected restart window", async () => {
    const { watchdog, clawCmd, insertWatchdogEvent } = createHarness({
      autoRepair: true,
      clawCmdImpl: async (command) => {
        if (command === "health --json") {
          return { ok: false, stderr: "gateway restarting" };
        }
        return { ok: true, stdout: "" };
      },
    });

    watchdog.onExpectedRestart();
    await flushMicrotasks();

    expect(clawCmd).toHaveBeenCalledWith("health --json", { quiet: true });
    expect(clawCmd).not.toHaveBeenCalledWith("doctor --fix --yes", { quiet: true });
    expect(insertWatchdogEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "health_check",
        status: "ok",
        details: expect.objectContaining({
          skipped: true,
          expectedRestartActive: true,
        }),
      }),
    );
    expect(watchdog.getStatus()).toEqual(
      expect.objectContaining({
        lifecycle: "restarting",
        health: "unknown",
      }),
    );
  });

  it("treats non-zero expected exits as crashes", () => {
    const { watchdog, insertWatchdogEvent } = createHarness({
      autoRepair: false,
    });

    watchdog.onGatewayExit({
      code: 1,
      signal: null,
      expectedExit: true,
      stderrTail: ["gateway failed"],
    });

    expect(watchdog.getStatus()).toEqual(
      expect.objectContaining({
        lifecycle: "crashed",
        health: "unhealthy",
        crashCountInWindow: 1,
      }),
    );
    expect(insertWatchdogEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "crash",
        source: "exit_event",
        status: "failed",
        details: expect.objectContaining({
          code: 1,
          signal: null,
          stderrTail: ["gateway failed"],
        }),
      }),
    );
  });

  it("ignores duplicate-launch port-in-use exits", () => {
    const { watchdog, insertWatchdogEvent, launchGatewayProcess } = createHarness({
      autoRepair: true,
    });

    watchdog.onGatewayExit({
      code: 1,
      signal: null,
      expectedExit: false,
      stderrTail: [
        "Gateway failed to start: another gateway instance is already listening on ws://127.0.0.1:18789",
        "Port 18789 is already in use.",
      ],
    });

    expect(watchdog.getStatus()).toEqual(
      expect.objectContaining({
        lifecycle: "running",
        health: "unknown",
        crashCountInWindow: 0,
      }),
    );
    expect(launchGatewayProcess).not.toHaveBeenCalled();
    expect(insertWatchdogEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "restart",
        source: "exit_event",
        status: "ok",
        details: expect.objectContaining({
          duplicateLaunch: true,
          code: 1,
        }),
      }),
    );
  });

  it("stops suppressing failures after the expected restart timeout", async () => {
    vi.useFakeTimers();
    const { watchdog, insertWatchdogEvent } = createHarness({
      autoRepair: false,
      clawCmdImpl: async (command) => {
        if (command === "health --json") {
          return { ok: false, stderr: "gateway restarting" };
        }
        return { ok: true, stdout: "" };
      },
    });

    watchdog.onExpectedRestart();
    await vi.advanceTimersByTimeAsync(15_000);

    expect(watchdog.getStatus()).toEqual(
      expect.objectContaining({
        health: "degraded",
      }),
    );
    expect(insertWatchdogEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "health_check",
        status: "failed",
        details: expect.objectContaining({
          reason: "gateway restarting",
        }),
      }),
    );
  });

  it("sends gateway healthy again after deferred auto-repair recovery", async () => {
    let healthChecks = 0;
    const { watchdog, notifier } = createHarness({
      autoRepair: true,
      clawCmdImpl: async (command) => {
        if (command === "doctor --fix --yes") return { ok: true, stdout: "fixed" };
        if (command === "health --json") {
          healthChecks += 1;
          if (healthChecks === 1) return { ok: false, stderr: "not healthy yet" };
          return { ok: true, stdout: JSON.stringify({ ok: true }) };
        }
        return { ok: true, stdout: "" };
      },
    });

    watchdog.onGatewayExit({ code: 1, expectedExit: false });
    watchdog.onGatewayExit({ code: 1, expectedExit: false });
    watchdog.onGatewayExit({ code: 1, expectedExit: false });
    await flushMicrotasks();
    await flushMicrotasks();

    watchdog.onGatewayLaunch({ startedAt: Date.now() });
    await flushMicrotasks();
    await flushMicrotasks();

    expect(
      notifier.notify.mock.calls.some((call) =>
        String(call?.[0] || "").includes("🟢 Gateway healthy again"),
      ),
    ).toBe(true);
    expect(watchdog.getStatus()).toEqual(
      expect.objectContaining({
        lifecycle: "running",
        health: "healthy",
      }),
    );
  });

  it("does not set uptimeStartedAt on start — waits for onGatewayLaunch", () => {
    const { watchdog } = createHarness();

    watchdog.start();

    expect(watchdog.getStatus().uptimeStartedAt).toBeNull();
    expect(watchdog.getStatus().uptimeMs).toBe(0);
    watchdog.stop();
  });

  it("sets uptimeStartedAt when onGatewayLaunch fires", () => {
    const { watchdog } = createHarness();

    watchdog.start();
    const before = Date.now();
    watchdog.onGatewayLaunch({ startedAt: before, pid: 1234 });

    expect(watchdog.getStatus().uptimeStartedAt).not.toBeNull();
    expect(watchdog.getStatus().uptimeMs).toBeGreaterThanOrEqual(0);
    watchdog.stop();
  });

  it("clears uptimeStartedAt on gateway crash", () => {
    const { watchdog } = createHarness({ autoRepair: false });

    watchdog.onGatewayLaunch({ startedAt: Date.now(), pid: 1234 });
    expect(watchdog.getStatus().uptimeStartedAt).not.toBeNull();

    watchdog.onGatewayExit({ code: 1, expectedExit: false });

    expect(watchdog.getStatus().uptimeStartedAt).toBeNull();
    expect(watchdog.getStatus().uptimeMs).toBe(0);
  });

  it("clears uptimeStartedAt on expected restart", () => {
    const { watchdog } = createHarness();

    watchdog.onGatewayLaunch({ startedAt: Date.now(), pid: 1234 });
    expect(watchdog.getStatus().uptimeStartedAt).not.toBeNull();

    watchdog.onExpectedRestart();

    expect(watchdog.getStatus().uptimeStartedAt).toBeNull();
    expect(watchdog.getStatus().uptimeMs).toBe(0);
  });

  it("clears uptimeStartedAt on expected exit", () => {
    const { watchdog } = createHarness();

    watchdog.onGatewayLaunch({ startedAt: Date.now(), pid: 1234 });
    expect(watchdog.getStatus().uptimeStartedAt).not.toBeNull();

    watchdog.onGatewayExit({ code: 0, expectedExit: true });

    expect(watchdog.getStatus().uptimeStartedAt).toBeNull();
    expect(watchdog.getStatus().uptimeMs).toBe(0);
  });

  it("preserves uptimeStartedAt on duplicate-launch exit", () => {
    const { watchdog } = createHarness();

    const startedAt = Date.now() - 5000;
    watchdog.onGatewayLaunch({ startedAt, pid: 1234 });

    watchdog.onGatewayExit({
      code: 1,
      signal: null,
      expectedExit: false,
      stderrTail: ["another gateway instance is already listening"],
    });

    expect(watchdog.getStatus().uptimeStartedAt).not.toBeNull();
    expect(watchdog.getStatus().uptimeMs).toBeGreaterThan(0);
  });

  it("clears uptimeStartedAt on stop", () => {
    const { watchdog } = createHarness();

    watchdog.onGatewayLaunch({ startedAt: Date.now(), pid: 1234 });
    expect(watchdog.getStatus().uptimeStartedAt).not.toBeNull();

    watchdog.stop();

    expect(watchdog.getStatus().uptimeStartedAt).toBeNull();
    expect(watchdog.getStatus().uptimeMs).toBe(0);
  });

  it("restores uptimeStartedAt after crash recovery via onGatewayLaunch", async () => {
    const { watchdog } = createHarness({ autoRepair: false });

    watchdog.onGatewayLaunch({ startedAt: Date.now() - 10_000, pid: 1234 });
    watchdog.onGatewayExit({ code: 1, expectedExit: false });
    expect(watchdog.getStatus().uptimeStartedAt).toBeNull();

    const newStart = Date.now();
    watchdog.onGatewayLaunch({ startedAt: newStart, pid: 5678 });

    expect(watchdog.getStatus().uptimeStartedAt).not.toBeNull();
    expect(watchdog.getStatus().uptimeMs).toBeGreaterThanOrEqual(0);
    watchdog.stop();
  });

  it("writes settings changes to env and updates in-memory status", () => {
    const { watchdog, readEnvFile, writeEnvFile, reloadEnv } = createHarness({
      autoRepair: false,
      notificationsDisabled: false,
    });
    readEnvFile.mockReturnValue([{ key: "OPENAI_API_KEY", value: "x" }]);
    reloadEnv.mockImplementation(() => {
      process.env.WATCHDOG_AUTO_REPAIR = "true";
      process.env.WATCHDOG_NOTIFICATIONS_DISABLED = "true";
    });

    const settings = watchdog.updateSettings({
      autoRepair: true,
      notificationsEnabled: false,
    });

    expect(writeEnvFile).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ key: "WATCHDOG_AUTO_REPAIR", value: "true" }),
        expect.objectContaining({
          key: "WATCHDOG_NOTIFICATIONS_DISABLED",
          value: "true",
        }),
      ]),
    );
    expect(reloadEnv).toHaveBeenCalledTimes(1);
    expect(settings).toEqual({
      autoRepair: true,
      notificationsEnabled: false,
    });
  });
});
