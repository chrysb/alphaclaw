const path = require("path");
const os = require("os");
const express = require("express");
const request = require("supertest");

const { registerOnboardingRoutes } = require("../../lib/server/routes/onboarding");
const { kSetupDir } = require("../../lib/server/constants");

const createBaseDeps = ({ onboarded = false, hasCodexOauth = false } = {}) => {
  const kOnboardingMarkerPath = "/tmp/alphaclaw/onboarded.json";
  return {
    fs: {
      mkdirSync: vi.fn(),
      existsSync: vi.fn((targetPath) =>
        onboarded ? targetPath === kOnboardingMarkerPath : false,
      ),
      statSync: vi.fn(() => {
        throw Object.assign(new Error("ENOENT"), { code: "ENOENT" });
      }),
      readdirSync: vi.fn(() => []),
      copyFileSync: vi.fn(),
      rmSync: vi.fn(),
      renameSync: vi.fn(),
      readFileSync: vi.fn(() => "{}"),
      writeFileSync: vi.fn(),
      appendFileSync: vi.fn(),
    },
    constants: {
      OPENCLAW_DIR: "/tmp/openclaw",
      WORKSPACE_DIR: "/tmp/openclaw/workspace",
      kOnboardingMarkerPath,
      kSystemVars: new Set(["WEBHOOK_TOKEN", "OPENCLAW_GATEWAY_TOKEN"]),
      kKnownKeys: new Set([
        "OPENAI_API_KEY",
        "GITHUB_TOKEN",
        "GITHUB_WORKSPACE_REPO",
        "TELEGRAM_BOT_TOKEN",
        "SLACK_BOT_TOKEN",
      ]),
    },
    shellCmd: vi.fn(async () => ""),
    gatewayEnv: vi.fn(() => ({ OPENCLAW_GATEWAY_TOKEN: "tok" })),
    readEnvFile: vi.fn(() => []),
    writeEnvFile: vi.fn(),
    reloadEnv: vi.fn(),
    isOnboarded: vi.fn(() => onboarded),
    resolveGithubRepoUrl: vi.fn((value) => value),
    resolveModelProvider: vi.fn((modelKey) => String(modelKey).split("/")[0]),
    hasCodexOauthProfile: vi.fn(() => hasCodexOauth),
    authProfiles: {
      getEnvVarForApiKeyProvider: vi.fn((provider) => {
        const envKeys = {
          anthropic: "ANTHROPIC_API_KEY",
          openai: "OPENAI_API_KEY",
          google: "GEMINI_API_KEY",
        };
        return envKeys[provider] || "";
      }),
      upsertApiKeyProfileForEnvVar: vi.fn(),
      syncConfigAuthReferencesForAgent: vi.fn(),
    },
    ensureGatewayProxyConfig: vi.fn(),
    getBaseUrl: vi.fn(() => "https://example.com"),
    startGateway: vi.fn(),
  };
};

const createApp = (deps) => {
  const app = express();
  app.use(express.json());
  registerOnboardingRoutes({ app, ...deps });
  return app;
};

const makeValidBody = () => ({
  modelKey: "openai/gpt-5.1-codex",
  vars: [
    { key: "OPENAI_API_KEY", value: "sk-test-123456789" },
    { key: "GITHUB_TOKEN", value: "ghp_test_123456789" },
    { key: "GITHUB_WORKSPACE_REPO", value: "owner/repo" },
    { key: "TELEGRAM_BOT_TOKEN", value: "telegram_123456789" },
  ],
});

const mockGithubVerifyAndCreate = ({
  repoStatus = 404,
  repoOk = false,
  createOk = true,
  scopes = "repo",
  login = "owner",
} = {}) => {
  global.fetch.mockResolvedValueOnce({
    ok: true,
    headers: { get: () => scopes },
    json: async () => ({ login }),
  });
  global.fetch.mockResolvedValueOnce({
    ok: repoOk,
    status: repoStatus,
    statusText: repoStatus === 404 ? "Not Found" : "OK",
    json: async () => ({ message: repoStatus === 404 ? "Not Found" : "exists" }),
  });
  if (repoStatus === 404 && login === "owner") {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      headers: { get: () => "" },
      json: async () => [],
    });
  }
  global.fetch.mockResolvedValueOnce({
    ok: createOk,
    status: createOk ? 201 : 400,
    statusText: createOk ? "Created" : "Bad Request",
    json: async () => (createOk ? {} : { message: "create failed" }),
  });
};

