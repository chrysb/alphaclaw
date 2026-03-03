export const authFetch = async (url, opts = {}) => {
  const res = await fetch(url, opts);
  if (res.status === 401) {
    try {
      window.localStorage?.clear?.();
    } catch {}
    window.location.href = '/setup';
    throw new Error('Unauthorized');
  }
  return res;
};

export async function fetchStatus() {
  const res = await authFetch('/api/status');
  return res.json();
}

export async function fetchPairings() {
  const res = await authFetch('/api/pairings');
  return res.json();
}

export async function approvePairing(id, channel) {
  const res = await authFetch(`/api/pairings/${id}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ channel }),
  });
  return res.json();
}

export async function rejectPairing(id, channel) {
  const res = await authFetch(`/api/pairings/${id}/reject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ channel }),
  });
  return res.json();
}

export async function fetchGoogleAccounts() {
  const res = await authFetch('/api/google/accounts');
  return res.json();
}

export async function fetchGoogleStatus(accountId = "") {
  const params = new URLSearchParams();
  if (accountId) params.set("accountId", String(accountId));
  const suffix = params.toString() ? `?${params.toString()}` : "";
  const res = await authFetch(`/api/google/status${suffix}`);
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
  const res = await authFetch('/api/google/credentials', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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
  const res = await authFetch('/api/google/accounts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, services, client, personal, accountId }),
  });
  return res.json();
}

export async function disconnectGoogle(accountId = "") {
  const res = await authFetch('/api/google/disconnect', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accountId }),
  });
  return res.json();
}

export async function restartGateway() {
  const res = await authFetch('/api/gateway/restart', { method: 'POST' });
  return parseJsonOrThrow(res, 'Could not restart gateway');
}

export async function fetchRestartStatus() {
  const res = await authFetch('/api/restart-status');
  return parseJsonOrThrow(res, 'Could not load restart status');
}

export async function fetchWatchdogStatus() {
  const res = await authFetch('/api/watchdog/status');
  return parseJsonOrThrow(res, 'Could not load watchdog status');
}

export async function fetchUsageSummary(days = 30) {
  const params = new URLSearchParams({ days: String(days) });
  const res = await authFetch(`/api/usage/summary?${params.toString()}`);
  return parseJsonOrThrow(res, 'Could not load usage summary');
}

export async function fetchUsageSessions(limit = 50) {
  const params = new URLSearchParams({ limit: String(limit) });
  const res = await authFetch(`/api/usage/sessions?${params.toString()}`);
  return parseJsonOrThrow(res, 'Could not load usage sessions');
}

export async function fetchUsageSessionDetail(sessionId) {
  const res = await authFetch(`/api/usage/sessions/${encodeURIComponent(String(sessionId || ''))}`);
  return parseJsonOrThrow(res, 'Could not load usage session detail');
}

export async function fetchUsageSessionTimeSeries(sessionId, maxPoints = 100) {
  const params = new URLSearchParams({ maxPoints: String(maxPoints) });
  const safeSessionId = encodeURIComponent(String(sessionId || ''));
  const res = await authFetch(`/api/usage/sessions/${safeSessionId}/timeseries?${params.toString()}`);
  return parseJsonOrThrow(res, 'Could not load usage time series');
}

export async function fetchWatchdogEvents(limit = 20) {
  const res = await authFetch(`/api/watchdog/events?limit=${encodeURIComponent(String(limit))}`);
  return parseJsonOrThrow(res, 'Could not load watchdog events');
}

export async function fetchWatchdogLogs(tail = 65536) {
  const res = await authFetch(`/api/watchdog/logs?tail=${encodeURIComponent(String(tail))}`);
  if (!res.ok) throw new Error('Could not load watchdog logs');
  return res.text();
}

export async function triggerWatchdogRepair() {
  const res = await authFetch('/api/watchdog/repair', { method: 'POST' });
  return parseJsonOrThrow(res, 'Could not trigger watchdog repair');
}

export async function fetchWatchdogResources() {
  const res = await authFetch('/api/watchdog/resources');
  return parseJsonOrThrow(res, 'Could not load system resources');
}

export async function fetchWatchdogSettings() {
  const res = await authFetch('/api/watchdog/settings');
  return parseJsonOrThrow(res, 'Could not load watchdog settings');
}

export async function updateWatchdogSettings(settings) {
  const res = await authFetch('/api/watchdog/settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings || {}),
  });
  return parseJsonOrThrow(res, 'Could not update watchdog settings');
}

export async function fetchDashboardUrl() {
  const res = await authFetch('/api/gateway/dashboard');
  return res.json();
}

export async function fetchOpenclawVersion(refresh = false) {
  const query = refresh ? '?refresh=1' : '';
  const res = await authFetch(`/api/openclaw/version${query}`);
  return res.json();
}

export async function updateOpenclaw() {
  const res = await authFetch('/api/openclaw/update', { method: 'POST' });
  return res.json();
}

export async function fetchAlphaclawVersion(refresh = false) {
  const query = refresh ? '?refresh=1' : '';
  const res = await authFetch(`/api/alphaclaw/version${query}`);
  return res.json();
}

export async function updateAlphaclaw() {
  const res = await authFetch('/api/alphaclaw/update', { method: 'POST' });
  return res.json();
}

export async function fetchSyncCron() {
  const res = await authFetch('/api/sync-cron');
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(text || 'Could not parse sync cron response');
  }
  if (!res.ok) {
    throw new Error(data.error || text || `HTTP ${res.status}`);
  }
  return data;
}

