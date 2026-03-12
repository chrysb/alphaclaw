import { h } from "https://esm.sh/preact";
import { useEffect, useMemo, useRef, useState } from "https://esm.sh/preact/hooks";
import htm from "https://esm.sh/htm";
import { ActionButton } from "../action-button.js";
import { ToggleSwitch } from "../toggle-switch.js";
import { EditorSurface } from "../file-viewer/editor-surface.js";
import { countTextLines, shouldUseSimpleEditorMode } from "../file-viewer/utils.js";
import {
  kLargeFileSimpleEditorCharThreshold,
  kLargeFileSimpleEditorLineThreshold,
} from "../file-viewer/constants.js";
import { highlightEditorLines } from "../../lib/syntax-highlighters/index.js";
import { formatDurationCompactMs, formatLocaleDateTimeWithTodayTime } from "../../lib/format.js";
import {
  formatCronScheduleLabel,
  formatNextRunRelativeMs,
  formatTokenCount,
} from "./cron-helpers.js";
import { CronJobUsage } from "./cron-job-usage.js";
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
  onSavePrompt = () => {},
  savingPrompt = false,
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
      onSavePrompt();
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
        <div class="flex items-center gap-2">
          <${ActionButton}
            onClick=${onSavePrompt}
            disabled=${!isDirty}
            loading=${savingPrompt}
            tone="primary"
            size="sm"
            idleLabel="Save"
            loadingLabel="Saving..."
          />
        </div>
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

const runStatusClassName = (status) => {
  const normalized = String(status || "").trim().toLowerCase();
  if (normalized === "ok") return "text-green-300";
  if (normalized === "error") return "text-red-300";
  if (normalized === "skipped") return "text-yellow-300";
  return "text-gray-400";
};

