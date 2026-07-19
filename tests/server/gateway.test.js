const childProcess = require("child_process");
const fs = require("fs");
const net = require("net");
const path = require("path");
const {
  ALPHACLAW_DIR,
  kDefaultGatewayPort,
  kOnboardingMarkerPath,
  OPENCLAW_DIR,
} = require("../../lib/server/constants");
const {
  kDefaultOpenclawCompileCacheDir,
} = require("../../lib/server/openclaw-runtime-env");

const kLegacyControlUiSkillPath = path.join(OPENCLAW_DIR, "skills", "control-ui", "SKILL.md");
const kAlphaclawConfigPath = path.join(OPENCLAW_DIR, "alphaclaw.json");

const modulePath = require.resolve("../../lib/server/gateway");
const originalSpawn = childProcess.spawn;
const originalExecSync = childProcess.execSync;
const originalExistsSync = fs.existsSync;
const originalMkdirSync = fs.mkdirSync;
const originalReaddirSync = fs.readdirSync;
const originalReadFileSync = fs.readFileSync;
const originalRmSync = fs.rmSync;
const originalWriteFileSync = fs.writeFileSync;
const originalCreateConnection = net.createConnection;

const createSocket = (isRunning) => {
  const running =
    typeof isRunning === "function" ? isRunning() : isRunning;
  return {
    setTimeout: vi.fn(),
    destroy: vi.fn(),
    on(event, handler) {
      if (running && event === "connect") {
        setImmediate(handler);
      }
      if (!running && event === "error") {
        setImmediate(handler);
      }
      return this;
    },
  };
};

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
    fs.readdirSync = originalReaddirSync;
    fs.readFileSync = originalReadFileSync;
    fs.rmSync = originalRmSync;
    fs.writeFileSync = originalWriteFileSync;
    net.createConnection = originalCreateConnection;
    delete require.cache[modulePath];
  });

  it("always cold-starts when the gateway port is listening", async () => {
    const managedChild = createChild();
    const restartSupervisor = createChild();
    const spawnMock = vi
      .fn()
      .mockReturnValueOnce(managedChild)
      .mockReturnValueOnce(restartSupervisor);
    const execSyncMock = vi.fn(() => "");
    childProcess.spawn = spawnMock;
    childProcess.execSync = execSyncMock;
    fs.existsSync = vi.fn(() => true);
    let gatewayPortOpen = false;
    net.createConnection = vi.fn(() => createSocket(() => gatewayPortOpen));
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

    gatewayPortOpen = true;
    const reloadEnv = vi.fn();
    await gateway.restartGateway(reloadEnv);

    expect(reloadEnv).toHaveBeenCalledTimes(1);
    expect(execSyncMock).not.toHaveBeenCalledWith(
      "openclaw gateway restart",
      expect.anything(),
    );
    expect(spawnMock).toHaveBeenCalledTimes(2);
    expect(spawnMock).toHaveBeenNthCalledWith(
      2,
      "openclaw",
      ["gateway", "--force"],
      expect.objectContaining({ env: expect.any(Object) }),
    );
    expect(managedChild.kill).toHaveBeenCalledWith("SIGTERM");
  });

  it("exports the durable OpenClaw state dir in gateway env", () => {
    const previousCompileCache = process.env.NODE_COMPILE_CACHE;
    const previousNoRespawn = process.env.OPENCLAW_NO_RESPAWN;
    delete process.env.NODE_COMPILE_CACHE;
    delete process.env.OPENCLAW_NO_RESPAWN;
    try {
      delete require.cache[modulePath];
      const gateway = require(modulePath);

      expect(gateway.gatewayEnv()).toEqual(
        expect.objectContaining({
          HOME: expect.any(String),
          OPENCLAW_HOME: expect.any(String),
          OPENCLAW_CONFIG_PATH: `${OPENCLAW_DIR}/openclaw.json`,
          OPENCLAW_STATE_DIR: OPENCLAW_DIR,
          XDG_CONFIG_HOME: OPENCLAW_DIR,
          NODE_COMPILE_CACHE: kDefaultOpenclawCompileCacheDir,
          OPENCLAW_NO_RESPAWN: "1",
        }),
      );
      expect(gateway.gatewayEnv().HOME).toBe(gateway.gatewayEnv().OPENCLAW_HOME);
    } finally {
      if (previousCompileCache === undefined) {
        delete process.env.NODE_COMPILE_CACHE;
      } else {
        process.env.NODE_COMPILE_CACHE = previousCompileCache;
      }
      if (previousNoRespawn === undefined) {
        delete process.env.OPENCLAW_NO_RESPAWN;
      } else {
        process.env.OPENCLAW_NO_RESPAWN = previousNoRespawn;
      }
    }
  });

  it("uses force cold start when the gateway port is not listening", async () => {
    const restartSupervisor = createChild();
    const spawnMock = vi.fn(() => restartSupervisor);
    const execSyncMock = vi.fn(() => "");
    childProcess.spawn = spawnMock;
    childProcess.execSync = execSyncMock;
    fs.existsSync = vi.fn(() => true);
    let gatewayPortOpen = false;
    net.createConnection = vi.fn(() => createSocket(() => gatewayPortOpen));
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
    const restartPromise = gateway.restartGateway(reloadEnv);
    gatewayPortOpen = true;
    await restartPromise;

    expect(reloadEnv).toHaveBeenCalledTimes(1);
    expect(execSyncMock).not.toHaveBeenCalledWith(
      "openclaw gateway restart",
      expect.anything(),
    );
    expect(spawnMock).toHaveBeenCalledTimes(1);
    expect(spawnMock).toHaveBeenCalledWith(
      "openclaw",
      ["gateway", "--force"],
      expect.objectContaining({ env: expect.any(Object) }),
    );
    expect(execSyncMock).not.toHaveBeenCalledWith(
      "openclaw gateway --force",
      expect.anything(),
    );
  });

  it("retries channel plugin preflight after cleaning stale install stages", () => {
    const firstError = new Error(
      "ENOTEMPTY: directory not empty, rmdir '/app/node_modules/openclaw/dist/extensions/telegram/.openclaw-install-stage/node_modules/typebox/build/type/engine'",
    );
    const execSyncMock = vi
      .fn()
      .mockImplementationOnce(() => {
        throw firstError;
      })
      .mockReturnValueOnce("{}");
    childProcess.execSync = execSyncMock;
    fs.existsSync = vi.fn((targetPath) => targetPath === `${OPENCLAW_DIR}/openclaw.json`);
    fs.readFileSync = vi.fn((targetPath, ...args) => {
      if (targetPath === `${OPENCLAW_DIR}/openclaw.json`) {
        return JSON.stringify({
          channels: {
            telegram: { enabled: true },
          },
        });
      }
      return originalReadFileSync(targetPath, ...args);
    });
    let stagePresent = true;
    fs.readdirSync = vi.fn((targetPath) => {
      if (String(targetPath).endsWith("/dist/extensions")) {
        return [{ name: "telegram", isDirectory: () => true }];
      }
      if (String(targetPath).endsWith("/dist/extensions/telegram")) {
        return [
          ...(stagePresent
            ? [{ name: ".openclaw-install-stage", isDirectory: () => true }]
            : []),
          { name: "node_modules", isDirectory: () => true },
        ];
      }
      return [];
    });
    fs.rmSync = vi.fn(() => {
      stagePresent = false;
    });
    delete require.cache[modulePath];
    const gateway = require(modulePath);

    gateway.prepareOpenclawChannelPlugins();

    expect(execSyncMock).toHaveBeenCalledTimes(2);
    expect(execSyncMock).toHaveBeenNthCalledWith(1, "openclaw plugins list --json", {
      env: expect.any(Object),
      timeout: 120000,
      encoding: "utf8",
    });
    expect(execSyncMock).toHaveBeenNthCalledWith(2, "openclaw plugins list --json", {
      env: expect.any(Object),
      timeout: 120000,
      encoding: "utf8",
    });
    expect(fs.rmSync).toHaveBeenCalledWith(
      expect.stringContaining("/telegram/.openclaw-install-stage"),
      expect.objectContaining({ recursive: true, force: true }),
    );
  });

  it("marks managed child exit as expected before force restart", async () => {
    const child = createChild();
    const spawnMock = vi.fn(() => child);
    const execSyncMock = vi.fn(() => "");
    const exitHandler = vi.fn();
    childProcess.spawn = spawnMock;
    childProcess.execSync = execSyncMock;
    fs.existsSync = vi.fn(() => true);
    let gatewayPortOpen = false;
    net.createConnection = vi.fn(() => createSocket(() => gatewayPortOpen));
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
    const restartPromise = gateway.restartGateway(vi.fn());
    gatewayPortOpen = true;
    await restartPromise;

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

  it("backfills onboarding marker from legacy onboarding artifact", () => {
    fs.existsSync = vi.fn((targetPath) => targetPath === kLegacyControlUiSkillPath);
    fs.mkdirSync = vi.fn();
    fs.writeFileSync = vi.fn();
    delete require.cache[modulePath];
    const gateway = require(modulePath);

    expect(gateway.isOnboarded()).toBe(true);
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      kOnboardingMarkerPath,
      expect.stringContaining('"reason": "legacy_artifact_backfill"'),
    );
  });

  it("adds the setup origin to gateway control UI config", () => {
    let currentConfig = {
      gateway: {},
    };
    fs.existsSync = vi.fn((targetPath) => targetPath === kOnboardingMarkerPath);
    fs.writeFileSync = vi.fn((targetPath, contents) => {
      if (targetPath === `${OPENCLAW_DIR}/openclaw.json`) {
        currentConfig = JSON.parse(contents);
      }
    });
    delete require.cache[modulePath];
    const gateway = require(modulePath);
    fs.readFileSync = vi.fn((targetPath) => {
      if (targetPath === `${OPENCLAW_DIR}/openclaw.json`) {
        return JSON.stringify(currentConfig);
      }
      return "{}";
    });

    const changed = gateway.ensureGatewayProxyConfig("https://setup.example.com");

    expect(changed).toBe(true);
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      `${OPENCLAW_DIR}/openclaw.json`,
      expect.any(String),
    );
    expect(currentConfig.gateway.trustedProxies).toEqual(["127.0.0.1"]);
    expect(currentConfig.gateway.controlUi.allowedOrigins).toEqual([
      "https://setup.example.com",
    ]);
    expect(currentConfig.gateway.http).toBeUndefined();
  });

  it("preserves existing allowed origins and remains idempotent", () => {
    let currentConfig = {
      gateway: {
        trustedProxies: ["127.0.0.1"],
        controlUi: {
          allowedOrigins: ["https://existing.example.com"],
        },
      },
    };
    fs.existsSync = vi.fn((targetPath) => targetPath === kOnboardingMarkerPath);
    fs.writeFileSync = vi.fn((targetPath, contents) => {
      if (targetPath === `${OPENCLAW_DIR}/openclaw.json`) {
        currentConfig = JSON.parse(contents);
      }
    });
    delete require.cache[modulePath];
    const gateway = require(modulePath);
    fs.readFileSync = vi.fn((targetPath) => {
      if (targetPath === `${OPENCLAW_DIR}/openclaw.json`) {
        return JSON.stringify(currentConfig);
      }
      return "{}";
    });

    const firstChanged = gateway.ensureGatewayProxyConfig("https://setup.example.com");
    const secondChanged = gateway.ensureGatewayProxyConfig("https://setup.example.com");

    expect(firstChanged).toBe(true);
    expect(secondChanged).toBe(false);
    expect(currentConfig.gateway.controlUi.allowedOrigins).toEqual([
      "https://existing.example.com",
      "https://setup.example.com",
    ]);
    expect(currentConfig.gateway.http).toBeUndefined();
    expect(fs.writeFileSync).toHaveBeenCalledTimes(1);
  });

  it("preserves existing gateway endpoint options while enabling opted-in public API endpoints", () => {
    let currentConfig = {
      gateway: {
        trustedProxies: ["127.0.0.1"],
        http: {
          endpoints: {
            chatCompletions: {
              maxBodyBytes: 12345,
            },
            responses: {
              maxBodyBytes: 67890,
            },
          },
        },
        controlUi: {
          allowedOrigins: ["https://setup.example.com"],
        },
      },
    };
    fs.existsSync = vi.fn((targetPath) => targetPath === kOnboardingMarkerPath);
    fs.writeFileSync = vi.fn((targetPath, contents) => {
      if (targetPath === `${OPENCLAW_DIR}/openclaw.json`) {
        currentConfig = JSON.parse(contents);
      }
    });
    delete require.cache[modulePath];
    const gateway = require(modulePath);
    fs.readFileSync = vi.fn((targetPath) => {
      if (targetPath === `${OPENCLAW_DIR}/openclaw.json`) {
        return JSON.stringify(currentConfig);
      }
      if (targetPath === kAlphaclawConfigPath) {
        return JSON.stringify({
          features: { openaiCompatApi: { enabled: true } },
        });
      }
      return "{}";
    });

    const changed = gateway.ensureGatewayProxyConfig("https://setup.example.com");

    expect(changed).toBe(true);
    expect(currentConfig.gateway.http.endpoints.chatCompletions).toEqual({
      enabled: true,
      maxBodyBytes: 12345,
    });
    expect(currentConfig.gateway.http.endpoints.responses).toEqual({
      enabled: true,
      maxBodyBytes: 67890,
    });
  });

  describe("Managed remote MCP server config", () => {
    const kRemoteMcpEnvKeys = [
      "REMOTE_MCP_URL",
      "REMOTE_MCP_API_TOKEN",
      "REMOTE_MCP_PROXY_URL",
      "REMOTE_MCP_NAME",
    ];

    const withEnv = (vars, fn) => {
      const prev = {};
      for (const key of kRemoteMcpEnvKeys) prev[key] = process.env[key];
      try {
        for (const [key, value] of Object.entries(vars)) {
          if (value === undefined) delete process.env[key];
          else process.env[key] = value;
        }
        return fn();
      } finally {
        for (const key of kRemoteMcpEnvKeys) {
          if (prev[key] === undefined) delete process.env[key];
          else process.env[key] = prev[key];
        }
      }
    };

    const setupConfigIo = (initial) => {
      let currentConfig = initial;
      let lastRawContents = null;
      fs.existsSync = vi.fn((targetPath) => targetPath === kOnboardingMarkerPath);
      fs.writeFileSync = vi.fn((targetPath, contents) => {
        if (targetPath === `${OPENCLAW_DIR}/openclaw.json`) {
          lastRawContents = contents;
          currentConfig = JSON.parse(contents);
        }
      });
      delete require.cache[modulePath];
      const gateway = require(modulePath);
      fs.readFileSync = vi.fn((targetPath) => {
        if (targetPath === `${OPENCLAW_DIR}/openclaw.json`) {
          return JSON.stringify(currentConfig);
        }
        return "{}";
      });
      return {
        gateway,
        getConfig: () => currentConfig,
        getRawContents: () => lastRawContents,
      };
    };

    it("writes remote MCP server with placeholder when env vars are set", () => {
      withEnv(
        {
          REMOTE_MCP_URL: "https://sure.example.com/mcp",
          REMOTE_MCP_API_TOKEN: "sk-sure-secret-token",
          REMOTE_MCP_PROXY_URL: undefined,
        },
        () => {
          const io = setupConfigIo({ gateway: {} });

          const changed = io.gateway.ensureGatewayProxyConfig(undefined);

          expect(changed).toBe(true);
          expect(io.getConfig().mcp.servers.remote).toEqual({
            url: "https://sure.example.com/mcp",
            transport: "streamable-http",
            headers: { Authorization: "Bearer ${REMOTE_MCP_API_TOKEN}" },
            _alphaclawManaged: true,
          });
          expect(io.getRawContents()).not.toContain("sk-sure-secret-token");
          expect(io.getRawContents()).toContain("Bearer ${REMOTE_MCP_API_TOKEN}");
        },
      );
    });

    it("routes through REMOTE_MCP_PROXY_URL when set", () => {
      withEnv(
        {
          REMOTE_MCP_URL: "https://sure.example.com/mcp",
          REMOTE_MCP_API_TOKEN: "sk-sure-secret-token",
          REMOTE_MCP_PROXY_URL: "http://127.0.0.1:8889/mcp",
        },
        () => {
          const io = setupConfigIo({ gateway: {} });

          const changed = io.gateway.ensureGatewayProxyConfig(undefined);

          expect(changed).toBe(true);
          expect(io.getConfig().mcp.servers.remote.url).toBe(
            "http://127.0.0.1:8889/mcp",
          );
          expect(io.getConfig().mcp.servers.remote.headers.Authorization).toBe(
            "Bearer ${REMOTE_MCP_API_TOKEN}",
          );
        },
      );
    });

    it("removes existing remote MCP server when env vars unset", () => {
      withEnv(
        {
          REMOTE_MCP_URL: undefined,
          REMOTE_MCP_API_TOKEN: undefined,
          REMOTE_MCP_PROXY_URL: undefined,
        },
        () => {
          const io = setupConfigIo({
            gateway: {},
            mcp: {
              servers: {
                remote: {
                  url: "https://old.example.com/mcp",
                  transport: "streamable-http",
                  headers: { Authorization: "Bearer ${REMOTE_MCP_API_TOKEN}" },
                  _alphaclawManaged: true,
                },
              },
            },
          });

          const changed = io.gateway.ensureGatewayProxyConfig(undefined);

          expect(changed).toBe(true);
          expect(io.getConfig().mcp).toBeUndefined();
        },
      );
    });

    it("preserves an unmarked user remote MCP server when env vars are unset", () => {
      withEnv(
        {
          REMOTE_MCP_URL: undefined,
          REMOTE_MCP_API_TOKEN: undefined,
          REMOTE_MCP_PROXY_URL: undefined,
        },
        () => {
          const io = setupConfigIo({
            gateway: {},
            mcp: {
              servers: {
                remote: {
                  url: "https://user.example.com/mcp",
                  transport: "sse",
                  headers: { Authorization: "Bearer user-token" },
                },
              },
            },
          });

          const changed = io.gateway.ensureGatewayProxyConfig(undefined);

          expect(changed).toBe(true);
          expect(io.getConfig().mcp.servers.remote).toEqual({
            url: "https://user.example.com/mcp",
            transport: "sse",
            headers: { Authorization: "Bearer user-token" },
          });
        },
      );
    });

    it("uses REMOTE_MCP_NAME as the server key when set", () => {
      withEnv(
        {
          REMOTE_MCP_URL: "https://sure.example.com/mcp",
          REMOTE_MCP_API_TOKEN: "sk-sure-secret-token",
          REMOTE_MCP_PROXY_URL: undefined,
          REMOTE_MCP_NAME: "sure",
        },
        () => {
          const io = setupConfigIo({ gateway: {} });

          const changed = io.gateway.ensureGatewayProxyConfig(undefined);

          expect(changed).toBe(true);
          expect(io.getConfig().mcp.servers.sure).toBeDefined();
          expect(io.getConfig().mcp.servers.remote).toBeUndefined();
          expect(io.getConfig().mcp.servers.sure.url).toBe(
            "https://sure.example.com/mcp",
          );
        },
      );
    });

    it("is idempotent when remote MCP server already matches", () => {
      withEnv(
        {
          REMOTE_MCP_URL: "https://sure.example.com/mcp",
          REMOTE_MCP_API_TOKEN: "sk-sure-secret-token",
          REMOTE_MCP_PROXY_URL: "http://127.0.0.1:8889/mcp",
        },
        () => {
          const io = setupConfigIo({ gateway: {} });

          const firstChanged = io.gateway.ensureGatewayProxyConfig(undefined);
          const secondChanged = io.gateway.ensureGatewayProxyConfig(undefined);

          expect(firstChanged).toBe(true);
          expect(secondChanged).toBe(false);
          expect(fs.writeFileSync).toHaveBeenCalledTimes(1);
        },
      );
    });

    it("uses REMOTE_MCP_URL directly when REMOTE_MCP_PROXY_URL is unset", () => {
      withEnv(
        {
          REMOTE_MCP_URL: "https://sure.example.com/mcp",
          REMOTE_MCP_API_TOKEN: "sk-sure-secret-token",
          REMOTE_MCP_PROXY_URL: undefined,
        },
        () => {
          const io = setupConfigIo({ gateway: {} });

          const changed = io.gateway.ensureGatewayProxyConfig(undefined);

          expect(changed).toBe(true);
          expect(io.getConfig().mcp.servers.remote.url).toBe(
            "https://sure.example.com/mcp",
          );
        },
      );
    });

    it("scrubs an existing plaintext Authorization back to the placeholder reference", () => {
      withEnv(
        {
          REMOTE_MCP_URL: "https://sure.example.com/mcp",
          REMOTE_MCP_API_TOKEN: "sk-sure-secret-token",
          REMOTE_MCP_PROXY_URL: undefined,
          PIPELOCK_ENABLED: undefined,
        },
        () => {
          const io = setupConfigIo({
            gateway: {},
            mcp: {
              servers: {
                sure: {
                  url: "https://sure.example.com/mcp",
                  transport: "streamable-http",
                  headers: {
                    Authorization: "Bearer sk-sure-secret-token",
                  },
                },
              },
            },
          });

          const changed = io.gateway.ensureGatewayProxyConfig(undefined);

          expect(changed).toBe(true);
          expect(io.getConfig().mcp.servers.remote.headers.Authorization).toBe(
            "Bearer ${REMOTE_MCP_API_TOKEN}",
          );
          expect(io.getRawContents()).not.toContain("sk-sure-secret-token");
        },
      );
    });

    it("removes the prior managed entry when REMOTE_MCP_NAME changes", () => {
      withEnv(
        {
          REMOTE_MCP_URL: "https://sure.example.com/mcp",
          REMOTE_MCP_API_TOKEN: "sk-sure-secret-token",
          REMOTE_MCP_PROXY_URL: undefined,
          REMOTE_MCP_NAME: "notion",
        },
        () => {
          const io = setupConfigIo({
            gateway: {},
            mcp: {
              servers: {
                sure: {
                  url: "https://old.example.com/mcp",
                  transport: "streamable-http",
                  headers: { Authorization: "Bearer ${REMOTE_MCP_API_TOKEN}" },
                  _alphaclawManaged: true,
                },
              },
            },
          });

          const changed = io.gateway.ensureGatewayProxyConfig(undefined);

          expect(changed).toBe(true);
          expect(io.getConfig().mcp.servers.sure).toBeUndefined();
          expect(io.getConfig().mcp.servers.notion).toBeDefined();
          expect(io.getConfig().mcp.servers.notion._alphaclawManaged).toBe(true);
        },
      );
    });

    it("does not touch unmarked user entries when REMOTE_MCP_NAME differs", () => {
      withEnv(
        {
          REMOTE_MCP_URL: "https://sure.example.com/mcp",
          REMOTE_MCP_API_TOKEN: "sk-sure-secret-token",
          REMOTE_MCP_PROXY_URL: undefined,
          REMOTE_MCP_NAME: "notion",
        },
        () => {
          const io = setupConfigIo({
            gateway: {},
            mcp: {
              servers: {
                "user-server": {
                  url: "https://user.example.com/mcp",
                  transport: "sse",
                },
              },
            },
          });

          const changed = io.gateway.ensureGatewayProxyConfig(undefined);

          expect(changed).toBe(true);
          expect(io.getConfig().mcp.servers["user-server"]).toEqual({
            url: "https://user.example.com/mcp",
            transport: "sse",
          });
          expect(io.getConfig().mcp.servers.notion._alphaclawManaged).toBe(true);
        },
      );
    });

    it.each([
      ["__proto__"],
      ["constructor"],
      ["prototype"],
      ["has spaces"],
      ["path/like"],
      ["dot.notation"],
      [""],
    ])("rejects invalid REMOTE_MCP_NAME %j and falls back to default", (badName) => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      withEnv(
        {
          REMOTE_MCP_URL: "https://sure.example.com/mcp",
          REMOTE_MCP_API_TOKEN: "sk-sure-secret-token",
          REMOTE_MCP_PROXY_URL: undefined,
          REMOTE_MCP_NAME: badName === "" ? undefined : badName,
        },
        () => {
          const io = setupConfigIo({ gateway: {} });

          const changed = io.gateway.ensureGatewayProxyConfig(undefined);

          expect(changed).toBe(true);
          expect(io.getConfig().mcp.servers.remote).toBeDefined();
          expect(Object.keys(io.getConfig().mcp.servers)).not.toContain(badName);
          // Empty REMOTE_MCP_NAME is a normal default, not a warning.
          if (badName) {
            expect(warnSpy).toHaveBeenCalledWith(
              expect.stringContaining("REMOTE_MCP_NAME"),
            );
          }
        },
      );
      warnSpy.mockRestore();
    });

    it("preserves unrelated mcp.servers entries when the remote config changes", () => {
      withEnv(
        {
          REMOTE_MCP_URL: "https://sure.example.com/mcp",
          REMOTE_MCP_API_TOKEN: "sk-sure-secret-token",
          REMOTE_MCP_PROXY_URL: undefined,
        },
        () => {
          const io = setupConfigIo({
            gateway: {},
            mcp: {
              servers: {
                other: {
                  url: "https://other.example.com/mcp",
                  transport: "sse",
                },
              },
            },
          });

          const changed = io.gateway.ensureGatewayProxyConfig(undefined);

          expect(changed).toBe(true);
          expect(io.getConfig().mcp.servers.other).toEqual({
            url: "https://other.example.com/mcp",
            transport: "sse",
          });
          expect(io.getConfig().mcp.servers.remote.url).toBe(
            "https://sure.example.com/mcp",
          );
        },
      );
    });
  });

  it("reports channel status per account while preserving provider summary", () => {
    fs.existsSync = vi.fn(() => true);
    fs.readdirSync = vi.fn((targetPath) => {
      if (targetPath === `${OPENCLAW_DIR}/credentials`) {
        return ["telegram-default-allowFrom.json", "telegram-alerts-allowFrom.json"];
      }
      return [];
    });
    fs.readFileSync = vi.fn((targetPath, ...args) => {
      if (targetPath === `${OPENCLAW_DIR}/openclaw.json`) {
        return JSON.stringify({
          channels: {
            telegram: {
              enabled: true,
              accounts: {
                default: { botToken: "${TELEGRAM_BOT_TOKEN}" },
                alerts: { botToken: "${TELEGRAM_BOT_TOKEN_ALERTS}" },
              },
            },
          },
        });
      }
      if (targetPath === `${OPENCLAW_DIR}/credentials/telegram-default-allowFrom.json`) {
        return JSON.stringify({ allowFrom: ["1001"] });
      }
      if (targetPath === `${OPENCLAW_DIR}/credentials/telegram-alerts-allowFrom.json`) {
        return JSON.stringify({ allowFrom: [] });
      }
      return originalReadFileSync(targetPath, ...args);
    });
    delete require.cache[modulePath];
    const gateway = require(modulePath);

    expect(gateway.getChannelStatus()).toEqual({
      telegram: {
        status: "paired",
        paired: 1,
        accounts: {
          default: { status: "paired", paired: 1 },
          alerts: { status: "configured", paired: 0 },
        },
      },
    });
  });

  it("treats legacy single-account telegram config as default account status", () => {
    fs.existsSync = vi.fn(() => true);
    fs.readdirSync = vi.fn((targetPath) => {
      if (targetPath === `${OPENCLAW_DIR}/credentials`) {
        return ["telegram-allowFrom.json"];
      }
      return [];
    });
    fs.readFileSync = vi.fn((targetPath, ...args) => {
      if (targetPath === `${OPENCLAW_DIR}/openclaw.json`) {
        return JSON.stringify({
          channels: {
            telegram: {
              enabled: true,
              botToken: "${TELEGRAM_BOT_TOKEN}",
              dmPolicy: "pairing",
            },
          },
        });
      }
      if (targetPath === `${OPENCLAW_DIR}/credentials/telegram-allowFrom.json`) {
        return JSON.stringify({ allowFrom: ["1001", "1002"] });
      }
      return originalReadFileSync(targetPath, ...args);
    });
    delete require.cache[modulePath];
    const gateway = require(modulePath);

    expect(gateway.getChannelStatus()).toEqual({
      telegram: {
        status: "paired",
        paired: 2,
        accounts: {
          default: { status: "paired", paired: 2 },
        },
      },
    });
  });

  it("treats whatsapp owner-number self chat as paired when saved creds exist", () => {
    const previousOwnerNumber = process.env.WHATSAPP_OWNER_NUMBER;
    process.env.WHATSAPP_OWNER_NUMBER = "+15551234567";
    try {
    fs.existsSync = vi.fn(() => true);
    fs.readdirSync = vi.fn(() => []);
    fs.readFileSync = vi.fn((targetPath, ...args) => {
      if (targetPath === `${OPENCLAW_DIR}/openclaw.json`) {
        return JSON.stringify({
          channels: {
            whatsapp: {
              enabled: true,
              accounts: {
                default: {
                  name: "WhatsApp",
                  dmPolicy: "pairing",
                },
              },
            },
          },
        });
      }
      if (targetPath === `${OPENCLAW_DIR}/credentials/whatsapp/default/creds.json`) {
        return "{}";
      }
      return originalReadFileSync(targetPath, ...args);
    });
    delete require.cache[modulePath];
    const gateway = require(modulePath);

    expect(gateway.getChannelStatus()).toEqual({
      whatsapp: {
        status: "paired",
        paired: 1,
        accounts: {
          default: { status: "paired", paired: 1 },
        },
      },
    });
    } finally {
      if (previousOwnerNumber === undefined) {
        delete process.env.WHATSAPP_OWNER_NUMBER;
      } else {
        process.env.WHATSAPP_OWNER_NUMBER = previousOwnerNumber;
      }
    }
  });

  it("keeps whatsapp configured when owner number exists but saved creds do not", () => {
    const previousOwnerNumber = process.env.WHATSAPP_OWNER_NUMBER;
    process.env.WHATSAPP_OWNER_NUMBER = "+15551234567";
    try {
      fs.existsSync = vi.fn(() => true);
      fs.readdirSync = vi.fn(() => []);
      fs.readFileSync = vi.fn((targetPath, ...args) => {
        if (targetPath === `${OPENCLAW_DIR}/openclaw.json`) {
          return JSON.stringify({
            channels: {
              whatsapp: {
                enabled: true,
                accounts: {
                  default: {
                    name: "WhatsApp",
                    dmPolicy: "pairing",
                  },
                },
              },
            },
          });
        }
        return originalReadFileSync(targetPath, ...args);
      });
      delete require.cache[modulePath];
      const gateway = require(modulePath);

      expect(gateway.getChannelStatus()).toEqual({
        whatsapp: {
          status: "configured",
          paired: 0,
          accounts: {
            default: { status: "configured", paired: 0 },
          },
        },
      });
    } finally {
      if (previousOwnerNumber === undefined) {
        delete process.env.WHATSAPP_OWNER_NUMBER;
      } else {
        process.env.WHATSAPP_OWNER_NUMBER = previousOwnerNumber;
      }
    }
  });

  it("does not treat whatsapp allowFrom owner placeholder as paired without saved creds", () => {
    const previousOwnerNumber = process.env.WHATSAPP_OWNER_NUMBER;
    process.env.WHATSAPP_OWNER_NUMBER = "+15551234567";
    try {
      fs.existsSync = vi.fn(() => true);
      fs.readdirSync = vi.fn(() => []);
      fs.readFileSync = vi.fn((targetPath, ...args) => {
        if (targetPath === `${OPENCLAW_DIR}/openclaw.json`) {
          return JSON.stringify({
            channels: {
              whatsapp: {
                enabled: true,
                accounts: {
                  default: {
                    name: "WhatsApp",
                    allowFrom: ["${WHATSAPP_OWNER_NUMBER}"],
                    groupAllowFrom: ["${WHATSAPP_OWNER_NUMBER}"],
                    dmPolicy: "allowlist",
                    groupPolicy: "allowlist",
                    selfChatMode: true,
                  },
                },
              },
            },
          });
        }
        return originalReadFileSync(targetPath, ...args);
      });
      delete require.cache[modulePath];
      const gateway = require(modulePath);

      expect(gateway.getChannelStatus()).toEqual({
        whatsapp: {
          status: "configured",
          paired: 0,
          accounts: {
            default: { status: "configured", paired: 0 },
          },
        },
      });
    } finally {
      if (previousOwnerNumber === undefined) {
        delete process.env.WHATSAPP_OWNER_NUMBER;
      } else {
        process.env.WHATSAPP_OWNER_NUMBER = previousOwnerNumber;
      }
    }
  });

  it("treats whatsapp allowFrom owner placeholder as paired when saved creds exist", () => {
    const previousOwnerNumber = process.env.WHATSAPP_OWNER_NUMBER;
    process.env.WHATSAPP_OWNER_NUMBER = "+15551234567";
    try {
      fs.existsSync = vi.fn(() => true);
      fs.readdirSync = vi.fn(() => []);
      fs.readFileSync = vi.fn((targetPath, ...args) => {
        if (targetPath === `${OPENCLAW_DIR}/openclaw.json`) {
          return JSON.stringify({
            channels: {
              whatsapp: {
                enabled: true,
                accounts: {
                  default: {
                    name: "WhatsApp",
                    allowFrom: ["${WHATSAPP_OWNER_NUMBER}"],
                    groupAllowFrom: ["${WHATSAPP_OWNER_NUMBER}"],
                    dmPolicy: "allowlist",
                    groupPolicy: "allowlist",
                    selfChatMode: true,
                  },
                },
              },
            },
          });
        }
        if (targetPath === `${OPENCLAW_DIR}/credentials/whatsapp/default/creds.json`) {
          return "{}";
        }
        return originalReadFileSync(targetPath, ...args);
      });
      delete require.cache[modulePath];
      const gateway = require(modulePath);

      expect(gateway.getChannelStatus()).toEqual({
        whatsapp: {
          status: "paired",
          paired: 1,
          accounts: {
            default: { status: "paired", paired: 1 },
          },
        },
      });
    } finally {
      if (previousOwnerNumber === undefined) {
        delete process.env.WHATSAPP_OWNER_NUMBER;
      } else {
        process.env.WHATSAPP_OWNER_NUMBER = previousOwnerNumber;
      }
    }
  });

  it("treats whatsapp as paired when selfChatMode is false, saved creds exist, and allowFrom is populated", () => {
    const previousOwnerNumber = process.env.WHATSAPP_OWNER_NUMBER;
    process.env.WHATSAPP_OWNER_NUMBER = "+15551234567";
    try {
      fs.existsSync = vi.fn(() => true);
      fs.readdirSync = vi.fn(() => []);
      fs.readFileSync = vi.fn((targetPath, ...args) => {
        if (targetPath === `${OPENCLAW_DIR}/openclaw.json`) {
          return JSON.stringify({
            channels: {
              whatsapp: {
                enabled: true,
                accounts: {
                  default: {
                    name: "WhatsApp",
                    allowFrom: ["+15559876543"],
                    selfChatMode: false,
                  },
                },
              },
            },
          });
        }
        if (targetPath === `${OPENCLAW_DIR}/credentials/whatsapp/default/creds.json`) {
          return "{}";
        }
        return originalReadFileSync(targetPath, ...args);
      });
      delete require.cache[modulePath];
      const gateway = require(modulePath);

      expect(gateway.getChannelStatus()).toEqual({
        whatsapp: {
          status: "paired",
          paired: 1,
          accounts: {
            default: { status: "paired", paired: 1 },
          },
        },
      });
    } finally {
      if (previousOwnerNumber === undefined) {
        delete process.env.WHATSAPP_OWNER_NUMBER;
      } else {
        process.env.WHATSAPP_OWNER_NUMBER = previousOwnerNumber;
      }
    }
  });

  it("treats whatsapp as configured when selfChatMode is false, saved creds exist, but allowFrom is empty", () => {
    const previousOwnerNumber = process.env.WHATSAPP_OWNER_NUMBER;
    process.env.WHATSAPP_OWNER_NUMBER = "+15551234567";
    try {
      fs.existsSync = vi.fn(() => true);
      fs.readdirSync = vi.fn(() => []);
      fs.readFileSync = vi.fn((targetPath, ...args) => {
        if (targetPath === `${OPENCLAW_DIR}/openclaw.json`) {
          return JSON.stringify({
            channels: {
              whatsapp: {
                enabled: true,
                accounts: {
                  default: {
                    name: "WhatsApp",
                    allowFrom: [],
                    selfChatMode: false,
                  },
                },
              },
            },
          });
        }
        if (targetPath === `${OPENCLAW_DIR}/credentials/whatsapp/default/creds.json`) {
          return "{}";
        }
        return originalReadFileSync(targetPath, ...args);
      });
      delete require.cache[modulePath];
      const gateway = require(modulePath);

      expect(gateway.getChannelStatus()).toEqual({
        whatsapp: {
          status: "configured",
          paired: 0,
          accounts: {
            default: { status: "configured", paired: 0 },
          },
        },
      });
    } finally {
      if (previousOwnerNumber === undefined) {
        delete process.env.WHATSAPP_OWNER_NUMBER;
      } else {
        process.env.WHATSAPP_OWNER_NUMBER = previousOwnerNumber;
      }
    }
  });

  describe("gateway process lifecycle", () => {
    it("streams managed gateway output, signals launch, and reports exits", () => {
      const child = createChild();
      childProcess.spawn = vi.fn(() => child);
      childProcess.execSync = vi.fn(() => "{}");
      fs.existsSync = vi.fn(() => false);
      delete require.cache[modulePath];
      const gateway = require(modulePath);
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      vi.spyOn(process.stdout, "write").mockImplementation(() => true);
      vi.spyOn(process.stderr, "write").mockImplementation(() => true);
      const launchHandler = vi.fn(() => {
        throw new Error("launch-boom");
      });
      gateway.setGatewayLaunchHandler(launchHandler);
      const exitHandler = vi.fn(() => {
        throw new Error("exit-boom");
      });
      gateway.setGatewayExitHandler(exitHandler);

      const first = gateway.launchGatewayProcess();
      expect(first).toBe(child);
      expect(gateway.launchGatewayProcess()).toBe(child);
      expect(childProcess.spawn).toHaveBeenCalledTimes(1);

      const onStdout = child.stdout.on.mock.calls.find((c) => c[0] === "data")[1];
      const onStderr = child.stderr.on.mock.calls.find((c) => c[0] === "data")[1];
      const onExit = child.on.mock.calls.find((c) => c[0] === "exit")[1];

      onStdout("warming up\n");
      expect(launchHandler).not.toHaveBeenCalled();
      onStdout(Buffer.from("Gateway listening on ws://127.0.0.1:18789\n"));
      expect(launchHandler).toHaveBeenCalledWith(
        expect.objectContaining({ pid: 1234 }),
      );
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Gateway launch handler error: launch-boom"),
      );
      onStdout(Buffer.from("still listening on the same port\n"));
      expect(launchHandler).toHaveBeenCalledTimes(1);

      onStderr(Buffer.from("first error\n\n"));
      onStderr(Array.from({ length: 60 }, (_, i) => `line-${i}`).join("\n"));

      onExit(1, "SIGKILL");
      expect(exitHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 1,
          signal: "SIGKILL",
          expectedExit: false,
        }),
      );
      expect(exitHandler.mock.calls[0][0].stderrTail).toHaveLength(50);
      expect(exitHandler.mock.calls[0][0].stderrTail).toContain("line-59");
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Gateway exit handler error: exit-boom"),
      );
      gateway.setGatewayLaunchHandler(null);
      gateway.setGatewayExitHandler(null);
    });

    it("runs force restart via runGatewayCmd and logs supervisor output", async () => {
      const supervisor = createChild();
      childProcess.spawn = vi.fn(() => supervisor);
      childProcess.execSync = vi.fn(() => "");
      fs.existsSync = vi.fn(() => false);
      net.createConnection = vi.fn(() => createSocket(true));
      delete require.cache[modulePath];
      const gateway = require(modulePath);
      vi.spyOn(process.stdout, "write").mockImplementation(() => true);
      vi.spyOn(process.stderr, "write").mockImplementation(() => true);
      const launchHandler = vi.fn();
      gateway.setGatewayLaunchHandler(launchHandler);

      await gateway.runGatewayCmd("--force");

      expect(childProcess.spawn).toHaveBeenCalledWith(
        "openclaw",
        ["gateway", "--force"],
        expect.objectContaining({ env: expect.any(Object) }),
      );
      expect(launchHandler).toHaveBeenCalledWith(
        expect.objectContaining({ pid: null }),
      );

      const onStdout = supervisor.stdout.on.mock.calls.find((c) => c[0] === "data")[1];
      const onStderr = supervisor.stderr.on.mock.calls.find((c) => c[0] === "data")[1];
      const onExit = supervisor.on.mock.calls.find((c) => c[0] === "exit")[1];
      onStdout(Buffer.from("supervisor out\n"));
      onStderr("supervisor err\n");
      onExit(0, null);
      onExit(null, "SIGTERM");
      gateway.setGatewayLaunchHandler(null);
    });

    it("logs execSync output and failures for short gateway commands", async () => {
      const behaviors = [
        () => "gateway stopped\n",
        () => {
          const error = new Error("exec failed");
          error.stdout = "some stdout";
          error.stderr = "some stderr";
          error.status = 7;
          throw error;
        },
        () => {
          throw new Error("plain failure");
        },
      ];
      childProcess.execSync = vi.fn(() => behaviors.shift()());
      delete require.cache[modulePath];
      const gateway = require(modulePath);
      const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      await gateway.runGatewayCmd("stop");
      await gateway.runGatewayCmd("stop");
      await gateway.runGatewayCmd("stop");

      expect(logSpy).toHaveBeenCalledWith("[alphaclaw] gateway stopped");
      expect(logSpy).toHaveBeenCalledWith(
        "[alphaclaw] gateway stop stdout: some stdout",
      );
      expect(logSpy).toHaveBeenCalledWith(
        "[alphaclaw] gateway stop stderr: some stderr",
      );
      expect(logSpy).toHaveBeenCalledWith("[alphaclaw] gateway stop exit code: 7");
      expect(logSpy).toHaveBeenCalledWith(
        "[alphaclaw] gateway stop error: plain failure",
      );
    });

    it("attaches signal handlers that stop the gateway and exit", () => {
      childProcess.execSync = vi.fn(() => "");
      delete require.cache[modulePath];
      const gateway = require(modulePath);
      const onSpy = vi.spyOn(process, "on").mockImplementation(() => process);
      const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => undefined);

      gateway.attachGatewaySignalHandlers();

      const sigterm = onSpy.mock.calls.find((c) => c[0] === "SIGTERM")[1];
      const sigint = onSpy.mock.calls.find((c) => c[0] === "SIGINT")[1];
      sigterm();
      sigint();

      expect(exitSpy).toHaveBeenCalledTimes(2);
      expect(exitSpy).toHaveBeenCalledWith(0);
      expect(childProcess.execSync).toHaveBeenCalledWith(
        "openclaw gateway stop",
        expect.objectContaining({ encoding: "utf8" }),
      );
      onSpy.mockRestore();
      exitSpy.mockRestore();
    });

    it("uses lifecycle restart for light restarts while the gateway is up", async () => {
      const execSyncMock = vi
        .fn()
        .mockReturnValueOnce("restarted ok\n")
        .mockImplementationOnce(() => {
          const error = new Error("restart failed");
          error.stderr = "restart failed hard";
          throw error;
        });
      childProcess.execSync = execSyncMock;
      net.createConnection = vi.fn(() => createSocket(true));
      delete require.cache[modulePath];
      const gateway = require(modulePath);
      const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const reloadEnv = vi.fn();

      await gateway.restartGatewayLight(reloadEnv);
      await gateway.restartGatewayLight(reloadEnv);

      expect(reloadEnv).toHaveBeenCalledTimes(2);
      expect(execSyncMock).toHaveBeenCalledWith(
        "openclaw gateway restart",
        expect.objectContaining({ timeout: 90000 }),
      );
      expect(logSpy).toHaveBeenCalledWith(
        "[alphaclaw] Gateway light restart complete",
      );
      expect(warnSpy).toHaveBeenCalledWith("[alphaclaw] Gateway light restart failed");
    });

    it("launches a managed process for light restarts when nothing is running", async () => {
      const child = createChild();
      childProcess.spawn = vi.fn(() => child);
      childProcess.execSync = vi.fn(() => "");
      fs.existsSync = vi.fn(() => false);
      net.createConnection = vi.fn(() => createSocket(false));
      delete require.cache[modulePath];
      const gateway = require(modulePath);

      await gateway.restartGatewayLight(vi.fn());
      expect(childProcess.spawn).toHaveBeenCalledTimes(1);

      // The managed child is still active, so a second light restart is a no-op.
      await gateway.restartGatewayLight(vi.fn());
      expect(childProcess.spawn).toHaveBeenCalledTimes(1);
    });

    it("stops the supervisor when a restart never becomes ready", async () => {
      vi.useFakeTimers();
      try {
        const supervisor = createChild();
        childProcess.spawn = vi.fn(() => supervisor);
        childProcess.execSync = vi.fn(() => "");
        fs.existsSync = vi.fn(() => false);
        net.createConnection = vi.fn(() => ({
          setTimeout: vi.fn(),
          destroy: vi.fn(),
          on(event, handler) {
            if (event === "timeout") handler();
            return this;
          },
        }));
        delete require.cache[modulePath];
        const gateway = require(modulePath);
        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

        const pending = gateway.runGatewayCmd("--force");
        await vi.advanceTimersByTimeAsync(121000);
        await pending;

        expect(supervisor.kill).toHaveBeenCalledWith("SIGTERM");
        expect(childProcess.execSync).toHaveBeenCalledWith(
          "openclaw gateway stop",
          expect.anything(),
        );
        expect(warnSpy).toHaveBeenCalledWith(
          expect.stringContaining("did not become ready"),
        );
      } finally {
        vi.useRealTimers();
      }
    });

    it("notifies the launch handler when the gateway is already running", async () => {
      const child = createChild();
      childProcess.spawn = vi.fn(() => child);
      childProcess.execSync = vi.fn(() => "");
      fs.existsSync = vi.fn((targetPath) => targetPath === kOnboardingMarkerPath);
      let running = false;
      net.createConnection = vi.fn(() => createSocket(() => running));
      delete require.cache[modulePath];
      const gateway = require(modulePath);

      await gateway.startGateway();
      expect(childProcess.spawn).toHaveBeenCalledTimes(1);

      running = true;
      const launchHandler = vi.fn();
      gateway.setGatewayLaunchHandler(launchHandler);
      await gateway.startGateway();
      expect(childProcess.spawn).toHaveBeenCalledTimes(1);
      expect(launchHandler).toHaveBeenCalledWith(
        expect.objectContaining({ pid: 1234 }),
      );

      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      gateway.setGatewayLaunchHandler(() => {
        throw new Error("notify-boom");
      });
      await gateway.startGateway();
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Gateway launch handler error: notify-boom"),
      );
      gateway.setGatewayLaunchHandler(null);
    });

    it("skips the launch notification when the gateway flaps back down", async () => {
      const supervisor = createChild();
      childProcess.spawn = vi.fn(() => supervisor);
      childProcess.execSync = vi.fn(() => "");
      fs.existsSync = vi.fn(() => false);
      let connectionAttempts = 0;
      net.createConnection = vi.fn(() =>
        createSocket(() => {
          connectionAttempts += 1;
          return connectionAttempts === 1;
        }),
      );
      delete require.cache[modulePath];
      const gateway = require(modulePath);
      const launchHandler = vi.fn();
      gateway.setGatewayLaunchHandler(launchHandler);

      await gateway.runGatewayCmd("--force");

      expect(launchHandler).not.toHaveBeenCalled();
      gateway.setGatewayLaunchHandler(null);
    });

    it("skips gateway start when not onboarded", async () => {
      childProcess.spawn = vi.fn();
      fs.existsSync = vi.fn(() => false);
      delete require.cache[modulePath];
      const gateway = require(modulePath);

      await gateway.startGateway();

      expect(childProcess.spawn).not.toHaveBeenCalled();
    });
  });

  describe("gateway config edge cases", () => {
    it("returns zero when the plugin extensions dir cannot be read", () => {
      fs.readdirSync = vi.fn(() => {
        throw new Error("EACCES");
      });
      delete require.cache[modulePath];
      const gateway = require(modulePath);
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      expect(
        gateway.cleanupOpenclawPluginInstallStages({ extensionsDir: "/tmp/ext" }),
      ).toBe(0);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("Could not clean OpenClaw plugin install stages"),
      );
    });

    it("returns zero when the openclaw package cannot be resolved", () => {
      delete require.cache[modulePath];
      const gateway = require(modulePath);
      fs.readdirSync = vi.fn(() => {
        throw new Error("should not be called");
      });
      const Module = require("module");
      const originalResolve = Module._resolveFilename;
      Module._resolveFilename = function (request, ...rest) {
        if (request === "openclaw") {
          throw new Error("Cannot find module 'openclaw'");
        }
        return originalResolve.call(this, request, ...rest);
      };
      try {
        expect(gateway.cleanupOpenclawPluginInstallStages()).toBe(0);
        expect(fs.readdirSync).not.toHaveBeenCalled();
      } finally {
        Module._resolveFilename = originalResolve;
      }
    });

    it("skips plugin preflight when channel config is unreadable", () => {
      childProcess.execSync = vi.fn();
      fs.existsSync = vi.fn(() => true);
      delete require.cache[modulePath];
      const gateway = require(modulePath);
      fs.readFileSync = vi.fn(() => "not json");

      gateway.prepareOpenclawChannelPlugins();

      expect(childProcess.execSync).not.toHaveBeenCalled();
    });

    it("warns when plugin preflight fails for non-install-stage reasons", () => {
      childProcess.execSync = vi.fn(() => {
        const error = new Error("EAI_AGAIN registry.npmjs.org");
        error.stderr = "network down";
        throw error;
      });
      fs.existsSync = vi.fn(
        (targetPath) => targetPath === `${OPENCLAW_DIR}/openclaw.json`,
      );
      delete require.cache[modulePath];
      const gateway = require(modulePath);
      fs.readFileSync = vi.fn(() =>
        JSON.stringify({ channels: { telegram: { enabled: true } } }),
      );
      fs.readdirSync = vi.fn(() => []);
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      gateway.prepareOpenclawChannelPlugins();

      expect(childProcess.execSync).toHaveBeenCalledTimes(1);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("OpenClaw plugin preflight failed"),
      );
    });

    it("warns when the plugin preflight retry also fails", () => {
      childProcess.execSync = vi.fn(() => {
        throw new Error(
          "ENOTEMPTY: directory not empty, rmdir '.openclaw-install-stage'",
        );
      });
      fs.existsSync = vi.fn(
        (targetPath) => targetPath === `${OPENCLAW_DIR}/openclaw.json`,
      );
      delete require.cache[modulePath];
      const gateway = require(modulePath);
      fs.readFileSync = vi.fn(() =>
        JSON.stringify({ channels: { telegram: { enabled: true } } }),
      );
      fs.readdirSync = vi.fn(() => []);
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      gateway.prepareOpenclawChannelPlugins();

      expect(childProcess.execSync).toHaveBeenCalledTimes(2);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("OpenClaw plugin preflight retry failed"),
      );
    });

    it("falls back to the default gateway port when config is unreadable", () => {
      fs.existsSync = vi.fn(() => true);
      delete require.cache[modulePath];
      const gateway = require(modulePath);
      fs.readFileSync = vi
        .fn()
        .mockImplementationOnce(() => {
          throw new Error("EIO");
        })
        .mockImplementationOnce(() =>
          JSON.stringify({ gateway: { port: 23456 } }),
        )
        .mockImplementationOnce(() => JSON.stringify({ gateway: {} }));

      expect(gateway.getGatewayPort()).toBe(kDefaultGatewayPort);
      expect(gateway.getGatewayPort()).toBe(23456);
      expect(gateway.getGatewayPort()).toBe(kDefaultGatewayPort);
    });

    it("returns false when ensureGatewayProxyConfig cannot read the config", () => {
      fs.existsSync = vi.fn((targetPath) => targetPath === kOnboardingMarkerPath);
      delete require.cache[modulePath];
      const gateway = require(modulePath);
      fs.readFileSync = vi.fn(() => {
        throw new Error("EIO");
      });
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      expect(gateway.ensureGatewayProxyConfig("https://x.example.com")).toBe(false);
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining("ensureGatewayProxyConfig error: EIO"),
      );
    });

    it("returns an empty channel status when the config is unreadable", () => {
      delete require.cache[modulePath];
      const gateway = require(modulePath);
      fs.readFileSync = vi.fn(() => {
        throw new Error("EIO");
      });

      expect(gateway.getChannelStatus()).toEqual({});
    });
  });

  describe("syncChannelConfig", () => {
    const configPath = `${OPENCLAW_DIR}/openclaw.json`;

    const setupConfig = (initialRaw) => {
      const state = { raw: initialRaw };
      fs.readFileSync = vi.fn((targetPath, ...args) => {
        if (targetPath === configPath) return state.raw;
        return originalReadFileSync(targetPath, ...args);
      });
      fs.writeFileSync = vi.fn((targetPath, contents) => {
        if (targetPath === configPath) state.raw = contents;
      });
      return state;
    };

    it("adds a telegram channel and scrubs the token into an env placeholder", () => {
      const state = setupConfig(JSON.stringify({ channels: {} }));
      childProcess.execSync = vi.fn(() => {
        state.raw = JSON.stringify({
          channels: { telegram: { enabled: true, botToken: "tg-secret" } },
        });
        return "";
      });
      delete require.cache[modulePath];
      const gateway = require(modulePath);

      gateway.syncChannelConfig(
        [
          { key: "TELEGRAM_BOT_TOKEN", value: "tg-secret" },
          { key: "EMPTY_VALUE", value: "" },
        ],
        "add",
      );

      expect(childProcess.execSync).toHaveBeenCalledWith(
        'openclaw channels add --channel telegram --token "tg-secret"',
        expect.objectContaining({ timeout: 15000, encoding: "utf8" }),
      );
      expect(state.raw).toContain("${TELEGRAM_BOT_TOKEN}");
      expect(state.raw).not.toContain("tg-secret");
    });

    it("adds a slack channel with both tokens and scrubs them", () => {
      const state = setupConfig(JSON.stringify({ channels: {} }));
      childProcess.execSync = vi.fn(() => {
        state.raw = JSON.stringify({
          channels: {
            slack: { enabled: true, botToken: "xoxb-bot", appToken: "xapp-app" },
          },
        });
        return "";
      });
      delete require.cache[modulePath];
      const gateway = require(modulePath);

      gateway.syncChannelConfig(
        [
          { key: "SLACK_BOT_TOKEN", value: "xoxb-bot" },
          { key: "SLACK_APP_TOKEN", value: "xapp-app" },
        ],
        "all",
      );

      expect(childProcess.execSync).toHaveBeenCalledWith(
        'openclaw channels add --channel slack --bot-token "xoxb-bot" --app-token "xapp-app"',
        expect.objectContaining({ timeout: 15000 }),
      );
      expect(state.raw).toContain("${SLACK_BOT_TOKEN}");
      expect(state.raw).toContain("${SLACK_APP_TOKEN}");
      expect(state.raw).not.toContain("xoxb-bot");
      expect(state.raw).not.toContain("xapp-app");
    });

    it("skips slack when the app token is missing", () => {
      setupConfig(JSON.stringify({ channels: {} }));
      childProcess.execSync = vi.fn(() => "");
      delete require.cache[modulePath];
      const gateway = require(modulePath);

      gateway.syncChannelConfig([{ key: "SLACK_BOT_TOKEN", value: "xoxb-bot" }], "add");

      expect(childProcess.execSync).not.toHaveBeenCalled();
    });

    it("logs channel add failures", () => {
      setupConfig(JSON.stringify({ channels: {} }));
      childProcess.execSync = vi.fn(() => {
        const error = new Error("add failed");
        error.stderr = "invalid token";
        throw error;
      });
      delete require.cache[modulePath];
      const gateway = require(modulePath);
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      gateway.syncChannelConfig(
        [{ key: "TELEGRAM_BOT_TOKEN", value: "tg-secret" }],
        "add",
      );

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining("channels add telegram: invalid token"),
      );
    });

    it("removes channels whose tokens were cleared", () => {
      setupConfig(JSON.stringify({ channels: { telegram: { enabled: true } } }));
      childProcess.execSync = vi.fn(() => "");
      delete require.cache[modulePath];
      const gateway = require(modulePath);

      gateway.syncChannelConfig([], "remove");

      expect(childProcess.execSync).toHaveBeenCalledWith(
        "openclaw channels remove --channel telegram --delete",
        expect.objectContaining({ timeout: 15000 }),
      );
    });

    it("logs channel remove failures", () => {
      setupConfig(JSON.stringify({ channels: { telegram: { enabled: true } } }));
      childProcess.execSync = vi.fn(() => {
        throw new Error("remove failed");
      });
      delete require.cache[modulePath];
      const gateway = require(modulePath);
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      gateway.syncChannelConfig([], "all");

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining("channels remove telegram: remove failed"),
      );
    });

    it("logs a sync error when the config cannot be read", () => {
      delete require.cache[modulePath];
      const gateway = require(modulePath);
      fs.readFileSync = vi.fn(() => {
        throw new Error("EIO");
      });
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      gateway.syncChannelConfig([], "all");

      expect(errorSpy).toHaveBeenCalledWith(
        "[alphaclaw] syncChannelConfig error:",
        "EIO",
      );
    });
  });
});
