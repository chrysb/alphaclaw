const path = require("path");

const registerPageRoutes = ({ app, requireAuth, isGatewayRunning }) => {
  app.get("/health", async (req, res) => {
    const running = await isGatewayRunning();
    res.json({
      status: running ? "healthy" : "starting",
      gateway: running ? "running" : "starting",
    });
  });

  app.get("/", requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, "..", "..", "public", "setup.html"));
  });

  app.get("/setup", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "..", "public", "setup.html"));
  });
};

module.exports = { registerPageRoutes };
