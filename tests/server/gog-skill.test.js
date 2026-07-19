const realFs = require("fs");
const os = require("os");
const path = require("path");

const { buildGogSkillContent, installGogCliSkill } = require("../../lib/server/gog-skill");

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

  it("returns null when there are no authenticated accounts", () => {
    const fs = { readFileSync: vi.fn() };
    expect(buildGogSkillContent({ fs, accounts: [] })).toBeNull();
    expect(
      buildGogSkillContent({
        fs,
        accounts: [{ email: "a@b.com", authenticated: false, services: ["gmail:read"] }],
      }),
    ).toBeNull();
  });

  it("returns null when authenticated accounts expose no services", () => {
    const fs = { readFileSync: vi.fn() };
    expect(
      buildGogSkillContent({
        fs,
        accounts: [{ email: "a@b.com", authenticated: true, services: [] }],
      }),
    ).toBeNull();
  });

  it("skips service sections whose reference files cannot be read", () => {
    const fs = {
      readFileSync: vi.fn(() => {
        throw new Error("ENOENT");
      }),
    };
    const content = buildGogSkillContent({
      fs,
      accounts: [
        {
          email: "",
          client: "",
          authenticated: true,
          services: ["gmail:read", "custom-service:read", null],
        },
      ],
    });

    expect(content).toContain("| (unknown) | default | gmail, custom-service |");
    expect(content).toContain("command reference for Gmail.");
    expect(content).not.toContain("## Gmail Commands");
  });

  describe("installGogCliSkill", () => {
    let openclawDir = "";

    beforeEach(() => {
      openclawDir = realFs.mkdtempSync(path.join(os.tmpdir(), "gog-skill-install-"));
      vi.spyOn(console, "log").mockImplementation(() => {});
      vi.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
      realFs.rmSync(openclawDir, { recursive: true, force: true });
    });

    const writeState = (accounts) => {
      const gogcliDir = path.join(openclawDir, "gogcli");
      realFs.mkdirSync(gogcliDir, { recursive: true });
      realFs.writeFileSync(
        path.join(gogcliDir, "state.json"),
        JSON.stringify({ version: 2, accounts, gmailPush: { token: "", topics: {} } }),
      );
    };

    it("writes the skill file for connected accounts", () => {
      writeState([
        {
          id: "acc1",
          email: "chrys@example.com",
          client: "default",
          authenticated: true,
          services: ["gmail:read", "sheets:read"],
        },
      ]);

      installGogCliSkill({ fs: realFs, openclawDir });

      const skillPath = path.join(openclawDir, "skills", "gog-cli", "SKILL.md");
      expect(realFs.existsSync(skillPath)).toBe(true);
      const content = realFs.readFileSync(skillPath, "utf8");
      expect(content).toContain("chrys@example.com");
      expect(content).toContain("name: gog-cli");
      expect(console.log).toHaveBeenCalledWith("[gog-skill] gog-cli skill installed");
    });

    it("removes a stale skill file when no accounts remain connected", () => {
      const skillDir = path.join(openclawDir, "skills", "gog-cli");
      realFs.mkdirSync(skillDir, { recursive: true });
      realFs.writeFileSync(path.join(skillDir, "SKILL.md"), "stale");
      writeState([]);

      installGogCliSkill({ fs: realFs, openclawDir });

      expect(realFs.existsSync(path.join(skillDir, "SKILL.md"))).toBe(false);
      expect(console.log).toHaveBeenCalledWith(
        "[gog-skill] Removed stale gog-cli skill (no connected accounts)",
      );
    });

    it("is a no-op when nothing is connected and no stale skill exists", () => {
      installGogCliSkill({ fs: realFs, openclawDir });

      expect(
        realFs.existsSync(path.join(openclawDir, "skills", "gog-cli", "SKILL.md")),
      ).toBe(false);
      expect(console.error).not.toHaveBeenCalled();
    });

    it("logs install errors instead of throwing", () => {
      const brokenFs = {
        existsSync: () => {
          throw new Error("disk on fire");
        },
      };

      expect(() => installGogCliSkill({ fs: brokenFs, openclawDir })).not.toThrow();
      expect(console.error).toHaveBeenCalledWith(
        "[gog-skill] Install error:",
        "disk on fire",
      );
    });
  });
});
