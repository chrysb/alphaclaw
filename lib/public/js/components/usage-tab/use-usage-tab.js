import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "https://esm.sh/preact/hooks";
import {
  fetchUsageSessionDetail,
  fetchUsageSessions,
  fetchUsageSummary,
} from "../../lib/api.js";
import { formatInteger, formatUsd } from "../../lib/format.js";
import { readUiSettings, writeUiSettings } from "../../lib/ui-settings.js";
import {
  kDefaultUsageDays,
  kDefaultUsageMetric,
  kUsageDaysUiSettingKey,
  kUsageMetricUiSettingKey,
} from "./constants.js";
import { toChartColor, toLocalDayKey } from "./formatters.js";

export const useUsageTab = ({ sessionId = "" }) => {
  const [days, setDays] = useState(() => {
    const settings = readUiSettings();
    const parsedDays = Number.parseInt(
      String(settings[kUsageDaysUiSettingKey] ?? ""),
      10,
    );
    return [7, 30, 90].includes(parsedDays) ? parsedDays : kDefaultUsageDays;
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

  const loadSummary = useCallback(async () => {
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
  }, [days]);

  const loadSessions = useCallback(async () => {
    setLoadingSessions(true);
    try {
      const data = await fetchUsageSessions(100);
      setSessions(Array.isArray(data.sessions) ? data.sessions : []);
    } catch (err) {
      setError(err.message || "Could not load sessions");
    } finally {
      setLoadingSessions(false);
    }
  }, []);

  const loadSessionDetail = useCallback(async (selectedSessionId) => {
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
  }, []);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  useEffect(() => {
    const settings = readUiSettings();
    settings[kUsageDaysUiSettingKey] = days;
    settings[kUsageMetricUiSettingKey] = metric;
    writeUiSettings(settings);
  }, [days, metric]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  useEffect(() => {
    const safeSessionId = String(sessionId || "").trim();
    if (!safeSessionId) return;
    setExpandedSessionIds((currentValue) =>
      currentValue.includes(safeSessionId)
        ? currentValue
        : [...currentValue, safeSessionId],
    );
    if (
      !sessionDetailById[safeSessionId] &&
      !loadingDetailById[safeSessionId]
    ) {
      loadSessionDetail(safeSessionId);
    }
  }, [sessionId, sessionDetailById, loadingDetailById, loadSessionDetail]);

  const periodSummary = useMemo(() => {
    const rows = Array.isArray(summary?.daily) ? summary.daily : [];
    const now = new Date();
    const dayKey = toLocalDayKey(now);
    const weekStart = toLocalDayKey(
      new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
    );
    const monthStart = toLocalDayKey(
      new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
    );
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
    const datasets = Array.from(allModels).map((model) => ({
      label: model,
      data: rows.map((row) => {
        const found = (row.models || []).find(
          (m) => String(m.model || "") === model,
        );
        if (!found) return 0;
        return metric === "cost"
          ? Number(found.totalCost || 0)
          : Number(found.totalTokens || 0);
      }),
      backgroundColor: toChartColor(model),
    }));
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
              callback: (v) =>
                metric === "cost"
                  ? `$${Number(v).toFixed(2)}`
                  : formatInteger(v),
            },
          },
        },
        plugins: {
          legend: {
            labels: {
              color: "rgba(209,213,219,1)",
              boxWidth: 10,
              boxHeight: 10,
            },
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const value = Number(context.parsed.y || 0);
                return metric === "cost"
                  ? `${context.dataset.label}: ${formatUsd(value)}`
                  : `${context.dataset.label}: ${formatInteger(value)} tokens`;
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

  return {
    state: {
      days,
      metric,
      summary,
      sessions,
      sessionDetailById,
      loadingSummary,
      loadingSessions,
      loadingDetailById,
      expandedSessionIds,
      error,
      periodSummary,
      overviewCanvasRef,
    },
    actions: {
      setDays,
      setMetric,
      loadSummary,
      loadSessionDetail,
      setExpandedSessionIds,
    },
  };
};
