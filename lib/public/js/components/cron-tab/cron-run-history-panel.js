import { h } from "https://esm.sh/preact";
import htm from "https://esm.sh/htm";
import { SegmentedControl } from "../segmented-control.js";
import {
  formatDurationCompactMs,
  formatLocaleDateTimeWithTodayTime,
} from "../../lib/format.js";
import {
  formatCost,
  formatTokenCount,
  getCronRunEstimatedCost,
  getCronRunTotalTokens,
} from "./cron-helpers.js";

const html = htm.bind(h);
const runStatusClassName = (status = "") => {
  const normalized = String(status || "")
    .trim()
    .toLowerCase();
  if (normalized === "ok") return "text-green-300";
  if (normalized === "error") return "text-red-300";
  if (normalized === "skipped") return "text-yellow-300";
  return "text-gray-400";
};
const runDeliveryLabel = (run) =>
  String(run?.deliveryStatus || "not-requested");
const formatOverviewTimestamp = (timestampMs) =>
  formatLocaleDateTimeWithTodayTime(timestampMs, {
    fallback: "—",
    valueIsEpochMs: true,
  }).replace(
    /\s([AP])M\b/g,
    (_, marker) => `${String(marker || "").toLowerCase()}m`,
  );
const formatDetailTimestamp = (timestampMs) =>
  formatLocaleDateTimeWithTodayTime(timestampMs, {
    fallback: "—",
    valueIsEpochMs: true,
  });
const formatRowTimestamp = (timestampMs, variant = "overview") =>
  variant === "detail"
    ? formatDetailTimestamp(timestampMs)
    : formatOverviewTimestamp(timestampMs);
const renderEntrySummaryRow = ({ runEntry = {}, variant = "overview" }) => {
  const runStatus = String(runEntry?.status || "unknown");
  const runTokens = getCronRunTotalTokens(runEntry);
  const runEstimatedCost = getCronRunEstimatedCost(runEntry);
  const runTitle = String(runEntry?.jobName || "").trim();
  const hasRunTitle = runTitle.length > 0;
  const isDetail = variant === "detail";
  return html`
    <div class="ac-history-summary-row">
      <span class="inline-flex items-center gap-2 min-w-0">
        ${isDetail
          ? html`
              <span class="truncate text-xs text-gray-300">
                ${formatRowTimestamp(runEntry.ts, variant)}
              </span>
            `
          : hasRunTitle
            ? html`
                <span class="inline-flex items-center gap-2 min-w-0">
                  <span class="truncate text-xs text-gray-300"
                    >${runTitle}</span
                  >
                  <span class="text-xs text-gray-500 shrink-0">
                    ${formatRowTimestamp(runEntry.ts, variant)}
                  </span>
                </span>
              `
            : html`
                <span class="truncate text-xs text-gray-300">
                  ${runEntry.jobId} -
                  ${formatRowTimestamp(runEntry.ts, variant)}
                </span>
              `}
      </span>
      <span class="inline-flex items-center gap-3 shrink-0 text-xs">
        <span class=${runStatusClassName(runStatus)}>${runStatus}</span>
        <span class="text-gray-400"
          >${formatDurationCompactMs(runEntry.durationMs)}</span
        >
        <span class="text-gray-400">${formatTokenCount(runTokens)} tk</span>
        ${isDetail
          ? html`<span class="text-gray-500"
              >${runDeliveryLabel(runEntry)}</span
            >`
          : html`
              <span class="text-gray-500">
                ${runEstimatedCost == null
                  ? "—"
                  : `~${formatCost(runEstimatedCost)}`}
              </span>
            `}
      </span>
    </div>
  `;
};
const getCollapsedGroupAggregates = (entries = []) =>
  entries.reduce(
    (accumulator, runEntry) => {
      accumulator.totalTokens += getCronRunTotalTokens(runEntry);
      const estimatedCost = getCronRunEstimatedCost(runEntry);
      if (estimatedCost != null) {
        accumulator.totalCost += estimatedCost;
        accumulator.hasAnyCost = true;
      }
      return accumulator;
    },
    { totalTokens: 0, totalCost: 0, hasAnyCost: false },
  );
