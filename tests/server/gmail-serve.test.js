const { EventEmitter } = require("events");
const childProcess = require("child_process");

// gmail-serve destructures `spawn` from child_process at load time, so the
// stub has to be installed before the module is required. Drop any cached
// copy of the module to guarantee it picks up the stub.
const spawnState = { impl: null, calls: [] };
const realSpawn = childProcess.spawn;
childProcess.spawn = (command, args, options) => {
  spawnState.calls.push({ command, args, options });
  return spawnState.impl(command, args, options);
};
try {
  delete require.cache[require.resolve("../../lib/server/gmail-serve")];
} catch {}

const { createGmailServeManager } = require("../../lib/server/gmail-serve");

afterAll(() => {
  childProcess.spawn = realSpawn;
});

const kDeadPid = 2147483647;

class FakeChild extends EventEmitter {
  constructor({ pid = process.pid, killBehavior = "exit" } = {}) {
    super();
    this.pid = pid;
    this.killed = false;
    this.stdout = new EventEmitter();
    this.stderr = new EventEmitter();
    this.kills = [];
    this.killBehavior = killBehavior;
  }

  kill(signal) {
    this.kills.push(signal);
    if (this.killBehavior === "throw") throw new Error("kill failed");
    if (this.killBehavior === "ignore") return true;
    if (this.killBehavior === "exitOnSigkill") {
      if (signal === "SIGKILL") {
        this.killed = true;
        this.emit("exit", null, signal);
      }
      return true;
    }
    this.killed = true;
    this.emit("exit", 0, signal);
    return true;
  }
}

const baseConstants = {
  PORT: 4100,
  OPENCLAW_DIR: "/tmp/openclaw-test",
  GOG_KEYRING_PASSWORD: "keyring-pass",
  kGmailMaxBodyBytes: 12345,
};

const baseAccount = {
  id: "acct-1",
  email: "ops@example.com",
  client: "default",
};

