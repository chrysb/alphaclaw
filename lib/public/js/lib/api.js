import { subscribeToSse } from "./sse.js";

const kClientTimeZoneHeader = "x-client-timezone";

const getBrowserTimeZone = () => {
  try {
    return Intl?.DateTimeFormat?.().resolvedOptions?.().timeZone || "";
  } catch {
    return "";
  }
};

export const authFetch = async (url, opts = {}) => {
  const nextOptions = { ...opts };
  const headers = new Headers(opts?.headers || {});
  if (!headers.has(kClientTimeZoneHeader)) {
    const browserTimeZone = getBrowserTimeZone();
    if (browserTimeZone) {
      headers.set(kClientTimeZoneHeader, browserTimeZone);
    }
  }
  nextOptions.headers = headers;
  const res = await fetch(url, nextOptions);
  if (res.status === 401) {
    try {
      window.localStorage?.clear?.();
    } catch {}
    window.location.href = "/setup";
    throw new Error("Unauthorized");
  }
  return res;
};

export async function fetchStatus() {
  const res = await authFetch("/api/status");
  return res.json();
}

export async function fetchPairings() {
  const res = await authFetch("/api/pairings");
  return res.json();
}

export async function approvePairing(id, channel, accountId = "") {
  const res = await authFetch(`/api/pairings/${id}/approve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ channel, accountId }),
  });
  return res.json();
}

export async function rejectPairing(id, channel, accountId = "") {
  const res = await authFetch(`/api/pairings/${id}/reject`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ channel, accountId }),
  });
  return parseJsonOrThrow(res, "Could not reject pairing");
}

export async function fetchGoogleAccounts() {
  const res = await authFetch("/api/google/accounts");
  return res.json();
}

export async function fetchGoogleStatus(accountId = "") {
  const params = new URLSearchParams();
  if (accountId) params.set("accountId", String(accountId));
  const suffix = params.toString() ? `?${params.toString()}` : "";
  const res = await authFetch(`/api/google/status${suffix}`);
  return res.json();
}

export async function fetchGoogleCredentials({
  accountId = "",
  client = "",
} = {}) {
  const params = new URLSearchParams();
  if (accountId) params.set("accountId", String(accountId));
  if (client) params.set("client", String(client));
  const suffix = params.toString() ? `?${params.toString()}` : "";
  const res = await authFetch(`/api/google/credentials${suffix}`);
  return res.json();
}

export async function checkGoogleApis(accountId = "") {
  const params = new URLSearchParams();
  if (accountId) params.set("accountId", String(accountId));
  const suffix = params.toString() ? `?${params.toString()}` : "";
  const res = await authFetch(`/api/google/check${suffix}`);
  return res.json();
}

export async function saveGoogleCredentials({
  clientId,
  clientSecret,
  email,
  services = [],
  client = "default",
  personal = false,
  accountId = "",
}) {
  const res = await authFetch("/api/google/credentials", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      clientId,
      clientSecret,
      email,
      services,
      client,
      personal,
      accountId,
    }),
  });
  return res.json();
}

export async function saveGoogleAccount({
  email,
  services = [],
  client = "default",
  personal = false,
  accountId = "",
}) {
  const res = await authFetch("/api/google/accounts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, services, client, personal, accountId }),
  });
  return res.json();
}

export async function disconnectGoogle(accountId = "") {
  const res = await authFetch("/api/google/disconnect", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ accountId }),
  });
  return res.json();
}

export const fetchGmailConfig = async () => {
  const res = await authFetch("/api/gmail/config");
  return parseJsonOrThrow(res, "Could not load Gmail watch config");
};

export const saveGmailConfig = async ({
  client = "default",
  topicPath = "",
  projectId = "",
  regeneratePushToken = false,
} = {}) => {
  const res = await authFetch("/api/gmail/config", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client,
      topicPath,
      projectId,
      regeneratePushToken,
    }),
  });
  return parseJsonOrThrow(res, "Could not save Gmail watch config");
};

export const startGmailWatch = async (accountId, { destination = null } = {}) => {
  const res = await authFetch("/api/gmail/watch/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      accountId: String(accountId || ""),
      ...(destination ? { destination } : {}),
    }),
  });
  return parseJsonOrThrow(res, "Could not start Gmail watch");
};

export const stopGmailWatch = async (accountId) => {
  const res = await authFetch("/api/gmail/watch/stop", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ accountId: String(accountId || "") }),
  });
  return parseJsonOrThrow(res, "Could not stop Gmail watch");
};

export const renewGmailWatch = async ({
  accountId = "",
  force = true,
} = {}) => {
  const res = await authFetch("/api/gmail/watch/renew", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      accountId: String(accountId || ""),
      force: Boolean(force),
    }),
  });
  return parseJsonOrThrow(res, "Could not renew Gmail watch");
};

export const fetchAgentSessions = async () => {
  const res = await authFetch("/api/agent/sessions");
  return parseJsonOrThrow(res, "Could not load agent sessions");
};

export const fetchDoctorStatus = async () => {
  const res = await authFetch("/api/doctor/status");
  return parseJsonOrThrow(res, "Could not load Doctor status");
};

export const startDoctorRun = async () => {
  const res = await authFetch("/api/doctor/run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  return parseJsonOrThrow(res, "Could not start Doctor run");
};

export const importDoctorResult = async (rawOutput = "") => {
  const res = await authFetch("/api/doctor/import", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rawOutput: String(rawOutput || "") }),
  });
  return parseJsonOrThrow(res, "Could not import Doctor result");
};

export const fetchDoctorRuns = async (limit = 10) => {
  const params = new URLSearchParams({ limit: String(limit) });
  const res = await authFetch(`/api/doctor/runs?${params.toString()}`);
  return parseJsonOrThrow(res, "Could not load Doctor runs");
};

export const fetchDoctorCards = async ({ runId = "all" } = {}) => {
  const params = new URLSearchParams();
  if (String(runId || "").trim()) params.set("runId", String(runId || ""));
  const suffix = params.toString() ? `?${params.toString()}` : "";
  const res = await authFetch(`/api/doctor/cards${suffix}`);
  return parseJsonOrThrow(res, "Could not load Doctor findings");
};

export const fetchDoctorRun = async (runId) => {
  const res = await authFetch(
    `/api/doctor/runs/${encodeURIComponent(String(runId || ""))}`,
  );
  return parseJsonOrThrow(res, "Could not load Doctor run");
};

export const fetchDoctorRunCards = async (runId) => {
  const res = await authFetch(
    `/api/doctor/runs/${encodeURIComponent(String(runId || ""))}/cards`,
  );
  return parseJsonOrThrow(res, "Could not load Doctor cards");
};

export const updateDoctorCardStatus = async ({ cardId, status }) => {
  const res = await authFetch(
    `/api/doctor/cards/${encodeURIComponent(String(cardId || ""))}/status`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: String(status || "") }),
    },
  );
  return parseJsonOrThrow(res, "Could not update Doctor card status");
};

export const sendDoctorCardFix = async ({
  cardId,
  sessionId = "",
  replyChannel = "",
  replyTo = "",
  prompt = "",
} = {}) => {
  const res = await authFetch(
    `/api/doctor/findings/${encodeURIComponent(String(cardId || ""))}/fix`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: String(sessionId || ""),
        replyChannel: String(replyChannel || ""),
        replyTo: String(replyTo || ""),
        prompt: String(prompt || ""),
      }),
    },
  );
  return parseJsonOrThrow(res, "Could not send Doctor fix request");
};

export const sendAgentMessage = async ({
  message = "",
  sessionKey = "",
} = {}) => {
  const res = await authFetch("/api/agent/message", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: String(message || ""),
      sessionKey: String(sessionKey || ""),
    }),
  });
  return parseJsonOrThrow(res, "Could not send message to agent");
};

export async function restartGateway() {
  const res = await authFetch("/api/gateway/restart", { method: "POST" });
  return parseJsonOrThrow(res, "Could not restart gateway");
}

export async function fetchRestartStatus() {
  const res = await authFetch("/api/restart-status");
  return parseJsonOrThrow(res, "Could not load restart status");
}

export async function fetchWatchdogStatus() {
  const res = await authFetch("/api/watchdog/status");
  return parseJsonOrThrow(res, "Could not load watchdog status");
}

export async function fetchUsageSummary(days = 30) {
  const params = new URLSearchParams({ days: String(days) });
  const res = await authFetch(`/api/usage/summary?${params.toString()}`);
  return parseJsonOrThrow(res, "Could not load usage summary");
}

export async function fetchUsageSessions(limit = 50) {
  const params = new URLSearchParams({ limit: String(limit) });
  const res = await authFetch(`/api/usage/sessions?${params.toString()}`);
  return parseJsonOrThrow(res, "Could not load usage sessions");
}

export async function fetchUsageSessionDetail(sessionId) {
  const res = await authFetch(
    `/api/usage/sessions/${encodeURIComponent(String(sessionId || ""))}`,
  );
  return parseJsonOrThrow(res, "Could not load usage session detail");
}

export async function fetchUsageSessionTimeSeries(sessionId, maxPoints = 100) {
  const params = new URLSearchParams({ maxPoints: String(maxPoints) });
  const safeSessionId = encodeURIComponent(String(sessionId || ""));
  const res = await authFetch(
    `/api/usage/sessions/${safeSessionId}/timeseries?${params.toString()}`,
  );
  return parseJsonOrThrow(res, "Could not load usage time series");
}

export async function fetchWatchdogEvents(limit = 20) {
  const res = await authFetch(
    `/api/watchdog/events?limit=${encodeURIComponent(String(limit))}`,
  );
  return parseJsonOrThrow(res, "Could not load watchdog events");
}

export async function fetchWatchdogLogs(tail = 65536) {
  const res = await authFetch(
    `/api/watchdog/logs?tail=${encodeURIComponent(String(tail))}`,
  );
  if (!res.ok) throw new Error("Could not load watchdog logs");
  return res.text();
}

export async function createWatchdogTerminalSession() {
  const res = await authFetch("/api/watchdog/terminal/session", {
    method: "POST",
  });
  return parseJsonOrThrow(res, "Could not start watchdog terminal");
}

export async function fetchWatchdogTerminalOutput(sessionId, cursor = 0) {
  const params = new URLSearchParams({
    sessionId: String(sessionId || ""),
    cursor: String(cursor || 0),
  });
  const res = await authFetch(`/api/watchdog/terminal/output?${params.toString()}`);
  return parseJsonOrThrow(res, "Could not read watchdog terminal output");
}

export async function sendWatchdogTerminalInput(sessionId, input = "") {
  const res = await authFetch("/api/watchdog/terminal/input", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId: String(sessionId || ""),
      input: String(input || ""),
    }),
  });
  return parseJsonOrThrow(res, "Could not send watchdog terminal input");
}

export async function closeWatchdogTerminalSession(sessionId) {
  const res = await authFetch("/api/watchdog/terminal/close", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId: String(sessionId || ""),
    }),
  });
  return parseJsonOrThrow(res, "Could not close watchdog terminal");
}

export async function triggerWatchdogRepair() {
  const res = await authFetch("/api/watchdog/repair", { method: "POST" });
  return parseJsonOrThrow(res, "Could not trigger watchdog repair");
}

export async function fetchWatchdogResources() {
  const res = await authFetch("/api/watchdog/resources");
  return parseJsonOrThrow(res, "Could not load system resources");
}

export async function fetchWatchdogSettings() {
  const res = await authFetch("/api/watchdog/settings");
  return parseJsonOrThrow(res, "Could not load watchdog settings");
}

export async function updateWatchdogSettings(settings) {
  const res = await authFetch("/api/watchdog/settings", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(settings || {}),
  });
  return parseJsonOrThrow(res, "Could not update watchdog settings");
}

export async function fetchDashboardUrl() {
  const res = await authFetch("/api/gateway/dashboard");
  return res.json();
}

export async function fetchOpenclawVersion(refresh = false) {
  const query = refresh ? "?refresh=1" : "";
  const res = await authFetch(`/api/openclaw/version${query}`);
  return res.json();
}

export async function updateOpenclaw() {
  const res = await authFetch("/api/openclaw/update", { method: "POST" });
  return res.json();
}

export async function fetchAlphaclawVersion(refresh = false) {
  const query = refresh ? "?refresh=1" : "";
  const res = await authFetch(`/api/alphaclaw/version${query}`);
  return res.json();
}

export async function fetchAlphaclawReleaseNotes(tag = "") {
  const normalizedTag = String(tag || "").trim();
  const query = normalizedTag
    ? `?${new URLSearchParams({ tag: normalizedTag }).toString()}`
    : "";
  try {
    const res = await authFetch(`/api/alphaclaw/release-notes${query}`);
    return await parseJsonOrThrow(res, "Could not load release notes");
  } catch {
    const endpoint = normalizedTag
      ? `https://api.github.com/repos/chrysb/alphaclaw/releases/tags/${encodeURIComponent(normalizedTag)}`
      : "https://api.github.com/repos/chrysb/alphaclaw/releases/latest";
    const res = await fetch(endpoint, {
      headers: { Accept: "application/vnd.github+json" },
    });
    const text = await res.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      throw new Error(text || "Could not load release notes");
    }
    if (!res.ok) {
      throw new Error(data?.message || text || "Could not load release notes");
    }
    return {
      ok: true,
      tag: String(data?.tag_name || normalizedTag || ""),
      name: String(data?.name || ""),
      body: String(data?.body || ""),
      htmlUrl: String(data?.html_url || ""),
      publishedAt: String(data?.published_at || ""),
    };
  }
}

