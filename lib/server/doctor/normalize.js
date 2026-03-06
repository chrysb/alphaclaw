const {
  parseJsonSafe,
  parseJsonValueFromNoisyOutput,
} = require("../utils/json");
const {
  kDoctorCardStatus,
  kDoctorPriority,
  kDoctorMaxCardsPerRun,
} = require("./constants");

const kCandidateArrayKeys = ["cards", "findings", "issues", "recommendations"];
const kCandidateObjectKeys = [
  "result",
  "data",
  "output",
  "response",
  "message",
  "content",
  "text",
  "payload",
  "payloads",
  "body",
];

const toTrimmedString = (value) => String(value ?? "").trim();

const parseJsonCandidate = (value) => {
  if (value == null) return null;
  if (typeof value === "object") return value;
  if (typeof value !== "string") return null;
  const direct = parseJsonSafe(value, null, { trim: true });
  if (direct) return direct;
  const noisy = parseJsonValueFromNoisyOutput(value);
  if (noisy) return noisy;
  const fencedMatch = value.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (!fencedMatch) return null;
  return parseJsonSafe(fencedMatch[1], null, { trim: true });
};

const collectCandidatePayloads = (rootValue) => {
  const queue = [rootValue];
  const seen = new Set();
  const candidates = [];
  while (queue.length) {
    const currentValue = queue.shift();
    if (currentValue == null) continue;
    if (typeof currentValue === "string") {
      const parsedValue = parseJsonCandidate(currentValue);
      if (parsedValue && typeof parsedValue === "object") {
        queue.push(parsedValue);
      }
      continue;
    }
    if (typeof currentValue !== "object") continue;
    if (seen.has(currentValue)) continue;
    seen.add(currentValue);
    if (Array.isArray(currentValue)) {
      for (const item of currentValue) {
        if (item != null) queue.push(item);
      }
      continue;
    }
    candidates.push(currentValue);
    for (const key of kCandidateObjectKeys) {
      if (currentValue[key] != null) queue.push(currentValue[key]);
    }
  }
  return candidates;
};

const normalizePriority = (value) => {
  const normalized = toTrimmedString(value).toUpperCase();
  if (normalized === "P0" || normalized === "CRITICAL" || normalized === "HIGH") {
    return kDoctorPriority.P0;
  }
  if (normalized === "P1" || normalized === "MEDIUM" || normalized === "MODERATE") {
    return kDoctorPriority.P1;
  }
  if (normalized === "P2" || normalized === "LOW" || normalized === "NICE_TO_HAVE") {
    return kDoctorPriority.P2;
  }
  return kDoctorPriority.P2;
};

const normalizeCardStatus = (value) => {
  const normalized = toTrimmedString(value).toLowerCase();
  if (normalized === kDoctorCardStatus.fixed) return kDoctorCardStatus.fixed;
  if (normalized === kDoctorCardStatus.dismissed) return kDoctorCardStatus.dismissed;
  return kDoctorCardStatus.open;
};

const normalizeEvidence = (value) => {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (item == null) return null;
        if (typeof item === "string") {
          const text = toTrimmedString(item);
          return text ? { type: "text", text } : null;
        }
        if (typeof item === "object") return item;
        return { type: "text", text: String(item) };
      })
      .filter(Boolean);
  }
  if (typeof value === "string") {
    const text = toTrimmedString(value);
    return text ? [{ type: "text", text }] : [];
  }
  if (value && typeof value === "object") return [value];
  return [];
};

const normalizeTargetPaths = (value) => {
  const values = Array.isArray(value) ? value : value == null ? [] : [value];
  return Array.from(
    new Set(
      values
        .map((item) => toTrimmedString(item))
        .filter(Boolean),
    ),
  );
};

const buildFallbackFixPrompt = ({ title, recommendation, targetPaths }) => {
  const targetLine = targetPaths.length
    ? `Focus on these paths if relevant: ${targetPaths.join(", ")}.`
    : "Inspect the relevant workspace files before making changes.";
  return (
    `Please address this Doctor finding safely.\n\n` +
    `Finding: ${title}\n` +
    `Recommendation: ${recommendation}\n` +
    `${targetLine}\n` +
    `Preserve existing behavior unless the change clearly improves workspace guidance organization.`
  );
};

const normalizeDoctorCard = (cardValue, index) => {
  const title =
    toTrimmedString(cardValue?.title) ||
    toTrimmedString(cardValue?.headline) ||
    toTrimmedString(cardValue?.name) ||
    `Doctor recommendation ${index + 1}`;
  const summary =
    toTrimmedString(cardValue?.summary) ||
    toTrimmedString(cardValue?.description) ||
    toTrimmedString(cardValue?.detail) ||
    "";
  const recommendation =
    toTrimmedString(cardValue?.recommendation) ||
    toTrimmedString(cardValue?.recommendedAction) ||
    toTrimmedString(cardValue?.action) ||
    summary ||
    title;
  const targetPaths = normalizeTargetPaths(
    cardValue?.targetPaths ?? cardValue?.paths ?? cardValue?.files,
  );
  return {
    priority: normalizePriority(cardValue?.priority ?? cardValue?.severity),
    category: toTrimmedString(cardValue?.category) || "workspace",
    title,
    summary,
    recommendation,
    evidence: normalizeEvidence(cardValue?.evidence),
    targetPaths,
    fixPrompt:
      toTrimmedString(cardValue?.fixPrompt) ||
      toTrimmedString(cardValue?.fix_prompt) ||
      buildFallbackFixPrompt({ title, recommendation, targetPaths }),
    status: normalizeCardStatus(cardValue?.status),
  };
};

const extractCardPayload = (payload) => {
  if (!payload || typeof payload !== "object") return null;
  for (const key of kCandidateArrayKeys) {
    if (!Array.isArray(payload[key])) continue;
    return {
      summary:
        toTrimmedString(payload.summary) ||
        toTrimmedString(payload.overview) ||
        toTrimmedString(payload.assessment) ||
        "",
      cards: payload[key],
      rawPayload: payload,
    };
  }
  return null;
};

const normalizeDoctorResult = (rawOutput) => {
  const initialPayload = parseJsonCandidate(rawOutput);
  const payloadCandidates = collectCandidatePayloads(initialPayload || rawOutput);
  for (const candidate of payloadCandidates) {
    const extracted = extractCardPayload(candidate);
    if (!extracted) continue;
    const cards = extracted.cards
      .slice(0, kDoctorMaxCardsPerRun)
      .map((cardValue, index) => normalizeDoctorCard(cardValue, index));
    return {
      summary: extracted.summary,
      cards,
      rawPayload: extracted.rawPayload,
    };
  }
  throw new Error("Doctor response did not include a recognizable cards payload");
};

module.exports = {
  normalizePriority,
  normalizeCardStatus,
  normalizeDoctorResult,
  normalizeDoctorCard,
};
