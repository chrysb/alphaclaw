const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");
const os = require("os");

describe("bin/alphaclaw port check", () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "alphaclaw-test-"));
  });

  afterEach(() => {
    try {
      if (fs.existsSync(tmpDir)) {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    } catch {}
  });

  const binPath = path.resolve(__dirname, "../../bin/alphaclaw.js");

  it("exits with error if PORT env var is 18789", () => {
    let output = "";
    let status = 0;
    try {
      execSync(`ALPHACLAW_ROOT_DIR="${tmpDir}" node "${binPath}" start`, {
        stdio: "pipe",
        encoding: "utf8",
        env: { ...process.env, PORT: "18789", ALPHACLAW_ROOT_DIR: tmpDir }
      });
    } catch (e) {
      status = e.status;
      output = e.stdout + e.stderr;
    }

    expect(status).toBe(1);
    expect(output).toContain("AlphaClaw cannot be started on port 18789");
    expect(output).toContain("reserved for the OpenClaw gateway");
  });

  it("exits with error if --port flag is 18789", () => {
    let output = "";
    let status = 0;
    try {
      execSync(`ALPHACLAW_ROOT_DIR="${tmpDir}" node "${binPath}" start --port 18789`, {
        stdio: "pipe",
        encoding: "utf8",
        env: { ...process.env, PORT: "3000", ALPHACLAW_ROOT_DIR: tmpDir }
      });
    } catch (e) {
      status = e.status;
      output = e.stdout + e.stderr;
    }

    expect(status).toBe(1);
    expect(output).toContain("AlphaClaw cannot be started on port 18789");
    expect(output).toContain("reserved for the OpenClaw gateway");
  });

  it("does not exit if PORT is not 18789 (fails on SETUP_PASSWORD)", () => {
    let output = "";
    let status = 0;
    try {
      // We expect it to fail on SETUP_PASSWORD missing, which is AFTER the port check
      execSync(`ALPHACLAW_ROOT_DIR="${tmpDir}" node "${binPath}" start`, {
        stdio: "pipe",
        encoding: "utf8",
        env: { ...process.env, PORT: "3001", ALPHACLAW_ROOT_DIR: tmpDir, SETUP_PASSWORD: "" }
      });
    } catch (e) {
      status = e.status;
      output = e.stdout + e.stderr;
    }

    expect(status).toBe(1);
    expect(output).not.toContain("AlphaClaw cannot be started on port 18789");
    expect(output).toContain("SETUP_PASSWORD is missing or empty");
  });
});
