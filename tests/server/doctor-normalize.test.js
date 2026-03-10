const {
  normalizeDoctorResult,
} = require("../../lib/server/doctor/normalize");

describe("server/doctor-normalize", () => {
  it("normalizes nested JSON output into AlphaClaw Doctor cards", () => {
    const rawOutput = JSON.stringify({
      runId: "abc",
      status: "ok",
      result: JSON.stringify({
        summary: "Workspace guidance has drift",
        findings: [
          {
            severity: "high",
            category: "guidance",
            title: "Tools guidance drift",
            description: "Tool guidance is duplicated in README.md",
            recommendedAction: "Move tool guidance into TOOLS.md",
            evidence: ["README.md duplicates TOOLS.md"],
            paths: ["README.md", "hooks/bootstrap/TOOLS.md"],
          },
        ],
      }),
    });

    const result = normalizeDoctorResult(rawOutput);

    expect(result.summary).toBe("Workspace guidance has drift");
    expect(result.cards).toEqual([
      expect.objectContaining({
        priority: "P0",
        category: "guidance",
        title: "Tools guidance drift",
        recommendation: "Move tool guidance into TOOLS.md",
        targetPaths: [{ path: "README.md" }, { path: "hooks/bootstrap/TOOLS.md" }],
        status: "open",
      }),
    ]);
    expect(result.cards[0].fixPrompt).toContain("Move tool guidance into TOOLS.md");
    expect(result.cards[0].evidence).toEqual([
      { type: "text", text: "README.md duplicates TOOLS.md" },
    ]);
  });

  it("extracts Doctor JSON when prose surrounds the payload", () => {
    const rawOutput = `Now I have a complete picture. Here's the analysis:\n\n${JSON.stringify({
      summary: "Fresh workspace with drift risk",
      cards: [
        {
          priority: "P1",
          category: "redundancy",
          title: "Duplicated UI guidance",
          summary: "Two files repeat the same guidance",
          recommendation: "Centralize the detailed guidance into one place",
          evidence: [
            { type: "path", path: "hooks/bootstrap/TOOLS.md" },
            { type: "path", path: "hooks/bootstrap/AGENTS.md" },
          ],
          targetPaths: ["hooks/bootstrap/TOOLS.md"],
          fixPrompt: "Reduce duplication safely",
          status: "open",
        },
      ],
    })}\n\nThat is the full result.`;

    const result = normalizeDoctorResult(rawOutput);

    expect(result.summary).toBe("Fresh workspace with drift risk");
    expect(result.cards).toEqual([
      expect.objectContaining({
        priority: "P1",
        category: "redundancy",
        title: "Duplicated UI guidance",
        recommendation: "Centralize the detailed guidance into one place",
        targetPaths: [{ path: "hooks/bootstrap/TOOLS.md" }],
      }),
    ]);
  });

  it("extracts Doctor JSON from agent payloads text wrappers", () => {
    const rawOutput = JSON.stringify({
      runId: "6650ca1c-be0f-4c15-afb4-3d995c904e2e",
      status: "ok",
      summary: "completed",
      result: {
        payloads: [
          {
            text: "No changes. All hashes identical to prior scan.\n\n{\"summary\":\"Healthy post-bootstrap workspace. No changes since last scan. No drift, contradictions, or misplaced guidance detected.\",\"cards\":[]}",
            mediaUrl: null,
          },
        ],
      },
    });

    const result = normalizeDoctorResult(rawOutput);

    expect(result.summary).toBe(
      "Healthy post-bootstrap workspace. No changes since last scan. No drift, contradictions, or misplaced guidance detected.",
    );
    expect(result.cards).toEqual([]);
  });

  it("throws when the payload does not include recognizable Doctor cards", () => {
    expect(() => normalizeDoctorResult('{"ok":true,"summary":"no cards here"}')).toThrow(
      "Doctor response did not include a recognizable cards payload",
    );
  });
});
