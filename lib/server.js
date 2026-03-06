const express = require("express");
const http = require("http");
const httpProxy = require("http-proxy");
const path = require("path");
const fs = require("fs");

const constants = require("./server/constants");
const { initLogWriter, readLogTail } = require("./server/log-writer");
initLogWriter({
  rootDir: constants.kRootDir,
  maxBytes: constants.kLogMaxBytes,
});
const {
  parseJsonFromNoisyOutput,
  normalizeOnboardingModels,
  resolveModelProvider,
  resolveGithubRepoUrl,
  createPkcePair,
  parseCodexAuthorizationInput,
  getCodexAccountId,
  getBaseUrl,
  getApiEnableUrl,
  readGoogleCredentials,
  getClientKey,
} = require("./server/helpers");
const {
  initWebhooksDb,
  insertRequest,
  getRequests,
  getRequestById,
  getHookSummaries,
  deleteRequestsByHook,
} = require("./server/db/webhooks");
const {
  initWatchdogDb,
  insertWatchdogEvent,
  getRecentEvents,
} = require("./server/db/watchdog");
const {
  initUsageDb,
  getDailySummary,
  getSessionsList,
  getSessionDetail,
  getSessionTimeSeries,
} = require("./server/db/usage");
const topicRegistry = require("./server/topic-registry");
const {
  initDoctorDb,
  listDoctorRuns,
  listDoctorCards,
  getInitialWorkspaceBaseline,
  setInitialWorkspaceBaseline,
  createDoctorRun,
  completeDoctorRun,
  insertDoctorCards,
  getDoctorRun,
  getDoctorCardsByRunId,
  getDoctorCard,
  updateDoctorCardStatus,
} = require("./server/db/doctor");
const { createWebhookMiddleware } = require("./server/webhook-middleware");
const {
  readEnvFile,
  writeEnvFile,
  reloadEnv,
  startEnvWatcher,
} = require("./server/env");
const {
  gatewayEnv,
  isOnboarded,
  isGatewayRunning,
  startGateway,
  restartGateway: restartGatewayWithReload,
  attachGatewaySignalHandlers,
  ensureGatewayProxyConfig,
  syncChannelConfig,
  getChannelStatus,
  launchGatewayProcess,
  setGatewayExitHandler,
  setGatewayLaunchHandler,
} = require("./server/gateway");
const { createCommands } = require("./server/commands");
const { createAuthProfiles } = require("./server/auth-profiles");
const { createLoginThrottle } = require("./server/login-throttle");
const { createOpenclawVersionService } = require("./server/openclaw-version");
const { createAlphaclawVersionService } = require("./server/alphaclaw-version");
const {
  createRestartRequiredState,
} = require("./server/restart-required-state");
const {
  installControlUiSkill,
  syncBootstrapPromptFiles,
} = require("./server/onboarding/workspace");
const {
  migrateManagedInternalFiles,
} = require("./server/internal-files-migration");
const { installGogCliSkill } = require("./server/gog-skill");
const { createTelegramApi } = require("./server/telegram-api");
const { createDiscordApi } = require("./server/discord-api");
const { createWatchdogNotifier } = require("./server/watchdog-notify");
const { createWatchdog } = require("./server/watchdog");
const { createDoctorService } = require("./server/doctor/service");

const { registerAuthRoutes } = require("./server/routes/auth");
const { registerPageRoutes } = require("./server/routes/pages");
const { registerModelRoutes } = require("./server/routes/models");
const { registerOnboardingRoutes } = require("./server/routes/onboarding");
const { registerSystemRoutes } = require("./server/routes/system");
const { registerPairingRoutes } = require("./server/routes/pairings");
const { registerCodexRoutes } = require("./server/routes/codex");
const { registerGoogleRoutes } = require("./server/routes/google");
const { registerBrowseRoutes } = require("./server/routes/browse");
const { registerProxyRoutes } = require("./server/routes/proxy");
const { registerTelegramRoutes } = require("./server/routes/telegram");
const { registerWebhookRoutes } = require("./server/routes/webhooks");
const { registerWatchdogRoutes } = require("./server/routes/watchdog");
const { registerUsageRoutes } = require("./server/routes/usage");
const { registerGmailRoutes } = require("./server/routes/gmail");
const { registerDoctorRoutes } = require("./server/routes/doctor");

const { PORT, GATEWAY_URL, kTrustProxyHops, SETUP_API_PREFIXES } = constants;

startEnvWatcher();
attachGatewaySignalHandlers();
migrateManagedInternalFiles({
  fs,
  openclawDir: constants.OPENCLAW_DIR,
});

