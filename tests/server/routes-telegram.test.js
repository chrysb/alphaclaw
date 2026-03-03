const { buildTelegramGitSyncCommand } = require("../../lib/server/routes/telegram");

describe("server/routes/telegram", () => {
  it("quotes git-sync commit messages as a single shell arg", () => {
    const command = buildTelegramGitSyncCommand("rename-topic", "topic's name");
    expect(command).toBe(
      "alphaclaw git-sync -m 'telegram workspace: rename-topic topic'\"'\"'s name'",
    );
  });

  it("normalizes whitespace and keeps message content literal", () => {
    const command = buildTelegramGitSyncCommand(
      "create-topic",
      "line one\nline\t two  $(touch /tmp/pwned)  `uname -a`",
    );
    expect(command).toContain("$(touch /tmp/pwned)");
    expect(command).toContain("`uname -a`");
    expect(command).not.toContain("\n");
    expect(command).not.toContain("\t");
    expect(command.startsWith("alphaclaw git-sync -m '")).toBe(true);
    expect(command.endsWith("'")).toBe(true);
  });
});
