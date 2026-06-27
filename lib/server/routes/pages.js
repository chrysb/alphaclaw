const path = require("path");

const kSetupShellPath = path.join(__dirname, "..", "..", "public", "setup.html");
const kAppRoutePattern =
  /^\/(?:general|doctor|telegram(?:\/.*)?|providers|watchdog|usage(?:\/.*)?|webhooks(?:\/.*)?|models|envars|nodes|cron|agents(?:\/.*)?|chat(?:\/.*)?|browse(?:\/.*)?)$/;

const registerPageRoutes = ({ app, requireAuth, isGatewayRunning }) => {
  app.get("/health", async (req, res) => {
    const running = await isGatewayRunning();
    res.json({
      status: running ? "healthy" : "starting",
      gateway: running ? "running" : "starting",
    });
  });

  app.get("/", requireAuth, (req, res) => {
    res.redirect("/setup.html");
  });

  app.get("/setup", (req, res) => {
    res.redirect("/setup.html");
  });

  app.get(kAppRoutePattern, requireAuth, (req, res) => {
    res.sendFile(kSetupShellPath);
  });
};

module.exports = { registerPageRoutes };
