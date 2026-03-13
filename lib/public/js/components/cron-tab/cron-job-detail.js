import { h } from "https://esm.sh/preact";
import { useEffect, useMemo, useRef, useState } from "https://esm.sh/preact/hooks";
import htm from "https://esm.sh/htm";
import { ActionButton } from "../action-button.js";
import { SegmentedControl } from "../segmented-control.js";
import { ToggleSwitch } from "../toggle-switch.js";
import { EditorSurface } from "../file-viewer/editor-surface.js";
import { countTextLines, shouldUseSimpleEditorMode } from "../file-viewer/utils.js";
import {
  kLargeFileSimpleEditorCharThreshold,
  kLargeFileSimpleEditorLineThreshold,
} from "../file-viewer/constants.js";
import { highlightEditorLines } from "../../lib/syntax-highlighters/index.js";
import {
  formatCronScheduleLabel,
  formatNextRunRelativeMs,
  formatTokenCount,
} from "./cron-helpers.js";
import { CronJobUsage } from "./cron-job-usage.js";
import { CronRunHistoryPanel } from "./cron-run-history-panel.js";
import { readUiSettings, writeUiSettings } from "../../lib/ui-settings.js";

const html = htm.bind(h);
const kCronPromptEditorHeightUiSettingKey = "cronPromptEditorHeightPx";
const kCronPromptEditorDefaultHeightPx = 280;
const kCronPromptEditorMinHeightPx = 180;
const clampPromptEditorHeight = (value) => {
  const parsed = Number(value);
  const normalized = Number.isFinite(parsed)
    ? Math.round(parsed)
    : kCronPromptEditorDefaultHeightPx;
  return Math.max(kCronPromptEditorMinHeightPx, normalized);
};
const readCssHeightPx = (element) => {
  if (!element) return 0;
  const computedHeight = Number.parseFloat(window.getComputedStyle(element).height || "0");
  return Number.isFinite(computedHeight) ? computedHeight : 0;
};

const PromptEditor = ({
  promptValue = "",
  savedPromptValue = "",
  onChangePrompt = () => {},
  onSaveChanges = () => {},
}) => {
  const promptEditorShellRef = useRef(null);
  const editorTextareaRef = useRef(null);
  const editorLineNumbersRef = useRef(null);
  const editorLineNumberRowRefs = useRef([]);
  const editorHighlightRef = useRef(null);
  const editorHighlightLineRefs = useRef([]);
  const [promptEditorHeightPx, setPromptEditorHeightPx] = useState(() => {
    const settings = readUiSettings();
    return clampPromptEditorHeight(settings?.[kCronPromptEditorHeightUiSettingKey]);
  });

  const lineCount = countTextLines(promptValue);
  const editorLineNumbers = useMemo(
    () => Array.from({ length: lineCount }, (_, index) => index + 1),
    [lineCount],
  );
  const shouldUseHighlightedEditor = !shouldUseSimpleEditorMode({
    contentLength: promptValue.length,
    lineCount,
    charThreshold: kLargeFileSimpleEditorCharThreshold,
    lineThreshold: kLargeFileSimpleEditorLineThreshold,
  });
  const highlightedEditorLines = useMemo(
    () =>
      shouldUseHighlightedEditor
        ? highlightEditorLines(promptValue, "markdown")
        : [],
    [promptValue, shouldUseHighlightedEditor],
  );
  const isDirty = promptValue !== savedPromptValue;

  const handleEditorScroll = (event) => {
    const scrollTop = event.currentTarget.scrollTop;
    if (editorLineNumbersRef.current) editorLineNumbersRef.current.scrollTop = scrollTop;
    if (editorHighlightRef.current) editorHighlightRef.current.scrollTop = scrollTop;
  };

  const handleEditorKeyDown = (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
      event.preventDefault();
      onSaveChanges();
    }
    if (event.key === "Tab") {
      event.preventDefault();
      const textarea = editorTextareaRef.current;
      if (!textarea) return;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const nextValue = `${promptValue.slice(0, start)}  ${promptValue.slice(end)}`;
      onChangePrompt(nextValue);
      window.requestAnimationFrame(() => {
        textarea.selectionStart = start + 2;
        textarea.selectionEnd = start + 2;
      });
    }
  };

  useEffect(() => {
    const shellElement = promptEditorShellRef.current;
    if (!shellElement || typeof ResizeObserver === "undefined") return () => {};

    let saveTimer = null;
    const observer = new ResizeObserver((entries) => {
      const entry = entries?.[0];
      const nextHeight = clampPromptEditorHeight(readCssHeightPx(entry?.target));
      setPromptEditorHeightPx((currentValue) =>
        Math.abs(currentValue - nextHeight) >= 1 ? nextHeight : currentValue
      );
      if (saveTimer) window.clearTimeout(saveTimer);
      saveTimer = window.setTimeout(() => {
        const settings = readUiSettings();
        settings[kCronPromptEditorHeightUiSettingKey] = nextHeight;
        writeUiSettings(settings);
      }, 120);
    });
    observer.observe(shellElement);
    return () => {
      observer.disconnect();
      if (saveTimer) window.clearTimeout(saveTimer);
    };
  }, []);

  return html`
    <section class="bg-surface border border-border rounded-xl p-4 space-y-3">
      <div class="flex items-center justify-between gap-2">
        <h3 class="card-label inline-flex items-center gap-1.5">
          Prompt
          ${isDirty ? html`<span class="file-viewer-dirty-dot"></span>` : null}
        </h3>
      </div>
      <div
        class="cron-prompt-editor-shell"
        ref=${promptEditorShellRef}
        style=${{ height: `${promptEditorHeightPx}px` }}
      >
        <${EditorSurface}
          editorShellClassName="file-viewer-editor-shell"
          editorLineNumbers=${editorLineNumbers}
          editorLineNumbersRef=${editorLineNumbersRef}
          editorLineNumberRowRefs=${editorLineNumberRowRefs}
          shouldUseHighlightedEditor=${shouldUseHighlightedEditor}
          highlightedEditorLines=${highlightedEditorLines}
          editorHighlightRef=${editorHighlightRef}
          editorHighlightLineRefs=${editorHighlightLineRefs}
          editorTextareaRef=${editorTextareaRef}
          renderContent=${promptValue}
          handleContentInput=${(event) => onChangePrompt(event.target.value)}
          handleEditorKeyDown=${handleEditorKeyDown}
          handleEditorScroll=${handleEditorScroll}
          handleEditorSelectionChange=${() => {}}
          isEditBlocked=${false}
          isPreviewOnly=${false}
        />
      </div>
    </section>
  `;
};

