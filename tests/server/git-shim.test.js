const fs = require("fs");
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
});
