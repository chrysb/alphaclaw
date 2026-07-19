const fs = require("fs");
const os = require("os");
const path = require("path");

const {
  analyzeBootstrapContext,
  buildBootstrapTruncationCards,
  formatChars,
} = require("../../lib/server/doctor/bootstrap-context");

describe("server/doctor/bootstrap-context", () => {
  let workspaceRoot;

  beforeEach(() => {
    workspaceRoot = fs.mkdtempSync(path.join(os.tmpdir(), "doctor-bootstrap-ctx-"));
  });

  afterEach(() => {
    fs.rmSync(workspaceRoot, { recursive: true, force: true });
  });

  it("marks files truncated by both the per-file and total limits", () => {
    fs.writeFileSync(path.join(workspaceRoot, "AGENTS.md"), "A".repeat(30), "utf8");
    fs.writeFileSync(path.join(workspaceRoot, "SOUL.md"), "B".repeat(30), "utf8");
    fs.writeFileSync(path.join(workspaceRoot, "TOOLS.md"), "C".repeat(10), "utf8");

    const context = analyzeBootstrapContext({
      workspaceRoot,
      bootstrapMaxChars: 20,
      bootstrapTotalMaxChars: 25,
    });

    const agents = context.files.find((file) => file.path === "AGENTS.md");
    const soul = context.files.find((file) => file.path === "SOUL.md");
    const tools = context.files.find((file) => file.path === "TOOLS.md");

    expect(agents.reason).toBe("file_limit");
    expect(agents.injectedChars).toBe(20);
    expect(soul.reason).toBe("file_and_total_limit");
    expect(soul.truncatedByFileLimit).toBe(true);
    expect(soul.truncatedByTotalLimit).toBe(true);
    expect(soul.injectedChars).toBe(5);
    expect(tools.reason).toBe("total_limit");
    expect(tools.injectedChars).toBe(0);
    expect(context.hasTotalLimitTruncation).toBe(true);
    expect(context.totalLimitReached).toBe(true);
  });

  it("builds a leading total-limit card alongside per-file truncation cards", () => {
    fs.writeFileSync(path.join(workspaceRoot, "AGENTS.md"), "A".repeat(30), "utf8");
    fs.writeFileSync(path.join(workspaceRoot, "SOUL.md"), "B".repeat(30), "utf8");

    const context = analyzeBootstrapContext({
      workspaceRoot,
      bootstrapMaxChars: 20,
      bootstrapTotalMaxChars: 25,
    });
    const cards = buildBootstrapTruncationCards(context);

    expect(cards.length).toBe(2);
    expect(cards[0]).toMatchObject({
      priority: "P0",
      category: "project context",
      title: "Project Context total bootstrap limit is truncating injected files",
      targetPaths: [{ path: "SOUL.md" }],
      status: "open",
    });
    expect(cards[0].evidence).toEqual([
      expect.objectContaining({
        type: "text",
        text: expect.stringContaining("SOUL.md: raw 30 chars, injected 5 chars"),
      }),
    ]);
    expect(cards[1].title).toBe("AGENTS.md is being truncated in Project Context");
  });

  it("returns no cards when there is no active truncation", () => {
    fs.writeFileSync(path.join(workspaceRoot, "AGENTS.md"), "short", "utf8");

    expect(buildBootstrapTruncationCards(null)).toEqual([]);
    expect(
      buildBootstrapTruncationCards(analyzeBootstrapContext({ workspaceRoot })),
    ).toEqual([]);
  });

  it("formats character counts", () => {
    expect(formatChars(20000)).toBe("20,000 chars");
    expect(formatChars()).toBe("0 chars");
  });
});
