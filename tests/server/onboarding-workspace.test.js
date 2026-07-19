const { resolveSetupUiUrl } = require("../../lib/server/onboarding/workspace");

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
});

describe("server/onboarding/workspace resolveSetupUiUrl fallbacks", () => {
  const kOriginalPublic = process.env.RAILWAY_PUBLIC_DOMAIN;
  const kOriginalStatic = process.env.RAILWAY_STATIC_URL;

  afterEach(() => {
    if (typeof kOriginalPublic === "undefined") {
      delete process.env.RAILWAY_PUBLIC_DOMAIN;
    } else {
      process.env.RAILWAY_PUBLIC_DOMAIN = kOriginalPublic;
    }
    if (typeof kOriginalStatic === "undefined") {
      delete process.env.RAILWAY_STATIC_URL;
    } else {
      process.env.RAILWAY_STATIC_URL = kOriginalStatic;
    }
  });

  it("falls back to the Railway static URL when set", () => {
    delete process.env.RAILWAY_PUBLIC_DOMAIN;
    process.env.RAILWAY_STATIC_URL = "https://static.example.com//";

    expect(resolveSetupUiUrl("")).toBe("https://static.example.com");
  });

  it("defaults to localhost when no railway env is present", () => {
    delete process.env.RAILWAY_PUBLIC_DOMAIN;
    delete process.env.RAILWAY_STATIC_URL;

    expect(resolveSetupUiUrl("")).toBe("http://localhost:3000");
  });
});

