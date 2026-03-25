import { h } from "preact";
import htm from "htm";
import { formatCost, formatTokenCount } from "./cron-helpers.js";
import { formatDurationCompactMs } from "../../lib/format.js";
import { SegmentedControl } from "../segmented-control.js";

const html = htm.bind(h);
const kUsageRangeOptions = [
  { label: "7d", value: 7 },
  { label: "30d", value: 30 },
];

const resolveDominantModel = (usage = null) => {
  const list = Array.isArray(usage?.modelBreakdown) ? usage.modelBreakdown : [];
  if (list.length === 0) return "—";
  const first = list[0];
  const model = String(first?.model || "").trim();
  const provider = String(first?.provider || "").trim();
  if (!model && !provider) return "—";
  if (!provider) return model;
  if (!model) return provider;
  return `${provider} / ${model}`;
};

export const CronJobUsage = ({ usage = null, usageDays = 30, onSetUsageDays = () => {} }) => {
  const totals = usage?.totals || {};
  const totalRuns = Number(totals?.runCount || 0);
  const totalTokens = Number(totals?.totalTokens || 0);
  const totalCost = Number(totals?.totalCost || 0);
  const averageDurationMs = Number(totals?.avgDurationMs || 0);
  const averageTokensPerRun = totalRuns > 0 ? Math.round(totalTokens / totalRuns) : 0;
  const averageCostPerRun = totalRuns > 0 ? totalCost / totalRuns : 0;
  return html`
    <section class="bg-surface border border-border rounded-xl p-4 space-y-3">
      <div class="flex items-center justify-between gap-2">
        <h3 class="card-label card-label-bright">Usage</h3>
        <${SegmentedControl}
          options=${kUsageRangeOptions}
          value=${usageDays}
          onChange=${onSetUsageDays}
        />
      </div>
      <div class="grid grid-cols-3 gap-2 text-xs">
        <div class="ac-surface-inset rounded-lg p-2">
          <div class="text-fg-muted">Total runs</div>
          <div class="text-body font-mono">${formatTokenCount(totalRuns)}</div>
        </div>
        <div class="ac-surface-inset rounded-lg p-2">
          <div class="text-fg-muted">Total tokens</div>
          <div class="text-body font-mono">${formatTokenCount(totalTokens)}</div>
        </div>
        <div class="ac-surface-inset rounded-lg p-2">
          <div class="text-fg-muted">Total cost</div>
          <div class="text-body font-mono">${formatCost(totalCost)}</div>
        </div>
        <div class="ac-surface-inset rounded-lg p-2">
          <div class="text-fg-muted">Avg run time</div>
          <div class="text-body font-mono">
            ${averageDurationMs > 0 ? formatDurationCompactMs(averageDurationMs) : "—"}
          </div>
        </div>
        <div class="ac-surface-inset rounded-lg p-2">
          <div class="text-fg-muted">Avg tokens/run</div>
          <div class="text-body font-mono">${formatTokenCount(averageTokensPerRun)}</div>
        </div>
        <div class="ac-surface-inset rounded-lg p-2">
          <div class="text-fg-muted">Avg cost/run</div>
          <div class="text-body font-mono">${formatCost(averageCostPerRun)}</div>
        </div>
      </div>
      <div class="text-xs text-fg-muted">
        Dominant model:${" "}
        <span class="text-body font-mono">${resolveDominantModel(usage)}</span>
      </div>
    </section>
  `;
};
