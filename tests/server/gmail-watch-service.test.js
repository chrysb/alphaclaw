const fsReal = require("fs");
const os = require("os");
const path = require("path");
const { EventEmitter } = require("events");
const childProcess = require("child_process");

// gmail-watch (via gmail-serve) destructures `spawn` at load time, and
// gmail-watch captures createGmailServeManager the same way. Install the
// stubs before (re)loading the modules so the fresh copies pick them up.
const spawnState = { impl: null, calls: [] };
const realSpawn = childProcess.spawn;
childProcess.spawn = (command, args, options) => {
  spawnState.calls.push({ command, args, options });
  return spawnState.impl(command, args, options);
};

const dropModule = (id) => {
  try {
    delete require.cache[require.resolve(id)];
  } catch {}
};
dropModule("../../lib/server/gmail-serve");
dropModule("../../lib/server/gmail-watch");

const gmailServeModule = require("../../lib/server/gmail-serve");
const realCreateGmailServeManager = gmailServeModule.createGmailServeManager;
const serveHooks = { onServeExit: null };
gmailServeModule.createGmailServeManager = (options) => {
  serveHooks.onServeExit = options.onServeExit;
  return realCreateGmailServeManager(options);
};

const {
  createGmailWatchService,
  createTopicNameForClient,
  createSubscriptionNameForClient,
} = require("../../lib/server/gmail-watch");

afterAll(() => {
  childProcess.spawn = realSpawn;
  gmailServeModule.createGmailServeManager = realCreateGmailServeManager;
  dropModule("../../lib/server/gmail-serve");
  dropModule("../../lib/server/gmail-watch");
});

class FakeChild extends EventEmitter {
  constructor({ pid = process.pid } = {}) {
    super();
    this.pid = pid;
    this.killed = false;
    this.stdout = new EventEmitter();
    this.stderr = new EventEmitter();
  }

  kill(signal) {
    this.killed = true;
    this.emit("exit", 0, signal);
    return true;
  }
}

const kFarFuture = () => Date.now() + 7 * 24 * 60 * 60 * 1000;

const baseStateAccount = (overrides = {}) => ({
  id: "acct-1",
  email: "ops@corp.com",
  client: "work",
  personal: false,
  services: ["gmail:read"],
  authenticated: true,
  gmailWatch: {},
  ...overrides,
});

let tmpDirs = [];
const originalWebhookToken = process.env.WEBHOOK_TOKEN;

const createEnv = ({
  state,
  openclawJson = {},
  gogConfig,
  configDir = true,
  envFileVars = [],
  credentials = { projectId: "proj-1" },
  gogCmd,
  constants: constantOverrides = {},
  restartRequiredState,
} = {}) => {
  const root = fsReal.mkdtempSync(path.join(os.tmpdir(), "alphaclaw-gwatch-"));
  tmpDirs.push(root);
  const openclawDir = path.join(root, "openclaw");
  const gogDir = path.join(root, "gog");
  fsReal.mkdirSync(openclawDir, { recursive: true });
  fsReal.mkdirSync(gogDir, { recursive: true });
  const statePath = path.join(gogDir, "state.json");
  const gogConfigPath = path.join(gogDir, "config.json");
  const openclawConfigPath = path.join(openclawDir, "openclaw.json");
  if (state) fsReal.writeFileSync(statePath, JSON.stringify(state, null, 2));
  if (openclawJson !== null) {
    fsReal.writeFileSync(openclawConfigPath, JSON.stringify(openclawJson, null, 2));
  }
  if (gogConfig !== undefined) {
    fsReal.writeFileSync(
      gogConfigPath,
      typeof gogConfig === "string" ? gogConfig : JSON.stringify(gogConfig),
    );
  }

  const flags = { failExistsSync: false, failWriteSync: false };
  const writes = [];
  const fs = {
    existsSync: (p) => {
      if (flags.failExistsSync) throw new Error("existsSync boom");
      return fsReal.existsSync(p);
    },
    readFileSync: (...args) => fsReal.readFileSync(...args),
    writeFileSync: (...args) => {
      if (flags.failWriteSync) throw new Error("write boom");
      writes.push(String(args[0]));
      return fsReal.writeFileSync(...args);
    },
    mkdirSync: (...args) => fsReal.mkdirSync(...args),
    rmSync: (...args) => fsReal.rmSync(...args),
    statSync: (...args) => fsReal.statSync(...args),
  };

  let envVars = envFileVars.map((entry) => ({ ...entry }));
  const readEnvFile = vi.fn(() => envVars.map((entry) => ({ ...entry })));
  const writeEnvFile = vi.fn((next) => {
    envVars = next.map((entry) => ({ ...entry }));
  });
  const reloadEnv = vi.fn();
  const readGoogleCredentials = vi.fn(() => credentials);
  const resolvedGogCmd =
    gogCmd ||
    vi.fn(async () => ({
      ok: true,
      stdout: '{"expiration":"1893456000000"}',
      stderr: "",
    }));
  const markRequired = vi.fn();
  const constants = {
    GOG_STATE_PATH: statePath,
    GOG_CONFIG_DIR: configDir ? gogDir : "",
    OPENCLAW_DIR: openclawDir,
    GOG_KEYRING_PASSWORD: "keyring-pass",
    PORT: 4100,
    kGmailMaxBodyBytes: 20000,
    kGmailServeBasePort: 18801,
    kMaxGoogleAccounts: 5,
    kGmailWatchRenewalThresholdMs: 24 * 60 * 60 * 1000,
    kGmailWatchRenewalIntervalMs: 60 * 60 * 1000,
    ...constantOverrides,
  };
  const service = createGmailWatchService({
    fs,
    constants,
    gogCmd: resolvedGogCmd,
    getBaseUrl: () => "https://alphaclaw.example",
    readGoogleCredentials,
    readEnvFile,
    writeEnvFile,
    reloadEnv,
    restartRequiredState:
      restartRequiredState === undefined ? { markRequired } : restartRequiredState,
  });
  return {
    service,
    onServeExit: serveHooks.onServeExit,
    fs,
    flags,
    writes,
    constants,
    statePath,
    gogConfigPath,
    openclawConfigPath,
    transformPath: path.join(
      openclawDir,
      "hooks/transforms/gmail/gmail-transform.mjs",
    ),
    readEnvFile,
    writeEnvFile,
    reloadEnv,
    readGoogleCredentials,
    gogCmd: resolvedGogCmd,
    markRequired,
    getEnvVars: () => envVars,
    readStateFile: () => JSON.parse(fsReal.readFileSync(statePath, "utf8")),
  };
};

