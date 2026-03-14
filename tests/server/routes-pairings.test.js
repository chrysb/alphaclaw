const express = require("express");
const request = require("supertest");

const { registerPairingRoutes } = require("../../lib/server/routes/pairings");

const createApp = ({ clawCmd, isOnboarded, fsModule }) => {
  const app = express();
  app.use(express.json());
  registerPairingRoutes({
    app,
    clawCmd,
    isOnboarded,
    fsModule,
    openclawDir: "/tmp/openclaw",
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
    });

    const res = await request(app).get("/api/devices");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      pending: [],
      cliAutoApproveComplete: true,
    });
    expect(clawCmd).toHaveBeenCalledWith("devices approve req-cli-1", { quiet: true });
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
});
