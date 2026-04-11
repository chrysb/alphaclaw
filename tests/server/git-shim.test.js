const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");

const kGitShimPath = path.join(__dirname, "../../lib/scripts/git");
const kGitAskPassPath = path.join(__dirname, "../../lib/scripts/git-askpass");

describe("server git shim scripts", () => {
  it("keeps install-time placeholders in the shim template", () => {
    const content = fs.readFileSync(kGitShimPath, "utf8");
    expect(content).toContain('REAL_GIT_HINT="@@REAL_GIT@@"');
    expect(content).toContain('OPENCLAW_REPO_ROOT="@@OPENCLAW_REPO_ROOT@@"');
  });

  it("covers the expected auth-enabled git network subcommands", () => {
    const content = fs.readFileSync(kGitShimPath, "utf8");
    expect(content).toContain("push|pull|fetch|clone|ls-remote");
    expect(content).toContain("resolve_real_git()");
    expect(content).toContain('"/bin/git"');
  });

  it("contains valid shell syntax for git askpass script", () => {
    execFileSync("sh", ["-n", kGitAskPassPath], { stdio: "pipe" });
    const content = fs.readFileSync(kGitAskPassPath, "utf8");
    expect(content).toContain("*Username*)");
    expect(content).toContain("*Password*)");
  });

  it("injects auth for git -C <repo> push even when called from outside the repo", () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "alphaclaw-git-shim-"));
    const repoRoot = path.join(tempRoot, "repo");
    const outsideDir = path.join(tempRoot, "outside");
    const fakeGitPath = path.join(tempRoot, "git-real.sh");
    const shimPath = path.join(tempRoot, "git-shim.sh");

    fs.mkdirSync(repoRoot, { recursive: true });
    fs.mkdirSync(outsideDir, { recursive: true });
    fs.writeFileSync(
      fakeGitPath,
      [
        "#!/bin/sh",
        'printf "ASKPASS=%s\\n" "${GIT_ASKPASS:-}"',
        'printf "PROMPT=%s\\n" "${GIT_TERMINAL_PROMPT:-}"',
        'printf "PWD=%s\\n" "$(pwd)"',
        'printf "ARGS=%s\\n" "$*"',
      ].join("\n"),
      { mode: 0o755 },
    );

    const shimTemplate = fs.readFileSync(kGitShimPath, "utf8");
    fs.writeFileSync(
      shimPath,
      shimTemplate.replace("@@OPENCLAW_REPO_ROOT@@", repoRoot),
      { mode: 0o755 },
    );

    const output = execFileSync(shimPath, ["-C", repoRoot, "push", "origin", "main"], {
      cwd: outsideDir,
      env: {
        ...process.env,
        GITHUB_TOKEN: "test-token",
        ALPHACLAW_REAL_GIT: fakeGitPath,
      },
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });

    expect(output).toContain("ASKPASS=/tmp/alphaclaw-git-askpass.sh");
    expect(output).toContain("PROMPT=0");
    expect(output).toContain(`ARGS=-C ${repoRoot} push origin main`);
  });

  it("injects auth for git -c key=value push inside the repo", () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "alphaclaw-git-shim-"));
    const repoRoot = path.join(tempRoot, "repo");
    const fakeGitPath = path.join(tempRoot, "git-real.sh");
    const shimPath = path.join(tempRoot, "git-shim.sh");

    fs.mkdirSync(repoRoot, { recursive: true });
    fs.writeFileSync(
      fakeGitPath,
      [
        "#!/bin/sh",
        'printf "ASKPASS=%s\\n" "${GIT_ASKPASS:-}"',
        'printf "ARGS=%s\\n" "$*"',
      ].join("\n"),
      { mode: 0o755 },
    );

    const shimTemplate = fs.readFileSync(kGitShimPath, "utf8");
    fs.writeFileSync(
      shimPath,
      shimTemplate.replace("@@OPENCLAW_REPO_ROOT@@", repoRoot),
      { mode: 0o755 },
    );

    const output = execFileSync(shimPath, ["-c", "http.extraHeader=test", "push", "origin", "main"], {
      cwd: repoRoot,
      env: {
        ...process.env,
        GITHUB_TOKEN: "test-token",
        ALPHACLAW_REAL_GIT: fakeGitPath,
      },
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });

    expect(output).toContain("ASKPASS=/tmp/alphaclaw-git-askpass.sh");
    expect(output).toContain("ARGS=-c http.extraHeader=test push origin main");
  });
});