const runDeliveryLabel = (run) => String(run?.deliveryStatus || "not-requested");
const kMetaCardClassName = "ac-surface-inset rounded-lg p-2.5 space-y-1.5";
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
  runDeliveryFilter = "all",
  onSetRunStatusFilter = () => {},
  onSetRunDeliveryFilter = () => {},
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
  onSavePrompt = () => {},
  savingPrompt = false,
}) => {
  if (!job) {
    return html`
      <div class="h-full flex items-center justify-center text-sm text-gray-500">
        Select a cron job to view details.
      </div>
    `;
  }

  return html`
    <div class="cron-detail-scroll">
      <div class="cron-detail-content">
        <section class="bg-surface border border-border rounded-xl p-4 space-y-3">
          <div class="flex items-center justify-between gap-3">
            <div>
              <h2 class="font-semibold text-base text-gray-100">${job.name || job.id}</h2>
              <div class="text-xs text-gray-500 mt-1">ID: <code>${job.id}</code></div>
            </div>
            <div class="flex items-center gap-2">
              <${ToggleSwitch}
                checked=${job.enabled !== false}
                disabled=${togglingJobEnabled}
                onChange=${onToggleEnabled}
                label=${job.enabled === false ? "Disabled" : "Enabled"}
              />
              <${ActionButton}
                onClick=${onRunNow}
                loading=${runningJob}
                tone="secondary"
                size="sm"
                idleLabel="Run Now"
                loadingLabel="Running..."
              />
            </div>
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
              <div class="text-gray-300 font-mono">${job.sessionTarget || "main"}</div>
            </div>
            <div class=${kMetaCardClassName}>
              <div class="text-gray-500">Wake mode</div>
              <div class="text-gray-300 font-mono">${job.wakeMode || "now"}</div>
            </div>
            <div class=${kMetaCardClassName}>
              <div class="text-gray-500">Delivery</div>
              <div class="text-gray-300 font-mono">
                ${String(job?.delivery?.mode || "none")}
                ${job?.delivery?.channel
                  ? html`- ${job.delivery.channel}${job?.delivery?.to
                      ? `:${job.delivery.to}`
                      : ""}`
                  : ""}
              </div>
            </div>
          </div>
        </section>

        <${PromptEditor}
          promptValue=${promptValue}
          savedPromptValue=${savedPromptValue}
          onChangePrompt=${onChangePrompt}
          onSavePrompt=${onSavePrompt}
          savingPrompt=${savingPrompt}
        />

        <${CronJobUsage}
          usage=${usage}
          usageDays=${usageDays}
          onSetUsageDays=${onSetUsageDays}
        />

        <section class="bg-surface border border-border rounded-xl p-4 space-y-3">
          <div class="flex items-center justify-between gap-2">
            <h3 class="card-label">Run history</h3>
            <div class="text-xs text-gray-500">${formatTokenCount(runTotal)} entries</div>
          </div>
          <div class="flex items-center gap-2">
            ${["all", "ok", "error", "skipped"].map(
              (status) => html`
                <button
                  type="button"
                  class=${`text-xs px-2 py-1 rounded border ${
                    runStatusFilter === status
                      ? "border-cyan-400 text-cyan-200 bg-cyan-400/10"
                      : "border-border text-gray-400 hover:text-gray-200"
                  }`}
                  onclick=${() => onSetRunStatusFilter(status)}
                >
                  ${status}
                </button>
              `,
            )}
            ${["all", "delivered", "not-delivered"].map(
              (status) => html`
                <button
                  type="button"
                  class=${`text-xs px-2 py-1 rounded border ${
                    runDeliveryFilter === status
                      ? "border-cyan-400 text-cyan-200 bg-cyan-400/10"
                      : "border-border text-gray-400 hover:text-gray-200"
                  }`}
                  onclick=${() => onSetRunDeliveryFilter(status)}
                >
                  ${status}
                </button>
              `,
            )}
          </div>

          ${runEntries.length === 0
            ? html`<div class="text-sm text-gray-500">No runs found.</div>`
            : html`
                <div class="ac-history-list">
                  ${runEntries.map(
                    (entry) => html`
                      <details key=${`${entry.ts}:${entry.sessionKey || ""}`} class="ac-history-item">
                        <summary class="ac-history-summary">
                          <div class="ac-history-summary-row">
                            <span class="inline-flex items-center gap-2 min-w-0">
                              <span class="ac-history-toggle shrink-0" aria-hidden="true">▸</span>
                              <span class="truncate text-xs text-gray-300">
                                ${formatLocaleDateTimeWithTodayTime(entry.ts, {
                                  fallback: "—",
                                  valueIsEpochMs: true,
                                })}
                              </span>
                            </span>
                            <span class="inline-flex items-center gap-3 shrink-0 text-xs">
                              <span class=${runStatusClassName(entry.status)}>${entry.status || "unknown"}</span>
                              <span class="text-gray-400">${formatDurationCompactMs(entry.durationMs)}</span>
                              <span class="text-gray-400">
                                ${formatTokenCount(entry?.usage?.total_tokens || 0)} tk
                              </span>
                              <span class="text-gray-500">${runDeliveryLabel(entry)}</span>
                            </span>
                          </div>
                        </summary>
                        <div class="ac-history-body space-y-2 text-xs">
                          ${entry.summary
                            ? html`<div><span class="text-gray-500">Summary:</span> ${entry.summary}</div>`
                            : null}
                          ${entry.error
                            ? html`<div class="text-red-300"><span class="text-gray-500">Error:</span> ${entry.error}</div>`
                            : null}
                          <div class="text-gray-500">
                            Model: <span class="text-gray-300 font-mono">${entry.model || "—"}</span>
                            ${entry.sessionKey
                              ? html` | Session:
                                  <span class="text-gray-300 font-mono">${entry.sessionKey}</span>`
                              : null}
                          </div>
                        </div>
                      </details>
                    `,
                  )}
                </div>
              `}
          ${runHasMore
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
        </section>
      </div>
    </div>
  `;
};
