const path = require("path");
const express = require("express");
const request = require("supertest");

const { registerOnboardingRoutes } = require("../../lib/server/routes/onboarding");
const { kSetupDir } = require("../../lib/server/constants");

const createBaseDeps = ({ onboarded = false, hasCodexOauth = false } = {}) => ({
  fs: {
    mkdirSync: vi.fn(),
    existsSync: vi.fn(() => false),
    copyFileSync: vi.fn(),
    rmSync: vi.fn(),
    readFileSync: vi.fn(() => "{}"),
    writeFileSync: vi.fn(),
    appendFileSync: vi.fn(),
  },
  constants: {
    OPENCLAW_DIR: "/tmp/openclaw",
    WORKSPACE_DIR: "/tmp/openclaw/workspace",
  },
  shellCmd: vi.fn(async () => ""),
  gatewayEnv: vi.fn(() => ({ OPENCLAW_GATEWAY_TOKEN: "tok" })),
  writeEnvFile: vi.fn(),
  reloadEnv: vi.fn(),
  isOnboarded: vi.fn(() => onboarded),
  resolveGithubRepoUrl: vi.fn((value) => value),
  resolveModelProvider: vi.fn((modelKey) => String(modelKey).split("/")[0]),
  hasCodexOauthProfile: vi.fn(() => hasCodexOauth),
  authProfiles: {
    syncConfigAuthReferencesForAgent: vi.fn(),
  },
  ensureGatewayProxyConfig: vi.fn(),
  getBaseUrl: vi.fn(() => "https://example.com"),
  startGateway: vi.fn(),
});

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
  global.fetch
    .mockResolvedValueOnce({
      ok: true,
      headers: { get: () => scopes },
      json: async () => ({ login }),
    })
    .mockResolvedValueOnce({
      ok: repoOk,
      status: repoStatus,
      statusText: repoStatus === 404 ? "Not Found" : "OK",
      json: async () => ({ message: repoStatus === 404 ? "Not Found" : "exists" }),
    })
    .mockResolvedValueOnce({
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

  it("installs deterministic hourly git sync cron during successful onboarding", async () => {
    const deps = createBaseDeps();
    deps.fs.readFileSync.mockImplementation((p) => {
      if (p === "/tmp/openclaw/openclaw.json") return "{}";
      if (p === path.join(kSetupDir, "skills", "control-ui", "SKILL.md")) return "BASE={{BASE_URL}}";
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
      if (p === path.join(kSetupDir, "skills", "control-ui", "SKILL.md")) return "BASE={{BASE_URL}}";
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
});