export async function updateAlphaclaw() {
  const res = await authFetch("/api/alphaclaw/update", { method: "POST" });
  return res.json();
}

export async function fetchSyncCron() {
  const res = await authFetch("/api/sync-cron");
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(text || "Could not parse sync cron response");
  }
  if (!res.ok) {
    throw new Error(data.error || text || `HTTP ${res.status}`);
  }
  return data;
}

export async function updateSyncCron(payload) {
  const res = await authFetch("/api/sync-cron", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(text || "Could not parse sync cron response");
  }
  if (!res.ok) {
    throw new Error(data.error || text || `HTTP ${res.status}`);
  }
  return data;
}

export async function fetchCronJobs({ sortBy = "nextRunAtMs", sortDir = "asc" } = {}) {
  const params = new URLSearchParams();
  if (sortBy) params.set("sortBy", String(sortBy));
  if (sortDir) params.set("sortDir", String(sortDir));
  const suffix = params.toString() ? `?${params.toString()}` : "";
  const res = await authFetch(`/api/cron/jobs${suffix}`);
  return parseJsonOrThrow(res, "Could not load cron jobs");
}

export async function fetchCronStatus() {
  const res = await authFetch("/api/cron/status");
  return parseJsonOrThrow(res, "Could not load cron status");
}