const renderCollapsedGroupRow = ({ row, rowIndex, onSelectJob = () => {} }) => {
  const entries = Array.isArray(row?.entries) ? row.entries : [];
  const { totalTokens, totalCost, hasAnyCost } =
    getCollapsedGroupAggregates(entries);
  const timeRangeLabel = `${formatOverviewTimestamp(row.oldestTs)} - ${formatOverviewTimestamp(row.newestTs)}`;
  return html`
    <details
      key=${`collapsed:${rowIndex}:${row.jobId}`}
      class="ac-history-item"
    >
      <summary class="ac-history-summary">
        <div class="ac-history-summary-row">
          <span class="inline-flex items-center gap-2 min-w-0">
            <span class="ac-history-toggle shrink-0" aria-hidden="true">▸</span>
            <span class="inline-flex items-center gap-2 min-w-0">
              <span class="truncate text-xs text-gray-300">
                ${row.jobName} - ${formatTokenCount(row.count)} runs
              </span>
              <span class="text-xs text-gray-500 shrink-0"
                >${timeRangeLabel}</span
              >
            </span>
          </span>
          <span class="inline-flex items-center gap-3 shrink-0 text-xs">
            <span class="text-gray-400"
              >${formatTokenCount(totalTokens)} tk</span
            >
            <span class="text-gray-500">
              ${hasAnyCost ? `~${formatCost(totalCost)}` : "—"}
            </span>
          </span>
        </div>
      </summary>
      <div class="border-t border-border pb-2 text-xs">
        ${entries.length > 0
          ? html`
              <div class="ac-history-list ac-history-list-tight">
                ${entries.map((runEntry, entryIndex) =>
                  renderEntryRow({
                    row: {
                      type: "entry",
                      entry: runEntry,
                    },
                    rowIndex: `${rowIndex}:${entryIndex}`,
                    variant: "overview",
                    onSelectJob,
                    showOpenJobButton: false,
                    itemClassName:
                      "ac-history-item ac-history-item-flat border-b border-border rounded-none",
                  }),
                )}
              </div>
            `
          : null}
        ${row?.jobId
          ? html`
              <div class="px-2.5 pt-2 pb-0.5">
                <button
                  type="button"
                  class="text-xs px-2 py-1 rounded border border-border text-gray-400 hover:text-gray-200"
                  onclick=${() => onSelectJob(row.jobId)}
                >
                  Open ${row.jobName || row.jobId}
                </button>
              </div>
            `
          : null}
      </div>
    </details>
  `;
};
const renderEntryRow = ({
  row,
  rowIndex,
  variant = "overview",
  onSelectJob = () => {},
  showOpenJobButton = false,
  itemClassName = "ac-history-item",
}) => {
  const runEntry = row?.entry || row || {};
  const runUsage = runEntry?.usage || {};
  const runInputTokens = Number(
    runUsage?.input_tokens ?? runUsage?.inputTokens ?? 0,
  );
  const runOutputTokens = Number(
    runUsage?.output_tokens ?? runUsage?.outputTokens ?? 0,
  );
  const runTokens = getCronRunTotalTokens(runEntry);
  const runEstimatedCost = getCronRunEstimatedCost(runEntry);
  return html`
    <details
      key=${`entry:${rowIndex}:${runEntry.ts}:${runEntry.jobId || ""}`}
      class=${itemClassName}
    >
      <summary class="ac-history-summary">
        <div class="inline-flex items-center gap-2 min-w-0 w-full">
          <span class="ac-history-toggle shrink-0" aria-hidden="true">▸</span>
          <div class="min-w-0 flex-1">
            ${renderEntrySummaryRow({ runEntry, variant })}
          </div>
        </div>
      </summary>
      <div class="ac-history-body space-y-2 text-xs">
        ${runEntry.summary
          ? html`<div>
              <span class="text-gray-500">Summary:</span> ${runEntry.summary}
            </div>`
          : null}
        ${runEntry.error
          ? html`<div class="text-red-300">
              <span class="text-gray-500">Error:</span> ${runEntry.error}
            </div>`
          : null}
        <div class="ac-surface-inset rounded-lg p-2.5 space-y-1.5">
          <div class="text-gray-500">
            Model:
            <span class="text-gray-300 font-mono"
              >${runEntry.model || "—"}</span
            >
          </div>
          <div class="text-gray-500">
            Session:
            <span class="text-gray-300 font-mono"
              >${runEntry.sessionKey || "—"}</span
            >
          </div>
          <div class="text-gray-500">
            Tokens in:
            <span class="text-gray-300"
              >${formatTokenCount(runInputTokens)}</span
            >
          </div>
          <div class="text-gray-500">
            Tokens out:
            <span class="text-gray-300"
              >${formatTokenCount(runOutputTokens)}</span
            >
          </div>
          <div class="text-gray-500">
            Total tokens:
            <span class="text-gray-300">${formatTokenCount(runTokens)}</span>
          </div>
          <div class="text-gray-500">
            Total cost:
            <span class="text-gray-300">
              ${runEstimatedCost == null
                ? "—"
                : `~${formatCost(runEstimatedCost)}`}
            </span>
          </div>
        </div>
        ${showOpenJobButton && runEntry?.jobId
          ? html`
              <div>
                <button
                  type="button"
                  class="text-xs px-2 py-1 rounded border border-border text-gray-400 hover:text-gray-200"
                  onclick=${() => onSelectJob(runEntry.jobId)}
                >
                  Open ${runEntry.jobName || runEntry.jobId}
                </button>
              </div>
            `
          : null}
      </div>
    </details>
  `;
};

