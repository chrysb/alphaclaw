const normalizeAccountId = (value) => String(value || "").trim() || "default";

const hasScopedBindingFields = (match = {}) =>
  !!match.peer ||
  !!match.parentPeer ||
  !!String(match.guildId || "").trim() ||
  !!String(match.teamId || "").trim() ||
  (Array.isArray(match.roles) && match.roles.length > 0);

module.exports = {
  normalizeAccountId,
  hasScopedBindingFields,
};