export async function fetchCronJobRuns(
  id,
  {
    limit = 20,
    offset = 0,
    status = "all",
    deliveryStatus = "all",
    sortDir = "desc",
    query = "",
  } = {},
) {
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
    status: String(status || "all"),
    deliveryStatus: String(deliveryStatus || "all"),
    sortDir: String(sortDir || "desc"),
  });
  if (String(query || "").trim()) params.set("query", String(query).trim());
  const safeId = encodeURIComponent(String(id || ""));
  const res = await authFetch(`/api/cron/jobs/${safeId}/runs?${params.toString()}`);
  return parseJsonOrThrow(res, "Could not load cron run history");
}

export async function fetchCronJobUsage(id, { days = 30 } = {}) {
  const params = new URLSearchParams({ days: String(days) });
  const safeId = encodeURIComponent(String(id || ""));
  const res = await authFetch(`/api/cron/jobs/${safeId}/usage?${params.toString()}`);
  return parseJsonOrThrow(res, "Could not load cron job usage");
}

export async function fetchCronJobTrends(id, { range = "7d" } = {}) {
  const params = new URLSearchParams({ range: String(range || "7d") });
  const safeId = encodeURIComponent(String(id || ""));
  const res = await authFetch(`/api/cron/jobs/${safeId}/trends?${params.toString()}`);
  return parseJsonOrThrow(res, "Could not load cron job trends");
}

