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

/** Matches server `parseChannelFromSessionKey` for icon routing when `channel` is absent (cached rows). */
export const parseChannelFromSessionKey = (sessionKey = "") => {
  const k = String(sessionKey || "");
  if (k.includes(":telegram:")) return "telegram";
  if (k.includes(":discord:")) return "discord";
  if (k.includes(":slack:")) return "slack";
  return "";
};

const getTopicIdsFromSessionKey = (sessionKey = "") => {
  const normalizedSessionKey = getNormalizedSessionKey(sessionKey);
  const topicMatch = normalizedSessionKey.match(
    /:telegram:group:([^:]+):topic:([^:]+)$/,
  );
  return {
    groupId: String(topicMatch?.[1] || "").trim(),
    topicId: String(topicMatch?.[2] || "").trim(),
  };
};

export const getSessionKind = (sessionKey = "") => {
  const normalizedSessionKey = getNormalizedSessionKey(sessionKey);
  if (!normalizedSessionKey) return "other";
  if (normalizedSessionKey === "main" || normalizedSessionKey.endsWith(":main")) {
    return "main";
  }
  if (/:telegram:group:([^:]+):topic:([^:]+)$/.test(normalizedSessionKey)) {
    return "topic";
  }
  if (normalizedSessionKey.includes(":slash:")) return "slash";
  if (normalizedSessionKey.includes(":subagent:")) return "subagent";
  if (/:direct:([^:]+)$/.test(normalizedSessionKey)) return "direct";
  return "other";
};

export const getSessionDisplayLabel = (sessionRow = null) => {
  const key = getSessionRowKey(sessionRow);
  const kind = getSessionKind(key);
  if (kind === "main") return "Main Thread";

  const doctorMatch = key.match(/(?:^|:)doctor:(\d+)$/);
  if (doctorMatch) return `Doctor Run #${doctorMatch[1]}`;
  if (/(?:^|:)doctor(?::|$)/.test(key)) return "Doctor Run";

  if (kind === "topic") {
    const { groupId, topicId } = getTopicIdsFromSessionKey(key);
    const topicName = String(sessionRow?.topicName || "").trim();
    const groupName = String(sessionRow?.groupName || "").trim();
    const topicLabel = topicName || (topicId ? `Topic ${topicId}` : "Topic");
    const groupLabel = groupName || groupId;
    return groupLabel ? `${topicLabel} - ${groupLabel}` : topicLabel;
  }

  if (kind === "direct") {
    const directMatch = key.match(/:direct:([^:]+)$/);
    const directTarget = String(directMatch?.[1] || "").trim();
    if (parseChannelFromSessionKey(key) === "telegram") {
      return "Direct message";
    }
    return directTarget ? `Direct ${directTarget}` : "Direct";
  }

  return key || "Session";
};

/** Channel id for platform icons; prefers API `channel`, else parses from key / replyChannel. */
export const getSessionChannelForIcon = (sessionRow = null) => {
  const fromRow = String(sessionRow?.channel || "").trim();
  if (fromRow) return fromRow;
  const fromReply = String(sessionRow?.replyChannel || "").trim();
  if (fromReply) return fromReply;
  return parseChannelFromSessionKey(getSessionRowKey(sessionRow));
};
