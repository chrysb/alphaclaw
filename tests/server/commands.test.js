const childProcess = require("child_process");

const {
  OPENCLAW_DIR,
  GOG_KEYRING_PASSWORD,
} = require("../../lib/server/constants");
const modulePath = require.resolve("../../lib/server/commands");
const originalExec = childProcess.exec;

const loadCommandsModule = ({ execMock }) => {
  childProcess.exec = execMock;
  delete require.cache[modulePath];
  return require(modulePath);
};

describe("server/commands", () => {
  afterEach(() => {
    childProcess.exec = originalExec;
    delete require.cache[modulePath];
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

  it("resolves trimmed stdout and logs it for non-json shell commands", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const execMock = vi.fn((cmd, opts, callback) => {
      callback(null, "  hello world \n", "");
    });
    const { createCommands } = loadCommandsModule({ execMock });
    const { shellCmd } = createCommands({ gatewayEnv: () => ({}) });

    await expect(shellCmd("echo hello ghp_secret123")).resolves.toBe(
      "hello world",
    );

    expect(logSpy).toHaveBeenCalledWith("[onboard] hello world");
    const runningLog = logSpy.mock.calls.find(([message]) =>
      String(message).startsWith("[onboard] Running:"),
    );
    expect(runningLog[0]).toContain("***");
    expect(runningLog[0]).not.toContain("ghp_secret123");
  });

  it("logs clawCmd failures when not quiet", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const execMock = vi.fn((cmd, opts, callback) => {
      callback(Object.assign(new Error("fail"), { code: 2 }), "", "bad flag\n");
    });
    const { createCommands } = loadCommandsModule({ execMock });
    const { clawCmd } = createCommands({
      gatewayEnv: () => ({ OPENCLAW_GATEWAY_TOKEN: "token" }),
    });

    const result = await clawCmd("bad command");

    expect(result).toMatchObject({
      ok: false,
      stdout: "",
      stderr: "bad flag",
      code: 2,
      killed: false,
      signal: null,
      timedOut: false,
    });
    expect(logSpy).toHaveBeenCalledWith("[alphaclaw] Running: openclaw bad command");
    expect(logSpy).toHaveBeenCalledWith("[alphaclaw] Error: bad flag");
  });

  it("runs gog commands with the keyring environment", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const execMock = vi.fn((cmd, opts, callback) => {
      callback(null, "ok\n", "");
    });
    const { createCommands } = loadCommandsModule({ execMock });
    const { gogCmd } = createCommands({ gatewayEnv: () => ({}) });

    const result = await gogCmd("auth list");

    expect(result).toEqual({ ok: true, stdout: "ok", stderr: "" });
    expect(execMock).toHaveBeenCalledWith(
      "gog auth list",
      expect.objectContaining({
        timeout: 15000,
        env: expect.objectContaining({
          XDG_CONFIG_HOME: OPENCLAW_DIR,
          GOG_KEYRING_PASSWORD,
        }),
      }),
      expect.any(Function),
    );
    expect(logSpy).toHaveBeenCalledWith("[alphaclaw] Running: gog auth list");
  });

  it("logs gog command failures when not quiet", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const execMock = vi.fn((cmd, opts, callback) => {
      callback(new Error("gog exploded"), "", "keyring locked\n");
    });
    const { createCommands } = loadCommandsModule({ execMock });
    const { gogCmd } = createCommands({ gatewayEnv: () => ({}) });

    const result = await gogCmd("gmail list", { quiet: false });

    expect(result).toEqual({ ok: false, stdout: "", stderr: "keyring locked" });
    expect(logSpy).toHaveBeenCalledWith(
      "[alphaclaw] gog error: keyring locked",
    );
  });
});