describe("server/gmail-serve", () => {
  beforeEach(() => {
    spawnState.calls = [];
    spawnState.impl = () => new FakeChild();
  });

  it("starts a serve process with default client args", async () => {
    const onServeExit = vi.fn();
    const manager = createGmailServeManager({
      constants: baseConstants,
      onServeExit,
    });
    const status = await manager.startServe({
      account: baseAccount,
      port: 18801,
      webhookToken: "hook-token",
    });

    expect(status).toMatchObject({
      running: true,
      pid: process.pid,
      port: 18801,
      accountId: "acct-1",
      email: "ops@example.com",
      client: "default",
    });
    expect(status.startedAt).toEqual(expect.any(String));
    expect(spawnState.calls).toHaveLength(1);
    const call = spawnState.calls[0];
    expect(call.command).toBe("gog");
    expect(call.args).not.toContain("--client");
    expect(call.args).toEqual(
      expect.arrayContaining([
        "gmail",
        "watch",
        "serve",
        "--account",
        "ops@example.com",
        "--bind",
        "127.0.0.1",
        "--port",
        "18801",
        "--hook-url",
        "http://127.0.0.1:4100/hooks/gmail",
        "--hook-token",
        "hook-token",
        "--include-body",
        "--max-bytes",
        "12345",
      ]),
    );
    expect(call.options.env.XDG_CONFIG_HOME).toBe("/tmp/openclaw-test");
    expect(call.options.env.GOG_KEYRING_PASSWORD).toBe("keyring-pass");

    expect(manager.getServeStatus("acct-1").running).toBe(true);
    expect(manager.listServeStatuses()).toHaveLength(1);
  });

  it("drains stdout and stderr without side effects", async () => {
    let child;
    spawnState.impl = () => {
      child = new FakeChild();
      return child;
    };
    const manager = createGmailServeManager({ constants: baseConstants });
    await manager.startServe({
      account: baseAccount,
      port: 18801,
      webhookToken: "tok",
    });
    expect(() => {
      child.stdout.emit("data", Buffer.from("out"));
      child.stderr.emit("data", Buffer.from("err"));
    }).not.toThrow();
  });

  it("reuses a running entry instead of spawning again", async () => {
    const manager = createGmailServeManager({ constants: baseConstants });
    const first = await manager.startServe({
      account: baseAccount,
      port: 18801,
      webhookToken: "tok",
    });
    const second = await manager.startServe({
      account: baseAccount,
      port: 18999,
      webhookToken: "tok",
    });
    expect(spawnState.calls).toHaveLength(1);
    expect(second.port).toBe(first.port);
  });

  it("uses the personal client fallback and default max bytes", async () => {
    const manager = createGmailServeManager({
      constants: { ...baseConstants, kGmailMaxBodyBytes: undefined },
    });
    await manager.startServe({
      account: { id: "acct-p", email: "me@gmail.com", personal: true },
      port: 18802,
      webhookToken: "tok",
    });
    const call = spawnState.calls[0];
    expect(call.args.slice(0, 2)).toEqual(["--client", "personal"]);
    expect(call.args[call.args.length - 1]).toBe("20000");
    expect(manager.getServeStatus("acct-p").client).toBe("personal");
  });

  it("falls back to the default client when none is set", async () => {
    const manager = createGmailServeManager({ constants: baseConstants });
    await manager.startServe({
      account: { id: "acct-d", email: "d@corp.com" },
      port: 18805,
      webhookToken: "tok",
    });
    expect(spawnState.calls[0].args).not.toContain("--client");
    expect(manager.getServeStatus("acct-d").client).toBe("default");
  });

  it("passes explicit non-default clients through", async () => {
    const manager = createGmailServeManager({ constants: baseConstants });
    await manager.startServe({
      account: { id: "acct-w", email: "w@corp.com", client: "work" },
      port: 18803,
      webhookToken: "tok",
    });
    expect(spawnState.calls[0].args.slice(0, 2)).toEqual(["--client", "work"]);
  });

  it("validates start inputs", async () => {
    const manager = createGmailServeManager({ constants: baseConstants });
    await expect(
      manager.startServe({ account: {}, port: 18801, webhookToken: "tok" }),
    ).rejects.toThrow("Account id is required");
    await expect(
      manager.startServe({ account: { id: "a" }, port: 18801, webhookToken: "tok" }),
    ).rejects.toThrow("Account email is required");
    await expect(
      manager.startServe({ account: baseAccount, port: "nope", webhookToken: "tok" }),
    ).rejects.toThrow("A valid serve port is required");
    await expect(
      manager.startServe({ account: baseAccount, port: -2, webhookToken: "tok" }),
    ).rejects.toThrow("A valid serve port is required");
    await expect(
      manager.startServe({ account: baseAccount, port: 18801, webhookToken: "  " }),
    ).rejects.toThrow("WEBHOOK_TOKEN is required to start Gmail watch serve");
    expect(spawnState.calls).toHaveLength(0);
  });

  it("replaces an entry whose process has died", async () => {
    const children = [];
    spawnState.impl = (command, args) => {
      const child = new FakeChild({
        pid: children.length === 0 ? kDeadPid : process.pid,
      });
      children.push(child);
      return child;
    };
    const manager = createGmailServeManager({ constants: baseConstants });
    await manager.startServe({
      account: baseAccount,
      port: 18801,
      webhookToken: "tok",
    });
    const second = await manager.startServe({
      account: baseAccount,
      port: 18801,
      webhookToken: "tok",
    });
    expect(spawnState.calls).toHaveLength(2);
    expect(second.pid).toBe(process.pid);
  });

  it("removes the entry and reports exits", async () => {
    let child;
    spawnState.impl = () => {
      child = new FakeChild();
      return child;
    };
    const onServeExit = vi.fn();
    const manager = createGmailServeManager({
      constants: baseConstants,
      onServeExit,
    });
    await manager.startServe({
      account: baseAccount,
      port: 18801,
      webhookToken: "tok",
    });
    child.emit("exit", 0, null);
    expect(onServeExit).toHaveBeenCalledWith({
      accountId: "acct-1",
      email: "ops@example.com",
      client: "default",
      port: 18801,
      code: 0,
      signal: null,
    });
    expect(manager.getServeStatus("acct-1")).toMatchObject({
      running: false,
      pid: null,
      port: null,
    });
    expect(manager.listServeStatuses()).toEqual([]);
  });

  it("keeps the replacement entry when a stale child exits", async () => {
    const children = [];
    spawnState.impl = () => {
      const child = new FakeChild({
        pid: children.length === 0 ? kDeadPid : process.pid,
      });
      children.push(child);
      return child;
    };
    const onServeExit = vi.fn();
    const manager = createGmailServeManager({
      constants: baseConstants,
      onServeExit,
    });
    await manager.startServe({
      account: baseAccount,
      port: 18801,
      webhookToken: "tok",
    });
    await manager.startServe({
      account: baseAccount,
      port: 18801,
      webhookToken: "tok",
    });
    children[0].emit("exit", 1, null);
    expect(onServeExit).toHaveBeenCalledTimes(1);
    expect(manager.getServeStatus("acct-1").running).toBe(true);
  });

  it("uses the default no-op exit callback when none is provided", async () => {
    let child;
    spawnState.impl = () => {
      child = new FakeChild();
      return child;
    };
    const manager = createGmailServeManager({ constants: baseConstants });
    await manager.startServe({
      account: baseAccount,
      port: 18801,
      webhookToken: "tok",
    });
    expect(() => child.emit("exit", 0, null)).not.toThrow();
  });

  it("reports killed children as not running", async () => {
    let child;
    spawnState.impl = () => {
      child = new FakeChild();
      return child;
    };
    const manager = createGmailServeManager({ constants: baseConstants });
    await manager.startServe({
      account: baseAccount,
      port: 18801,
      webhookToken: "tok",
    });
    child.killed = true;
    expect(manager.getServeStatus("acct-1")).toMatchObject({
      running: false,
      pid: process.pid,
    });
  });

  it("treats stopServe on unknown accounts as stopped", async () => {
    const manager = createGmailServeManager({ constants: baseConstants });
    await expect(manager.stopServe({ accountId: "ghost" })).resolves.toEqual({
      stopped: true,
      accountId: "ghost",
    });
  });

  it("cleans up entries with dead pids on stopServe", async () => {
    spawnState.impl = () => new FakeChild({ pid: kDeadPid });
    const manager = createGmailServeManager({ constants: baseConstants });
    await manager.startServe({
      account: baseAccount,
      port: 18801,
      webhookToken: "tok",
    });
    await expect(manager.stopServe({ accountId: "acct-1" })).resolves.toEqual({
      stopped: true,
      accountId: "acct-1",
    });
    expect(manager.listServeStatuses()).toEqual([]);
  });

  it("stops gracefully on SIGTERM", async () => {
    let child;
    spawnState.impl = () => {
      child = new FakeChild();
      return child;
    };
    const manager = createGmailServeManager({ constants: baseConstants });
    await manager.startServe({
      account: baseAccount,
      port: 18801,
      webhookToken: "tok",
    });
    const result = await manager.stopServe({ accountId: "acct-1" });
    expect(result).toEqual({ stopped: true, forced: false, accountId: "acct-1" });
    expect(child.kills).toEqual(["SIGTERM"]);
    expect(manager.listServeStatuses()).toEqual([]);
  });

  it("escalates to SIGKILL when the child ignores SIGTERM", async () => {
    let child;
    spawnState.impl = () => {
      child = new FakeChild({ killBehavior: "ignore" });
      return child;
    };
    const manager = createGmailServeManager({ constants: baseConstants });
    await manager.startServe({
      account: baseAccount,
      port: 18801,
      webhookToken: "tok",
    });
    const result = await manager.stopServe({ accountId: "acct-1", timeoutMs: 1 });
    expect(result).toEqual({ stopped: false, forced: true, accountId: "acct-1" });
    expect(child.kills).toEqual(["SIGTERM", "SIGKILL"]);
  });

  it("does not double-settle when the child exits during SIGKILL", async () => {
    let child;
    spawnState.impl = () => {
      child = new FakeChild({ killBehavior: "exitOnSigkill" });
      return child;
    };
    const manager = createGmailServeManager({ constants: baseConstants });
    await manager.startServe({
      account: baseAccount,
      port: 18801,
      webhookToken: "tok",
    });
    const result = await manager.stopServe({ accountId: "acct-1", timeoutMs: 1 });
    expect(result).toEqual({ stopped: true, forced: false, accountId: "acct-1" });
    expect(child.kills).toEqual(["SIGTERM", "SIGKILL"]);
  });

  it("finalizes when kill throws synchronously", async () => {
    let child;
    spawnState.impl = () => {
      child = new FakeChild({ killBehavior: "throw" });
      return child;
    };
    const manager = createGmailServeManager({ constants: baseConstants });
    await manager.startServe({
      account: baseAccount,
      port: 18801,
      webhookToken: "tok",
    });
    const result = await manager.stopServe({ accountId: "acct-1" });
    expect(result).toEqual({ stopped: true, forced: false, accountId: "acct-1" });
  });

  it("restarts a serve process", async () => {
    const manager = createGmailServeManager({ constants: baseConstants });
    await manager.startServe({
      account: baseAccount,
      port: 18801,
      webhookToken: "tok",
    });
    const status = await manager.restartServe({
      account: baseAccount,
      port: 18804,
      webhookToken: "tok",
    });
    expect(spawnState.calls).toHaveLength(2);
    expect(status.port).toBe(18804);
  });

  it("restarts even when no account id is provided", async () => {
    const manager = createGmailServeManager({ constants: baseConstants });
    await expect(
      manager.restartServe({ account: null, port: 18801, webhookToken: "tok" }),
    ).rejects.toThrow("Account id is required");
  });

  it("stops all running serves", async () => {
    const manager = createGmailServeManager({ constants: baseConstants });
    await manager.startServe({
      account: baseAccount,
      port: 18801,
      webhookToken: "tok",
    });
    await manager.startServe({
      account: { id: "acct-2", email: "b@x.com", client: "work" },
      port: 18802,
      webhookToken: "tok",
    });
    const results = await manager.stopAll();
    expect(results).toHaveLength(2);
    expect(results.every((result) => result.stopped)).toBe(true);
    expect(manager.listServeStatuses()).toEqual([]);
  });

  it("exposes isPidRunning", () => {
    const manager = createGmailServeManager({ constants: baseConstants });
    expect(manager.isPidRunning(process.pid)).toBe(true);
    expect(manager.isPidRunning(kDeadPid)).toBe(false);
    expect(manager.isPidRunning("abc")).toBe(false);
    expect(manager.isPidRunning(0)).toBe(false);
    expect(manager.isPidRunning(null)).toBe(false);
  });
});
