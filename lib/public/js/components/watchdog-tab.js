import { h } from "https://esm.sh/preact";
import { useEffect, useRef, useState } from "https://esm.sh/preact/hooks";
import htm from "https://esm.sh/htm";
import {
  fetchWatchdogEvents,
  fetchWatchdogLogs,
  fetchWatchdogResources,
  fetchWatchdogSettings,
  updateWatchdogSettings,
  triggerWatchdogRepair,
} from "../lib/api.js";
import { usePolling } from "../hooks/usePolling.js";
import { Gateway } from "./gateway.js";
import { InfoTooltip } from "./info-tooltip.js";
import { ToggleSwitch } from "./toggle-switch.js";
import { showToast } from "./toast.js";

const html = htm.bind(h);

const formatBytes = (bytes) => {
  if (bytes == null) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(0)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

const barColor = (percent) => {
  if (percent == null) return "bg-gray-600";
  return "bg-cyan-400";
};

const ResourceBar = ({
  label,
  percent,
  detail,
  segments = null,
  expanded = false,
  onToggle = null,
}) => html`
  <div
    class=${onToggle ? "cursor-pointer group" : ""}
    onclick=${onToggle || undefined}
  >
    <span
      class=${`text-xs text-gray-400 ${onToggle ? "group-hover:text-gray-200 transition-colors" : ""}`}
      >${label}</span
    >
    <div
      class=${`h-0.5 w-full bg-white/15 rounded-full overflow-hidden mt-1.5 flex ${onToggle ? "group-hover:bg-white/10 transition-colors" : ""}`}
    >
      ${expanded && segments
        ? segments.map(
            (seg) => html`
              <div
                class="h-full"
                style=${{
                  width: `${Math.min(100, seg.percent ?? 0)}%`,
                  backgroundColor: seg.color,
                  transition:
                    "width 0.8s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.5s ease",
                }}
              ></div>
            `,
          )
        : html`
            <div
              class=${`h-full rounded-full ${barColor(percent)}`}
              style=${{
                width: `${Math.min(100, percent ?? 0)}%`,
                transition:
                  "width 0.8s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.5s ease",
              }}
            ></div>
          `}
    </div>
    <div class="flex flex-wrap items-center gap-x-3 mt-2.5">
      <span class="text-xs text-gray-500 font-mono flex-1">${detail}</span>
      ${expanded &&
      segments &&
      segments
        .filter((s) => s.label)
        .map(
          (seg) => html`
            <span
              class="inline-flex items-center gap-1 text-xs text-gray-500 font-mono"
            >
              <span
                class="inline-block w-1.5 h-1.5 rounded-full"
                style=${{ backgroundColor: seg.color }}
              ></span>
              ${seg.label}
            </span>
          `,
        )}
    </div>
  </div>
`;

const getIncidentStatusTone = (event) => {
  const eventType = String(event?.eventType || "")
    .trim()
    .toLowerCase();
  const status = String(event?.status || "")
    .trim()
    .toLowerCase();
  if (status === "failed") {
    return {
      dotClass: "bg-red-500/90",
      label: "Failed",
    };
  }
  if (status === "ok" && eventType === "health_check") {
    return {
      dotClass: "bg-green-500/90",
      label: "Healthy",
    };
  }
  if (status === "warn" || status === "warning") {
    return {
      dotClass: "bg-yellow-400/90",
      label: "Warning",
    };
  }
  return {
    dotClass: "bg-gray-500/70",
    label: "Unknown",
  };
};

export const WatchdogTab = ({
  gatewayStatus = null,
  openclawVersion = null,
  watchdogStatus = null,
  onRefreshStatuses = () => {},
  restartingGateway = false,
  onRestartGateway,
  restartSignal = 0,
}) => {
  const eventsPoll = usePolling(() => fetchWatchdogEvents(20), 15000);
  const resourcesPoll = usePolling(() => fetchWatchdogResources(), 5000);
  const [memoryExpanded, setMemoryExpanded] = useState(false);
  const [settings, setSettings] = useState({
    autoRepair: false,
    notificationsEnabled: true,
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [repairing, setRepairing] = useState(false);
  const [logs, setLogs] = useState("");
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [stickToBottom, setStickToBottom] = useState(true);
  const logsRef = useRef(null);

  const currentWatchdogStatus = watchdogStatus || {};
  const events = eventsPoll.data?.events || [];
  const isRepairInProgress =
    repairing || !!currentWatchdogStatus?.operationInProgress;

  useEffect(() => {
    let active = true;
    const loadSettings = async () => {
      try {
        const data = await fetchWatchdogSettings();
        if (!active) return;
        setSettings(
          data.settings || {
            autoRepair: false,
            notificationsEnabled: true,
          },
        );
      } catch (err) {
        if (!active) return;
        showToast(err.message || "Could not load watchdog settings", "error");
      }
    };
    loadSettings();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    let timer = null;
    const pollLogs = async () => {
      try {
        const text = await fetchWatchdogLogs(65536);
        if (!active) return;
        setLogs(text || "");
        setLoadingLogs(false);
      } catch (err) {
        if (!active) return;
        setLoadingLogs(false);
      }
      if (!active) return;
      timer = setTimeout(pollLogs, 3000);
    };
    pollLogs();
    return () => {
      active = false;
      if (timer) clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    const el = logsRef.current;
    if (!el || !stickToBottom) return;
    el.scrollTop = el.scrollHeight;
  }, [logs, stickToBottom]);

  useEffect(() => {
    if (!restartSignal) return;
    onRefreshStatuses();
    eventsPoll.refresh();
    const t1 = setTimeout(() => {
      onRefreshStatuses();
      eventsPoll.refresh();
    }, 1200);
    const t2 = setTimeout(() => {
      onRefreshStatuses();
      eventsPoll.refresh();
    }, 3500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [restartSignal, onRefreshStatuses, eventsPoll.refresh]);

  const onToggleAutoRepair = async (nextValue) => {
    if (savingSettings) return;
    setSavingSettings(true);
    try {
      const data = await updateWatchdogSettings({ autoRepair: !!nextValue });
      setSettings(
        data.settings || {
          ...settings,
          autoRepair: !!nextValue,
        },
      );
      onRefreshStatuses();
      showToast(`Auto-repair ${nextValue ? "enabled" : "disabled"}`, "success");
    } catch (err) {
      showToast(err.message || "Could not update auto-repair", "error");
    } finally {
      setSavingSettings(false);
    }
  };

  const onToggleNotifications = async (nextValue) => {
    if (savingSettings) return;
    setSavingSettings(true);
    try {
      const data = await updateWatchdogSettings({
        notificationsEnabled: !!nextValue,
      });
      setSettings(
        data.settings || {
          ...settings,
          notificationsEnabled: !!nextValue,
        },
      );
      onRefreshStatuses();
      showToast(
        `Notifications ${nextValue ? "enabled" : "disabled"}`,
        "success",
      );
    } catch (err) {
      showToast(err.message || "Could not update notifications", "error");
    } finally {
      setSavingSettings(false);
    }
  };

  const onRepair = async () => {
    if (isRepairInProgress) return;
    setRepairing(true);
    try {
      const data = await triggerWatchdogRepair();
      if (!data.ok) throw new Error(data.error || "Repair failed");
      showToast("Repair triggered", "success");
      setTimeout(() => {
        onRefreshStatuses();
        eventsPoll.refresh();
      }, 800);
    } catch (err) {
      showToast(err.message || "Could not run repair", "error");
    } finally {
      setRepairing(false);
    }
  };

  return html`
    <div class="space-y-4">
      <${Gateway}
        status=${gatewayStatus}
        openclawVersion=${openclawVersion}
        restarting=${restartingGateway}
        onRestart=${onRestartGateway}
        watchdogStatus=${currentWatchdogStatus}
        onRepair=${onRepair}
        repairing=${isRepairInProgress}
      />

      ${(() => {
        const r = resourcesPoll.data?.resources;
        if (!r) return null;
        return html`
          <div class="bg-surface border border-border rounded-xl p-4">
            ${memoryExpanded
              ? html`
                  <${ResourceBar}
                    label="Memory"
                    detail=${`${formatBytes(r.memory?.usedBytes)} / ${formatBytes(r.memory?.totalBytes)}`}
                    percent=${r.memory?.percent}
                    expanded=${true}
                    onToggle=${() => setMemoryExpanded(false)}
                    segments=${(() => {
                      const p = r.processes;
                      const total = r.memory?.totalBytes;
                      const used = r.memory?.usedBytes;
                      if (!p || !total || !used) return null;
                      const segs = [];
                      let tracked = 0;
                      if (p.gateway?.rssBytes != null) {
                        tracked += p.gateway.rssBytes;
                        segs.push({
                          percent: (p.gateway.rssBytes / total) * 100,
                          color: "#22d3ee",
                          label: `Gateway ${formatBytes(p.gateway.rssBytes)}`,
                        });
                      }
                      if (p.alphaclaw?.rssBytes != null) {
                        tracked += p.alphaclaw.rssBytes;
                        segs.push({
                          percent: (p.alphaclaw.rssBytes / total) * 100,
                          color: "#a78bfa",
                          label: `AlphaClaw ${formatBytes(p.alphaclaw.rssBytes)}`,
                        });
                      }
                      const other = Math.max(0, used - tracked);
                      if (other > 0) {
                        segs.push({
                          percent: (other / total) * 100,
                          color: "#4b5563",
                          label: `Other ${formatBytes(other)}`,
                        });
                      }
                      return segs.length ? segs : null;
                    })()}
                  />
                `
              : html`
                  <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <${ResourceBar}
                      label="Memory"
                      percent=${r.memory?.percent}
                      detail=${`${formatBytes(r.memory?.usedBytes)} / ${formatBytes(r.memory?.totalBytes)}`}
                      onToggle=${() => setMemoryExpanded(true)}
                    />
                    <${ResourceBar}
                      label=${`Disk${r.disk?.path ? ` (${r.disk.path})` : ""}`}
                      percent=${r.disk?.percent}
                      detail=${`${formatBytes(r.disk?.usedBytes)} / ${formatBytes(r.disk?.totalBytes)}`}
                    />
                    <${ResourceBar}
                      label=${`CPU${r.cpu?.cores ? ` (${r.cpu.cores} vCPU)` : ""}`}
                      percent=${r.cpu?.percent}
                      detail=${r.cpu?.percent != null
                        ? `${r.cpu.percent}%`
                        : "—"}
                    />
                  </div>
                `}
          </div>
        `;
      })()}

      <div class="bg-surface border border-border rounded-xl p-4">
        <div class="flex items-center justify-between gap-3">
          <div class="inline-flex items-center gap-2 text-xs text-gray-400">
            <span>Auto-repair</span>
            <${InfoTooltip}
              text="Automatically runs OpenClaw doctor repair when watchdog detects gateway health failures or crash loops."
            />
          </div>
          <${ToggleSwitch}
            checked=${!!settings.autoRepair}
            disabled=${savingSettings}
            onChange=${onToggleAutoRepair}
            label=""
          />
        </div>
        <div class="flex items-center justify-between gap-3 mt-3">
          <div class="inline-flex items-center gap-2 text-xs text-gray-400">
            <span>Notifications</span>
            <${InfoTooltip}
              text="Sends channel notices for watchdog alerts and auto-repair outcomes."
            />
          </div>
          <${ToggleSwitch}
            checked=${!!settings.notificationsEnabled}
            disabled=${savingSettings}
            onChange=${onToggleNotifications}
            label=""
          />
        </div>
      </div>

      <div class="bg-surface border border-border rounded-xl p-4">
        <div class="flex items-center justify-between gap-2 mb-3">
          <h2 class="card-label">Logs</h2>
          <label class="inline-flex items-center gap-2 text-xs text-gray-400">
            <input
              type="checkbox"
              checked=${stickToBottom}
              onchange=${(e) => setStickToBottom(!!e.target.checked)}
            />
            Stick to bottom
          </label>
        </div>
        <pre
          ref=${logsRef}
          class="bg-black/40 border border-border rounded-lg p-3 h-72 overflow-auto text-xs text-gray-300 whitespace-pre-wrap break-words"
        >
${loadingLogs ? "Loading logs..." : logs || "No logs yet."}</pre
        >
      </div>

      <div class="bg-surface border border-border rounded-xl p-4">
        <div class="flex items-center justify-between gap-2 mb-3">
          <h2 class="card-label">Recent incidents</h2>
          <button
            class="text-xs text-gray-400 hover:text-gray-200"
            onclick=${() => eventsPoll.refresh()}
          >
            Refresh
          </button>
        </div>
        <div class="ac-history-list">
          ${events.length === 0 &&
          html`<p class="text-xs text-gray-500">No incidents recorded.</p>`}
          ${events.map((event) => {
            const tone = getIncidentStatusTone(event);
            return html`
              <details class="ac-history-item">
                <summary class="ac-history-summary">
                  <div class="ac-history-summary-row">
                    <span class="inline-flex items-center gap-2 min-w-0">
                      <span
                        class="ac-history-toggle shrink-0"
                        aria-hidden="true"
                        >▸</span
                      >
                      <span class="truncate">
                        ${event.createdAt || ""} · ${event.eventType || "event"}
                        · ${event.status || "unknown"}
                      </span>
                    </span>
                    <span
                      class=${`h-2.5 w-2.5 shrink-0 rounded-full ${tone.dotClass}`}
                      title=${tone.label}
                      aria-label=${tone.label}
                    ></span>
                  </div>
                </summary>
                <div class="ac-history-body text-xs text-gray-400">
                  <div>Source: ${event.source || "unknown"}</div>
                  <pre
                    class="mt-2 bg-black/30 rounded p-2 whitespace-pre-wrap break-words"
                  >
${typeof event.details === "string"
                      ? event.details
                      : JSON.stringify(event.details || {}, null, 2)}</pre
                  >
                </div>
              </details>
            `;
          })}
        </div>
      </div>
    </div>
  `;
};
