import { h } from "preact";
import { useMemo } from "preact/hooks";
import htm from "htm";
import { ActionButton } from "../action-button.js";
import { SegmentedControl } from "../segmented-control.js";
import { ToggleSwitch } from "../toggle-switch.js";
import { getSessionDisplayLabel } from "../../lib/session-keys.js";
import {
  formatCronScheduleLabel,
  formatNextRunRelativeMs,
} from "./cron-helpers.js";

const html = htm.bind(h);
const kMetaCardClassName = "ac-surface-inset rounded-lg p-2.5 space-y-1.5";
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
    .replace(/\s*([AP])M$/i, (_, marker) =>
      `${String(marker || "").toLowerCase()}m`,
    )
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

export const CronJobSettingsCard = ({
  job = null,
  routingDraft = null,
  onChangeRoutingDraft = () => {},
  destinationSessionKey = "",
  onChangeDestinationSessionKey = () => {},
  deliverySessions = [],
  loadingDeliverySessions = false,
  deliverySessionsError = "",
  savingChanges = false,
  togglingJobEnabled = false,
  onToggleEnabled = () => {},
  onRunNow = () => {},
  runningJob = false,
  hasUnsavedChanges = false,
}) => {
  if (!job) return null;

  const sessionTarget = String(
    routingDraft?.sessionTarget || job?.sessionTarget || "main",
  );
  const wakeMode = String(routingDraft?.wakeMode || job?.wakeMode || "now");
  const deliveryMode = String(
    routingDraft?.deliveryMode || job?.delivery?.mode || "none",
  );
  const deliverySessionOptions = useMemo(() => {
    const seenLabels = new Set();
    const deduped = [];
    const selectedKey = String(destinationSessionKey || "").trim();
    let selectedPresent = false;
    (Array.isArray(deliverySessions) ? deliverySessions : []).forEach(
      (sessionRow) => {
        const key = String(sessionRow?.key || "").trim();
        if (!key) return;
        if (key === selectedKey) selectedPresent = true;
        const label = String(
          getSessionDisplayLabel(sessionRow) ||
            sessionRow?.key ||
            "Session",
        ).trim();
        const dedupeKey = label.toLowerCase();
        if (seenLabels.has(dedupeKey)) return;
        seenLabels.add(dedupeKey);
        deduped.push(sessionRow);
      },
    );
    if (!selectedPresent && selectedKey) {
      const selectedRow = (
        Array.isArray(deliverySessions) ? deliverySessions : []
      ).find((sessionRow) => String(sessionRow?.key || "").trim() === selectedKey);
      if (selectedRow) deduped.unshift(selectedRow);
    }
    return deduped;
  }, [deliverySessions, destinationSessionKey]);
  const deliverySelectValue =
    deliveryMode === "announce" && String(destinationSessionKey || "").trim()
      ? String(destinationSessionKey || "")
      : kDeliveryNoneValue;

  return html`
    <section class="bg-surface border border-border rounded-xl p-4 space-y-3">
      <div class="flex items-center justify-between gap-3">
        <div class="text-xs text-fg-muted">ID: <code>${job.id}</code></div>
      </div>
      <div class="grid grid-cols-2 gap-2 text-xs">
        <div class=${kMetaCardClassName}>
          <div class="text-fg-muted">Schedule</div>
          <div class="text-body font-mono">
            ${formatCronScheduleLabel(job.schedule, {
              includeTimeZoneWhenDifferent: true,
            })}
          </div>
        </div>
        <div class=${kMetaCardClassName}>
          <div class="text-fg-muted">Next run</div>
          <div class="text-body font-mono">
            ${formatNextRunAbsolute(job?.state?.nextRunAtMs)}
            <span class="text-fg-muted">
              ${` (${formatNextRunRelativeMs(job?.state?.nextRunAtMs)})`}
            </span>
          </div>
        </div>
      </div>
      <div class="grid grid-cols-3 gap-2 text-xs">
        <div class=${kMetaCardClassName}>
          <div class="text-fg-muted">Session target</div>
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
          <div class="text-fg-muted">Wake mode</div>
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
          <div class="text-fg-muted">Delivery</div>
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
              class="w-full bg-field border border-border rounded-lg px-2 py-1.5 text-[11px] text-body focus:border-fg-muted"
            >
              <option value=${kDeliveryNoneValue}>None</option>
              ${deliverySessionOptions.map(
                (sessionRow) => html`
                  <option value=${String(sessionRow?.key || "")}>
                    ${String(
                      getSessionDisplayLabel(sessionRow) ||
                        sessionRow?.key ||
                        "Session",
                    )}
                  </option>
                `,
              )}
            </select>
          </div>
          ${loadingDeliverySessions
            ? html`<div class="text-[11px] text-fg-muted pt-1">
                Loading delivery sessions...
              </div>`
            : null}
          ${deliverySessionsError
            ? html`<div class="text-[11px] text-status-error-muted pt-1">
                ${deliverySessionsError}
              </div>`
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
  `;
};
