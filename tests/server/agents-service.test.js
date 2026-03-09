const { createAgentsService } = require("../../lib/server/agents/service");

const buildFsMock = ({ initialConfig = {} } = {}) => {
  let currentConfig = JSON.parse(JSON.stringify(initialConfig));
  const files = new Set();
  const directories = new Set();
  return {
    existsSync: vi.fn((targetPath) => files.has(targetPath) || directories.has(targetPath)),
    mkdirSync: vi.fn((targetPath) => {
      directories.add(targetPath);
    }),
    rmSync: vi.fn(),
    readFileSync: vi.fn(() => JSON.stringify(currentConfig)),
    writeFileSync: vi.fn((targetPath, content) => {
      if (String(targetPath || "").endsWith("openclaw.json")) {
        currentConfig = JSON.parse(String(content || "{}"));
        return;
      }
      files.add(targetPath);
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
    expect(config.bindings).toEqual([{ agentId: "main", match: { channel: "telegram" } }]);
  });
});
