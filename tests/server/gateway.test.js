const childProcess = require("child_process");
const fs = require("fs");
const net = require("net");

const modulePath = require.resolve("../../lib/server/gateway");
const originalSpawn = childProcess.spawn;
const originalExecSync = childProcess.execSync;
const originalExistsSync = fs.existsSync;
const originalReadFileSync = fs.readFileSync;
const originalCreateConnection = net.createConnection;

const createSocket = (isRunning) => ({
  setTimeout: vi.fn(),
  destroy: vi.fn(),
  on(event, handler) {
    if (isRunning && event === "connect") {
      setImmediate(handler);
    }
    if (!isRunning && event === "error") {
      setImmediate(handler);
    }
    return this;
  },
});

const createChild = () => ({
  pid: 1234,
  stdout: { on: vi.fn() },
  stderr: { on: vi.fn() },
  on: vi.fn(),
  kill: vi.fn(),
  exitCode: null,
  killed: false,
});

describe("server/gateway restart behavior", () => {
  afterEach(() => {
    childProcess.spawn = originalSpawn;
    childProcess.execSync = originalExecSync;
    fs.existsSync = originalExistsSync;
    fs.readFileSync = originalReadFileSync;
    net.createConnection = originalCreateConnection;
    delete require.cache[modulePath];
  });

  it("uses force restart when a managed child exists", async () => {
    const spawnMock = vi.fn(() => createChild());
    const execSyncMock = vi.fn(() => "");
    childProcess.spawn = spawnMock;
    childProcess.execSync = execSyncMock;
    fs.existsSync = vi.fn(() => true);
    net.createConnection = vi.fn(() => createSocket(false));
    delete require.cache[modulePath];
    const gateway = require(modulePath);
    fs.readFileSync = vi.fn(() =>
      JSON.stringify({
        agents: {
          defaults: {
            model: {
              primary: "openai/gpt-5.1-codex",
            },
          },
        },
      }),
    );

    await gateway.startGateway();
    expect(spawnMock).toHaveBeenCalledTimes(1);

    const reloadEnv = vi.fn();
    gateway.restartGateway(reloadEnv);

    expect(reloadEnv).toHaveBeenCalledTimes(1);
    expect(execSyncMock).toHaveBeenCalledTimes(1);
    expect(execSyncMock).toHaveBeenCalledWith("openclaw gateway --force", {
      env: expect.any(Object),
      timeout: 15000,
      encoding: "utf8",
    });
    expect(spawnMock).toHaveBeenCalledTimes(1);
    const firstChild = spawnMock.mock.results[0].value;
    expect(firstChild.kill).not.toHaveBeenCalled();
  });

  it("uses force restart when no managed child exists", () => {
    const spawnMock = vi.fn(() => createChild());
    const execSyncMock = vi.fn(() => "");
    childProcess.spawn = spawnMock;
    childProcess.execSync = execSyncMock;
    fs.existsSync = vi.fn(() => true);
    net.createConnection = vi.fn(() => createSocket(false));
    delete require.cache[modulePath];
    const gateway = require(modulePath);
    fs.readFileSync = vi.fn(() =>
      JSON.stringify({
        agents: {
          defaults: {
            model: {
              primary: "openai/gpt-5.1-codex",
            },
          },
        },
      }),
    );

    const reloadEnv = vi.fn();
    gateway.restartGateway(reloadEnv);

    expect(reloadEnv).toHaveBeenCalledTimes(1);
    expect(execSyncMock).toHaveBeenCalledTimes(1);
    expect(execSyncMock).toHaveBeenCalledWith("openclaw gateway --force", {
      env: expect.any(Object),
      timeout: 15000,
      encoding: "utf8",
    });
    expect(spawnMock).not.toHaveBeenCalled();
  });

  it("marks managed child exit as expected before force restart", async () => {
    const child = createChild();
    const spawnMock = vi.fn(() => child);
    const execSyncMock = vi.fn(() => "");
    const exitHandler = vi.fn();
    childProcess.spawn = spawnMock;
    childProcess.execSync = execSyncMock;
    fs.existsSync = vi.fn(() => true);
    net.createConnection = vi.fn(() => createSocket(false));
    delete require.cache[modulePath];
    const gateway = require(modulePath);
    gateway.setGatewayExitHandler(exitHandler);
    fs.readFileSync = vi.fn(() =>
      JSON.stringify({
        agents: {
          defaults: {
            model: {
              primary: "openai/gpt-5.1-codex",
            },
          },
        },
      }),
    );

    await gateway.startGateway();
    gateway.restartGateway(vi.fn());

    const exitRegistration = child.on.mock.calls.find((call) => call[0] === "exit");
    expect(exitRegistration).toBeTruthy();

    const [, onExit] = exitRegistration;
    onExit(0, null);

    expect(exitHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 0,
        signal: null,
        expectedExit: true,
      }),
    );
  });

  it("does not treat auth-only openclaw config as onboarded", () => {
    fs.existsSync = vi.fn(() => true);
    delete require.cache[modulePath];
    const gateway = require(modulePath);
    fs.readFileSync = vi.fn(() =>
      JSON.stringify({
        auth: {
          profiles: {
            "openai-codex:codex-cli": {
              provider: "openai-codex",
              mode: "oauth",
            },
          },
        },
      }),
    );

    expect(gateway.isOnboarded()).toBe(false);
  });

  it("treats config with primary model as onboarded", () => {
    fs.existsSync = vi.fn(() => true);
    delete require.cache[modulePath];
    const gateway = require(modulePath);
    fs.readFileSync = vi.fn(() =>
      JSON.stringify({
        agents: {
          defaults: {
            model: {
              primary: "openai-codex/gpt-5.3-codex",
            },
          },
        },
      }),
    );

    expect(gateway.isOnboarded()).toBe(true);
  });
});
