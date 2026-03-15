const path = require("path");

const {
  createWebhook,
  getTransformRelativePath,
} = require("../../lib/server/webhooks");

const createMemoryFs = (initialFiles = {}) => {
  const files = new Map(
    Object.entries(initialFiles).map(([filePath, contents]) => [
      filePath,
      String(contents),
    ]),
  );

  return {
    existsSync: (filePath) => files.has(filePath),
    readFileSync: (filePath) => {
      if (!files.has(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }
      return files.get(filePath);
    },
    writeFileSync: (filePath, contents) => {
      files.set(filePath, String(contents));
    },
    mkdirSync: () => {},
    rmSync: () => {},
    statSync: (filePath) => {
      if (!files.has(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }
      return {
        birthtime: { toISOString: () => "2026-03-08T00:00:00.000Z" },
        ctime: { toISOString: () => "2026-03-08T00:00:00.000Z" },
      };
    },
  };
};

describe("server/webhooks", () => {
  it("writes delivery routing fields onto mapping when destination is provided", () => {
    const openclawDir = "/tmp/openclaw";
    const configPath = path.join(openclawDir, "openclaw.json");
    const fs = createMemoryFs({
      [configPath]: JSON.stringify({
        agents: {
          list: [{ id: "main", default: true }],
        },
      }),
    });

    createWebhook({
      fs,
      constants: { OPENCLAW_DIR: openclawDir },
      name: "gmail-alerts",
      destination: {
        channel: "telegram",
        to: "-1003709908795:4011",
      },
    });
    const detail = createWebhook({
      fs,
      constants: { OPENCLAW_DIR: openclawDir },
      name: "gmail-alerts-2",
      destination: {
        channel: "telegram",
        to: "-1003709908795:4011",
      },
    });

    const transformPath = path.join(
      openclawDir,
      getTransformRelativePath("gmail-alerts"),
    );
    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    const mapping = (config?.hooks?.mappings || []).find(
      (entry) => entry?.match?.path === "gmail-alerts",
    );
    expect(mapping).toEqual(
      expect.objectContaining({
        deliver: true,
        channel: "telegram",
        to: "-1003709908795:4011",
        agentId: "main",
      }),
    );
    const transformSource = fs.readFileSync(transformPath, "utf8");
    expect(transformSource).not.toContain("channel:");
    expect(transformSource).not.toContain("\n    to:");
    expect(detail).toEqual(
      expect.objectContaining({
        deliver: true,
        channel: "telegram",
        to: "-1003709908795:4011",
        agentId: "main",
      }),
    );
  });

  it("defaults mapping delivery channel to last and falls back to default agent", () => {
    const openclawDir = "/tmp/openclaw";
    const configPath = path.join(openclawDir, "openclaw.json");
    const fs = createMemoryFs({
      [configPath]: JSON.stringify({
        agents: {
          list: [{ id: "main", default: true }],
        },
      }),
    });

    createWebhook({
      fs,
      constants: { OPENCLAW_DIR: openclawDir },
      name: "plain-alerts",
    });

    const transformPath = path.join(
      openclawDir,
      getTransformRelativePath("plain-alerts"),
    );
    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    const mapping = (config?.hooks?.mappings || []).find(
      (entry) => entry?.match?.path === "plain-alerts",
    );
    expect(mapping).toEqual(
      expect.objectContaining({
        deliver: true,
        channel: "last",
        agentId: "main",
      }),
    );
    expect(Object.prototype.hasOwnProperty.call(mapping, "to")).toBe(false);
    const transformSource = fs.readFileSync(transformPath, "utf8");
    expect(transformSource).not.toContain("channel:");
    expect(transformSource).not.toContain("\n    to:");
  });

  it("falls back to default agent when destination agentId is unknown", () => {
    const openclawDir = "/tmp/openclaw";
    const configPath = path.join(openclawDir, "openclaw.json");
    const fs = createMemoryFs({
      [configPath]: JSON.stringify({
        agents: {
          list: [
            { id: "main", default: true },
            { id: "morpheus" },
          ],
        },
      }),
    });

    createWebhook({
      fs,
      constants: { OPENCLAW_DIR: openclawDir },
      name: "agent-fallback",
      destination: {
        channel: "telegram",
        to: "1050",
        agentId: "unknown-agent",
      },
    });

    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    const mapping = (config?.hooks?.mappings || []).find(
      (entry) => entry?.match?.path === "agent-fallback",
    );
    expect(mapping?.agentId).toBe("main");
  });
});
