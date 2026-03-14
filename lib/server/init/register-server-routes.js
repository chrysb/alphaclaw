const { registerAuthRoutes } = require("../routes/auth");
const { registerPageRoutes } = require("../routes/pages");
const { registerModelRoutes } = require("../routes/models");
const { registerOnboardingRoutes } = require("../routes/onboarding");
const { registerSystemRoutes } = require("../routes/system");
const { registerPairingRoutes } = require("../routes/pairings");
const { registerCodexRoutes } = require("../routes/codex");
const { registerGoogleRoutes } = require("../routes/google");
const { registerBrowseRoutes } = require("../routes/browse");
const { registerProxyRoutes } = require("../routes/proxy");
const { registerTelegramRoutes } = require("../routes/telegram");
const { registerWebhookRoutes } = require("../routes/webhooks");
const { registerWatchdogRoutes } = require("../routes/watchdog");
const { registerUsageRoutes } = require("../routes/usage");
const { registerGmailRoutes } = require("../routes/gmail");
const { registerDoctorRoutes } = require("../routes/doctor");
const { registerAgentRoutes } = require("../routes/agents");
const { registerCronRoutes } = require("../routes/cron");
const { registerNodeRoutes } = require("../routes/nodes");

const registerServerRoutes = ({
  app,
  fs,
  constants,
  loginThrottle,
  shellCmd,
  clawCmd,
  gogCmd,
  gatewayEnv,
  parseJsonFromNoisyOutput,
  normalizeOnboardingModels,
  authProfiles,
  readEnvFile,
  writeEnvFile,
  reloadEnv,
  isOnboarded,
  isGatewayRunning,
  resolveGithubRepoUrl,
  resolveModelProvider,
  ensureGatewayProxyConfig,
  getBaseUrl,
  startGateway,
  syncChannelConfig,
  getChannelStatus,
  openclawVersionService,
  alphaclawVersionService,
  restartGateway,
  restartRequiredState,
  topicRegistry,
  createPkcePair,
  parseCodexAuthorizationInput,
  getCodexAccountId,
  readGoogleCredentials,
  getApiEnableUrl,
  telegramApi,
  doSyncPromptFiles,
  getRequests,
  getRequestById,
  getHookSummaries,
  deleteRequestsByHook,
  watchdog,
  getRecentEvents,
  readLogTail,
  watchdogTerminal,
  getDailySummary,
  getSessionsList,
  getSessionDetail,
  getSessionTimeSeries,
  cronService,
  doctorService,
  agentsService,
  operationEvents,
  proxy,
  getGatewayUrl,
  SETUP_API_PREFIXES,
  webhookMiddleware,
}) => {
  const { requireAuth, isAuthorizedRequest } = registerAuthRoutes({
    app,
    loginThrottle,
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
    readEnvFile,
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
    kAlphaclawGithubReleasesBaseUrl: constants.kAlphaclawGithubReleasesBaseUrl,
    clawCmd,
    restartGateway,
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
    watchdogTerminal,
  });
  registerUsageRoutes({
    app,
    requireAuth,
    getDailySummary,
    getSessionsList,
    getSessionDetail,
    getSessionTimeSeries,
  });
  registerCronRoutes({
    app,
    requireAuth,
    cronService,
  });
  registerDoctorRoutes({
    app,
    requireAuth,
    doctorService,
  });
  registerAgentRoutes({
    app,
    agentsService,
    restartRequiredState,
    operationEvents,
  });
  registerNodeRoutes({
    app,
    clawCmd,
    openclawDir: constants.OPENCLAW_DIR,
    gatewayToken: constants.GATEWAY_TOKEN,
    fsModule: fs,
  });
  registerProxyRoutes({
    app,
    proxy,
    getGatewayUrl,
    SETUP_API_PREFIXES,
    requireAuth,
    webhookMiddleware,
  });

  return {
    requireAuth,
    isAuthorizedRequest,
    gmailWatchService,
  };
};

module.exports = {
  registerServerRoutes,
};
