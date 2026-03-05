const parseJsonSafe = (rawValue, fallbackValue = null, options = {}) => {
  const shouldTrim = options?.trim === true;
  const text = shouldTrim
    ? String(rawValue ?? "").trim()
    : String(rawValue ?? "");
  if (!text) return fallbackValue;
  try {
    return JSON.parse(text);
  } catch {
    return fallbackValue;
  }
};

const parseJsonObjectFromNoisyOutput = (rawValue) => {
  const text = String(rawValue ?? "");
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    return null;
  }
  try {
    return JSON.parse(text.slice(firstBrace, lastBrace + 1));
  } catch {
    return null;
  }
};

module.exports = {
  parseJsonSafe,
  parseJsonObjectFromNoisyOutput,
};
