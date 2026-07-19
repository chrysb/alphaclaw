const express = require("express");
const request = require("supertest");
const { registerCodexRoutes } = require("../../lib/server/routes/codex");

const createApp = ({ changed = true } = {}) => {
  const app = express();
  app.use(express.json());
  const onAuthChanged = vi.fn();
  registerCodexRoutes({
    app,
    createPkcePair: () => ({ verifier: "verifier", challenge: "challenge" }),
    parseCodexAuthorizationInput: () => ({}),
    getCodexAccountId: () => null,
    authProfiles: {
      getCodexProfile: () => null,
      removeCodexProfiles: () => changed,
    },
    onAuthChanged,
  });
  return { app, onAuthChanged };
};

describe("server/routes/codex", () => {
  it("invalidates model discovery when Codex auth is disconnected", async () => {
    const { app, onAuthChanged } = createApp();

    await request(app).post("/api/codex/disconnect").expect(200, {
      ok: true,
      changed: true,
    });

    expect(onAuthChanged).toHaveBeenCalledOnce();
  });

  it("does not invalidate model discovery when disconnect changes nothing", async () => {
    const { app, onAuthChanged } = createApp({ changed: false });

    await request(app).post("/api/codex/disconnect").expect(200, {
      ok: true,
      changed: false,
    });

    expect(onAuthChanged).not.toHaveBeenCalled();
  });
});
