const express = require("express");
const request = require("supertest");

const { registerNodeRoutes } = require("../../lib/server/routes/nodes");

const createApp = ({ clawCmd, fsModule } = {}) => {
  const app = express();
  app.use(express.json());
  registerNodeRoutes({
    app,
    clawCmd,
    openclawDir: "/tmp/openclaw",
    gatewayToken: "",
    fsModule:
      fsModule || {
        readFileSync: vi.fn(() => "{}"),
        writeFileSync: vi.fn(),
        mkdirSync: vi.fn(),
      },
  });
  return app;
};

describe("server/routes/nodes", () => {
  it("uses short CLI timeouts for status and pending reads", async () => {
    const clawCmd = vi.fn(async (cmd) => {
      if (cmd === "nodes status --json") {
        return {
          ok: true,
          stdout: JSON.stringify({
            nodes: [{ id: "node-1", paired: true }],
            pending: [],
          }),
          stderr: "",
        };
      }
      if (cmd === "nodes pending --json") {
        return {
          ok: true,
          stdout: JSON.stringify({
            pending: [{ requestId: "node-2" }],
          }),
          stderr: "",
        };
      }
      return { ok: true, stdout: "{}", stderr: "" };
    });
    const app = createApp({ clawCmd });

    const res = await request(app).get("/api/nodes");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      ok: true,
      nodes: [{ id: "node-1", paired: true }],
      pending: [{ requestId: "node-2", id: "node-2", nodeId: "node-2", paired: false }],
    });
    expect(clawCmd).toHaveBeenNthCalledWith(1, "nodes status --json", {
      quiet: true,
      timeoutMs: 5000,
    });
    expect(clawCmd).toHaveBeenNthCalledWith(2, "nodes pending --json", {
      quiet: true,
      timeoutMs: 5000,
    });
  });

  it("falls back to status-derived pending nodes when pending command fails", async () => {
    const clawCmd = vi.fn(async (cmd) => {
      if (cmd === "nodes status --json") {
        return {
          ok: true,
          stdout: JSON.stringify({
            nodes: [
              { id: "node-1", paired: true },
              { id: "node-2", paired: false },
            ],
          }),
          stderr: "",
        };
      }
      if (cmd === "nodes pending --json") {
        return {
          ok: false,
          stdout: "",
          stderr: "timed out",
        };
      }
      return { ok: true, stdout: "{}", stderr: "" };
    });
    const app = createApp({ clawCmd });

    const res = await request(app).get("/api/nodes");

    expect(res.status).toBe(200);
    expect(res.body.pending).toEqual([{ id: "node-2", paired: false }]);
  });
});
