const fs = require("fs");
const os = require("os");
const path = require("path");

const { kDoctorCardStatus, kDoctorPriority, kDoctorRunStatus } = require("../../lib/server/doctor/constants");

const loadDoctorDb = () => {
  const modulePath = require.resolve("../../lib/server/db/doctor");
  delete require.cache[modulePath];
  return require(modulePath);
};

let currentDoctorDb = null;
let currentRootDir = "";

const createDoctorDbContext = (prefix) => {
  currentRootDir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  currentDoctorDb = loadDoctorDb();
  const dbResult = currentDoctorDb.initDoctorDb({ rootDir: currentRootDir });
  return {
    ...currentDoctorDb,
    ...dbResult,
    rootDir: currentRootDir,
  };
};

describe("server/doctor-db", () => {
  afterEach(() => {
    if (currentDoctorDb?.closeDoctorDb) {
      currentDoctorDb.closeDoctorDb();
      currentDoctorDb = null;
    }
    if (currentRootDir) {
      fs.rmSync(currentRootDir, { recursive: true, force: true });
      currentRootDir = "";
    }
  });

  it("initializes doctor.db under root db directory", () => {
    const result = createDoctorDbContext("doctor-db-init-");

    expect(result.path).toBe(path.join(result.rootDir, "db", "doctor.db"));
    expect(fs.existsSync(result.path)).toBe(true);
  });

  it("stores runs and cards with aggregated counts", () => {
    const {
      createDoctorRun,
      insertDoctorCards,
      completeDoctorRun,
      getInitialWorkspaceBaseline,
      getDoctorRun,
      getLatestDoctorRun,
      getDoctorCardsByRunId,
      setInitialWorkspaceBaseline,
      updateDoctorCardStatus,
    } = createDoctorDbContext("doctor-db-cards-");
    setInitialWorkspaceBaseline({
      fingerprint: "initial-fingerprint",
      manifest: { "README.md": "hash-readme" },
      capturedAt: "2026-03-06T00:00:00.000Z",
    });

    const runId = createDoctorRun({
      engine: "gateway_agent",
      workspaceRoot: "/tmp/workspace",
      workspaceFingerprint: "fingerprint-123",
      workspaceManifest: { "AGENTS.md": "hash-1" },
      promptVersion: "doctor-v1",
      reusedFromRunId: 9,
    });
    insertDoctorCards({
      runId,
      cards: [
        {
          priority: kDoctorPriority.P0,
          category: "guidance",
          title: "Misplaced tools guidance",
          summary: "Tool guidance lives in the wrong file",
          recommendation: "Move tool guidance into TOOLS.md",
          evidence: [{ type: "path", path: "README.md" }],
          targetPaths: ["README.md", "hooks/bootstrap/TOOLS.md"],
          fixPrompt: "Move the tool guidance safely",
          status: kDoctorCardStatus.open,
        },
        {
          priority: kDoctorPriority.P2,
          category: "cleanup",
          title: "Duplicate notes",
          summary: "Low-value duplication",
          recommendation: "Consolidate the duplicate notes",
          evidence: [],
          targetPaths: ["docs/notes.md"],
          fixPrompt: "Consolidate the duplicate notes safely",
          status: kDoctorCardStatus.dismissed,
        },
      ],
    });
    completeDoctorRun({
      id: runId,
      status: kDoctorRunStatus.completed,
      summary: "Found 2 recommendations",
      rawResult: { cards: [] },
    });

    const run = getDoctorRun(runId);
    const latestRun = getLatestDoctorRun();
    const cards = getDoctorCardsByRunId(runId);
    const initialBaseline = getInitialWorkspaceBaseline();

    expect(run.status).toBe(kDoctorRunStatus.completed);
    expect(initialBaseline).toEqual({
      fingerprint: "initial-fingerprint",
      manifest: { "README.md": "hash-readme" },
      capturedAt: "2026-03-06T00:00:00.000Z",
    });
    expect(run.workspaceFingerprint).toBe("fingerprint-123");
    expect(run.workspaceManifest).toEqual({ "AGENTS.md": "hash-1" });
    expect(run.reusedFromRunId).toBe(9);
    expect(run.cardCount).toBe(2);
    expect(run.priorityCounts).toEqual({ P0: 1, P1: 0, P2: 1 });
    expect(run.statusCounts).toEqual({ open: 1, dismissed: 1, fixed: 0 });
    expect(cards).toHaveLength(2);
    expect(latestRun.id).toBe(runId);

    const updatedCard = updateDoctorCardStatus({
      id: cards[0].id,
      status: kDoctorCardStatus.fixed,
    });
    expect(updatedCard.status).toBe(kDoctorCardStatus.fixed);
  });
});
