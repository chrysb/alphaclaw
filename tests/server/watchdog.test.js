const { createWatchdog } = require("../../lib/server/watchdog");

const flushMicrotasks = async () =>
  new Promise((resolve) => {
    setImmediate(resolve);
  });

const kOriginalAutoRepair = process.env.WATCHDOG_AUTO_REPAIR;
const kOriginalNotificationsDisabled = process.env.WATCHDOG_NOTIFICATIONS_DISABLED;
const kOriginalFetch = global.fetch;

const createHarness = ({
  autoRepair = true,
  notificationsDisabled = false,
  clawCmdImpl,
  resolveSetupUrl = () => "https://setup.example.com",
  resolveGatewayHealthUrl = () => "http://127.0.0.1:18789/health",
  resolveGatewayReadyzUrl = () => "",
  fetchImpl = async () => ({
    ok: true,
    status: 200,
    text: async () => JSON.stringify({ ok: true, status: "live" }),
  }),
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
  global.fetch = vi.fn(fetchImpl);

  const watchdog = createWatchdog({
    clawCmd,
    launchGatewayProcess,
    insertWatchdogEvent,
    notifier,
    readEnvFile,
    writeEnvFile,
    reloadEnv,
    resolveSetupUrl,
    resolveGatewayHealthUrl,
    resolveGatewayReadyzUrl,
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
    if (kOriginalFetch == null) {
      delete global.fetch;
    } else {
      global.fetch = kOriginalFetch;
    }
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("logs startup-grace health failures as skipped ok events", async () => {
    const { watchdog, insertWatchdogEvent } = createHarness({
      clawCmdImpl: async (command) => {
        return { ok: true, stdout: "" };
      },
      fetchImpl: async () => {
        throw new Error("gateway unavailable");
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
        return { ok: true, stdout: "" };
      },
      fetchImpl: async () => {
        healthChecks += 1;
        if (healthChecks === 1) {
          throw new Error("gateway unavailable");
        }
        return {
          ok: true,
          status: 200,
          text: async () => JSON.stringify({ ok: true, status: "live" }),
        };
      },
    });

    watchdog.onGatewayLaunch({ startedAt: Date.now() - 60_000 });
    await vi.advanceTimersByTimeAsync(0);
    expect(watchdog.getStatus().health).toBe("unknown");

    await vi.advanceTimersByTimeAsync(5_000);

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
    const { watchdog } = createHarness({
      autoRepair: false,
      clawCmdImpl: async () => {
        return { ok: true, stdout: "" };
      },
      fetchImpl: async () => {
        healthChecks += 1;
        if (healthChecks <= 3) {
          throw new Error("temporarily unavailable");
        }
        return {
          ok: true,
          status: 200,
          text: async () => JSON.stringify({ ok: true, status: "live" }),
        };
      },
    });

    watchdog.onGatewayLaunch({ startedAt: Date.now() - 60_000 });
    await vi.advanceTimersByTimeAsync(10_000);
    expect(watchdog.getStatus().health).toBe("degraded");
    expect(healthChecks).toBe(3);

    await vi.advanceTimersByTimeAsync(5_000);

    expect(healthChecks).toBe(4);
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
        return { ok: true, stdout: "" };
      },
      fetchImpl: async () => {
        throw new Error("still unhealthy");
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
        return { ok: true, stdout: "" };
      },
      fetchImpl: async () => {
        healthChecks += 1;
        if (healthChecks === 1) {
          throw new Error("gateway unavailable");
        }
        return {
          ok: true,
          status: 200,
          text: async () => JSON.stringify({ ok: true, status: "live" }),
        };
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
      clawCmdImpl: async () => {
        return { ok: true, stdout: "" };
      },
      fetchImpl: async () => {
        throw new Error("gateway restarting");
      },
    });

    watchdog.onExpectedRestart();
    await flushMicrotasks();

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
      clawCmdImpl: async () => {
        return { ok: true, stdout: "" };
      },
      fetchImpl: async () => {
        throw new Error("gateway restarting");
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
        return { ok: true, stdout: "" };
      },
      fetchImpl: async () => {
        healthChecks += 1;
        if (healthChecks === 1) {
          throw new Error("not healthy yet");
        }
        return {
          ok: true,
          status: 200,
          text: async () => JSON.stringify({ ok: true, status: "live" }),
        };
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

  it("does not repeat auto-repair or notifications while recovery is still pending", async () => {
    vi.useFakeTimers();
    let healthChecks = 0;
    const { watchdog, clawCmd, notifier } = createHarness({
      autoRepair: true,
      clawCmdImpl: async (command) => {
        if (command === "doctor --fix --yes") {
          return { ok: true, stdout: "fixed" };
        }
        return { ok: true, stdout: "" };
      },
      fetchImpl: async () => {
        healthChecks += 1;
        throw new Error("still unhealthy");
      },
    });

    watchdog.onGatewayLaunch({ startedAt: Date.now() - 60_000 });
    await vi.advanceTimersByTimeAsync(10_000);

    expect(clawCmd).toHaveBeenCalledTimes(1);
    expect(clawCmd).toHaveBeenCalledWith("doctor --fix --yes", { quiet: true });
    expect(
      notifier.notify.mock.calls.filter((call) =>
        String(call?.[0] || "").includes("awaiting health check"),
      ),
    ).toHaveLength(1);

    await vi.advanceTimersByTimeAsync(120_000);

    expect(healthChecks).toBeGreaterThan(3);
    expect(clawCmd).toHaveBeenCalledTimes(1);
    expect(
      notifier.notify.mock.calls.filter((call) =>
        String(call?.[0] || "").includes("awaiting health check"),
      ),
    ).toHaveLength(1);
    expect(watchdog.getStatus()).toEqual(
      expect.objectContaining({
        health: "degraded",
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

  it("pauses recovery when OpenClaw exits with EX_CONFIG", async () => {
    const { watchdog, clawCmd, launchGatewayProcess, notifier } = createHarness({
      autoRepair: true,
    });

    watchdog.onGatewayExit({
      code: 78,
      expectedExit: false,
      stderrTail: ["Invalid config"],
    });
    await flushMicrotasks();

    expect(watchdog.getStatus()).toEqual(
      expect.objectContaining({
        lifecycle: "configuration_error",
        health: "unhealthy",
        crashCountInWindow: 0,
      }),
    );
    expect(clawCmd).not.toHaveBeenCalled();
    expect(launchGatewayProcess).not.toHaveBeenCalled();
    expect(
      notifier.notify.mock.calls.some((call) =>
        String(call?.[0] || "").includes("Gateway configuration invalid"),
      ),
    ).toBe(true);
  });

  it("latches EX_CONFIG across in-flight and periodic health checks", async () => {
    vi.useFakeTimers();
    let resolveHealthCheck;
    const healthCheck = new Promise((resolve) => {
      resolveHealthCheck = resolve;
    });
    const { watchdog, clawCmd, launchGatewayProcess } = createHarness({
      autoRepair: true,
      fetchImpl: async () => healthCheck,
    });

    watchdog.onGatewayLaunch({
      startedAt: Date.now() - 60_000,
      pid: 1234,
    });
    await vi.advanceTimersByTimeAsync(0);

    watchdog.onGatewayExit({
      code: 78,
      expectedExit: false,
      stderrTail: ["Invalid config"],
    });
    resolveHealthCheck({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ ok: true, status: "live" }),
    });
    await vi.advanceTimersByTimeAsync(120_000);

    expect(watchdog.getStatus()).toEqual(
      expect.objectContaining({
        lifecycle: "configuration_error",
        health: "unhealthy",
      }),
    );
    expect(clawCmd).not.toHaveBeenCalled();
    expect(launchGatewayProcess).not.toHaveBeenCalled();
    watchdog.stop();
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

  it("treats exit code 78 as a fatal config error without crash-loop restarts", async () => {
    const { watchdog, insertWatchdogEvent, notifier, launchGatewayProcess, clawCmd } =
      createHarness({
        autoRepair: false,
        fetchImpl: async () => {
          throw new Error("gateway unavailable");
        },
      });

    watchdog.onGatewayLaunch({ startedAt: Date.now(), pid: 1234 });
    watchdog.onGatewayExit({ code: 78, expectedExit: false, stderrTail: ["invalid config"] });
    watchdog.onGatewayExit({ code: 78, expectedExit: false });
    watchdog.onGatewayExit({ code: 78, expectedExit: false });
    await flushMicrotasks();

    expect(watchdog.getStatus()).toEqual(
      expect.objectContaining({
        lifecycle: "configuration_error",
        health: "unhealthy",
        crashCountInWindow: 0,
      }),
    );
    expect(launchGatewayProcess).not.toHaveBeenCalled();
    expect(clawCmd).not.toHaveBeenCalledWith("doctor --fix --yes", { quiet: true });
    expect(insertWatchdogEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "config_error",
        source: "exit_event",
        status: "failed",
        details: expect.objectContaining({ code: 78 }),
      }),
    );
    expect(
      notifier.notify.mock.calls.some(
        (call) =>
          String(call?.[0] || "").includes("Gateway configuration invalid") &&
          String(call?.[0] || "").includes("automatic restart is paused"),
      ),
    ).toBe(true);
  });

  it("does not auto-repair on configuration errors; forced repair clears the latch", async () => {
    const doctorCalls = [];
    const { watchdog, launchGatewayProcess } = createHarness({
      autoRepair: true,
      clawCmdImpl: async (command) => {
        if (command === "doctor --fix --yes") {
          doctorCalls.push(command);
          return { ok: true, stdout: "fixed" };
        }
        return { ok: true, stdout: "" };
      },
    });

    watchdog.onGatewayExit({ code: 78, expectedExit: false });
    await flushMicrotasks();
    await flushMicrotasks();

    // Even with auto-repair enabled, EX_CONFIG must not trigger doctor runs.
    expect(doctorCalls).toHaveLength(0);
    expect(launchGatewayProcess).not.toHaveBeenCalled();
    expect(watchdog.getStatus().lifecycle).toBe("configuration_error");

    // A manual (forced) repair is the operator's escape hatch.
    const result = await watchdog.triggerRepair();
    expect(result.ok).toBe(true);
    expect(doctorCalls).toHaveLength(1);
    expect(launchGatewayProcess).toHaveBeenCalledTimes(1);
    expect(watchdog.getStatus().lifecycle).toBe("running");
  });

  const buildSafeModeFetch = (gatewayState) => async (url) => {
    if (String(url).includes("/readyz")) {
      return {
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            ready: true,
            failing: [],
            ...(gatewayState.suppressed.length > 0
              ? { suppressed: gatewayState.suppressed }
              : {}),
          }),
      };
    }
    return {
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ ok: true, status: "live" }),
    };
  };

  it("detects gateway safe mode from readyz and notifies once", async () => {
    vi.useFakeTimers();
    const gatewayState = { suppressed: ["telegram", "discord"] };
    const { watchdog, insertWatchdogEvent, notifier } = createHarness({
      autoRepair: false,
      resolveGatewayReadyzUrl: () => "http://127.0.0.1:18789/readyz",
      fetchImpl: buildSafeModeFetch(gatewayState),
    });

    watchdog.start();
    await vi.advanceTimersByTimeAsync(10);

    expect(watchdog.getStatus()).toEqual(
      expect.objectContaining({
        lifecycle: "running",
        health: "healthy",
        safeMode: true,
        suppressedChannels: ["telegram", "discord"],
      }),
    );
    expect(insertWatchdogEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "safe_mode",
        status: "failed",
        details: expect.objectContaining({
          suppressed: ["telegram", "discord"],
        }),
      }),
    );
    const safeModeNotices = () =>
      notifier.notify.mock.calls.filter((call) =>
        String(call?.[0] || "").includes("safe mode"),
      );
    expect(safeModeNotices()).toHaveLength(1);

    // Subsequent checks with unchanged suppression must not re-notify.
    await vi.advanceTimersByTimeAsync(120_000);
    expect(safeModeNotices()).toHaveLength(1);
    watchdog.stop();
  });

  it("clears safe mode and notifies recovery when suppression ends", async () => {
    vi.useFakeTimers();
    const gatewayState = { suppressed: ["telegram"] };
    const { watchdog, insertWatchdogEvent, notifier } = createHarness({
      autoRepair: false,
      resolveGatewayReadyzUrl: () => "http://127.0.0.1:18789/readyz",
      fetchImpl: buildSafeModeFetch(gatewayState),
    });

    watchdog.start();
    await vi.advanceTimersByTimeAsync(10);
    expect(watchdog.getStatus().safeMode).toBe(true);

    gatewayState.suppressed = [];
    await vi.advanceTimersByTimeAsync(120_000);

    expect(watchdog.getStatus()).toEqual(
      expect.objectContaining({ safeMode: false, suppressedChannels: [] }),
    );
    expect(insertWatchdogEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "safe_mode",
        status: "ok",
        details: expect.objectContaining({ recovered: true }),
      }),
    );
    expect(
      notifier.notify.mock.calls.some((call) =>
        String(call?.[0] || "").includes("safe mode cleared"),
      ),
    ).toBe(true);
    watchdog.stop();
  });

  it("resumeChannels issues channels.start for each suppressed channel", async () => {
    vi.useFakeTimers();
    const gatewayState = { suppressed: ["telegram", "discord"] };
    const startCalls = [];
    const { watchdog } = createHarness({
      autoRepair: false,
      resolveGatewayReadyzUrl: () => "http://127.0.0.1:18789/readyz",
      fetchImpl: buildSafeModeFetch(gatewayState),
      clawCmdImpl: async (command) => {
        if (command.startsWith("gateway call channels.start")) {
          startCalls.push(command);
          return { ok: true, stdout: "{}" };
        }
        return { ok: true, stdout: "" };
      },
    });

    watchdog.start();
    await vi.advanceTimersByTimeAsync(10);
    expect(watchdog.getStatus().safeMode).toBe(true);

    gatewayState.suppressed = [];
    const resultPromise = watchdog.resumeChannels();
    await vi.advanceTimersByTimeAsync(10);
    const result = await resultPromise;

    expect(result.ok).toBe(true);
    expect(startCalls).toEqual([
      `gateway call channels.start --params '{"channel":"telegram"}'`,
      `gateway call channels.start --params '{"channel":"discord"}'`,
    ]);
    expect(watchdog.getStatus()).toEqual(
      expect.objectContaining({ safeMode: false, suppressedChannels: [] }),
    );
    watchdog.stop();
  });

  it("resumeChannels skips when no channels are suppressed", async () => {
    const { watchdog, clawCmd } = createHarness({ autoRepair: false });

    const result = await watchdog.resumeChannels();

    expect(result).toEqual({
      ok: false,
      skipped: true,
      reason: "no_suppressed_channels",
    });
    expect(clawCmd).not.toHaveBeenCalled();
  });

  it("clears safe-mode status when the gateway exits", async () => {
    vi.useFakeTimers();
    const gatewayState = { suppressed: ["telegram"] };
    const { watchdog } = createHarness({
      autoRepair: false,
      resolveGatewayReadyzUrl: () => "http://127.0.0.1:18789/readyz",
      fetchImpl: buildSafeModeFetch(gatewayState),
    });

    watchdog.start();
    await vi.advanceTimersByTimeAsync(10);
    expect(watchdog.getStatus().safeMode).toBe(true);

    watchdog.onGatewayExit({ code: 1, expectedExit: false });

    expect(watchdog.getStatus()).toEqual(
      expect.objectContaining({ safeMode: false, suppressedChannels: [] }),
    );
    watchdog.stop();
  });

  it("handles missing URL resolvers and a missing notifier gracefully", async () => {
    process.env.WATCHDOG_AUTO_REPAIR = "false";
    process.env.WATCHDOG_NOTIFICATIONS_DISABLED = "false";
    const insertWatchdogEvent = vi.fn();
    const watchdog = createWatchdog({
      clawCmd: vi.fn(async () => ({ ok: true, stdout: "" })),
      launchGatewayProcess: vi.fn(() => ({ pid: 1 })),
      insertWatchdogEvent,
      notifier: null,
      readEnvFile: vi.fn(() => []),
      writeEnvFile: vi.fn(),
      reloadEnv: vi.fn(),
      // resolveSetupUrl / health / readyz resolvers intentionally omitted.
    });

    watchdog.onGatewayLaunch({ startedAt: Date.now() - 60_000 });
    await flushMicrotasks();

    expect(insertWatchdogEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "health_check",
        details: expect.objectContaining({
          reason: "gateway health URL unavailable",
        }),
      }),
    );

    // Crash-loop notifications degrade to no-ops without a notifier, and the
    // watchdog link falls back to localhost when no setup URL resolver exists.
    watchdog.onGatewayExit({ code: 1, expectedExit: false });
    watchdog.onGatewayExit({ code: 1, expectedExit: false });
    watchdog.onGatewayExit({ code: 1, expectedExit: false });
    await flushMicrotasks();

    expect(watchdog.getStatus().lifecycle).toBe("crash_loop");
    expect(insertWatchdogEvent).not.toHaveBeenCalledWith(
      expect.objectContaining({ eventType: "notification" }),
    );
    watchdog.stop();
  });

  it("skips readiness probing when no readyz resolver is provided", async () => {
    process.env.WATCHDOG_AUTO_REPAIR = "false";
    process.env.WATCHDOG_NOTIFICATIONS_DISABLED = "false";
    global.fetch = vi.fn(async () => ({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ ok: true, status: "live" }),
    }));
    const watchdog = createWatchdog({
      clawCmd: vi.fn(async () => ({ ok: true, stdout: "" })),
      launchGatewayProcess: vi.fn(() => ({ pid: 1 })),
      insertWatchdogEvent: vi.fn(),
      notifier: { notify: vi.fn(async () => ({ ok: true })) },
      readEnvFile: vi.fn(() => []),
      writeEnvFile: vi.fn(),
      reloadEnv: vi.fn(),
      resolveSetupUrl: () => "https://setup.example.com",
      resolveGatewayHealthUrl: () => "http://127.0.0.1:18789/health",
      // resolveGatewayReadyzUrl intentionally omitted: default returns "".
    });

    watchdog.onGatewayLaunch({ startedAt: Date.now() - 60_000 });
    await flushMicrotasks();

    expect(watchdog.getStatus()).toEqual(
      expect.objectContaining({
        health: "healthy",
        safeMode: false,
        suppressedChannels: [],
      }),
    );
    // Only the health endpoint was probed.
    expect(global.fetch).toHaveBeenCalledTimes(1);
    watchdog.stop();
  });

  it("omits the view-logs link when resolveSetupUrl throws", async () => {
    const { watchdog, notifier } = createHarness({
      autoRepair: false,
      resolveSetupUrl: () => {
        throw new Error("setup URL resolution failed");
      },
    });

    watchdog.onGatewayExit({ code: 1, expectedExit: false });
    watchdog.onGatewayExit({ code: 1, expectedExit: false });
    watchdog.onGatewayExit({ code: 1, expectedExit: false });
    await flushMicrotasks();

    const crashLoopNotice = notifier.notify.mock.calls
      .map((call) => String(call?.[0] || ""))
      .find((message) => message.includes("Crash loop detected"));
    expect(crashLoopNotice).toBeTruthy();
    expect(crashLoopNotice).not.toContain("View logs");
  });

  it("notifies a crash loop only once per incident", async () => {
    const { watchdog, notifier, insertWatchdogEvent } = createHarness({
      autoRepair: false,
    });

    watchdog.onGatewayExit({ code: 1, expectedExit: false });
    watchdog.onGatewayExit({ code: 1, expectedExit: false });
    watchdog.onGatewayExit({ code: 1, expectedExit: false });
    await flushMicrotasks();
    watchdog.onGatewayExit({ code: 1, expectedExit: false });
    await flushMicrotasks();

    const crashLoopNotices = notifier.notify.mock.calls.filter((call) =>
      String(call?.[0] || "").includes("Crash loop detected"),
    );
    expect(crashLoopNotices).toHaveLength(1);
    const crashLoopEvents = insertWatchdogEvent.mock.calls.filter(
      (call) => call?.[0]?.eventType === "crash_loop",
    );
    expect(crashLoopEvents).toHaveLength(2);
  });

  it("logs event-insert failures to the console without crashing", () => {
    const { watchdog, insertWatchdogEvent } = createHarness({
      autoRepair: false,
    });
    insertWatchdogEvent.mockImplementation(() => {
      throw new Error("db locked");
    });
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    watchdog.onGatewayExit({ code: 0, expectedExit: true });

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("failed to log event"),
    );
  });

  it("aborts hung health probes after the timeout", async () => {
    vi.useFakeTimers();
    const { watchdog, insertWatchdogEvent } = createHarness({
      autoRepair: false,
      fetchImpl: (url, opts) =>
        new Promise((resolve, reject) => {
          opts.signal.addEventListener("abort", () =>
            reject(Object.assign(new Error("aborted"), { name: "AbortError" })),
          );
        }),
    });

    watchdog.onGatewayLaunch({ startedAt: Date.now() - 60_000 });
    await vi.advanceTimersByTimeAsync(5_000);

    expect(insertWatchdogEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "health_check",
        details: expect.objectContaining({
          reason: "gateway health timed out after 5000ms",
        }),
      }),
    );
    watchdog.stop();
  });

  it("aborts hung readyz probes without disturbing a healthy gateway", async () => {
    vi.useFakeTimers();
    const { watchdog } = createHarness({
      autoRepair: false,
      resolveGatewayReadyzUrl: () => "http://127.0.0.1:18789/readyz",
      fetchImpl: (url, opts) => {
        if (String(url).includes("/readyz")) {
          return new Promise((resolve, reject) => {
            opts.signal.addEventListener("abort", () =>
              reject(Object.assign(new Error("aborted"), { name: "AbortError" })),
            );
          });
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          text: async () => JSON.stringify({ ok: true, status: "live" }),
        });
      },
    });

    watchdog.onGatewayLaunch({ startedAt: Date.now() - 60_000 });
    await vi.advanceTimersByTimeAsync(5_000);

    expect(watchdog.getStatus()).toEqual(
      expect.objectContaining({
        health: "healthy",
        safeMode: false,
        suppressedChannels: [],
      }),
    );
    watchdog.stop();
  });

  it("ignores readyz HTTP failures and readyz fetch errors", async () => {
    let readyzMode = "http-error";
    const { watchdog } = createHarness({
      autoRepair: false,
      resolveGatewayReadyzUrl: () => "http://127.0.0.1:18789/readyz",
      fetchImpl: async (url) => {
        if (String(url).includes("/readyz")) {
          if (readyzMode === "http-error") {
            return { ok: false, status: 503, text: async () => "oops" };
          }
          throw new Error("readyz socket hangup");
        }
        return {
          ok: true,
          status: 200,
          text: async () => JSON.stringify({ ok: true, status: "live" }),
        };
      },
    });

    watchdog.onGatewayLaunch({ startedAt: Date.now() - 60_000 });
    await flushMicrotasks();
    expect(watchdog.getStatus()).toEqual(
      expect.objectContaining({ health: "healthy", safeMode: false }),
    );

    readyzMode = "throw";
    watchdog.onGatewayLaunch({ startedAt: Date.now() - 60_000 });
    await flushMicrotasks();
    expect(watchdog.getStatus()).toEqual(
      expect.objectContaining({ health: "healthy", safeMode: false }),
    );
    watchdog.stop();
  });

  it("reports HTTP and body-level health failure reasons", async () => {
    vi.useFakeTimers();
    const responses = [
      {
        ok: false,
        status: 503,
        text: async () => JSON.stringify({ error: "upstream exploded" }),
      },
      { ok: false, status: 500, text: async () => "not json" },
      {
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ ok: false, error: "draining" }),
      },
      { ok: true, status: 200, text: async () => JSON.stringify({ ok: false }) },
    ];
    const { watchdog, insertWatchdogEvent } = createHarness({
      autoRepair: false,
      fetchImpl: async () => {
        const next = responses.shift();
        if (!next) throw new Error("still down");
        return next;
      },
    });

    watchdog.onGatewayLaunch({ startedAt: Date.now() - 60_000 });
    // Bootstrap checks at t=0/5s/10s consume the first three responses; the
    // degraded 5s retry at t=15s consumes the fourth, then keeps rescheduling
    // until the regular 120s interval overlaps with a pending retry timer.
    await vi.advanceTimersByTimeAsync(130_000);

    const reasons = insertWatchdogEvent.mock.calls
      .filter((call) => call?.[0]?.eventType === "health_check")
      .map((call) => call?.[0]?.details?.reason);
    expect(reasons).toEqual(
      expect.arrayContaining([
        "upstream exploded",
        "gateway health returned HTTP 500",
        "draining",
        "gateway unhealthy",
        "still down",
      ]),
    );
    expect(watchdog.getStatus().health).toBe("degraded");
    watchdog.stop();
  });

  it("skips stale degraded retries after a forced repair resets health", async () => {
    vi.useFakeTimers();
    const gatewayState = { healthy: true };
    const { watchdog } = createHarness({
      autoRepair: false,
      clawCmdImpl: async (command) => {
        if (command === "doctor --fix --yes") return { ok: true, stdout: "fixed" };
        return { ok: true, stdout: "" };
      },
      fetchImpl: async () => {
        if (!gatewayState.healthy) throw new Error("gateway down");
        return {
          ok: true,
          status: 200,
          text: async () => JSON.stringify({ ok: true, status: "live" }),
        };
      },
    });

    watchdog.onGatewayLaunch({ startedAt: Date.now() - 60_000 });
    await vi.advanceTimersByTimeAsync(0);
    expect(watchdog.getStatus().health).toBe("healthy");

    // A previously-healthy gateway degrades on the first failed interval check.
    gatewayState.healthy = false;
    await vi.advanceTimersByTimeAsync(120_000);
    expect(watchdog.getStatus().health).toBe("degraded");

    const repairPromise = watchdog.triggerRepair();
    await vi.advanceTimersByTimeAsync(0);
    const repairResult = await repairPromise;
    expect(repairResult.ok).toBe(true);
    expect(watchdog.getStatus().health).toBe("unknown");

    // The degraded retry scheduled before the repair fires and must no-op.
    const fetchCallsBeforeRetry = global.fetch.mock.calls.length;
    await vi.advanceTimersByTimeAsync(5_000);
    expect(global.fetch.mock.calls.length).toBe(fetchCallsBeforeRetry);
    expect(watchdog.getStatus().health).toBe("unknown");
    watchdog.stop();
  });

  it("skips auto-repair while a configuration error is latched", async () => {
    const { watchdog, clawCmd } = createHarness({
      autoRepair: true,
      fetchImpl: async () => {
        throw new Error("gateway down");
      },
    });

    watchdog.onGatewayExit({ code: 78, expectedExit: false });
    await flushMicrotasks();
    watchdog.onGatewayExit({ code: 1, expectedExit: false });
    watchdog.onGatewayExit({ code: 1, expectedExit: false });
    watchdog.onGatewayExit({ code: 1, expectedExit: false });
    await flushMicrotasks();
    await flushMicrotasks();

    expect(clawCmd).not.toHaveBeenCalledWith("doctor --fix --yes", {
      quiet: true,
    });
  });

  it("skips crash-loop auto-repair while awaiting recovery from a prior repair", async () => {
    vi.useFakeTimers();
    const doctorCalls = [];
    const { watchdog } = createHarness({
      autoRepair: true,
      clawCmdImpl: async (command) => {
        if (command === "doctor --fix --yes") {
          doctorCalls.push(command);
          return { ok: true, stdout: "fixed" };
        }
        return { ok: true, stdout: "" };
      },
      fetchImpl: async () => {
        throw new Error("still unhealthy");
      },
    });

    watchdog.onGatewayLaunch({ startedAt: Date.now() - 60_000 });
    await vi.advanceTimersByTimeAsync(10_000);
    expect(doctorCalls).toHaveLength(1);

    watchdog.onGatewayExit({ code: 1, expectedExit: false });
    watchdog.onGatewayExit({ code: 1, expectedExit: false });
    watchdog.onGatewayExit({ code: 1, expectedExit: false });
    await vi.advanceTimersByTimeAsync(0);

    expect(doctorCalls).toHaveLength(1);
    watchdog.stop();
  });

  it("rejects overlapping repairs and skips crash restarts mid-repair", async () => {
    let resolveDoctor;
    const { watchdog, launchGatewayProcess } = createHarness({
      autoRepair: true,
      clawCmdImpl: async (command) => {
        if (command === "doctor --fix --yes") {
          return new Promise((resolve) => {
            resolveDoctor = resolve;
          });
        }
        return { ok: true, stdout: "" };
      },
    });

    const firstRepair = watchdog.triggerRepair();
    await flushMicrotasks();

    const secondRepair = await watchdog.triggerRepair();
    expect(secondRepair).toEqual({
      ok: false,
      skipped: true,
      reason: "operation_in_progress",
    });

    // A crash while the repair is running must not double-launch the gateway.
    watchdog.onGatewayExit({ code: 1, expectedExit: false });
    await flushMicrotasks();
    expect(launchGatewayProcess).not.toHaveBeenCalled();

    resolveDoctor({ ok: true, stdout: "fixed" });
    const firstResult = await firstRepair;
    expect(firstResult.ok).toBe(true);
    expect(launchGatewayProcess).toHaveBeenCalledTimes(1);
  });

  it("abandons an in-flight repair when EX_CONFIG lands mid-doctor", async () => {
    let resolveDoctor;
    const { watchdog, launchGatewayProcess } = createHarness({
      autoRepair: true,
      clawCmdImpl: async (command) => {
        if (command === "doctor --fix --yes") {
          return new Promise((resolve) => {
            resolveDoctor = resolve;
          });
        }
        return { ok: true, stdout: "" };
      },
      fetchImpl: async () => {
        throw new Error("gateway down");
      },
    });

    watchdog.onGatewayExit({ code: 1, expectedExit: false });
    watchdog.onGatewayExit({ code: 1, expectedExit: false });
    watchdog.onGatewayExit({ code: 1, expectedExit: false });
    await flushMicrotasks();
    // Crashes 1-2 relaunched the gateway; the third opened a crash loop and
    // started an auto-repair whose doctor run is still in flight.
    expect(launchGatewayProcess).toHaveBeenCalledTimes(2);

    watchdog.onGatewayExit({ code: 78, expectedExit: false });
    await flushMicrotasks();

    resolveDoctor({ ok: true, stdout: "fixed" });
    await flushMicrotasks();
    await flushMicrotasks();

    // The completed doctor run must not relaunch a misconfigured gateway.
    expect(launchGatewayProcess).toHaveBeenCalledTimes(2);
    expect(watchdog.getStatus().lifecycle).toBe("configuration_error");
  });

  it("logs when a repair cannot relaunch the gateway", async () => {
    const { watchdog, launchGatewayProcess, insertWatchdogEvent } = createHarness({
      autoRepair: true,
      clawCmdImpl: async (command) => {
        if (command === "doctor --fix --yes") return { ok: true, stdout: "fixed" };
        return { ok: true, stdout: "" };
      },
      fetchImpl: async () => {
        throw new Error("gateway down");
      },
    });

    launchGatewayProcess.mockReturnValue(null);
    const noChildResult = await watchdog.triggerRepair();
    expect(noChildResult.ok).toBe(true);
    expect(noChildResult.launchedGateway).toBe(false);
    expect(insertWatchdogEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "restart",
        source: "repair",
        status: "failed",
        details: { reason: "launchGatewayProcess returned no child" },
      }),
    );

    launchGatewayProcess.mockImplementation(() => {
      throw new Error("spawn failure");
    });
    const throwResult = await watchdog.triggerRepair();
    expect(throwResult.ok).toBe(true);
    expect(throwResult.launchedGateway).toBe(false);
    expect(insertWatchdogEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "restart",
        source: "repair",
        status: "failed",
        details: { error: "spawn failure" },
      }),
    );
  });

  it("pauses manual repair after repeated doctor failures", async () => {
    const { watchdog, notifier, insertWatchdogEvent } = createHarness({
      autoRepair: false,
      clawCmdImpl: async (command) => {
        if (command === "doctor --fix --yes") {
          return { ok: false, stderr: "doctor exploded" };
        }
        return { ok: true, stdout: "" };
      },
    });

    const firstResult = await watchdog.triggerRepair();
    expect(firstResult.ok).toBe(false);
    expect(watchdog.getStatus()).toEqual(
      expect.objectContaining({ repairAttempts: 1, health: "unhealthy" }),
    );
    expect(insertWatchdogEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "repair",
        source: "manual",
        status: "failed",
      }),
    );

    const secondResult = await watchdog.triggerRepair();
    expect(secondResult.ok).toBe(false);
    expect(watchdog.getStatus().repairAttempts).toBe(2);
    expect(
      notifier.notify.mock.calls.some((call) =>
        String(call?.[0] || "").includes("Auto-repair failed repeatedly"),
      ),
    ).toBe(true);
  });

  it("notifies auto-repair failures with attempt counts in crash loops", async () => {
    const { watchdog, notifier } = createHarness({
      autoRepair: true,
      clawCmdImpl: async (command) => {
        if (command === "doctor --fix --yes") {
          return { ok: false, stderr: "doctor exploded" };
        }
        return { ok: true, stdout: "" };
      },
      fetchImpl: async () => {
        throw new Error("gateway down");
      },
    });

    watchdog.onGatewayExit({ code: 1, expectedExit: false });
    watchdog.onGatewayExit({ code: 1, expectedExit: false });
    watchdog.onGatewayExit({ code: 1, expectedExit: false });
    await flushMicrotasks();
    await flushMicrotasks();

    const failureNotice = notifier.notify.mock.calls
      .map((call) => String(call?.[0] || ""))
      .find((message) => message.includes("🔴 Auto-repair failed"));
    expect(failureNotice).toBeTruthy();
    expect(failureNotice).toContain("Attempt count: 1");
    expect(failureNotice).toContain("Trigger: `crash_loop`");
  });

  it("logs crash restarts that cannot relaunch the gateway", async () => {
    const { watchdog, launchGatewayProcess, insertWatchdogEvent } = createHarness({
      autoRepair: false,
    });

    launchGatewayProcess.mockReturnValue(null);
    watchdog.onGatewayExit({ code: 1, expectedExit: false });
    await flushMicrotasks();
    expect(insertWatchdogEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "restart",
        source: "exit_event",
        status: "failed",
        details: { reason: "launchGatewayProcess returned no child" },
      }),
    );

    launchGatewayProcess.mockImplementation(() => {
      throw new Error("no exec");
    });
    watchdog.onGatewayExit({ code: 1, expectedExit: false });
    await flushMicrotasks();
    expect(insertWatchdogEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "restart",
        source: "exit_event",
        status: "failed",
        details: { error: "no exec" },
      }),
    );
  });

  it("rejects settings updates without any boolean fields", () => {
    const { watchdog, writeEnvFile } = createHarness({ autoRepair: false });

    expect(() => watchdog.updateSettings({})).toThrow(
      "Expected autoRepair and/or notificationsEnabled boolean",
    );
    expect(() => watchdog.updateSettings()).toThrow(
      "Expected autoRepair and/or notificationsEnabled boolean",
    );
    expect(writeEnvFile).not.toHaveBeenCalled();
  });

  it("overwrites existing watchdog env entries when updating settings", () => {
    const { watchdog, readEnvFile, writeEnvFile } = createHarness({
      autoRepair: true,
      notificationsDisabled: true,
    });
    readEnvFile.mockReturnValue([
      { key: "WATCHDOG_AUTO_REPAIR", value: "true" },
      { key: "WATCHDOG_NOTIFICATIONS_DISABLED", value: "true" },
    ]);

    watchdog.updateSettings({ autoRepair: false, notificationsEnabled: true });

    expect(writeEnvFile).toHaveBeenCalledWith([
      { key: "WATCHDOG_AUTO_REPAIR", value: "false" },
      { key: "WATCHDOG_NOTIFICATIONS_DISABLED", value: "false" },
    ]);
  });

  it("guards start and bootstrap scheduling against double-registration", async () => {
    vi.useFakeTimers();
    const gatewayState = { healthy: false };
    const { watchdog } = createHarness({
      autoRepair: false,
      fetchImpl: async () => {
        if (!gatewayState.healthy) throw new Error("booting");
        return {
          ok: true,
          status: 200,
          text: async () => JSON.stringify({ ok: true, status: "live" }),
        };
      },
    });

    watchdog.start();
    await vi.advanceTimersByTimeAsync(0);
    // Both re-entries are no-ops while a bootstrap retry timer is pending.
    watchdog.start();
    watchdog.onGatewayLaunch({ startedAt: Date.now() });
    await vi.advanceTimersByTimeAsync(0);

    gatewayState.healthy = true;
    await vi.advanceTimersByTimeAsync(5_000);
    expect(watchdog.getStatus().health).toBe("healthy");

    // With regular checks running, a new launch bootstraps once and then
    // declines to start a second regular interval.
    watchdog.onGatewayLaunch({ startedAt: Date.now() });
    await vi.advanceTimersByTimeAsync(0);
    expect(watchdog.getStatus().health).toBe("healthy");
    watchdog.start();

    const fetchCalls = global.fetch.mock.calls.length;
    await vi.advanceTimersByTimeAsync(1_000);
    expect(global.fetch.mock.calls.length).toBe(fetchCalls);
    watchdog.stop();
  });
});
