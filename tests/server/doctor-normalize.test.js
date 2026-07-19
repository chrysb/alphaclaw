const {
  normalizeCardStatus,
  normalizeDoctorCard,
  normalizeDoctorResult,
  normalizePriority,
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

  it("parses fenced code blocks and rejects plain prose", () => {
    // Prose with no JSON anywhere: the fenced-block fallback finds nothing.
    expect(() => normalizeDoctorResult("just some prose without payloads")).toThrow(
      "Doctor response did not include a recognizable cards payload",
    );
    // A fenced scalar exercises the fenced-block parser (direct and noisy
    // parsing both fail), but a scalar payload still has no cards.
    expect(() =>
      normalizeDoctorResult("analysis follows\n```json\n123\n```\ndone"),
    ).toThrow("Doctor response did not include a recognizable cards payload");
  });

  it("extracts Doctor cards from a fenced JSON code block", () => {
    const result = normalizeDoctorResult(
      '```json\n{"summary":"Fenced summary","cards":[]}\n```',
    );

    expect(result.summary).toBe("Fenced summary");
    expect(result.cards).toEqual([]);
  });

  it("normalizes unknown priorities and statuses to safe defaults", () => {
    expect(normalizePriority("banana")).toBe("P2");
    expect(normalizePriority("critical")).toBe("P0");
    expect(normalizePriority("medium")).toBe("P1");
    expect(normalizePriority("low")).toBe("P2");
    expect(normalizeCardStatus("fixed")).toBe("fixed");
    expect(normalizeCardStatus("dismissed")).toBe("dismissed");
    expect(normalizeCardStatus("garbage")).toBe("open");
  });

  it("normalizes evidence values in every supported shape", () => {
    const arrayEvidenceCard = normalizeDoctorCard(
      {
        title: "Evidence shapes",
        evidence: [
          { type: "path", path: " AGENTS.md ", startLine: 3, endLine: 5 },
          { type: "path", path: "TOOLS.md", startLine: -1, endLine: 0 },
          42,
          "  quoted text  ",
          "",
          null,
        ],
      },
      0,
    );
    expect(arrayEvidenceCard.evidence).toEqual([
      { type: "path", path: "AGENTS.md", startLine: 3, endLine: 5 },
      { type: "path", path: "TOOLS.md" },
      { type: "text", text: "42" },
      { type: "text", text: "quoted text" },
    ]);

    const stringEvidenceCard = normalizeDoctorCard(
      { title: "String evidence", evidence: "single note" },
      0,
    );
    expect(stringEvidenceCard.evidence).toEqual([
      { type: "text", text: "single note" },
    ]);

    const emptyStringEvidenceCard = normalizeDoctorCard(
      { title: "Empty evidence", evidence: "   " },
      0,
    );
    expect(emptyStringEvidenceCard.evidence).toEqual([]);

    const objectEvidenceCard = normalizeDoctorCard(
      { title: "Object evidence", evidence: { type: "text", text: "one item" } },
      0,
    );
    expect(objectEvidenceCard.evidence).toEqual([
      { type: "text", text: "one item" },
    ]);

    const numberEvidenceCard = normalizeDoctorCard(
      { title: "Number evidence", evidence: 7 },
      0,
    );
    expect(numberEvidenceCard.evidence).toEqual([]);
  });

  it("normalizes target paths with line ranges and drops invalid entries", () => {
    const card = normalizeDoctorCard(
      {
        title: "Target paths",
        targetPaths: [
          { path: " AGENTS.md ", startLine: 1, endLine: 2 },
          { path: "AGENTS.md" },
          { path: "   " },
          { notPath: true },
          "TOOLS.md",
          "",
          7,
          null,
        ],
      },
      0,
    );

    expect(card.targetPaths).toEqual([
      { path: "AGENTS.md", startLine: 1, endLine: 2 },
      { path: "TOOLS.md" },
    ]);
  });

  it("builds a fallback fix prompt and default title when fields are missing", () => {
    const card = normalizeDoctorCard({}, 4);

    expect(card.title).toBe("Doctor recommendation 5");
    expect(card.fixPrompt).toContain(
      "Inspect the relevant workspace files before making changes.",
    );

    const pathCard = normalizeDoctorCard(
      { title: "Has paths", targetPaths: ["AGENTS.md"] },
      0,
    );
    expect(pathCard.fixPrompt).toContain(
      "Focus on these paths if relevant: AGENTS.md.",
    );
  });
});