export async function fetchCronBulkUsage({ days = 30 } = {}) {
  const params = new URLSearchParams({ days: String(days) });
  const res = await authFetch(`/api/cron/usage/bulk?${params.toString()}`);
  return parseJsonOrThrow(res, "Could not load cron usage overview");
}

export async function fetchCronBulkRuns({
  sinceMs = 0,
  limitPerJob = 20,
  status = "all",
  deliveryStatus = "all",
  sortDir = "desc",
} = {}) {
  const params = new URLSearchParams({
    sinceMs: String(sinceMs || 0),
    limitPerJob: String(limitPerJob || 20),
    status: String(status || "all"),
    deliveryStatus: String(deliveryStatus || "all"),
    sortDir: String(sortDir || "desc"),
  });
  const res = await authFetch(`/api/cron/runs/bulk?${params.toString()}`);
  return parseJsonOrThrow(res, "Could not load cron run outcomes");
}

export async function triggerCronJobRun(id) {
  const safeId = encodeURIComponent(String(id || ""));
  const res = await authFetch(`/api/cron/jobs/${safeId}/run`, { method: "POST" });
  return parseJsonOrThrow(res, "Could not trigger cron job run");
}

export async function setCronJobEnabled(id, enabled) {
  const safeId = encodeURIComponent(String(id || ""));
  const action = enabled ? "enable" : "disable";
  const res = await authFetch(`/api/cron/jobs/${safeId}/${action}`, {
    method: "POST",
  });
  return parseJsonOrThrow(res, "Could not update cron job state");
}

