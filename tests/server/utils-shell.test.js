const { quoteShellArg } = require("../../lib/server/utils/shell");

describe("server/utils/shell", () => {
  it("quotes with double strategy by default", () => {
    const quoted = quoteShellArg('a"$`\\b');
    expect(quoted).toBe('"a\\"\\$\\`\\\\b"');
  });

  it("quotes with single strategy when requested", () => {
    const quoted = quoteShellArg("topic's name", { strategy: "single" });
    expect(quoted).toBe("'topic'\"'\"'s name'");
  });

  it("throws for unsupported strategies", () => {
    expect(() => quoteShellArg("value", { strategy: "unknown" })).toThrow(
      "Unsupported shell quote strategy: unknown",
    );
  });
});
