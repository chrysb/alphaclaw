import { h } from "https://esm.sh/preact";
import { useEffect, useMemo, useRef, useState } from "https://esm.sh/preact/hooks";
import htm from "https://esm.sh/htm";
import {
  fetchUsageSummary,
  fetchUsageSessions,
  fetchUsageSessionDetail,
} from "../lib/api.js";
import { readUiSettings, writeUiSettings } from "../lib/ui-settings.js";
import { PageHeader } from "./page-header.js";
import { ActionButton } from "./action-button.js";
import { SegmentedControl } from "./segmented-control.js";

const html = htm.bind(h);

const kColorPalette = [
  "#7dd3fc",
  "#22d3ee",
  "#34d399",
  "#fbbf24",
  "#fb7185",
  "#a78bfa",
  "#f472b6",
  "#60a5fa",
  "#4ade80",
  "#f97316",
];

const kTokenFormatter = new Intl.NumberFormat("en-US");
const kMoneyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 3,
});

const formatTokens = (value) => kTokenFormatter.format(Number(value || 0));
const formatUsd = (value) => kMoneyFormatter.format(Number(value || 0));
const formatCountLabel = (value, singular, plural) => {
  const count = Number(value || 0);
  const label = count === 1 ? singular : plural;
  return `${formatTokens(count)} ${label}`;
};

const formatDateTime = (value) => {
  if (!value) return "n/a";
  try {
    const d = new Date(Number(value));
    if (Number.isNaN(d.getTime())) return "n/a";
    const now = new Date();
    const isToday =
      d.getFullYear() === now.getFullYear()
      && d.getMonth() === now.getMonth()
      && d.getDate() === now.getDate();
    if (isToday) {
      return d.toLocaleTimeString();
    }
    return d.toLocaleString();
  } catch {
    return "n/a";
  }
};

const formatDuration = (value) => {
  const ms = Number(value || 0);
  if (!Number.isFinite(ms) || ms <= 0) return "0s";
  if (ms < 1000) return `${Math.round(ms)}ms`;
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes <= 0) return `${seconds}s`;
  return `${minutes}m ${seconds}s`;
};

const kBadgeToneClass = {
  cyan: "border-cyan-400/30 text-cyan-300 bg-cyan-400/10",
  blue: "border-blue-400/30 text-blue-300 bg-blue-400/10",
  purple: "border-purple-400/30 text-purple-300 bg-purple-400/10",
  gray: "border-gray-400/30 text-gray-400 bg-gray-400/10",
};

const SessionBadges = ({ session }) => {
  const labels = session?.labels;
  if (!Array.isArray(labels) || labels.length === 0) {
    const fallback = String(session?.sessionKey || session?.sessionId || "");
    return html`<span class="truncate">${fallback}</span>`;
  }
  return html`
    <span class="inline-flex items-center gap-1.5 flex-wrap">
      ${labels.map(
        (badge) => html`
          <span
            class=${`inline-flex items-center px-1.5 py-0.5 rounded border text-[11px] leading-tight ${kBadgeToneClass[badge.tone] || kBadgeToneClass.gray}`}
          >
            ${badge.label}
          </span>
        `,
      )}
    </span>
  `;
};

const toChartColor = (key) => {
  const raw = String(key || "");
  let hash = 0;
  for (let index = 0; index < raw.length; index += 1) {
    hash = ((hash << 5) - hash + raw.charCodeAt(index)) | 0;
  }
  return kColorPalette[Math.abs(hash) % kColorPalette.length];
};

const kRangeOptions = [
  { label: "7d", value: 7 },
  { label: "30d", value: 30 },
  { label: "90d", value: 90 },
];
const kDefaultUsageDays = 30;
const kDefaultUsageMetric = "tokens";
const kUsageDaysUiSettingKey = "usageDays";
const kUsageMetricUiSettingKey = "usageMetric";

const SummaryCard = ({ title, tokens, cost }) => html`
  <div class="bg-surface border border-border rounded-xl p-4">
    <h3 class="card-label text-xs">${title}</h3>
    <div class="text-lg font-semibold mt-1">
      ${formatTokens(tokens)}
      <span class="text-xs text-[var(--text-muted)] ml-1">tokens</span>
    </div>
    <div class="text-xs text-[var(--text-muted)] mt-1">${formatUsd(cost)}</div>
  </div>
`;

