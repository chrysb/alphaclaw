import { h } from "https://esm.sh/preact";
import { useEffect, useMemo, useState } from "https://esm.sh/preact/hooks";
import htm from "https://esm.sh/htm";
import { usePolling } from "../../hooks/usePolling.js";
import {
  fetchDoctorCards,
  fetchDoctorStatus,
  fetchDoctorRuns,
  startDoctorRun,
  updateDoctorCardStatus,
} from "../../lib/api.js";
import { formatLocaleDateTime } from "../../lib/format.js";
import { ActionButton } from "../action-button.js";
import { LoadingSpinner } from "../loading-spinner.js";
import { PageHeader } from "../page-header.js";
import { showToast } from "../toast.js";
import { DoctorSummaryCards } from "./summary-cards.js";
import { DoctorFindingsList } from "./findings-list.js";
import { DoctorFixCardModal } from "./fix-card-modal.js";
import {
  buildDoctorRunMarkers,
  buildDoctorStatusFilterOptions,
  getDoctorBootstrapTruncationItems,
  getDoctorBootstrapWarningTitle,
  getDoctorChangeLabel,
  getDoctorRunPillDetail,
  hasDoctorBootstrapWarnings,
  shouldShowDoctorWarning,
} from "./helpers.js";

const html = htm.bind(h);

const kIdlePollMs = 15000;
const kActivePollMs = 2000;

const DoctorEmptyStateIcon = () => html`
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    class="h-12 w-12 text-cyan-400"
  >
    <path
      d="M8 20V14H16V20H19V4H5V20H8ZM10 20H14V16H10V20ZM21 20H23V22H1V20H3V3C3 2.44772 3.44772 2 4 2H20C20.5523 2 21 2.44772 21 3V20ZM11 8V6H13V8H15V10H13V12H11V10H9V8H11Z"
    ></path>
  </svg>
`;

