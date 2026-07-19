const { register } = require("node:module");
const { pathToFileURL } = require("node:url");
const express = require("express");
const request = require("supertest");

// Intercept the dynamic `import("openclaw/plugin-sdk/device-bootstrap")` inside
// lib/server/routes/pairings.js with a stub whose helper delegates to a
// test-controlled implementation on globalThis (the import is a native dynamic
// import of an externalized dependency, so vi.mock cannot reach it).
register(
  new URL(
    "./fixtures/device-bootstrap-callable-loader.mjs",
    pathToFileURL(__filename),
  ),
);

const { registerPairingRoutes } = require("../../lib/server/routes/pairings");

const createApp = () => {
  const app = express();
  app.use(express.json());
  registerPairingRoutes({
    app,
    clawCmd: vi.fn(async () => ({ ok: true, stdout: "", stderr: "" })),
    isOnboarded: () => true,
    fsModule: {
      existsSync: vi.fn(() => true),
      mkdirSync: vi.fn(),
      writeFileSync: vi.fn(),
    },
    openclawDir: "/tmp/openclaw-devboot-callable",
  });
  return app;
};

describe("server/routes/pairings default device approval helper (callable)", () => {
  afterEach(() => {
    delete globalThis.__alphaclawDeviceBootstrapApprove;
  });

  it("delegates to the OpenClaw helper with admin caller scopes", async () => {
    const approveDevicePairing = vi.fn(async () => null);
    globalThis.__alphaclawDeviceBootstrapApprove = approveDevicePairing;
    const app = createApp();

    const res = await request(app).post("/api/devices/req-unknown/approve");

    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      ok: false,
      error: "Device pairing request not found",
    });
    expect(approveDevicePairing).toHaveBeenCalledWith(
      "req-unknown",
      {
        callerScopes: expect.arrayContaining([
          "operator.admin",
          "operator.pairing",
        ]),
      },
      "/tmp/openclaw-devboot-callable",
    );
  });

  it("returns the redacted approved device from the OpenClaw helper", async () => {
    globalThis.__alphaclawDeviceBootstrapApprove = async (requestId) => ({
      status: "approved",
      requestId,
      device: { deviceId: "d-1", publicKey: "pk", tokens: {} },
    });
    const app = createApp();

    const res = await request(app).post("/api/devices/req-ok/approve");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      ok: true,
      requestId: "req-ok",
      device: { deviceId: "d-1" },
    });
  });
});
