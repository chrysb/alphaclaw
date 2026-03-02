const topicRegistry = require("../topic-registry");

const kSummaryCacheTtlMs = 60 * 1000;

const parsePositiveInt = (value, fallbackValue) => {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallbackValue;
};

const createSummaryCache = () => new Map();

// Parse "agent:main:telegram:group:-123:topic:42" into structured labels.
const parseSessionLabels = (sessionKey) => {
  const raw = String(sessionKey || "").trim();
  if (!raw) return null;
  const parts = raw.split(":");
  const labels = [];

  if (parts[0] === "agent" && parts[1]) {
    labels.push({
      label: parts[1].charAt(0).toUpperCase() + parts[1].slice(1),
      tone: "cyan",
    });
  }

  const channelIndex = parts.indexOf("telegram");
  if (channelIndex !== -1 && parts[channelIndex + 1]) {
    const channelType = parts[channelIndex + 1];
    if (channelType === "direct") {
      labels.push({ label: "Telegram Direct", tone: "blue" });
    } else if (channelType === "group") {
      const groupId = parts[channelIndex + 2] || "";
      let groupName = null;
      let groupEntry = null;
      try {
        groupEntry = topicRegistry.getGroup(groupId);
        groupName = groupEntry?.name || null;
      } catch {}
      labels.push({
        label: groupName || `Group ${groupId}`,
        tone: "purple",
      });
      const topicIndex = parts.indexOf("topic", channelIndex);
      if (topicIndex !== -1 && parts[topicIndex + 1]) {
        const topicId = parts[topicIndex + 1];
        const topicName = groupEntry?.topics?.[topicId]?.name || null;
        labels.push({
          label: topicName || `Topic ${topicId}`,
          tone: "gray",
        });
      }
    } else {
      labels.push({
        label: `Telegram ${channelType.charAt(0).toUpperCase() + channelType.slice(1)}`,
        tone: "blue",
      });
    }
  }

  return labels.length > 0 ? labels : null;
};

const enrichSessionLabels = (session) => ({
  ...session,
  labels: parseSessionLabels(session.sessionKey || session.sessionId),
});

const registerUsageRoutes = ({
  app,
  requireAuth,
  getDailySummary,
  getSessionsList,
  getSessionDetail,
  getSessionTimeSeries,
}) => {
  const summaryCache = createSummaryCache();

  app.get("/api/usage/summary", requireAuth, (req, res) => {
    try {
      const days = parsePositiveInt(req.query.days, 30);
      const cacheKey = String(days);
      const cached = summaryCache.get(cacheKey);
      const now = Date.now();
      if (cached && now - cached.cachedAt <= kSummaryCacheTtlMs) {
        res.json({ ok: true, ...cached.payload, cached: true });
        return;
      }
      const summary = getDailySummary({ days });
      const payload = { summary };
      summaryCache.set(cacheKey, { payload, cachedAt: now });
      res.json({ ok: true, ...payload, cached: false });
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  app.get("/api/usage/sessions", requireAuth, (req, res) => {
    try {
      const limit = parsePositiveInt(req.query.limit, 50);
      const sessions = getSessionsList({ limit }).map(enrichSessionLabels);
      res.json({ ok: true, sessions });
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  app.get("/api/usage/sessions/:id", requireAuth, (req, res) => {
    try {
      const sessionId = String(req.params.id || "").trim();
      const detail = getSessionDetail({ sessionId });
      if (!detail) {
        res.status(404).json({ ok: false, error: "Session not found" });
        return;
      }
      res.json({ ok: true, detail: enrichSessionLabels(detail) });
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  app.get("/api/usage/sessions/:id/timeseries", requireAuth, (req, res) => {
    try {
      const sessionId = String(req.params.id || "").trim();
      const maxPoints = parsePositiveInt(req.query.maxPoints, 100);
      const series = getSessionTimeSeries({ sessionId, maxPoints });
      res.json({ ok: true, series });
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });
};

module.exports = { registerUsageRoutes };