const app = express();
app.set("trust proxy", kTrustProxyHops);
app.use(["/webhook", "/hooks"], express.raw({ type: "*/*", limit: "5mb" }));
app.use("/gmail-pubsub", express.raw({ type: "*/*", limit: "5mb" }));
app.use(express.json());

const proxy = httpProxy.createProxyServer({
  target: GATEWAY_URL,
  ws: true,
  changeOrigin: true,
});
proxy.on("error", (err, req, res) => {
  if (res && res.writeHead) {
    res.writeHead(502, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Gateway unavailable" }));
  }
});

const authProfiles = createAuthProfiles();
const loginThrottle = { ...createLoginThrottle(), getClientKey };
const { shellCmd, clawCmd, gogCmd } = createCommands({ gatewayEnv });
const resolveSetupUrl = () => {
  const explicit =
    process.env.ALPHACLAW_SETUP_URL ||
    process.env.ALPHACLAW_BASE_URL ||
    process.env.RENDER_EXTERNAL_URL ||
    process.env.URL;
  if (explicit) return String(explicit).trim();
  if (process.env.RAILWAY_STATIC_URL) {
    const domain = String(process.env.RAILWAY_STATIC_URL).trim();
    if (!domain) return "";
    return domain.startsWith("http") ? domain : `https://${domain}`;
  }
  return "";
};
const restartGateway = () => restartGatewayWithReload(reloadEnv);
const openclawVersionService = createOpenclawVersionService({
  gatewayEnv,
  restartGateway,
  isOnboarded,
});
const alphaclawVersionService = createAlphaclawVersionService();
const restartRequiredState = createRestartRequiredState({ isGatewayRunning });

const { requireAuth, isAuthorizedRequest } = registerAuthRoutes({
  app,
  loginThrottle,
});
app.use(express.static(path.join(__dirname, "public")));
initWebhooksDb({
  rootDir: constants.kRootDir,
  pruneDays: constants.kWebhookPruneDays,
});
initWatchdogDb({
  rootDir: constants.kRootDir,
  pruneDays: constants.kWatchdogLogRetentionDays,
});
initUsageDb({
  rootDir: constants.kRootDir,
});
initDoctorDb({
  rootDir: constants.kRootDir,
});
const webhookMiddleware = createWebhookMiddleware({
  gatewayUrl: constants.GATEWAY_URL,
  insertRequest,
  maxPayloadBytes: constants.kMaxPayloadBytes,
});

registerPageRoutes({ app, requireAuth, isGatewayRunning });
registerModelRoutes({
  app,
  shellCmd,
  gatewayEnv,
  parseJsonFromNoisyOutput,
  normalizeOnboardingModels,
  authProfiles,
  readEnvFile,
  writeEnvFile,
  reloadEnv,
});
registerOnboardingRoutes({
  app,
  fs,
  constants,
  shellCmd,
  gatewayEnv,
  writeEnvFile,
  reloadEnv,
  isOnboarded,
  resolveGithubRepoUrl,
  resolveModelProvider,
  hasCodexOauthProfile: authProfiles.hasCodexOauthProfile,
  authProfiles,
  ensureGatewayProxyConfig,
  getBaseUrl,
  startGateway,
});
registerSystemRoutes({
  app,
  fs,
  readEnvFile,
  writeEnvFile,
  reloadEnv,
  kKnownVars: constants.kKnownVars,
  kKnownKeys: constants.kKnownKeys,
  kSystemVars: constants.kSystemVars,
  syncChannelConfig,
  isGatewayRunning,
  isOnboarded,
  getChannelStatus,
  openclawVersionService,
  alphaclawVersionService,
  clawCmd,
  restartGateway,
  onExpectedGatewayRestart: () => watchdog.onExpectedRestart(),
  OPENCLAW_DIR: constants.OPENCLAW_DIR,
  restartRequiredState,
  topicRegistry,
  authProfiles,
});
registerBrowseRoutes({
  app,
  fs,
  kRootDir: constants.OPENCLAW_DIR,
});
registerPairingRoutes({ app, clawCmd, isOnboarded });
registerCodexRoutes({
  app,
  createPkcePair,
  parseCodexAuthorizationInput,
  getCodexAccountId,
  authProfiles,
});
registerGoogleRoutes({
  app,
  fs,
  isGatewayRunning,
  gogCmd,
  getBaseUrl,
  readGoogleCredentials,
  getApiEnableUrl,
  constants,
});
const gmailWatchService = registerGmailRoutes({
  app,
  fs,
  constants,
  gogCmd,
  getBaseUrl,
  readGoogleCredentials,
  readEnvFile,
  writeEnvFile,
  reloadEnv,
  restartRequiredState,
});
const telegramApi = createTelegramApi(() => process.env.TELEGRAM_BOT_TOKEN);
const discordApi = createDiscordApi(() => process.env.DISCORD_BOT_TOKEN);
const watchdogNotifier = createWatchdogNotifier({ telegramApi, discordApi });
const watchdog = createWatchdog({
  clawCmd,
  launchGatewayProcess,
  insertWatchdogEvent,
  notifier: watchdogNotifier,
  readEnvFile,
  writeEnvFile,
  reloadEnv,
  resolveSetupUrl,
});
const doctorService = createDoctorService({
  clawCmd,
  listDoctorRuns,
  listDoctorCards,
  getInitialWorkspaceBaseline,
  setInitialWorkspaceBaseline,
  createDoctorRun,
  completeDoctorRun,
  insertDoctorCards,
  getDoctorRun,
  getDoctorCardsByRunId,
  getDoctorCard,
  updateDoctorCardStatus,
  workspaceRoot: constants.WORKSPACE_DIR,
  managedRoot: constants.OPENCLAW_DIR,
  protectedPaths: Array.from(constants.kProtectedBrowsePaths || []),
  lockedPaths: Array.from(constants.kLockedBrowsePaths || []),
});
setGatewayExitHandler((payload) => watchdog.onGatewayExit(payload));
setGatewayLaunchHandler((payload) => watchdog.onGatewayLaunch(payload));
const doSyncPromptFiles = () => {
  const setupUiUrl = resolveSetupUrl();
  syncBootstrapPromptFiles({
    fs,
    workspaceDir: constants.WORKSPACE_DIR,
    baseUrl: setupUiUrl,
  });
  installControlUiSkill({
    fs,
    openclawDir: constants.OPENCLAW_DIR,
    baseUrl: setupUiUrl,
  });
  installGogCliSkill({ fs, openclawDir: constants.OPENCLAW_DIR });
};
doSyncPromptFiles();
registerTelegramRoutes({
  app,
  telegramApi,
  syncPromptFiles: doSyncPromptFiles,
  shellCmd,
});
registerWebhookRoutes({
  app,
  fs,
  constants,
  getBaseUrl,
  shellCmd,
  webhooksDb: {
    getRequests,
    getRequestById,
    getHookSummaries,
    deleteRequestsByHook,
  },
  restartRequiredState,
});
registerWatchdogRoutes({
  app,
  requireAuth,
  watchdog,
  getRecentEvents,
  readLogTail,
});
registerUsageRoutes({
  app,
  requireAuth,
  getDailySummary,
  getSessionsList,
  getSessionDetail,
  getSessionTimeSeries,
});
registerDoctorRoutes({
  app,
  requireAuth,
  doctorService,
});
registerProxyRoutes({
  app,
  proxy,
  SETUP_API_PREFIXES,
  requireAuth,
  webhookMiddleware,
});

const server = http.createServer(app);
server.on("upgrade", (req, socket, head) => {
  const requestUrl = new URL(
    req.url || "/",
    `http://${req.headers.host || "localhost"}`,
  );
  if (requestUrl.pathname.startsWith("/openclaw")) {
    const upgradeReq = {
      headers: req.headers,
      path: requestUrl.pathname,
      query: Object.fromEntries(requestUrl.searchParams.entries()),
    };
    if (!isAuthorizedRequest(upgradeReq)) {
      socket.write(
        "HTTP/1.1 401 Unauthorized\r\nContent-Type: text/plain\r\nConnection: close\r\n\r\nUnauthorized",
      );
      socket.destroy();
      return;
    }
  }
  proxy.ws(req, socket, head);
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`[alphaclaw] Express listening on :${PORT}`);
  doSyncPromptFiles();
  if (isOnboarded()) {
    reloadEnv();
    syncChannelConfig(readEnvFile());
    ensureGatewayProxyConfig(null);
    startGateway();
    watchdog.start();
    gmailWatchService.start();
  } else {
    console.log("[alphaclaw] Awaiting onboarding via Setup UI");
  }
});

const shutdownGmailWatchService = async () => {
  try {
    await gmailWatchService.stop();
  } catch {}
};
process.on("SIGTERM", () => {
  shutdownGmailWatchService();
});
process.on("SIGINT", () => {
  shutdownGmailWatchService();
});
