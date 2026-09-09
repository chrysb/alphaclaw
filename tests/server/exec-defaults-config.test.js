const fs = require("fs");
const os = require("os");
const path = require("path");
const { DatabaseSync } = require("node:sqlite");

const {
  ensureManagedExecDefaults,
} = require("../../lib/server/exec-defaults-config");

const createExecApprovalsTable = (openclawDir) => {
  const stateDir = path.join(openclawDir, "state");
  fs.mkdirSync(stateDir, { recursive: true });
  const db = new DatabaseSync(path.join(stateDir, "openclaw.sqlite"));
  db.exec(`
    CREATE TABLE exec_approvals_config (
      config_key TEXT NOT NULL PRIMARY KEY,
      raw_json TEXT NOT NULL,
      socket_path TEXT,
      has_socket_token INTEGER NOT NULL,
      default_security TEXT,
      default_ask TEXT,
      default_ask_fallback TEXT,
      auto_allow_skills INTEGER,
      agent_count INTEGER NOT NULL,
      allowlist_count INTEGER NOT NULL,
      updated_at_ms INTEGER NOT NULL
    ) STRICT;
  `);
  return db;
};

const createTempOpenclawDir = () =>
  fs.mkdtempSync(path.join(os.tmpdir(), "alphaclaw-exec-defaults-test-"));