const kMetaCardClassName = "ac-surface-inset rounded-lg p-2.5 space-y-1.5";
const kRunStatusFilterOptions = [
  { label: "all", value: "all" },
  { label: "ok", value: "ok" },
  { label: "error", value: "error" },
  { label: "skipped", value: "skipped" },
];
const kSessionTargetOptions = [
  { label: "main", value: "main" },
  { label: "isolated", value: "isolated" },
];
const kWakeModeOptions = [
  { label: "now", value: "now" },
  { label: "next-heartbeat", value: "next-heartbeat" },
];
const kDeliveryNoneValue = "__none__";
const isSameCalendarDay = (leftDate, rightDate) =>
  leftDate.getFullYear() === rightDate.getFullYear() &&
  leftDate.getMonth() === rightDate.getMonth() &&
  leftDate.getDate() === rightDate.getDate();

const formatCompactMeridiemTime = (dateValue) =>
  dateValue
    .toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    })
    .replace(/\s*([AP])M$/i, (_, marker) => `${String(marker || "").toLowerCase()}m`)
    .replace(/\s+/g, "");

const formatNextRunAbsolute = (value) => {
  const timestamp = Number(value || 0);
  if (!Number.isFinite(timestamp) || timestamp <= 0) return "—";
  const dateValue = new Date(timestamp);
  if (Number.isNaN(dateValue.getTime())) return "—";
  const nowValue = new Date();
  const tomorrowValue = new Date(nowValue);
  tomorrowValue.setDate(nowValue.getDate() + 1);
  const isToday = isSameCalendarDay(dateValue, nowValue);
  const isTomorrow = isSameCalendarDay(dateValue, tomorrowValue);
  const compactTime = formatCompactMeridiemTime(dateValue);
  if (isToday) return compactTime;
  if (isTomorrow) return `Tomorrow ${compactTime}`;
  return `${dateValue.toLocaleDateString()} ${compactTime}`;
};

