const fs = require("fs");
const os = require("os");
const path = require("path");
const { execSync } = require("child_process");
const {
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
