const childProcess = require("child_process");

const modulePath = require.resolve("../../lib/server/commands");
const constantsPath = require.resolve("../../lib/server/constants");
const originalExec = childProcess.exec;

const loadCommandsModule = ({ execMock }) => {
  childProcess.exec = execMock;
  delete require.cache[modulePath];
  delete require.cache[constantsPath];
  return require(modulePath);
};

describe("server/commands", () => {
  afterEach(() => {
    childProcess.exec = originalExec;
    delete require.cache[modulePath];
    delete require.cache[constantsPath];
  });

  it("attaches trimmed stdout and stderr to shellCmd errors", async () => {
    const execMock = vi.fn((cmd, opts, callback) => {
      callback(new Error("boom"), ' {"ok":true} \n', " noisy stderr \n");
    });
    const { createCommands } = loadCommandsModule({ execMock });
    const { shellCmd } = createCommands({
      gatewayEnv: () => ({ OPENCLAW_GATEWAY_TOKEN: "token" }),
    });

    await expect(shellCmd("openclaw models list --all --json")).rejects.toMatchObject({
      message: "boom",
      stdout: '{"ok":true}',
      stderr: "noisy stderr",
      cmd: "openclaw models list --all --json",
    });
  });

  it("preserves timeout metadata on clawCmd failures", async () => {
    const timeoutError = Object.assign(new Error("Command failed"), {
      code: null,
      killed: true,
      signal: "SIGTERM",
    });
    const execMock = vi.fn((cmd, opts, callback) => {
      callback(timeoutError, "", "");
    });
    const { createCommands } = loadCommandsModule({ execMock });
    const { clawCmd } = createCommands({
      gatewayEnv: () => ({ OPENCLAW_GATEWAY_TOKEN: "token" }),
    });

    const result = await clawCmd("nodes status --json", {
      quiet: true,
      timeoutMs: 1234,
    });

    expect(execMock).toHaveBeenCalledWith(
      "openclaw nodes status --json",
      expect.objectContaining({
        timeout: 1234,
        killSignal: "SIGTERM",
      }),
      expect.any(Function),
    );
    expect(result).toMatchObject({
      ok: false,
      stdout: "",
      stderr: "",
      code: null,
      killed: true,
      signal: "SIGTERM",
      timedOut: true,
    });
  });

  it("prefixes clawCmd with the Dench profile in DenchClaw runtime", async () => {
    const previousRuntime = process.env.ALPHACLAW_CLAW_RUNTIME;
    process.env.ALPHACLAW_CLAW_RUNTIME = "denchclaw";
    const execMock = vi.fn((cmd, opts, callback) => {
      callback(null, "{}", "");
    });
    try {
      const { createCommands } = loadCommandsModule({ execMock });
      const { clawCmd } = createCommands({
        gatewayEnv: () => ({ OPENCLAW_GATEWAY_TOKEN: "token" }),
      });

      await clawCmd("nodes status --json", { quiet: true });

      expect(execMock).toHaveBeenCalledWith(
        "openclaw --profile dench nodes status --json",
        expect.any(Object),
        expect.any(Function),
      );
    } finally {
      if (previousRuntime === undefined) {
        delete process.env.ALPHACLAW_CLAW_RUNTIME;
      } else {
        process.env.ALPHACLAW_CLAW_RUNTIME = previousRuntime;
      }
    }
  });
});
