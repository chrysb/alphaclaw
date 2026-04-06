import { h } from "preact";
import { useEffect, useMemo, useState } from "preact/hooks";
import htm from "htm";
import { fetchOpenclawVersion, updateOpenclaw } from "../lib/api.js";
import { UpdateActionButton } from "./update-action-button.js";
import { ConfirmDialog } from "./confirm-dialog.js";
import { showToast } from "./toast.js";
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

const VersionRow = ({
  label,
  currentVersion,
  fetchVersion,
  applyUpdate,
  updateInProgress = false,
  updateLoadingLabel = "Updating...",
  onActionComplete = () => {},
}) => {
  const [checking, setChecking] = useState(false);
  const [version, setVersion] = useState(currentVersion || null);
  const [latestVersion, setLatestVersion] = useState(null);
  const [hasUpdate, setHasUpdate] = useState(false);
  const [error, setError] = useState("");
  const [hasViewedChangelog, setHasViewedChangelog] = useState(false);
  const [confirmWithoutChangelogOpen, setConfirmWithoutChangelogOpen] =
    useState(false);
  const simulateUpdate = (() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get("simulateUpdate") === "1";
    } catch {
      return false;
    }
  })();
  const simulatedVersion = (() => {
    if (!simulateUpdate) return null;
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get("simulateVersion") || "v0.0.0-preview";
    } catch {
      return "v0.0.0-preview";
    }
  })();
  const effectiveHasUpdate = simulateUpdate || hasUpdate;
  const effectiveLatestVersion = simulatedVersion || latestVersion;
  const isUpdateActionActive = updateInProgress || effectiveHasUpdate;
  const updateIdleLabel = effectiveLatestVersion
    ? `Update to ${effectiveLatestVersion}`
    : "Update";
  const changelogUrl = "https://github.com/openclaw/openclaw/tags";
  const showMobileUpdateRow = effectiveHasUpdate && effectiveLatestVersion;

  useEffect(() => {
    setVersion(currentVersion || null);
  }, [currentVersion]);

  useEffect(() => {
    let active = true;
    const load = async (refresh = false) => {
      try {
        const data = await fetchVersion(refresh);
        if (!active) return;
        setVersion(data.currentVersion || currentVersion || null);
        setLatestVersion(data.latestVersion || null);
        setHasUpdate(!!data.hasUpdate);
        setError(data.ok ? "" : data.error || "");
      } catch (err) {
        if (!active) return;
        setError(err.message || "Could not check updates");
      }
    };
    load(false);
    return () => {
      active = false;
    };
  }, [currentVersion, fetchVersion]);

  useEffect(() => {
    if (updateInProgress) return () => {};
    let active = true;
    const timeoutId = setTimeout(async () => {
      try {
        const data = await fetchVersion(true);
        if (!active) return;
        setVersion(data.currentVersion || currentVersion || null);
        setLatestVersion(data.latestVersion || null);
        setHasUpdate(!!data.hasUpdate);
        setError(data.ok ? "" : data.error || "");
      } catch {}
    }, 1200);
    return () => {
      active = false;
      clearTimeout(timeoutId);
    };
  }, [updateInProgress, currentVersion, fetchVersion]);

  useEffect(() => {
    if (!effectiveHasUpdate || !effectiveLatestVersion) {
      setHasViewedChangelog(false);
      return;
    }
    setHasViewedChangelog(false);
  }, [effectiveHasUpdate, effectiveLatestVersion]);

  const runAction = async () => {
    const isUpdateAction = !!effectiveHasUpdate;
    const busy = isUpdateActionActive ? checking || updateInProgress : checking;
    if (busy) return;
    setChecking(true);
    setError("");
    try {
      const data = isUpdateAction
        ? await applyUpdate()
        : await fetchVersion(true);
      setVersion(data.currentVersion || version);
      setLatestVersion(data.latestVersion || null);
      setHasUpdate(!!data.hasUpdate);
      setError(data.ok ? "" : data.error || "");
      if (isUpdateAction) {
        if (!data.ok) {
          showToast(data.error || `${label} update failed`, "error");
        } else if (data.updated || data.restarting) {
          showToast(
            data.restarting
              ? `${label} updated — restarting...`
              : `Updated ${label} to ${data.currentVersion}`,
            "success",
          );
        } else {
          showToast(`Already at latest ${label} version`, "success");
        }
      } else if (data.hasUpdate && data.latestVersion) {
        showToast(
          `${label} update available: ${data.latestVersion}`,
          "warning",
        );
      } else {
        showToast(`${label} is up to date`, "success");
      }
      await onActionComplete({
        type: isUpdateAction ? "update" : "check",
        ok: !!data?.ok,
        result: data,
      });
    } catch (err) {
      setError(
        err.message ||
          (isUpdateAction
            ? `Could not update ${label}`
            : "Could not check updates"),
      );
      showToast(
        isUpdateAction
          ? `Could not update ${label}`
          : "Could not check updates",
        "error",
      );
      await onActionComplete({
        type: isUpdateAction ? "update" : "check",
        ok: false,
        error: err,
      });
    } finally {
      setChecking(false);
    }
  };

  const handleAction = () => {
    const busy = isUpdateActionActive ? checking || updateInProgress : checking;
    if (busy) return;
    if (effectiveHasUpdate && effectiveLatestVersion && !hasViewedChangelog) {
      setConfirmWithoutChangelogOpen(true);
      return;
    }
    runAction();
  };

  const handleConfirmWithoutChangelog = () => {
    setConfirmWithoutChangelogOpen(false);
    runAction();
  };

  const updateButtonLoading = isUpdateActionActive
    ? checking || updateInProgress
    : checking;

  return html`
    <div class="flex items-center justify-between gap-3">
      <div class="min-w-0">
        <p class="text-xs text-body truncate">
          <span class="text-fg-muted">${label}</span>${" "}${version
            ? `${version}`
            : "..."}
        </p>
        ${error &&
        effectiveHasUpdate &&
        html`<div
          class="mt-1 text-xs text-status-error bg-status-error-bg border border-status-error-border rounded-lg px-2 py-1"
        >
          ${error}
        </div>`}
      </div>
      <div class="flex items-center gap-3 shrink-0">
        ${effectiveHasUpdate &&
        effectiveLatestVersion &&
        html`
          <a
            href=${changelogUrl}
            target="_blank"
            rel="noreferrer"
            onclick=${() => setHasViewedChangelog(true)}
            class="hidden md:inline text-xs text-fg-muted hover:text-body transition-colors"
            >View changelog</a
          >
        `}
        ${showMobileUpdateRow
          ? html`
              <${UpdateActionButton}
                onClick=${handleAction}
                loading=${updateButtonLoading}
                warning=${isUpdateActionActive}
                idleLabel=${isUpdateActionActive
                  ? updateIdleLabel
                  : "Check updates"}
                loadingLabel=${isUpdateActionActive
                  ? updateLoadingLabel
                  : "Checking..."}
                className="hidden md:inline-flex"
              />
            `
          : html`
              <${UpdateActionButton}
                onClick=${handleAction}
                loading=${updateButtonLoading}
                warning=${isUpdateActionActive}
                idleLabel=${isUpdateActionActive
                  ? updateIdleLabel
                  : "Check updates"}
                loadingLabel=${isUpdateActionActive
                  ? updateLoadingLabel
                  : "Checking..."}
              />
            `}
      </div>
    </div>
    ${showMobileUpdateRow &&
    html`
      <div class="mt-2 md:hidden flex items-center gap-2">
        <a
          href=${changelogUrl}
          target="_blank"
          rel="noreferrer"
          onclick=${() => setHasViewedChangelog(true)}
          class="inline-flex items-center justify-center flex-1 h-9 text-xs rounded-lg border border-border text-fg-muted hover:text-body hover:border-fg-muted transition-colors"
          >View changelog</a
        >
        <${UpdateActionButton}
          onClick=${handleAction}
          loading=${updateButtonLoading}
          warning=${isUpdateActionActive}
          idleLabel=${updateIdleLabel}
          loadingLabel=${updateLoadingLabel}
          className="flex-1 h-9 px-3"
        />
      </div>
    `}
    <${ConfirmDialog}
      visible=${confirmWithoutChangelogOpen}
      title="Update without changelog?"
      message="Are you sure you want to update without viewing the changelog?"
      confirmLabel=${`Update to ${effectiveLatestVersion || "latest"}`}
      cancelLabel="Cancel"
      confirmTone="warning"
      onCancel=${() => setConfirmWithoutChangelogOpen(false)}
      onConfirm=${handleConfirmWithoutChangelog}
    />
  `;
};

export const Gateway = ({
  status,
  openclawVersion,
  restarting = false,
  onRestart,
  watchdogStatus = null,
  onOpenWatchdog,
  onRepair,
  repairing = false,
  openclawRestarting = false,
  openclawUpdateInProgress = false,
  onOpenclawVersionActionComplete = () => {},
  onOpenclawUpdate = updateOpenclaw,
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
    <div class="mt-3">
      <${VersionRow}
        label="OpenClaw"
        currentVersion=${openclawVersion}
        fetchVersion=${fetchOpenclawVersion}
        applyUpdate=${onOpenclawUpdate}
        updateInProgress=${openclawUpdateInProgress}
        updateLoadingLabel=${openclawRestarting ? "Restarting..." : "Updating..."}
        onActionComplete=${onOpenclawVersionActionComplete}
      />
    </div>
  </div>`;
};
