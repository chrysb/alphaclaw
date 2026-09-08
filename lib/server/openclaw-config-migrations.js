const isRecord = (value) =>
  !!value && typeof value === "object" && !Array.isArray(value);

const kLegacySessionVisibility = "tree";
const kLegacySubagentSpawnDepth = 1;

const parseStreamingMode = (value) => {
  if (typeof value === "boolean") return value ? "partial" : "off";
  const normalized = String(value || "").trim().toLowerCase();
  return ["off", "partial", "block", "progress"].includes(normalized)
    ? normalized
    : null;
};

const migrateLegacyTelegramStreamingEntry = (entry) => {
  if (!isRecord(entry)) return false;

  const legacyStreaming = entry.streaming;
  const hasLegacyStreaming =
    typeof legacyStreaming === "boolean" || typeof legacyStreaming === "string";
  const hasLegacyFields =
    entry.streamMode !== undefined ||
    entry.chunkMode !== undefined ||
    entry.blockStreaming !== undefined ||
    entry.blockStreamingCoalesce !== undefined ||
    entry.draftChunk !== undefined;
  if (!hasLegacyStreaming && !hasLegacyFields) return false;

  const streaming = isRecord(legacyStreaming) ? { ...legacyStreaming } : {};
  const resolvedMode =
    parseStreamingMode(isRecord(legacyStreaming) ? legacyStreaming.mode : legacyStreaming) ||
    parseStreamingMode(entry.streamMode) ||
    "partial";
  if (streaming.mode === undefined) streaming.mode = resolvedMode;

  if (entry.chunkMode !== undefined && streaming.chunkMode === undefined) {
    streaming.chunkMode = entry.chunkMode;
  }
  if (entry.draftChunk !== undefined) {
    const preview = isRecord(streaming.preview) ? { ...streaming.preview } : {};
    if (preview.chunk === undefined) preview.chunk = entry.draftChunk;
    streaming.preview = preview;
  }
  if (entry.blockStreaming !== undefined || entry.blockStreamingCoalesce !== undefined) {
    const block = isRecord(streaming.block) ? { ...streaming.block } : {};
    if (entry.blockStreaming !== undefined && block.enabled === undefined) {
      block.enabled = entry.blockStreaming;
    }
    if (entry.blockStreamingCoalesce !== undefined && block.coalesce === undefined) {
      block.coalesce = entry.blockStreamingCoalesce;
    }
    streaming.block = block;
  }

  entry.streaming = streaming;
  delete entry.streamMode;
  delete entry.chunkMode;
  delete entry.blockStreaming;
  delete entry.blockStreamingCoalesce;
  delete entry.draftChunk;
  return true;
};

const migrateLegacyTelegramStreamingConfig = (cfg = {}) => {
  const telegram = cfg.channels?.telegram;
  if (!isRecord(telegram)) return false;

  let changed = migrateLegacyTelegramStreamingEntry(telegram);
  if (isRecord(telegram.accounts)) {
    for (const account of Object.values(telegram.accounts)) {
      if (migrateLegacyTelegramStreamingEntry(account)) changed = true;
    }
  }
  return changed;
};

const ensureLegacyCompatibilityDefaults = (cfg = {}) => {
  let changed = false;

  if (!isRecord(cfg.tools)) {
    cfg.tools = {};
    changed = true;
  }
  if (!isRecord(cfg.tools.sessions)) {
    cfg.tools.sessions = {};
    changed = true;
  }
  if (cfg.tools.sessions.visibility === undefined) {
    cfg.tools.sessions.visibility = kLegacySessionVisibility;
    changed = true;
  }
  if (cfg.tools.swarm === undefined) {
    cfg.tools.swarm = false;
    changed = true;
  }

  if (!isRecord(cfg.gateway)) {
    cfg.gateway = {};
    changed = true;
  }
  if (!isRecord(cfg.gateway.cliAgents)) {
    cfg.gateway.cliAgents = {};
    changed = true;
  }
  if (cfg.gateway.cliAgents.enabled === undefined) {
    cfg.gateway.cliAgents.enabled = false;
    changed = true;
  }

  if (!isRecord(cfg.agents)) {
    cfg.agents = {};
    changed = true;
  }
  if (!isRecord(cfg.agents.defaults)) {
    cfg.agents.defaults = {};
    changed = true;
  }
  if (!isRecord(cfg.agents.defaults.subagents)) {
    cfg.agents.defaults.subagents = {};
    changed = true;
  }
  if (cfg.agents.defaults.subagents.maxSpawnDepth === undefined) {
    cfg.agents.defaults.subagents.maxSpawnDepth = kLegacySubagentSpawnDepth;
    changed = true;
  }

  return changed;
};

module.exports = {
  ensureLegacyCompatibilityDefaults,
  migrateLegacyTelegramStreamingConfig,
  migrateLegacyTelegramStreamingEntry,
};
