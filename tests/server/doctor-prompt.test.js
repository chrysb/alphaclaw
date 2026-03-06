const { buildDoctorPrompt } = require("../../lib/server/doctor/prompt");

describe("server/doctor-prompt", () => {
  it("includes OpenClaw default-template context for AGENTS.md", () => {
    const prompt = buildDoctorPrompt({
      workspaceRoot: "/tmp/workspace",
      managedRoot: "/tmp/managed",
      promptVersion: "doctor-v1",
    });

    expect(prompt).toContain("OpenClaw default context:");
    expect(prompt).toContain("`AGENTS.md` is the workspace home file in the default OpenClaw template.");
    expect(prompt).toContain("Do not treat default-template content as drift just because it is broad or multi-purpose.");
  });

  it("tells the analyzer not to propose structural changes to AlphaClaw-managed files", () => {
    const prompt = buildDoctorPrompt({
      workspaceRoot: "/tmp/workspace",
      managedRoot: "/tmp/managed",
      lockedPaths: ["hooks/bootstrap/TOOLS.md"],
      promptVersion: "doctor-v1",
    });

    expect(prompt).toContain("AlphaClaw ownership rules:");
    expect(prompt).toContain(
      "Do not recommend splitting, renaming, relocating, or otherwise restructuring AlphaClaw-managed files solely for cleanliness or purity.",
    );
    expect(prompt).toContain(
      "Do not create cards whose primary recommendation is to refactor AlphaClaw-managed file structure",
    );
  });
});
