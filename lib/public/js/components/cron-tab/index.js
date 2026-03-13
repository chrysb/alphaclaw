import { h } from "https://esm.sh/preact";
import htm from "https://esm.sh/htm";
import { ActionButton } from "../action-button.js";
import { PageHeader } from "../page-header.js";
import { CronJobList } from "./cron-job-list.js";
import { CronJobDetail } from "./cron-job-detail.js";
import { CronOverview } from "./cron-overview.js";
import { kAllCronJobsRouteKey } from "./cron-helpers.js";
import { useCronTab } from "./use-cron-tab.js";

const html = htm.bind(h);

export const CronTab = ({ jobId = "", onSetLocation = () => {} }) => {
  const { refs, state, actions } = useCronTab({ jobId, onSetLocation });
  const isAllJobsSelected = state.selectedRouteKey === kAllCronJobsRouteKey;
  const noJobs = state.jobs.length === 0;

  return html`
    <div class="cron-tab-shell">
      <div class="cron-tab-header">
        <${PageHeader}
          title="Cron Jobs"
          actions=${html`
            <${ActionButton}
              onClick=${actions.refreshAll}
              tone="secondary"
              size="sm"
              idleLabel="Refresh"
            />
          `}
        />
      </div>
      <div class="cron-tab-main">
        <aside
          ref=${refs.listPanelRef}
          class="cron-list-panel"
          style=${{ width: `${state.listPanelWidthPx}px` }}
        >
          <${CronJobList}
            jobs=${state.jobs}
            selectedRouteKey=${state.selectedRouteKey}
            onSelectAllJobs=${actions.selectAllJobs}
            onSelectJob=${actions.selectJob}
          />
        </aside>
        <div
          class=${`cron-list-resizer ${state.isResizingListPanel ? "is-resizing" : ""}`}
          onpointerdown=${actions.onListResizerPointerDown}
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize cron jobs list"
        ></div>
        <main class="cron-detail-panel">
          ${noJobs
            ? html`
                <div class="h-full flex items-center justify-center text-sm text-gray-500">
                  No cron jobs configured. Cron jobs are managed via the OpenClaw CLI.
                </div>
              `
            : isAllJobsSelected
              ? html`
                  <${CronOverview}
                    jobs=${state.jobs}
                    status=${state.status}
                    bulkUsageByJobId=${state.bulkUsageByJobId}
                    bulkRunsByJobId=${state.bulkRunsByJobId}
                    onSelectJob=${actions.selectJob}
                  />
                `
              : html`
                  <${CronJobDetail}
                    job=${state.selectedJob}
                    runEntries=${state.runEntries}
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
                    usageDays=${state.usageDays}
                    onSetUsageDays=${actions.setUsageDays}
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
  `;
};
