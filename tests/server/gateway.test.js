const childProcess = require("child_process");
const fs = require("fs");
const net = require("net");
const {
  ALPHACLAW_DIR,
  kControlUiSkillPath,
  kOnboardingMarkerPath,
  OPENCLAW_DIR,
} = require("../../lib/server/constants");

const modulePath = require.resolve("../../lib/server/gateway");
const originalSpawn = childProcess.spawn;
const originalExecSync = childProcess.execSync;
const originalExistsSync = fs.existsSync;
const originalMkdirSync = fs.mkdirSync;
const originalReadFileSync = fs.readFileSync;
const originalWriteFileSync = fs.writeFileSync;
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
    fs.mkdirSync = originalMkdirSync;
    fs.readFileSync = originalReadFileSync;
    fs.writeFileSync = originalWriteFileSync;
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

  it("launches the gateway with OPENCLAW_HOME pointed at the managed dir", async () => {
    const spawnMock = vi.fn(() => createChild());
    childProcess.spawn = spawnMock;
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

    expect(spawnMock).toHaveBeenCalledWith("openclaw", ["gateway", "run"], {
      env: expect.objectContaining({
        OPENCLAW_HOME: OPENCLAW_DIR,
        OPENCLAW_CONFIG_PATH: `${OPENCLAW_DIR}/openclaw.json`,
        XDG_CONFIG_HOME: OPENCLAW_DIR,
      }),
      stdio: ["pipe", "pipe", "pipe"],
    });
  });

  it("does not treat auth-only openclaw config as onboarded", () => {
    fs.existsSync = vi.fn((targetPath) => targetPath === `${OPENCLAW_DIR}/openclaw.json`);
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

  it("treats onboarding marker as source of truth", () => {
    fs.existsSync = vi.fn((targetPath) => targetPath === kOnboardingMarkerPath);
    delete require.cache[modulePath];
    const gateway = require(modulePath);

    expect(gateway.isOnboarded()).toBe(true);
  });

  it("does not backfill onboarding marker from config with primary model", () => {
    fs.existsSync = vi.fn((targetPath) => targetPath === `${OPENCLAW_DIR}/openclaw.json`);
    fs.mkdirSync = vi.fn();
    fs.writeFileSync = vi.fn();
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

    expect(gateway.isOnboarded()).toBe(false);
    expect(fs.mkdirSync).not.toHaveBeenCalled();
    expect(fs.writeFileSync).not.toHaveBeenCalled();
  });

  it("does not treat nested openclaw config as onboarded", () => {
    fs.existsSync = vi.fn(
      (targetPath) => targetPath === `${OPENCLAW_DIR}/.openclaw/openclaw.json`,
    );
    fs.mkdirSync = vi.fn();
    fs.writeFileSync = vi.fn();
    delete require.cache[modulePath];
    const gateway = require(modulePath);

    expect(gateway.isOnboarded()).toBe(false);
    expect(fs.mkdirSync).not.toHaveBeenCalled();
    expect(fs.writeFileSync).not.toHaveBeenCalled();
  });

  it("does not backfill onboarding marker from legacy onboarding artifact", () => {
    fs.existsSync = vi.fn((targetPath) => targetPath === kControlUiSkillPath);
    fs.mkdirSync = vi.fn();
    fs.writeFileSync = vi.fn();
    delete require.cache[modulePath];
    const gateway = require(modulePath);

    expect(gateway.isOnboarded()).toBe(false);
    expect(fs.writeFileSync).not.toHaveBeenCalled();
  });

  it("skips proxy config writes in read-only mode", () => {
    fs.existsSync = vi.fn(
      (targetPath) =>
        targetPath === kOnboardingMarkerPath ||
        targetPath === `${OPENCLAW_DIR}/openclaw.json`,
    );
    fs.readFileSync = vi.fn((targetPath) => {
      if (targetPath === kOnboardingMarkerPath) {
        return JSON.stringify({ onboarded: true, readOnly: true });
      }
      if (targetPath === `${OPENCLAW_DIR}/openclaw.json`) {
        return JSON.stringify({ gateway: {} });
      }
      return originalReadFileSync(targetPath, "utf8");
    });
    fs.writeFileSync = vi.fn();
    delete require.cache[modulePath];
    const gateway = require(modulePath);

    expect(gateway.ensureGatewayProxyConfig("https://example.com")).toBe(false);
    expect(fs.writeFileSync).not.toHaveBeenCalled();
  });

  it("skips channel sync writes in read-only mode", () => {
    const execSyncMock = vi.fn(() => "");
    childProcess.execSync = execSyncMock;
    fs.existsSync = vi.fn(
      (targetPath) =>
        targetPath === kOnboardingMarkerPath ||
        targetPath === `${OPENCLAW_DIR}/openclaw.json`,
    );
    fs.readFileSync = vi.fn((targetPath) => {
      if (targetPath === kOnboardingMarkerPath) {
        return JSON.stringify({ onboarded: true, readOnly: true });
      }
      if (targetPath === `${OPENCLAW_DIR}/openclaw.json`) {
        return JSON.stringify({ channels: { telegram: { enabled: false } } });
      }
      return originalReadFileSync(targetPath, "utf8");
    });
    delete require.cache[modulePath];
    const gateway = require(modulePath);

    gateway.syncChannelConfig([{ key: "TELEGRAM_BOT_TOKEN", value: "telegram-token" }]);
    expect(execSyncMock).not.toHaveBeenCalled();
  });
});