describe("server/exec-defaults-config", () => {
  it("fills missing managed exec defaults for openclaw.json and exec-approvals.json", () => {
    const openclawDir = createTempOpenclawDir();
    fs.writeFileSync(
      path.join(openclawDir, "openclaw.json"),
      JSON.stringify(
        {
          tools: {
            profile: "full",
          },
          channels: {
            telegram: { enabled: true },
          },
        },
        null,
        2,
      ),
      "utf8",
    );

    const result = ensureManagedExecDefaults({ fsModule: fs, openclawDir });

    expect(result).toEqual({
      changed: true,
      openclawChanged: true,
      approvalsChanged: true,
    });

    const openclawConfig = JSON.parse(
      fs.readFileSync(path.join(openclawDir, "openclaw.json"), "utf8"),
    );
    expect(openclawConfig.tools).toEqual({
      profile: "full",
      exec: {
        security: "full",
        strictInlineEval: false,
      },
    });
    expect(openclawConfig.channels.telegram).toEqual({ enabled: true });

    const approvals = JSON.parse(
      fs.readFileSync(path.join(openclawDir, "exec-approvals.json"), "utf8"),
    );
    expect(approvals).toEqual({
      version: 1,
      defaults: {
        security: "full",
        ask: "off",
        askFallback: "full",
      },
      agents: {},
    });
  });

  it("preserves existing exec settings when they are already configured", () => {
    const openclawDir = createTempOpenclawDir();
    const openclawPath = path.join(openclawDir, "openclaw.json");
    const approvalsPath = path.join(openclawDir, "exec-approvals.json");
    const openclawContent = JSON.stringify(
      {
        tools: {
          profile: "full",
          exec: {
            host: "node",
            node: "mac-1",
            security: "allowlist",
            ask: "always",
            strictInlineEval: true,
          },
        },
      },
      null,
      2,
    );
    const approvalsContent =
      JSON.stringify(
        {
          version: 1,
          defaults: {
            security: "allowlist",
            ask: "always",
            askFallback: "deny",
          },
          agents: {
            main: {
              security: "allowlist",
            },
          },
        },
        null,
        2,
      ) + "\n";
    fs.writeFileSync(openclawPath, openclawContent, "utf8");
    fs.writeFileSync(approvalsPath, approvalsContent, "utf8");

    const result = ensureManagedExecDefaults({ fsModule: fs, openclawDir });

    expect(result).toEqual({
      changed: false,
      openclawChanged: false,
      approvalsChanged: false,
    });
    expect(fs.readFileSync(openclawPath, "utf8")).toBe(openclawContent);
    expect(fs.readFileSync(approvalsPath, "utf8")).toBe(approvalsContent);
  });

  it("does not add or change openclaw exec subkeys when tools.exec already exists", () => {
    const openclawDir = createTempOpenclawDir();
    fs.writeFileSync(
      path.join(openclawDir, "openclaw.json"),
      JSON.stringify(
        {
          tools: {
            profile: "full",
            exec: {
              host: "gateway",
              ask: "off",
            },
          },
        },
        null,
        2,
      ),
      "utf8",
    );

    const result = ensureManagedExecDefaults({ fsModule: fs, openclawDir });

    expect(result).toEqual({
      changed: true,
      openclawChanged: false,
      approvalsChanged: true,
    });

    const openclawConfig = JSON.parse(
      fs.readFileSync(path.join(openclawDir, "openclaw.json"), "utf8"),
    );
    expect(openclawConfig.tools.exec).toEqual({
      host: "gateway",
      ask: "off",
    });
  });

  it("does not add or change exec approvals defaults when defaults is a non-empty object", () => {
    const openclawDir = createTempOpenclawDir();
    const openclawPath = path.join(openclawDir, "openclaw.json");
    const approvalsPath = path.join(openclawDir, "exec-approvals.json");
    const openclawContent = JSON.stringify(
      {
        tools: {
          profile: "full",
          exec: {
            host: "gateway",
          },
        },
      },
      null,
      2,
    );
    const approvalsContent =
      JSON.stringify(
        {
          socket: {
            path: "/data/.openclaw/exec-approvals.sock",
            token: "",
          },
          defaults: {
            ask: "always",
          },
        },
        null,
        2,
      ) + "\n";
    fs.writeFileSync(openclawPath, openclawContent, "utf8");
    fs.writeFileSync(approvalsPath, approvalsContent, "utf8");

    const result = ensureManagedExecDefaults({ fsModule: fs, openclawDir });

    expect(result).toEqual({
      changed: false,
      openclawChanged: false,
      approvalsChanged: false,
    });
    expect(fs.readFileSync(approvalsPath, "utf8")).toBe(approvalsContent);
  });

  it("writes missing managed defaults to SQLite without recreating the retired JSON file", () => {
    const openclawDir = createTempOpenclawDir();
    fs.writeFileSync(
      path.join(openclawDir, "openclaw.json"),
      JSON.stringify({ tools: { exec: { host: "gateway" } } }),
      "utf8",
    );
    const db = createExecApprovalsTable(openclawDir);
    db.close();

    const result = ensureManagedExecDefaults({ fsModule: fs, openclawDir });

    expect(result.approvalsChanged).toBe(true);
    expect(fs.existsSync(path.join(openclawDir, "exec-approvals.json"))).toBe(false);
    const verifyDb = new DatabaseSync(
      path.join(openclawDir, "state", "openclaw.sqlite"),
      { readOnly: true },
    );
    const row = verifyDb
      .prepare(
        "SELECT raw_json, default_security, default_ask, default_ask_fallback " +
          "FROM exec_approvals_config WHERE config_key = 'current'",
      )
      .get();
    verifyDb.close();
    expect(JSON.parse(row.raw_json)).toEqual({
      version: 1,
      defaults: {
        security: "full",
        ask: "off",
        askFallback: "full",
      },
      agents: {},
    });
    expect(row).toMatchObject({
      default_security: "full",
      default_ask: "off",
      default_ask_fallback: "full",
    });
  });

  it("preserves an existing SQLite approvals policy", () => {
    const openclawDir = createTempOpenclawDir();
    fs.writeFileSync(
      path.join(openclawDir, "openclaw.json"),
      JSON.stringify({ tools: { exec: { host: "gateway" } } }),
      "utf8",
    );
    const existing = {
      version: 1,
      defaults: { security: "allowlist", ask: "always", askFallback: "deny" },
      agents: { main: { security: "allowlist", allowlist: [{ pattern: "ls" }] } },
    };
    const db = createExecApprovalsTable(openclawDir);
    db.prepare(
      "INSERT INTO exec_approvals_config VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    ).run(
      "current",
      `${JSON.stringify(existing, null, 2)}\n`,
      null,
      0,
      "allowlist",
      "always",
      "deny",
      null,
      1,
      1,
      Date.now(),
    );
    db.close();

    const result = ensureManagedExecDefaults({ fsModule: fs, openclawDir });

    expect(result.approvalsChanged).toBe(false);
    expect(fs.existsSync(path.join(openclawDir, "exec-approvals.json"))).toBe(false);
  });
});
