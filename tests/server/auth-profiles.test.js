const fs = require("fs");
const path = require("path");
const os = require("os");
const { DatabaseSync } = require("node:sqlite");

let tmpDir;
let ap;

const readJson = (relPath) =>
  JSON.parse(
    fs.readFileSync(path.join(tmpDir, ".openclaw", relPath), "utf8"),
  );

beforeAll(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "ac-auth-test-"));
  process.env.ALPHACLAW_ROOT_DIR = tmpDir;

  const openclawDir = path.join(tmpDir, ".openclaw");
  const agentDir = path.join(openclawDir, "agents", "main", "agent");
  fs.mkdirSync(agentDir, { recursive: true });
  fs.writeFileSync(
    path.join(openclawDir, "openclaw.json"),
    JSON.stringify(
      {
        agents: {
          defaults: {
            model: { primary: "anthropic/claude-opus-4-6" },
            models: { "anthropic/claude-opus-4-6": {} },
          },
        },
        gateway: { port: 18789 },
      },
      null,
      2,
    ),
  );

  const { createAuthProfiles } = require("../../lib/server/auth-profiles");
  ap = createAuthProfiles();
});

beforeEach(() => {
  const openclawDir = path.join(tmpDir, ".openclaw");
  fs.writeFileSync(
    path.join(openclawDir, "openclaw.json"),
    JSON.stringify(
      {
        agents: {
          defaults: {
            model: { primary: "anthropic/claude-opus-4-6" },
            models: { "anthropic/claude-opus-4-6": {} },
          },
        },
        gateway: { port: 18789 },
      },
      null,
      2,
    ),
  );
  const storePath = path.join(
    openclawDir,
    "agents",
    "main",
    "agent",
    "auth-profiles.json",
  );
  if (fs.existsSync(storePath)) fs.unlinkSync(storePath);
  const databasePath = path.join(
    openclawDir,
    "agents",
    "main",
    "agent",
    "openclaw-agent.sqlite",
  );
  if (fs.existsSync(databasePath)) fs.unlinkSync(databasePath);
});

