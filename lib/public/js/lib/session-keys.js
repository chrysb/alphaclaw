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

const kSessionPriority = {
  destination: 0,
  other: 1,
};

export const getSessionPriority = (sessionRow = null) =>
  isDestinationSessionKey(getSessionRowKey(sessionRow))
    ? kSessionPriority.destination
    : kSessionPriority.other;

export const sortSessionsByPriority = (sessions = []) =>
  [...(Array.isArray(sessions) ? sessions : [])].sort((leftRow, rightRow) => {
    const priorityDiff = getSessionPriority(leftRow) - getSessionPriority(rightRow);
    if (priorityDiff !== 0) return priorityDiff;
    const updatedAtDiff =
      Number(rightRow?.updatedAt || 0) - Number(leftRow?.updatedAt || 0);
    if (updatedAtDiff !== 0) return updatedAtDiff;
    return getSessionRowKey(leftRow).localeCompare(getSessionRowKey(rightRow));
  });

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
