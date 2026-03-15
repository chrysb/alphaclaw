import { h } from "https://esm.sh/preact";
import { useEffect, useMemo, useRef, useState } from "https://esm.sh/preact/hooks";
import htm from "https://esm.sh/htm";
import { ActionButton } from "../action-button.js";
import { AlarmLineIcon } from "../icons.js";
import { PageHeader } from "../page-header.js";
import { CronJobList } from "./cron-job-list.js";
import { CronJobDetail } from "./cron-job-detail.js";
import { CronOverview } from "./cron-overview.js";
import { kAllCronJobsRouteKey } from "./cron-helpers.js";
import { useCronTab } from "./use-cron-tab.js";

const html = htm.bind(h);

export const CronTab = ({ jobId = "", onSetLocation = () => {} }) => {
  const { state, actions } = useCronTab({ jobId, onSetLocation });
  const [showJobSelector, setShowJobSelector] = useState(false);
  const selectorShellRef = useRef(null);
  const isAllJobsSelected = state.selectedRouteKey === kAllCronJobsRouteKey;
  const noJobs = state.jobs.length === 0;
  const selectedJob = state.selectedJob;
  const selectedJobLabel = useMemo(() => {
    if (isAllJobsSelected) return "All jobs";
    const selectedJob = state.jobs.find(
      (job) => String(job?.id || "") === String(state.selectedRouteKey || ""),
    );
    return String(selectedJob?.name || selectedJob?.id || "All jobs");
  }, [isAllJobsSelected, state.jobs, state.selectedRouteKey]);
  const hasUnsavedDetailChanges = useMemo(() => {
    if (isAllJobsSelected || !selectedJob) return false;
    const sessionTarget = String(
      state.routingDraft?.sessionTarget || selectedJob?.sessionTarget || "main",
    );
    const wakeMode = String(
      state.routingDraft?.wakeMode || selectedJob?.wakeMode || "now",
    );
    const deliveryMode = String(
      state.routingDraft?.deliveryMode || selectedJob?.delivery?.mode || "none",
    );
    const currentSessionTarget = String(selectedJob?.sessionTarget || "main");
    const currentWakeMode = String(selectedJob?.wakeMode || "now");
    const currentDeliveryMode = String(selectedJob?.delivery?.mode || "none");
    const isRoutingDirty =
      sessionTarget !== currentSessionTarget ||
      wakeMode !== currentWakeMode ||
      deliveryMode !== currentDeliveryMode;
    const isPromptDirty = state.promptValue !== state.savedPromptValue;
    return isRoutingDirty || isPromptDirty;
  }, [
    isAllJobsSelected,
    selectedJob,
    state.promptValue,
    state.routingDraft?.deliveryMode,
    state.routingDraft?.sessionTarget,
    state.routingDraft?.wakeMode,
    state.savedPromptValue,
  ]);

  useEffect(() => {
    if (!showJobSelector) return () => {};
    const handlePointerDown = (event) => {
      if (selectorShellRef.current?.contains(event.target)) return;
      setShowJobSelector(false);
    };
    const handleKeyDown = (event) => {
      if (event.key !== "Escape") return;
      setShowJobSelector(false);
    };
    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [showJobSelector]);

  const handleSelectAllJobs = () => {
    actions.selectAllJobs();
    setShowJobSelector(false);
  };

  const handleSelectJob = (nextJobId) => {
    actions.selectJob(nextJobId);
    setShowJobSelector(false);
  };

  return html`
    <div class="cron-tab-shell">
      <div class="cron-tab-header">
        <div class="cron-tab-header-content">
          <${PageHeader}
            leading=${html`
              <div class="cron-tab-selector-shell" ref=${selectorShellRef}>
                <button
                  type="button"
                  class=${`cron-tab-selector-toggle ${showJobSelector ? "is-open" : ""}`}
                  onClick=${() => setShowJobSelector((value) => !value)}
                  aria-expanded=${showJobSelector}
                  aria-haspopup="listbox"
                >
                  <span class="cron-tab-selector-title">${selectedJobLabel}</span>
                  <span class="cron-tab-selector-caret">▾</span>
                </button>
                ${showJobSelector
                  ? html`
                      <div class="cron-tab-selector-dropdown">
                        <${CronJobList}
                          jobs=${state.jobs}
                          selectedRouteKey=${state.selectedRouteKey}
                          onSelectAllJobs=${handleSelectAllJobs}
                          onSelectJob=${handleSelectJob}
                        />
                      </div>
                    `
                  : null}
              </div>
            `}
            actions=${html`
              ${isAllJobsSelected || noJobs
                ? html`
                    <${ActionButton}
                      onClick=${actions.refreshAll}
                      tone="secondary"
                      size="sm"
                      idleLabel="Refresh"
                    />
                  `
                : html`
                    <${ActionButton}
                      onClick=${actions.saveChanges}
                      loading=${state.savingChanges}
                      disabled=${!hasUnsavedDetailChanges}
                      tone="primary"
                      size="sm"
                      idleLabel="Save changes"
                      loadingLabel="Saving..."
                    />
                  `}
            `}
          />
        </div>
      </div>
      <div class="cron-tab-main">
        <div class="cron-tab-main-content">
          <main class="cron-detail-panel">
            ${noJobs
              ? html`
                  <div
                    class="bg-surface border border-border rounded-xl px-6 py-10 min-h-[26rem] flex flex-col items-center justify-center text-center"
                  >
                    <div class="max-w-md w-full flex flex-col items-center gap-4">
                      <${AlarmLineIcon} className="h-12 w-12 text-cyan-400" />
                      <div class="space-y-2">
                        <h2 class="font-semibold text-lg text-gray-100">
                          No cron jobs yet
                        </h2>
                        <p class="text-xs text-gray-400 leading-5">
                          Cron jobs are managed via the OpenClaw CLI. Once jobs are
                          configured, schedules and run history will appear here.
                        </p>
                      </div>
                    </div>
                  </div>
                `
              : isAllJobsSelected
                ? html`
                    <${CronOverview}
                      jobs=${state.jobs}
                      status=${state.status}
                      bulkUsageByJobId=${state.bulkUsageByJobId}
                      bulkRunsByJobId=${state.bulkRunsByJobId}
                      onSelectJob=${handleSelectJob}
                    />
                  `
                : html`
                    <${CronJobDetail}
                      job=${state.selectedJob}
                      runEntries=${state.runEntries}
                      filteredRunEntries=${state.filteredRunEntries}
                      runTotal=${state.runTotal}
                      runHasMore=${state.runHasMore}
                      loadingMoreRuns=${state.loadingMoreRuns}
                      runStatusFilter=${state.runStatusFilter}
                      onSetRunStatusFilter=${actions.setRunStatusFilter}
                      onLoadMoreRuns=${actions.loadMoreRuns}
                      onRunNow=${actions.runSelectedJobNow}
                      runningJob=${state.runningJob}
                      onToggleEnabled=${actions.setSelectedJobEnabled}
                      togglingJobEnabled=${state.togglingJobEnabled}
                      usage=${state.usage}
                      jobTrends=${state.jobTrends}
                      jobTrendRange=${state.jobTrendRange}
                      selectedJobTrendBucketFilter=${state.selectedJobTrendBucketFilter}
                      usageDays=${state.usageDays}
                      onSetUsageDays=${actions.setUsageDays}
                      onSetJobTrendRange=${actions.setJobTrendRange}
                      onSetSelectedJobTrendBucketFilter=${actions.setSelectedJobTrendBucketFilter}
                      promptValue=${state.promptValue}
                      savedPromptValue=${state.savedPromptValue}
                      onChangePrompt=${actions.setPromptValue}
                      onSaveChanges=${actions.saveChanges}
                      savingChanges=${state.savingChanges}
                      routingDraft=${state.routingDraft}
                      onChangeRoutingDraft=${actions.setRoutingDraft}
                      deliverySessions=${state.deliverySessions}
                      loadingDeliverySessions=${state.loadingDeliverySessions}
                      deliverySessionsError=${state.deliverySessionsError}
                      destinationSessionKey=${state.destinationSessionKey}
                      onChangeDestinationSessionKey=${actions.setDestinationSessionKey}
                    />
                  `}
          </main>
        </div>
      </div>
    </div>
  `;
};
