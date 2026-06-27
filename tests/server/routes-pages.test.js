const express = require("express");
const request = require("supertest");
const { registerPageRoutes } = require("../../lib/server/routes/pages");

describe("server/routes/pages", () => {
  const createTestApp = () => {
    const app = express();
    registerPageRoutes({
      app,
      requireAuth: (req, res, next) => next(),
      isGatewayRunning: async () => true,
    });
    return app;
  };

  it("redirects the authenticated root page to the static setup shell", async () => {
    const app = createTestApp();

    const res = await request(app).get("/");

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("/setup.html");
  });

  it("redirects /setup to the static setup shell", async () => {
    const app = createTestApp();

    const res = await request(app).get("/setup");

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("/setup.html");
  });

  it("serves the setup shell for known SPA app routes", async () => {
    const app = createTestApp();

    const res = await request(app).get("/envars");

    expect(res.status).toBe(200);
    expect(res.text).toContain('<div id="app"></div>');
  });
});
