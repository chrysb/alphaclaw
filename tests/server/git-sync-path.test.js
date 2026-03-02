const {
  normalizeGitSyncFilePath,
  validateGitSyncFilePath,
} = require("../../lib/cli/git-sync");

describe("cli/git-sync path guards", () => {
  it("normalizes file paths for --file input", () => {
    expect(normalizeGitSyncFilePath("  ./workspace\\app\\config.json  ")).toBe(
      "workspace/app/config.json",
    );
    expect(normalizeGitSyncFilePath("")).toBe("");
  });

  it("rejects unsafe file paths outside openclaw root", () => {
    expect(validateGitSyncFilePath("../secret.txt")).toEqual(
      expect.objectContaining({ ok: false }),
    );
    expect(validateGitSyncFilePath("/absolute/path.txt")).toEqual(
      expect.objectContaining({ ok: false }),
    );
    expect(validateGitSyncFilePath("nested/../escape.txt")).toEqual(
      expect.objectContaining({ ok: false }),
    );
  });

  it("accepts safe relative file paths", () => {
    expect(validateGitSyncFilePath("workspace/app/config.json")).toEqual({
      ok: true,
    });
    expect(validateGitSyncFilePath("")).toEqual({ ok: true });
  });
});
