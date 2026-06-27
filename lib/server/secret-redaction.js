const kSecretUnchangedValue = "__ALPHACLAW_SECRET_UNCHANGED__";
const kSensitiveKeyPattern = /(KEY|TOKEN|SECRET|PASSWORD|CREDENTIAL|ACCESS)/i;
const kCredentialSecretFields = ["key", "token", "access", "refresh", "secret"];

const isSensitiveKey = (key = "") =>
  kSensitiveKeyPattern.test(String(key || "").trim());

const isSecretUnchangedValue = (value) =>
  String(value || "") === kSecretUnchangedValue;

const redactValue = (key, value) => {
  const normalizedValue = String(value || "");
  const hasValue = normalizedValue.length > 0;
  const redacted = hasValue && isSensitiveKey(key);
  return {
    value: redacted ? kSecretUnchangedValue : normalizedValue,
    hasValue,
    redacted,
  };
};

const redactCredential = (credential = {}) => {
  const next = { ...credential };
  for (const field of kCredentialSecretFields) {
    const raw = String(credential?.[field] || "");
    if (!raw) continue;
    next[field] = kSecretUnchangedValue;
    next[`${field}HasValue`] = true;
    next[`${field}Redacted`] = true;
  }
  return next;
};

const resolveCredentialPlaceholders = (credential = {}, existing = {}) => {
  const next = { ...credential };
  for (const field of kCredentialSecretFields) {
    if (!isSecretUnchangedValue(next[field])) continue;
    next[field] = String(existing?.[field] || "");
  }
  return next;
};

module.exports = {
  kCredentialSecretFields,
  kSecretUnchangedValue,
  isSecretUnchangedValue,
  isSensitiveKey,
  redactCredential,
  redactValue,
  resolveCredentialPlaceholders,
};
