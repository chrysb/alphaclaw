const fs = require("fs");
const os = require("os");
const path = require("path");
const { execSync } = require("child_process");
const {
  ensureMainUpstream,
  restoreMissingOpenclawConfigFromRemote,
} = require("../../lib/cli/openclaw-config-restore");

const runGit = (cwd, command) =>
  execSync(`git ${command}`, {
    cwd,
    stdio: "pipe",
    encoding: "utf8",
    env: {
      ...process.env,
      GIT_AUTHOR_NAME: "AlphaClaw Test",
      GIT_AUTHOR_EMAIL: "alphaclaw@example.test",
      GIT_COMMITTER_NAME: "AlphaClaw Test",
      GIT_COMMITTER_EMAIL: "alphaclaw@example.test",
    },
  });

const writeConfig = (dir, value) => {
  fs.writeFileSync(
    path.join(dir, "openclaw.json"),
    `${JSON.stringify({ source: value }, null, 2)}\n`,
    "utf8",
  );
};

const readConfig = (dir) =>
  JSON.parse(fs.readFileSync(path.join(dir, "openclaw.json"), "utf8"));

const createConfigRepo = () => {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), "alphaclaw-restore-test-"));
  const sourceDir = path.join(rootDir, "source");
  const remoteDir = path.join(rootDir, "remote.git");
  const openclawDir = path.join(rootDir, "openclaw");

  fs.mkdirSync(sourceDir, { recursive: true });
  runGit(sourceDir, "init -b main");
  runGit(sourceDir, "config commit.gpgsign false");
  writeConfig(sourceDir, "remote-v1");
  runGit(sourceDir, "add openclaw.json");
  runGit(sourceDir, "commit -m initial");

  runGit(rootDir, `init --bare -b main ${JSON.stringify(remoteDir)}`);
  runGit(sourceDir, `remote add origin ${JSON.stringify(remoteDir)}`);
  runGit(sourceDir, "push -u origin main");
  runGit(rootDir, `clone ${JSON.stringify(remoteDir)} ${JSON.stringify(openclawDir)}`);

  return { rootDir, sourceDir, openclawDir };
};

const pushRemoteConfig = (sourceDir, value) => {
  writeConfig(sourceDir, value);
  runGit(sourceDir, "add openclaw.json");
  runGit(sourceDir, `commit -m ${JSON.stringify(`config ${value}`)}`);
  runGit(sourceDir, "push origin main");
};

describe("restoreMissingOpenclawConfigFromRemote", () => {
  let repos;
  let logs;

  beforeEach(() => {
    repos = createConfigRepo();
    logs = [];
  });

  afterEach(() => {
    if (repos?.rootDir) {
      fs.rmSync(repos.rootDir, { recursive: true, force: true });
    }
  });

  const restore = () =>
    restoreMissingOpenclawConfigFromRemote({
      openclawDir: repos.openclawDir,
      env: {},
      logger: { log: (message) => logs.push(message) },
    });

  it("does not overwrite an existing clean openclaw.json", () => {
    pushRemoteConfig(repos.sourceDir, "remote-v2");

    const result = restore();

    expect(result).toEqual({ restored: false, skipped: true, reason: "exists" });
    expect(readConfig(repos.openclawDir)).toEqual({ source: "remote-v1" });
    expect(logs).toContain(
      "[alphaclaw] Remote config restore skipped: local openclaw.json already exists",
    );
  });

  it("does not overwrite local openclaw.json edits", () => {
    pushRemoteConfig(repos.sourceDir, "remote-v2");
    writeConfig(repos.openclawDir, "local-draft");

    const result = restore();

    expect(result).toEqual({
      restored: false,
      skipped: true,
      reason: "exists",
    });
    expect(readConfig(repos.openclawDir)).toEqual({ source: "local-draft" });
    expect(logs).toContain(
      "[alphaclaw] Remote config restore skipped: local openclaw.json already exists",
    );
  });

  it("restores openclaw.json from remote when it is missing", () => {
    pushRemoteConfig(repos.sourceDir, "remote-v2");
    fs.rmSync(path.join(repos.openclawDir, "openclaw.json"), { force: true });

    const result = restore();

    expect(result).toMatchObject({
      restored: true,
      skipped: false,
      reason: "missing",
      branch: "main",
    });
    expect(readConfig(repos.openclawDir)).toEqual({ source: "remote-v2" });
    expect(logs).toContain(
      "[alphaclaw] Restored missing openclaw.json from origin/main",
    );
  });
});

