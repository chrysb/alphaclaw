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

  it("includes Project Context truncation guidance", () => {
    const prompt = buildDoctorPrompt({
      workspaceRoot: "/tmp/workspace",
      managedRoot: "/tmp/managed",
      promptVersion: "doctor-v1",
    });

    expect(prompt).toContain("Large injected files are truncated per-file at 20000 chars by default");
    expect(prompt).toContain("OpenClaw trims oversized injected files by keeping the first 70%");
    expect(prompt).toContain("`BOOTSTRAP.md` is first-run only");
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

  it("frames dismissed findings as suppressed and fixed findings as context only", () => {
    const prompt = buildDoctorPrompt({
      workspaceRoot: "/tmp/workspace",
      managedRoot: "/tmp/managed",
      resolvedCards: [
        {
          status: "dismissed",
          title: "Cleanup docs",
          category: "workspace",
        },
        {
          status: "fixed",
          title: "Stale docs remain",
          category: "workspace",
        },
      ],
      promptVersion: "doctor-v1",
    });

    expect(prompt).toContain("Previously dismissed findings");
    expect(prompt).toContain("[dismissed] Cleanup docs (workspace)");
    expect(prompt).toContain("Previously fixed findings");
    expect(prompt).toContain("[fixed] Stale docs remain (workspace)");
    expect(prompt).toContain(
      'Do not re-suggest findings that appear in the "Previously dismissed" list above',
    );
    expect(prompt).toContain(
      "Previously fixed findings may be re-suggested if the underlying issue is still present",
    );
    expect(prompt).toContain(
      "If a previously fixed finding is still present, you may call that out in the summary or card wording",
    );
    expect(prompt).not.toContain("Previously resolved findings");
  });
});
