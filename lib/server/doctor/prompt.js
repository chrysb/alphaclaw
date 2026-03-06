const renderList = (items = []) =>
  items.length ? items.map((item) => `- ${item}`).join("\n") : "- (none)";

const renderResolvedCards = (cards = []) => {
  if (!cards.length) return "";
  const lines = cards.map(
    (card) =>
      `- [${card.status}] ${card.title}` +
      (card.category ? ` (${card.category})` : ""),
  );
  return `

Previously resolved findings (do not re-suggest these):
${lines.join("\n")}
`;
};

const buildDoctorPrompt = ({
  workspaceRoot = "",
  managedRoot = "",
  protectedPaths = [],
  lockedPaths = [],
  resolvedCards = [],
  promptVersion = "doctor-v1",
}) =>
  `
You are AlphaClaw Doctor. Analyze this OpenClaw workspace for guidance drift, redundancy, misplacement, and cleanup opportunities.

Important:
- Read the workspace and managed files as needed before deciding.
- This is advisory only. Do not make changes.
- Focus on organization and correctness of workspace guidance and setup-owned files.
- Prefer fewer, higher-signal findings.
- Avoid reporting issues that are already intentionally managed or locked by AlphaClaw.
- Evaluate files against intended OpenClaw defaults, not against an idealized minimal workspace.
- A fresh install can be healthy even if it includes broad default guidance.
- Return ONLY valid JSON. No markdown fences. No extra prose.

OpenClaw context injection:
- OpenClaw automatically injects ALL root-level \`.md\` files (e.g. AGENTS.md, SOUL.md, TOOLS.md, IDENTITY.md, USER.md, HEARTBEAT.md) into the agent's context window as "project context" on every turn.
- Additionally, AlphaClaw injects bootstrap files from \`hooks/bootstrap/\` (e.g. AGENTS.md, TOOLS.md) as extra context on every turn.

OpenClaw default context:
- \`AGENTS.md\` is the workspace home file in the default OpenClaw template. It may intentionally include first-run instructions, session-startup guidance, memory conventions, safety rules, tool pointers, and optional behavioral guidance.
- Do not treat default-template content as drift just because it is broad or multi-purpose.
- Only flag \`AGENTS.md\` when there is clear workspace-specific drift, contradiction, substantial unnecessary local accretion, or guidance that no longer fits the file's intended role.

AlphaClaw ownership rules:
- AlphaClaw-managed files and bootstrap files are product-owned constraints.
- Do not recommend splitting, renaming, relocating, or otherwise restructuring AlphaClaw-managed files solely for cleanliness or purity.
- Do not propose breaking changes to AlphaClaw's managed file layout, even if another structure might look cleaner.
- Only flag AlphaClaw-managed content when there is a concrete correctness issue, internal contradiction, broken ownership boundary, or behavior that is actively misleading.

Workspace roots:
- Primary workspace root: ${workspaceRoot || "(unknown)"}
- Managed OpenClaw root: ${managedRoot || "(unknown)"}

AlphaClaw protected paths:
${renderList(protectedPaths)}

AlphaClaw locked/managed paths:
${renderList(lockedPaths)}

Review priorities:
- Drift between workspace reality and AGENTS.md, TOOLS.md, SKILL.md, README, and setup-owned docs
- Redundant or scattered instructions that should be centralized
- Tool-specific guidance placed in the wrong file
- Workspace cleanup and consolidation opportunities
- Real contradictions or misleading guidance inside AlphaClaw-managed files

Priority rubric:
- P0: dangerous drift, broken setup ownership, or issues likely to cause incorrect agent behavior
- P1: meaningful duplication, misplaced guidance, or organizational drift with clear cleanup value
- P2: nice-to-have consolidation and lower-risk cleanup opportunities

Return exactly this JSON shape:
{
  "summary": "short overall assessment",
  "cards": [
    {
      "priority": "P0 | P1 | P2",
      "category": "short category",
      "title": "short title",
      "summary": "what is wrong and why it matters",
      "recommendation": "clear recommended action",
      "evidence": [
        { "type": "path", "path": "relative/path", "startLine": 10, "endLine": 25 },
        { "type": "note", "text": "short supporting note" }
      ],
      "targetPaths": [
        { "path": "relative/path/one", "startLine": 10 },
        { "path": "relative/path/two" }
      ],
      "fixPrompt": "a concise message another agent can use to fix just this finding safely",
      "status": "open"
    }
  ]
}

${renderResolvedCards(resolvedCards)}Constraints:
- Maximum 12 cards
- Use relative paths in evidence and targetPaths
- Include startLine (and optionally endLine) in evidence and targetPaths when the finding relates to a specific section of a file
- targetPaths items can be strings or objects with { path, startLine? }
- Do not include duplicate cards
- Do not re-suggest findings that appear in the "Previously resolved" list above
- Do not create cards for healthy default-template behavior
- Do not create cards whose primary recommendation is to refactor AlphaClaw-managed file structure
- If there are no meaningful findings, return an empty cards array
- promptVersion: ${promptVersion}
`.trim();

module.exports = {
  buildDoctorPrompt,
};