describe("restoreMissingOpenclawConfigFromRemote with injected modules", () => {
  const makeFsModule = (overrides = {}) => ({
    existsSync: vi.fn(() => false),
    writeFileSync: vi.fn(),
    rmSync: vi.fn(),
    ...overrides,
  });
  const osModule = { tmpdir: () => "/fake-tmp" };

  it("requires an openclawDir", () => {
    expect(() => restoreMissingOpenclawConfigFromRemote({})).toThrow(
      "openclawDir is required",
    );
  });

  it("writes a GIT_ASKPASS helper when a GitHub token exists and skips empty remote configs", () => {
    const fsModule = makeFsModule();
    const logs = [];
    const commands = [];
    const execSyncImpl = vi.fn((command, options = {}) => {
      commands.push({ command, options });
      if (command.includes("symbolic-ref")) return "release\n";
      if (command.startsWith("git show ")) return "   \n";
      return "";
    });

    const result = restoreMissingOpenclawConfigFromRemote({
      fsModule,
      osModule,
      execSyncImpl,
      env: { GITHUB_TOKEN: "gh-token", PATH: "/usr/bin" },
      logger: { log: (message) => logs.push(message) },
      processId: 4242,
      openclawDir: "/data/.openclaw",
    });

    expect(result).toEqual({
      restored: false,
      skipped: true,
      reason: "empty_remote",
      branch: "release",
    });
    const askPassPath = "/fake-tmp/alphaclaw-boot-git-askpass-4242.sh";
    expect(fsModule.writeFileSync).toHaveBeenCalledTimes(1);
    expect(fsModule.writeFileSync).toHaveBeenCalledWith(
      askPassPath,
      expect.stringContaining("x-access-token"),
      { mode: 0o700 },
    );
    const lsRemote = commands.find((entry) => entry.command.includes("ls-remote"));
    expect(lsRemote.command).toContain("'release'");
    expect(lsRemote.options.env).toEqual(
      expect.objectContaining({
        GITHUB_TOKEN: "gh-token",
        GIT_TERMINAL_PROMPT: "0",
        GIT_ASKPASS: askPassPath,
      }),
    );
    expect(fsModule.rmSync).toHaveBeenCalledWith(askPassPath, { force: true });
    expect(logs).toContain(
      "[alphaclaw] Remote config restore skipped: remote config empty",
    );
  });

  it("falls back to the main branch and reports errors even when askpass cleanup fails", () => {
    const fsModule = makeFsModule({
      rmSync: vi.fn(() => {
        throw new Error("rm failed");
      }),
    });
    const execSyncImpl = vi.fn(() => {
      throw new Error("network down");
    });
    const logs = [];

    const result = restoreMissingOpenclawConfigFromRemote({
      fsModule,
      osModule,
      execSyncImpl,
      env: { GITHUB_TOKEN: "gh-token" },
      logger: { log: (message) => logs.push(message) },
      processId: 7,
      openclawDir: "/data/.openclaw",
    });

    expect(result).toMatchObject({
      restored: false,
      skipped: true,
      reason: "error",
      branch: "main",
    });
    expect(result.error).toBeInstanceOf(Error);
    expect(fsModule.rmSync).toHaveBeenCalled();
    expect(logs.some((message) => message.includes("network down"))).toBe(true);
  });
});

describe("ensureMainUpstream", () => {
  it("returns false when main already has an upstream", () => {
    const execSyncImpl = vi.fn(() => "");

    expect(ensureMainUpstream({ execSyncImpl, openclawDir: "/d" })).toBe(false);
    expect(execSyncImpl).toHaveBeenCalledTimes(2);
  });

  it("sets origin/main as the upstream when missing", () => {
    const gitEnv = { GIT_ASKPASS: "/tmp/askpass.sh" };
    const execSyncImpl = vi.fn((command) => {
      if (command.includes("rev-parse")) throw new Error("no upstream");
      return "";
    });

    expect(ensureMainUpstream({ execSyncImpl, openclawDir: "/d", gitEnv })).toBe(
      true,
    );
    expect(execSyncImpl).toHaveBeenCalledWith(
      "git branch --set-upstream-to=origin/main main",
      expect.objectContaining({ cwd: "/d", env: gitEnv }),
    );
  });

  it("returns false when the main branch does not exist", () => {
    const execSyncImpl = vi.fn((command) => {
      if (command.includes("show-ref")) throw new Error("no main branch");
      return "";
    });

    expect(ensureMainUpstream({ execSyncImpl, openclawDir: "/d" })).toBe(false);
    expect(execSyncImpl).toHaveBeenCalledTimes(1);
  });

  it("returns false when setting the upstream fails", () => {
    const execSyncImpl = vi.fn((command) => {
      if (command.includes("show-ref")) return "";
      throw new Error("cannot set upstream");
    });

    expect(ensureMainUpstream({ execSyncImpl, openclawDir: "/d" })).toBe(false);
  });
});
