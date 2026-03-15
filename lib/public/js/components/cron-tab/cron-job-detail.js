import { h } from "https://esm.sh/preact";
import { useMemo } from "https://esm.sh/preact/hooks";
import htm from "https://esm.sh/htm";
import { ActionButton } from "../action-button.js";
import { formatTokenCount } from "./cron-helpers.js";
import { CronJobUsage } from "./cron-job-usage.js";
import { CronJobTrendsPanel } from "./cron-job-trends-panel.js";
import { CronRunHistoryPanel } from "./cron-run-history-panel.js";
import { CronPromptEditor } from "./cron-prompt-editor.js";
import { CronJobSettingsCard } from "./cron-job-settings-card.js";

const html = htm.bind(h);
const kRunStatusFilterOptions = [
  { label: "all", value: "all" },
  { label: "ok", value: "ok" },
  { label: "error", value: "error" },
  { label: "skipped", value: "skipped" },
];

export const CronJobDetail = ({
  job = null,
  runEntries = [],
  filteredRunEntries = [],
  runTotal = 0,
  runHasMore = false,
  loadingMoreRuns = false,
  runStatusFilter = "all",
  onSetRunStatusFilter = () => {},
  onLoadMoreRuns = () => {},
  onRunNow = () => {},
  runningJob = false,
  onToggleEnabled = () => {},
  togglingJobEnabled = false,
  usage = null,
  jobTrends = null,
  jobTrendRange = "7d",
  selectedJobTrendBucketFilter = null,
  usageDays = 30,
  onSetUsageDays = () => {},
  onSetJobTrendRange = () => {},
  onSetSelectedJobTrendBucketFilter = () => {},
  promptValue = "",
  savedPromptValue = "",
  onChangePrompt = () => {},
  onSaveChanges = () => {},
  savingChanges = false,
  routingDraft = null,
  onChangeRoutingDraft = () => {},
  deliverySessions = [],
  loadingDeliverySessions = false,
  deliverySessionsError = "",
  destinationSessionKey = "",
  onChangeDestinationSessionKey = () => {},
}) => {
  if (!job) {
    return html`
      <div class="h-full flex items-center justify-center text-sm text-gray-500">
        Select a cron job to view details.
      </div>
    `;
  }

  const isRoutingDirty = useMemo(() => {
    const sessionTarget = String(
      routingDraft?.sessionTarget || job?.sessionTarget || "main",
    );
    const wakeMode = String(routingDraft?.wakeMode || job?.wakeMode || "now");
    const deliveryMode = String(
      routingDraft?.deliveryMode || job?.delivery?.mode || "none",
    );
    const currentSessionTarget = String(job?.sessionTarget || "main");
    const currentWakeMode = String(job?.wakeMode || "now");
    const currentDeliveryMode = String(job?.delivery?.mode || "none");
    return (
      sessionTarget !== currentSessionTarget ||
      wakeMode !== currentWakeMode ||
      deliveryMode !== currentDeliveryMode
    );
  }, [job, routingDraft?.deliveryMode, routingDraft?.sessionTarget, routingDraft?.wakeMode]);
  const isPromptDirty = promptValue !== savedPromptValue;
  const hasUnsavedChanges = isRoutingDirty || isPromptDirty;

  return html`
    <div class="cron-detail-scroll">
      <div class="cron-detail-content">
        <${CronJobSettingsCard}
          job=${job}
          routingDraft=${routingDraft}
          onChangeRoutingDraft=${onChangeRoutingDraft}
          destinationSessionKey=${destinationSessionKey}
          onChangeDestinationSessionKey=${onChangeDestinationSessionKey}
          deliverySessions=${deliverySessions}
          loadingDeliverySessions=${loadingDeliverySessions}
          deliverySessionsError=${deliverySessionsError}
          savingChanges=${savingChanges}
          togglingJobEnabled=${togglingJobEnabled}
          onToggleEnabled=${onToggleEnabled}
          onRunNow=${onRunNow}
          runningJob=${runningJob}
          hasUnsavedChanges=${hasUnsavedChanges}
        />

        <${CronPromptEditor}
          promptValue=${promptValue}
          savedPromptValue=${savedPromptValue}
          onChangePrompt=${onChangePrompt}
          onSaveChanges=${onSaveChanges}
        />

        <${CronJobUsage}
          usage=${usage}
          usageDays=${usageDays}
          onSetUsageDays=${onSetUsageDays}
        />
        <${CronJobTrendsPanel}
          trends=${jobTrends}
          range=${jobTrendRange}
          onChangeRange=${onSetJobTrendRange}
          selectedBucketFilter=${selectedJobTrendBucketFilter}
          onChangeSelectedBucketFilter=${onSetSelectedJobTrendBucketFilter}
        />

        <${CronRunHistoryPanel}
          entryCountLabel=${`${formatTokenCount(selectedJobTrendBucketFilter ? filteredRunEntries.length : runTotal)} entries`}
          primaryFilterOptions=${kRunStatusFilterOptions}
          primaryFilterValue=${runStatusFilter}
          onChangePrimaryFilter=${onSetRunStatusFilter}
          activeFilterLabel=${selectedJobTrendBucketFilter?.label || ""}
          onClearActiveFilter=${() => onSetSelectedJobTrendBucketFilter(null)}
          rows=${selectedJobTrendBucketFilter ? filteredRunEntries : runEntries}
          variant="detail"
          footer=${runHasMore
            ? html`
                <div class="pt-2">
                  <${ActionButton}
                    onClick=${onLoadMoreRuns}
                    loading=${loadingMoreRuns}
                    tone="secondary"
                    size="sm"
                    idleLabel="Load More"
                    loadingLabel="Loading..."
                  />
                </div>
              `
            : null}
        />
      </div>
    </div>
  `;
};
