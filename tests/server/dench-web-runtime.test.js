const { createDenchWebRuntime } = require("../../lib/server/dench-web-runtime");

const createClawRuntime = (overrides = {}) => ({
  isDenchclaw: true,
  denchWebPort: 3100,
  env: {
    OPENCLAW_PROFILE: "dench",
    OPENCLAW_STATE_DIR: "/data/.openclaw-dench",
  },
  ...overrides,
});

describe("server/dench-web-runtime", () => {
  it("skips startup when DenchClaw runtime is disabled", async () => {
    const execFileAsync = vi.fn();
    const portProbe = vi.fn();
    const runtime = createDenchWebRuntime({
      clawRuntime: createClawRuntime({ isDenchclaw: false }),
      execFileAsync,
      portProbe,
    });

    await expect(runtime.start()).resolves.toEqual({
      ok: false,
      skipped: true,
      reason: "disabled",
    });
    expect(execFileAsync).not.toHaveBeenCalled();
    expect(portProbe).not.toHaveBeenCalled();
  });

  it("starts an installed DenchClaw web runtime on the configured port", async () => {
    const execFileAsync = vi.fn().mockResolvedValue({
      stdout: '{"ok":true}\n',
      stderr: "",
    });
    const portProbe = vi.fn().mockResolvedValue(false);
    const gatewayEnv = vi.fn(() => ({
      OPENCLAW_GATEWAY_TOKEN: "gateway-token",
      OPENCLAW_CONFIG_PATH: "/data/.openclaw-dench/openclaw.json",
    }));
    const runtime = createDenchWebRuntime({
      clawRuntime: createClawRuntime({ denchWebPort: 3200 }),
      gatewayEnv,
      env: { PATH: "/usr/bin" },
      execFileAsync,
      portProbe,
    });

    await expect(runtime.start({ reason: "test" })).resolves.toEqual({
      ok: true,
      stdout: '{"ok":true}\n',
      stderr: "",
    });

    expect(portProbe).toHaveBeenCalledWith({ host: "127.0.0.1", port: 3200 });
    expect(execFileAsync).toHaveBeenCalledWith(
      "denchclaw",
      [
        "start",
        "--web-port",
        "3200",
        "--no-open",
        "--skip-daemon-install",
        "--json",
      ],
      expect.objectContaining({
        env: expect.objectContaining({
          PATH: "/usr/bin",
          OPENCLAW_GATEWAY_TOKEN: "gateway-token",
          OPENCLAW_PROFILE: "dench",
          OPENCLAW_STATE_DIR: "/data/.openclaw-dench",
          DENCHCLAW_DAEMONLESS: "1",
        }),
        timeout: 90000,
        encoding: "utf8",
      }),
    );
  });

  it("installs the managed web runtime when start reports it missing", async () => {
    const missingRuntimeError = Object.assign(new Error("runtime missing"), {
      stderr: "Standalone web build is missing. Run `npx denchclaw update`.",
    });
    const execFileAsync = vi
      .fn()
      .mockRejectedValueOnce(missingRuntimeError)
      .mockResolvedValueOnce({ stdout: '{"updated":true}\n', stderr: "" });
    const runtime = createDenchWebRuntime({
      clawRuntime: createClawRuntime(),
      execFileAsync,
      portProbe: vi.fn().mockResolvedValue(false),
    });

    await expect(runtime.start({ reason: "test" })).resolves.toEqual({
      ok: true,
      stdout: '{"updated":true}\n',
      stderr: "",
    });

    expect(execFileAsync.mock.calls[0][1]).toEqual([
      "start",
      "--web-port",
      "3100",
      "--no-open",
      "--skip-daemon-install",
      "--json",
    ]);
    expect(execFileAsync.mock.calls[1][1]).toEqual([
      "update",
      "--non-interactive",
      "--yes",
      "--web-port",
      "3100",
      "--no-open",
      "--skip-daemon-install",
      "--json",
    ]);
    expect(execFileAsync.mock.calls[1][2]).toEqual(
      expect.objectContaining({ timeout: 240000 }),
    );
  });

  it("does not run denchclaw when the web port is already listening", async () => {
    const execFileAsync = vi.fn();
    const runtime = createDenchWebRuntime({
      clawRuntime: createClawRuntime(),
      execFileAsync,
      portProbe: vi.fn().mockResolvedValue(true),
    });

    await expect(runtime.start()).resolves.toEqual({
      ok: true,
      skipped: true,
      reason: "already_running",
    });
    expect(execFileAsync).not.toHaveBeenCalled();
  });
});
