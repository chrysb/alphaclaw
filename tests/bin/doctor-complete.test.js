const crypto = require("crypto");
const { execFileSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const binPath = path.resolve(__dirname, "../../bin/alphaclaw.js");

const loadDoctorDb = () => {
  const modulePath = require.resolve("../../lib/server/db/doctor");
  delete require.cache[modulePath];
  return require(modulePath);
};

describe("alphaclaw doctor finding complete", () => {
  let rootDir;
  let doctorDb;

  beforeEach(() => {
    rootDir = fs.mkdtempSync(path.join(os.tmpdir(), "alphaclaw-doctor-cli-"));
    doctorDb = loadDoctorDb();
    doctorDb.initDoctorDb({ rootDir });
  });

  afterEach(() => {
    doctorDb?.closeDoctorDb();
    fs.rmSync(rootDir, { recursive: true, force: true });
  });

  it("uses a one-time token without failing an active Doctor run", () => {
    const token = "one-time-completion-token";
    const fixRunId = "doctor-fix-cli-test";
    const doctorRunId = doctorDb.createDoctorRun({
      engine: "gateway_agent",
      workspaceRoot: "/tmp/workspace",
      promptVersion: "doctor-v1",
    });
    doctorDb.insertDoctorCards({
      runId: doctorRunId,
      cards: [
        {
          priority: "P1",
          category: "guidance",
          title: "Fix guidance",
          recommendation: "Update guidance",
          fixPrompt: "Update it",
          status: "open",
        },
      ],
    });
    const [card] = doctorDb.getDoctorCardsByRunId(doctorRunId);
    doctorDb.startDoctorCardFix({
      id: card.id,
      runId: fixRunId,
      tokenHash: crypto.createHash("sha256").update(token).digest("hex"),
    });
    doctorDb.closeDoctorDb();

    const output = execFileSync(
      process.execPath,
      [
        binPath,
        "--root-dir",
        rootDir,
        "doctor",
        "finding",
        "complete",
        "--id",
        String(card.id),
        "--run",
        fixRunId,
        "--token",
        token,
      ],
      { encoding: "utf8", env: { ...process.env, ALPHACLAW_ROOT_DIR: rootDir } },
    );

    expect(output).toContain(`Doctor finding ${card.id} marked fixed`);
    doctorDb.initDoctorDb({ rootDir, markInterruptedRuns: false });
    expect(doctorDb.getDoctorCard(card.id).status).toBe("fixed");
    expect(doctorDb.getDoctorRun(doctorRunId).status).toBe("running");
    doctorDb.closeDoctorDb();

    expect(() =>
      execFileSync(
        process.execPath,
        [
          binPath,
          "--root-dir",
          rootDir,
          "doctor",
          "finding",
          "complete",
          "--id",
          String(card.id),
          "--run",
          fixRunId,
          "--token",
          token,
        ],
        { stdio: "pipe", env: { ...process.env, ALPHACLAW_ROOT_DIR: rootDir } },
      ),
    ).toThrow();
  });
});