describe("server/onboarding/workspace bootstrap prompt sync", () => {
  const realFs = require("fs");
  const path = require("path");
  const {
    syncBootstrapPromptFiles,
    ensureOpenclawRuntimeArtifacts,
  } = require("../../lib/server/onboarding/workspace");
  const {
    OPENCLAW_DIR,
    WORKSPACE_DIR,
    kSetupDir,
  } = require("../../lib/server/constants");
  const { kRegistryPath } = require("../../lib/server/topic-registry");

  const kToolsTemplatePath = path.join(kSetupDir, "core-prompts", "TOOLS.md");
  const kAgentsSourcePath = path.join(kSetupDir, "core-prompts", "AGENTS.md");
  const kConfigPath = path.join(OPENCLAW_DIR, "openclaw.json");
  const kGoogleStatePath = path.join(OPENCLAW_DIR, "gogcli", "state.json");

  const stubRegistryRead = (registry) => {
    const original = realFs.readFileSync;
    vi.spyOn(realFs, "readFileSync").mockImplementation((target, ...rest) => {
      if (target === kRegistryPath) {
        if (registry === null) {
          throw Object.assign(new Error("ENOENT"), { code: "ENOENT" });
        }
        return JSON.stringify(registry);
      }
      return original.call(realFs, target, ...rest);
    });
  };

  it("writes bootstrap files for all agent workspaces with topics and google accounts", () => {
    stubRegistryRead({
      groups: {
        "-100123": {
          name: "Ops",
          topics: {
            42: { name: "Deploys" },
          },
        },
      },
    });

    const otherWorkspace = "/tmp/alphaclaw-other-workspace";
    const brokenWorkspace = "/tmp/alphaclaw-broken-workspace";
    const config = JSON.stringify({
      channels: {
        telegram: {
          accounts: {
            midas: {
              groups: { "-100123": { enabled: true } },
            },
          },
        },
      },
      agents: {
        list: [
          { id: "main", workspace: WORKSPACE_DIR },
          { id: "research", workspace: otherWorkspace },
          { id: "", workspace: "/tmp/ignored" },
          { id: "broken", workspace: brokenWorkspace },
        ],
      },
    });
    const googleState = JSON.stringify({
      version: 2,
      accounts: [
        {
          id: "acc1",
          email: "garry@example.com",
          client: "default",
          personal: true,
          authenticated: true,
          services: ["gmail:read"],
        },
        {
          id: "acc2",
          email: "",
          client: "",
          personal: false,
          authenticated: false,
          services: "not-an-array",
        },
      ],
      gmailPush: { token: "", topics: {} },
    });

    const mockFs = {
      readFileSync: vi.fn((target) => {
        if (target === kToolsTemplatePath) return "Setup: {{SETUP_UI_URL}}";
        if (target === kConfigPath) return config;
        if (target === kGoogleStatePath) return googleState;
        throw Object.assign(new Error("ENOENT"), { code: "ENOENT" });
      }),
      existsSync: vi.fn((target) => target === kGoogleStatePath),
      writeFileSync: vi.fn(),
      mkdirSync: vi.fn(),
      copyFileSync: vi.fn((src, dest) => {
        if (String(dest).startsWith(brokenWorkspace)) {
          throw new Error("read-only workspace");
        }
      }),
    };
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    syncBootstrapPromptFiles({
      fs: mockFs,
      workspaceDir: WORKSPACE_DIR,
      baseUrl: "https://setup.example.com",
    });

    const mainToolsWrite = mockFs.writeFileSync.mock.calls.find(
      ([target]) =>
        target === path.join(WORKSPACE_DIR, "hooks", "bootstrap", "TOOLS.md"),
    );
    expect(mainToolsWrite).toBeTruthy();
    expect(mainToolsWrite[1]).toContain("Setup: https://setup.example.com");
    expect(mainToolsWrite[1]).toContain("## Topic Registry");
    expect(mainToolsWrite[1]).toContain("| Ops (-100123) | Deploys | 42 |");
    expect(mainToolsWrite[1]).toContain("### Sync Rules");
    expect(mainToolsWrite[1]).toContain("## Available Google Accounts");
    expect(mainToolsWrite[1]).toContain(
      "- garry@example.com (type: personal; client: default; status: authenticated; services: gmail:read)",
    );
    expect(mainToolsWrite[1]).toContain(
      "- (unknown email) (type: company; client: default; status: awaiting sign-in",
    );

    const otherToolsWrite = mockFs.writeFileSync.mock.calls.find(
      ([target]) =>
        target === path.join(otherWorkspace, "hooks", "bootstrap", "TOOLS.md"),
    );
    expect(otherToolsWrite).toBeTruthy();
    expect(mockFs.copyFileSync).toHaveBeenCalledWith(
      kAgentsSourcePath,
      path.join(otherWorkspace, "hooks", "bootstrap", "AGENTS.md"),
    );
    expect(
      mockFs.writeFileSync.mock.calls.some(([target]) =>
        String(target).startsWith(brokenWorkspace),
      ),
    ).toBe(false);
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        `[onboard] Bootstrap sync skipped for ${brokenWorkspace}: read-only workspace`,
      ),
    );
  });

  it("degrades gracefully when config and google state are unreadable", () => {
    stubRegistryRead(null);
    const mockFs = {
      readFileSync: vi.fn((target) => {
        if (target === kToolsTemplatePath) return "Setup: {{SETUP_UI_URL}}";
        throw Object.assign(new Error("ENOENT"), { code: "ENOENT" });
      }),
      existsSync: vi.fn((target) => {
        if (target === kGoogleStatePath) {
          throw new Error("stat failed");
        }
        return false;
      }),
      writeFileSync: vi.fn(),
      mkdirSync: vi.fn(),
      copyFileSync: vi.fn(),
    };

    syncBootstrapPromptFiles({
      fs: mockFs,
      workspaceDir: "/tmp/alphaclaw-sync-workspace",
      baseUrl: "https://setup.example.com",
    });

    const toolsWrite = mockFs.writeFileSync.mock.calls.find(([target]) =>
      String(target).endsWith("TOOLS.md"),
    );
    expect(toolsWrite).toBeTruthy();
    expect(toolsWrite[1]).toBe("Setup: https://setup.example.com");
  });

  it("logs an error when bootstrap sync fails entirely", () => {
    const mockFs = {
      readFileSync: vi.fn(() => {
        throw new Error("template missing");
      }),
      existsSync: vi.fn(() => false),
      writeFileSync: vi.fn(),
      mkdirSync: vi.fn(),
      copyFileSync: vi.fn(),
    };
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    syncBootstrapPromptFiles({
      fs: mockFs,
      workspaceDir: "/tmp/alphaclaw-sync-workspace",
      baseUrl: "https://setup.example.com",
    });

    expect(errorSpy).toHaveBeenCalledWith(
      "[onboard] Bootstrap prompt sync error:",
      "template missing",
    );
  });

  it("symlinks the env file into the openclaw dir when missing", () => {
    const openclawDir = "/tmp/alphaclaw-artifacts";
    const envFilePath = "/tmp/alphaclaw-env-file";
    const mockFs = {
      existsSync: vi.fn((target) => {
        if (target === path.join(openclawDir, ".env")) return false;
        if (target === envFilePath) return true;
        if (target === path.join(openclawDir, "gogcli", "config.json")) {
          return true;
        }
        return false;
      }),
      symlinkSync: vi.fn(),
      mkdirSync: vi.fn(),
    };

    ensureOpenclawRuntimeArtifacts({ fs: mockFs, openclawDir, envFilePath });

    expect(mockFs.symlinkSync).toHaveBeenCalledWith(
      envFilePath,
      path.join(openclawDir, ".env"),
    );
    expect(mockFs.mkdirSync).not.toHaveBeenCalled();
  });

  it("logs and continues when the env symlink fails", () => {
    const openclawDir = "/tmp/alphaclaw-artifacts";
    const envFilePath = "/tmp/alphaclaw-env-file";
    const mockFs = {
      existsSync: vi.fn((target) => {
        if (target === path.join(openclawDir, ".env")) return false;
        if (target === envFilePath) return true;
        if (target === path.join(openclawDir, "gogcli", "config.json")) {
          return true;
        }
        return false;
      }),
      symlinkSync: vi.fn(() => {
        throw new Error("EPERM: operation not permitted");
      }),
      mkdirSync: vi.fn(),
    };
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    ensureOpenclawRuntimeArtifacts({ fs: mockFs, openclawDir, envFilePath });

    expect(logSpy).toHaveBeenCalledWith(
      "[alphaclaw] .env symlink skipped: EPERM: operation not permitted",
    );
  });
});
