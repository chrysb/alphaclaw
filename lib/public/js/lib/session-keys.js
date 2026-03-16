export const getNormalizedSessionKey = (sessionKey = "") =>
  String(sessionKey || "").trim();

export const getSessionRowKey = (sessionRow = null) =>
  getNormalizedSessionKey(sessionRow?.key || sessionRow?.sessionKey || "");

export const getAgentIdFromSessionKey = (sessionKey = "") => {
  const normalizedSessionKey = getNormalizedSessionKey(sessionKey);
  const agentMatch = normalizedSessionKey.match(/^agent:([^:]+):/);
  return String(agentMatch?.[1] || "").trim();
};

export const isDestinationSessionKey = (sessionKey = "") => {
  const normalizedSessionKey = getNormalizedSessionKey(sessionKey).toLowerCase();
  return (
    normalizedSessionKey.includes(":direct:") ||
    normalizedSessionKey.includes(":group:")
  );
};

export const kDestinationSessionFilter = (sessionRow) =>
  !!(
    String(sessionRow?.replyChannel || "").trim() &&
    String(sessionRow?.replyTo || "").trim()
  ) || isDestinationSessionKey(getSessionRowKey(sessionRow));

export const getDestinationFromSession = (sessionRow = null) => {
  const channel = String(sessionRow?.replyChannel || "").trim();
  const to = String(sessionRow?.replyTo || "").trim();
  if (!channel || !to) return null;
  const agentId = getAgentIdFromSessionKey(getSessionRowKey(sessionRow));
  return {
    channel,
    to,
    ...(agentId ? { agentId } : {}),
  };
};
