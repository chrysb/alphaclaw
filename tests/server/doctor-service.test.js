const fs = require("fs");
const os = require("os");
const path = require("path");

const loadDoctorDb = () => {
  const modulePath = require.resolve("../../lib/server/db/doctor");
  delete require.cache[modulePath];
  return require(modulePath);
};

const loadDoctorService = () => {
  const modulePath = require.resolve("../../lib/server/doctor/service");
  delete require.cache[modulePath];
  return require(modulePath);
};

describe("server/doctor-service", () => {
  it("reuses the previous completed run when the workspace fingerprint is unchanged", () => {
    const workspaceRoot = fs.mkdtempSync(path.join(os.tmpdir(), "doctor-workspace-"));
    const dbRoot = fs.mkdtempSync(path.join(os.tmpdir(), "doctor-service-db-"));
    fs.writeFileSync(
      path.join(workspaceRoot, "AGENTS.md"),
      "# Workspace Guidance\n\nKeep this concise.\n",
      "utf8",
    );

    const doctorDb = loadDoctorDb();
    doctorDb.initDoctorDb({ rootDir: dbRoot });

    const clawCmd = vi.fn(async () => ({
      ok: true,
      stdout: JSON.stringify({
        summary: "Should not be called",
        cards: [],
      }),
    }));
    const { createDoctorService } = loadDoctorService();
    const doctorService = createDoctorService({
      clawCmd,
      listDoctorRuns: doctorDb.listDoctorRuns,
      listDoctorCards: doctorDb.listDoctorCards,
      getInitialWorkspaceBaseline: doctorDb.getInitialWorkspaceBaseline,
      setInitialWorkspaceBaseline: doctorDb.setInitialWorkspaceBaseline,
      createDoctorRun: doctorDb.createDoctorRun,
      completeDoctorRun: doctorDb.completeDoctorRun,
      insertDoctorCards: doctorDb.insertDoctorCards,
      getDoctorRun: doctorDb.getDoctorRun,
      getDoctorCardsByRunId: doctorDb.getDoctorCardsByRunId,
      getDoctorCard: doctorDb.getDoctorCard,
      updateDoctorCardStatus: doctorDb.updateDoctorCardStatus,
      workspaceRoot,
      managedRoot: workspaceRoot,
    });

    const imported = doctorService.importDoctorResult({
      rawOutput: JSON.stringify({
        summary: "Initial findings",
        cards: [
          {
            priority: "P1",
            category: "redundancy",
            title: "Duplicated UI guidance",
            summary: "Two files describe the same flow",
            recommendation: "Keep one file authoritative",
            evidence: [{ type: "path", path: "AGENTS.md" }],
            targetPaths: ["AGENTS.md"],
            fixPrompt: "Consolidate the duplicated guidance safely.",
            status: "open",
          },
        ],
      }),
    });

    const rerun = doctorService.runDoctor();
    const latestRun = doctorDb.getDoctorRun(rerun.runId);

    expect(imported.ok).toBe(true);
    expect(rerun.ok).toBe(true);
    expect(rerun.reusedPreviousRun).toBe(true);
    expect(rerun.sourceRunId).toBe(imported.runId);
    expect(clawCmd).not.toHaveBeenCalled();
    expect(latestRun.engine).toBe("deterministic_reuse");
    expect(latestRun.reusedFromRunId).toBe(imported.runId);
    expect(latestRun.summary).toMatch(/^No workspace changes since last scan/);
    expect(doctorDb.getDoctorCardsByRunId(rerun.runId)).toHaveLength(1);
  });

  it("runs Doctor analysis in a dedicated doctor session", async () => {
    const workspaceRoot = fs.mkdtempSync(path.join(os.tmpdir(), "doctor-session-workspace-"));
    const dbRoot = fs.mkdtempSync(path.join(os.tmpdir(), "doctor-session-db-"));
    fs.writeFileSync(path.join(workspaceRoot, "AGENTS.md"), "# Workspace Guidance\n", "utf8");

    const doctorDb = loadDoctorDb();
    doctorDb.initDoctorDb({ rootDir: dbRoot });

    const clawCmd = vi.fn(async () => ({
      ok: true,
      stdout: JSON.stringify({
        summary: "Healthy workspace",
        cards: [],
      }),
      stderr: "",
      code: 0,
    }));
    const { buildDoctorIdempotencyKey, buildDoctorSessionKey, createDoctorService } =
      loadDoctorService();
    const doctorService = createDoctorService({
      clawCmd,
      listDoctorRuns: doctorDb.listDoctorRuns,
      listDoctorCards: doctorDb.listDoctorCards,
      getInitialWorkspaceBaseline: doctorDb.getInitialWorkspaceBaseline,
      setInitialWorkspaceBaseline: doctorDb.setInitialWorkspaceBaseline,
      createDoctorRun: doctorDb.createDoctorRun,
      completeDoctorRun: doctorDb.completeDoctorRun,
      insertDoctorCards: doctorDb.insertDoctorCards,
      getDoctorRun: doctorDb.getDoctorRun,
      getDoctorCardsByRunId: doctorDb.getDoctorCardsByRunId,
      getDoctorCard: doctorDb.getDoctorCard,
      updateDoctorCardStatus: doctorDb.updateDoctorCardStatus,
      workspaceRoot,
      managedRoot: workspaceRoot,
    });

    const result = doctorService.runDoctor();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(result.ok).toBe(true);
    expect(clawCmd).toHaveBeenCalledTimes(1);
    expect(clawCmd.mock.calls[0][0]).toContain("gateway call agent --expect-final --json");
    expect(clawCmd.mock.calls[0][0]).toContain(
      `"idempotencyKey":"${buildDoctorIdempotencyKey(result.runId)}"`,
    );
    expect(clawCmd.mock.calls[0][0]).toContain(
      `"sessionKey":"${buildDoctorSessionKey(result.runId)}"`,
    );
  });

  it("reports meaningful workspace drift only after a stale completed run", () => {
    const workspaceRoot = fs.mkdtempSync(path.join(os.tmpdir(), "doctor-drift-workspace-"));
    const dbRoot = fs.mkdtempSync(path.join(os.tmpdir(), "doctor-drift-db-"));
    fs.writeFileSync(path.join(workspaceRoot, "AGENTS.md"), "# Guidance\n", "utf8");

    const doctorDb = loadDoctorDb();
    doctorDb.initDoctorDb({ rootDir: dbRoot });

    const listDoctorRuns = ({ limit } = {}) =>
      doctorDb.listDoctorRuns({ limit }).map((run) => ({
        ...run,
        startedAt: "2000-01-01T00:00:00.000Z",
        completedAt: "2000-01-01T00:00:00.000Z",
      }));

    const { createDoctorService } = loadDoctorService();
    const buildDoctorService = () =>
      createDoctorService({
        clawCmd: vi.fn(),
        listDoctorRuns,
        listDoctorCards: doctorDb.listDoctorCards,
        getInitialWorkspaceBaseline: doctorDb.getInitialWorkspaceBaseline,
        setInitialWorkspaceBaseline: doctorDb.setInitialWorkspaceBaseline,
        createDoctorRun: doctorDb.createDoctorRun,
        completeDoctorRun: doctorDb.completeDoctorRun,
        insertDoctorCards: doctorDb.insertDoctorCards,
        getDoctorRun: doctorDb.getDoctorRun,
        getDoctorCardsByRunId: doctorDb.getDoctorCardsByRunId,
        getDoctorCard: doctorDb.getDoctorCard,
        updateDoctorCardStatus: doctorDb.updateDoctorCardStatus,
        workspaceRoot,
        managedRoot: workspaceRoot,
      });

    const doctorService = buildDoctorService();

    doctorService.importDoctorResult({
      rawOutput: JSON.stringify({
        summary: "Baseline findings",
        cards: [],
      }),
    });

    fs.writeFileSync(path.join(workspaceRoot, "README.md"), "# Updated docs\n", "utf8");
    fs.mkdirSync(path.join(workspaceRoot, "skills"), { recursive: true });
    fs.writeFileSync(path.join(workspaceRoot, "skills", "note.md"), "extra guidance\n", "utf8");

    const refreshedDoctorService = buildDoctorService();
    const status = refreshedDoctorService.buildStatus();

    expect(status.needsInitialRun).toBe(false);
    expect(status.stale).toBe(true);
    expect(status.changeSummary.hasBaseline).toBe(true);
    expect(status.changeSummary.changedFilesCount).toBe(2);
    expect(status.changeSummary.hasMeaningfulChanges).toBe(true);
    expect(status.changeSummary.deltaScore).toBeGreaterThanOrEqual(4);
  });

  it("uses the persisted initial baseline before the first completed run", () => {
    const workspaceRoot = fs.mkdtempSync(path.join(os.tmpdir(), "doctor-initial-baseline-"));
    const dbRoot = fs.mkdtempSync(path.join(os.tmpdir(), "doctor-initial-baseline-db-"));
    fs.writeFileSync(path.join(workspaceRoot, "AGENTS.md"), "# Guidance\n", "utf8");

    const doctorDb = loadDoctorDb();
    doctorDb.initDoctorDb({ rootDir: dbRoot });

    const { createDoctorService } = loadDoctorService();
    const buildDoctorService = () =>
      createDoctorService({
        clawCmd: vi.fn(),
        listDoctorRuns: doctorDb.listDoctorRuns,
        listDoctorCards: doctorDb.listDoctorCards,
        getInitialWorkspaceBaseline: doctorDb.getInitialWorkspaceBaseline,
        setInitialWorkspaceBaseline: doctorDb.setInitialWorkspaceBaseline,
        createDoctorRun: doctorDb.createDoctorRun,
        completeDoctorRun: doctorDb.completeDoctorRun,
        insertDoctorCards: doctorDb.insertDoctorCards,
        getDoctorRun: doctorDb.getDoctorRun,
        getDoctorCardsByRunId: doctorDb.getDoctorCardsByRunId,
        getDoctorCard: doctorDb.getDoctorCard,
        updateDoctorCardStatus: doctorDb.updateDoctorCardStatus,
        workspaceRoot,
        managedRoot: workspaceRoot,
      });

    const doctorService = buildDoctorService();

    const initialStatus = doctorService.buildStatus();
    fs.writeFileSync(path.join(workspaceRoot, "README.md"), "# Added after baseline\n", "utf8");
    const nextStatus = buildDoctorService().buildStatus();

    expect(initialStatus.needsInitialRun).toBe(true);
    expect(initialStatus.changeSummary.hasBaseline).toBe(true);
    expect(initialStatus.changeSummary.baselineSource).toBe("initial_install");
    expect(nextStatus.changeSummary.changedFilesCount).toBe(1);
    expect(nextStatus.changeSummary.hasMeaningfulChanges).toBe(false);
  });
});
