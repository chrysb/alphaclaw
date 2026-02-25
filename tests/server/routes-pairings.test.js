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
  it("auto-approves the first pending CLI device request when marker is absent", async () => {
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
      existsSync: vi.fn(() => false),
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
    expect(res.body.pending).toEqual([]);
    expect(clawCmd).toHaveBeenCalledWith("devices approve req-cli-1", { quiet: true });
    expect(fsModule.writeFileSync).toHaveBeenCalledWith(
      "/tmp/openclaw/.cli-device-auto-approved",
      expect.stringContaining("approvedAt"),
    );
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
    expect(res.body.pending).toEqual([
      expect.objectContaining({
        id: "req-cli-2",
        clientId: "cli",
        clientMode: "cli",
      }),
    ]);
    expect(clawCmd).not.toHaveBeenCalledWith("devices approve req-cli-2", { quiet: true });
    expect(fsModule.writeFileSync).not.toHaveBeenCalled();
  });
});
