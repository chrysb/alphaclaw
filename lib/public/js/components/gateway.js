import { h } from "preact";
import { useEffect, useMemo, useState } from "preact/hooks";
import htm from "htm";
import { UpdateActionButton } from "./update-action-button.js";
const html = htm.bind(h);

const formatDuration = (ms) => {
  const safeMs = Number(ms || 0);
  if (!Number.isFinite(safeMs) || safeMs <= 0) return "0s";
  const totalSeconds = Math.floor(safeMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (days > 0) return `${days}d ${hours % 24}h ${minutes}m ${seconds}s`;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
};

export const Gateway = ({
  status,
  restarting = false,
  onRestart,
  watchdogStatus = null,
  onOpenWatchdog,
  onRepair,
  repairing = false,
}) => {
  const [nowMs, setNowMs] = useState(() => Date.now());
  const isRunning = status === "running" && !restarting;
  const dotClass = isRunning
    ? "ac-status-dot ac-status-dot--healthy"
    : "w-2 h-2 rounded-full bg-yellow-500 animate-pulse";
  const watchdogHealth =
    watchdogStatus?.lifecycle === "crash_loop"
      ? "crash_loop"
      : watchdogStatus?.health;
  const watchdogDotClass =
    watchdogHealth === "healthy"
      ? "ac-status-dot ac-status-dot--healthy ac-status-dot--healthy-offset"
      : watchdogHealth === "degraded"
        ? "bg-yellow-500"
        : watchdogHealth === "unhealthy" || watchdogHealth === "crash_loop"
          ? "bg-red-500"
          : "bg-gray-500";
  const watchdogLabel =
    watchdogHealth === "unknown" ? "initializing" : watchdogHealth || "unknown";
  const isRepairInProgress = repairing || !!watchdogStatus?.operationInProgress;
  const showInspectButton = watchdogHealth === "degraded" && !!onOpenWatchdog;
  const showRepairButton =
    isRepairInProgress ||
    (watchdogStatus?.health === "degraded" && !onOpenWatchdog) ||
    watchdogStatus?.lifecycle === "crash_loop" ||
    watchdogStatus?.health === "unhealthy" ||
    watchdogStatus?.health === "crashed";
  const liveUptimeMs = useMemo(() => {
    const startedAtMs = watchdogStatus?.uptimeStartedAt
      ? Date.parse(watchdogStatus.uptimeStartedAt)
      : null;
    if (Number.isFinite(startedAtMs)) {
      return Math.max(0, nowMs - startedAtMs);
    }
    return watchdogStatus?.uptimeMs || 0;
  }, [watchdogStatus?.uptimeStartedAt, watchdogStatus?.uptimeMs, nowMs]);

  useEffect(() => {
    const id = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return html` <div class="bg-surface border border-border rounded-xl p-4">
    <div class="space-y-2">
      <div class="flex items-center justify-between gap-3">
        <div class="min-w-0 flex items-center gap-2 text-sm">
          <span class=${dotClass}></span>
          <span class="font-semibold">Gateway:</span>
          <span class="text-fg-muted"
            >${restarting ? "restarting..." : status || "checking..."}</span
          >
        </div>
        <div class="flex items-center gap-3 shrink-0">
          ${!restarting && isRunning
            ? html`
                <span class="text-xs text-fg-muted whitespace-nowrap"
                  >Uptime: ${formatDuration(liveUptimeMs)}</span
                >
              `
            : null}
          <${UpdateActionButton}
            onClick=${onRestart}
            disabled=${!status}
            loading=${restarting}
            warning=${false}
            idleLabel="Restart"
            loadingLabel="On it..."
          />
        </div>
      </div>
      <div class="flex items-center justify-between gap-3">
        ${onOpenWatchdog
          ? html`
              <button
                class="inline-flex items-center gap-2 text-sm hover:opacity-90"
                onclick=${onOpenWatchdog}
                title="Open Watchdog tab"
              >
                <span
                  class=${watchdogDotClass.startsWith("ac-status-dot")
                    ? watchdogDotClass
                    : `w-2 h-2 rounded-full ${watchdogDotClass}`}
                ></span>
                <span class="font-semibold">Watchdog:</span>
                <span class="text-fg-muted">${watchdogLabel}</span>
              </button>
            `
          : html`
              <div class="inline-flex items-center gap-2 text-sm">
                <span
                  class=${watchdogDotClass.startsWith("ac-status-dot")
                    ? watchdogDotClass
                    : `w-2 h-2 rounded-full ${watchdogDotClass}`}
                ></span>
                <span class="font-semibold">Watchdog:</span>
                <span class="text-fg-muted">${watchdogLabel}</span>
              </div>
            `}
        ${onRepair
          ? html`
              <div class="shrink-0 w-32 flex justify-end">
                ${showInspectButton
                  ? html`
                      <${UpdateActionButton}
                        onClick=${onOpenWatchdog}
                        warning=${false}
                        idleLabel="Inspect"
                        loadingLabel="Inspect"
                        className="w-full justify-center"
                      />
                    `
                  : showRepairButton
                    ? html`
                        <${UpdateActionButton}
                          onClick=${onRepair}
                          loading=${isRepairInProgress}
                          warning=${true}
                          idleLabel="Repair"
                          loadingLabel="Repairing..."
                          className="w-full justify-center"
                        />
                      `
                    : html`<span
                        class="inline-flex h-7 w-full"
                        aria-hidden="true"
                      ></span>`}
              </div>
            `
          : null}
      </div>
    </div>
  </div>`;
};
