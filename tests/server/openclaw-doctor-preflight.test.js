const childProcess = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { DatabaseSync } = require("node:sqlite");
const {
  findOpenclawPackage,
  hasLegacyAuthState,
  isValidExecApprovalsPolicy,
  resolveOpenclawCliPath,
  runOpenclawDoctorPreflight,
} = require("../../lib/server/openclaw-doctor-preflight");
const {
  ensureLegacyCompatibilityDefaults,
} = require("../../lib/server/openclaw-config-migrations");

const createConfig = (value) => {
  const stateDir = fs.mkdtempSync(path.join(os.tmpdir(), "alphaclaw-preflight-"));
  const configPath = path.join(stateDir, "openclaw.json");
  fs.writeFileSync(configPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  return { configPath, stateDir };
};

const kPackageInfo = {
  dir: "/tmp/openclaw",
  pkg: { name: "openclaw", version: "2026.9.6", bin: "openclaw.mjs" },
};

describe("server/openclaw-doctor-preflight", () => {
  it("validates persisted exec approvals policies before trusting SQLite", () => {
    expect(
      isValidExecApprovalsPolicy({
        version: 1,
        defaults: { security: "full", ask: "off", askFallback: "full" },
        agents: { main: { allowlist: [{ pattern: "ls" }] } },
      }),
    ).toBe(true);
    expect(isValidExecApprovalsPolicy({ version: 2, agents: {} })).toBe(false);
    expect(
      isValidExecApprovalsPolicy({
        version: 1,
        defaults: { security: "unrestricted" },
        agents: {},
      }),
    ).toBe(false);
    expect(
      isValidExecApprovalsPolicy({
        version: 1,
        agents: { main: { allowlist: ["ls", { pattern: "pwd", lastUsedAt: 1 }] } },
      }),
    ).toBe(true);
    expect(
      isValidExecApprovalsPolicy({
        version: 1,
        agents: { main: { allowlist: [{ pattern: "ls", lastUsedAt: "bad" }] } },
      }),
    ).toBe(false);
    expect(
      isValidExecApprovalsPolicy({
        version: 1,
        defaults: { allowlist: [], mcpTools: "ignored" },
      }),
    ).toBe(true);
    expect(
      isValidExecApprovalsPolicy({
        version: 1,
        agents: { main: { mcpTools: "bad" } },
      }),
    ).toBe(false);
    expect(
      isValidExecApprovalsPolicy({
        version: 1,
        agents: {
          main: {
            mcpTools: [
              {
                server: "filesystem",
                tool: "read_file",
                source: "allow-always",
                addedAt: 1,
              },
            ],
          },
        },
      }),
    ).toBe(true);
  });

  it("runs Doctor once when the config predates the installed OpenClaw", () => {
    const { configPath, stateDir } = createConfig({
      meta: { lastTouchedVersion: "2026.7.1" },
      agents: { list: [{ id: "main", default: true }] },
    });
    const execFileSyncImpl = vi.fn((_executable, args) => {
      if (args[0].endsWith("openclaw.mjs") && args[1] === "doctor") {
        fs.writeFileSync(
          configPath,
          `${JSON.stringify({
            meta: { lastTouchedVersion: "2026.9.6" },
            agents: { entries: { main: {} } },
          })}\n`,
          "utf8",
        );
      }
    });

    const first = runOpenclawDoctorPreflight({
      configPath,
      stateDir,
      execFileSyncImpl,
      packageInfo: kPackageInfo,
    });
    const second = runOpenclawDoctorPreflight({
      configPath,
      stateDir,
      execFileSyncImpl,
      packageInfo: kPackageInfo,
    });

    expect(first).toMatchObject({
      ran: true,
      changed: true,
      fromVersion: "2026.7.1",
      toVersion: "2026.9.6",
    });
    expect(second).toMatchObject({ ran: false, changed: false });
    expect(execFileSyncImpl).toHaveBeenCalledTimes(2);
    expect(execFileSyncImpl).toHaveBeenNthCalledWith(
      1,
      process.execPath,
      [
        "/tmp/openclaw/openclaw.mjs",
        "doctor",
        "--fix",
        "--non-interactive",
        "--yes",
      ],
      expect.objectContaining({
        env: expect.objectContaining({
          OPENCLAW_CONFIG_PATH: configPath,
          OPENCLAW_STATE_DIR: stateDir,
        }),
      }),
    );
    expect(execFileSyncImpl).toHaveBeenNthCalledWith(
      2,
      process.execPath,
      ["/tmp/openclaw/openclaw.mjs", "config", "validate", "--json"],
      expect.objectContaining({
        env: expect.objectContaining({
          OPENCLAW_CONFIG_PATH: configPath,
          OPENCLAW_STATE_DIR: stateDir,
        }),
        stdio: "ignore",
      }),
    );
  });

  it("restores the original config when Doctor fails", () => {
    const original = {
      meta: { lastTouchedVersion: "2026.7.1" },
      commands: { ownerDisplay: "raw" },
    };
    const { configPath, stateDir } = createConfig(original);
    const execFileSyncImpl = vi.fn(() => {
      fs.writeFileSync(configPath, "{ broken", "utf8");
      throw new Error("doctor failed");
    });

    expect(() =>
      runOpenclawDoctorPreflight({
        configPath,
        stateDir,
        execFileSyncImpl,
        packageInfo: kPackageInfo,
      }),
    ).toThrow("restored the original config");
    expect(JSON.parse(fs.readFileSync(configPath, "utf8"))).toEqual(original);
  });

  it("runs Doctor for a legacy state blocker even when the config version is current", () => {
    const { configPath, stateDir } = createConfig({
      meta: { lastTouchedVersion: "2026.9.6" },
    });
    const approvalsPath = path.join(stateDir, "exec-approvals.json");
    fs.writeFileSync(
      approvalsPath,
      JSON.stringify({
        version: 1,
        defaults: { security: "full", ask: "off", askFallback: "full" },
        agents: {},
      }),
      "utf8",
    );
    const execFileSyncImpl = vi.fn((_executable, args) => {
      if (args[1] === "doctor") fs.rmSync(approvalsPath);
    });

    const result = runOpenclawDoctorPreflight({
      configPath,
      stateDir,
      execFileSyncImpl,
      packageInfo: kPackageInfo,
    });

    expect(result).toMatchObject({
      ran: true,
      changed: false,
      fromVersion: "2026.9.6",
      toVersion: "2026.9.6",
    });
    expect(execFileSyncImpl).toHaveBeenCalledTimes(2);
    expect(fs.existsSync(approvalsPath)).toBe(false);
  });

  it("detects legacy per-agent auth state and gives Doctor enough time to migrate it", () => {
    const { configPath, stateDir } = createConfig({
      meta: { lastTouchedVersion: "2026.9.6" },
    });
    const agentDir = path.join(stateDir, "agents", "main", "agent");
    fs.mkdirSync(agentDir, { recursive: true });
    const authPath = path.join(agentDir, "auth-profiles.json");
    fs.writeFileSync(authPath, '{"version":1,"profiles":{}}', "utf8");
    const execFileSyncImpl = vi.fn((_executable, args) => {
      if (args[1] === "doctor") fs.rmSync(authPath);
    });

    expect(hasLegacyAuthState({ stateDir })).toBe(true);
    const result = runOpenclawDoctorPreflight({
      configPath,
      stateDir,
      env: { ALPHACLAW_OPENCLAW_DOCTOR_TIMEOUT_MS: "720000" },
      execFileSyncImpl,
      packageInfo: kPackageInfo,
    });

    expect(result).toMatchObject({
      ran: true,
      fromVersion: "2026.9.6",
      toVersion: "2026.9.6",
    });
    expect(execFileSyncImpl).toHaveBeenNthCalledWith(
      1,
      process.execPath,
      expect.arrayContaining(["doctor"]),
      expect.objectContaining({ timeout: 720_000 }),
    );
    expect(hasLegacyAuthState({ stateDir })).toBe(false);
  });

  it("archives an AlphaClaw default stub when SQLite already owns exec policy", () => {
    const { configPath, stateDir } = createConfig({
      meta: { lastTouchedVersion: "2026.9.6" },
    });
    const approvalsPath = path.join(stateDir, "exec-approvals.json");
    fs.writeFileSync(
      approvalsPath,
      `${JSON.stringify({
        version: 1,
        defaults: { security: "full", ask: "off", askFallback: "full" },
        agents: {},
      }, null, 2)}\n`,
      "utf8",
    );
    const sqliteDir = path.join(stateDir, "state");
    fs.mkdirSync(sqliteDir, { recursive: true });
    const databasePath = path.join(sqliteDir, "openclaw.sqlite");
    const canonicalPolicy = {
      version: 1,
      defaults: {
        security: "allowlist",
        ask: "always",
        askFallback: "deny",
      },
      agents: {
        main: { allowlist: [{ pattern: "ls" }] },
      },
    };
    const db = new DatabaseSync(databasePath);
    db.exec(`
      CREATE TABLE exec_approvals_config (
        config_key TEXT PRIMARY KEY,
        raw_json TEXT NOT NULL
      );
    `);
    db.prepare(
      "INSERT INTO exec_approvals_config (config_key, raw_json) VALUES (?, ?)",
    ).run("current", `${JSON.stringify(canonicalPolicy, null, 2)}\n`);
    db.close();
    const execFileSyncImpl = vi.fn();

    const result = runOpenclawDoctorPreflight({
      configPath,
      stateDir,
      execFileSyncImpl,
      packageInfo: kPackageInfo,
    });

    expect(result).toMatchObject({
      ran: false,
      changed: false,
      reason: "retired-managed-exec-approvals",
      retiredManagedExecApprovals: { retired: true, sourcePath: approvalsPath },
    });
    expect(execFileSyncImpl).not.toHaveBeenCalled();
    expect(fs.existsSync(approvalsPath)).toBe(false);
    expect(fs.existsSync(result.retiredManagedExecApprovals.archivePath)).toBe(true);
    const verifyDb = new DatabaseSync(databasePath, { readOnly: true });
    const row = verifyDb
      .prepare(
        "SELECT raw_json FROM exec_approvals_config WHERE config_key = 'current'",
      )
      .get();
    verifyDb.close();
    expect(JSON.parse(row.raw_json)).toEqual(canonicalPolicy);
  });

  it("leaves customized legacy exec policy for OpenClaw to reconcile", () => {
    const { configPath, stateDir } = createConfig({
      meta: { lastTouchedVersion: "2026.9.6" },
    });
    const approvalsPath = path.join(stateDir, "exec-approvals.json");
    fs.writeFileSync(
      approvalsPath,
      `${JSON.stringify({
        version: 1,
        defaults: { security: "allowlist", ask: "always", askFallback: "deny" },
        agents: { main: { allowlist: [{ pattern: "ls" }] } },
      })}\n`,
      "utf8",
    );
    const sqliteDir = path.join(stateDir, "state");
    fs.mkdirSync(sqliteDir, { recursive: true });
    const db = new DatabaseSync(path.join(sqliteDir, "openclaw.sqlite"));
    db.exec(`
      CREATE TABLE exec_approvals_config (
        config_key TEXT PRIMARY KEY,
        raw_json TEXT NOT NULL
      );
      INSERT INTO exec_approvals_config (config_key, raw_json)
      VALUES ('current', '{"version":1,"defaults":{},"agents":{}}');
    `);
    db.close();
    const execFileSyncImpl = vi.fn((_executable, args) => {
      if (args[1] === "doctor") throw new Error("conflicting policies");
    });

    expect(() =>
      runOpenclawDoctorPreflight({
        configPath,
        stateDir,
        execFileSyncImpl,
        packageInfo: kPackageInfo,
      }),
    ).toThrow("conflicting policies");
    expect(fs.existsSync(approvalsPath)).toBe(true);
    expect(
      fs.readdirSync(stateDir).some((name) =>
        name.startsWith("exec-approvals.json.alphaclaw-retired-"),
      ),
    ).toBe(false);
  });

  it("does not archive the managed stub when SQLite policy is malformed", () => {
    const { configPath, stateDir } = createConfig({
      meta: { lastTouchedVersion: "2026.9.6" },
    });
    const approvalsPath = path.join(stateDir, "exec-approvals.json");
    fs.writeFileSync(
      approvalsPath,
      JSON.stringify({
        version: 1,
        defaults: { security: "full", ask: "off", askFallback: "full" },
        agents: {},
      }),
      "utf8",
    );
    const sqliteDir = path.join(stateDir, "state");
    fs.mkdirSync(sqliteDir, { recursive: true });
    const db = new DatabaseSync(path.join(sqliteDir, "openclaw.sqlite"));
    db.exec(`
      CREATE TABLE exec_approvals_config (
        config_key TEXT PRIMARY KEY,
        raw_json TEXT NOT NULL
      );
      INSERT INTO exec_approvals_config (config_key, raw_json)
      VALUES ('current', '{"version":2,"defaults":{},"agents":{}}');
    `);
    db.close();
    const execFileSyncImpl = vi.fn(() => {
      throw new Error("malformed canonical policy");
    });

    expect(() =>
      runOpenclawDoctorPreflight({
        configPath,
        stateDir,
        execFileSyncImpl,
        packageInfo: kPackageInfo,
      }),
    ).toThrow("malformed canonical policy");
    expect(fs.existsSync(approvalsPath)).toBe(true);
    expect(
      fs.readdirSync(stateDir).some((name) =>
        name.startsWith("exec-approvals.json.alphaclaw-retired-"),
      ),
    ).toBe(false);
  });

  it(
    "migrates current-version legacy exec approvals into OpenClaw SQLite state",
    () => {
      const { configPath, stateDir } = createConfig({
        meta: { lastTouchedVersion: "2026.9.6" },
      });
      const approvalsPath = path.join(stateDir, "exec-approvals.json");
      fs.writeFileSync(
        approvalsPath,
        `${JSON.stringify({
          version: 1,
          defaults: { security: "full", ask: "off", askFallback: "full" },
          agents: {},
        }, null, 2)}\n`,
        "utf8",
      );

      const result = runOpenclawDoctorPreflight({
        configPath,
        stateDir,
        stdio: "ignore",
        env: {
          ...process.env,
          HOME: stateDir,
          OPENCLAW_HOME: stateDir,
        },
      });

      expect(result.ran).toBe(true);
      expect(fs.existsSync(approvalsPath)).toBe(false);
      const db = new DatabaseSync(path.join(stateDir, "state", "openclaw.sqlite"), {
        readOnly: true,
      });
      const row = db
        .prepare(
          "SELECT default_security, default_ask, default_ask_fallback " +
            "FROM exec_approvals_config WHERE config_key = 'current'",
        )
        .get();
      db.close();
      expect(row).toEqual({
        default_security: "full",
        default_ask: "off",
        default_ask_fallback: "full",
      });
    },
    180_000,
  );

  it(
    "uses supported Doctor migrations for legacy Codex routes and OAuth state",
    () => {
      const { configPath, stateDir } = createConfig({
        meta: { lastTouchedVersion: "2026.9.3" },
        agents: {
          defaults: {
            model: { primary: "openai-codex/gpt-5.5" },
            models: { "openai-codex/gpt-5.5": {} },
          },
        },
        auth: {
          profiles: {
            "openai-codex:codex-cli": {
              provider: "openai-codex",
              mode: "oauth",
            },
          },
        },
      });
      const agentDir = path.join(stateDir, "agents", "main", "agent");
      fs.mkdirSync(agentDir, { recursive: true });
      const authPath = path.join(agentDir, "auth-profiles.json");
      fs.writeFileSync(
        authPath,
        JSON.stringify({
          version: 1,
          profiles: {
            "openai-codex:codex-cli": {
              type: "oauth",
              provider: "openai-codex",
              access: "test-access",
              refresh: "test-refresh",
              expires: Date.now() + 3_600_000,
            },
          },
        }),
        "utf8",
      );

      const result = runOpenclawDoctorPreflight({
        configPath,
        stateDir,
        stdio: "ignore",
        env: {
          ...process.env,
          HOME: stateDir,
          OPENCLAW_HOME: stateDir,
        },
      });
      const migrated = JSON.parse(fs.readFileSync(configPath, "utf8"));

      expect(result).toMatchObject({ ran: true, toVersion: "2026.9.8" });
      expect(migrated.agents.defaults.model.primary).toBe("openai/gpt-5.5");
      expect(migrated.agents.defaults.models["openai/gpt-5.5"]).toMatchObject({
        agentRuntime: { id: "codex" },
      });
      expect(fs.existsSync(authPath)).toBe(false);
      expect(
        fs.readdirSync(agentDir).some((name) =>
          name.startsWith("auth-profiles.json.migrated-"),
        ),
      ).toBe(true);
      const packageInfo = findOpenclawPackage();
      const status = JSON.parse(
        childProcess.execFileSync(
          process.execPath,
          [resolveOpenclawCliPath(packageInfo), "models", "status", "--json"],
          {
            env: {
              PATH: process.env.PATH,
              TMPDIR: process.env.TMPDIR,
              HOME: stateDir,
              OPENCLAW_HOME: stateDir,
              OPENCLAW_CONFIG_PATH: configPath,
              OPENCLAW_STATE_DIR: stateDir,
            },
            encoding: "utf8",
            timeout: 30_000,
          },
        ),
      );
      expect(status.auth.providersWithOAuth).toContain("openai (1)");
      expect(status.auth.providers[0].profiles.labels).toContain(
        "openai:chatgpt-codex-cli=OAuth",
      );
    },
    300_000,
  );

  it("restores the original config when post-Doctor validation fails", () => {
    const original = {
      meta: { lastTouchedVersion: "2026.7.1" },
      commands: { ownerDisplay: "raw" },
    };
    const { configPath, stateDir } = createConfig(original);
    const execFileSyncImpl = vi.fn((_executable, args) => {
      if (args[1] === "doctor") {
        fs.writeFileSync(
          configPath,
          `${JSON.stringify({
            meta: { lastTouchedVersion: "2026.9.6" },
            plugins: { load: { paths: ["/missing/plugin"] } },
          })}\n`,
          "utf8",
        );
        return;
      }
      throw new Error("config validation failed");
    });

    expect(() =>
      runOpenclawDoctorPreflight({
        configPath,
        stateDir,
        execFileSyncImpl,
        packageInfo: kPackageInfo,
      }),
    ).toThrow("restored the original config");
    expect(execFileSyncImpl).toHaveBeenCalledTimes(2);
    expect(JSON.parse(fs.readFileSync(configPath, "utf8"))).toEqual(original);
  });

  it(
    "migrates a versionless valid 2026.7.1 config and validates it with OpenClaw 2026.9.8",
    () => {
      const stateDir = fs.mkdtempSync(
        path.join(os.tmpdir(), "alphaclaw-versionless-config-"),
      );
      const configPath = path.join(stateDir, "openclaw.json");
      const fixture = JSON.parse(
        fs.readFileSync(
          path.join(
            __dirname,
            "..",
            "fixtures",
            "openclaw-2026.7.1-config.json",
          ),
          "utf8",
        ),
      );
      delete fixture.meta.lastTouchedVersion;
      fs.writeFileSync(
        configPath,
        `${JSON.stringify(fixture, null, 2)}\n`,
        "utf8",
      );

      const result = runOpenclawDoctorPreflight({
        configPath,
        stateDir,
        stdio: "ignore",
        env: {
          ...process.env,
          HOME: stateDir,
          OPENCLAW_HOME: stateDir,
        },
      });
      const migrated = JSON.parse(fs.readFileSync(configPath, "utf8"));

      expect(result).toMatchObject({
        ran: true,
        changed: true,
        fromVersion: "unknown",
        toVersion: "2026.9.8",
      });
      expect(migrated.meta.lastTouchedVersion).toBe("2026.9.8");
      expect(migrated.meta.lastTouchedAt).toBeUndefined();
      expect(migrated.commands.ownerDisplay).toBeUndefined();
      expect(migrated.gateway.tailscale.resetOnExit).toBeUndefined();
      expect(migrated.agents.entries).toMatchObject({ main: {}, ops: {} });
      expect(migrated.bindings).toContainEqual({
        agentId: "ops",
        match: { channel: "telegram", accountId: "alerts" },
      });
      expect(migrated.hooks.mappings[0]).toMatchObject({
        id: "schwab",
        agentId: "ops",
      });
      expect(
        runOpenclawDoctorPreflight({ configPath, stateDir }),
      ).toMatchObject({ ran: false, changed: false });
    },
    180_000,
  );

  it(
    "migrates a valid 2026.7.1 config and validates it with OpenClaw 2026.9.8",
    () => {
      const stateDir = fs.mkdtempSync(
        path.join(os.tmpdir(), "alphaclaw-legacy-config-"),
      );
      const configPath = path.join(stateDir, "openclaw.json");
      fs.copyFileSync(
        path.join(
          __dirname,
          "..",
          "fixtures",
          "openclaw-2026.7.1-config.json",
        ),
        configPath,
      );

      const result = runOpenclawDoctorPreflight({
        configPath,
        stateDir,
        stdio: "ignore",
        env: {
          ...process.env,
          HOME: stateDir,
          OPENCLAW_HOME: stateDir,
        },
      });
      const migrated = JSON.parse(fs.readFileSync(configPath, "utf8"));

      expect(result).toMatchObject({
        ran: true,
        changed: true,
        fromVersion: "2026.7.1",
        toVersion: "2026.9.8",
      });
      expect(fs.existsSync(`${configPath}.bak`)).toBe(true);
      expect(migrated.meta.lastTouchedAt).toBeUndefined();
      expect(migrated.commands.ownerDisplay).toBeUndefined();
      expect(migrated.gateway.tailscale.resetOnExit).toBeUndefined();
      expect(migrated.agents.entries).toMatchObject({ main: {}, ops: {} });
      expect(migrated.agents.ownership).toBe("explicit");
      expect(migrated.bindings).toContainEqual({
        agentId: "ops",
        match: { channel: "telegram", accountId: "alerts" },
      });
      expect(migrated.hooks.mappings[0]).toMatchObject({
        id: "schwab",
        agentId: "ops",
      });
      expect(migrated.tools.exec).toEqual({ host: "gateway", ask: "off" });
      expect(migrated.hooks.token).not.toBe("legacy-fixture-token");
      expect(migrated.plugins.allow).toContain("telegram");
      expect(migrated.plugins.load).toEqual({ paths: [] });
      expect(migrated.plugins.entries.telegram).toEqual({ enabled: true });

      expect(ensureLegacyCompatibilityDefaults(migrated)).toBe(true);
      fs.writeFileSync(
        configPath,
        `${JSON.stringify(migrated, null, 2)}\n`,
        "utf8",
      );
      const packageInfo = findOpenclawPackage();
      const cliPath = resolveOpenclawCliPath(packageInfo);
      expect(() =>
        childProcess.execFileSync(
          process.execPath,
          [cliPath, "config", "validate", "--json"],
          {
            env: {
              ...process.env,
              HOME: stateDir,
              OPENCLAW_HOME: stateDir,
              OPENCLAW_CONFIG_PATH: configPath,
              OPENCLAW_STATE_DIR: stateDir,
            },
            stdio: "ignore",
            timeout: 30_000,
          },
        ),
      ).not.toThrow();
      expect(
        runOpenclawDoctorPreflight({ configPath, stateDir }),
      ).toMatchObject({ ran: false, changed: false });
      expect(ensureLegacyCompatibilityDefaults(migrated)).toBe(false);
    },
    180_000,
  );
});
