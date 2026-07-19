const { register } = require("node:module");
const { pathToFileURL } = require("node:url");
const express = require("express");
const request = require("supertest");

// Intercept the dynamic `import("openclaw/plugin-sdk/device-bootstrap")` inside
// lib/server/routes/pairings.js. The import is a native dynamic import of an
// externalized dependency, so vi.mock cannot reach it; a Node module
// customization hook redirects it to a stub without a usable helper instead.
register(
  new URL(
    "./fixtures/device-bootstrap-unavailable-loader.mjs",
    pathToFileURL(__filename),
  ),
);

const { registerPairingRoutes } = require("../../lib/server/routes/pairings");

describe("server/routes/pairings default device approval helper (unavailable)", () => {
  it("fails visibly when the OpenClaw approval helper is unavailable", async () => {
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
      openclawDir: "/tmp/openclaw-devboot-unavailable",
    });

    const res = await request(app).post("/api/devices/req-1/approve");

    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      ok: false,
      error: "OpenClaw device approval helper is unavailable",
    });
  });
});
