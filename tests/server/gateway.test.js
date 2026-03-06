const childProcess = require("child_process");
const fs = require("fs");
const net = require("net");

const modulePath = require.resolve("../../lib/server/gateway");
const originalSpawn = childProcess.spawn;
const originalExecSync = childProcess.execSync;
const originalExistsSync = fs.existsSync;
const originalCreateConnection = net.createConnection;

const flushMicrotasks = () =>
  new Promise((resolve) => {
    setImmediate(resolve);
  });

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
    net.createConnection = originalCreateConnection;
    delete require.cache[modulePath];
  });

  it("stops managed child before relaunching on restart", async () => {
    const spawnMock = vi.fn(() => createChild());
    const execSyncMock = vi.fn(() => "");
    childProcess.spawn = spawnMock;
    childProcess.execSync = execSyncMock;
    fs.existsSync = vi.fn(() => true);
    net.createConnection = vi.fn(() => createSocket(false));
    delete require.cache[modulePath];
    const gateway = require(modulePath);

    await gateway.startGateway();
    expect(spawnMock).toHaveBeenCalledTimes(1);

    const reloadEnv = vi.fn();
    gateway.restartGateway(reloadEnv);
    await flushMicrotasks();
    await flushMicrotasks();

    expect(reloadEnv).toHaveBeenCalledTimes(1);
    expect(execSyncMock).toHaveBeenCalledTimes(1);
    expect(execSyncMock).toHaveBeenCalledWith("openclaw gateway start", {
      env: expect.any(Object),
      timeout: 15000,
      encoding: "utf8",
    });
    expect(spawnMock).toHaveBeenCalledTimes(2);
    const firstChild = spawnMock.mock.results[0].value;
    expect(firstChild.kill).toHaveBeenCalledWith("SIGTERM");
  });

  it("falls back to gateway stop command when no managed child exists", async () => {
    const spawnMock = vi.fn(() => createChild());
    const execSyncMock = vi.fn(() => "");
    childProcess.spawn = spawnMock;
    childProcess.execSync = execSyncMock;
    fs.existsSync = vi.fn(() => true);
    net.createConnection = vi.fn(() => createSocket(false));
    delete require.cache[modulePath];
    const gateway = require(modulePath);

    const reloadEnv = vi.fn();
    gateway.restartGateway(reloadEnv);
    await flushMicrotasks();
    await flushMicrotasks();

    expect(reloadEnv).toHaveBeenCalledTimes(1);
    expect(execSyncMock).toHaveBeenCalledTimes(2);
    expect(execSyncMock).toHaveBeenNthCalledWith(1, "openclaw gateway stop", {
      env: expect.any(Object),
      timeout: 15000,
      encoding: "utf8",
    });
    expect(execSyncMock).toHaveBeenNthCalledWith(2, "openclaw gateway start", {
      env: expect.any(Object),
      timeout: 15000,
      encoding: "utf8",
    });
    expect(spawnMock).toHaveBeenCalledTimes(1);
  });
});
