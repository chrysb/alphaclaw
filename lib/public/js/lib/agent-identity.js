const kNonEmojiPattern = /[A-Za-z0-9:]/;

export const sanitizeAgentEmoji = (rawEmoji) => {
  const trimmed = String(rawEmoji ?? "").trim();
  if (!trimmed) return "";
  if (kNonEmojiPattern.test(trimmed)) return "";
  return trimmed;
};
