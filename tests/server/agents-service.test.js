const { createAgentsService } = require("../../lib/server/agents/service");

const buildFsMock = ({ initialConfig = {}, fileContents = {} } = {}) => {
  let currentConfig = JSON.parse(JSON.stringify(initialConfig));
  const files = new Set();
  const directories = new Set();
  const extraFiles = new Map(Object.entries(fileContents));
  return {
    existsSync: vi.fn(
      (targetPath) => files.has(targetPath) || directories.has(targetPath),
    ),
    mkdirSync: vi.fn((targetPath) => {
      directories.add(targetPath);
    }),
    rmSync: vi.fn(),
    readdirSync: vi.fn((targetPath) => {
      const normalizedTargetPath = String(targetPath || "");
      const prefix = normalizedTargetPath.endsWith("/")
        ? normalizedTargetPath
        : `${normalizedTargetPath}/`;
      return Array.from(extraFiles.keys())
        .filter((filePath) => filePath.startsWith(prefix))
        .map((filePath) => filePath.slice(prefix.length))
        .filter((fileName) => fileName && !fileName.includes("/"));
    }),
    readFileSync: vi.fn((targetPath) => {
      const normalizedTargetPath = String(targetPath || "");
      if (normalizedTargetPath.endsWith("openclaw.json")) {
        return JSON.stringify(currentConfig);
      }
      if (extraFiles.has(normalizedTargetPath)) {
        return String(extraFiles.get(normalizedTargetPath));
      }
      return JSON.stringify(currentConfig);
    }),
    writeFileSync: vi.fn((targetPath, content) => {
      if (String(targetPath || "").endsWith("openclaw.json")) {
        currentConfig = JSON.parse(String(content || "{}"));
        return;
      }
      files.add(targetPath);
      extraFiles.set(String(targetPath || ""), String(content || ""));
    }),
    readConfig: () => currentConfig,
  };
};