export const CronJobDetail = ({
  job = null,
  runEntries = [],
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
  usageDays = 30,
  onSetUsageDays = () => {},
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
  const deliverySessionOptions = useMemo(() => {
    const seenLabels = new Set();
    const deduped = [];
    const selectedKey = String(destinationSessionKey || "").trim();
    let selectedPresent = false;
    (Array.isArray(deliverySessions) ? deliverySessions : []).forEach((sessionRow) => {
      const key = String(sessionRow?.key || "").trim();
      if (!key) return;
      if (key === selectedKey) selectedPresent = true;
      const label = String(sessionRow?.label || sessionRow?.key || "Session").trim();
      const dedupeKey = label.toLowerCase();
      if (seenLabels.has(dedupeKey)) return;
      seenLabels.add(dedupeKey);
      deduped.push(sessionRow);
    });
    if (!selectedPresent && selectedKey) {
      const selectedRow = (Array.isArray(deliverySessions) ? deliverySessions : []).find(
        (sessionRow) => String(sessionRow?.key || "").trim() === selectedKey,
      );
      if (selectedRow) deduped.unshift(selectedRow);
    }
    return deduped;
  }, [deliverySessions, destinationSessionKey]);
  const deliverySelectValue =
    deliveryMode === "announce" && String(destinationSessionKey || "").trim()
      ? String(destinationSessionKey || "")
      : kDeliveryNoneValue;
  const isRoutingDirty =
    sessionTarget !== currentSessionTarget ||
    wakeMode !== currentWakeMode ||
    deliveryMode !== currentDeliveryMode;
  const isPromptDirty = promptValue !== savedPromptValue;
  const hasUnsavedChanges = isRoutingDirty || isPromptDirty;

  return html`
    <div class="cron-detail-scroll">
      <div class="cron-detail-content">
        <section class="bg-surface border border-border rounded-xl p-4 space-y-3">
          <div class="flex items-center justify-between gap-3">
            <div>
              <h2 class="font-semibold text-base text-gray-100">${job.name || job.id}</h2>
              <div class="text-xs text-gray-500 mt-1">ID: <code>${job.id}</code></div>
            </div>
            <${ActionButton}
              onClick=${onSaveChanges}
              loading=${savingChanges}
              disabled=${!hasUnsavedChanges}
              tone="primary"
              size="sm"
              idleLabel="Save changes"
              loadingLabel="Saving..."
            />
          </div>
          <div class="grid grid-cols-2 gap-2 text-xs">
            <div class=${kMetaCardClassName}>
              <div class="text-gray-500">Schedule</div>
              <div class="text-gray-300 font-mono">
                ${formatCronScheduleLabel(job.schedule, {
                  includeTimeZoneWhenDifferent: true,
                })}
              </div>
            </div>
            <div class=${kMetaCardClassName}>
              <div class="text-gray-500">Next run</div>
              <div class="text-gray-300 font-mono">
                ${formatNextRunAbsolute(job?.state?.nextRunAtMs)}
                <span class="text-gray-500">
                  ${` (${formatNextRunRelativeMs(job?.state?.nextRunAtMs)})`}
                </span>
              </div>
            </div>
          </div>
          <div class="grid grid-cols-3 gap-2 text-xs">
            <div class=${kMetaCardClassName}>
              <div class="text-gray-500">Session target</div>
              <div class="pt-1">
                <${SegmentedControl}
                  options=${kSessionTargetOptions}
                  value=${sessionTarget}
                  onChange=${(value) =>
                    onChangeRoutingDraft((currentValue = {}) => ({
                      ...currentValue,
                      sessionTarget: String(value || "main"),
                    }))}
                />
              </div>
            </div>
            <div class=${kMetaCardClassName}>
              <div class="text-gray-500">Wake mode</div>
              <div class="pt-1">
                <${SegmentedControl}
                  options=${kWakeModeOptions}
                  value=${wakeMode}
                  onChange=${(value) =>
                    onChangeRoutingDraft((currentValue = {}) => ({
                      ...currentValue,
                      wakeMode: String(value || "now"),
                    }))}
                />
              </div>
            </div>
            <div class=${kMetaCardClassName}>
              <div class="text-gray-500">Delivery</div>
              <div class="pt-1">
                <select
                  value=${deliverySelectValue}
                  onInput=${(event) => {
                    const nextValue = String(event.currentTarget?.value || "");
                    if (!nextValue || nextValue === kDeliveryNoneValue) {
                      onChangeRoutingDraft((currentValue = {}) => ({
                        ...currentValue,
                        deliveryMode: "none",
                        deliveryChannel: "",
                        deliveryTo: "",
                      }));
                      onChangeDestinationSessionKey("");
                      return;
                    }
                    onChangeDestinationSessionKey(nextValue);
                    onChangeRoutingDraft((currentValue = {}) => ({
                      ...currentValue,
                      deliveryMode: "announce",
                    }));
                  }}
                  disabled=${savingChanges}
                  class="w-full bg-black/30 border border-border rounded-lg px-2 py-1.5 text-[11px] text-gray-200 focus:border-gray-500"
                >
                  <option value=${kDeliveryNoneValue}>None</option>
                  ${deliverySessionOptions.map(
                    (sessionRow) => html`
                      <option value=${String(sessionRow?.key || "")}>
                        ${String(sessionRow?.label || sessionRow?.key || "Session")}
                      </option>
                    `,
                  )}
                </select>
              </div>
              ${loadingDeliverySessions
                ? html`<div class="text-[11px] text-gray-500 pt-1">Loading delivery sessions...</div>`
                : null}
              ${deliverySessionsError
                ? html`<div class="text-[11px] text-red-400 pt-1">${deliverySessionsError}</div>`
                : null}
            </div>
          </div>
          <div class="flex items-center justify-between gap-3">
            <${ToggleSwitch}
              checked=${job.enabled !== false}
              disabled=${togglingJobEnabled || savingChanges}
              onChange=${onToggleEnabled}
              label=${job.enabled === false ? "Disabled" : "Enabled"}
            />
            <${ActionButton}
              onClick=${onRunNow}
              loading=${runningJob}
              disabled=${hasUnsavedChanges || savingChanges}
              tone="secondary"
              size="sm"
              idleLabel="Run now"
              loadingLabel="Running..."
            />
          </div>
        </section>

        <${PromptEditor}
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

        <${CronRunHistoryPanel}
          entryCountLabel=${`${formatTokenCount(runTotal)} entries`}
          primaryFilterOptions=${kRunStatusFilterOptions}
          primaryFilterValue=${runStatusFilter}
          onChangePrimaryFilter=${onSetRunStatusFilter}
          rows=${runEntries}
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
