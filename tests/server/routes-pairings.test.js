const express = require("express");
const request = require("supertest");

const {
  registerPairingRoutes,
  removeAccountRequestsFromPairingStore,
} = require("../../lib/server/routes/pairings");

const createApp = ({ clawCmd, isOnboarded, fsModule, approveDevicePairingDirect }) => {
  const app = express();
  app.use(express.json());
  registerPairingRoutes({
    app,
    clawCmd,
    isOnboarded,
    fsModule,
    openclawDir: "/tmp/openclaw",
    approveDevicePairingDirect,
  });
  return app;
};

describe("server/routes/pairings", () => {
  it("lists pending pairings with account ids from CLI json output", async () => {
    const clawCmd = vi.fn(async (cmd) => {
      if (cmd === "pairing list --channel telegram --json") {
        return {
          ok: true,
          stdout: JSON.stringify({
            requests: [
              {
                id: "1050628644",
                code: "ABCD1234",
                meta: { accountId: "tester" },
              },
            ],
          }),
          stderr: "",
        };
      }
      if (cmd === "pairing list --channel discord --json") {
        return {
          ok: true,
          stdout: JSON.stringify({ requests: [] }),
          stderr: "",
        };
      }
      return { ok: true, stdout: "{}", stderr: "" };
    });
    const fsModule = {
      existsSync: vi.fn(() => true),
      readFileSync: vi.fn((targetPath) => {
        if (targetPath === "/tmp/openclaw/openclaw.json") {
          return JSON.stringify({
            channels: {
              telegram: { enabled: true },
              discord: { enabled: true },
            },
          });
        }
        throw new Error(`unexpected read: ${targetPath}`);
      }),
      mkdirSync: vi.fn(),
      writeFileSync: vi.fn(),
    };
    const app = createApp({
      clawCmd,
      isOnboarded: () => true,
      fsModule,
    });

    const res = await request(app).get("/api/pairings");

    expect(res.status).toBe(200);
    expect(res.body.pending).toEqual([
      {
        id: "ABCD1234",
        code: "ABCD1234",
        channel: "telegram",
        accountId: "tester",
        requesterId: "1050628644",
      },
    ]);
  });

  it("falls back to the local pairing store when CLI output is empty", async () => {
    const createdAt = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const clawCmd = vi.fn(async (cmd) => {
      if (cmd === "pairing list --channel telegram --json") {
        return {
          ok: true,
          stdout: JSON.stringify({ requests: [] }),
          stderr: "",
        };
      }
      return { ok: true, stdout: "{}", stderr: "" };
    });
    const fsModule = {
      existsSync: vi.fn(() => true),
      readFileSync: vi.fn((targetPath) => {
        if (targetPath === "/tmp/openclaw/openclaw.json") {
          return JSON.stringify({
            channels: {
              telegram: { enabled: true },
            },
          });
        }
        if (targetPath === "/tmp/openclaw/credentials/telegram-pairing.json") {
          return JSON.stringify({
            version: 1,
            requests: [
              {
                id: "1050628644",
                code: "ABCD1234",
                createdAt,
                lastSeenAt: createdAt,
                meta: { accountId: "tester" },
              },
            ],
          });
        }
        throw new Error(`unexpected read: ${targetPath}`);
      }),
      mkdirSync: vi.fn(),
      writeFileSync: vi.fn(),
    };
    const app = createApp({
      clawCmd,
      isOnboarded: () => true,
      fsModule,
    });

    const res = await request(app).get("/api/pairings");

    expect(res.status).toBe(200);
    expect(res.body.pending).toEqual([
      {
        id: "ABCD1234",
        code: "ABCD1234",
        channel: "telegram",
        accountId: "tester",
        requesterId: "1050628644",
        createdAt,
      },
    ]);
  });

  it("parses pending pairings from noisy stderr even when the command exits non-zero", async () => {
    const createdAt = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const clawCmd = vi.fn(async (cmd) => {
      if (cmd === "pairing list --channel telegram --json") {
        return {
          ok: false,
          stdout: "",
          stderr: [
            "00:20:56 [plugins] [usage-tracker] initialized db=/data/db/usage.db",
            "{",
            '  "channel": "telegram",',
            '  "requests": [',
            "    {",
            '      "id": "1050628644",',
            '      "code": "PCQPPPVM",',
            `      "createdAt": "${createdAt}",`,
            `      "lastSeenAt": "${createdAt}",`,
            '      "meta": { "accountId": "default" }',
            "    }",
            "  ]",
            "}",
            "00:21:08 [plugins] ollama installed bundled runtime deps: @sinclair/typebox@0.34.49",
          ].join("\n"),
          code: 1,
        };
      }
      return { ok: true, stdout: "{}", stderr: "" };
    });
    const fsModule = {
      existsSync: vi.fn(() => true),
      readFileSync: vi.fn((targetPath) => {
        if (targetPath === "/tmp/openclaw/openclaw.json") {
          return JSON.stringify({
            channels: {
              telegram: { enabled: true },
            },
          });
        }
        throw new Error(`unexpected read: ${targetPath}`);
      }),
      mkdirSync: vi.fn(),
      writeFileSync: vi.fn(),
    };
    const app = createApp({
      clawCmd,
      isOnboarded: () => true,
      fsModule,
    });

    const res = await request(app).get("/api/pairings");

    expect(res.status).toBe(200);
    expect(res.body.pending).toEqual([
      {
        id: "PCQPPPVM",
        code: "PCQPPPVM",
        channel: "telegram",
        accountId: "default",
        requesterId: "1050628644",
      },
    ]);
  });

  it("includes pending store requests even when the channel is not enabled in config", async () => {
    const createdAt = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const clawCmd = vi.fn(async () => ({ ok: true, stdout: "{}", stderr: "" }));
    const fsModule = {
      existsSync: vi.fn(() => true),
      readFileSync: vi.fn((targetPath) => {
        if (targetPath === "/tmp/openclaw/openclaw.json") {
          return JSON.stringify({ channels: {} });
        }
        if (targetPath === "/tmp/openclaw/credentials/telegram-pairing.json") {
          return JSON.stringify({
            version: 1,
            requests: [
              {
                id: "1050628644",
                code: "PCQPPPVM",
                createdAt,
                lastSeenAt: createdAt,
                meta: { accountId: "default" },
              },
            ],
          });
        }
        throw new Error(`unexpected read: ${targetPath}`);
      }),
      mkdirSync: vi.fn(),
      writeFileSync: vi.fn(),
    };
    const app = createApp({
      clawCmd,
      isOnboarded: () => true,
      fsModule,
    });

    const res = await request(app).get("/api/pairings");

    expect(res.status).toBe(200);
    expect(res.body.pending).toEqual([
      {
        id: "PCQPPPVM",
        code: "PCQPPPVM",
        channel: "telegram",
        accountId: "default",
        requesterId: "1050628644",
        createdAt,
      },
    ]);
  });

  it("parses noisy json stdout without duplicating requester ids as codes", async () => {
    const clawCmd = vi.fn(async (cmd) => {
      if (cmd === "pairing list --channel telegram --json") {
        return {
          ok: true,
          stdout: JSON.stringify({ requests: [] }),
          stderr: "",
        };
      }
      if (cmd === "pairing list --channel discord --json") {
        return {
          ok: true,
          stdout: [
            "debug preface",
            "{",
            '  "channel": "discord",',
            '  "requests": [',
            "    {",
            '      "id": "21963048",',
            '      "code": "TTK6H5HX"',
            "    }",
            "  ]",
            "}",
          ].join("\n"),
          stderr: "",
        };
      }
      return { ok: true, stdout: "{}", stderr: "" };
    });
    const fsModule = {
      existsSync: vi.fn(() => true),
      readFileSync: vi.fn((targetPath) => {
        if (targetPath === "/tmp/openclaw/openclaw.json") {
          return JSON.stringify({
            channels: {
              telegram: { enabled: true },
              discord: { enabled: true },
            },
          });
        }
        throw new Error(`unexpected read: ${targetPath}`);
      }),
      mkdirSync: vi.fn(),
      writeFileSync: vi.fn(),
    };
    const app = createApp({
      clawCmd,
      isOnboarded: () => true,
      fsModule,
    });

    const res = await request(app).get("/api/pairings");

    expect(res.status).toBe(200);
    expect(res.body.pending).toEqual([
      {
        id: "TTK6H5HX",
        code: "TTK6H5HX",
        channel: "discord",
        accountId: "default",
        requesterId: "21963048",
      },
    ]);
  });

  it("passes account id through on pairing approval", async () => {
    const clawCmd = vi.fn(async () => ({ ok: true, stdout: "", stderr: "" }));
    const fsModule = {
      existsSync: vi.fn(() => false),
      mkdirSync: vi.fn(),
      writeFileSync: vi.fn(),
    };
    const app = createApp({
      clawCmd,
      isOnboarded: () => true,
      fsModule,
    });

    const res = await request(app).post("/api/pairings/ABCD1234/approve").send({
      channel: "telegram",
      accountId: "tester",
    });

    expect(res.status).toBe(200);
    expect(clawCmd).toHaveBeenCalledWith(
      "pairing approve --channel 'telegram' --account 'tester' 'ABCD1234'",
    );
  });

  it("rejects invalid pairing approval input before running command", async () => {
    const clawCmd = vi.fn(async () => ({ ok: true, stdout: "", stderr: "" }));
    const fsModule = {
      existsSync: vi.fn(() => false),
      mkdirSync: vi.fn(),
      writeFileSync: vi.fn(),
    };
    const app = createApp({
      clawCmd,
      isOnboarded: () => true,
      fsModule,
    });

    const invalidChannelRes = await request(app)
      .post("/api/pairings/ABCD1234/approve")
      .send({ channel: "telegram; rm -rf /" });
    expect(invalidChannelRes.status).toBe(400);
    expect(invalidChannelRes.body.ok).toBe(false);

    const invalidAccountRes = await request(app)
      .post("/api/pairings/ABCD1234/approve")
      .send({ channel: "telegram", accountId: "bad account id" });
    expect(invalidAccountRes.status).toBe(400);
    expect(invalidAccountRes.body.ok).toBe(false);

    const invalidPairingIdRes = await request(app)
      .post("/api/pairings/abc def/approve")
      .send({ channel: "telegram", accountId: "tester" });
    expect(invalidPairingIdRes.status).toBe(400);
    expect(invalidPairingIdRes.body.ok).toBe(false);

    expect(clawCmd).not.toHaveBeenCalled();
  });

  it("rejects pairing and removes matching request from store", async () => {
    const clawCmd = vi.fn(async () => ({ ok: true, stdout: "", stderr: "" }));
    const fsModule = {
      existsSync: vi.fn(() => false),
      mkdirSync: vi.fn(),
      readFileSync: vi.fn((targetPath) => {
        if (targetPath === "/tmp/openclaw/credentials/telegram-pairing.json") {
          return JSON.stringify({
            version: 1,
            requests: [
              { code: "ABCD1234", meta: { accountId: "tester" } },
              { code: "OTHER111", meta: { accountId: "default" } },
            ],
          });
        }
        throw new Error(`unexpected read: ${targetPath}`);
      }),
      writeFileSync: vi.fn(),
    };
    const app = createApp({
      clawCmd,
      isOnboarded: () => true,
      fsModule,
    });

    const res = await request(app).post("/api/pairings/ABCD1234/reject").send({
      channel: "telegram",
      accountId: "tester",
    });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true, removed: true });
    expect(fsModule.writeFileSync).toHaveBeenCalledWith(
      "/tmp/openclaw/credentials/telegram-pairing.json",
      JSON.stringify(
        {
          version: 1,
          requests: [{ code: "OTHER111", meta: { accountId: "default" } }],
        },
        null,
        2,
      ),
    );
  });

  it("returns not found when reject target does not exist", async () => {
    const clawCmd = vi.fn(async () => ({ ok: true, stdout: "", stderr: "" }));
    const fsModule = {
      existsSync: vi.fn(() => false),
      mkdirSync: vi.fn(),
      readFileSync: vi.fn((targetPath) => {
        if (targetPath === "/tmp/openclaw/credentials/telegram-pairing.json") {
          return JSON.stringify({
            version: 1,
            requests: [{ code: "OTHER111", meta: { accountId: "default" } }],
          });
        }
        throw new Error(`unexpected read: ${targetPath}`);
      }),
      writeFileSync: vi.fn(),
    };
    const app = createApp({
      clawCmd,
      isOnboarded: () => true,
      fsModule,
    });

    const res = await request(app).post("/api/pairings/MISSING/reject").send({
      channel: "telegram",
      accountId: "tester",
    });

    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      ok: false,
      removed: false,
      error: "Pairing request not found",
    });
    expect(fsModule.writeFileSync).not.toHaveBeenCalled();
  });

  it("auto-approves the first pending CLI device request when marker is absent", async () => {
    let cliMarkerWritten = false;
    const clawCmd = vi.fn(async (cmd) => {
      if (cmd === "devices list --json") {
        return {
          ok: true,
          stdout: JSON.stringify({
            pending: [
              {
                requestId: "req-cli-1",
                clientId: "cli",
                clientMode: "cli",
                platform: "darwin",
                role: "user",
                scopes: ["chat"],
                ts: "2026-02-22T00:00:00.000Z",
              },
            ],
          }),
        };
      }
      if (cmd === "devices approve req-cli-1") {
        return { ok: true, stdout: "", stderr: "" };
      }
      return { ok: true, stdout: "{}", stderr: "" };
    });
    const approveDevicePairingDirect = vi.fn(async () => ({
      status: "approved",
      requestId: "req-cli-1",
      device: { deviceId: "cli-device-1" },
    }));
    const fsModule = {
      existsSync: vi.fn(() => cliMarkerWritten),
      mkdirSync: vi.fn(),
      writeFileSync: vi.fn((targetPath) => {
        if (targetPath === "/tmp/openclaw/.alphaclaw/.cli-device-auto-approved") {
          cliMarkerWritten = true;
        }
      }),
    };
    const app = createApp({
      clawCmd,
      isOnboarded: () => true,
      fsModule,
      approveDevicePairingDirect,
    });

    const res = await request(app).get("/api/devices");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      pending: [],
      cliAutoApproveComplete: true,
    });
    expect(clawCmd).not.toHaveBeenCalledWith("devices approve req-cli-1", { quiet: true });
    expect(approveDevicePairingDirect).toHaveBeenCalledWith(
      "req-cli-1",
      {
        callerScopes: expect.arrayContaining(["operator.admin", "operator.pairing"]),
      },
      "/tmp/openclaw",
    );
    expect(fsModule.writeFileSync).toHaveBeenCalledWith(
      "/tmp/openclaw/.alphaclaw/.cli-device-auto-approved",
      expect.stringContaining("approvedAt"),
    );
  });

  it("parses noisy json stdout from devices list", async () => {
    const clawCmd = vi.fn(async (cmd) => {
      if (cmd === "devices list --json") {
        return {
          ok: true,
          stdout: [
            "some warning text",
            JSON.stringify({
              pending: [
                {
                  requestId: "req-ui-1",
                  clientId: "openclaw-control-ui",
                  clientMode: "webchat",
                  platform: "MacIntel",
                  role: "operator",
                  scopes: ["operator.admin"],
                  ts: 1773506886016,
                },
              ],
            }),
          ].join("\n"),
        };
      }
      return { ok: true, stdout: "{}", stderr: "" };
    });
    const fsModule = {
      existsSync: vi.fn(() => true),
      mkdirSync: vi.fn(),
      writeFileSync: vi.fn(),
    };
    const app = createApp({
      clawCmd,
      isOnboarded: () => true,
      fsModule,
    });

    const res = await request(app).get("/api/devices");

    expect(res.status).toBe(200);
    expect(res.body.pending).toEqual([
      expect.objectContaining({
        id: "req-ui-1",
        clientId: "openclaw-control-ui",
        clientMode: "webchat",
      }),
    ]);
    expect(clawCmd).toHaveBeenCalledWith("devices list --json", {
      quiet: true,
      timeoutMs: 5000,
    });
  });

  it("approves device pairing through the OpenClaw helper with admin caller scope", async () => {
    const clawCmd = vi.fn(async () => ({ ok: true, stdout: "", stderr: "" }));
    const approveDevicePairingDirect = vi.fn(async () => ({
      status: "approved",
      requestId: "req-admin-1",
      device: {
        deviceId: "admin-device-1",
        publicKey: "public-key",
        clientId: "openclaw-control-ui",
        tokens: {
          operator: {
            token: "secret-token",
            role: "operator",
            scopes: ["operator.admin"],
          },
        },
      },
    }));
    const fsModule = {
      existsSync: vi.fn(() => true),
      mkdirSync: vi.fn(),
      writeFileSync: vi.fn(),
    };
    const app = createApp({
      clawCmd,
      isOnboarded: () => true,
      fsModule,
      approveDevicePairingDirect,
    });

    const res = await request(app).post("/api/devices/req-admin-1/approve");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      ok: true,
      requestId: "req-admin-1",
      device: {
        deviceId: "admin-device-1",
        clientId: "openclaw-control-ui",
      },
    });
    expect(approveDevicePairingDirect).toHaveBeenCalledWith(
      "req-admin-1",
      {
        callerScopes: expect.arrayContaining(["operator.admin", "operator.pairing"]),
      },
      "/tmp/openclaw",
    );
    expect(clawCmd).not.toHaveBeenCalledWith(expect.stringContaining("devices approve"));
  });

  it("returns a visible failure when direct device approval lacks scope", async () => {
    const clawCmd = vi.fn(async () => ({ ok: true, stdout: "", stderr: "" }));
    const approveDevicePairingDirect = vi.fn(async () => ({
      status: "forbidden",
      reason: "caller-missing-scope",
      scope: "operator.admin",
    }));
    const fsModule = {
      existsSync: vi.fn(() => true),
      mkdirSync: vi.fn(),
      writeFileSync: vi.fn(),
    };
    const app = createApp({
      clawCmd,
      isOnboarded: () => true,
      fsModule,
      approveDevicePairingDirect,
    });

    const res = await request(app).post("/api/devices/req-admin-2/approve");

    expect(res.status).toBe(403);
    expect(res.body).toEqual({
      ok: false,
      error: "missing scope: operator.admin",
    });
    expect(clawCmd).not.toHaveBeenCalledWith(expect.stringContaining("devices approve"));
  });

  it("does not auto-approve when CLI marker already exists", async () => {
    const clawCmd = vi.fn(async (cmd) => {
      if (cmd === "devices list --json") {
        return {
          ok: true,
          stdout: JSON.stringify({
            pending: [
              {
                requestId: "req-cli-2",
                clientId: "cli",
                clientMode: "cli",
                platform: "linux",
              },
            ],
          }),
        };
      }
      return { ok: true, stdout: "{}", stderr: "" };
    });
    const fsModule = {
      existsSync: vi.fn(() => true),
      mkdirSync: vi.fn(),
      writeFileSync: vi.fn(),
    };
    const app = createApp({
      clawCmd,
      isOnboarded: () => true,
      fsModule,
    });

    const res = await request(app).get("/api/devices");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      pending: [
        expect.objectContaining({
          id: "req-cli-2",
          clientId: "cli",
          clientMode: "cli",
        }),
      ],
      cliAutoApproveComplete: true,
    });
    expect(clawCmd).not.toHaveBeenCalledWith("devices approve req-cli-2", { quiet: true });
    expect(fsModule.writeFileSync).not.toHaveBeenCalled();
  });

  it("serves pending pairings from cache while the cache is fresh", async () => {
    const clawCmd = vi.fn(async (cmd) => {
      if (cmd === "pairing list --channel telegram --json") {
        return {
          ok: true,
          stdout: JSON.stringify({
            requests: [{ id: "1", code: "CACHED11", meta: {} }],
          }),
          stderr: "",
        };
      }
      return { ok: true, stdout: "{}", stderr: "" };
    });
    const fsModule = {
      existsSync: vi.fn(() => true),
      readFileSync: vi.fn((targetPath) => {
        if (targetPath === "/tmp/openclaw/openclaw.json") {
          return JSON.stringify({ channels: { telegram: { enabled: true } } });
        }
        throw new Error(`unexpected read: ${targetPath}`);
      }),
      mkdirSync: vi.fn(),
      writeFileSync: vi.fn(),
    };
    const app = createApp({ clawCmd, isOnboarded: () => true, fsModule });

    const first = await request(app).get("/api/pairings");
    const callsAfterFirst = clawCmd.mock.calls.length;
    const second = await request(app).get("/api/pairings");

    expect(first.body.pending).toHaveLength(1);
    expect(second.body.pending).toEqual(first.body.pending);
    expect(clawCmd.mock.calls.length).toBe(callsAfterFirst);
  });

  it("uses store entries when the CLI produces no output at all", async () => {
    const createdAt = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const clawCmd = vi.fn(async () => ({ ok: false, stdout: "", stderr: "" }));
    const fsModule = {
      existsSync: vi.fn(() => true),
      readFileSync: vi.fn((targetPath) => {
        if (targetPath === "/tmp/openclaw/openclaw.json") {
          return JSON.stringify({ channels: { telegram: { enabled: true } } });
        }
        if (targetPath === "/tmp/openclaw/credentials/telegram-pairing.json") {
          return JSON.stringify({
            version: 1,
            requests: [
              { id: "1", code: "STORE111", createdAt, meta: { accountId: "tester" } },
            ],
          });
        }
        throw new Error(`unexpected read: ${targetPath}`);
      }),
      mkdirSync: vi.fn(),
      writeFileSync: vi.fn(),
    };
    const app = createApp({ clawCmd, isOnboarded: () => true, fsModule });

    const res = await request(app).get("/api/pairings");

    expect(res.body.pending).toEqual([
      {
        id: "STORE111",
        code: "STORE111",
        channel: "telegram",
        accountId: "tester",
        requesterId: "1",
        createdAt,
      },
    ]);
  });

  it("merges duplicate CLI and store entries, filling requester and timestamps", async () => {
    const createdAt = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const clawCmd = vi.fn(async (cmd) => {
      if (cmd === "pairing list --channel telegram --json") {
        return {
          ok: true,
          stdout: JSON.stringify({
            requests: [{ code: "DUPE1111", meta: { accountId: "tester" } }],
          }),
          stderr: "",
        };
      }
      return { ok: true, stdout: "{}", stderr: "" };
    });
    const fsModule = {
      existsSync: vi.fn(() => true),
      readFileSync: vi.fn((targetPath) => {
        if (targetPath === "/tmp/openclaw/openclaw.json") {
          return JSON.stringify({ channels: { telegram: { enabled: true } } });
        }
        if (targetPath === "/tmp/openclaw/credentials/telegram-pairing.json") {
          return JSON.stringify({
            version: 1,
            requests: [
              {
                id: "999",
                code: "dupe1111",
                createdAt,
                meta: { accountId: "tester" },
              },
            ],
          });
        }
        throw new Error(`unexpected read: ${targetPath}`);
      }),
      mkdirSync: vi.fn(),
      writeFileSync: vi.fn(),
    };
    const app = createApp({ clawCmd, isOnboarded: () => true, fsModule });

    const res = await request(app).get("/api/pairings");

    expect(res.body.pending).toEqual([
      {
        id: "DUPE1111",
        code: "DUPE1111",
        channel: "telegram",
        accountId: "tester",
        requesterId: "999",
        createdAt,
      },
    ]);
  });

  it("filters expired, malformed and code-less store entries", async () => {
    const freshCreatedAt = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const expiredCreatedAt = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const clawCmd = vi.fn(async () => ({ ok: true, stdout: "", stderr: "" }));
    const fsModule = {
      existsSync: vi.fn(() => true),
      readFileSync: vi.fn((targetPath) => {
        if (targetPath === "/tmp/openclaw/openclaw.json") {
          return JSON.stringify({ channels: {} });
        }
        if (targetPath === "/tmp/openclaw/credentials/telegram-pairing.json") {
          return JSON.stringify({
            version: 1,
            requests: [
              { id: "1", pairingCode: "FRESH111", createdAt: freshCreatedAt },
              { id: "2", code: "EXPIRED1", createdAt: expiredCreatedAt },
              { id: "3", code: "NODATE11", createdAt: "not-a-date" },
              { id: "4", createdAt: freshCreatedAt },
            ],
          });
        }
        throw new Error(`unexpected read: ${targetPath}`);
      }),
      mkdirSync: vi.fn(),
      writeFileSync: vi.fn(),
    };
    const app = createApp({ clawCmd, isOnboarded: () => true, fsModule });

    const res = await request(app).get("/api/pairings");

    expect(res.body.pending).toEqual([
      {
        id: "FRESH111",
        code: "FRESH111",
        channel: "telegram",
        accountId: "default",
        requesterId: "1",
        createdAt: freshCreatedAt,
      },
    ]);
  });

  it("parses CLI output that uses the pending list shape", async () => {
    const clawCmd = vi.fn(async (cmd) => {
      if (cmd === "pairing list --channel slack --json") {
        return {
          ok: true,
          stdout: JSON.stringify({
            pending: [{ requesterId: "55", pairingCode: "pend1234" }],
          }),
          stderr: "",
        };
      }
      return { ok: true, stdout: "", stderr: "" };
    });
    const fsModule = {
      existsSync: vi.fn(() => true),
      readFileSync: vi.fn((targetPath) => {
        if (targetPath === "/tmp/openclaw/openclaw.json") {
          return JSON.stringify({ channels: { slack: { enabled: true } } });
        }
        throw new Error(`unexpected read: ${targetPath}`);
      }),
      mkdirSync: vi.fn(),
      writeFileSync: vi.fn(),
    };
    const app = createApp({ clawCmd, isOnboarded: () => true, fsModule });

    const res = await request(app).get("/api/pairings");

    expect(res.body.pending).toEqual([
      {
        id: "PEND1234",
        code: "PEND1234",
        channel: "slack",
        accountId: "default",
        requesterId: "55",
      },
    ]);
  });

  it("falls back to store entries when CLI output is unparseable noise", async () => {
    const createdAt = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const clawCmd = vi.fn(async () => ({
      ok: true,
      stdout: "no json here at all",
      stderr: "",
    }));
    const fsModule = {
      existsSync: vi.fn(() => true),
      readFileSync: vi.fn((targetPath) => {
        if (targetPath === "/tmp/openclaw/openclaw.json") {
          return JSON.stringify({ channels: { telegram: { enabled: true } } });
        }
        if (targetPath === "/tmp/openclaw/credentials/telegram-pairing.json") {
          return JSON.stringify({
            version: 1,
            requests: [{ id: "5", code: "NOISY111", createdAt, meta: {} }],
          });
        }
        throw new Error(`unexpected read: ${targetPath}`);
      }),
      mkdirSync: vi.fn(),
      writeFileSync: vi.fn(),
    };
    const app = createApp({ clawCmd, isOnboarded: () => true, fsModule });

    const res = await request(app).get("/api/pairings");

    expect(res.body.pending).toEqual([
      {
        id: "NOISY111",
        code: "NOISY111",
        channel: "telegram",
        accountId: "default",
        requesterId: "5",
        createdAt,
      },
    ]);
  });

  it("drops CLI entries that have no pairing code", async () => {
    const clawCmd = vi.fn(async (cmd) => {
      if (cmd === "pairing list --channel telegram --json") {
        return {
          ok: true,
          stdout: JSON.stringify({ requests: [{ id: "code-less" }] }),
          stderr: "",
        };
      }
      return { ok: true, stdout: "", stderr: "" };
    });
    const fsModule = {
      existsSync: vi.fn(() => true),
      readFileSync: vi.fn((targetPath) => {
        if (targetPath === "/tmp/openclaw/openclaw.json") {
          return JSON.stringify({ channels: { telegram: { enabled: true } } });
        }
        throw new Error(`unexpected read: ${targetPath}`);
      }),
      mkdirSync: vi.fn(),
      writeFileSync: vi.fn(),
    };
    const app = createApp({ clawCmd, isOnboarded: () => true, fsModule });

    const res = await request(app).get("/api/pairings");

    expect(res.body.pending).toEqual([]);
  });

  it("keeps store entries without metadata when rejecting for an account", async () => {
    const clawCmd = vi.fn(async () => ({ ok: true, stdout: "", stderr: "" }));
    const fsModule = {
      existsSync: vi.fn(() => false),
      mkdirSync: vi.fn(),
      readFileSync: vi.fn((targetPath) => {
        if (targetPath === "/tmp/openclaw/credentials/telegram-pairing.json") {
          return JSON.stringify({
            version: 1,
            requests: [{ code: "ABCD1234" }],
          });
        }
        throw new Error(`unexpected read: ${targetPath}`);
      }),
      writeFileSync: vi.fn(),
    };
    const app = createApp({ clawCmd, isOnboarded: () => true, fsModule });

    const res = await request(app).post("/api/pairings/ABCD1234/reject").send({
      channel: "telegram",
      accountId: "tester",
    });

    expect(res.status).toBe(404);
    expect(fsModule.writeFileSync).not.toHaveBeenCalled();
  });

  it("returns no pending devices when the CLI reports none", async () => {
    const clawCmd = vi.fn(async () => ({ ok: true, stdout: "{}", stderr: "" }));
    const fsModule = {
      existsSync: vi.fn(() => true),
      mkdirSync: vi.fn(),
      writeFileSync: vi.fn(),
    };
    const app = createApp({ clawCmd, isOnboarded: () => true, fsModule });

    const res = await request(app).get("/api/devices");

    expect(res.body).toEqual({ pending: [], cliAutoApproveComplete: true });
  });

  it("approves without an account id using the positional command form", async () => {
    const clawCmd = vi.fn(async () => ({ ok: true, stdout: "", stderr: "" }));
    const fsModule = {
      existsSync: vi.fn(() => false),
      mkdirSync: vi.fn(),
      writeFileSync: vi.fn(),
    };
    const app = createApp({ clawCmd, isOnboarded: () => true, fsModule });

    const res = await request(app)
      .post("/api/pairings/ABCD1234/approve")
      .send({ channel: "discord" });

    expect(res.status).toBe(200);
    expect(clawCmd).toHaveBeenCalledWith("pairing approve 'discord' 'ABCD1234'");
  });

  it("rejects a pairing without an account id by code alone", async () => {
    const clawCmd = vi.fn(async () => ({ ok: true, stdout: "", stderr: "" }));
    const fsModule = {
      existsSync: vi.fn(() => false),
      mkdirSync: vi.fn(),
      readFileSync: vi.fn((targetPath) => {
        if (targetPath === "/tmp/openclaw/credentials/telegram-pairing.json") {
          return JSON.stringify({
            version: 1,
            requests: [{ code: "ABCD1234", meta: { accountId: "tester" } }],
          });
        }
        throw new Error(`unexpected read: ${targetPath}`);
      }),
      writeFileSync: vi.fn(),
    };
    const app = createApp({ clawCmd, isOnboarded: () => true, fsModule });

    const res = await request(app)
      .post("/api/pairings/abcd1234/reject")
      .send({ channel: "telegram" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true, removed: true });
    expect(fsModule.writeFileSync).toHaveBeenCalledWith(
      "/tmp/openclaw/credentials/telegram-pairing.json",
      JSON.stringify({ version: 1, requests: [] }, null, 2),
    );
  });

  it("returns 500 when rejecting fails to write the store", async () => {
    const clawCmd = vi.fn(async () => ({ ok: true, stdout: "", stderr: "" }));
    const fsModule = {
      existsSync: vi.fn(() => false),
      mkdirSync: vi.fn(),
      readFileSync: vi.fn(() =>
        JSON.stringify({ version: 1, requests: [{ code: "ABCD1234" }] }),
      ),
      writeFileSync: vi.fn(() => {
        throw new Error("disk full");
      }),
    };
    const app = createApp({ clawCmd, isOnboarded: () => true, fsModule });

    const res = await request(app)
      .post("/api/pairings/ABCD1234/reject")
      .send({ channel: "telegram" });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ ok: false, error: "disk full" });
  });

  it("returns an empty device list before onboarding completes", async () => {
    const clawCmd = vi.fn(async () => ({ ok: true, stdout: "{}", stderr: "" }));
    const fsModule = {
      existsSync: vi.fn(() => false),
      mkdirSync: vi.fn(),
      writeFileSync: vi.fn(),
    };
    const app = createApp({ clawCmd, isOnboarded: () => false, fsModule });

    const res = await request(app).get("/api/devices");

    expect(res.body).toEqual({ pending: [], cliAutoApproveComplete: false });
    expect(clawCmd).not.toHaveBeenCalled();
  });

  it("serves the device list from cache while fresh", async () => {
    const clawCmd = vi.fn(async () => ({
      ok: true,
      stdout: JSON.stringify({
        pending: [{ requestId: "req-1", clientId: "openclaw-control-ui" }],
      }),
    }));
    const fsModule = {
      existsSync: vi.fn(() => true),
      mkdirSync: vi.fn(),
      writeFileSync: vi.fn(),
    };
    const app = createApp({ clawCmd, isOnboarded: () => true, fsModule });

    const first = await request(app).get("/api/devices");
    const second = await request(app).get("/api/devices");

    expect(second.body).toEqual(first.body);
    expect(clawCmd).toHaveBeenCalledTimes(1);
  });

  it("returns an empty device list when the CLI fails", async () => {
    const clawCmd = vi.fn(async () => ({ ok: false, stdout: "", stderr: "boom" }));
    const fsModule = {
      existsSync: vi.fn(() => true),
      mkdirSync: vi.fn(),
      writeFileSync: vi.fn(),
    };
    const app = createApp({ clawCmd, isOnboarded: () => true, fsModule });

    const res = await request(app).get("/api/devices");

    expect(res.body).toEqual({ pending: [], cliAutoApproveComplete: true });
  });

  it("keeps the CLI request pending when auto-approval is refused", async () => {
    const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});
    const clawCmd = vi.fn(async (cmd) => {
      if (cmd === "devices list --json") {
        return {
          ok: true,
          stdout: JSON.stringify({
            pending: [{ id: "req-cli-9", clientMode: "CLI" }],
          }),
        };
      }
      return { ok: true, stdout: "{}", stderr: "" };
    });
    const approveDevicePairingDirect = vi.fn(async () => ({
      status: "forbidden",
      reason: "caller-missing-scope",
      scope: "operator.admin",
    }));
    const fsModule = {
      existsSync: vi.fn(() => false),
      mkdirSync: vi.fn(),
      writeFileSync: vi.fn(),
    };
    const app = createApp({
      clawCmd,
      isOnboarded: () => true,
      fsModule,
      approveDevicePairingDirect,
    });

    const res = await request(app).get("/api/devices");

    expect(res.body).toEqual({
      pending: [
        {
          id: "req-cli-9",
          platform: null,
          clientId: null,
          clientMode: "CLI",
          role: null,
          scopes: [],
          ts: null,
        },
      ],
      cliAutoApproveComplete: false,
    });
    expect(consoleLog).toHaveBeenCalledWith(
      expect.stringContaining("CLI auto-approve failed"),
    );
    expect(fsModule.writeFileSync).not.toHaveBeenCalled();
  });

  it("falls back to an empty device list when the marker write fails", async () => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    const clawCmd = vi.fn(async () => ({
      ok: true,
      stdout: JSON.stringify({
        pending: [{ requestId: "req-cli-10", clientId: "cli" }],
      }),
    }));
    const approveDevicePairingDirect = vi.fn(async () => ({
      status: "approved",
      requestId: "req-cli-10",
      device: { deviceId: "d1" },
    }));
    const fsModule = {
      existsSync: vi.fn(() => false),
      mkdirSync: vi.fn(() => {
        throw new Error("mkdir denied");
      }),
      writeFileSync: vi.fn(),
    };
    const app = createApp({
      clawCmd,
      isOnboarded: () => true,
      fsModule,
      approveDevicePairingDirect,
    });

    const res = await request(app).get("/api/devices");

    expect(res.body).toEqual({ pending: [], cliAutoApproveComplete: false });
  });

  it("rejects invalid device request ids on approve and reject", async () => {
    const clawCmd = vi.fn(async () => ({ ok: true, stdout: "", stderr: "" }));
    const approveDevicePairingDirect = vi.fn();
    const fsModule = {
      existsSync: vi.fn(() => true),
      mkdirSync: vi.fn(),
      writeFileSync: vi.fn(),
    };
    const app = createApp({
      clawCmd,
      isOnboarded: () => true,
      fsModule,
      approveDevicePairingDirect,
    });

    const approveRes = await request(app).post(
      `/api/devices/${encodeURIComponent("bad id")}/approve`,
    );
    expect(approveRes.status).toBe(400);
    expect(approveRes.body).toEqual({ ok: false, error: "Invalid device request id" });

    const rejectRes = await request(app).post(
      `/api/devices/${encodeURIComponent("bad id")}/reject`,
    );
    expect(rejectRes.status).toBe(400);
    expect(rejectRes.body).toEqual({ ok: false, error: "Invalid device request id" });

    expect(clawCmd).not.toHaveBeenCalled();
    expect(approveDevicePairingDirect).not.toHaveBeenCalled();
  });

  it("rejects devices through the CLI", async () => {
    const clawCmd = vi.fn(async () => ({ ok: true, stdout: "done", stderr: "" }));
    const fsModule = {
      existsSync: vi.fn(() => true),
      mkdirSync: vi.fn(),
      writeFileSync: vi.fn(),
    };
    const app = createApp({ clawCmd, isOnboarded: () => true, fsModule });

    const res = await request(app).post("/api/devices/req-9/reject");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true, stdout: "done", stderr: "" });
    expect(clawCmd).toHaveBeenCalledWith("devices reject 'req-9'");
  });

  it("returns 500 with the error message when direct approval throws", async () => {
    const clawCmd = vi.fn(async () => ({ ok: true, stdout: "", stderr: "" }));
    const approveDevicePairingDirect = vi.fn(async () => {
      throw new Error("lock timeout");
    });
    const fsModule = {
      existsSync: vi.fn(() => true),
      mkdirSync: vi.fn(),
      writeFileSync: vi.fn(),
    };
    const app = createApp({
      clawCmd,
      isOnboarded: () => true,
      fsModule,
      approveDevicePairingDirect,
    });

    const res = await request(app).post("/api/devices/req-1/approve");

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ ok: false, error: "lock timeout" });
  });

  it("uses a generic error message when direct approval throws without one", async () => {
    const clawCmd = vi.fn(async () => ({ ok: true, stdout: "", stderr: "" }));
    const approveDevicePairingDirect = vi.fn(async () => {
      throw { code: "EWEIRD" };
    });
    const fsModule = {
      existsSync: vi.fn(() => true),
      mkdirSync: vi.fn(),
      writeFileSync: vi.fn(),
    };
    const app = createApp({
      clawCmd,
      isOnboarded: () => true,
      fsModule,
      approveDevicePairingDirect,
    });

    const res = await request(app).post("/api/devices/req-1/approve");

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ ok: false, error: "Could not approve device pairing" });
  });

  it("returns 404 when the pairing request is unknown", async () => {
    const clawCmd = vi.fn(async () => ({ ok: true, stdout: "", stderr: "" }));
    const approveDevicePairingDirect = vi.fn(async () => null);
    const fsModule = {
      existsSync: vi.fn(() => true),
      mkdirSync: vi.fn(),
      writeFileSync: vi.fn(),
    };
    const app = createApp({
      clawCmd,
      isOnboarded: () => true,
      fsModule,
      approveDevicePairingDirect,
    });

    const res = await request(app).post("/api/devices/req-404/approve");

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ ok: false, error: "Device pairing request not found" });
  });

  it("maps forbidden approval reasons to readable errors", async () => {
    const cases = [
      [
        { status: "forbidden", reason: "caller-scopes-required", scope: "operator.admin" },
        "missing scope: operator.admin",
      ],
      [
        { status: "forbidden", reason: "caller-scopes-required" },
        "missing scope: callerScopes-required",
      ],
      [
        { status: "forbidden", reason: "caller-missing-scope" },
        "missing scope: unknown",
      ],
      [
        { status: "forbidden", reason: "scope-outside-requested-roles", scope: "s1" },
        "invalid scope for requested roles: s1",
      ],
      [
        { status: "forbidden", reason: "scope-outside-requested-roles" },
        "invalid scope for requested roles: unknown",
      ],
      [
        { status: "forbidden", reason: "bootstrap-role-not-allowed", role: "operator" },
        "bootstrap profile does not allow role: operator",
      ],
      [
        { status: "forbidden", reason: "bootstrap-role-not-allowed" },
        "bootstrap profile does not allow role: unknown",
      ],
      [
        { status: "forbidden", reason: "bootstrap-scope-not-allowed", scope: "s2" },
        "bootstrap profile does not allow scope: s2",
      ],
      [
        { status: "forbidden", reason: "bootstrap-scope-not-allowed" },
        "bootstrap profile does not allow scope: unknown",
      ],
      [
        { status: "forbidden", reason: "something-else" },
        "Device pairing approval forbidden",
      ],
    ];
    for (const [approval, expectedError] of cases) {
      const approveDevicePairingDirect = vi.fn(async () => approval);
      const fsModule = {
        existsSync: vi.fn(() => true),
        mkdirSync: vi.fn(),
        writeFileSync: vi.fn(),
      };
      const app = createApp({
        clawCmd: vi.fn(async () => ({ ok: true, stdout: "", stderr: "" })),
        isOnboarded: () => true,
        fsModule,
        approveDevicePairingDirect,
      });

      const res = await request(app).post("/api/devices/req-x/approve");

      expect(res.status).toBe(403);
      expect(res.body).toEqual({ ok: false, error: expectedError });
    }
  });

  it("returns a null device and falls back to the param request id", async () => {
    const approveDevicePairingDirect = vi.fn(async () => ({
      status: "approved",
      device: null,
    }));
    const fsModule = {
      existsSync: vi.fn(() => true),
      mkdirSync: vi.fn(),
      writeFileSync: vi.fn(),
    };
    const app = createApp({
      clawCmd: vi.fn(async () => ({ ok: true, stdout: "", stderr: "" })),
      isOnboarded: () => true,
      fsModule,
      approveDevicePairingDirect,
    });

    const res = await request(app).post("/api/devices/req-fallback/approve");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true, requestId: "req-fallback", device: null });
  });

});