describe("server/routes/onboarding", () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  it("returns onboard status from dependency", async () => {
    const deps = createBaseDeps({ onboarded: true });
    const app = createApp(deps);

    const res = await request(app).get("/api/onboard/status");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ onboarded: true });
  });

  it("short-circuits when already onboarded", async () => {
    const deps = createBaseDeps({ onboarded: true });
    const app = createApp(deps);

    const res = await request(app).post("/api/onboard").send(makeValidBody());

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: false, error: "Already onboarded" });
  });

  it("validates missing vars array", async () => {
    const deps = createBaseDeps();
    const app = createApp(deps);

    const res = await request(app).post("/api/onboard").send({ modelKey: "openai/gpt-5.1" });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ ok: false, error: "Missing vars array" });
  });

  it("validates missing model selection", async () => {
    const deps = createBaseDeps();
    const app = createApp(deps);

    const res = await request(app).post("/api/onboard").send({ vars: [] });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ ok: false, error: "A model selection is required" });
  });

  it("rejects overly large env var values before running onboarding", async () => {
    const deps = createBaseDeps();
    const app = createApp(deps);
    const body = makeValidBody();
    body.vars = body.vars.map((entry) =>
      entry.key === "OPENAI_API_KEY"
        ? { ...entry, value: "x".repeat(5000) }
        : entry,
    );

    const res = await request(app).post("/api/onboard").send(body);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      ok: false,
      error: "Value too long for OPENAI_API_KEY (max 4096 chars)",
    });
    expect(deps.shellCmd).not.toHaveBeenCalled();
  });

  it("requires codex oauth for openai-codex provider", async () => {
    const deps = createBaseDeps({ hasCodexOauth: false });
    const app = createApp(deps);

    const body = {
      modelKey: "openai-codex/gpt-5.3-codex",
      vars: [
        { key: "GITHUB_TOKEN", value: "ghp_test_123456789" },
        { key: "GITHUB_WORKSPACE_REPO", value: "owner/repo" },
        { key: "TELEGRAM_BOT_TOKEN", value: "telegram_123456789" },
      ],
    };

    const res = await request(app).post("/api/onboard").send(body);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      ok: false,
      error: "Connect OpenAI Codex OAuth before continuing",
    });
  });

  it("rejects anthropic setup tokens with the wrong prefix", async () => {
    const deps = createBaseDeps();
    const app = createApp(deps);

    const res = await request(app).post("/api/onboard").send({
      modelKey: "anthropic/claude-opus-4-6",
      vars: [
        { key: "ANTHROPIC_TOKEN", value: "sk-ant-api03-not-a-setup-token" },
        { key: "GITHUB_TOKEN", value: "ghp_test_123456789" },
        { key: "GITHUB_WORKSPACE_REPO", value: "owner/repo" },
        { key: "TELEGRAM_BOT_TOKEN", value: "telegram_123456789" },
      ],
    });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      ok: false,
      error: "ANTHROPIC_TOKEN must start with sk-ant-oat01-",
    });
    expect(deps.shellCmd).not.toHaveBeenCalled();
  });

  it("returns github error when repository check fails", async () => {
    const deps = createBaseDeps();
    const app = createApp(deps);
    global.fetch.mockRejectedValue(new Error("network down"));

    const res = await request(app).post("/api/onboard").send(makeValidBody());

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      ok: false,
      error: "GitHub verification error: network down",
    });
    expect(deps.writeEnvFile).toHaveBeenCalledTimes(1);
    expect(deps.reloadEnv).toHaveBeenCalledTimes(1);
  });

  it("allows existing source repos owned by a different accessible org", async () => {
    const deps = createBaseDeps();
    const app = createApp(deps);
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        headers: { get: () => "repo" },
        json: async () => ({ login: "owner" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: "OK",
        json: async () => ({ full_name: "my-org/source-repo" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: "OK",
        json: async () => [{ sha: "abc123" }],
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [
          { name: "package.json", type: "file" },
          { name: "src", type: "dir" },
        ],
      });
    deps.shellCmd.mockResolvedValueOnce("");

    const verifyRes = await request(app).post("/api/onboard/github/verify").send({
      repo: "my-org/source-repo",
      token: "ghp_test_123456789",
      mode: "existing",
    });

    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body).toMatchObject({
      ok: true,
      repoExists: true,
      repoIsEmpty: false,
    });
  });

  it("allows new workspace repos owned by organizations when github verification passes", async () => {
    const deps = createBaseDeps();
    const app = createApp(deps);
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        headers: { get: () => "repo" },
        json: async () => ({ login: "tokudu" }),
      })
      .mockResolvedValueOnce({
        status: 404,
        ok: false,
        statusText: "Not Found",
        json: async () => ({ message: "Not Found" }),
      });

    const res = await request(app).post("/api/onboard/github/verify").send({
      repo: "make-stories/new-repo",
      token: "ghp_test_123456789",
      mode: "new",
    });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      ok: true,
      repoExists: false,
      repoIsEmpty: false,
      tempDir: null,
    });
  });

  it("surfaces a hidden repo-name conflict during github verification", async () => {
    const deps = createBaseDeps();
    const app = createApp(deps);
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        headers: { get: () => "repo" },
        json: async () => ({ login: "owner" }),
      })
      .mockResolvedValueOnce({
        status: 404,
        ok: false,
        statusText: "Not Found",
        json: async () => ({ message: "Not Found" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        headers: { get: () => "" },
        json: async () => [{ name: "repo", full_name: "owner/repo" }],
      });

    const res = await request(app).post("/api/onboard/github/verify").send({
      repo: "owner/repo",
      token: "github_pat_hidden_repo_token",
      mode: "new",
    });

    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
    expect(res.body.error).toContain('Repository "owner/repo" already exists');
    expect(res.body.error).toContain("cannot inspect");
  });

  it("installs deterministic hourly git sync cron during successful onboarding", async () => {
    const deps = createBaseDeps();
    deps.fs.readFileSync.mockImplementation((p) => {
      if (p === "/tmp/openclaw/openclaw.json") return "{}";
      if (p === path.join(kSetupDir, "core-prompts", "TOOLS.md")) return "Setup: {{SETUP_UI_URL}}";
      if (p === path.join(kSetupDir, "hourly-git-sync.sh")) return "echo Auto-commit hourly sync";
      return "{}";
    });
    const app = createApp(deps);
    mockGithubVerifyAndCreate();

    const res = await request(app).post("/api/onboard").send(makeValidBody());

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
    expect(deps.startGateway).toHaveBeenCalledTimes(1);
    expect(deps.authProfiles.upsertApiKeyProfileForEnvVar).toHaveBeenCalledWith(
      "openai",
      "sk-test-123456789",
    );
    expect(deps.authProfiles.syncConfigAuthReferencesForAgent).toHaveBeenCalledTimes(1);
    expect(deps.fs.copyFileSync).toHaveBeenCalledWith(
      path.join(kSetupDir, "core-prompts", "AGENTS.md"),
      "/tmp/openclaw/workspace/hooks/bootstrap/AGENTS.md",
    );
    const toolsWriteCall = deps.fs.writeFileSync.mock.calls.find(
      ([path]) => path === "/tmp/openclaw/workspace/hooks/bootstrap/TOOLS.md",
    );
    expect(toolsWriteCall).toBeTruthy();
    expect(toolsWriteCall[1]).toContain("https://example.com");

    expect(deps.fs.writeFileSync).toHaveBeenCalledWith(
      "/tmp/openclaw/.alphaclaw/hourly-git-sync.sh",
      expect.stringContaining("Auto-commit hourly sync"),
      expect.objectContaining({ mode: 0o755 }),
    );

    expect(deps.fs.writeFileSync).toHaveBeenCalledWith(
      "/etc/cron.d/openclaw-hourly-sync",
      expect.stringContaining(
        '0 * * * * root bash "/tmp/openclaw/.alphaclaw/hourly-git-sync.sh"',
      ),
      expect.objectContaining({ mode: 0o644 }),
    );

    expect(deps.fs.writeFileSync).toHaveBeenCalledWith(
      "/tmp/alphaclaw/onboarded.json",
      expect.stringContaining('"reason": "onboarding_complete"'),
    );

    const initialPushCall = deps.shellCmd.mock.calls.find(([cmd]) =>
      cmd.includes('alphaclaw git-sync -m "initial setup"'),
    );
    expect(initialPushCall).toBeTruthy();

    const gitInitCall = deps.shellCmd.mock.calls.find(([cmd]) =>
      cmd.includes('git remote add origin "https://github.com/owner/repo.git"'),
    );
    expect(gitInitCall).toBeTruthy();
    expect(gitInitCall[0]).not.toContain("ghp_test_123456789");

    const openclawWriteCall = deps.fs.writeFileSync.mock.calls.find(
      ([path]) => path === "/tmp/openclaw/openclaw.json",
    );
    expect(openclawWriteCall).toBeTruthy();
    const writtenConfig = JSON.parse(openclawWriteCall[1]);
    expect(writtenConfig.hooks.internal.enabled).toBe(true);
    expect(writtenConfig.hooks.internal.entries["bootstrap-extra-files"]).toEqual({
      enabled: true,
      paths: ["hooks/bootstrap/AGENTS.md", "hooks/bootstrap/TOOLS.md"],
    });
  });

  it("rejects onboarding when workspace repo already exists", async () => {
    const deps = createBaseDeps();
    deps.fs.readFileSync.mockImplementation((p) => {
      if (p === "/tmp/openclaw/openclaw.json") return "{}";
      if (p === path.join(kSetupDir, "hourly-git-sync.sh")) return "echo Auto-commit hourly sync";
      return "{}";
    });
    const app = createApp(deps);
    mockGithubVerifyAndCreate({ repoStatus: 200, repoOk: true, createOk: true });

    const res = await request(app).post("/api/onboard").send(makeValidBody());

    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
    expect(res.body.error).toContain('Repository "owner/repo" already exists');
  });

  it("seeds anthropic api key auth profile during onboarding", async () => {
    const deps = createBaseDeps();
    deps.fs.readFileSync.mockImplementation((p) => {
      if (p === "/tmp/openclaw/openclaw.json") return "{}";
      if (p === path.join(kSetupDir, "core-prompts", "TOOLS.md")) return "Setup: {{SETUP_UI_URL}}";
      if (p === path.join(kSetupDir, "hourly-git-sync.sh")) return "echo Auto-commit hourly sync";
      return "{}";
    });
    const app = createApp(deps);
    mockGithubVerifyAndCreate();

    const res = await request(app).post("/api/onboard").send({
      modelKey: "anthropic/claude-opus-4-6",
      vars: [
        { key: "ANTHROPIC_API_KEY", value: "sk-ant-api03-123456789" },
        { key: "GITHUB_TOKEN", value: "ghp_test_123456789" },
        { key: "GITHUB_WORKSPACE_REPO", value: "owner/repo" },
        { key: "TELEGRAM_BOT_TOKEN", value: "telegram_123456789" },
      ],
    });

    expect(res.status).toBe(200);
    expect(deps.authProfiles.upsertApiKeyProfileForEnvVar).toHaveBeenCalledWith(
      "anthropic",
      "sk-ant-api03-123456789",
    );
    expect(deps.authProfiles.syncConfigAuthReferencesForAgent).toHaveBeenCalledTimes(1);
  });

  it("removes stale anthropic token env state when onboarding with an api key", async () => {
    const deps = createBaseDeps();
    deps.readEnvFile.mockReturnValue([
      { key: "ANTHROPIC_TOKEN", value: "sk-ant-oat01-stale-token" },
      { key: "GITHUB_TOKEN", value: "ghp_old" },
    ]);
    deps.fs.readFileSync.mockImplementation((p) => {
      if (p === "/tmp/openclaw/openclaw.json") return "{}";
      if (p === path.join(kSetupDir, "core-prompts", "TOOLS.md")) return "Setup: {{SETUP_UI_URL}}";
      if (p === path.join(kSetupDir, "hourly-git-sync.sh")) return "echo Auto-commit hourly sync";
      return "{}";
    });
    const app = createApp(deps);
    mockGithubVerifyAndCreate();

    const res = await request(app).post("/api/onboard").send({
      modelKey: "anthropic/claude-opus-4-6",
      vars: [
        { key: "ANTHROPIC_API_KEY", value: "sk-ant-api-fresh-123456789" },
        { key: "GITHUB_TOKEN", value: "ghp_test_123456789" },
        { key: "GITHUB_WORKSPACE_REPO", value: "owner/repo" },
        { key: "TELEGRAM_BOT_TOKEN", value: "telegram_123456789" },
      ],
    });

    expect(res.status).toBe(200);
    expect(deps.writeEnvFile).toHaveBeenCalled();
    const savedVars = deps.writeEnvFile.mock.calls.at(-1)[0];
    expect(savedVars.some((entry) => entry.key === "ANTHROPIC_TOKEN")).toBe(false);

    const onboardCall = deps.shellCmd.mock.calls.find(([cmd]) =>
      cmd.startsWith("openclaw onboard "),
    );
    expect(onboardCall).toBeTruthy();
    expect(onboardCall[0]).toContain("--anthropic-api-key");
    expect(onboardCall[0]).not.toContain("--token-provider");
    expect(onboardCall[0]).not.toContain("sk-ant-oat01-stale-token");
    expect(onboardCall[1]).toMatchObject({
      env: expect.objectContaining({
        OPENCLAW_CONFIG_PATH: "/tmp/openclaw/openclaw.json",
        OPENCLAW_STATE_DIR: "/tmp/openclaw",
        XDG_CONFIG_HOME: "/tmp/openclaw",
      }),
    });
  });

  it("sanitizes onboarding command failures to avoid leaking secrets", async () => {
    const deps = createBaseDeps();
    const app = createApp(deps);
    mockGithubVerifyAndCreate();
    deps.shellCmd.mockRejectedValueOnce(
      new Error('Command failed: openclaw onboard --openai-api-key "sk-test-secret-value"'),
    );

    const res = await request(app).post("/api/onboard").send(makeValidBody());

    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      ok: false,
      error: "Onboarding command failed. Please verify credentials and try again.",
    });
  });

  it("redacts fine-grained GitHub tokens from onboarding errors", async () => {
    const deps = createBaseDeps();
    const app = createApp(deps);
    mockGithubVerifyAndCreate();
    deps.shellCmd.mockRejectedValueOnce(
      new Error('boom github_pat_super_secret_value openclaw onboard'),
    );

    const res = await request(app).post("/api/onboard").send(makeValidBody());

    expect(res.status).toBe(500);
    expect(res.body.ok).toBe(false);
    expect(res.body.error).not.toContain("github_pat_super_secret_value");
    expect(res.body.error).toContain("***");
  });

  it("returns a helpful OOM message when onboarding runs out of memory", async () => {
    const deps = createBaseDeps();
    const app = createApp(deps);
    mockGithubVerifyAndCreate();
    deps.shellCmd.mockRejectedValueOnce(
      new Error("FATAL ERROR: Ineffective mark-compacts near heap limit Allocation failed - JavaScript heap out of memory"),
    );

    const res = await request(app).post("/api/onboard").send(makeValidBody());

    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      ok: false,
      error:
        "Onboarding ran out of memory. Please retry, and if it persists increase instance memory.",
    });
  });

  it("returns a helpful GitHub permissions message for repo access failures", async () => {
    const deps = createBaseDeps();
    const app = createApp(deps);
    mockGithubVerifyAndCreate();
    const err = new Error("Command failed: openclaw onboard");
    err.stderr = "remote: Permission to owner/repo denied to user";
    deps.shellCmd.mockRejectedValueOnce(err);

    const res = await request(app).post("/api/onboard").send(makeValidBody());

    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      ok: false,
      error:
        "GitHub access failed. Verify your token permissions and workspace repo, then try again.",
    });
  });

  it("returns a helpful provider auth message for invalid credentials", async () => {
    const deps = createBaseDeps();
    const app = createApp(deps);
    mockGithubVerifyAndCreate();
    deps.shellCmd.mockRejectedValueOnce(new Error("invalid_api_key"));

    const res = await request(app).post("/api/onboard").send(makeValidBody());

    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      ok: false,
      error:
        "Model provider authentication failed. Check your API key/token and try again.",
    });
  });

  it("fills missing imported env refs with placeholders during import onboarding", async () => {
    const deps = createBaseDeps();
    mockGithubVerifyAndCreate();
    const files = new Map([
      [
        "/tmp/openclaw/openclaw.json",
        JSON.stringify({
          env: {
            vars: {
              NOTION_API_KEY: "${NOTION_API_KEY}",
            },
          },
          hooks: {
            token: "${WEBHOOK_TOKEN}",
            transformsDir: "/root/.openclaw/hooks/transforms",
          },
          channels: {
            $include: "channels.json",
          },
          gateway: {
            auth: {
              token: "${GATEWAY_AUTH_TOKEN}",
            },
          },
          talk: {
            apiKey: "${ELEVENLABS_API_KEY}",
          },
        }),
      ],
      [
        "/tmp/openclaw/channels.json",
        JSON.stringify({
          slack: {
            botToken: "${SLACK_BOT_TOKEN}",
            appToken: "${SLACK_APP_TOKEN}",
            userToken: "${SLACK_USER_TOKEN}",
          },
        }),
      ],
      ["/tmp/openclaw/.git", "gitdir"],
      [path.join(kSetupDir, "core-prompts", "TOOLS.md"), "Setup: {{SETUP_UI_URL}}"],
      [path.join(kSetupDir, "hourly-git-sync.sh"), "echo Auto-commit hourly sync"],
    ]);
    deps.fs.existsSync.mockImplementation((targetPath) => files.has(targetPath));
    deps.fs.readFileSync.mockImplementation((targetPath) => files.get(targetPath) || "{}");
    deps.fs.writeFileSync.mockImplementation((targetPath, contents) => {
      files.set(targetPath, String(contents));
    });
    const app = createApp(deps);

    const res = await request(app).post("/api/onboard").send({
      ...makeValidBody(),
      vars: makeValidBody().vars.map((entry) =>
        entry.key === "GITHUB_WORKSPACE_REPO"
          ? { ...entry, value: "owner/target-repo" }
          : entry,
      ),
      importMode: true,
    });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
    expect(deps.writeEnvFile).toHaveBeenCalledWith(
      expect.arrayContaining([
        { key: "GITHUB_WORKSPACE_REPO", value: "owner/target-repo" },
        { key: "SLACK_BOT_TOKEN", value: "placeholder" },
        { key: "SLACK_APP_TOKEN", value: "placeholder" },
        { key: "SLACK_USER_TOKEN", value: "placeholder" },
        { key: "ELEVENLABS_API_KEY", value: "placeholder" },
        { key: "NOTION_API_KEY", value: "placeholder" },
      ]),
    );
    expect(
      deps.writeEnvFile.mock.calls.some(([vars]) =>
        Array.isArray(vars) &&
        vars.some((entry) => entry.key === "GATEWAY_AUTH_TOKEN"),
      ),
    ).toBe(false);
    expect(files.get("/tmp/openclaw/openclaw.json")).toContain(
      '"token": "${OPENCLAW_GATEWAY_TOKEN}"',
    );
    expect(files.get("/tmp/openclaw/openclaw.json")).toContain(
      '"botToken": "${TELEGRAM_BOT_TOKEN}"',
    );
    expect(files.get("/tmp/openclaw/openclaw.json")).toContain(
      '"usage-tracker"',
    );
    expect(files.get("/tmp/openclaw/openclaw.json")).toContain(
      '"bootstrap-extra-files"',
    );
    expect(files.get("/tmp/openclaw/openclaw.json")).toContain(
      '"strictInlineEval": false',
    );
    expect(files.get("/tmp/openclaw/openclaw.json")).not.toContain(
      '"transformsDir"',
    );
    expect(files.get("/tmp/openclaw/exec-approvals.json")).toContain(
      '"askFallback": "full"',
    );
    expect(
      deps.shellCmd.mock.calls.some(([cmd]) =>
        cmd.includes(
          'git init -b main && git remote add origin "https://github.com/owner/target-repo.git"',
        ),
      ),
    ).toBe(true);
    expect(deps.shellCmd).toHaveBeenCalledWith(
      'openclaw models set "openai/gpt-5.1-codex"',
      expect.objectContaining({
        env: { OPENCLAW_GATEWAY_TOKEN: "tok" },
      }),
    );
  });

  it("does not treat nested openclaw config as an imported config during completion", async () => {
    const deps = createBaseDeps();
    mockGithubVerifyAndCreate();
    const files = new Map([
      [
        "/tmp/openclaw/.openclaw/openclaw.json",
        JSON.stringify({
          agents: {
            defaults: {
              model: {
                primary: "openai/gpt-5.1-codex",
              },
            },
          },
        }),
      ],
      [path.join(kSetupDir, "core-prompts", "TOOLS.md"), "Setup: {{SETUP_UI_URL}}"],
      [path.join(kSetupDir, "hourly-git-sync.sh"), "echo Auto-commit hourly sync"],
    ]);
    deps.fs.existsSync.mockImplementation((targetPath) => files.has(targetPath));
    deps.fs.readFileSync.mockImplementation((targetPath) => files.get(targetPath) || "{}");
    deps.fs.writeFileSync.mockImplementation((targetPath, contents) => {
      files.set(targetPath, String(contents));
    });
    const app = createApp(deps);

    const res = await request(app).post("/api/onboard").send({
      ...makeValidBody(),
      importMode: true,
    });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
    expect(
      deps.shellCmd.mock.calls.some(([cmd]) => cmd.startsWith("openclaw onboard ")),
    ).toBe(true);
    expect(
      deps.shellCmd.mock.calls.some(([cmd]) => cmd.includes('git remote set-url origin')),
    ).toBe(false);
    expect(
      deps.shellCmd.mock.calls.some(([cmd]) =>
        cmd.includes('git init -b main && git remote add origin "https://github.com/owner/repo.git"'),
      ),
    ).toBe(true);
  });

  it("creates the target repo during import onboarding before git-sync", async () => {
    const deps = createBaseDeps();
    mockGithubVerifyAndCreate({
      repoStatus: 404,
      repoOk: false,
      createOk: true,
      login: "owner",
    });
    const files = new Map([
      ["/tmp/openclaw/openclaw.json", JSON.stringify({ gateway: { auth: {} } })],
      ["/tmp/openclaw/.git", "gitdir"],
      [path.join(kSetupDir, "core-prompts", "TOOLS.md"), "Setup: {{SETUP_UI_URL}}"],
      [path.join(kSetupDir, "hourly-git-sync.sh"), "echo Auto-commit hourly sync"],
    ]);
    deps.fs.existsSync.mockImplementation((targetPath) => files.has(targetPath));
    deps.fs.readFileSync.mockImplementation((targetPath) => files.get(targetPath) || "{}");
    deps.fs.writeFileSync.mockImplementation((targetPath, contents) => {
      files.set(targetPath, String(contents));
    });
    const app = createApp(deps);

    const res = await request(app).post("/api/onboard").send({
      ...makeValidBody(),
      vars: makeValidBody().vars.map((entry) =>
        entry.key === "GITHUB_WORKSPACE_REPO"
          ? { ...entry, value: "owner/import-target" }
          : entry,
      ),
      importMode: true,
    });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
    expect(global.fetch).toHaveBeenCalledWith(
      "https://api.github.com/user/repos",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          name: "import-target",
          private: true,
          auto_init: false,
        }),
      }),
    );
    expect(
      deps.shellCmd.mock.calls.some(([cmd]) =>
        cmd.includes(
          'git init -b main && git remote add origin "https://github.com/owner/import-target.git"',
        ),
      ),
    ).toBe(true);
    expect(
      deps.shellCmd.mock.calls.some(([cmd]) =>
        cmd.includes('alphaclaw git-sync -m "imported existing setup via AlphaClaw"'),
      ),
    ).toBe(true);
  });

  it("rejects nested .openclaw import sources during scan", async () => {
    const deps = createBaseDeps();
    const tempDir = path.join(os.tmpdir(), "alphaclaw-import-nested");
    deps.fs.existsSync.mockImplementation((targetPath) => targetPath === tempDir);
    deps.fs.statSync.mockImplementation((targetPath) => {
      if (targetPath === tempDir || targetPath === `${tempDir}/.openclaw`) {
        return { isFile: () => false, isDirectory: () => true };
      }
      if (targetPath === `${tempDir}/.openclaw/openclaw.json`) {
        return { isFile: () => true, isDirectory: () => false };
      }
      throw Object.assign(new Error("ENOENT"), { code: "ENOENT" });
    });
    deps.fs.readdirSync.mockImplementation((targetPath) => {
      if (targetPath === tempDir) {
        return [{ name: ".openclaw", isFile: () => false, isDirectory: () => true }];
      }
      if (targetPath === `${tempDir}/.openclaw`) {
        return [{ name: "openclaw.json", isFile: () => true, isDirectory: () => false }];
      }
      return [];
    });
    deps.fs.readFileSync.mockImplementation((targetPath) =>
      targetPath === `${tempDir}/.openclaw/openclaw.json` ? "{}" : "{}",
    );
    const app = createApp(deps);

    const res = await request(app).post("/api/onboard/import/scan").send({ tempDir });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      ok: false,
      error:
        "This import source contains a nested .openclaw config. Point the source at the OpenClaw root itself, or at a workspace-only repo instead.",
    });
  });

  it("promotes workspace-only imports into WORKSPACE_DIR", async () => {
    const deps = createBaseDeps();
    const tempDir = path.join(os.tmpdir(), "alphaclaw-import-workspace");
    deps.fs.existsSync.mockImplementation((targetPath) => {
      if (
        targetPath === tempDir ||
        targetPath === `${tempDir}/workspace` ||
        targetPath === `${tempDir}/workspace/skills` ||
        targetPath === `${tempDir}/workspace/skills/email`
      ) {
        return true;
      }
      return false;
    });
    deps.fs.statSync.mockImplementation((targetPath) => {
      if (
        targetPath === tempDir ||
        targetPath === `${tempDir}/workspace` ||
        targetPath === `${tempDir}/workspace/skills` ||
        targetPath === `${tempDir}/workspace/skills/email`
      ) {
        return { isFile: () => false, isDirectory: () => true };
      }
      if (targetPath === `${tempDir}/workspace/skills/email/SKILL.md`) {
        return { isFile: () => true, isDirectory: () => false };
      }
      throw Object.assign(new Error("ENOENT"), { code: "ENOENT" });
    });
    deps.fs.readdirSync.mockImplementation((targetPath) => {
      if (targetPath === tempDir) {
        return [{ name: "workspace", isFile: () => false, isDirectory: () => true }];
      }
      if (targetPath === `${tempDir}/workspace`) {
        return [{ name: "skills", isFile: () => false, isDirectory: () => true }];
      }
      if (targetPath === `${tempDir}/workspace/skills`) {
        return [{ name: "email", isFile: () => false, isDirectory: () => true }];
      }
      if (targetPath === `${tempDir}/workspace/skills/email`) {
        return [{ name: "SKILL.md", isFile: () => true, isDirectory: () => false }];
      }
      return [];
    });
    deps.fs.readFileSync.mockImplementation(() => "{}");
    const app = createApp(deps);

    const res = await request(app).post("/api/onboard/import/apply").send({
      tempDir,
      approvedSecrets: [],
      skipSecretExtraction: true,
    });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      ok: true,
      sourceLayout: {
        kind: "workspace-only",
        supported: true,
        promoteSourceSubdir: "workspace",
      },
    });
    expect(deps.fs.renameSync).toHaveBeenCalledWith(
      `${tempDir}/workspace`,
      deps.constants.WORKSPACE_DIR,
    );
  });

  it("returns unresolved placeholder review data after import apply", async () => {
    const deps = createBaseDeps();
    const tempDir = path.join(os.tmpdir(), "alphaclaw-import-placeholder-review");
    const fileEntry = (name) => ({
      name,
      isFile: () => true,
      isDirectory: () => false,
    });
    const dirEntry = (name) => ({
      name,
      isFile: () => false,
      isDirectory: () => true,
    });
    const files = new Map([
      [
        path.join(tempDir, "openclaw.json"),
        JSON.stringify({
          env: {
            vars: {
              NOTION_API_KEY: "${NOTION_API_KEY}",
            },
          },
          channels: {
            $include: "channels.json",
          },
          gateway: {
            auth: {
              token: "${GATEWAY_AUTH_TOKEN}",
            },
          },
          hooks: {
            token: "repo-hook-token",
          },
        }),
      ],
      [
        path.join(tempDir, "channels.json"),
        JSON.stringify({
          slack: {
            botToken: "${SLACK_BOT_TOKEN}",
            appToken: "${SLACK_APP_TOKEN}",
          },
        }),
      ],
    ]);
    const directories = new Set([tempDir]);
    deps.readEnvFile.mockReturnValue([
      { key: "NOTION_API_KEY", value: "notion-live-value" },
    ]);
    deps.fs.existsSync.mockImplementation(
      (targetPath) => directories.has(targetPath) || files.has(targetPath),
    );
    deps.fs.statSync.mockImplementation((targetPath) => {
      if (directories.has(targetPath)) {
        return { isFile: () => false, isDirectory: () => true };
      }
      if (files.has(targetPath)) {
        return { isFile: () => true, isDirectory: () => false };
      }
      throw Object.assign(new Error("ENOENT"), { code: "ENOENT" });
    });
    deps.fs.readdirSync.mockImplementation((targetPath) => {
      if (targetPath === tempDir) {
        return [fileEntry("openclaw.json"), fileEntry("channels.json")];
      }
      if (targetPath === deps.constants.OPENCLAW_DIR) {
        return [];
      }
      if (targetPath === path.join(tempDir, "workspace")) {
        return [];
      }
      return [];
    });
    deps.fs.readFileSync.mockImplementation((targetPath) => files.get(targetPath) || "{}");
    deps.fs.writeFileSync.mockImplementation((targetPath, contents) => {
      files.set(targetPath, String(contents));
    });
    deps.fs.renameSync.mockImplementation((sourcePath, targetPath) => {
      if (sourcePath === tempDir && targetPath === deps.constants.OPENCLAW_DIR) {
        directories.delete(tempDir);
        directories.add(targetPath);
        for (const [filePath, contents] of [...files.entries()]) {
          if (!filePath.startsWith(`${sourcePath}/`)) continue;
          files.delete(filePath);
          files.set(`${targetPath}${filePath.slice(sourcePath.length)}`, contents);
        }
        return;
      }
      throw new Error(`Unexpected rename from ${sourcePath} to ${targetPath}`);
    });
    const app = createApp(deps);

    const res = await request(app).post("/api/onboard/import/apply").send({
      tempDir,
      approvedSecrets: [],
      skipSecretExtraction: true,
    });

    expect(res.status).toBe(200);
    expect(res.body.placeholderReview).toEqual({
      found: true,
      count: 2,
      vars: [
        { key: "SLACK_APP_TOKEN", status: "missing" },
        { key: "SLACK_BOT_TOKEN", status: "missing" },
      ],
    });
    expect(files.get(path.join(deps.constants.OPENCLAW_DIR, "openclaw.json"))).toContain(
      '"token": "${OPENCLAW_GATEWAY_TOKEN}"',
    );
    expect(files.get(path.join(deps.constants.OPENCLAW_DIR, "openclaw.json"))).toContain(
      '"token": "${WEBHOOK_TOKEN}"',
    );
  });

  it("keeps imported channels enabled and clears pairing allowlists during import apply", async () => {
    const deps = createBaseDeps();
    const tempDir = path.join(os.tmpdir(), "alphaclaw-import-reset-pairings");
    const fileEntry = (name) => ({
      name,
      isFile: () => true,
      isDirectory: () => false,
    });
    const dirEntry = (name) => ({
      name,
      isFile: () => false,
      isDirectory: () => true,
    });
    const files = new Map([
      [
        path.join(tempDir, "openclaw.json"),
        JSON.stringify({
          channels: {
            $include: "channels.json",
          },
        }),
      ],
      [
        path.join(tempDir, "channels.json"),
        JSON.stringify({
          telegram: {
            enabled: true,
            botToken: "${TELEGRAM_BOT_TOKEN}",
            dmPolicy: "allowlist",
            accounts: {
              midas: {
                enabled: true,
                allowFrom: ["legacy-user"],
              },
            },
            groupAllowFrom: ["telegram-user"],
            groups: {
              "-100123": {
                enabled: true,
              },
            },
          },
          discord: {
            enabled: true,
            dmPolicy: "allowlist",
            token: "${DISCORD_BOT_TOKEN}",
            allowFrom: ["discord-user"],
          },
        }),
      ],
      [
        path.join(tempDir, "credentials", "telegram-main-allowFrom.json"),
        JSON.stringify({
          allowFrom: ["telegram-user"],
          source: "imported",
        }),
      ],
      [
        path.join(tempDir, "credentials", "discord-main-allowFrom.json"),
        JSON.stringify({
          allowFrom: ["discord-user"],
          source: "imported",
        }),
      ],
    ]);
    const directories = new Set([tempDir, path.join(tempDir, "credentials")]);
    deps.fs.existsSync.mockImplementation(
      (targetPath) => directories.has(targetPath) || files.has(targetPath),
    );
    deps.fs.statSync.mockImplementation((targetPath) => {
      if (directories.has(targetPath)) {
        return { isFile: () => false, isDirectory: () => true };
      }
      if (files.has(targetPath)) {
        return { isFile: () => true, isDirectory: () => false };
      }
      throw Object.assign(new Error("ENOENT"), { code: "ENOENT" });
    });
    deps.fs.readdirSync.mockImplementation((targetPath) => {
      if (targetPath === tempDir) {
        return [
          fileEntry("openclaw.json"),
          fileEntry("channels.json"),
          dirEntry("credentials"),
        ];
      }
      if (targetPath === path.join(tempDir, "credentials")) {
        return [
          fileEntry("telegram-main-allowFrom.json"),
          fileEntry("discord-main-allowFrom.json"),
        ];
      }
      if (targetPath === deps.constants.OPENCLAW_DIR) {
        return [];
      }
      if (targetPath === path.join(deps.constants.OPENCLAW_DIR, "credentials")) {
        return ["telegram-main-allowFrom.json", "discord-main-allowFrom.json"];
      }
      return [];
    });
    deps.fs.readFileSync.mockImplementation(
      (targetPath) => files.get(targetPath) || "{}",
    );
    deps.fs.writeFileSync.mockImplementation((targetPath, contents) => {
      files.set(targetPath, String(contents));
    });
    deps.fs.renameSync.mockImplementation((sourcePath, targetPath) => {
      if (sourcePath === tempDir && targetPath === deps.constants.OPENCLAW_DIR) {
        for (const directoryPath of [...directories]) {
          if (
            directoryPath === sourcePath ||
            directoryPath.startsWith(`${sourcePath}/`)
          ) {
            directories.delete(directoryPath);
            directories.add(`${targetPath}${directoryPath.slice(sourcePath.length)}`);
          }
        }
        for (const [filePath, contents] of [...files.entries()]) {
          if (!filePath.startsWith(`${sourcePath}/`)) continue;
          files.delete(filePath);
          files.set(`${targetPath}${filePath.slice(sourcePath.length)}`, contents);
        }
        return;
      }
      throw new Error(`Unexpected rename from ${sourcePath} to ${targetPath}`);
    });
    const app = createApp(deps);

    const res = await request(app).post("/api/onboard/import/apply").send({
      tempDir,
      approvedSecrets: [],
      skipSecretExtraction: true,
    });

    expect(res.status).toBe(200);
    expect(
      JSON.parse(files.get(path.join(deps.constants.OPENCLAW_DIR, "channels.json"))),
    ).toEqual({
      telegram: {
        enabled: true,
        botToken: "${TELEGRAM_BOT_TOKEN}",
        dmPolicy: "pairing",
        groupAllowFrom: [],
        groups: {
          "-100123": {
            enabled: true,
          },
        },
      },
      discord: {
        enabled: true,
        dmPolicy: "pairing",
        token: "${DISCORD_BOT_TOKEN}",
        allowFrom: [],
      },
    });
    expect(
      JSON.parse(
        files.get(
          path.join(
            deps.constants.OPENCLAW_DIR,
            "credentials",
            "telegram-main-allowFrom.json",
          ),
        ),
      ),
    ).toEqual({
      allowFrom: [],
      source: "imported",
    });
    expect(
      JSON.parse(
        files.get(
          path.join(
            deps.constants.OPENCLAW_DIR,
            "credentials",
            "discord-main-allowFrom.json",
          ),
        ),
      ),
    ).toEqual({
      allowFrom: [],
      source: "imported",
    });
  });

  it("returns prefill values from included channel config files during import apply", async () => {
    const deps = createBaseDeps();
    const tempDir = path.join(os.tmpdir(), "alphaclaw-import-prefill-includes");
    const fileEntry = (name) => ({
      name,
      isFile: () => true,
      isDirectory: () => false,
    });
    const files = new Map([
      [
        path.join(tempDir, "openclaw.json"),
        JSON.stringify({
          channels: {
            $include: "channels.json",
          },
        }),
      ],
      [
        path.join(tempDir, "channels.json"),
        JSON.stringify({
          discord: {
            enabled: true,
            token: "MTQ3discord-secret",
          },
        }),
      ],
    ]);
    const directories = new Set([tempDir]);
    deps.fs.existsSync.mockImplementation(
      (targetPath) => directories.has(targetPath) || files.has(targetPath),
    );
    deps.fs.statSync.mockImplementation((targetPath) => {
      if (directories.has(targetPath)) {
        return { isFile: () => false, isDirectory: () => true };
      }
      if (files.has(targetPath)) {
        return { isFile: () => true, isDirectory: () => false };
      }
      throw Object.assign(new Error("ENOENT"), { code: "ENOENT" });
    });
    deps.fs.readdirSync.mockImplementation((targetPath) => {
      if (targetPath === tempDir) {
        return [fileEntry("openclaw.json"), fileEntry("channels.json")];
      }
      if (targetPath === deps.constants.OPENCLAW_DIR) {
        return [];
      }
      return [];
    });
    deps.fs.readFileSync.mockImplementation(
      (targetPath) => files.get(targetPath) || "{}",
    );
    deps.fs.writeFileSync.mockImplementation((targetPath, contents) => {
      files.set(targetPath, String(contents));
    });
    deps.fs.renameSync.mockImplementation((sourcePath, targetPath) => {
      if (sourcePath === tempDir && targetPath === deps.constants.OPENCLAW_DIR) {
        directories.delete(tempDir);
        directories.add(targetPath);
        for (const [filePath, contents] of [...files.entries()]) {
          if (!filePath.startsWith(`${sourcePath}/`)) continue;
          files.delete(filePath);
          files.set(`${targetPath}${filePath.slice(sourcePath.length)}`, contents);
        }
        return;
      }
      throw new Error(`Unexpected rename from ${sourcePath} to ${targetPath}`);
    });
    const app = createApp(deps);

    const res = await request(app).post("/api/onboard/import/apply").send({
      tempDir,
      approvedSecrets: [],
      skipSecretExtraction: true,
    });

    expect(res.status).toBe(200);
    expect(res.body.preFill).toEqual({
      DISCORD_BOT_TOKEN: "MTQ3discord-secret",
    });
  });

  it("canonicalizes imported env refs for known config paths during import apply", async () => {
    const deps = createBaseDeps();
    const tempDir = path.join(os.tmpdir(), "alphaclaw-import-canonical-env-ref");
    const fileEntry = (name) => ({
      name,
      isFile: () => true,
      isDirectory: () => false,
    });
    const files = new Map([
      [
        path.join(tempDir, "openclaw.json"),
        JSON.stringify({
          tools: {
            web: {
              search: {
                provider: "brave",
                apiKey: "${REDACTED_USE_ENV_VAR}",
              },
            },
          },
        }),
      ],
      [path.join(tempDir, ".env"), "REDACTED_USE_ENV_VAR=brave-live-value\n"],
    ]);
    const directories = new Set([tempDir]);
    deps.fs.existsSync.mockImplementation(
      (targetPath) => directories.has(targetPath) || files.has(targetPath),
    );
    deps.fs.statSync.mockImplementation((targetPath) => {
      if (directories.has(targetPath)) {
        return { isFile: () => false, isDirectory: () => true };
      }
      if (files.has(targetPath)) {
        return { isFile: () => true, isDirectory: () => false };
      }
      throw Object.assign(new Error("ENOENT"), { code: "ENOENT" });
    });
    deps.fs.readdirSync.mockImplementation((targetPath) => {
      if (targetPath === tempDir) {
        return [fileEntry("openclaw.json"), fileEntry(".env")];
      }
      if (targetPath === deps.constants.OPENCLAW_DIR) {
        return [];
      }
      return [];
    });
    deps.fs.readFileSync.mockImplementation(
      (targetPath) => files.get(targetPath) || "{}",
    );
    deps.fs.writeFileSync.mockImplementation((targetPath, contents) => {
      files.set(targetPath, String(contents));
    });
    deps.fs.renameSync.mockImplementation((sourcePath, targetPath) => {
      if (sourcePath === tempDir && targetPath === deps.constants.OPENCLAW_DIR) {
        directories.delete(tempDir);
        directories.add(targetPath);
        for (const [filePath, contents] of [...files.entries()]) {
          if (!filePath.startsWith(`${sourcePath}/`)) continue;
          files.delete(filePath);
          files.set(`${targetPath}${filePath.slice(sourcePath.length)}`, contents);
        }
        return;
      }
      throw new Error(`Unexpected rename from ${sourcePath} to ${targetPath}`);
    });
    const app = createApp(deps);

    const res = await request(app).post("/api/onboard/import/apply").send({
      tempDir,
      approvedSecrets: [
        {
          file: ".env",
          configPath: ".env:REDACTED_USE_ENV_VAR",
          key: "REDACTED_USE_ENV_VAR",
          value: "brave-live-value",
          maskedValue: "brav****alue",
          suggestedEnvVar: "REDACTED_USE_ENV_VAR",
          confidence: "high",
          source: "env-file",
          fileName: ".env",
        },
      ],
      skipSecretExtraction: false,
    });

    expect(res.status).toBe(200);
    expect(res.body.placeholderReview).toEqual({
      found: false,
      count: 0,
      vars: [],
    });
    expect(res.body.canonicalizedEnvRefs).toBe(1);
    expect(deps.writeEnvFile).toHaveBeenCalledWith([
      { key: "BRAVE_API_KEY", value: "brave-live-value" },
    ]);
    const importedConfig = files.get(
      path.join(deps.constants.OPENCLAW_DIR, "openclaw.json"),
    );
    expect(importedConfig).toContain('"apiKey": "${BRAVE_API_KEY}"');
    expect(importedConfig).not.toContain("REDACTED_USE_ENV_VAR");
  });

  it("rejects import apply when approved secrets were not in the server scan", async () => {
    const deps = createBaseDeps();
    const tempDir = path.join(os.tmpdir(), "alphaclaw-import-invalid-secret");
    const files = new Map([
      [
        path.join(tempDir, "openclaw.json"),
        JSON.stringify({
          models: {
            providers: {
              openai: {
                apiKey: "sk-live-real-secret",
              },
            },
          },
        }),
      ],
    ]);
    deps.fs.existsSync.mockImplementation(
      (targetPath) => targetPath === tempDir || files.has(targetPath),
    );
    deps.fs.statSync.mockImplementation((targetPath) => {
      if (targetPath === tempDir) {
        return { isFile: () => false, isDirectory: () => true };
      }
      if (files.has(targetPath)) {
        return { isFile: () => true, isDirectory: () => false };
      }
      throw Object.assign(new Error("ENOENT"), { code: "ENOENT" });
    });
    deps.fs.readdirSync.mockImplementation((targetPath) => {
      if (targetPath === tempDir) {
        return [{ name: "openclaw.json", isFile: () => true, isDirectory: () => false }];
      }
      return [];
    });
    deps.fs.readFileSync.mockImplementation((targetPath) => files.get(targetPath) || "{}");
    const app = createApp(deps);

    const res = await request(app).post("/api/onboard/import/apply").send({
      tempDir,
      approvedSecrets: [
        {
          file: "../outside.json",
          configPath: "models.providers.openai.apiKey",
          value: "sk-live-real-secret",
          suggestedEnvVar: "BAD KEY",
        },
      ],
      skipSecretExtraction: false,
    });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      ok: false,
      error: "Invalid approved secrets payload",
    });
    expect(deps.writeEnvFile).not.toHaveBeenCalled();
  });
});