export async function updateCronJobPrompt(id, message) {
  const safeId = encodeURIComponent(String(id || ""));
  const res = await authFetch(`/api/cron/jobs/${safeId}/prompt`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: String(message || "") }),
  });
  return parseJsonOrThrow(res, "Could not update cron prompt");
}

export async function updateCronJobRouting(
  id,
  {
    sessionTarget = "",
    wakeMode = "",
    deliveryMode = "",
    deliveryChannel = "",
    deliveryTo = "",
  } = {},
) {
  const safeId = encodeURIComponent(String(id || ""));
  const res = await authFetch(`/api/cron/jobs/${safeId}/routing`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionTarget: String(sessionTarget || ""),
      wakeMode: String(wakeMode || ""),
      deliveryMode: String(deliveryMode || ""),
      deliveryChannel: String(deliveryChannel || ""),
      deliveryTo: String(deliveryTo || ""),
    }),
  });
  return parseJsonOrThrow(res, "Could not update cron routing");
}

export async function fetchDevicePairings() {
  const res = await authFetch("/api/devices");
  return res.json();
}

export async function approveDevice(id) {
  const res = await authFetch(`/api/devices/${id}/approve`, { method: "POST" });
  return res.json();
}

export async function rejectDevice(id) {
  const res = await authFetch(`/api/devices/${id}/reject`, { method: "POST" });
  return res.json();
}

export const fetchNodesStatus = async () => {
  const res = await authFetch("/api/nodes");
  return parseJsonOrThrow(res, "Could not load nodes");
};

export const approveNode = async (nodeId) => {
  const safeNodeId = encodeURIComponent(String(nodeId || ""));
  const res = await authFetch(`/api/nodes/${safeNodeId}/approve`, {
    method: "POST",
  });
  return parseJsonOrThrow(res, "Could not approve node");
};

export const fetchNodeConnectInfo = async () => {
  const res = await authFetch("/api/nodes/connect-info");
  return parseJsonOrThrow(res, "Could not load connect info");
};

export const fetchNodeBrowserStatusForNode = async (nodeId, profile = "user") => {
  const safeNodeId = encodeURIComponent(String(nodeId || ""));
  const params = new URLSearchParams({ profile: String(profile || "user") });
  const res = await authFetch(
    `/api/nodes/${safeNodeId}/browser-status?${params.toString()}`,
  );
  return parseJsonOrThrow(res, "Could not load node browser status");
};

export const fetchNodeExecConfig = async () => {
  const res = await authFetch("/api/nodes/exec-config");
  return parseJsonOrThrow(res, "Could not load node exec config");
};

export const saveNodeExecConfig = async (payload) => {
  const res = await authFetch("/api/nodes/exec-config", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload || {}),
  });
  return parseJsonOrThrow(res, "Could not save node exec config");
};

export const fetchNodeExecApprovals = async () => {
  const res = await authFetch("/api/nodes/exec-approvals");
  return parseJsonOrThrow(res, "Could not load node exec approvals");
};

export const addNodeExecAllowlistPattern = async (pattern) => {
  const res = await authFetch("/api/nodes/exec-approvals/allowlist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pattern: String(pattern || "") }),
  });
  return parseJsonOrThrow(res, "Could not add allowlist pattern");
};

export const removeNodeExecAllowlistPattern = async (entryId) => {
  const safeEntryId = encodeURIComponent(String(entryId || ""));
  const res = await authFetch(`/api/nodes/exec-approvals/allowlist/${safeEntryId}`, {
    method: "DELETE",
  });
  return parseJsonOrThrow(res, "Could not remove allowlist pattern");
};

export const fetchAuthStatus = async () => {
  const res = await authFetch("/api/auth/status");
  return res.json();
};