export const UsageTab = ({ sessionId = "" }) => {
  const [days, setDays] = useState(() => {
    const settings = readUiSettings();
    const parsedDays = Number.parseInt(
      String(settings[kUsageDaysUiSettingKey] ?? ""),
      10,
    );
    return kRangeOptions.some((option) => option.value === parsedDays)
      ? parsedDays
      : kDefaultUsageDays;
  });
  const [metric, setMetric] = useState(() => {
    const settings = readUiSettings();
    return settings[kUsageMetricUiSettingKey] === "cost"
      ? "cost"
      : kDefaultUsageMetric;
  });
  const [summary, setSummary] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [sessionDetailById, setSessionDetailById] = useState({});
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [loadingDetailById, setLoadingDetailById] = useState({});
  const [expandedSessionIds, setExpandedSessionIds] = useState(() =>
    sessionId ? [String(sessionId)] : [],
  );
  const [error, setError] = useState("");
  const overviewCanvasRef = useRef(null);
  const overviewChartRef = useRef(null);

  const loadSummary = async () => {
    setLoadingSummary(true);
    setError("");
    try {
      const data = await fetchUsageSummary(days);
      setSummary(data.summary || null);
    } catch (err) {
      setError(err.message || "Could not load usage summary");
    } finally {
      setLoadingSummary(false);
    }
  };

  const loadSessions = async () => {
    setLoadingSessions(true);
    try {
      const data = await fetchUsageSessions(100);
      setSessions(Array.isArray(data.sessions) ? data.sessions : []);
    } catch (err) {
      setError(err.message || "Could not load sessions");
    } finally {
      setLoadingSessions(false);
    }
  };

  const loadSessionDetail = async (selectedSessionId) => {
    const safeSessionId = String(selectedSessionId || "").trim();
    if (!safeSessionId) return;
    setLoadingDetailById((currentValue) => ({
      ...currentValue,
      [safeSessionId]: true,
    }));
    try {
      const detailPayload = await fetchUsageSessionDetail(safeSessionId);
      setSessionDetailById((currentValue) => ({
        ...currentValue,
        [safeSessionId]: detailPayload.detail || null,
      }));
    } catch (err) {
      setError(err.message || "Could not load session detail");
    } finally {
      setLoadingDetailById((currentValue) => ({
        ...currentValue,
        [safeSessionId]: false,
      }));
    }
  };

  useEffect(() => {
    loadSummary();
  }, [days]);

  useEffect(() => {
    const settings = readUiSettings();
    settings[kUsageDaysUiSettingKey] = days;
    settings[kUsageMetricUiSettingKey] = metric;
    writeUiSettings(settings);
  }, [days, metric]);

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    const safeSessionId = String(sessionId || "").trim();
    if (!safeSessionId) return;
    setExpandedSessionIds((currentValue) =>
      currentValue.includes(safeSessionId)
        ? currentValue
        : [...currentValue, safeSessionId],
    );
    if (!sessionDetailById[safeSessionId] && !loadingDetailById[safeSessionId]) {
      loadSessionDetail(safeSessionId);
    }
  }, [sessionId]);

  const periodSummary = useMemo(() => {
    const rows = Array.isArray(summary?.daily) ? summary.daily : [];
    const now = new Date();
    const dayKey = now.toISOString().slice(0, 10);
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
    const monthStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
    const zero = { tokens: 0, cost: 0 };
    return rows.reduce(
      (acc, row) => {
        const tokens = Number(row.totalTokens || 0);
        const cost = Number(row.totalCost || 0);
        if (String(row.date) === dayKey) {
          acc.today.tokens += tokens;
          acc.today.cost += cost;
        }
        if (String(row.date) >= weekStart) {
          acc.week.tokens += tokens;
          acc.week.cost += cost;
        }
        if (String(row.date) >= monthStart) {
          acc.month.tokens += tokens;
          acc.month.cost += cost;
        }
        return acc;
      },
      {
        today: { ...zero },
        week: { ...zero },
        month: { ...zero },
      },
    );
  }, [summary]);

  const overviewDatasets = useMemo(() => {
    const rows = Array.isArray(summary?.daily) ? summary.daily : [];
    const allModels = new Set();
    for (const dayRow of rows) {
      for (const modelRow of dayRow.models || []) {
        allModels.add(String(modelRow.model || "unknown"));
      }
    }
    const labels = rows.map((row) => String(row.date || ""));
    const datasets = Array.from(allModels).map((model) => {
      const values = rows.map((row) => {
        const found = (row.models || []).find((m) => String(m.model || "") === model);
        if (!found) return 0;
        return metric === "cost" ? Number(found.totalCost || 0) : Number(found.totalTokens || 0);
      });
      return {
        label: model,
        data: values,
        backgroundColor: toChartColor(model),
      };
    });
    return { labels, datasets };
  }, [summary, metric]);

  useEffect(() => {
    const canvas = overviewCanvasRef.current;
    const Chart = window.Chart;
    if (!canvas || !Chart) return;
    if (overviewChartRef.current) {
      overviewChartRef.current.destroy();
      overviewChartRef.current = null;
    }
    overviewChartRef.current = new Chart(canvas, {
      type: "bar",
      data: overviewDatasets,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        scales: {
          x: { stacked: true, ticks: { color: "rgba(156,163,175,1)" } },
          y: {
            stacked: true,
            ticks: {
              color: "rgba(156,163,175,1)",
              callback: (v) => (metric === "cost" ? `$${Number(v).toFixed(2)}` : formatTokens(v)),
            },
          },
        },
        plugins: {
          legend: {
            labels: { color: "rgba(209,213,219,1)", boxWidth: 10, boxHeight: 10 },
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const value = Number(context.parsed.y || 0);
                return metric === "cost"
                  ? `${context.dataset.label}: ${formatUsd(value)}`
                  : `${context.dataset.label}: ${formatTokens(value)} tokens`;
              },
            },
          },
        },
      },
    });
    return () => {
      if (overviewChartRef.current) {
        overviewChartRef.current.destroy();
        overviewChartRef.current = null;
      }
    };
  }, [overviewDatasets, metric]);

  const renderOverview = () => html`
    <div class="space-y-4">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        <${SummaryCard} title="Today" tokens=${periodSummary.today.tokens} cost=${periodSummary.today.cost} />
        <${SummaryCard} title="Last 7 days" tokens=${periodSummary.week.tokens} cost=${periodSummary.week.cost} />
        <${SummaryCard} title="Last 30 days" tokens=${periodSummary.month.tokens} cost=${periodSummary.month.cost} />
      </div>
      <div class="bg-surface border border-border rounded-xl p-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <h2 class="card-label text-xs">Daily ${metric === "tokens" ? "tokens" : "cost"} by model</h2>
          <div class="flex items-center gap-2">
            <${SegmentedControl}
              options=${kRangeOptions.map((o) => ({ label: o.label, value: o.value }))}
              value=${days}
              onChange=${setDays}
            />
            <${SegmentedControl}
              options=${[
                { label: "tokens", value: "tokens" },
                { label: "cost", value: "cost" },
              ]}
              value=${metric}
              onChange=${setMetric}
            />
          </div>
        </div>
        <div style=${{ height: "280px" }}>
          <canvas ref=${overviewCanvasRef}></canvas>
        </div>
      </div>
    </div>
  `;

  const renderSessionInlineDetail = (item) => {
    const itemSessionId = String(item.sessionId || "");
    const isExpanded = expandedSessionIds.includes(itemSessionId);
    if (!isExpanded) return null;
    const detail = sessionDetailById[itemSessionId];
    const loadingDetail = !!loadingDetailById[itemSessionId];
    if (loadingDetail) {
      return html`
        <div class="ac-history-body">
          <p class="text-xs text-gray-500">Loading session detail...</p>
        </div>
      `;
    }
    if (!detail) {
      return html`
        <div class="ac-history-body">
          <p class="text-xs text-gray-500">Session detail not available.</p>
        </div>
      `;
    }
    return html`
      <div class="ac-history-body space-y-3 border-0 pt-0 mt-0">
        <div class="mt-1.5">
          <p class="text-[11px] text-gray-500 mb-1">Model breakdown</p>
          ${(detail.modelBreakdown || []).length === 0
            ? html`<p class="text-xs text-gray-500">No model usage recorded.</p>`
            : html`
                <div class="space-y-1.5">
                  ${(detail.modelBreakdown || []).map(
                    (row) => html`
                      <div class="flex items-center justify-between gap-3 text-xs px-1 py-0.5 rounded hover:bg-white/5 transition-colors">
                        <span class="text-gray-300 truncate">${row.model || "unknown"}</span>
                        <span class="inline-flex items-center gap-3 text-gray-500 shrink-0">
                          <span>${formatTokens(row.totalTokens)} tok</span>
                          <span>${formatUsd(row.totalCost)}</span>
                          <span>${formatCountLabel(row.turnCount, "turn", "turns")}</span>
                        </span>
                      </div>
                    `,
                  )}
                </div>
              `}
        </div>
        <div>
          <p class="text-[11px] text-gray-500 mb-1">Tool usage</p>
          ${(detail.toolUsage || []).length === 0
            ? html`<p class="text-xs text-gray-500">No tool calls recorded.</p>`
            : html`
                <div class="space-y-1.5">
                  ${(detail.toolUsage || []).map(
                    (row) => html`
                      <div class="flex items-center justify-between gap-3 text-xs px-1 py-0.5 rounded hover:bg-white/5 transition-colors">
                        <span class="text-gray-300 truncate">${row.toolName}</span>
                        <span class="inline-flex items-center gap-3 text-gray-500 shrink-0">
                          <span>${formatCountLabel(row.callCount, "call", "calls")}</span>
                          <span>${(Number(row.errorRate || 0) * 100).toFixed(1)}% err</span>
                          <span>${formatDuration(row.avgDurationMs)}</span>
                        </span>
                      </div>
                    `,
                  )}
                </div>
              `}
        </div>
      </div>
    `;
  };

  const renderSessions = () => html`
    <div class="bg-surface border border-border rounded-xl p-4">
      <h2 class="card-label text-xs mb-3">Sessions</h2>
      <div class="ac-history-list">
        ${sessions.length === 0
          ? html`<p class="text-xs text-gray-500">
              ${loadingSessions ? "Loading sessions..." : "No sessions recorded yet."}
            </p>`
          : sessions.map(
              (item) => html`
                <details
                  class="ac-history-item"
                  open=${expandedSessionIds.includes(String(item.sessionId || ""))}
                  ontoggle=${(e) => {
                    const itemSessionId = String(item.sessionId || "");
                    const isOpen = !!e.currentTarget?.open;
                    if (isOpen) {
                      setExpandedSessionIds((currentValue) =>
                        currentValue.includes(itemSessionId)
                          ? currentValue
                          : [...currentValue, itemSessionId],
                      );
                      if (
                        !sessionDetailById[itemSessionId]
                        && !loadingDetailById[itemSessionId]
                      ) {
                        loadSessionDetail(itemSessionId);
                      }
                      return;
                    }
                    setExpandedSessionIds((currentValue) =>
                      currentValue.filter((value) => value !== itemSessionId),
                    );
                  }}
                >
                  <summary class="ac-history-summary hover:bg-white/5 transition-colors">
                    <div class="ac-history-summary-row">
                      <span class="inline-flex items-center gap-2 min-w-0">
                        <span class="ac-history-toggle shrink-0" aria-hidden="true">▸</span>
                        <${SessionBadges} session=${item} />
                      </span>
                      <span class="inline-flex items-center gap-3 shrink-0 text-xs text-gray-500">
                        <span>${formatTokens(item.totalTokens)} tok</span>
                        <span>${formatUsd(item.totalCost)}</span>
                        <span>${formatDateTime(item.lastActivityMs)}</span>
                      </span>
                    </div>
                  </summary>
                  ${renderSessionInlineDetail(item)}
                </details>
              `,
            )}
      </div>
    </div>
  `;

  return html`
    <div class="space-y-4">
      <${PageHeader}
        title="Usage"
        actions=${html`
          <${ActionButton}
            onClick=${loadSummary}
            loading=${loadingSummary}
            tone="secondary"
            size="sm"
            idleLabel="Refresh"
            loadingMode="inline"
          />
        `}
      />
      ${error
        ? html`<div class="text-xs text-red-300 bg-red-950/30 border border-red-900 rounded px-3 py-2">${error}</div>`
        : null}
      ${loadingSummary && !summary
        ? html`<div class="text-sm text-[var(--text-muted)]">Loading usage summary...</div>`
        : renderOverview()}
      ${renderSessions()}
    </div>
  `;
};