export async function updateSyncCron(payload) {
  const res = await authFetch('/api/sync-cron', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(text || 'Could not parse sync cron response');
  }
  if (!res.ok) {
    throw new Error(data.error || text || `HTTP ${res.status}`);
  }
  return data;
}

export async function fetchDevicePairings() {
  const res = await authFetch('/api/devices');
  return res.json();
}

export async function approveDevice(id) {
  const res = await authFetch(`/api/devices/${id}/approve`, { method: 'POST' });
  return res.json();
}

export async function rejectDevice(id) {
  const res = await authFetch(`/api/devices/${id}/reject`, { method: 'POST' });
  return res.json();
}

export const fetchAuthStatus = async () => {
  const res = await authFetch('/api/auth/status');
  return res.json();
};

export const logout = async () => {
  const res = await authFetch('/api/auth/logout', { method: 'POST' });
  return res.json();
};

export async function fetchOnboardStatus() {
  const res = await authFetch('/api/onboard/status');
  return res.json();
}

export async function runOnboard(vars, modelKey) {
  const res = await authFetch('/api/onboard', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ vars, modelKey }),
  });
  return res.json();
}

export async function verifyGithubOnboardingRepo(repo, token) {
  const res = await authFetch('/api/onboard/github/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ repo, token }),
  });
  return res.json();
}

export const fetchModels = async () => {
  const res = await authFetch('/api/models');
  return res.json();
};

export const fetchModelStatus = async () => {
  const res = await authFetch('/api/models/status');
  return res.json();
};

export const setPrimaryModel = async (modelKey) => {
  const res = await authFetch('/api/models/set', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ modelKey }),
  });
  return res.json();
};

export const fetchCodexStatus = async () => {
  const res = await authFetch('/api/codex/status');
  return res.json();
};

export const disconnectCodex = async () => {
  const res = await authFetch('/api/codex/disconnect', { method: 'POST' });
  return res.json();
};

export const exchangeCodexOAuth = async (input) => {
  const res = await authFetch('/api/codex/exchange', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ input }),
  });
  return res.json();
};

export async function fetchEnvVars() {
  const res = await authFetch('/api/env');
  return res.json();
}

export async function saveEnvVars(vars) {
  const res = await authFetch('/api/env', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ vars }),
  });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(text || 'Could not parse env save response');
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
  const res = await authFetch('/api/webhooks');
  return parseJsonOrThrow(res, 'Could not load webhooks');
}

export async function fetchWebhookDetail(name) {
  const res = await authFetch(`/api/webhooks/${encodeURIComponent(name)}`);
  return parseJsonOrThrow(res, 'Could not load webhook detail');
}

export async function createWebhook(name) {
  const res = await authFetch('/api/webhooks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  return parseJsonOrThrow(res, 'Could not create webhook');
}

export async function deleteWebhook(name, { deleteTransformDir = false } = {}) {
  const res = await authFetch(`/api/webhooks/${encodeURIComponent(name)}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deleteTransformDir: !!deleteTransformDir }),
  });
  return parseJsonOrThrow(res, 'Could not delete webhook');
}

export async function fetchWebhookRequests(name, { limit = 50, offset = 0, status = 'all' } = {}) {
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
    status: String(status || 'all'),
  });
  const res = await authFetch(
    `/api/webhooks/${encodeURIComponent(name)}/requests?${params.toString()}`,
  );
  return parseJsonOrThrow(res, 'Could not load webhook requests');
}

export async function fetchWebhookRequest(name, id) {
  const res = await authFetch(
    `/api/webhooks/${encodeURIComponent(name)}/requests/${encodeURIComponent(String(id))}`,
  );
  return parseJsonOrThrow(res, 'Could not load webhook request');
}

export const fetchBrowseTree = async (depth = 10) => {
  const params = new URLSearchParams({ depth: String(depth) });
  const res = await authFetch(`/api/browse/tree?${params.toString()}`);
  return parseJsonOrThrow(res, 'Could not load file tree');
};

export const fetchFileContent = async (filePath) => {
  const params = new URLSearchParams({ path: String(filePath || '') });
  const res = await authFetch(`/api/browse/read?${params.toString()}`);
  return parseJsonOrThrow(res, 'Could not load file content');
};

export const saveFileContent = async (filePath, content) => {
  const res = await authFetch('/api/browse/write', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: filePath, content }),
  });
  return parseJsonOrThrow(res, 'Could not save file');
};

export const deleteBrowseFile = async (filePath) => {
  const res = await authFetch('/api/browse/delete', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: String(filePath || '') }),
  });
  return parseJsonOrThrow(res, 'Could not delete file');
};

export const restoreBrowseFile = async (filePath) => {
  const res = await authFetch('/api/browse/restore', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: String(filePath || '') }),
  });
  return parseJsonOrThrow(res, 'Could not restore file');
};

export const fetchBrowseGitSummary = async () => {
  const res = await authFetch('/api/browse/git-summary');
  return parseJsonOrThrow(res, 'Could not load git summary');
};

export const fetchBrowseFileDiff = async (filePath) => {
  const params = new URLSearchParams({ path: String(filePath || "") });
  const res = await authFetch(`/api/browse/git-diff?${params.toString()}`);
  return parseJsonOrThrow(res, 'Could not load file diff');
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
  const res = await authFetch('/api/browse/git-sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: String(message || "") }),
  });
  return parseJsonOrThrow(res, 'Could not sync changes');
};