export const logout = async () => {
  const res = await authFetch("/api/auth/logout", { method: "POST" });
  return res.json();
};

export async function fetchOnboardStatus() {
  const res = await authFetch("/api/onboard/status");
  return res.json();
}

export async function runOnboard(vars, modelKey, { importMode = false } = {}) {
  const res = await authFetch("/api/onboard", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ vars, modelKey, importMode }),
  });
  return res.json();
}

export async function verifyGithubOnboardingRepo(repo, token, mode = "new") {
  const res = await authFetch("/api/onboard/github/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ repo, token, mode }),
  });
  return res.json();
}

export async function scanImportRepo(tempDir) {
  const res = await authFetch("/api/onboard/import/scan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tempDir }),
  });
  return res.json();
}

export async function applyImport({
  tempDir,
  approvedSecrets = [],
  skipSecretExtraction = false,
  githubRepo = "",
  githubToken = "",
}) {
  const res = await authFetch("/api/onboard/import/apply", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tempDir,
      approvedSecrets,
      skipSecretExtraction,
      githubRepo,
      githubToken,
    }),
  });
  return res.json();
}

export const fetchModels = async () => {
  const res = await authFetch("/api/models");
  return res.json();
};

export const fetchModelStatus = async () => {
  const res = await authFetch("/api/models/status");
  return res.json();
};

export const setPrimaryModel = async (modelKey) => {
  const res = await authFetch("/api/models/set", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ modelKey }),
  });
  return res.json();
};

export const fetchModelsConfig = async ({ agentId } = {}) => {
  const qs = agentId ? `?agentId=${encodeURIComponent(agentId)}` : "";
  const res = await authFetch(`/api/models/config${qs}`);
  return res.json();
};

export const saveModelsConfig = async ({
  primary,
  configuredModels,
  profiles,
  authOrder,
  agentId,
} = {}) => {
  const qs = agentId ? `?agentId=${encodeURIComponent(agentId)}` : "";
  const res = await authFetch(`/api/models/config${qs}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ primary, configuredModels, profiles, authOrder }),
  });
  return res.json();
};

export const fetchAuthProfiles = async () => {
  const res = await authFetch("/api/models/auth");
  return res.json();
};

export const upsertAuthProfile = async (profileId, credential) => {
  const res = await authFetch(
    `/api/models/auth/${encodeURIComponent(profileId)}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credential),
    },
  );
  return res.json();
};

export const deleteAuthProfile = async (profileId) => {
  const res = await authFetch(
    `/api/models/auth/${encodeURIComponent(profileId)}`,
    {
      method: "DELETE",
    },
  );
  return res.json();
};

export const fetchAgents = async () => {
  const res = await authFetch("/api/agents");
  return parseJsonOrThrow(res, "Could not load agents");
};

export const fetchChannelAccounts = async () => {
  const res = await authFetch("/api/channels/accounts");
  return parseJsonOrThrow(res, "Could not load channel accounts");
};

export const fetchChannelAccountToken = async ({
  provider = "",
  accountId = "default",
} = {}) => {
  const params = new URLSearchParams({
    provider: String(provider || ""),
    accountId: String(accountId || "default"),
  });
  const res = await authFetch(`/api/channels/accounts/token?${params.toString()}`);
  return parseJsonOrThrow(res, "Could not load channel token");
};

export const createChannelAccount = async (payload) => {
  const res = await authFetch("/api/channels/accounts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload || {}),
  });
  return parseJsonOrThrow(res, "Could not create channel account");
};

export const createChannelAccountJob = async (payload) => {
  const res = await authFetch("/api/channels/accounts/jobs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload || {}),
  });
  return parseJsonOrThrow(res, "Could not start channel account operation");
};

export const subscribeOperationEvents = ({
  operationId = "",
  onMessage = () => {},
  onError = () => {},
}) =>
  subscribeToSse({
    url: `/api/operations/${encodeURIComponent(String(operationId || ""))}/events`,
    onMessage,
    onError,
  });

export const updateChannelAccount = async (payload) => {
  const res = await authFetch("/api/channels/accounts", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload || {}),
  });
  return parseJsonOrThrow(res, "Could not update channel account");
};

export const deleteChannelAccount = async (payload) => {
  const res = await authFetch("/api/channels/accounts", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload || {}),
  });
  return parseJsonOrThrow(res, "Could not delete channel account");
};

