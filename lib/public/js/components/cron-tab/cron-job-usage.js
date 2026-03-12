import { h } from "https://esm.sh/preact";
import htm from "https://esm.sh/htm";
import { formatCost, formatTokenCount } from "./cron-helpers.js";

const html = htm.bind(h);

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
  const averageTokensPerRun = totalRuns > 0 ? Math.round(totalTokens / totalRuns) : 0;
  return html`
    <section class="bg-surface border border-border rounded-xl p-4 space-y-3">
      <div class="flex items-center justify-between gap-2">
        <h3 class="card-label">Usage</h3>
        <div class="flex items-center gap-1">
          ${[7, 30].map(
            (days) => html`
              <button
                type="button"
                class=${`text-xs px-2 py-1 rounded border ${
                  usageDays === days
                    ? "border-cyan-400 text-cyan-200 bg-cyan-400/10"
                    : "border-border text-gray-400 hover:text-gray-200"
                }`}
                onclick=${() => onSetUsageDays(days)}
              >
                ${days}d
              </button>
            `,
          )}
        </div>
      </div>
      <div class="grid grid-cols-2 gap-2 text-xs">
        <div class="ac-surface-inset rounded-lg p-2">
          <div class="text-gray-500">Total tokens</div>
          <div class="text-gray-200 font-mono">${formatTokenCount(totals.totalTokens)}</div>
        </div>
        <div class="ac-surface-inset rounded-lg p-2">
          <div class="text-gray-500">Estimated cost</div>
          <div class="text-gray-200 font-mono">${formatCost(totals.totalCost)}</div>
        </div>
        <div class="ac-surface-inset rounded-lg p-2">
          <div class="text-gray-500">Runs</div>
          <div class="text-gray-200 font-mono">${formatTokenCount(totals.runCount)}</div>
        </div>
        <div class="ac-surface-inset rounded-lg p-2">
          <div class="text-gray-500">Avg tokens/run</div>
          <div class="text-gray-200 font-mono">${formatTokenCount(averageTokensPerRun)}</div>
        </div>
      </div>
      <div class="text-xs text-gray-500">
        Dominant model:
        <span class="text-gray-300 font-mono">${resolveDominantModel(usage)}</span>
      </div>
    </section>
  `;
};