const wiredOpenclawJson = () => ({
  agents: { list: [{ id: "main", default: true }] },
  hooks: {
    enabled: true,
    token: "${WEBHOOK_TOKEN}",
    presets: ["gmail"],
    mappings: [
      {
        id: "gmail",
        match: { path: "gmail" },
        action: "agent",
        name: "Gmail",
        wakeMode: "now",
        deliver: true,
        channel: "last",
        agentId: "main",
        transform: { module: "gmail/gmail-transform.mjs" },
      },
    ],
  },
});

const singleAccountState = (accountOverrides = {}, pushOverrides = {}) => ({
  version: 2,
  accounts: [baseStateAccount(accountOverrides)],
  gmailPush: {
    token: "push-token",
    topics: { work: "projects/proj-1/topics/gog-gmail-watch-work" },
    ...pushOverrides,
  },
});

describe("server/gmail-watch service", () => {
  beforeEach(() => {
    spawnState.calls = [];
    spawnState.impl = () => new FakeChild();
    delete process.env.WEBHOOK_TOKEN;
  });

  afterEach(async () => {
    vi.useRealTimers();
    if (originalWebhookToken === undefined) delete process.env.WEBHOOK_TOKEN;
    else process.env.WEBHOOK_TOKEN = originalWebhookToken;
    for (const dir of tmpDirs) fsReal.rmSync(dir, { recursive: true, force: true });
    tmpDirs = [];
  });

  describe("topic name helpers", () => {
    it("normalizes client names into topic and subscription names", () => {
      expect(createTopicNameForClient()).toBe("gog-gmail-watch");
      expect(createTopicNameForClient("Default")).toBe("gog-gmail-watch");
      expect(createTopicNameForClient(" My Client!! ")).toBe(
        "gog-gmail-watch-my-client",
      );
      expect(createTopicNameForClient("---")).toBe("gog-gmail-watch");
      expect(createSubscriptionNameForClient("work")).toBe(
        "gog-gmail-watch-work-push",
      );
      expect(createSubscriptionNameForClient()).toBe("gog-gmail-watch-push");
    });
  });

  describe("startWatch", () => {
    it("wires hooks, starts the watch, and starts the serve process", async () => {
      const env = createEnv({
        state: {
          version: 2,
          accounts: [baseStateAccount()],
          gmailPush: { token: "", topics: {} },
        },
        openclawJson: { agents: { list: [{ id: "main", default: true }] } },
      });
      const result = await env.service.startWatch({ accountId: "acct-1", req: {} });

      expect(result.ok).toBe(true);
      expect(result.client).toBe("work");
      expect(result.topicPath).toBe(
        "projects/proj-1/topics/gog-gmail-watch-work",
      );
      expect(result.watch).toMatchObject({
        enabled: true,
        port: 18801,
        expiration: 1893456000000,
        pid: process.pid,
      });
      expect(result.serve).toMatchObject({ running: true, pid: process.pid });

      expect(env.readGoogleCredentials).toHaveBeenCalledWith("work");
      expect(env.gogCmd).toHaveBeenCalledWith(
        `--client "work" gmail watch start --json --account "ops@corp.com" ` +
          `--topic "projects/proj-1/topics/gog-gmail-watch-work" --label INBOX`,
        { quiet: true },
      );

      // Webhook token was generated and persisted to the env file.
      const webhookVar = env
        .getEnvVars()
        .find((entry) => entry.key === "WEBHOOK_TOKEN");
      expect(webhookVar?.value).toMatch(/\S/);
      expect(env.writeEnvFile).toHaveBeenCalledTimes(1);
      expect(env.reloadEnv).toHaveBeenCalledTimes(1);
      expect(env.markRequired).toHaveBeenCalledWith("gmail-watch");

      // Hooks preset was written to openclaw.json.
      const cfg = JSON.parse(fsReal.readFileSync(env.openclawConfigPath, "utf8"));
      expect(cfg.hooks.enabled).toBe(true);
      expect(cfg.hooks.token).toBe("${WEBHOOK_TOKEN}");
      expect(cfg.hooks.presets).toContain("gmail");
      const transformSource = fsReal.readFileSync(env.transformPath, "utf8");
      expect(transformSource).toContain("New email from");
      expect(transformSource).not.toContain("channel:");

      // The serve process was spawned once via gog.
      expect(spawnState.calls).toHaveLength(1);
      expect(spawnState.calls[0].command).toBe("gog");

      // Account/client mapping was mirrored into the gog config.
      expect(JSON.parse(fsReal.readFileSync(env.gogConfigPath, "utf8"))).toEqual({
        account_clients: { "ops@corp.com": "work" },
      });

      // Push token + topic were persisted in the state file.
      const savedState = env.readStateFile();
      expect(savedState.gmailPush.token).toMatch(/\S/);
      expect(savedState.gmailPush.topics.work).toBe(
        "projects/proj-1/topics/gog-gmail-watch-work",
      );
      expect(savedState.accounts[0].gmailWatch.enabled).toBe(true);

      // getConfig reflects the running serve.
      const config = env.service.getConfig({ req: {} });
      expect(config.ok).toBe(true);
      expect(config.accounts[0]).toMatchObject({
        accountId: "acct-1",
        client: "work",
        enabled: true,
        port: 18801,
        pid: process.pid,
        running: true,
      });
      expect(env.service.getServeStatus("acct-1").running).toBe(true);
      expect(env.service.resolvePushToken()).toBe(savedState.gmailPush.token);
      expect(env.service.getTargetByEmail("OPS@corp.com")).toEqual({
        accountId: "acct-1",
        port: 18801,
        email: "ops@corp.com",
        client: "work",
      });
    });

    it("rejects unknown accounts and accounts without gmail:read", async () => {
      const env = createEnv({ state: singleAccountState() });
      await expect(
        env.service.startWatch({ accountId: "nope", req: {} }),
      ).rejects.toThrow("Google account not found");

      const noScope = createEnv({
        state: singleAccountState({ services: ["calendar:read"] }),
      });
      await expect(
        noScope.service.startWatch({ accountId: "acct-1", req: {} }),
      ).rejects.toThrow("Account is missing gmail:read permission");
      expect(spawnState.calls).toHaveLength(0);
    });

    it("throws when Google credentials have no project id", async () => {
      process.env.WEBHOOK_TOKEN = "env-token";
      const env = createEnv({
        state: singleAccountState({}, { topics: {} }),
        credentials: {},
      });
      await expect(
        env.service.startWatch({ accountId: "acct-1", req: {} }),
      ).rejects.toThrow('Could not detect GCP project_id for client "work"');
    });

    it("propagates gog watch start failures", async () => {
      process.env.WEBHOOK_TOKEN = "env-token";
      const env = createEnv({
        state: singleAccountState(),
        openclawJson: wiredOpenclawJson(),
        gogCmd: vi.fn(async () => ({ ok: false, stdout: "", stderr: "gog exploded" })),
      });
      await expect(
        env.service.startWatch({ accountId: "acct-1", req: {} }),
      ).rejects.toThrow("gog exploded");

      const silent = createEnv({
        state: singleAccountState(),
        openclawJson: wiredOpenclawJson(),
        gogCmd: vi.fn(async () => ({ ok: false, stdout: "", stderr: "" })),
      });
      await expect(
        silent.service.startWatch({ accountId: "acct-1", req: {} }),
      ).rejects.toThrow("Failed to start Gmail watch");
    });

    it("keeps the existing serve port when one is already assigned", async () => {
      process.env.WEBHOOK_TOKEN = "env-token";
      const env = createEnv({
        state: singleAccountState({
          gmailWatch: { enabled: true, port: 18804 },
        }),
        openclawJson: wiredOpenclawJson(),
      });
      const result = await env.service.startWatch({ accountId: "acct-1", req: {} });
      expect(result.watch.port).toBe(18804);
    });

    it("fails when no serve port can be allocated", async () => {
      process.env.WEBHOOK_TOKEN = "env-token";
      const env = createEnv({
        state: singleAccountState(),
        openclawJson: wiredOpenclawJson(),
        constants: { kMaxGoogleAccounts: 0 },
      });
      await expect(
        env.service.startWatch({ accountId: "acct-1", req: {} }),
      ).rejects.toThrow("No available Gmail watch serve ports");
    });

    it.each([
      ["noisy output", 'Watch started\n{"expiration": "1893456000000"}\nbye', 1893456000000],
      ["regex fallback", 'log "expiration": "1893456000123" trailing', 1893456000123],
      ["invalid expiration", '{"expiration":"soon"}', null],
      ["missing expiration", "done", null],
    ])("parses the watch expiration from %s", async (_label, stdout, expected) => {
      process.env.WEBHOOK_TOKEN = "env-token";
      const env = createEnv({
        state: singleAccountState(),
        openclawJson: wiredOpenclawJson(),
        gogCmd: vi.fn(async () => ({ ok: true, stdout, stderr: "" })),
      });
      const result = await env.service.startWatch({ accountId: "acct-1", req: {} });
      expect(result.watch.expiration).toBe(expected);
    });
  });

  describe("hook wiring", () => {
    it("reuses the WEBHOOK_TOKEN from the environment without changes", () => {
      process.env.WEBHOOK_TOKEN = "env-token";
      const env = createEnv({
        state: singleAccountState(),
        openclawJson: wiredOpenclawJson(),
      });
      fsReal.mkdirSync(path.dirname(env.transformPath), { recursive: true });
      fsReal.writeFileSync(env.transformPath, "export default async () => ({});\n");
      const result = env.service.ensureHookWiring();
      expect(result).toEqual({ webhookToken: "env-token", changed: false });
      expect(env.writeEnvFile).not.toHaveBeenCalled();
      expect(env.markRequired).not.toHaveBeenCalled();
    });

    it("loads the WEBHOOK_TOKEN from the env file when unset", () => {
      const env = createEnv({
        state: singleAccountState(),
        openclawJson: wiredOpenclawJson(),
        envFileVars: [{ key: "WEBHOOK_TOKEN", value: "file-token" }],
      });
      const result = env.service.ensureHookWiring();
      expect(result.webhookToken).toBe("file-token");
      expect(process.env.WEBHOOK_TOKEN).toBe("file-token");
      expect(env.writeEnvFile).not.toHaveBeenCalled();
    });

    it("repairs incomplete hook configs and swallows restart marker errors", () => {
      process.env.WEBHOOK_TOKEN = "env-token";
      const env = createEnv({
        state: singleAccountState(),
        openclawJson: {
          agents: { list: [{ id: "main", default: true }] },
          hooks: { enabled: false, token: "   ", presets: ["other"], mappings: [] },
        },
        restartRequiredState: {
          markRequired: () => {
            throw new Error("marker boom");
          },
        },
      });
      const result = env.service.ensureHookWiring();
      expect(result.changed).toBe(true);
      const cfg = JSON.parse(fsReal.readFileSync(env.openclawConfigPath, "utf8"));
      expect(cfg.hooks.enabled).toBe(true);
      expect(cfg.hooks.token).toBe("${WEBHOOK_TOKEN}");
      expect(cfg.hooks.presets).toEqual(["other", "gmail"]);
    });

    it("replaces non-object hooks roots", () => {
      process.env.WEBHOOK_TOKEN = "env-token";
      const env = createEnv({
        state: singleAccountState(),
        openclawJson: {
          agents: { list: [{ id: "main", default: true }] },
          hooks: "broken",
        },
      });
      const result = env.service.ensureHookWiring();
      expect(result.changed).toBe(true);
      const cfg = JSON.parse(fsReal.readFileSync(env.openclawConfigPath, "utf8"));
      expect(cfg.hooks.enabled).toBe(true);
      expect(Array.isArray(cfg.hooks.presets)).toBe(true);
    });

    it("requires openclaw.json to exist", () => {
      process.env.WEBHOOK_TOKEN = "env-token";
      const env = createEnv({
        state: singleAccountState(),
        openclawJson: null,
      });
      expect(() => env.service.ensureHookWiring()).toThrow(
        "openclaw.json not found. Complete onboarding first.",
      );
    });

    it("writes destination-aware transforms", () => {
      process.env.WEBHOOK_TOKEN = "env-token";
      const env = createEnv({
        state: singleAccountState(),
        openclawJson: { agents: { list: [{ id: "main", default: true }] } },
      });
      env.service.ensureHookWiring({
        destination: { channel: "telegram", to: "-100123", agentId: "main" },
      });
      const source = fsReal.readFileSync(env.transformPath, "utf8");
      expect(source).toContain('channel: "telegram"');
      expect(source).toContain('to: "-100123"');
      expect(source).toContain('agentId: "main"');
    });

    it("writes destinations without an agent id", () => {
      process.env.WEBHOOK_TOKEN = "env-token";
      const env = createEnv({
        state: singleAccountState(),
        openclawJson: { agents: { list: [{ id: "main", default: true }] } },
      });
      env.service.ensureHookWiring({
        destination: { channel: "telegram", to: "-100123" },
      });
      const source = fsReal.readFileSync(env.transformPath, "utf8");
      expect(source).toContain('channel: "telegram"');
      expect(source).not.toContain("agentId");
    });

    it("treats empty destinations as none and rejects partial ones", () => {
      process.env.WEBHOOK_TOKEN = "env-token";
      const env = createEnv({
        state: singleAccountState(),
        openclawJson: { agents: { list: [{ id: "main", default: true }] } },
      });
      env.service.ensureHookWiring({ destination: { channel: "", to: "" } });
      expect(fsReal.readFileSync(env.transformPath, "utf8")).not.toContain(
        "channel:",
      );
      expect(() =>
        env.service.ensureHookWiring({ destination: { channel: "telegram" } }),
      ).toThrow("destination.channel and destination.to are required");
    });
  });

  describe("getConfig and saveClientConfig", () => {
    it("reports unconfigured clients and watch metadata without a serve entry", () => {
      const env = createEnv({
        state: singleAccountState(
          {
            gmailWatch: {
              enabled: true,
              port: 18803,
              pid: 4321,
              expiration: 1893456000000,
              lastPushAt: 1892456000000,
            },
          },
          { topics: {} },
        ),
        credentials: {},
      });
      const config = env.service.getConfig({ req: {} });
      expect(config.clients[0]).toMatchObject({
        client: "work",
        projectId: null,
        topicPath: null,
        topicName: "gog-gmail-watch-work",
        subscriptionName: "gog-gmail-watch-work-push",
        commands: null,
        configured: false,
      });
      expect(config.accounts[0]).toMatchObject({
        enabled: true,
        port: 18803,
        pid: 4321,
        running: false,
        expiration: 1893456000000,
        lastPushAt: 1892456000000,
      });
    });

    it("derives the project id from an existing topic path", () => {
      const env = createEnv({
        state: singleAccountState(),
        credentials: {},
      });
      const config = env.service.getConfig({ req: {} });
      expect(config.clients[0]).toMatchObject({
        client: "work",
        projectId: "proj-1",
        configured: true,
      });
      expect(config.clients[0].commands.createTopic).toContain(
        "gcloud --project proj-1 pubsub topics create gog-gmail-watch-work",
      );
      expect(config.pushEndpoint).toContain(
        "https://alphaclaw.example/gmail-pubsub?token=",
      );
    });

    it("stores explicit topic paths from the request body", () => {
      const env = createEnv({ state: singleAccountState() });
      const result = env.service.saveClientConfig({
        req: {},
        body: {
          client: "work",
          topicPath: "projects/other/topics/custom-topic",
        },
      });
      expect(result.ok).toBe(true);
      expect(result.topicPath).toBe("projects/other/topics/custom-topic");
      expect(env.readStateFile().gmailPush.topics.work).toBe(
        "projects/other/topics/custom-topic",
      );
    });

    it("regenerates the push token on request", () => {
      const env = createEnv({ state: singleAccountState() });
      const result = env.service.saveClientConfig({
        req: {},
        body: { client: "work", regeneratePushToken: true },
      });
      expect(result.pushToken).toMatch(/\S/);
      expect(result.pushToken).not.toBe("push-token");
    });

    it("keeps the existing topic when no override is requested", () => {
      const env = createEnv({ state: singleAccountState() });
      const result = env.service.saveClientConfig({
        req: {},
        body: { client: "work" },
      });
      expect(result.topicPath).toBe(
        "projects/proj-1/topics/gog-gmail-watch-work",
      );
      expect(env.readStateFile().gmailPush.topics.work).toBe(
        "projects/proj-1/topics/gog-gmail-watch-work",
      );
    });

    it("fails to save configs when the project id cannot be detected", () => {
      const env = createEnv({
        state: singleAccountState({}, { topics: {} }),
        credentials: null,
      });
      expect(() =>
        env.service.saveClientConfig({ req: {}, body: { client: "work" } }),
      ).toThrow('Could not detect GCP project_id for client "work"');
    });
  });

  describe("stopWatch", () => {
    it("skips unknown accounts", async () => {
      const env = createEnv({ state: singleAccountState() });
      await expect(env.service.stopWatch({ accountId: "ghost" })).resolves.toEqual({
        ok: true,
        accountId: "ghost",
        skipped: true,
      });
    });

    it("stops the watch and disables the account", async () => {
      const env = createEnv({
        state: singleAccountState({
          gmailWatch: { enabled: true, port: 18801, pid: 4242 },
        }),
      });
      const result = await env.service.stopWatch({ accountId: "acct-1" });
      expect(result.ok).toBe(true);
      expect(result.watch).toMatchObject({ enabled: false, pid: null, port: null });
      expect(env.gogCmd).toHaveBeenCalledWith(
        '--client "work" gmail watch stop --account "ops@corp.com" --force',
        { quiet: true },
      );
      expect(env.readStateFile().accounts[0].gmailWatch.enabled).toBe(false);
    });

    it("logs a warning when gog fails to stop the watch", async () => {
      const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      const env = createEnv({
        state: singleAccountState(),
        gogCmd: vi.fn(async () => ({ ok: false, stdout: "", stderr: "stop failed" })),
      });
      await env.service.stopWatch({ accountId: "acct-1" });
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining("Gmail watch stop warning (ops@corp.com): stop failed"),
      );

      const silent = createEnv({
        state: singleAccountState(),
        gogCmd: vi.fn(async () => ({ ok: false, stdout: "", stderr: "" })),
      });
      await silent.service.stopWatch({ accountId: "acct-1" });
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("unknown"));
    });
  });

  describe("renewWatch", () => {
    it("returns empty results for unknown explicit accounts", async () => {
      const env = createEnv({ state: singleAccountState() });
      await expect(env.service.renewWatch({ accountId: "ghost" })).resolves.toEqual({
        ok: true,
        results: [],
      });
    });

    it("skips accounts that are not due for renewal", async () => {
      const env = createEnv({
        state: singleAccountState({
          gmailWatch: { enabled: true, port: 18801, expiration: kFarFuture() },
        }),
      });
      await expect(env.service.renewWatch({})).resolves.toEqual({
        ok: true,
        results: [{ accountId: "acct-1", skipped: true, reason: "not_due" }],
      });
    });

    it("renews accounts that are due and forces renewals on demand", async () => {
      process.env.WEBHOOK_TOKEN = "env-token";
      const env = createEnv({
        state: singleAccountState({
          gmailWatch: { enabled: true, port: 18801, expiration: kFarFuture() },
        }),
        openclawJson: wiredOpenclawJson(),
      });
      const forced = await env.service.renewWatch({ accountId: "acct-1", force: true });
      expect(forced.results).toEqual([
        { accountId: "acct-1", renewed: true, expiration: 1893456000000 },
      ]);

      const due = createEnv({
        state: singleAccountState({
          gmailWatch: { enabled: true, port: 18801 },
        }),
        openclawJson: wiredOpenclawJson(),
      });
      process.env.WEBHOOK_TOKEN = "env-token";
      const result = await due.service.renewWatch({});
      expect(result.results[0]).toMatchObject({ renewed: true });
    });

    it("captures renewal failures per account", async () => {
      process.env.WEBHOOK_TOKEN = "env-token";
      const env = createEnv({
        state: singleAccountState({
          services: ["calendar:read"],
          gmailWatch: { enabled: true, port: 18801 },
        }),
      });
      const result = await env.service.renewWatch({});
      expect(result.results).toEqual([
        {
          accountId: "acct-1",
          renewed: false,
          error: "Account is missing gmail:read permission",
        },
      ]);
    });

    it("falls back to a generic error label for empty messages", async () => {
      process.env.WEBHOOK_TOKEN = "env-token";
      const env = createEnv({
        state: singleAccountState({
          gmailWatch: { enabled: true, port: 18801 },
        }),
        openclawJson: wiredOpenclawJson(),
        gogCmd: vi.fn(async () => {
          throw new Error("");
        }),
      });
      const result = await env.service.renewWatch({ force: true });
      expect(result.results).toEqual([
        { accountId: "acct-1", renewed: false, error: "renew_failed" },
      ]);
    });
  });

  describe("start/stop lifecycle", () => {
    it("restores serve processes on boot and schedules renewals", async () => {
      vi.useFakeTimers();
      process.env.WEBHOOK_TOKEN = "env-token";
      const env = createEnv({
        state: {
          version: 2,
          accounts: [
            baseStateAccount({
              gmailWatch: {
                enabled: true,
                port: 18801,
                expiration: kFarFuture(),
              },
            }),
            baseStateAccount({
              id: "acct-2",
              email: "two@corp.com",
              gmailWatch: { enabled: true, expiration: kFarFuture() },
            }),
            baseStateAccount({ id: "acct-3", email: "three@corp.com" }),
          ],
          gmailPush: {
            token: "push-token",
            topics: { work: "projects/proj-1/topics/gog-gmail-watch-work" },
          },
        },
        openclawJson: wiredOpenclawJson(),
      });
      env.service.start();
      await vi.advanceTimersByTimeAsync(1);
      expect(spawnState.calls).toHaveLength(1);
      expect(env.readStateFile().accounts[0].gmailWatch.pid).toBe(process.pid);

      // Restarting swaps the renewal timer without spawning a second serve.
      env.service.start();
      await vi.advanceTimersByTimeAsync(1);
      expect(spawnState.calls).toHaveLength(1);

      await env.service.stop();
    });

    it("skips serve restoration when no webhook token is available", async () => {
      vi.useFakeTimers();
      const env = createEnv({
        state: singleAccountState({
          gmailWatch: { enabled: true, port: 18801, expiration: kFarFuture() },
        }),
      });
      env.service.start();
      await vi.advanceTimersByTimeAsync(1);
      expect(spawnState.calls).toHaveLength(0);
      await env.service.stop();
    });

    it("logs serve restoration failures and keeps booting", async () => {
      vi.useFakeTimers();
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      process.env.WEBHOOK_TOKEN = "env-token";
      spawnState.impl = () => {
        throw new Error("spawn boom");
      };
      const env = createEnv({
        state: singleAccountState({
          gmailWatch: { enabled: true, port: 18801, expiration: kFarFuture() },
        }),
      });
      env.service.start();
      await vi.advanceTimersByTimeAsync(1);
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Failed to restore Gmail serve for ops@corp.com"),
      );
      await env.service.stop();
    });

    it("logs renewal errors raised by the interval runner", async () => {
      vi.useFakeTimers();
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      process.env.WEBHOOK_TOKEN = "env-token";
      const env = createEnv({
        state: singleAccountState({
          gmailWatch: { enabled: true, port: 18801, expiration: kFarFuture() },
        }),
      });
      env.service.start();
      await vi.advanceTimersByTimeAsync(1);
      env.flags.failExistsSync = true;
      await vi.advanceTimersByTimeAsync(env.constants.kGmailWatchRenewalIntervalMs);
      expect(errorSpy).toHaveBeenCalledWith(
        "[alphaclaw] Gmail watch renewal error:",
        expect.any(Error),
      );
      env.flags.failExistsSync = false;
      await env.service.stop();
    });

    it("logs bootstrap failures", async () => {
      vi.useFakeTimers();
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const env = createEnv({
        state: singleAccountState(),
      });
      env.flags.failExistsSync = true;
      env.service.start();
      await vi.advanceTimersByTimeAsync(1);
      expect(errorSpy).toHaveBeenCalledWith(
        "[alphaclaw] Failed to bootstrap Gmail watch services:",
        expect.any(Error),
      );
      env.flags.failExistsSync = false;
      await env.service.stop();
    });

    it("stop is a no-op when the service never started", async () => {
      const env = createEnv({ state: singleAccountState() });
      await expect(env.service.stop()).resolves.toBeUndefined();
    });
  });

  describe("serve auto-restart", () => {
    it("ignores exit payloads without an account id", async () => {
      vi.useFakeTimers();
      const env = createEnv({ state: singleAccountState() });
      env.onServeExit({});
      expect(vi.getTimerCount()).toBe(0);
    });

    it("restarts the serve process after an unexpected exit", async () => {
      vi.useFakeTimers();
      process.env.WEBHOOK_TOKEN = "env-token";
      const env = createEnv({
        state: singleAccountState({
          gmailWatch: { enabled: true, port: 18801 },
        }),
      });
      env.onServeExit({ accountId: "acct-1" });
      expect(vi.getTimerCount()).toBe(1);
      await vi.advanceTimersByTimeAsync(5000);
      expect(spawnState.calls).toHaveLength(1);
      expect(env.readStateFile().accounts[0].gmailWatch.pid).toBe(process.pid);
    });

    it("does not restart when the account is missing or the watch is off", async () => {
      vi.useFakeTimers();
      process.env.WEBHOOK_TOKEN = "env-token";
      const env = createEnv({
        state: singleAccountState({ gmailWatch: { enabled: false } }),
      });
      env.onServeExit({ accountId: "ghost" });
      await vi.advanceTimersByTimeAsync(5000);
      env.onServeExit({ accountId: "acct-1" });
      await vi.advanceTimersByTimeAsync(5000);
      expect(spawnState.calls).toHaveLength(0);
    });

    it("does not restart without a webhook token", async () => {
      vi.useFakeTimers();
      const env = createEnv({
        state: singleAccountState({
          gmailWatch: { enabled: true, port: 18801 },
        }),
      });
      env.onServeExit({ accountId: "acct-1" });
      await vi.advanceTimersByTimeAsync(5000);
      expect(spawnState.calls).toHaveLength(0);
    });

    it("logs auto-restart failures", async () => {
      vi.useFakeTimers();
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      process.env.WEBHOOK_TOKEN = "env-token";
      spawnState.impl = () => {
        throw new Error("spawn boom");
      };
      const env = createEnv({
        state: singleAccountState({
          gmailWatch: { enabled: true, port: 18801 },
        }),
      });
      env.onServeExit({ accountId: "acct-1" });
      await vi.advanceTimersByTimeAsync(5000);
      expect(errorSpy).toHaveBeenCalledWith(
        "[alphaclaw] Gmail serve auto-restart failed:",
        expect.any(Error),
      );
    });
  });

  describe("push helpers", () => {
    it("returns null targets for unknown or disabled accounts", () => {
      const env = createEnv({
        state: singleAccountState({ gmailWatch: { enabled: false } }),
      });
      expect(env.service.getTargetByEmail("ghost@corp.com")).toBeNull();
      expect(env.service.getTargetByEmail("ops@corp.com")).toBeNull();
    });

    it("records push receipts with and without explicit timestamps", () => {
      const env = createEnv({
        state: singleAccountState({
          gmailWatch: { enabled: true, port: 18801 },
        }),
      });
      env.service.markPushReceived({ accountId: "acct-1", at: 1234 });
      expect(env.readStateFile().accounts[0].gmailWatch.lastPushAt).toBe(1234);
      env.service.markPushReceived({ accountId: "acct-1" });
      expect(
        env.readStateFile().accounts[0].gmailWatch.lastPushAt,
      ).toBeGreaterThan(1234);
    });
  });

  describe("gog account/client mappings", () => {
    it("skips mapping maintenance when no config dir is set", () => {
      const env = createEnv({ state: singleAccountState(), configDir: false });
      env.service.getConfig({ req: {} });
      expect(fsReal.existsSync(env.gogConfigPath)).toBe(false);
    });

    it("merges account clients into an existing config", () => {
      const env = createEnv({
        state: singleAccountState(),
        gogConfig: {
          keep: true,
          account_clients: { "old@corp.com": "legacy" },
        },
      });
      env.service.getConfig({ req: {} });
      expect(JSON.parse(fsReal.readFileSync(env.gogConfigPath, "utf8"))).toEqual({
        keep: true,
        account_clients: {
          "old@corp.com": "legacy",
          "ops@corp.com": "work",
        },
      });
    });

    it("recovers from malformed or non-object configs", () => {
      const malformed = createEnv({
        state: singleAccountState(),
        gogConfig: "{not json",
      });
      malformed.service.getConfig({ req: {} });
      expect(
        JSON.parse(fsReal.readFileSync(malformed.gogConfigPath, "utf8")),
      ).toEqual({ account_clients: { "ops@corp.com": "work" } });

      const arrayClients = createEnv({
        state: singleAccountState(),
        gogConfig: { account_clients: ["nope"] },
      });
      arrayClients.service.getConfig({ req: {} });
      expect(
        JSON.parse(fsReal.readFileSync(arrayClients.gogConfigPath, "utf8"))
          .account_clients,
      ).toEqual({ "ops@corp.com": "work" });

      const empty = createEnv({
        state: singleAccountState(),
        gogConfig: "   ",
      });
      empty.service.getConfig({ req: {} });
      expect(
        JSON.parse(fsReal.readFileSync(empty.gogConfigPath, "utf8"))
          .account_clients,
      ).toEqual({ "ops@corp.com": "work" });
    });

    it("skips accounts without an email and avoids redundant writes", () => {
      const env = createEnv({
        state: {
          version: 2,
          accounts: [
            baseStateAccount(),
            baseStateAccount({ id: "acct-2", email: "" }),
          ],
          gmailPush: { token: "push-token", topics: {} },
        },
      });
      env.service.getConfig({ req: {} });
      const mapped = JSON.parse(fsReal.readFileSync(env.gogConfigPath, "utf8"));
      expect(mapped.account_clients).toEqual({ "ops@corp.com": "work" });

      const configWrites = () =>
        env.writes.filter((file) => file === env.gogConfigPath).length;
      const before = configWrites();
      env.service.getConfig({ req: {} });
      expect(configWrites()).toBe(before);
    });
  });
});