export const fetchAgent = async (agentId) => {
  const res = await authFetch(`/api/agents/${encodeURIComponent(String(agentId || ""))}`);
  return parseJsonOrThrow(res, "Could not load agent");
};

export const fetchAgentWorkspaceSize = async (agentId) => {
  const res = await authFetch(
    `/api/agents/${encodeURIComponent(String(agentId || ""))}/workspace-size`,
  );
  return parseJsonOrThrow(res, "Could not load workspace size");
};

export const fetchAgentBindings = async (agentId) => {
  const res = await authFetch(
    `/api/agents/${encodeURIComponent(String(agentId || ""))}/bindings`,
  );
  return parseJsonOrThrow(res, "Could not load agent bindings");
};

export const createAgent = async (payload) => {
  const res = await authFetch("/api/agents", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload || {}),
  });
  return parseJsonOrThrow(res, "Could not create agent");
};

export const updateAgent = async (agentId, payload) => {
  const res = await authFetch(`/api/agents/${encodeURIComponent(String(agentId || ""))}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload || {}),
  });
  return parseJsonOrThrow(res, "Could not update agent");
};

export const addAgentBinding = async (agentId, payload) => {
  const res = await authFetch(
    `/api/agents/${encodeURIComponent(String(agentId || ""))}/bindings`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload || {}),
    },
  );
  return parseJsonOrThrow(res, "Could not add agent binding");
};

export const removeAgentBinding = async (agentId, payload) => {
  const res = await authFetch(
    `/api/agents/${encodeURIComponent(String(agentId || ""))}/bindings`,
    {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload || {}),
    },
  );
  return parseJsonOrThrow(res, "Could not remove agent binding");
};

export const deleteAgent = async (agentId, { keepWorkspace = true } = {}) => {
  const query = new URLSearchParams({
    keepWorkspace: keepWorkspace ? "true" : "false",
  });
  const res = await authFetch(
    `/api/agents/${encodeURIComponent(String(agentId || ""))}?${query.toString()}`,
    { method: "DELETE" },
  );
  return parseJsonOrThrow(res, "Could not delete agent");
};

export const setDefaultAgent = async (agentId) => {
  const res = await authFetch(
    `/api/agents/${encodeURIComponent(String(agentId || ""))}/default`,
    { method: "POST" },
  );
  return parseJsonOrThrow(res, "Could not set default agent");
};

export const fetchCodexStatus = async () => {
  const res = await authFetch("/api/codex/status");
  return res.json();
};

export const disconnectCodex = async () => {
  const res = await authFetch("/api/codex/disconnect", { method: "POST" });
  return res.json();
};

export const exchangeCodexOAuth = async (input) => {
  const res = await authFetch("/api/codex/exchange", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ input }),
  });
  return res.json();
};

export async function fetchEnvVars() {
  const res = await authFetch("/api/env");
  return res.json();
}

export async function saveEnvVars(vars) {
  const res = await authFetch("/api/env", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ vars }),
  });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(text || "Could not parse env save response");
  }
  if (!res.ok) {
    throw new Error(data.error || text || `HTTP ${res.status}`);
  }
  return data;
}

const parseJsonOrThrow = async (res, fallbackError) => {
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(text || fallbackError);
  }
  if (!res.ok || data?.ok === false) {
    throw new Error(data.error || text || `HTTP ${res.status}`);
  }
  return data;
};

export async function fetchWebhooks() {
  const res = await authFetch("/api/webhooks");
  return parseJsonOrThrow(res, "Could not load webhooks");
}

export async function fetchWebhookDetail(name) {
  const res = await authFetch(`/api/webhooks/${encodeURIComponent(name)}`);
  return parseJsonOrThrow(res, "Could not load webhook detail");
}

export async function createWebhook(name, { destination = null } = {}) {
  const res = await authFetch("/api/webhooks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name,
      ...(destination ? { destination } : {}),
    }),
  });
  return parseJsonOrThrow(res, "Could not create webhook");
}

export async function deleteWebhook(name, { deleteTransformDir = false } = {}) {
  const res = await authFetch(`/api/webhooks/${encodeURIComponent(name)}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ deleteTransformDir: !!deleteTransformDir }),
  });
  return parseJsonOrThrow(res, "Could not delete webhook");
}