afterAll(() => {
  delete process.env.ALPHACLAW_ROOT_DIR;
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("server/auth-profiles", () => {
  it("reads and updates Codex OAuth credentials in the SQLite auth store", () => {
    const databasePath = path.join(
      tmpDir,
      ".openclaw",
      "agents",
      "main",
      "agent",
      "openclaw-agent.sqlite",
    );
    const database = new DatabaseSync(databasePath);
    database.exec(`
      CREATE TABLE auth_profile_store (
        store_key TEXT NOT NULL PRIMARY KEY,
        store_json TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      );
      CREATE TABLE auth_profile_state (
        state_key TEXT NOT NULL PRIMARY KEY,
        state_json TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `);
    database
      .prepare(
        "INSERT INTO auth_profile_store (store_key, store_json, updated_at) VALUES (?, ?, ?)",
      )
      .run(
        "primary",
        JSON.stringify({
          version: 1,
          profiles: {
            "openai:codex-cli": {
              type: "oauth",
              provider: "openai",
              access: "sqlite-access",
              refresh: "sqlite-refresh",
              expires: 123,
            },
          },
        }),
        1,
      );
    database
      .prepare(
        "INSERT INTO auth_profile_state (state_key, state_json, updated_at) VALUES (?, ?, ?)",
      )
      .run("primary", JSON.stringify({ version: 1 }), 1);
    database.close();

    expect(ap.getCodexProfile()).toMatchObject({
      profileId: "openai:codex-cli",
      provider: "openai",
      access: "sqlite-access",
      refresh: "sqlite-refresh",
    });

    ap.upsertCodexProfile({
      access: "updated-access",
      refresh: "updated-refresh",
      expires: 456,
      accountId: "account-1",
    });

    const updatedDatabase = new DatabaseSync(databasePath, { readOnly: true });
    const row = updatedDatabase
      .prepare("SELECT store_json FROM auth_profile_store WHERE store_key = ?")
      .get("primary");
    updatedDatabase.close();
    const updated = JSON.parse(row.store_json);
    expect(updated.profiles["openai:codex-cli"]).toMatchObject({
      access: "updated-access",
      refresh: "updated-refresh",
      expires: 456,
      accountId: "account-1",
    });
    expect(fs.existsSync(path.join(path.dirname(databasePath), "auth-profiles.json"))).toBe(
      false,
    );
  });

  it("upserts an api_key profile and syncs openclaw.json", () => {
    ap.upsertProfile("anthropic:default", {
      type: "api_key",
      provider: "anthropic",
      key: "sk-ant-test-key",
    });

    const store = readJson("agents/main/agent/auth-profiles.json");
    expect(store.version).toBe(1);
    expect(store.profiles["anthropic:default"]).toEqual({
      type: "api_key",
      provider: "anthropic",
      key: "sk-ant-test-key",
    });

    const config = readJson("openclaw.json");
    expect(config.auth.profiles["anthropic:default"]).toEqual({
      provider: "anthropic",
      mode: "api_key",
    });
    expect(config.gateway.port).toBe(18789);
  });

  it("upserts a token profile and syncs config mode", () => {
    ap.upsertProfile("anthropic:manual", {
      type: "token",
      provider: "anthropic",
      token: "sk-ant-oat01-test",
      expires: 9999999999999,
    });

    const store = readJson("agents/main/agent/auth-profiles.json");
    expect(store.profiles["anthropic:manual"].type).toBe("token");
    expect(store.profiles["anthropic:manual"].token).toBe("sk-ant-oat01-test");

    const config = readJson("openclaw.json");
    expect(config.auth.profiles["anthropic:manual"].mode).toBe("token");
  });

  it("upserts an oauth profile and syncs config", () => {
    ap.upsertProfile("openai-codex:codex-cli", {
      type: "oauth",
      provider: "openai-codex",
      access: "jwt-access",
      refresh: "rt-refresh",
      expires: 9999999999999,
      accountId: "test-account",
    });

    const store = readJson("agents/main/agent/auth-profiles.json");
    expect(store.profiles["openai-codex:codex-cli"].type).toBe("oauth");

    const config = readJson("openclaw.json");
    expect(config.auth.profiles["openai-codex:codex-cli"].mode).toBe("oauth");
  });

  it("removes a profile and cleans config reference", () => {
    ap.upsertProfile("google:default", {
      type: "api_key",
      provider: "google",
      key: "AItest",
    });

    let config = readJson("openclaw.json");
    expect(config.auth.profiles["google:default"]).toBeDefined();

    ap.removeProfile("google:default");

    const store = readJson("agents/main/agent/auth-profiles.json");
    expect(store.profiles["google:default"]).toBeUndefined();

    config = readJson("openclaw.json");
    expect(config.auth?.profiles?.["google:default"]).toBeUndefined();
  });

  it("preserves order, lastGood, and usageStats on write", () => {
    const storePath = path.join(
      tmpDir,
      ".openclaw",
      "agents",
      "main",
      "agent",
      "auth-profiles.json",
    );
    fs.writeFileSync(
      storePath,
      JSON.stringify({
        version: 1,
        profiles: {
          "anthropic:default": {
            type: "api_key",
            provider: "anthropic",
            key: "existing",
          },
        },
        order: { anthropic: ["anthropic:default"] },
        lastGood: { anthropic: "anthropic:default" },
        usageStats: { total: 42 },
      }),
    );

    ap.upsertProfile("google:default", {
      type: "api_key",
      provider: "google",
      key: "AItest",
    });

    const store = readJson("agents/main/agent/auth-profiles.json");
    expect(store.order).toEqual({ anthropic: ["anthropic:default"] });
    expect(store.lastGood).toEqual({ anthropic: "anthropic:default" });
    expect(store.usageStats).toEqual({ total: 42 });
    expect(store.profiles["anthropic:default"].key).toBe("existing");
    expect(store.profiles["google:default"].key).toBe("AItest");
  });

  it("normalizes secrets (strips whitespace and line breaks)", () => {
    ap.upsertProfile("anthropic:default", {
      type: "api_key",
      provider: "anthropic",
      key: "  sk-ant-key\r\n  ",
    });

    const store = readJson("agents/main/agent/auth-profiles.json");
    expect(store.profiles["anthropic:default"].key).toBe("sk-ant-key");
  });

  it("preserves existing config keys when writing openclaw.json", () => {
    ap.upsertProfile("anthropic:default", {
      type: "api_key",
      provider: "anthropic",
      key: "test",
    });

    const config = readJson("openclaw.json");
    expect(config.agents.defaults.model.primary).toBe(
      "anthropic/claude-opus-4-6",
    );
    expect(config.agents.defaults.models).toEqual({
      "anthropic/claude-opus-4-6": {},
    });
    expect(config.gateway.port).toBe(18789);
  });

  it("setModelConfig writes primary and configuredModels", () => {
    ap.setModelConfig({
      primary: "openai/gpt-5.1-codex",
      configuredModels: {
        "openai/gpt-5.1-codex": {},
        "anthropic/claude-opus-4-6": {},
      },
    });

    const config = readJson("openclaw.json");
    expect(config.agents.defaults.model.primary).toBe("openai/gpt-5.1-codex");
    expect(config.agents.defaults.models).toEqual({
      "openai/gpt-5.1-codex": {},
      "anthropic/claude-opus-4-6": {},
    });
    expect(config.gateway.port).toBe(18789);
  });

  it("preserves the Codex runtime marker when model settings are saved", () => {
    ap.upsertCodexProfile({
      access: "codex-access",
      refresh: "codex-refresh",
      expires: Date.now() + 3_600_000,
    });

    ap.setModelConfig({
      primary: "openai/gpt-5.5",
      configuredModels: {
        "openai/gpt-5.5": {},
        "anthropic/claude-opus-4-6": {},
      },
    });

    expect(ap.getModelConfig().configuredModels).toEqual({
      "openai/gpt-5.5": { agentRuntime: { id: "codex" } },
      "anthropic/claude-opus-4-6": {},
    });
  });

  it("legacy upsertCodexProfile writes oauth and syncs config", () => {
    ap.upsertCodexProfile({
      access: "jwt",
      refresh: "rt",
      expires: 9999999999999,
      accountId: "acct",
    });

    const store = readJson("agents/main/agent/auth-profiles.json");
    expect(store.profiles["openai:codex-cli"]).toEqual({
      type: "oauth",
      provider: "openai",
      access: "jwt",
      refresh: "rt",
      expires: 9999999999999,
      accountId: "acct",
    });

    const config = readJson("openclaw.json");
    expect(config.auth.profiles["openai:codex-cli"].mode).toBe("oauth");
  });

  it("legacy removeCodexProfiles removes all codex profiles", () => {
    ap.upsertCodexProfile({
      access: "jwt",
      refresh: "rt",
      expires: 1,
    });

    let store = readJson("agents/main/agent/auth-profiles.json");
    expect(store.profiles["openai:codex-cli"]).toBeDefined();

    ap.removeCodexProfiles();

    store = readJson("agents/main/agent/auth-profiles.json");
    expect(store.profiles["openai:codex-cli"]).toBeUndefined();

    const config = readJson("openclaw.json");
    expect(config.auth?.profiles?.["openai:codex-cli"]).toBeUndefined();
  });

  it("does not write auth refs into incomplete pre-onboarding config", () => {
    fs.writeFileSync(
      path.join(tmpDir, ".openclaw", "openclaw.json"),
      JSON.stringify(
        {
          auth: {
            profiles: {},
          },
          gateway: { port: 18789 },
        },
        null,
        2,
      ),
    );

    ap.upsertCodexProfile({
      access: "jwt",
      refresh: "rt",
      expires: 9999999999999,
      accountId: "acct",
    });

    const store = readJson("agents/main/agent/auth-profiles.json");
    expect(store.profiles["openai:codex-cli"]).toBeDefined();

    const config = readJson("openclaw.json");
    expect(config.auth?.profiles || {}).toEqual({});
    expect(config.gateway.port).toBe(18789);
  });
});
