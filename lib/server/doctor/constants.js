const kDoctorPromptVersion = "doctor-v1";
const kDoctorRunStatus = {
  running: "running",
  completed: "completed",
  failed: "failed",
};
const kDoctorCardStatus = {
  open: "open",
  dismissed: "dismissed",
  fixed: "fixed",
};
const kDoctorPriority = {
  P0: "P0",
  P1: "P1",
  P2: "P2",
};
const kDoctorEngine = {
  gatewayAgent: "gateway_agent",
  acpRuntime: "acp_runtime",
  agentMessageFallback: "agent_message_fallback",
  manualImport: "manual_import",
  deterministicReuse: "deterministic_reuse",
};
const kDoctorStaleThresholdMs = 7 * 24 * 60 * 60 * 1000;
const kDoctorMeaningfulChangeScoreThreshold = 4;
const kDoctorRunTimeoutMs = 10 * 60 * 1000;
const kDoctorDefaultRunsLimit = 10;
const kDoctorMaxRunsLimit = 50;
const kDoctorMaxCardsPerRun = 12;

module.exports = {
  kDoctorPromptVersion,
  kDoctorRunStatus,
  kDoctorCardStatus,
  kDoctorPriority,
  kDoctorEngine,
  kDoctorStaleThresholdMs,
  kDoctorMeaningfulChangeScoreThreshold,
  kDoctorRunTimeoutMs,
  kDoctorDefaultRunsLimit,
  kDoctorMaxRunsLimit,
  kDoctorMaxCardsPerRun,
};