export async function fetchWebhookRequests(
  name,
  { limit = 50, offset = 0, status = "all" } = {},
) {
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
    status: String(status || "all"),
  });
  const res = await authFetch(
    `/api/webhooks/${encodeURIComponent(name)}/requests?${params.toString()}`,
  );
  return parseJsonOrThrow(res, "Could not load webhook requests");
}

export async function fetchWebhookRequest(name, id) {
  const res = await authFetch(
    `/api/webhooks/${encodeURIComponent(name)}/requests/${encodeURIComponent(String(id))}`,
  );
  return parseJsonOrThrow(res, "Could not load webhook request");
}

export const fetchBrowseTree = async (depth = 10) => {
  const params = new URLSearchParams({ depth: String(depth) });
  const res = await authFetch(`/api/browse/tree?${params.toString()}`);
  return parseJsonOrThrow(res, "Could not load file tree");
};

export const fetchFileContent = async (filePath) => {
  const params = new URLSearchParams({ path: String(filePath || "") });
  const res = await authFetch(`/api/browse/read?${params.toString()}`);
  return parseJsonOrThrow(res, "Could not load file content");
};

export const saveFileContent = async (filePath, content) => {
  const res = await authFetch("/api/browse/write", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path: filePath, content }),
  });
  return parseJsonOrThrow(res, "Could not save file");
};

export const createBrowseFile = async (filePath) => {
  const res = await authFetch("/api/browse/create-file", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path: String(filePath || "") }),
  });
  return parseJsonOrThrow(res, "Could not create file");
};

export const createBrowseFolder = async (folderPath) => {
  const res = await authFetch("/api/browse/create-folder", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path: String(folderPath || "") }),
  });
  return parseJsonOrThrow(res, "Could not create folder");
};

export const moveBrowsePath = async (from, to) => {
  const res = await authFetch("/api/browse/move", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ from: String(from || ""), to: String(to || "") }),
  });
  return parseJsonOrThrow(res, "Could not move path");
};

export const deleteBrowseFile = async (filePath) => {
  const res = await authFetch("/api/browse/delete", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path: String(filePath || "") }),
  });
  return parseJsonOrThrow(res, "Could not delete file");
};

export const downloadBrowseFile = async (filePath) => {
  const params = new URLSearchParams({ path: String(filePath || "") });
  const res = await authFetch(`/api/browse/download?${params.toString()}`);
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || "Could not download file");
  }
  const fileBlob = await res.blob();
  const urlApi = window?.URL || URL;
  if (!urlApi?.createObjectURL || !urlApi?.revokeObjectURL) {
    throw new Error("Download is not supported in this browser");
  }
  const downloadUrl = urlApi.createObjectURL(fileBlob);
  const fileName =
    String(filePath || "")
      .split("/")
      .filter(Boolean)
      .pop() || "download";
  try {
    const downloadLink = document.createElement("a");
    downloadLink.href = downloadUrl;
    downloadLink.download = fileName;
    document.body?.appendChild(downloadLink);
    downloadLink.click();
    downloadLink.remove();
  } finally {
    urlApi.revokeObjectURL(downloadUrl);
  }
  return { ok: true };
};

export const restoreBrowseFile = async (filePath) => {
  const res = await authFetch("/api/browse/restore", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path: String(filePath || "") }),
  });
  return parseJsonOrThrow(res, "Could not restore file");
};

export const fetchBrowseGitSummary = async () => {
  const res = await authFetch("/api/browse/git-summary");
  return parseJsonOrThrow(res, "Could not load git summary");
};

export const fetchBrowseFileDiff = async (filePath) => {
  const params = new URLSearchParams({ path: String(filePath || "") });
  const res = await authFetch(`/api/browse/git-diff?${params.toString()}`);
  return parseJsonOrThrow(res, "Could not load file diff");
};

export const fetchBrowseSqliteTable = async ({
  filePath,
  table,
  limit = 50,
  offset = 0,
}) => {
  const params = new URLSearchParams({
    path: String(filePath || ""),
    table: String(table || ""),
    limit: String(limit),
    offset: String(offset),
  });
  const res = await authFetch(`/api/browse/sqlite-table?${params.toString()}`);
  return parseJsonOrThrow(res, "Could not load sqlite table data");
};

export const syncBrowseChanges = async (message = "") => {
  const res = await authFetch("/api/browse/git-sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: String(message || "") }),
  });
  return parseJsonOrThrow(res, "Could not sync changes");
};
