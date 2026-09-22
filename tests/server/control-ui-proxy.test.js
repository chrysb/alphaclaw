const express = require("express");
const request = require("supertest");
const { registerProxyRoutes } = require("../../lib/server/routes/proxy");

const createApp = () => {
  const app = express();
  const proxied = [];
  const proxy = {
    web: vi.fn((req, res) => {
      proxied.push(req.url);
      res.status(204).end();
    }),
  };
  registerProxyRoutes({
    app,
    proxy,
    getGatewayUrl: () => "http://127.0.0.1:18789",
    getGatewayToken: () => "token",
    SETUP_API_PREFIXES: [],
    requireAuth: (_req, _res, next) => next(),
    oauthCallbackMiddleware: (_req, res) => res.status(204).end(),
    webhookMiddleware: (_req, res) => res.status(204).end(),
  });
  return { app, proxied };
};

describe("OpenClaw control UI proxy", () => {
  it.each([
    "/fonts/instrument-sans.css",
    "/provider-icons/anthropic.svg",
    "/file-icons/compact/json.svg",
    "/favicon.svg",
    "/favicon-32.png",
    "/apple-touch-icon.png",
    "/manifest.webmanifest",
    "/asset-manifest.json",
    "/_openclaw_/workspace/file.txt",
  ])("proxies %s to the gateway", async (path) => {
    const { app, proxied } = createApp();
    await request(app).get(path).expect(204);
    expect(proxied).toEqual([path]);
  });
});
