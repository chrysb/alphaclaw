import { authFetch } from "./api.js";

export const verifyBot = async () => {
  const res = await authFetch("/api/telegram/bot");
  return res.json();
};

export const workspace = async () => {
  const res = await authFetch("/api/telegram/workspace");
  return res.json();
};

export const resetWorkspace = async () => {
  const res = await authFetch("/api/telegram/workspace/reset", {
    method: "POST",
  });
  return res.json();
};

export const verifyGroup = async (groupId) => {
  const res = await authFetch("/api/telegram/groups/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ groupId }),
  });
  return res.json();
};

export const listTopics = async (groupId) => {
  const res = await authFetch(
    `/api/telegram/groups/${encodeURIComponent(groupId)}/topics`,
  );
  return res.json();
};

export const createTopicsBulk = async (groupId, topics) => {
  const res = await authFetch(
    `/api/telegram/groups/${encodeURIComponent(groupId)}/topics/bulk`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topics }),
    },
  );
  return res.json();
};

export const deleteTopic = async (groupId, topicId) => {
  const res = await authFetch(
    `/api/telegram/groups/${encodeURIComponent(groupId)}/topics/${topicId}`,
    { method: "DELETE" },
  );
  return res.json();
};

export const updateTopic = async (groupId, topicId, payload) => {
  const res = await authFetch(
    `/api/telegram/groups/${encodeURIComponent(groupId)}/topics/${encodeURIComponent(topicId)}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
  return res.json();
};

export const configureGroup = async (groupId, payload) => {
  const res = await authFetch(
    `/api/telegram/groups/${encodeURIComponent(groupId)}/configure`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
  return res.json();
};
