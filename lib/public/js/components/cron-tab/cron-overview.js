import { h } from "https://esm.sh/preact";
import htm from "https://esm.sh/htm";
import {
  buildCronOptimizationWarnings,
  formatRelativeMs,
  getNextScheduledRunAcrossJobs,
} from "./cron-helpers.js";

const html = htm.bind(h);

const warningClassName = (tone) => {
  if (tone === "error") return "border-red-900 bg-red-950/30 text-red-200";
  if (tone === "warning") return "border-yellow-900 bg-yellow-950/30 text-yellow-100";
  return "border-border bg-black/20 text-gray-200";
};

export const CronOverview = ({ jobs = [], status = null }) => {
  const enabledCount = jobs.filter((job) => job.enabled !== false).length;
  const disabledCount = jobs.length - enabledCount;
  const nextRunMs = getNextScheduledRunAcrossJobs(jobs);
  const warnings = buildCronOptimizationWarnings(jobs);

  return html`
    <div class="cron-detail-scroll">
      <div class="cron-detail-content">
        <section class="bg-surface border border-border rounded-xl p-4 space-y-3">
          <h2 class="font-semibold text-base">All Jobs</h2>
          <div class="grid grid-cols-3 gap-2 text-xs">
            <div class="ac-surface-inset rounded-lg p-2">
              <div class="text-gray-500">Total jobs</div>
              <div class="text-gray-200 font-mono">${jobs.length}</div>
            </div>
            <div class="ac-surface-inset rounded-lg p-2">
              <div class="text-gray-500">Enabled</div>
              <div class="text-gray-200 font-mono">${enabledCount}</div>
            </div>
            <div class="ac-surface-inset rounded-lg p-2">
              <div class="text-gray-500">Disabled</div>
              <div class="text-gray-200 font-mono">${disabledCount}</div>
            </div>
          </div>
          <div class="text-xs text-gray-500">
            Next scheduled run:
            <span class="text-gray-300 font-mono">
              ${nextRunMs ? formatRelativeMs(nextRunMs) : "—"}
            </span>
            ${status?.nextWakeAtMs ? html` | scheduler wake: ${formatRelativeMs(status.nextWakeAtMs)}` : null}
          </div>
        </section>

        <section class="bg-surface border border-border rounded-xl p-4 space-y-3">
          <h3 class="card-label">Optimization Warnings</h3>
          ${warnings.length === 0
            ? html`
                <div class="text-sm text-gray-500">
                  No immediate warnings found. Charts and richer optimization analysis will be added in a follow-up.
                </div>
              `
            : html`
                <div class="space-y-2">
                  ${warnings.map(
                    (warning) => html`
                      <div class=${`rounded-lg border p-3 text-xs ${warningClassName(warning.tone)}`}>
                        <div class="font-medium">${warning.title}</div>
                        <div class="mt-1 opacity-90">${warning.body}</div>
                      </div>
                    `,
                  )}
                </div>
              `}
        </section>
      </div>
    </div>
  `;
};
