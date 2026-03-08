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
  it("writes channel and to into the default transform when destination is provided", () => {
    const openclawDir = "/tmp/openclaw";
    const configPath = path.join(openclawDir, "openclaw.json");
    const fs = createMemoryFs({
      [configPath]: JSON.stringify({}),
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

    const transformPath = path.join(
      openclawDir,
      getTransformRelativePath("gmail-alerts"),
    );
    const transformSource = fs.readFileSync(transformPath, "utf8");
    expect(transformSource).toContain('channel: "telegram"');
    expect(transformSource).toContain('to: "-1003709908795:4011"');
  });

  it("keeps the default transform unchanged when no destination is provided", () => {
    const openclawDir = "/tmp/openclaw";
    const configPath = path.join(openclawDir, "openclaw.json");
    const fs = createMemoryFs({
      [configPath]: JSON.stringify({}),
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
    const transformSource = fs.readFileSync(transformPath, "utf8");
    expect(transformSource).not.toContain("channel:");
    expect(transformSource).not.toContain("\n    to:");
  });
});
