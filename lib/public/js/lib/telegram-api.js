import { authFetch } from "./api.js";

const appendAccountId = (params, accountId) => {
  const normalized = String(accountId || "").trim();
  if (normalized) params.set("accountId", normalized);
};

export const verifyBot = async ({ accountId = "" } = {}) => {
  const params = new URLSearchParams();
  appendAccountId(params, accountId);
  const suffix = params.toString() ? `?${params.toString()}` : "";
  const res = await authFetch(`/api/telegram/bot${suffix}`);
  return res.json();
};

export const workspace = async ({ accountId = "" } = {}) => {
  const params = new URLSearchParams();
  appendAccountId(params, accountId);
  const suffix = params.toString() ? `?${params.toString()}` : "";
  const res = await authFetch(`/api/telegram/workspace${suffix}`);
  return res.json();
};

export const resetWorkspace = async ({ accountId = "" } = {}) => {
  const params = new URLSearchParams();
  appendAccountId(params, accountId);
  const suffix = params.toString() ? `?${params.toString()}` : "";
  const res = await authFetch(`/api/telegram/workspace/reset${suffix}`, {
    method: "POST",
  });
  return res.json();
};

export const verifyGroup = async (groupId, { accountId = "" } = {}) => {
  const res = await authFetch("/api/telegram/groups/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ groupId, accountId }),
  });
  return res.json();
};

export const listTopics = async (groupId, { accountId = "" } = {}) => {
  const params = new URLSearchParams();
  appendAccountId(params, accountId);
  const suffix = params.toString() ? `?${params.toString()}` : "";
  const res = await authFetch(
    `/api/telegram/groups/${encodeURIComponent(groupId)}/topics${suffix}`,
  );
  return res.json();
};

export const createTopicsBulk = async (groupId, topics, { accountId = "" } = {}) => {
  const res = await authFetch(
    `/api/telegram/groups/${encodeURIComponent(groupId)}/topics/bulk`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topics, accountId }),
    },
  );
  return res.json();
};

export const deleteTopic = async (groupId, topicId, { accountId = "" } = {}) => {
  const params = new URLSearchParams();
  appendAccountId(params, accountId);
  const suffix = params.toString() ? `?${params.toString()}` : "";
  const res = await authFetch(
    `/api/telegram/groups/${encodeURIComponent(groupId)}/topics/${topicId}${suffix}`,
    { method: "DELETE" },
  );
  return res.json();
};

export const updateTopic = async (groupId, topicId, payload, { accountId = "" } = {}) => {
  const res = await authFetch(
    `/api/telegram/groups/${encodeURIComponent(groupId)}/topics/${encodeURIComponent(topicId)}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, accountId }),
    },
  );
  return res.json();
};

export const configureGroup = async (groupId, payload, { accountId = "" } = {}) => {
  const res = await authFetch(
    `/api/telegram/groups/${encodeURIComponent(groupId)}/configure`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, accountId }),
    },
  );
  return res.json();
};
