const authFetch = async (url, opts = {}) => {
  const res = await fetch(url, opts);
  if (res.status === 401) {
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

export async function fetchGoogleStatus() {
  const res = await authFetch('/api/google/status');
  return res.json();
}

export async function checkGoogleApis() {
  const res = await authFetch('/api/google/check');
  return res.json();
}

export async function saveGoogleCredentials(clientId, clientSecret, email) {
  const res = await authFetch('/api/google/credentials', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clientId, clientSecret, email }),
  });
  return res.json();
}

export async function disconnectGoogle() {
  const res = await authFetch('/api/google/disconnect', { method: 'POST' });
  return res.json();
}

export async function restartGateway() {
  const res = await authFetch('/api/gateway/restart', { method: 'POST' });
  return res.json();
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
  return res.json();
}
