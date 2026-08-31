const fs = require("fs");
const os = require("os");
const path = require("path");
const {
  resolveSetupUiUrl,
  syncBootstrapPromptFiles,
} = require("../../lib/server/onboarding/workspace");

describe("server/onboarding/workspace", () => {
  const kOriginalRailwayPublicDomain = process.env.RAILWAY_PUBLIC_DOMAIN;

  afterEach(() => {
    if (typeof kOriginalRailwayPublicDomain === "undefined") {
      delete process.env.RAILWAY_PUBLIC_DOMAIN;
      return;
    }
    process.env.RAILWAY_PUBLIC_DOMAIN = kOriginalRailwayPublicDomain;
  });

  it("falls back to Railway public domain when no explicit base URL is provided", () => {
    process.env.RAILWAY_PUBLIC_DOMAIN = "alphaclaw-production.up.railway.app";

    expect(resolveSetupUiUrl("")).toBe(
      "https://alphaclaw-production.up.railway.app",
    );
  });

  it("merges managed tool guidance into AGENTS.md and removes the legacy file", () => {
    const openclawDir = fs.mkdtempSync(
      path.join(os.tmpdir(), "alphaclaw-bootstrap-config-"),
    );
    const workspaceDir = path.join(openclawDir, "workspace");
    const bootstrapDir = path.join(workspaceDir, "hooks", "bootstrap");
    fs.mkdirSync(bootstrapDir, { recursive: true });
    fs.writeFileSync(path.join(bootstrapDir, "TOOLS.md"), "legacy", "utf8");
    fs.writeFileSync(
      path.join(openclawDir, "openclaw.json"),
      JSON.stringify({
        hooks: {
          internal: {
            entries: {
              "bootstrap-extra-files": {
                paths: ["hooks/bootstrap/TOOLS.md", "custom/USER.md"],
              },
            },
          },
        },
      }),
      "utf8",
    );

    syncBootstrapPromptFiles({
      fs,
      workspaceDir,
      openclawDir,
      baseUrl: "https://setup.example.com",
    });

    const agentsContent = fs.readFileSync(
      path.join(bootstrapDir, "AGENTS.md"),
      "utf8",
    );
    expect(agentsContent).toContain("Persistent Storage Rules");
    expect(agentsContent).toContain("## AlphaClaw Harness");
    expect(agentsContent).toContain("https://setup.example.com");
    expect(fs.existsSync(path.join(bootstrapDir, "TOOLS.md"))).toBe(false);
    const config = JSON.parse(
      fs.readFileSync(path.join(openclawDir, "openclaw.json"), "utf8"),
    );
    expect(config.hooks.internal.entries["bootstrap-extra-files"]).toEqual({
      enabled: true,
      paths: ["hooks/bootstrap/AGENTS.md", "custom/USER.md"],
    });
  });
});
