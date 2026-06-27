const startServerLifecycle = ({
  server,
  PORT,
  isOnboarded,
  runOnboardedBootSequence,
}) => {
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`[alphaclaw] Express listening on :${PORT}`);
    if (isOnboarded()) {
      runOnboardedBootSequence();
    } else {
      console.log("[alphaclaw] Awaiting onboarding via Setup UI");
    }
  });
};

const registerServerShutdown = ({ gmailWatchService, watchdogTerminal }) => {
  const shutdownGmailWatchService = async () => {
    try {
      await gmailWatchService.stop();
    } catch {}
    watchdogTerminal.disposeSession();
  };

  process.on("SIGTERM", () => {
    shutdownGmailWatchService();
  });
  process.on("SIGINT", () => {
    shutdownGmailWatchService();
  });
};

module.exports = {
  startServerLifecycle,
  registerServerShutdown,
};
