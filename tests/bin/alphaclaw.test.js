const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");
const os = require("os");

describe("bin/alphaclaw port check", () => {
  let tmpDir;
  let tmpHome;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "alphaclaw-test-"));
    tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), "alphaclaw-home-"));
  });

  afterEach(() => {
    try {
      if (fs.existsSync(tmpDir)) {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    } catch {}
    try {
      if (fs.existsSync(tmpHome)) {
        fs.rmSync(tmpHome, { recursive: true, force: true });
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

  it("exports OPENCLAW_STATE_DIR during managed startup", () => {
    const preloadPath = path.join(tmpDir, "capture-openclaw-env.js");
    const capturePath = path.join(tmpDir, "captured-openclaw-env.json");
    fs.writeFileSync(
      preloadPath,
      `
const fs = require("fs");
const os = require("os");
const path = require("path");
const Module = require("module");
const childProcess = require("child_process");

const realLoad = Module._load;
const realCopyFileSync = fs.copyFileSync;
const realWriteFileSync = fs.writeFileSync;
const realUnlinkSync = fs.unlinkSync;
const realChmodSync = fs.chmodSync;

const capturePath = process.env.ALPHACLAW_CAPTURE_ENV_PATH;
const testHome = process.env.ALPHACLAW_TEST_HOME;
if (testHome) {
  os.homedir = () => testHome;
}

childProcess.execSync = (command, options = {}) => {
  const cmd = String(command || "");
  if (
    cmd.startsWith("command -v ") ||
    cmd === "pgrep -x cron" ||
    cmd === "cron"
  ) {
    return "";
  }
  if (cmd.startsWith("git ")) {
    return "";
  }
  return "";
};

fs.copyFileSync = (src, dest, ...rest) => {
  const target = String(dest || "");
  if (
    target.startsWith("/usr/local/bin/") ||
    target.startsWith("/etc/cron.d/")
  ) {
    return;
  }
  return realCopyFileSync(src, dest, ...rest);
};

fs.writeFileSync = (targetPath, data, ...rest) => {
  const target = String(targetPath || "");
  if (
    target.startsWith("/usr/local/bin/") ||
    target.startsWith("/etc/cron.d/")
  ) {
    return;
  }
  return realWriteFileSync(targetPath, data, ...rest);
};

fs.unlinkSync = (targetPath, ...rest) => {
  const target = String(targetPath || "");
  if (target.startsWith("/etc/cron.d/")) return;
  return realUnlinkSync(targetPath, ...rest);
};

fs.chmodSync = (targetPath, ...rest) => {
  const target = String(targetPath || "");
  if (target.startsWith("/usr/local/bin/")) return;
  return realChmodSync(targetPath, ...rest);
};

Module._load = function patchedLoad(request, parent, isMain) {
  const parentFile = String(parent && parent.filename ? parent.filename : "");
  if (
    (request === "../lib/server.js" || String(request || "").endsWith("/lib/server.js")) &&
    parentFile.endsWith(path.join("bin", "alphaclaw.js"))
  ) {
    fs.writeFileSync(
      capturePath,
      JSON.stringify({
        HOME: process.env.HOME,
        OPENCLAW_HOME: process.env.OPENCLAW_HOME,
        OPENCLAW_CONFIG_PATH: process.env.OPENCLAW_CONFIG_PATH,
        OPENCLAW_STATE_DIR: process.env.OPENCLAW_STATE_DIR,
        XDG_CONFIG_HOME: process.env.XDG_CONFIG_HOME,
      }),
    );
    return {};
  }
  return realLoad.apply(this, arguments);
};
      `.trim(),
    );

    execSync(`node "${binPath}" start`, {
      stdio: "pipe",
      encoding: "utf8",
      env: {
        ...process.env,
        SETUP_PASSWORD: "test-password",
        ALPHACLAW_ROOT_DIR: tmpDir,
        ALPHACLAW_TEST_HOME: tmpHome,
        ALPHACLAW_CAPTURE_ENV_PATH: capturePath,
        NODE_OPTIONS: `--require=${preloadPath}`,
      },
    });

    const reportedEnv = JSON.parse(fs.readFileSync(capturePath, "utf8"));
    expect(reportedEnv).toEqual({
      HOME: tmpDir,
      OPENCLAW_HOME: tmpDir,
      OPENCLAW_CONFIG_PATH: path.join(tmpDir, ".openclaw", "openclaw.json"),
      OPENCLAW_STATE_DIR: path.join(tmpDir, ".openclaw"),
      XDG_CONFIG_HOME: path.join(tmpDir, ".openclaw"),
    });

  });

  it("creates a gogcli compatibility symlink under the managed home", () => {
    const preloadPath = path.join(tmpDir, "capture-openclaw-env.js");
    fs.writeFileSync(
      preloadPath,
      `
const fs = require("fs");
const os = require("os");
const path = require("path");
const Module = require("module");
const childProcess = require("child_process");

const realLoad = Module._load;
const realCopyFileSync = fs.copyFileSync;
const realWriteFileSync = fs.writeFileSync;
const realUnlinkSync = fs.unlinkSync;
const realChmodSync = fs.chmodSync;

const testHome = process.env.ALPHACLAW_TEST_HOME;
if (testHome) {
  os.homedir = () => testHome;
}

childProcess.execSync = (command, options = {}) => {
  const cmd = String(command || "");
  if (
    cmd.startsWith("command -v ") ||
    cmd === "pgrep -x cron" ||
    cmd === "cron"
  ) {
    return "";
  }
  if (cmd.startsWith("git ")) {
    return "";
  }
  return "";
};

fs.copyFileSync = (src, dest, ...rest) => {
  const target = String(dest || "");
  if (
    target.startsWith("/usr/local/bin/") ||
    target.startsWith("/etc/cron.d/")
  ) {
    return;
  }
  return realCopyFileSync(src, dest, ...rest);
};

fs.writeFileSync = (targetPath, data, ...rest) => {
  const target = String(targetPath || "");
  if (
    target.startsWith("/usr/local/bin/") ||
    target.startsWith("/etc/cron.d/")
  ) {
    return;
  }
  return realWriteFileSync(targetPath, data, ...rest);
};

fs.unlinkSync = (targetPath, ...rest) => {
  const target = String(targetPath || "");
  if (target.startsWith("/etc/cron.d/")) return;
  return realUnlinkSync(targetPath, ...rest);
};

fs.chmodSync = (targetPath, ...rest) => {
  const target = String(targetPath || "");
  if (target.startsWith("/usr/local/bin/")) return;
  return realChmodSync(targetPath, ...rest);
};

Module._load = function patchedLoad(request, parent, isMain) {
  const parentFile = String(parent && parent.filename ? parent.filename : "");
  if (
    (request === "../lib/server.js" || String(request || "").endsWith("/lib/server.js")) &&
    parentFile.endsWith(path.join("bin", "alphaclaw.js"))
  ) {
    return {};
  }
  return realLoad.apply(this, arguments);
};
      `.trim(),
    );

    execSync(`node "${binPath}" start`, {
      stdio: "pipe",
      encoding: "utf8",
      env: {
        ...process.env,
        SETUP_PASSWORD: "test-password",
        ALPHACLAW_ROOT_DIR: tmpDir,
        ALPHACLAW_TEST_HOME: tmpHome,
        NODE_OPTIONS: `--require=${preloadPath}`,
      },
    });

    const compatPath = path.join(tmpDir, ".config", "gogcli");
    const managedPath = path.join(tmpDir, ".openclaw", "gogcli");
    expect(fs.lstatSync(compatPath).isSymbolicLink()).toBe(true);
    expect(path.resolve(path.dirname(compatPath), fs.readlinkSync(compatPath))).toBe(
      managedPath,
    );
  });

  it("does not replace an existing gogcli config directory", () => {
    const preloadPath = path.join(tmpDir, "capture-openclaw-env.js");
    fs.writeFileSync(
      preloadPath,
      `
const fs = require("fs");
const os = require("os");
const path = require("path");
const Module = require("module");
const childProcess = require("child_process");

const realLoad = Module._load;
const realCopyFileSync = fs.copyFileSync;
const realWriteFileSync = fs.writeFileSync;
const realUnlinkSync = fs.unlinkSync;
const realChmodSync = fs.chmodSync;

const testHome = process.env.ALPHACLAW_TEST_HOME;
if (testHome) {
  os.homedir = () => testHome;
}

childProcess.execSync = (command, options = {}) => {
  const cmd = String(command || "");
  if (
    cmd.startsWith("command -v ") ||
    cmd === "pgrep -x cron" ||
    cmd === "cron"
  ) {
    return "";
  }
  if (cmd.startsWith("git ")) {
    return "";
  }
  return "";
};

fs.copyFileSync = (src, dest, ...rest) => {
  const target = String(dest || "");
  if (
    target.startsWith("/usr/local/bin/") ||
    target.startsWith("/etc/cron.d/")
  ) {
    return;
  }
  return realCopyFileSync(src, dest, ...rest);
};

fs.writeFileSync = (targetPath, data, ...rest) => {
  const target = String(targetPath || "");
  if (
    target.startsWith("/usr/local/bin/") ||
    target.startsWith("/etc/cron.d/")
  ) {
    return;
  }
  return realWriteFileSync(targetPath, data, ...rest);
};

fs.unlinkSync = (targetPath, ...rest) => {
  const target = String(targetPath || "");
  if (target.startsWith("/etc/cron.d/")) return;
  return realUnlinkSync(targetPath, ...rest);
};

fs.chmodSync = (targetPath, ...rest) => {
  const target = String(targetPath || "");
  if (target.startsWith("/usr/local/bin/")) return;
  return realChmodSync(targetPath, ...rest);
};

Module._load = function patchedLoad(request, parent, isMain) {
  const parentFile = String(parent && parent.filename ? parent.filename : "");
  if (
    (request === "../lib/server.js" || String(request || "").endsWith("/lib/server.js")) &&
    parentFile.endsWith(path.join("bin", "alphaclaw.js"))
  ) {
    return {};
  }
  return realLoad.apply(this, arguments);
};
      `.trim(),
    );

    const compatPath = path.join(tmpDir, ".config", "gogcli");
    fs.mkdirSync(compatPath, { recursive: true });
    fs.writeFileSync(path.join(compatPath, "config.json"), "{}");

    execSync(`node "${binPath}" start`, {
      stdio: "pipe",
      encoding: "utf8",
      env: {
        ...process.env,
        SETUP_PASSWORD: "test-password",
        ALPHACLAW_ROOT_DIR: tmpDir,
        ALPHACLAW_TEST_HOME: tmpHome,
        NODE_OPTIONS: `--require=${preloadPath}`,
      },
    });

    expect(fs.lstatSync(compatPath).isDirectory()).toBe(true);
    expect(fs.existsSync(path.join(compatPath, "config.json"))).toBe(true);
  });
});