describe("server/routes/pairings removeAccountRequestsFromPairingStore", () => {
  it("removes only the matching account's requests", () => {
    const writes = [];
    const fsModule = {
      readFileSync: vi.fn(() =>
        JSON.stringify({
          version: 1,
          requests: [
            { code: "AAA", meta: { accountId: "Tester" } },
            { code: "BBB", meta: {} },
            { code: "CCC", meta: { accountId: "other" } },
          ],
        }),
      ),
      mkdirSync: vi.fn(),
      writeFileSync: vi.fn((targetPath, data) => writes.push(JSON.parse(data))),
    };

    removeAccountRequestsFromPairingStore({
      fsModule,
      openclawDir: "/tmp/openclaw",
      channel: "telegram",
      accountId: "tester",
    });

    expect(writes).toEqual([
      {
        version: 1,
        requests: [
          { code: "BBB", meta: {} },
          { code: "CCC", meta: { accountId: "other" } },
        ],
      },
    ]);
  });

  it("treats a missing account id as the default account", () => {
    const writes = [];
    const fsModule = {
      readFileSync: vi.fn(() =>
        JSON.stringify({
          version: 1,
          requests: [
            { code: "AAA", meta: {} },
            { code: "BBB", meta: { accountId: "other" } },
          ],
        }),
      ),
      mkdirSync: vi.fn(),
      writeFileSync: vi.fn((targetPath, data) => writes.push(JSON.parse(data))),
    };

    removeAccountRequestsFromPairingStore({
      fsModule,
      openclawDir: "/tmp/openclaw",
      channel: "telegram",
      accountId: "",
    });

    expect(writes).toEqual([
      {
        version: 1,
        requests: [{ code: "BBB", meta: { accountId: "other" } }],
      },
    ]);
  });

  it("does nothing when the store is empty or unchanged", () => {
    const emptyFs = {
      readFileSync: vi.fn(() => {
        throw new Error("ENOENT");
      }),
      mkdirSync: vi.fn(),
      writeFileSync: vi.fn(),
    };
    removeAccountRequestsFromPairingStore({
      fsModule: emptyFs,
      openclawDir: "/tmp/openclaw",
      channel: "telegram",
      accountId: "tester",
    });
    expect(emptyFs.writeFileSync).not.toHaveBeenCalled();

    const unchangedFs = {
      readFileSync: vi.fn(() =>
        JSON.stringify({
          version: 1,
          requests: [{ code: "AAA", meta: { accountId: "other" } }],
        }),
      ),
      mkdirSync: vi.fn(),
      writeFileSync: vi.fn(),
    };
    removeAccountRequestsFromPairingStore({
      fsModule: unchangedFs,
      openclawDir: "/tmp/openclaw",
      channel: "telegram",
      accountId: "tester",
    });
    expect(unchangedFs.writeFileSync).not.toHaveBeenCalled();
  });
});
