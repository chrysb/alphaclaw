const { buildGogSkillContent } = require("../../lib/server/gog-skill");

describe("server/gog-skill", () => {
  it("includes managed runtime guidance for direct gog shell usage", () => {
    const fs = {
      readFileSync: vi.fn(() => "## Sheets\n\n```bash\ngog sheets get <id> 'Sheet1!A1:B2'\n```"),
    };
    const content = buildGogSkillContent({
      fs,
      accounts: [
        {
          email: "chrys@example.com",
          client: "default",
          authenticated: true,
          services: ["sheets:read"],
        },
      ],
    });

    expect(content).toContain("## Runtime Notes");
    expect(content).toContain("$OPENCLAW_STATE_DIR");
    expect(content).toContain(
      'XDG_CONFIG_HOME="${OPENCLAW_STATE_DIR:-$OPENCLAW_HOME/.openclaw}"',
    );
    expect(content).toContain("--account <email>");
  });
});