describe("server/agents/service", () => {
  it("creates an agent without replacing implicit main agent", () => {
    const fsMock = buildFsMock({
      initialConfig: {
        agents: {
          defaults: {
            model: {
              primary: "anthropic/claude-sonnet-4-6",
            },
          },
        },
      },
    });
    const service = createAgentsService({
      fs: fsMock,
      OPENCLAW_DIR: "/tmp/openclaw",
    });

    service.createAgent({ id: "ops", name: "Ops Agent" });
    const agents = service.listAgents();

    expect(agents.map((entry) => entry.id)).toEqual(["main", "ops"]);
    expect(agents.find((entry) => entry.id === "main")?.default).toBe(true);
    expect(agents.find((entry) => entry.id === "ops")?.default).toBe(false);
  });

  it("sets a new default agent and unsets others", () => {
    const fsMock = buildFsMock({
      initialConfig: {
        agents: {
          list: [
            { id: "main", name: "Main", default: true },
            { id: "ops", name: "Ops", default: false },
          ],
        },
      },
    });
    const service = createAgentsService({
      fs: fsMock,
      OPENCLAW_DIR: "/tmp/openclaw",
    });

    service.setDefaultAgent("ops");
    const agents = service.listAgents();
    expect(agents.find((entry) => entry.id === "ops")?.default).toBe(true);
    expect(agents.find((entry) => entry.id === "main")?.default).toBe(false);
  });

  it("creates agent with custom workspace folder", () => {
    const fsMock = buildFsMock({
      initialConfig: {
        agents: {
          list: [{ id: "main", default: true }],
        },
      },
    });
    const service = createAgentsService({
      fs: fsMock,
      OPENCLAW_DIR: "/tmp/openclaw",
    });

    const agent = service.createAgent({
      id: "sales",
      name: "Sales Agent",
      workspaceFolder: "workspace-sales-custom",
    });

    expect(agent.workspace).toBe("/tmp/openclaw/workspace-sales-custom");
  });

  it("removes the agent model key when clearing an override", () => {
    const fsMock = buildFsMock({
      initialConfig: {
        agents: {
          list: [
            {
              id: "main",
              default: true,
              model: {
                primary: "anthropic/claude-sonnet-4-6",
              },
            },
          ],
        },
      },
    });
    const service = createAgentsService({
      fs: fsMock,
      OPENCLAW_DIR: "/tmp/openclaw",
    });

    const updated = service.updateAgent("main", { model: null });
    const config = fsMock.readConfig();

    expect(updated).not.toHaveProperty("model");
    expect(config.agents.list[0]).not.toHaveProperty("model");
  });

  it("persists tools config updates for agents", () => {
    const fsMock = buildFsMock({
      initialConfig: {
        agents: {
          list: [
            {
              id: "main",
              default: true,
              tools: {
                profile: "full",
              },
            },
          ],
        },
      },
    });
    const service = createAgentsService({
      fs: fsMock,
      OPENCLAW_DIR: "/tmp/openclaw",
    });

    const updated = service.updateAgent("main", {
      tools: {
        profile: "minimal",
        alsoAllow: ["read"],
        deny: ["session_status"],
      },
    });
    const listed = service.listAgents().find((entry) => entry.id === "main");

    expect(updated.tools).toEqual({
      profile: "minimal",
      alsoAllow: ["read"],
      deny: ["session_status"],
    });
    expect(listed?.tools).toEqual({
      profile: "minimal",
      alsoAllow: ["read"],
      deny: ["session_status"],
    });
    expect(fsMock.readConfig().agents.list[0].tools).toEqual({
      profile: "minimal",
      alsoAllow: ["read"],
      deny: ["session_status"],
    });
  });

  it("calculates workspace size recursively for an agent", () => {
    let currentConfig = {
      agents: {
        list: [
          {
            id: "main",
            default: true,
            workspace: "/tmp/openclaw/workspace",
          },
        ],
      },
    };
    const statsByPath = new Map([
      ["/tmp/openclaw/workspace", { type: "dir" }],
      ["/tmp/openclaw/workspace/notes.txt", { type: "file", size: 120 }],
      ["/tmp/openclaw/workspace/nested", { type: "dir" }],
      [
        "/tmp/openclaw/workspace/nested/context.md",
        { type: "file", size: 880 },
      ],
    ]);
    const entriesByDir = new Map([
      ["/tmp/openclaw/workspace", ["notes.txt", "nested"]],
      ["/tmp/openclaw/workspace/nested", ["context.md"]],
    ]);
    const fsMock = {
      existsSync: vi.fn(() => true),
      mkdirSync: vi.fn(),
      rmSync: vi.fn(),
      readFileSync: vi.fn((targetPath) => {
        if (String(targetPath || "").endsWith("openclaw.json")) {
          return JSON.stringify(currentConfig);
        }
        return "";
      }),
      writeFileSync: vi.fn((targetPath, content) => {
        if (String(targetPath || "").endsWith("openclaw.json")) {
          currentConfig = JSON.parse(String(content || "{}"));
        }
      }),
      readdirSync: vi.fn(
        (targetPath) => entriesByDir.get(String(targetPath || "")) || [],
      ),
      statSync: vi.fn((targetPath) => {
        const entry = statsByPath.get(String(targetPath || ""));
        if (!entry) throw new Error("ENOENT");
        return {
          size: Number(entry.size || 0),
          isFile: () => entry.type === "file",
          isDirectory: () => entry.type === "dir",
          isSymbolicLink: () => false,
        };
      }),
    };
    const service = createAgentsService({
      fs: fsMock,
      OPENCLAW_DIR: "/tmp/openclaw",
    });

    expect(service.getAgentWorkspaceSize("main")).toEqual({
      workspacePath: "/tmp/openclaw/workspace",
      exists: true,
      sizeBytes: 1000,
    });
  });

  it("removes bindings when deleting an agent", () => {
    const fsMock = buildFsMock({
      initialConfig: {
        agents: {
          list: [
            { id: "main", default: true },
            { id: "ops", default: false },
          ],
        },
        bindings: [
          { agentId: "ops", match: { channel: "telegram" } },
          { agentId: "main", match: { channel: "telegram" } },
        ],
      },
    });
    const service = createAgentsService({
      fs: fsMock,
      OPENCLAW_DIR: "/tmp/openclaw",
    });

    service.deleteAgent("ops", { keepWorkspace: true });
    const config = fsMock.readConfig();
    expect(config.agents.list.map((entry) => entry.id)).toEqual(["main"]);
    expect(config.bindings).toEqual([
      { agentId: "main", match: { channel: "telegram" } },
    ]);
  });

  it("deletes stored custom workspace path when keepWorkspace is false", () => {
    const fsMock = buildFsMock({
      initialConfig: {
        agents: {
          list: [
            { id: "main", default: true },
            {
              id: "ops",
              default: false,
              workspace: "/tmp/openclaw/workspace-ops-custom",
            },
          ],
        },
      },
    });
    const service = createAgentsService({
      fs: fsMock,
      OPENCLAW_DIR: "/tmp/openclaw",
    });

    service.deleteAgent("ops", { keepWorkspace: false });

    expect(fsMock.rmSync).toHaveBeenCalledWith(
      "/tmp/openclaw/workspace-ops-custom",
      { recursive: true, force: true },
    );
    expect(fsMock.rmSync).toHaveBeenCalledWith("/tmp/openclaw/agents/ops", {
      recursive: true,
      force: true,
    });
  });

  it("does not attempt workspace deletes when deleting main is rejected", () => {
    const fsMock = buildFsMock({
      initialConfig: {
        agents: {
          list: [
            { id: "main", default: true },
            { id: "ops", default: false, workspace: "/tmp/openclaw/workspace-ops" },
          ],
        },
      },
    });
    const service = createAgentsService({
      fs: fsMock,
      OPENCLAW_DIR: "/tmp/openclaw",
    });

    expect(() =>
      service.deleteAgent("main", { keepWorkspace: false }),
    ).toThrow("The default main agent cannot be deleted");
    expect(fsMock.rmSync).not.toHaveBeenCalled();
  });

  it("does not attempt workspace deletes when deleting current default agent is rejected", () => {
    const fsMock = buildFsMock({
      initialConfig: {
        agents: {
          list: [
            { id: "main", default: false },
            { id: "ops", default: true, workspace: "/tmp/openclaw/workspace-ops" },
          ],
        },
      },
    });
    const service = createAgentsService({
      fs: fsMock,
      OPENCLAW_DIR: "/tmp/openclaw",
    });

    expect(() =>
      service.deleteAgent("ops", { keepWorkspace: false }),
    ).toThrow("Default agent cannot be deleted");
    expect(fsMock.rmSync).not.toHaveBeenCalled();
  });

  it("lists configured channel accounts including default single-account channels", () => {
    const fsMock = buildFsMock({
      initialConfig: {
        channels: {
          telegram: {
            enabled: true,
            botToken: "${TELEGRAM_BOT_TOKEN}",
          },
          discord: {
            accounts: {
              default: { token: "${DISCORD_BOT_TOKEN}" },
              alerts: { token: "${DISCORD_ALERTS_TOKEN}" },
            },
          },
          slack: {
            enabled: true,
            botToken: "${SLACK_BOT_TOKEN}",
          },
        },
      },
    });
    const service = createAgentsService({
      fs: fsMock,
      OPENCLAW_DIR: "/tmp/openclaw",
    });

    expect(service.listConfiguredChannelAccounts()).toEqual([
      {
        channel: "telegram",
        accounts: [
          {
            id: "default",
            name: "",
            envKey: "TELEGRAM_BOT_TOKEN",
            token: "",
            boundAgentId: "",
            paired: 0,
            status: "configured",
          },
        ],
      },
      {
        channel: "discord",
        accounts: [
          {
            id: "default",
            name: "",
            envKey: "DISCORD_BOT_TOKEN",
            token: "",
            boundAgentId: "",
            paired: 0,
            status: "configured",
          },
          {
            id: "alerts",
            name: "",
            envKey: "DISCORD_BOT_TOKEN_ALERTS",
            token: "",
            boundAgentId: "",
            paired: 0,
            status: "configured",
          },
        ],
      },
      {
        channel: "slack",
        accounts: [
          {
            id: "default",
            name: "",
            envKey: "SLACK_BOT_TOKEN",
            token: "",
            boundAgentId: "",
            paired: 0,
            status: "configured",
          },
        ],
      },
    ]);
  });

  it("includes explicit binding ownership in configured channel accounts", () => {
    const fsMock = buildFsMock({
      initialConfig: {
        channels: {
          telegram: {
            enabled: true,
            accounts: {
              default: { botToken: "${TELEGRAM_BOT_TOKEN}" },
              alerts: { botToken: "${TELEGRAM_ALERTS_TOKEN}" },
            },
          },
        },
        bindings: [
          { agentId: "main", match: { channel: "telegram" } },
          {
            agentId: "ops",
            match: { channel: "telegram", accountId: "alerts" },
          },
          {
            agentId: "other",
            match: { channel: "telegram", peer: { kind: "group", id: "-123" } },
          },
        ],
      },
    });
    const service = createAgentsService({
      fs: fsMock,
      OPENCLAW_DIR: "/tmp/openclaw",
    });

    expect(service.listConfiguredChannelAccounts()).toEqual([
      {
        channel: "telegram",
        accounts: [
          {
            id: "default",
            name: "",
            envKey: "TELEGRAM_BOT_TOKEN",
            token: "",
            boundAgentId: "main",
            paired: 0,
            status: "configured",
          },
          {
            id: "alerts",
            name: "",
            envKey: "TELEGRAM_BOT_TOKEN_ALERTS",
            token: "",
            boundAgentId: "ops",
            paired: 0,
            status: "configured",
          },
        ],
      },
    ]);
  });

  it("includes paired status for named telegram accounts from credential files", () => {
    const fsMock = buildFsMock({
      initialConfig: {
        channels: {
          telegram: {
            enabled: true,
            accounts: {
              default: { botToken: "${TELEGRAM_BOT_TOKEN}" },
              tester: { botToken: "${TELEGRAM_BOT_TOKEN_TESTER}" },
            },
          },
        },
        bindings: [
          {
            agentId: "main",
            match: { channel: "telegram", accountId: "tester" },
          },
        ],
      },
      fileContents: {
        "/tmp/openclaw/credentials/telegram-tester-allowFrom.json":
          JSON.stringify({
            allowFrom: ["1050628644"],
          }),
      },
    });
    const service = createAgentsService({
      fs: fsMock,
      OPENCLAW_DIR: "/tmp/openclaw",
    });

    expect(service.listConfiguredChannelAccounts()).toEqual([
      {
        channel: "telegram",
        accounts: [
          {
            id: "default",
            name: "",
            envKey: "TELEGRAM_BOT_TOKEN",
            token: "",
            boundAgentId: "",
            paired: 0,
            status: "configured",
          },
          {
            id: "tester",
            name: "",
            envKey: "TELEGRAM_BOT_TOKEN_TESTER",
            token: "",
            boundAgentId: "main",
            paired: 1,
            status: "paired",
          },
        ],
      },
    ]);
  });

  it("masks configured channel token values when listing accounts", () => {
    const fsMock = buildFsMock({
      initialConfig: {
        channels: {
          telegram: {
            enabled: true,
            accounts: {
              default: { botToken: "${TELEGRAM_BOT_TOKEN}" },
            },
          },
        },
      },
    });
    const service = createAgentsService({
      fs: fsMock,
      OPENCLAW_DIR: "/tmp/openclaw",
      readEnvFile: () => [{ key: "TELEGRAM_BOT_TOKEN", value: "123:abc" }],
    });

    expect(service.listConfiguredChannelAccounts()).toEqual([
      {
        channel: "telegram",
        accounts: [
          {
            id: "default",
            name: "",
            envKey: "TELEGRAM_BOT_TOKEN",
            token: "********",
            boundAgentId: "",
            paired: 0,
            status: "configured",
          },
        ],
      },
    ]);
  });

  it("adds and removes bindings for an agent", () => {
    const fsMock = buildFsMock({
      initialConfig: {
        agents: {
          list: [
            { id: "main", default: true },
            { id: "ops", default: false },
          ],
        },
      },
    });
    const service = createAgentsService({
      fs: fsMock,
      OPENCLAW_DIR: "/tmp/openclaw",
    });

    const binding = service.addBinding("ops", {
      channel: "telegram",
      accountId: "alerts",
    });

    expect(binding).toEqual({
      agentId: "ops",
      match: {
        channel: "telegram",
        accountId: "alerts",
      },
    });
    expect(service.getBindingsForAgent("ops")).toEqual([binding]);

    service.removeBinding("ops", {
      channel: "telegram",
      accountId: "alerts",
    });

    expect(service.getBindingsForAgent("ops")).toEqual([]);
  });

  it("rejects bindings already assigned to another agent", () => {
    const fsMock = buildFsMock({
      initialConfig: {
        agents: {
          list: [
            { id: "main", default: true },
            { id: "ops", default: false },
          ],
        },
        bindings: [
          {
            agentId: "main",
            match: { channel: "telegram", accountId: "default" },
          },
        ],
      },
    });
    const service = createAgentsService({
      fs: fsMock,
      OPENCLAW_DIR: "/tmp/openclaw",
    });

    expect(() =>
      service.addBinding("ops", {
        channel: "telegram",
        accountId: "default",
      }),
    ).toThrow('Binding already assigned to agent "main"');
  });

  it("creates a first channel account with the base env key and binding", async () => {
    const fsMock = buildFsMock({
      initialConfig: {
        agents: {
          list: [{ id: "main", default: true }],
        },
      },
    });
    const readEnvFile = vi.fn(() => [
      { key: "OPENAI_API_KEY", value: "sk-test" },
    ]);
    const writeEnvFile = vi.fn();
    const reloadEnv = vi.fn();
    const clawCmd = vi.fn(async () => ({ ok: true, stdout: "", stderr: "" }));
    const service = createAgentsService({
      fs: fsMock,
      OPENCLAW_DIR: "/tmp/openclaw",
      readEnvFile,
      writeEnvFile,
      reloadEnv,
      clawCmd,
    });

    const result = await service.createChannelAccount({
      provider: "telegram",
      name: "Telegram",
      accountId: "default",
      token: "123:abc",
      agentId: "main",
    });

    expect(result).toEqual({
      channel: "telegram",
      account: {
        id: "default",
        name: "Telegram",
        envKey: "TELEGRAM_BOT_TOKEN",
      },
      binding: {
        agentId: "main",
        match: { channel: "telegram", accountId: "default" },
      },
    });
    expect(writeEnvFile).toHaveBeenCalledWith([
      { key: "OPENAI_API_KEY", value: "sk-test" },
      { key: "TELEGRAM_BOT_TOKEN", value: "123:abc" },
    ]);
    expect(reloadEnv).toHaveBeenCalled();
    expect(clawCmd).toHaveBeenNthCalledWith(
      1,
      "channels add --channel 'telegram' --name 'Telegram' --token '123:abc'",
      { quiet: true, timeoutMs: 30000 },
    );
    expect(clawCmd).toHaveBeenNthCalledWith(
      2,
      "agents bind --agent 'main' --bind 'telegram:default'",
      { quiet: true, timeoutMs: 30000 },
    );
    expect(fsMock.readConfig()).toEqual(
      expect.objectContaining({
        channels: {
          telegram: {
            enabled: true,
            defaultAccount: "default",
            accounts: {
              default: {
                name: "Telegram",
                botToken: "${TELEGRAM_BOT_TOKEN}",
                dmPolicy: "pairing",
              },
            },
          },
        },
      }),
    );
  });

  it("migrates single-account channel config before adding another account", async () => {
    const fsMock = buildFsMock({
      initialConfig: {
        agents: {
          list: [
            { id: "main", default: true },
            { id: "ops", default: false },
          ],
        },
        channels: {
          telegram: {
            enabled: true,
            botToken: "${TELEGRAM_BOT_TOKEN}",
            dmPolicy: "pairing",
            allowFrom: ["1050"],
          },
        },
        bindings: [{ agentId: "main", match: { channel: "telegram" } }],
      },
    });
    const writeEnvFile = vi.fn();
    const clawCmd = vi.fn(async () => ({ ok: true, stdout: "", stderr: "" }));
    const service = createAgentsService({
      fs: fsMock,
      OPENCLAW_DIR: "/tmp/openclaw",
      readEnvFile: vi.fn(() => [
        { key: "TELEGRAM_BOT_TOKEN", value: "123:abc" },
      ]),
      writeEnvFile,
      reloadEnv: vi.fn(),
      clawCmd,
    });

    await service.createChannelAccount({
      provider: "telegram",
      name: "Alerts",
      accountId: "alerts",
      token: "456:def",
      agentId: "ops",
    });

    expect(writeEnvFile).toHaveBeenCalledWith([
      { key: "TELEGRAM_BOT_TOKEN", value: "123:abc" },
      { key: "TELEGRAM_BOT_TOKEN_ALERTS", value: "456:def" },
    ]);
    expect(clawCmd).toHaveBeenNthCalledWith(
      1,
      "channels add --channel 'telegram' --account 'alerts' --name 'Alerts' --token '456:def'",
      { quiet: true, timeoutMs: 30000 },
    );
    expect(clawCmd).toHaveBeenNthCalledWith(
      2,
      "agents bind --agent 'ops' --bind 'telegram:alerts'",
      { quiet: true, timeoutMs: 30000 },
    );
    expect(fsMock.readConfig()).toEqual(
      expect.objectContaining({
        channels: {
          telegram: {
            enabled: true,
            defaultAccount: "default",
            accounts: {
              default: {
                botToken: "${TELEGRAM_BOT_TOKEN}",
                dmPolicy: "pairing",
                allowFrom: ["1050"],
              },
              alerts: {
                name: "Alerts",
                botToken: "${TELEGRAM_BOT_TOKEN_ALERTS}",
                dmPolicy: "pairing",
              },
            },
          },
        },
      }),
    );
  });

  it("sanitizes plaintext legacy single-account token during migration", async () => {
    const fsMock = buildFsMock({
      initialConfig: {
        agents: {
          list: [
            { id: "main", default: true },
            { id: "ops", default: false },
          ],
        },
        channels: {
          telegram: {
            enabled: true,
            botToken: "123:abc",
            dmPolicy: "pairing",
          },
        },
      },
    });
    const clawCmd = vi.fn(async () => ({ ok: true, stdout: "", stderr: "" }));
    const service = createAgentsService({
      fs: fsMock,
      OPENCLAW_DIR: "/tmp/openclaw",
      readEnvFile: vi.fn(() => [
        { key: "TELEGRAM_BOT_TOKEN", value: "123:abc" },
      ]),
      writeEnvFile: vi.fn(),
      reloadEnv: vi.fn(),
      clawCmd,
    });

    await service.createChannelAccount({
      provider: "telegram",
      name: "Alerts",
      accountId: "alerts",
      token: "456:def",
      agentId: "ops",
    });

    const config = fsMock.readConfig();
    expect(config.channels.telegram.accounts.default.botToken).toBe(
      "${TELEGRAM_BOT_TOKEN}",
    );
  });

  it("sanitizes plaintext tokens in existing account entries after channel add", async () => {
    const fsMock = buildFsMock({
      initialConfig: {
        agents: {
          list: [
            { id: "main", default: true },
            { id: "ops", default: false },
          ],
        },
        channels: {
          telegram: {
            enabled: true,
            accounts: {
              default: {
                botToken: "123:abc",
                dmPolicy: "pairing",
              },
            },
            defaultAccount: "default",
          },
        },
      },
    });
    const clawCmd = vi.fn(async () => ({ ok: true, stdout: "", stderr: "" }));
    const service = createAgentsService({
      fs: fsMock,
      OPENCLAW_DIR: "/tmp/openclaw",
      readEnvFile: vi.fn(() => [
        { key: "TELEGRAM_BOT_TOKEN", value: "123:abc" },
      ]),
      writeEnvFile: vi.fn(),
      reloadEnv: vi.fn(),
      clawCmd,
    });

    await service.createChannelAccount({
      provider: "telegram",
      name: "Alerts",
      accountId: "alerts",
      token: "456:def",
      agentId: "ops",
    });

    const config = fsMock.readConfig();
    expect(config.channels.telegram.accounts.default.botToken).toBe(
      "${TELEGRAM_BOT_TOKEN}",
    );
    expect(config.channels.telegram.accounts.alerts.botToken).toBe(
      "${TELEGRAM_BOT_TOKEN_ALERTS}",
    );
  });

  it("ensures provider plugin allowlist before channel add cli call", async () => {
    const fsMock = buildFsMock({
      initialConfig: {
        agents: {
          list: [{ id: "main", default: true }],
        },
        plugins: {
          allow: ["discord", "usage-tracker"],
          entries: {
            discord: { enabled: true },
            "usage-tracker": { enabled: true },
          },
        },
      },
    });
    const readEnvFile = vi.fn(() => [
      { key: "OPENAI_API_KEY", value: "sk-test" },
    ]);
    const writeEnvFile = vi.fn();
    const reloadEnv = vi.fn();
    const restartGateway = vi.fn(async () => {});
    const clawCmd = vi.fn(async (command) => {
      if (String(command).startsWith("channels add")) {
        const currentConfig = fsMock.readConfig();
        expect(currentConfig.plugins).toEqual({
          allow: ["discord", "usage-tracker", "telegram"],
          entries: {
            discord: { enabled: true },
            "usage-tracker": { enabled: true },
            telegram: { enabled: true },
          },
        });
      }
      return { ok: true, stdout: "", stderr: "" };
    });
    const service = createAgentsService({
      fs: fsMock,
      OPENCLAW_DIR: "/tmp/openclaw",
      readEnvFile,
      writeEnvFile,
      reloadEnv,
      restartGateway,
      clawCmd,
    });

    const result = await service.createChannelAccount({
      provider: "telegram",
      name: "Telegram",
      accountId: "default",
      token: "123:abc",
      agentId: "main",
    });

    expect(result.channel).toBe("telegram");
    expect(writeEnvFile.mock.invocationCallOrder[0]).toBeLessThan(
      fsMock.writeFileSync.mock.invocationCallOrder[0],
    );
    expect(writeEnvFile.mock.invocationCallOrder[0]).toBeLessThan(
      restartGateway.mock.invocationCallOrder[0],
    );
    expect(restartGateway.mock.invocationCallOrder[0]).toBeLessThan(
      fsMock.writeFileSync.mock.invocationCallOrder[0],
    );
    expect(clawCmd).toHaveBeenNthCalledWith(
      1,
      "channels add --channel 'telegram' --name 'Telegram' --token '123:abc'",
      { quiet: true, timeoutMs: 30000 },
    );
  });

  it("creates a discord channel account via channels add cli", async () => {
    const fsMock = buildFsMock({
      initialConfig: {
        agents: {
          list: [{ id: "main", default: true }],
        },
      },
    });
    const readEnvFile = vi.fn(() => [
      { key: "OPENAI_API_KEY", value: "sk-test" },
    ]);
    const writeEnvFile = vi.fn();
    const reloadEnv = vi.fn();
    const clawCmd = vi.fn(async () => ({ ok: true, stdout: "", stderr: "" }));
    const service = createAgentsService({
      fs: fsMock,
      OPENCLAW_DIR: "/tmp/openclaw",
      readEnvFile,
      writeEnvFile,
      reloadEnv,
      clawCmd,
    });

    const result = await service.createChannelAccount({
      provider: "discord",
      name: "Discord",
      accountId: "default",
      token: "discord-token",
      agentId: "main",
    });

    expect(result).toEqual({
      channel: "discord",
      account: {
        id: "default",
        name: "Discord",
        envKey: "DISCORD_BOT_TOKEN",
      },
      binding: {
        agentId: "main",
        match: { channel: "discord", accountId: "default" },
      },
    });
    expect(writeEnvFile).toHaveBeenCalledWith([
      { key: "OPENAI_API_KEY", value: "sk-test" },
      { key: "DISCORD_BOT_TOKEN", value: "discord-token" },
    ]);
    expect(reloadEnv).toHaveBeenCalled();
    expect(clawCmd).toHaveBeenNthCalledWith(
      1,
      "channels add --channel 'discord' --name 'Discord' --token 'discord-token'",
      { quiet: true, timeoutMs: 30000 },
    );
    expect(clawCmd).toHaveBeenNthCalledWith(
      2,
      "agents bind --agent 'main' --bind 'discord:default'",
      { quiet: true, timeoutMs: 30000 },
    );
    expect(fsMock.readConfig()).toEqual(
      expect.objectContaining({
        channels: {
          discord: {
            enabled: true,
            defaultAccount: "default",
            accounts: {
              default: {
                name: "Discord",
                token: "${DISCORD_BOT_TOKEN}",
                dmPolicy: "pairing",
              },
            },
          },
        },
        plugins: {
          allow: ["discord"],
          entries: {
            discord: { enabled: true },
          },
        },
      }),
    );
  });

  it("creates a slack channel account with bot and app tokens", async () => {
    const fsMock = buildFsMock({
      initialConfig: {
        agents: {
          list: [{ id: "main", default: true }],
        },
      },
    });
    const readEnvFile = vi.fn(() => [
      { key: "OPENAI_API_KEY", value: "sk-test" },
    ]);
    const writeEnvFile = vi.fn();
    const reloadEnv = vi.fn();
    const clawCmd = vi.fn(async () => ({ ok: true, stdout: "", stderr: "" }));
    const service = createAgentsService({
      fs: fsMock,
      OPENCLAW_DIR: "/tmp/openclaw",
      readEnvFile,
      writeEnvFile,
      reloadEnv,
      clawCmd,
    });

    const result = await service.createChannelAccount({
      provider: "slack",
      name: "Slack",
      accountId: "default",
      token: "xoxb-bot-token",
      appToken: "xapp-app-token",
      agentId: "main",
    });

    expect(result).toEqual({
      channel: "slack",
      account: {
        id: "default",
        name: "Slack",
        envKey: "SLACK_BOT_TOKEN",
      },
      binding: {
        agentId: "main",
        match: { channel: "slack", accountId: "default" },
      },
    });
    expect(writeEnvFile).toHaveBeenCalledWith([
      { key: "OPENAI_API_KEY", value: "sk-test" },
      { key: "SLACK_BOT_TOKEN", value: "xoxb-bot-token" },
      { key: "SLACK_APP_TOKEN", value: "xapp-app-token" },
    ]);
    expect(clawCmd).toHaveBeenNthCalledWith(
      1,
      "channels add --channel 'slack' --name 'Slack' --bot-token 'xoxb-bot-token' --app-token 'xapp-app-token'",
      { quiet: true, timeoutMs: 30000 },
    );
    expect(fsMock.readConfig()).toEqual(
      expect.objectContaining({
        channels: {
          slack: {
            enabled: true,
            defaultAccount: "default",
            accounts: {
              default: {
                name: "Slack",
                botToken: "${SLACK_BOT_TOKEN}",
                appToken: "${SLACK_APP_TOKEN}",
                dmPolicy: "pairing",
              },
            },
          },
        },
      }),
    );
  });

  it("requires app token when creating a slack channel account", async () => {
    const fsMock = buildFsMock({
      initialConfig: {
        agents: {
          list: [{ id: "main", default: true }],
        },
      },
    });
    const service = createAgentsService({
      fs: fsMock,
      OPENCLAW_DIR: "/tmp/openclaw",
      readEnvFile: vi.fn(() => []),
      writeEnvFile: vi.fn(),
      reloadEnv: vi.fn(),
      clawCmd: vi.fn(async () => ({ ok: true, stdout: "", stderr: "" })),
    });

    await expect(
      service.createChannelAccount({
        provider: "slack",
        name: "Slack",
        accountId: "default",
        token: "xoxb-bot-token",
        agentId: "main",
      }),
    ).rejects.toThrow("Slack App Token is required");
  });

  it("rejects concurrent channel account creation requests", async () => {
    const fsMock = buildFsMock({
      initialConfig: {
        agents: {
          list: [{ id: "main", default: true }],
        },
      },
    });
    let releaseRestart = () => {};
    const restartGateway = vi.fn(
      () =>
        new Promise((resolve) => {
          releaseRestart = resolve;
        }),
    );
    const service = createAgentsService({
      fs: fsMock,
      OPENCLAW_DIR: "/tmp/openclaw",
      readEnvFile: vi.fn(() => []),
      writeEnvFile: vi.fn(),
      reloadEnv: vi.fn(),
      restartGateway,
      clawCmd: vi.fn(async () => ({ ok: true, stdout: "", stderr: "" })),
    });

    const firstCreatePromise = service.createChannelAccount({
      provider: "telegram",
      name: "Telegram",
      accountId: "default",
      token: "123:abc",
      agentId: "main",
    });

    await expect(
      service.createChannelAccount({
        provider: "telegram",
        name: "Telegram 2",
        accountId: "alerts",
        token: "456:def",
        agentId: "main",
      }),
    ).rejects.toThrow("A channel account creation is already in progress");

    releaseRestart();
    await expect(firstCreatePromise).resolves.toEqual(
      expect.objectContaining({
        channel: "telegram",
      }),
    );
  });

  it("rolls back env and config when channel add CLI step fails", async () => {
    const fsMock = buildFsMock({
      initialConfig: {
        agents: {
          list: [{ id: "main", default: true }],
        },
      },
    });
    const initialEnvVars = [{ key: "OPENAI_API_KEY", value: "sk-test" }];
    const writeEnvFile = vi.fn();
    const reloadEnv = vi.fn();
    const clawCmd = vi.fn(async (command) => {
      if (String(command).startsWith("channels add")) {
        return { ok: false, stdout: "", stderr: "CLI add failed" };
      }
      return { ok: true, stdout: "", stderr: "" };
    });
    const service = createAgentsService({
      fs: fsMock,
      OPENCLAW_DIR: "/tmp/openclaw",
      readEnvFile: vi.fn(() => initialEnvVars),
      writeEnvFile,
      reloadEnv,
      restartGateway: vi.fn(async () => {}),
      clawCmd,
    });

    await expect(
      service.createChannelAccount({
        provider: "telegram",
        name: "Telegram",
        accountId: "default",
        token: "123:abc",
        agentId: "main",
      }),
    ).rejects.toThrow("CLI add failed");

    expect(writeEnvFile).toHaveBeenNthCalledWith(1, [
      { key: "OPENAI_API_KEY", value: "sk-test" },
      { key: "TELEGRAM_BOT_TOKEN", value: "123:abc" },
    ]);
    expect(writeEnvFile).toHaveBeenNthCalledWith(2, initialEnvVars);
    expect(reloadEnv).toHaveBeenCalledTimes(2);
    expect(fsMock.readConfig()).toEqual({
      agents: {
        list: [{ id: "main", default: true }],
      },
    });
  });

  it("prevents creating multiple discord channel accounts", async () => {
    const fsMock = buildFsMock({
      initialConfig: {
        agents: {
          list: [{ id: "main", default: true }],
        },
        channels: {
          discord: {
            enabled: true,
            defaultAccount: "default",
            accounts: {
              default: {
                token: "${DISCORD_BOT_TOKEN}",
                dmPolicy: "pairing",
              },
            },
          },
        },
      },
    });
    const service = createAgentsService({
      fs: fsMock,
      OPENCLAW_DIR: "/tmp/openclaw",
      readEnvFile: vi.fn(() => [
        { key: "DISCORD_BOT_TOKEN", value: "discord-token" },
      ]),
      writeEnvFile: vi.fn(),
      reloadEnv: vi.fn(),
      clawCmd: vi.fn(async () => ({ ok: true, stdout: "", stderr: "" })),
    });

    await expect(
      service.createChannelAccount({
        provider: "discord",
        name: "Discord 2",
        accountId: "alerts",
        token: "discord-token-2",
        agentId: "main",
      }),
    ).rejects.toThrow("Discord supports a single channel account");
  });

  it("prevents creating multiple slack channel accounts", async () => {
    const fsMock = buildFsMock({
      initialConfig: {
        agents: {
          list: [{ id: "main", default: true }],
        },
        channels: {
          slack: {
            enabled: true,
            defaultAccount: "default",
            accounts: {
              default: {
                botToken: "${SLACK_BOT_TOKEN}",
                appToken: "${SLACK_APP_TOKEN}",
                dmPolicy: "pairing",
              },
            },
          },
        },
      },
    });
    const service = createAgentsService({
      fs: fsMock,
      OPENCLAW_DIR: "/tmp/openclaw",
      readEnvFile: vi.fn(() => [
        { key: "SLACK_BOT_TOKEN", value: "xoxb-bot-token" },
        { key: "SLACK_APP_TOKEN", value: "xapp-app-token" },
      ]),
      writeEnvFile: vi.fn(),
      reloadEnv: vi.fn(),
      clawCmd: vi.fn(async () => ({ ok: true, stdout: "", stderr: "" })),
    });

    await expect(
      service.createChannelAccount({
        provider: "slack",
        name: "Slack 2",
        accountId: "alerts",
        token: "xoxb-bot-token-2",
        appToken: "xapp-app-token-2",
        agentId: "main",
      }),
    ).rejects.toThrow("Slack supports a single channel account");
  });

  it("updates channel account name and bound agent", () => {
    const fsMock = buildFsMock({
      initialConfig: {
        agents: {
          list: [
            { id: "main", default: true },
            { id: "ops", default: false },
          ],
        },
        channels: {
          telegram: {
            enabled: true,
            defaultAccount: "default",
            accounts: {
              default: { botToken: "${TELEGRAM_BOT_TOKEN}", name: "Telegram" },
              alerts: {
                botToken: "${TELEGRAM_BOT_TOKEN_ALERTS}",
                name: "Alerts",
              },
            },
          },
        },
        bindings: [
          {
            agentId: "main",
            match: { channel: "telegram", accountId: "default" },
          },
          {
            agentId: "ops",
            match: { channel: "telegram", accountId: "alerts" },
          },
        ],
      },
    });
    const service = createAgentsService({
      fs: fsMock,
      OPENCLAW_DIR: "/tmp/openclaw",
    });

    const result = service.updateChannelAccount({
      provider: "telegram",
      accountId: "alerts",
      name: "Alerts Bot",
      agentId: "main",
    });

    expect(result).toEqual({
      channel: "telegram",
      account: {
        id: "alerts",
        name: "Alerts Bot",
        boundAgentId: "main",
      },
      tokenUpdated: false,
    });
    expect(fsMock.readConfig()).toEqual(
      expect.objectContaining({
        channels: {
          telegram: expect.objectContaining({
            accounts: {
              default: { botToken: "${TELEGRAM_BOT_TOKEN}", name: "Telegram" },
              alerts: {
                botToken: "${TELEGRAM_BOT_TOKEN_ALERTS}",
                name: "Alerts Bot",
              },
            },
          }),
        },
        bindings: [
          {
            agentId: "main",
            match: { channel: "telegram", accountId: "default" },
          },
          {
            agentId: "main",
            match: { channel: "telegram", accountId: "alerts" },
          },
        ],
      }),
    );
  });

  it("updates channel account token when provided", () => {
    const fsMock = buildFsMock({
      initialConfig: {
        agents: {
          list: [
            { id: "main", default: true },
            { id: "ops", default: false },
          ],
        },
        channels: {
          telegram: {
            enabled: true,
            defaultAccount: "default",
            accounts: {
              default: { botToken: "${TELEGRAM_BOT_TOKEN}", name: "Telegram" },
              alerts: {
                botToken: "${TELEGRAM_BOT_TOKEN_ALERTS}",
                name: "Alerts",
              },
            },
          },
        },
        bindings: [
          {
            agentId: "main",
            match: { channel: "telegram", accountId: "default" },
          },
          {
            agentId: "ops",
            match: { channel: "telegram", accountId: "alerts" },
          },
        ],
      },
    });
    const readEnvFile = vi.fn(() => [
      { key: "TELEGRAM_BOT_TOKEN", value: "old-token" },
      { key: "TELEGRAM_BOT_TOKEN_ALERTS", value: "old-alerts-token" },
    ]);
    const writeEnvFile = vi.fn();
    const reloadEnv = vi.fn();
    const service = createAgentsService({
      fs: fsMock,
      OPENCLAW_DIR: "/tmp/openclaw",
      readEnvFile,
      writeEnvFile,
      reloadEnv,
    });

    const result = service.updateChannelAccount({
      provider: "telegram",
      accountId: "alerts",
      name: "Alerts Bot",
      agentId: "ops",
      token: "new-alerts-token",
    });

    expect(writeEnvFile).toHaveBeenCalledWith([
      { key: "TELEGRAM_BOT_TOKEN", value: "old-token" },
      { key: "TELEGRAM_BOT_TOKEN_ALERTS", value: "new-alerts-token" },
    ]);
    expect(reloadEnv).toHaveBeenCalled();
    expect(result.tokenUpdated).toBe(true);
  });

  it("updates slack app token when provided", () => {
    const fsMock = buildFsMock({
      initialConfig: {
        agents: {
          list: [{ id: "main", default: true }],
        },
        channels: {
          slack: {
            enabled: true,
            defaultAccount: "default",
            accounts: {
              default: {
                botToken: "${SLACK_BOT_TOKEN}",
                appToken: "${SLACK_APP_TOKEN}",
                name: "Slack",
              },
            },
          },
        },
        bindings: [
          {
            agentId: "main",
            match: { channel: "slack", accountId: "default" },
          },
        ],
      },
    });
    const readEnvFile = vi.fn(() => [
      { key: "SLACK_BOT_TOKEN", value: "xoxb-old" },
      { key: "SLACK_APP_TOKEN", value: "xapp-old" },
    ]);
    const writeEnvFile = vi.fn();
    const reloadEnv = vi.fn();
    const service = createAgentsService({
      fs: fsMock,
      OPENCLAW_DIR: "/tmp/openclaw",
      readEnvFile,
      writeEnvFile,
      reloadEnv,
    });

    const result = service.updateChannelAccount({
      provider: "slack",
      accountId: "default",
      name: "Slack",
      agentId: "main",
      appToken: "xapp-new",
    });

    expect(writeEnvFile).toHaveBeenCalledWith([
      { key: "SLACK_BOT_TOKEN", value: "xoxb-old" },
      { key: "SLACK_APP_TOKEN", value: "xapp-new" },
    ]);
    expect(reloadEnv).toHaveBeenCalled();
    expect(result.tokenUpdated).toBe(true);
  });

  it("does not rewrite env when updated token is unchanged", () => {
    const fsMock = buildFsMock({
      initialConfig: {
        agents: {
          list: [{ id: "main", default: true }],
        },
        channels: {
          telegram: {
            enabled: true,
            defaultAccount: "default",
            accounts: {
              default: { botToken: "${TELEGRAM_BOT_TOKEN}", name: "Telegram" },
            },
          },
        },
        bindings: [
          {
            agentId: "main",
            match: { channel: "telegram", accountId: "default" },
          },
        ],
      },
    });
    const readEnvFile = vi.fn(() => [
      { key: "TELEGRAM_BOT_TOKEN", value: "same-token" },
    ]);
    const writeEnvFile = vi.fn();
    const reloadEnv = vi.fn();
    const service = createAgentsService({
      fs: fsMock,
      OPENCLAW_DIR: "/tmp/openclaw",
      readEnvFile,
      writeEnvFile,
      reloadEnv,
    });

    const result = service.updateChannelAccount({
      provider: "telegram",
      accountId: "default",
      name: "Telegram",
      agentId: "main",
      token: "same-token",
    });

    expect(writeEnvFile).not.toHaveBeenCalled();
    expect(reloadEnv).not.toHaveBeenCalled();
    expect(result.tokenUpdated).toBe(false);
  });

  it("skips token update when token is empty on update", () => {
    const fsMock = buildFsMock({
      initialConfig: {
        agents: {
          list: [{ id: "main", default: true }],
        },
        channels: {
          telegram: {
            enabled: true,
            defaultAccount: "default",
            accounts: {
              default: { botToken: "${TELEGRAM_BOT_TOKEN}", name: "Telegram" },
            },
          },
        },
        bindings: [
          {
            agentId: "main",
            match: { channel: "telegram", accountId: "default" },
          },
        ],
      },
    });
    const writeEnvFile = vi.fn();
    const reloadEnv = vi.fn();
    const service = createAgentsService({
      fs: fsMock,
      OPENCLAW_DIR: "/tmp/openclaw",
      readEnvFile: vi.fn(() => []),
      writeEnvFile,
      reloadEnv,
    });

    service.updateChannelAccount({
      provider: "telegram",
      accountId: "default",
      name: "My Bot",
      agentId: "main",
    });

    expect(writeEnvFile).not.toHaveBeenCalled();
    expect(reloadEnv).not.toHaveBeenCalled();
  });

  it("loads channel account token by provider/account id", () => {
    const fsMock = buildFsMock({
      initialConfig: {
        agents: {
          list: [{ id: "main", default: true }],
        },
        channels: {
          telegram: {
            enabled: true,
            defaultAccount: "default",
            accounts: {
              default: { botToken: "${TELEGRAM_BOT_TOKEN}", name: "Telegram" },
            },
          },
        },
      },
    });
    const service = createAgentsService({
      fs: fsMock,
      OPENCLAW_DIR: "/tmp/openclaw",
      readEnvFile: vi.fn(() => [
        { key: "TELEGRAM_BOT_TOKEN", value: "token-123" },
      ]),
    });

    const result = service.getChannelAccountToken({
      provider: "telegram",
      accountId: "default",
    });

    expect(result).toEqual({
      provider: "telegram",
      accountId: "default",
      envKey: "TELEGRAM_BOT_TOKEN",
      token: "token-123",
    });
  });

  it("loads slack channel bot and app tokens by provider/account id", () => {
    const fsMock = buildFsMock({
      initialConfig: {
        agents: {
          list: [{ id: "main", default: true }],
        },
        channels: {
          slack: {
            enabled: true,
            defaultAccount: "default",
            accounts: {
              default: {
                botToken: "${SLACK_BOT_TOKEN}",
                appToken: "${SLACK_APP_TOKEN}",
                name: "Slack",
              },
            },
          },
        },
      },
    });
    const service = createAgentsService({
      fs: fsMock,
      OPENCLAW_DIR: "/tmp/openclaw",
      readEnvFile: vi.fn(() => [
        { key: "SLACK_BOT_TOKEN", value: "xoxb-token-123" },
        { key: "SLACK_APP_TOKEN", value: "xapp-token-123" },
      ]),
    });

    const result = service.getChannelAccountToken({
      provider: "slack",
      accountId: "default",
    });

    expect(result).toEqual({
      provider: "slack",
      accountId: "default",
      envKey: "SLACK_BOT_TOKEN",
      token: "xoxb-token-123",
      appEnvKey: "SLACK_APP_TOKEN",
      appToken: "xapp-token-123",
    });
  });

  it("deletes channel accounts and removes their env entry", async () => {
    const fsMock = buildFsMock({
      initialConfig: {
        agents: {
          list: [{ id: "main", default: true }],
        },
        channels: {
          telegram: {
            enabled: true,
            defaultAccount: "default",
            accounts: {
              default: { botToken: "${TELEGRAM_BOT_TOKEN}", name: "Telegram" },
              alerts: {
                botToken: "${TELEGRAM_BOT_TOKEN_ALERTS}",
                name: "Alerts",
              },
            },
          },
        },
        bindings: [
          {
            agentId: "main",
            match: { channel: "telegram", accountId: "default" },
          },
          {
            agentId: "main",
            match: { channel: "telegram", accountId: "alerts" },
          },
        ],
      },
    });
    const readEnvFile = vi.fn(() => [
      { key: "TELEGRAM_BOT_TOKEN", value: "123:abc" },
      { key: "TELEGRAM_BOT_TOKEN_ALERTS", value: "456:def" },
    ]);
    const writeEnvFile = vi.fn();
    const reloadEnv = vi.fn();
    const clawCmd = vi.fn(async () => {
      const config = fsMock.readConfig();
      return {
        ok: true,
        stdout: "",
        stderr: "",
        apply: (() => {
          delete config.channels.telegram.accounts.alerts;
          fsMock.writeFileSync(
            "/tmp/openclaw/openclaw.json",
            JSON.stringify(config),
          );
        })(),
      };
    });
    const service = createAgentsService({
      fs: fsMock,
      OPENCLAW_DIR: "/tmp/openclaw",
      readEnvFile,
      writeEnvFile,
      reloadEnv,
      clawCmd,
    });

    const result = await service.deleteChannelAccount({
      provider: "telegram",
      accountId: "alerts",
    });

    expect(result).toEqual({ ok: true });
    expect(clawCmd).toHaveBeenCalledWith(
      "channels remove --channel 'telegram' --account 'alerts' --delete",
      { quiet: true, timeoutMs: 30000 },
    );
    expect(writeEnvFile).toHaveBeenCalledWith([
      { key: "TELEGRAM_BOT_TOKEN", value: "123:abc" },
    ]);
    expect(reloadEnv).toHaveBeenCalled();
    expect(fsMock.readConfig()).toEqual(
      expect.objectContaining({
        bindings: [
          {
            agentId: "main",
            match: { channel: "telegram", accountId: "default" },
          },
        ],
      }),
    );
  });

  it("deletes the final telegram account and removes the provider entry", async () => {
    const fsMock = buildFsMock({
      initialConfig: {
        agents: {
          list: [{ id: "main", default: true }],
        },
        channels: {
          telegram: {
            enabled: true,
            dmPolicy: "pairing",
            groupPolicy: "allowlist",
            defaultAccount: "default",
            accounts: {
              default: { botToken: "${TELEGRAM_BOT_TOKEN}", name: "Telegram" },
            },
          },
        },
        bindings: [
          {
            agentId: "main",
            match: { channel: "telegram", accountId: "default" },
          },
        ],
      },
    });
    const readEnvFile = vi.fn(() => [
      { key: "TELEGRAM_BOT_TOKEN", value: "123:abc" },
    ]);
    const writeEnvFile = vi.fn();
    const reloadEnv = vi.fn();
    const clawCmd = vi.fn(async () => ({ ok: true, stdout: "", stderr: "" }));
    const service = createAgentsService({
      fs: fsMock,
      OPENCLAW_DIR: "/tmp/openclaw",
      readEnvFile,
      writeEnvFile,
      reloadEnv,
      clawCmd,
    });

    const result = await service.deleteChannelAccount({
      provider: "telegram",
      accountId: "default",
    });

    expect(result).toEqual({ ok: true });
    expect(clawCmd).toHaveBeenCalledWith(
      "channels remove --channel 'telegram' --account 'default' --delete",
      { quiet: true, timeoutMs: 30000 },
    );
    expect(writeEnvFile).toHaveBeenCalledWith([]);
    expect(reloadEnv).toHaveBeenCalled();
    expect(fsMock.readConfig()).toEqual(
      expect.objectContaining({
        channels: {},
        bindings: [],
      }),
    );
  });

  it("deletes discord channels via direct config instead of channel cli", async () => {
    const fsMock = buildFsMock({
      initialConfig: {
        agents: {
          list: [{ id: "main", default: true }],
        },
        channels: {
          discord: {
            enabled: true,
            defaultAccount: "default",
            accounts: {
              default: { token: "${DISCORD_BOT_TOKEN}", name: "Discord" },
            },
          },
        },
        plugins: {
          allow: ["discord"],
          entries: {
            discord: { enabled: true },
          },
        },
        bindings: [
          {
            agentId: "main",
            match: { channel: "discord", accountId: "default" },
          },
        ],
      },
    });
    const readEnvFile = vi.fn(() => [
      { key: "DISCORD_BOT_TOKEN", value: "discord-token" },
    ]);
    const writeEnvFile = vi.fn();
    const reloadEnv = vi.fn();
    const clawCmd = vi.fn(async () => ({ ok: true, stdout: "", stderr: "" }));
    const service = createAgentsService({
      fs: fsMock,
      OPENCLAW_DIR: "/tmp/openclaw",
      readEnvFile,
      writeEnvFile,
      reloadEnv,
      clawCmd,
    });

    const result = await service.deleteChannelAccount({
      provider: "discord",
      accountId: "default",
    });

    expect(result).toEqual({ ok: true });
    expect(clawCmd).not.toHaveBeenCalled();
    expect(writeEnvFile).toHaveBeenCalledWith([]);
    expect(reloadEnv).toHaveBeenCalled();
    expect(fsMock.readConfig()).toEqual(
      expect.objectContaining({
        channels: {},
        plugins: {
          allow: ["discord"],
          entries: {
            discord: { enabled: false },
          },
        },
        bindings: [],
      }),
    );
  });

  it("deletes slack channel env vars including app token", async () => {
    const fsMock = buildFsMock({
      initialConfig: {
        agents: {
          list: [{ id: "main", default: true }],
        },
        channels: {
          slack: {
            enabled: true,
            defaultAccount: "default",
            accounts: {
              default: {
                botToken: "${SLACK_BOT_TOKEN}",
                appToken: "${SLACK_APP_TOKEN}",
                name: "Slack",
              },
            },
          },
        },
        bindings: [
          {
            agentId: "main",
            match: { channel: "slack", accountId: "default" },
          },
        ],
      },
    });
    const readEnvFile = vi.fn(() => [
      { key: "SLACK_BOT_TOKEN", value: "xoxb-token" },
      { key: "SLACK_APP_TOKEN", value: "xapp-token" },
    ]);
    const writeEnvFile = vi.fn();
    const reloadEnv = vi.fn();
    const clawCmd = vi.fn(async () => ({ ok: true, stdout: "", stderr: "" }));
    const service = createAgentsService({
      fs: fsMock,
      OPENCLAW_DIR: "/tmp/openclaw",
      readEnvFile,
      writeEnvFile,
      reloadEnv,
      clawCmd,
    });

    const result = await service.deleteChannelAccount({
      provider: "slack",
      accountId: "default",
    });

    expect(result).toEqual({ ok: true });
    expect(writeEnvFile).toHaveBeenCalledWith([]);
    expect(reloadEnv).toHaveBeenCalled();
  });

  it("overwrites orphaned env var when channel is not in config", async () => {
    const fsMock = buildFsMock({
      initialConfig: {
        agents: {
          list: [{ id: "main", default: true }],
        },
      },
    });
    const readEnvFile = vi.fn(() => [
      { key: "OPENAI_API_KEY", value: "sk-test" },
      { key: "TELEGRAM_BOT_TOKEN_OLD_BOT", value: "123:abc" },
    ]);
    const writeEnvFile = vi.fn();
    const reloadEnv = vi.fn();
    const clawCmd = vi.fn(async () => ({ ok: true, stdout: "", stderr: "" }));
    const service = createAgentsService({
      fs: fsMock,
      OPENCLAW_DIR: "/tmp/openclaw",
      readEnvFile,
      writeEnvFile,
      reloadEnv,
      clawCmd,
    });

    const result = await service.createChannelAccount({
      provider: "telegram",
      name: "Telegram",
      accountId: "default",
      token: "123:abc",
      agentId: "main",
    });

    expect(result.account.envKey).toBe("TELEGRAM_BOT_TOKEN");
    expect(writeEnvFile).toHaveBeenCalledWith([
      { key: "OPENAI_API_KEY", value: "sk-test" },
      { key: "TELEGRAM_BOT_TOKEN", value: "123:abc" },
    ]);
  });

  it("still blocks duplicate token when the other channel is configured", async () => {
    const fsMock = buildFsMock({
      initialConfig: {
        agents: {
          list: [{ id: "main", default: true }],
        },
        channels: {
          telegram: {
            enabled: true,
            defaultAccount: "default",
            accounts: {
              default: { botToken: "${TELEGRAM_BOT_TOKEN}", name: "Telegram" },
            },
          },
        },
        bindings: [
          {
            agentId: "main",
            match: { channel: "telegram", accountId: "default" },
          },
        ],
      },
    });
    const readEnvFile = vi.fn(() => [
      { key: "TELEGRAM_BOT_TOKEN", value: "123:abc" },
    ]);
    const service = createAgentsService({
      fs: fsMock,
      OPENCLAW_DIR: "/tmp/openclaw",
      readEnvFile,
      writeEnvFile: vi.fn(),
      reloadEnv: vi.fn(),
      clawCmd: vi.fn(async () => ({ ok: true })),
    });

    await expect(
      service.createChannelAccount({
        provider: "telegram",
        name: "Second Bot",
        accountId: "second",
        token: "123:abc",
        agentId: "main",
      }),
    ).rejects.toThrow("Channel token already exists in TELEGRAM_BOT_TOKEN");
  });
});