export const DoctorTab = ({ isActive = false, onOpenFile = () => {} }) => {
  const statusPoll = usePolling(fetchDoctorStatus, kIdlePollMs, {
    enabled: isActive,
  });
  const doctorStatus = statusPoll.data?.status || null;
  const runPollIntervalMs = doctorStatus?.runInProgress
    ? kActivePollMs
    : kIdlePollMs;
  const runsPoll = usePolling(() => fetchDoctorRuns(10), runPollIntervalMs, {
    enabled: isActive,
  });
  const [selectedRunFilter, setSelectedRunFilter] = useState("all");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("open");
  const [busyCardId, setBusyCardId] = useState(0);
  const [fixCard, setFixCard] = useState(null);
  const [pendingRunSelectionId, setPendingRunSelectionId] = useState("");

  const runs = runsPoll.data?.runs || [];
  const activeRunId = String(doctorStatus?.activeRunId || "");
  const selectedRunId = String(selectedRunFilter || "");
  const shouldRenderPendingRunTab =
    selectedRunId !== "" &&
    selectedRunId !== "all" &&
    !runs.some((run) => String(run.id || "") === selectedRunId) &&
    (pendingRunSelectionId === selectedRunId ||
      (doctorStatus?.runInProgress && activeRunId === selectedRunId));
  const pendingRun = shouldRenderPendingRunTab
    ? {
        id: Number(selectedRunId || 0),
        status: "running",
        summary: "",
        priorityCounts: { P0: 0, P1: 0, P2: 0 },
        statusCounts: { open: 0, dismissed: 0, fixed: 0 },
      }
    : null;
  const displayRuns = pendingRun ? [pendingRun, ...runs] : runs;
  const selectedRunIsActiveRun =
    selectedRunFilter !== "all" &&
    !!activeRunId &&
    String(selectedRunFilter || "") === activeRunId;
  const selectedRun =
    selectedRunFilter === "all"
      ? null
      : displayRuns.find(
          (run) => String(run.id || "") === String(selectedRunFilter || ""),
        ) || null;
  const cardsPoll = usePolling(
    () => fetchDoctorCards({ runId: selectedRunFilter || "all" }),
    doctorStatus?.runInProgress || selectedRun?.status === "running"
      ? kActivePollMs
      : kIdlePollMs,
    { enabled: isActive },
  );
  const allCards = cardsPoll.data?.cards || [];

  useEffect(() => {
    if (!isActive) return;
    statusPoll.refresh();
    runsPoll.refresh();
  }, [isActive]);

  useEffect(() => {
    if (!runs.length) {
      if (pendingRunSelectionId && selectedRunId === pendingRunSelectionId)
        return;
      if (selectedRunIsActiveRun && doctorStatus?.runInProgress) return;
      if (selectedRunFilter !== "all") setSelectedRunFilter("all");
      return;
    }
    if (selectedRunFilter === "all") return;
    const hasSelectedRun = runs.some(
      (run) => String(run.id || "") === String(selectedRunFilter || ""),
    );
    if (hasSelectedRun) return;
    if (selectedRunIsActiveRun && doctorStatus?.runInProgress) return;
    setSelectedRunFilter("all");
  }, [
    runs,
    selectedRunId,
    selectedRunFilter,
    selectedRunIsActiveRun,
    pendingRunSelectionId,
    doctorStatus?.runInProgress,
  ]);

  useEffect(() => {
    if (!pendingRunSelectionId) return;
    if (selectedRunFilter !== pendingRunSelectionId) {
      setSelectedRunFilter(pendingRunSelectionId);
      return;
    }
    const hasPendingRun = runs.some(
      (run) => String(run.id || "") === String(pendingRunSelectionId || ""),
    );
    const activePendingRun =
      !!activeRunId &&
      activeRunId === pendingRunSelectionId &&
      !!doctorStatus?.runInProgress;
    if (!hasPendingRun && !activePendingRun) return;
    setPendingRunSelectionId("");
  }, [
    activeRunId,
    doctorStatus?.runInProgress,
    pendingRunSelectionId,
    runs,
    selectedRunFilter,
  ]);

  useEffect(() => {
    cardsPoll.refresh();
  }, [selectedRunFilter]);

  const selectedRunIsInProgress =
    selectedRun?.status === "running" ||
    (selectedRunIsActiveRun && doctorStatus?.runInProgress);
  const selectedRunSummary = useMemo(
    () => (selectedRunIsInProgress ? "" : selectedRun?.summary || ""),
    [selectedRun, selectedRunIsInProgress],
  );
  const statusFilterOptions = useMemo(
    () => buildDoctorStatusFilterOptions(),
    [],
  );
  const changeLabel = useMemo(
    () => getDoctorChangeLabel(doctorStatus?.changeSummary || null),
    [doctorStatus],
  );
  const canRunDoctor = useMemo(() => {
    if (doctorStatus?.runInProgress) return true;
    if (doctorStatus?.needsInitialRun) return true;
    return Number(doctorStatus?.changeSummary?.changedFilesCount || 0) > 0;
  }, [doctorStatus]);
  const runDoctorDisabledReason = canRunDoctor
    ? ""
    : "No workspace changes since the last completed Drift Doctor run.";
  const showDoctorStaleBanner = useMemo(
    () => shouldShowDoctorWarning(doctorStatus, 0),
    [doctorStatus],
  );
  const showBootstrapTruncationBanner = useMemo(
    () => hasDoctorBootstrapWarnings(doctorStatus),
    [doctorStatus],
  );
  const bootstrapTruncationMessage = useMemo(
    () => getDoctorBootstrapWarningTitle(doctorStatus),
    [doctorStatus],
  );
  const bootstrapTruncationItems = useMemo(
    () => getDoctorBootstrapTruncationItems(doctorStatus),
    [doctorStatus],
  );
  const hasCompletedDoctorRun = !!doctorStatus?.lastRunAt;
  const hasRuns = runs.length > 0;
  const hasLoadedRuns = runsPoll.data !== null || runsPoll.error !== null;
  const hasLoadedCards = cardsPoll.data !== null || cardsPoll.error !== null;
  const showInitialLoadingState =
    !hasLoadedRuns || (hasRuns && !hasLoadedCards);
  const cards = useMemo(() => {
    if (selectedStatusFilter === "all") return allCards;
    return allCards.filter(
      (card) =>
        String(card?.status || "open")
          .trim()
          .toLowerCase() === selectedStatusFilter,
    );
  }, [allCards, selectedStatusFilter]);
  const openCards = useMemo(
    () =>
      allCards.filter(
        (card) =>
          String(card?.status || "open")
            .trim()
            .toLowerCase() === "open",
      ),
    [allCards],
  );
  const visibleRuns = useMemo(() => displayRuns.slice(0, 2), [displayRuns]);
  const overflowRuns = useMemo(() => displayRuns.slice(2), [displayRuns]);
  const selectedOverflowRunValue = useMemo(() => {
    if (selectedRunFilter === "all") return "";
    return overflowRuns.some(
      (run) => String(run.id || "") === String(selectedRunFilter || ""),
    )
      ? String(selectedRunFilter || "")
      : "";
  }, [overflowRuns, selectedRunFilter]);

  const getRunTabClassName = (selected = false) =>
    [
      "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition-colors",
      selected
        ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-200 shadow-[0_0_0_1px_rgba(34,211,238,0.08)]"
        : "border-border bg-black/20 text-gray-300 hover:border-gray-500 hover:text-gray-100",
    ].join(" ");

  const getRunMarkerClassName = (tone = "neutral") => {
    if (tone === "success") return "bg-green-400";
    if (tone === "warning") return "bg-yellow-400";
    if (tone === "danger") return "bg-red-400";
    if (tone === "cyan") return "ac-status-dot ac-status-dot--info";
    return "bg-gray-500";
  };
  const showRunLayout =
    !showInitialLoadingState &&
    (runs.length > 0 ||
      !!pendingRunSelectionId ||
      !!activeRunId ||
      !!doctorStatus?.runInProgress);

  const handleRunDoctor = async () => {
    try {
      const result = await startDoctorRun();
      showToast(
        result?.reusedPreviousRun
          ? "No workspace changes since the last scan; reused previous findings"
          : "Doctor run started",
        "success",
      );
      if (result?.runId) {
        const runId = String(result.runId);
        setPendingRunSelectionId(runId);
        setSelectedRunFilter(runId);
      }
      statusPoll.refresh();
      runsPoll.refresh();
      cardsPoll.refresh();
      setTimeout(statusPoll.refresh, 1200);
      setTimeout(runsPoll.refresh, 1200);
      setTimeout(cardsPoll.refresh, 1200);
    } catch (error) {
      showToast(error.message || "Could not start Doctor run", "error");
    }
  };

  const handleUpdateStatus = async (card, status) => {
    if (!card?.id || busyCardId) return;
    try {
      setBusyCardId(card.id);
      await updateDoctorCardStatus({ cardId: card.id, status });
      showToast("Doctor card updated", "success");
      await cardsPoll.refresh();
      await runsPoll.refresh();
      await statusPoll.refresh();
    } catch (error) {
      showToast(error.message || "Could not update Doctor card", "error");
    } finally {
      setBusyCardId(0);
    }
  };

  return html`
    <div class="space-y-4">
      ${showRunLayout
        ? html`
            <${PageHeader}
              title="Drift Doctor"
              actions=${html`
                <${ActionButton}
                  onClick=${handleRunDoctor}
                  disabled=${!canRunDoctor}
                  loading=${!!doctorStatus?.runInProgress}
                  idleLabel="Run Drift Doctor"
                  loadingLabel="Running..."
                  title=${runDoctorDisabledReason}
                />
              `}
            />
          `
        : null}
      ${showInitialLoadingState
        ? html`
            <div class="bg-surface border border-border rounded-xl p-5">
              <div class="flex items-center gap-3 text-sm text-gray-400">
                <${LoadingSpinner} className="h-4 w-4" />
                <span>Loading Drift Doctor...</span>
              </div>
            </div>
          `
        : null}
      ${!showInitialLoadingState && hasRuns
        ? html`
            <div class="space-y-3">
              <${DoctorSummaryCards} cards=${openCards} />
              <div class="space-y-3">
                ${hasCompletedDoctorRun
                  ? html`
                      <div
                        class="bg-surface border border-border rounded-xl p-4 flex flex-wrap items-center justify-between gap-3"
                      >
                        <span class="text-xs text-gray-500">
                          Last run ·${" "}
                          <span class="text-gray-300">
                            ${formatLocaleDateTime(doctorStatus?.lastRunAt, {
                              fallback: "Never",
                            })}
                          </span>
                        </span>
                        <span class="text-xs text-gray-500">
                          ${changeLabel}
                        </span>
                      </div>
                      ${showBootstrapTruncationBanner
                        ? html`
                            <div
                              class="bg-surface border border-border rounded-xl p-4 space-y-3"
                            >
                              <div class="text-xs text-gray-400">
                                ⚠️ ${bootstrapTruncationMessage}
                              </div>
                              <div class="space-y-2">
                                ${bootstrapTruncationItems.map(
                                  (item) => html`
                                    <div
                                      class="flex items-center justify-between gap-3 text-xs"
                                    >
                                      <button
                                        type="button"
                                        class="font-mono text-gray-200 ac-tip-link hover:underline text-left cursor-pointer"
                                        onClick=${() => onOpenFile(String(item.path || ""))}
                                      >
                                        ${item.path}
                                      </button>
                                      <span
                                        class="flex items-center gap-3 whitespace-nowrap"
                                      >
                                        <span class="text-gray-500">
                                          ${item.size}
                                        </span>
                                        <span
                                          class=${item.statusTone === "warning"
                                            ? "text-yellow-300"
                                            : "text-red-300"}
                                        >
                                          ${item.statusText}
                                        </span>
                                      </span>
                                    </div>
                                  `,
                                )}
                              </div>
                              <div class="border-t border-border"></div>
                              <p class="text-xs text-gray-500 leading-5">
                                Truncated files become partially hidden from
                                your agent and could cause drift.
                              </p>
                            </div>
                          `
                        : null}
                    `
                  : null}
                ${showDoctorStaleBanner
                  ? html`
                      <div
                        class="text-xs text-yellow-300 bg-yellow-500/10 border border-yellow-500/35 rounded-lg px-3 py-2"
                      >
                        Doctor should be run again because the latest completed
                        run is older than one week and the workspace has
                        changed.
                      </div>
                    `
                  : null}
              </div>
            </div>
          `
        : null}
      ${showRunLayout
        ? html`
            <div class="space-y-4 pt-2">
              <div class="flex flex-wrap items-center justify-between gap-3">
                <h2 class="font-semibold text-base">Findings</h2>
              </div>
              <div class="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  class=${getRunTabClassName(selectedRunFilter === "all")}
                  onClick=${() => setSelectedRunFilter("all")}
                >
                  <span class="font-medium">All runs</span>
                </button>
                ${visibleRuns.map((run) => {
                  const selected =
                    String(selectedRunFilter || "") === String(run.id || "");
                  const markers = buildDoctorRunMarkers(run);
                  return html`
                    <button
                      key=${run.id}
                      type="button"
                      class=${getRunTabClassName(selected)}
                      onClick=${() =>
                        setSelectedRunFilter(String(run.id || ""))}
                    >
                      <span class="font-medium">Run #${run.id}</span>
                      <span class="inline-flex items-center gap-1">
                        ${markers.map(
                          (marker) => html`
                            <span
                              class="inline-flex items-center"
                              title=${marker.label}
                            >
                              <span
                                class=${getRunMarkerClassName(
                                  marker.tone,
                                ).startsWith("ac-status-dot")
                                  ? getRunMarkerClassName(marker.tone)
                                  : `h-2 w-2 rounded-full ${getRunMarkerClassName(marker.tone)}`}
                              ></span>
                            </span>
                          `,
                        )}
                      </span>
                    </button>
                  `;
                })}
                ${overflowRuns.length
                  ? html`
                      <label
                        class="flex items-center gap-2 text-xs text-gray-500"
                      >
                        <select
                          value=${selectedOverflowRunValue}
                          onChange=${(event) => {
                            const nextValue = String(
                              event.currentTarget?.value || "",
                            );
                            if (!nextValue) return;
                            setSelectedRunFilter(nextValue);
                          }}
                          class="bg-black/20 border border-border rounded-full px-3 py-1.5 text-xs text-gray-300 focus:border-gray-500"
                        >
                          <option value="">More runs</option>
                          ${overflowRuns.map(
                            (run) => html`
                              <option value=${String(run.id || "")}>
                                Run #${run.id} · ${getDoctorRunPillDetail(run)}
                              </option>
                            `,
                          )}
                        </select>
                      </label>
                    `
                  : null}
                <label class="flex items-center gap-2 text-xs text-gray-500">
                  <select
                    value=${selectedStatusFilter}
                    onChange=${(event) =>
                      setSelectedStatusFilter(
                        String(event.currentTarget?.value || "open"),
                      )}
                    class="bg-black/20 border border-border rounded-full px-3 py-1.5 text-xs text-gray-300 focus:border-gray-500"
                  >
                    ${statusFilterOptions.map(
                      (option) => html`
                        <option value=${option.value}>${option.label}</option>
                      `,
                    )}
                  </select>
                </label>
              </div>
              ${selectedRunSummary
                ? html`
                    <div class="ac-surface-inset rounded-xl p-4 space-y-1.5">
                      <div
                        class="text-[11px] uppercase tracking-wide text-gray-500"
                      >
                        ${selectedRun?.id
                          ? `Run #${selectedRun.id} summary`
                          : "Run summary"}
                      </div>
                      <p class="text-xs text-gray-300 leading-5">
                        ${selectedRunSummary}
                      </p>
                    </div>
                  `
                : null}
              ${selectedRunIsInProgress
                ? html`
                    <div class="ac-surface-inset rounded-xl p-4">
                      <div class="flex items-center gap-2 text-xs leading-5 text-gray-400">
                        <${LoadingSpinner} className="h-3.5 w-3.5" />
                        <span>
                          Run in progress. Findings will appear when analysis
                          completes.
                        </span>
                      </div>
                    </div>
                  `
                : null}
              <div>
                <${DoctorFindingsList}
                  cards=${cards}
                  busyCardId=${busyCardId}
                  onAskAgentFix=${setFixCard}
                  onUpdateStatus=${handleUpdateStatus}
                  onOpenFile=${onOpenFile}
                  changedPaths=${doctorStatus?.changeSummary?.changedPaths ||
                  []}
                  showRunMeta=${selectedRunFilter === "all"}
                  hideEmptyState=${selectedRunIsInProgress}
                />
              </div>
            </div>
          `
        : null}
      ${!showInitialLoadingState && !showRunLayout
        ? html`
            <div
              class="bg-surface border border-border rounded-xl px-6 py-10 min-h-[26rem] flex flex-col items-center justify-center text-center"
            >
              <div class="max-w-md w-full flex flex-col items-center gap-4">
                <${DoctorEmptyStateIcon} />
                <div class="space-y-2">
                  <h2 class="font-semibold text-lg text-gray-100">
                    Workspace health review
                  </h2>
                  <p class="text-xs text-gray-400 leading-5">
                    Drift Doctor scans the workspace for guidance drift,
                    misplaced instructions, redundant docs, and cleanup
                    opportunities.
                  </p>
                </div>
                <div class="flex flex-col items-center gap-2 mt-8">
                  <${ActionButton}
                    onClick=${handleRunDoctor}
                    disabled=${!canRunDoctor}
                    loading=${!!doctorStatus?.runInProgress}
                    size="lg"
                    idleLabel="Run Drift Doctor"
                    loadingLabel="Running..."
                    title=${runDoctorDisabledReason}
                  />
                  <p class="text-xs text-gray-500 leading-5 mt-10">
                    Runs on your main agent and consumes tokens. No
                    changes will be made without your approval.
                  </p>
                </div>
              </div>
            </div>
          `
        : null}
      <${DoctorFixCardModal}
        visible=${!!fixCard}
        card=${fixCard}
        onClose=${() => setFixCard(null)}
        onComplete=${async () => {
          await statusPoll.refresh();
          await runsPoll.refresh();
          await cardsPoll.refresh();
        }}
      />
    </div>
  `;
};
