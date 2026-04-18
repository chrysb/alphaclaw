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

const repeatText = (length, character = "A") => character.repeat(length);

let currentDoctorDb = null;

const loadManagedDoctorDb = () => {
  currentDoctorDb = loadDoctorDb();
  return currentDoctorDb;
};

describe("server/doctor-service", () => {
  afterEach(() => {
    if (currentDoctorDb?.closeDoctorDb) {
      currentDoctorDb.closeDoctorDb();
      currentDoctorDb = null;
    }
  });

  it("reuses the previous completed run when the workspace fingerprint is unchanged", () => {
    const workspaceRoot = fs.mkdtempSync(path.join(os.tmpdir(), "doctor-workspace-"));
    const dbRoot = fs.mkdtempSync(path.join(os.tmpdir(), "doctor-service-db-"));
    fs.writeFileSync(
      path.join(workspaceRoot, "AGENTS.md"),
      "# Workspace Guidance\n\nKeep this concise.\n",
      "utf8",
    );

    const doctorDb = loadManagedDoctorDb();
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

    const doctorDb = loadManagedDoctorDb();
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

  it("does not suppress previously fixed findings on later Doctor runs", async () => {
    const workspaceRoot = fs.mkdtempSync(path.join(os.tmpdir(), "doctor-fixed-rerun-workspace-"));
    const dbRoot = fs.mkdtempSync(path.join(os.tmpdir(), "doctor-fixed-rerun-db-"));
    fs.writeFileSync(path.join(workspaceRoot, "AGENTS.md"), "# Workspace Guidance\n", "utf8");
    fs.writeFileSync(path.join(workspaceRoot, "README.md"), "# Initial docs\n", "utf8");

    const doctorDb = loadManagedDoctorDb();
    doctorDb.initDoctorDb({ rootDir: dbRoot });

    let runCount = 0;
    const clawCmd = vi.fn(async () => {
      runCount += 1;
      return {
        ok: true,
        stdout: JSON.stringify({
          summary: `Run ${runCount}`,
          cards: [
            {
              priority: "P1",
              category: "workspace",
              title: "Stale docs remain",
              summary: "README still contains stale guidance",
              recommendation: "Update README to match the current workspace",
              evidence: [{ type: "path", path: "README.md" }],
              targetPaths: ["README.md"],
              fixPrompt: "Update README safely.",
              status: "open",
            },
          ],
        }),
        stderr: "",
        code: 0,
      };
    });
    const { createDoctorService } = loadDoctorService();
    const buildDoctorService = () =>
      createDoctorService({
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
    const doctorService = buildDoctorService();

    const firstRun = doctorService.runDoctor();
    await new Promise((resolve) => setTimeout(resolve, 0));
    const firstRunCards = doctorDb.getDoctorCardsByRunId(firstRun.runId);
    doctorService.setCardStatus({
      cardId: firstRunCards[0].id,
      status: "fixed",
    });

    fs.writeFileSync(path.join(workspaceRoot, "README.md"), "# Updated docs\n", "utf8");

    const secondRun = buildDoctorService().runDoctor();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(clawCmd).toHaveBeenCalledTimes(2);
    expect(clawCmd.mock.calls[1][0]).toContain("Previously fixed findings");
    expect(clawCmd.mock.calls[1][0]).toContain("[fixed] Stale docs remain (workspace)");
    expect(clawCmd.mock.calls[1][0]).toContain(
      "Previously fixed findings may be re-suggested if the underlying issue is still present",
    );
    expect(doctorDb.getDoctorCardsByRunId(secondRun.runId)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: "Stale docs remain",
          status: "open",
        }),
      ]),
    );
  });

  it("reports meaningful workspace drift only after a stale completed run", () => {
    const workspaceRoot = fs.mkdtempSync(path.join(os.tmpdir(), "doctor-drift-workspace-"));
    const dbRoot = fs.mkdtempSync(path.join(os.tmpdir(), "doctor-drift-db-"));
    fs.writeFileSync(path.join(workspaceRoot, "AGENTS.md"), "# Guidance\n", "utf8");

    const doctorDb = loadManagedDoctorDb();
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

    const doctorDb = loadManagedDoctorDb();
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

  it("reports healthy Project Context files without truncation", () => {
    const workspaceRoot = fs.mkdtempSync(path.join(os.tmpdir(), "doctor-bootstrap-healthy-"));
    const dbRoot = fs.mkdtempSync(path.join(os.tmpdir(), "doctor-bootstrap-healthy-db-"));
    fs.writeFileSync(path.join(workspaceRoot, "AGENTS.md"), "# Guidance\nKeep it short.\n", "utf8");

    const doctorDb = loadManagedDoctorDb();
    doctorDb.initDoctorDb({ rootDir: dbRoot });

    const { createDoctorService } = loadDoctorService();
    const doctorService = createDoctorService({
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

    const status = doctorService.buildStatus();

    expect(status.bootstrapContext.hasActiveTruncation).toBe(false);
    expect(status.bootstrapContext.activeTruncatedFiles).toEqual([]);
  });

  it("reports per-file Project Context truncation in Doctor status", () => {
    const workspaceRoot = fs.mkdtempSync(path.join(os.tmpdir(), "doctor-bootstrap-file-limit-"));
    const dbRoot = fs.mkdtempSync(path.join(os.tmpdir(), "doctor-bootstrap-file-limit-db-"));
    fs.writeFileSync(path.join(workspaceRoot, "AGENTS.md"), repeatText(20001), "utf8");

    const doctorDb = loadManagedDoctorDb();
    doctorDb.initDoctorDb({ rootDir: dbRoot });

    const { createDoctorService } = loadDoctorService();
    const doctorService = createDoctorService({
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

    const status = doctorService.buildStatus();

    expect(status.bootstrapContext.hasActiveTruncation).toBe(true);
    expect(status.bootstrapContext.hasTotalLimitTruncation).toBe(false);
    expect(status.bootstrapContext.activeTruncatedFiles).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: "AGENTS.md",
          rawChars: 20001,
          truncatedByFileLimit: true,
          truncatedByTotalLimit: false,
          reason: "file_limit",
        }),
      ]),
    );
  });

  it("reports total Project Context truncation when active injected files exceed the total cap", () => {
    const workspaceRoot = fs.mkdtempSync(path.join(os.tmpdir(), "doctor-bootstrap-total-limit-"));
    const dbRoot = fs.mkdtempSync(path.join(os.tmpdir(), "doctor-bootstrap-total-limit-db-"));
    const activeProjectContextFiles = [
      "AGENTS.md",
      "SOUL.md",
      "TOOLS.md",
      "IDENTITY.md",
      "USER.md",
      "HEARTBEAT.md",
      "hooks/bootstrap/AGENTS.md",
      "hooks/bootstrap/TOOLS.md",
    ];
    fs.mkdirSync(path.join(workspaceRoot, "hooks", "bootstrap"), { recursive: true });
    for (const filePath of activeProjectContextFiles) {
      fs.writeFileSync(path.join(workspaceRoot, filePath), repeatText(20000), "utf8");
    }

    const doctorDb = loadManagedDoctorDb();
    doctorDb.initDoctorDb({ rootDir: dbRoot });

    const { createDoctorService } = loadDoctorService();
    const doctorService = createDoctorService({
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

    const status = doctorService.buildStatus();

    expect(status.bootstrapContext.hasActiveTruncation).toBe(true);
    expect(status.bootstrapContext.hasTotalLimitTruncation).toBe(true);
    expect(status.bootstrapContext.activeInjectedChars).toBe(
      status.bootstrapContext.bootstrapTotalMaxChars,
    );
    expect(status.bootstrapContext.activeTruncatedFiles).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: "hooks/bootstrap/TOOLS.md",
          truncatedByTotalLimit: true,
        }),
      ]),
    );
  });

  it("adds deterministic truncation cards alongside imported Doctor findings", () => {
    const workspaceRoot = fs.mkdtempSync(path.join(os.tmpdir(), "doctor-bootstrap-import-"));
    const dbRoot = fs.mkdtempSync(path.join(os.tmpdir(), "doctor-bootstrap-import-db-"));
    fs.writeFileSync(path.join(workspaceRoot, "AGENTS.md"), repeatText(20001), "utf8");

    const doctorDb = loadManagedDoctorDb();
    doctorDb.initDoctorDb({ rootDir: dbRoot });

    const { createDoctorService } = loadDoctorService();
    const doctorService = createDoctorService({
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

    const imported = doctorService.importDoctorResult({
      rawOutput: JSON.stringify({
        summary: "Imported findings",
        cards: [
          {
            priority: "P2",
            category: "workspace",
            title: "Small cleanup",
            summary: "Minor cleanup item",
            recommendation: "Tidy the note",
            evidence: [{ type: "path", path: "AGENTS.md" }],
            targetPaths: ["AGENTS.md"],
            fixPrompt: "Tidy the note safely.",
            status: "open",
          },
        ],
      }),
    });

    const cards = doctorDb.getDoctorCardsByRunId(imported.runId);

    expect(cards).toHaveLength(2);
    expect(cards).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          priority: "P0",
          title: "AGENTS.md is being truncated in Project Context",
        }),
        expect.objectContaining({
          priority: "P2",
          title: "Small cleanup",
        }),
      ]),
    );
  });
});
