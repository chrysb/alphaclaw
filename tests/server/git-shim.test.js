const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");

const kGitShimPath = path.join(__dirname, "../../lib/scripts/git");
const kGitAskPassPath = path.join(__dirname, "../../lib/scripts/git-askpass");

const shellQuote = (value) => `'${String(value).replace(/'/g, `'\"'\"'`)}'`;

const createBehaviorHarness = ({ repoRoot }) => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "alphaclaw-git-shim-"));
  const logPath = path.join(tempRoot, "git.log");
  const askPassPath = path.join(tempRoot, "git-askpass.sh");
  const realGitPath = path.join(tempRoot, "git.real");
  const shimPath = path.join(tempRoot, "git");

  fs.copyFileSync(kGitAskPassPath, askPassPath);
  fs.chmodSync(askPassPath, 0o755);

  fs.writeFileSync(
    realGitPath,
    [
      "#!/bin/sh",
      "{",
      '  printf "PWD=%s\\n" "$PWD"',
      "  i=1",
      '  for arg in "$@"; do',
      '    printf "ARG_%s=%s\\n" "$i" "$arg"',
      "    i=$((i + 1))",
      "  done",
      '  printf "GIT_ASKPASS=%s\\n" "${GIT_ASKPASS:-}"',
      '  printf "GIT_TERMINAL_PROMPT=%s\\n" "${GIT_TERMINAL_PROMPT:-}"',
      '  if [ -n "${GIT_ASKPASS:-}" ]; then',
      '    printf "ASKPASS_USER=%s\\n" "$("$GIT_ASKPASS" "Username for https://github.com")"',
      '    printf "ASKPASS_PASS=%s\\n" "$("$GIT_ASKPASS" "Password for https://github.com")"',
      "  fi",
      `} > ${shellQuote(logPath)}`,
      "",
    ].join("\n"),
    { mode: 0o755 },
  );

  const shimTemplate = fs.readFileSync(kGitShimPath, "utf8");
  const shimContent = shimTemplate
    .replace('REAL_GIT_HINT="@@REAL_GIT@@"', `REAL_GIT_HINT="${realGitPath}"`)
    .replace('OPENCLAW_REPO_ROOT="@@OPENCLAW_REPO_ROOT@@"', `OPENCLAW_REPO_ROOT="${repoRoot}"`)
    .replace('ASKPASS_PATH="/tmp/alphaclaw-git-askpass.sh"', `ASKPASS_PATH="${askPassPath}"`);
  fs.writeFileSync(shimPath, shimContent, { mode: 0o755 });

  return { tempRoot, logPath, shimPath };
};

describe("server git shim scripts", () => {
  it("keeps install-time placeholders in the shim template", () => {
    const content = fs.readFileSync(kGitShimPath, "utf8");
    expect(content).toContain('REAL_GIT_HINT="@@REAL_GIT@@"');
    expect(content).toContain('OPENCLAW_REPO_ROOT="@@OPENCLAW_REPO_ROOT@@"');
  });

  it("passes auth through for git -C repo push commands", () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "alphaclaw-git-root-"));
    const repoRoot = path.join(tempRoot, "repo");
    const outsideDir = path.join(tempRoot, "outside");
    fs.mkdirSync(repoRoot, { recursive: true });
    fs.mkdirSync(outsideDir, { recursive: true });

    const harness = createBehaviorHarness({ repoRoot });
    execFileSync(harness.shimPath, ["-C", repoRoot, "push", "origin", "main"], {
      cwd: outsideDir,
      env: {
        ...process.env,
        GITHUB_TOKEN: "ghp_test_token",
      },
      stdio: "pipe",
    });

    const log = fs.readFileSync(harness.logPath, "utf8");
    expect(log).toContain(`ARG_1=-C`);
    expect(log).toContain(`ARG_2=${repoRoot}`);
    expect(log).toContain("ARG_3=push");
    expect(log).toContain("GIT_TERMINAL_PROMPT=0");
    expect(log).toContain("ASKPASS_USER=x-access-token");
    expect(log).toContain("ASKPASS_PASS=ghp_test_token");
  });

  it("enables auth when the cwd is a symlinked workspace inside the repo root", () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "alphaclaw-git-root-"));
    const repoRoot = path.join(tempRoot, "repo");
    const workspaceDir = path.join(repoRoot, "workspace");
    const symlinkRoot = path.join(tempRoot, "home-openclaw");
    const symlinkWorkspaceDir = path.join(symlinkRoot, "workspace");
    fs.mkdirSync(workspaceDir, { recursive: true });
    fs.symlinkSync(repoRoot, symlinkRoot);

    const harness = createBehaviorHarness({ repoRoot });
    execFileSync(harness.shimPath, ["push", "origin", "main"], {
      cwd: symlinkWorkspaceDir,
      env: {
        ...process.env,
        GITHUB_TOKEN: "ghp_test_token",
      },
      stdio: "pipe",
    });

    const log = fs.readFileSync(harness.logPath, "utf8");
    expect(log).toContain(`PWD=${fs.realpathSync(workspaceDir)}`);
    expect(log).toContain("GIT_TERMINAL_PROMPT=0");
    expect(log).toContain("ASKPASS_PASS=ghp_test_token");
  });

  it("does not inject auth for git commands outside the managed repo root", () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "alphaclaw-git-root-"));
    const repoRoot = path.join(tempRoot, "repo");
    const outsideDir = path.join(tempRoot, "outside");
    fs.mkdirSync(repoRoot, { recursive: true });
    fs.mkdirSync(outsideDir, { recursive: true });

    const harness = createBehaviorHarness({ repoRoot });
    execFileSync(harness.shimPath, ["push", "origin", "main"], {
      cwd: outsideDir,
      env: {
        ...process.env,
        GITHUB_TOKEN: "ghp_test_token",
      },
      stdio: "pipe",
    });

    const log = fs.readFileSync(harness.logPath, "utf8");
    expect(log).toContain(`PWD=${fs.realpathSync(outsideDir)}`);
    expect(log).toContain("GIT_ASKPASS=");
    expect(log).not.toContain("ASKPASS_USER=");
  });

  it("contains valid shell syntax for git askpass script", () => {
    execFileSync("sh", ["-n", kGitAskPassPath], { stdio: "pipe" });
    const content = fs.readFileSync(kGitAskPassPath, "utf8");
    expect(content).toContain("*Username*)");
    expect(content).toContain("*Password*)");
  });
});