export const CronRunHistoryPanel = ({
  entryCountLabel = "",
  primaryFilterOptions = [],
  primaryFilterValue = "all",
  onChangePrimaryFilter = () => {},
  secondaryFilterOptions = [],
  secondaryFilterValue = "all",
  onChangeSecondaryFilter = () => {},
  activeFilterLabel = "",
  onClearActiveFilter = () => {},
  rows = [],
  emptyText = "No runs found.",
  variant = "overview",
  onSelectJob = () => {},
  showOpenJobButton = false,
  footer = null,
}) => html`
  <section class="bg-surface border border-border rounded-xl p-4 space-y-3">
    <div class="flex items-start justify-between gap-3">
      <div class="inline-flex items-center gap-3">
        <h3 class="card-label card-label-bright">Recent runs</h3>
        <div class="text-xs text-gray-500">${entryCountLabel}</div>
      </div>
      <div class="shrink-0 inline-flex items-center gap-2">
        <${SegmentedControl}
          options=${primaryFilterOptions}
          value=${primaryFilterValue}
          onChange=${onChangePrimaryFilter}
        />
        ${Array.isArray(secondaryFilterOptions) &&
        secondaryFilterOptions.length > 0
          ? html`
              <${SegmentedControl}
                options=${secondaryFilterOptions}
                value=${secondaryFilterValue}
                onChange=${onChangeSecondaryFilter}
              />
            `
          : null}
      </div>
    </div>
    ${activeFilterLabel
      ? html`
          <div class="flex items-center">
            <span
              class="inline-flex items-center gap-1.5 text-xs pl-2.5 pr-2 py-1 rounded-full border border-border text-gray-300 bg-black/20"
            >
              Filtered to ${activeFilterLabel}
              <button
                type="button"
                class="text-gray-500 hover:text-gray-200 leading-none"
                onclick=${onClearActiveFilter}
                aria-label="Clear trend filter"
              >
                ×
              </button>
            </span>
          </div>
        `
      : null}
    ${rows.length === 0
      ? html`<div class="text-sm text-gray-500">${emptyText}</div>`
      : html`
          <div class="ac-history-list">
            ${rows.map((row, rowIndex) =>
              row?.type === "collapsed-group"
                ? renderCollapsedGroupRow({ row, rowIndex, onSelectJob })
                : renderEntryRow({
                    row,
                    rowIndex,
                    variant,
                    onSelectJob,
                    showOpenJobButton,
                  }),
            )}
          </div>
        `}
    ${footer}
  </section>
`;
