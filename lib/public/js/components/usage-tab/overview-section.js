import { h } from "https://esm.sh/preact";
import { useEffect, useState } from "https://esm.sh/preact/hooks";
import htm from "https://esm.sh/htm";
import {
  formatCompactNumber,
  formatInteger,
  formatUsd,
} from "../../lib/format.js";
import { SegmentedControl } from "../segmented-control.js";
import { kRangeOptions, kUsageSourceOrder } from "./constants.js";
import { renderSourceLabel } from "./formatters.js";

const html = htm.bind(h);

const formatCountLabel = (value, singular, plural) => {
  const count = Number(value || 0);
  const label = count === 1 ? singular : plural;
  return `${formatInteger(count)} ${label}`;
};

const formatPercent = (ratio) => `${(Number(ratio || 0) * 100).toFixed(1)}%`;

const getCacheHitRateValueClass = (ratio) => {
  const percent = Number(ratio || 0) * 100;
  if (percent <= 0) return "text-gray-300";
  if (percent >= 70) return "text-green-400";
  if (percent >= 40) return "text-amber-300";
  return "text-red-400";
};

const getOverviewMetrics = (summary) => {
  const totals = summary?.totals || {};
  const cacheReadTokens = Number(totals.cacheReadTokens || 0);
  const cacheWriteTokens = Number(totals.cacheWriteTokens || 0);
  const inputTokens = Number(totals.inputTokens || 0);
  const promptTokens = inputTokens + cacheReadTokens + cacheWriteTokens;
  const turnCount = Number(totals.turnCount || 0);
  const totalTokens = Number(totals.totalTokens || 0);
  const totalCost = Number(totals.totalCost || 0);
  return {
    cacheHitRate: promptTokens > 0 ? cacheReadTokens / promptTokens : 0,
    cacheReadTokens,
    promptTokens,
    avgTokensPerTurn: turnCount > 0 ? totalTokens / turnCount : 0,
    avgCostPerTurn: turnCount > 0 ? totalCost / turnCount : 0,
    turnCount,
  };
};

const SummaryCard = ({ title, tokens, cost }) => html`
  <div class="bg-surface border border-border rounded-xl p-4">
    <h3 class="card-label text-xs">${title}</h3>
    <div class="text-lg font-semibold mt-1">
      ${formatInteger(tokens)}
      <span class="text-xs text-[var(--text-muted)] ml-1">tokens</span>
    </div>
    <div class="text-xs text-[var(--text-muted)] mt-1">${formatUsd(cost)}</div>
  </div>
`;

const MetricCard = ({
  title,
  value,
  detail = "",
  valueClass = "",
  valueSuffix = "",
}) => html`
  <div class="bg-surface border border-border rounded-xl p-4">
    <h3 class="card-label text-xs">${title}</h3>
    <div class=${`text-lg font-semibold mt-1 ${valueClass}`.trim()}>
      ${value}
      ${valueSuffix
        ? html`<span class="text-xs text-[var(--text-muted)] ml-1">${valueSuffix}</span>`
        : null}
    </div>
    <div class="text-xs text-[var(--text-muted)] mt-1">${detail}</div>
  </div>
`;

const AgentCostDistribution = ({ summary }) => {
  const agents = Array.isArray(summary?.costByAgent?.agents)
    ? summary.costByAgent.agents
    : [];
  const missingPricingModels = Array.from(
    new Set(
      (summary?.daily || [])
        .flatMap((dayRow) => dayRow?.models || [])
        .filter(
          (modelRow) =>
            !modelRow?.pricingFound && Number(modelRow?.totalTokens || 0) > 0,
        )
        .map(
          (modelRow) =>
            String(modelRow?.model || "unknown").trim() || "unknown",
        ),
    ),
  ).sort((leftValue, rightValue) => leftValue.localeCompare(rightValue));
  const missingPricingPreview = missingPricingModels.slice(0, 3).join(", ");
  const hasMoreMissingPricingModels = missingPricingModels.length > 3;
  const missingPricingLabel = missingPricingModels.length
    ? hasMoreMissingPricingModels
      ? `${missingPricingPreview}, +${missingPricingModels.length - 3} more`
      : missingPricingPreview
    : "";
  const [selectedAgent, setSelectedAgent] = useState(() =>
    String(agents[0]?.agent || ""),
  );
  useEffect(() => {
    if (agents.length === 0) {
      if (selectedAgent) setSelectedAgent("");
      return;
    }
    const hasSelectedAgent = agents.some(
      (row) => String(row.agent || "") === selectedAgent,
    );
    if (!hasSelectedAgent) setSelectedAgent(String(agents[0]?.agent || ""));
  }, [agents, selectedAgent]);
  const selectedAgentRow =
    agents.find((row) => String(row.agent || "") === selectedAgent) ||
    agents[0] ||
    null;

  return html`
    <div class="bg-surface border border-border rounded-xl p-4">
      ${agents.length === 0
        ? html`
            <div
              class="flex flex-wrap items-start sm:items-center justify-between gap-3 mb-3"
            >
              <h2 class="card-label text-xs">Estimated cost breakdown</h2>
            </div>
            <p class="text-xs text-gray-500">
              No agent usage recorded for this range.
            </p>
          `
        : html`
            <div class="space-y-3">
              <div
                class="flex flex-wrap items-start sm:items-center justify-between gap-3"
              >
                <h2 class="card-label text-xs">Estimated cost breakdown</h2>
                <div
                  class="inline-flex flex-wrap items-center gap-3 text-xs text-gray-500"
                >
                  <label
                    class="inline-flex items-center gap-2 text-xs text-gray-500"
                  >
                    <select
                      class="bg-black/30 border border-border rounded-lg text-xs px-2.5 py-1.5 text-gray-200 focus:border-gray-500"
                      value=${String(selectedAgentRow?.agent || "")}
                      onChange=${(e) =>
                        setSelectedAgent(String(e.currentTarget?.value || ""))}
                    >
                      ${agents.map(
                        (agentRow) => html`
                          <option value=${String(agentRow.agent || "")}>
                            ${String(agentRow.agent || "unknown")}
                          </option>
                        `,
                      )}
                    </select>
                  </label>
                </div>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
                ${kUsageSourceOrder.map((sourceName) => {
                  const sourceRow = (
                    selectedAgentRow?.sourceBreakdown || []
                  ).find((row) => String(row.source || "") === sourceName) || {
                    source: sourceName,
                    totalCost: 0,
                    totalTokens: 0,
                    turnCount: 0,
                  };
                  return html`
                    <div class="ac-surface-inset px-2.5 py-2">
                      <p class="text-[11px] text-gray-500">
                        ${renderSourceLabel(sourceRow.source)}
                      </p>
                      <p class="text-xs text-gray-300 mt-0.5">
                        ${formatUsd(sourceRow.totalCost)}
                      </p>
                      <p class="text-[11px] text-gray-500 mt-0.5">
                        ${formatInteger(sourceRow.totalTokens)} tok ·
                        ${formatCountLabel(
                          sourceRow.turnCount,
                          "turn",
                          "turns",
                        )}
                      </p>
                    </div>
                  `;
                })}
              </div>
            </div>
          `}
      ${missingPricingModels.length
        ? html`
            <div class="mt-3">
              <p class="text-[11px] text-gray-500">
                <span>
                  . Missing model pricing for ${missingPricingModels.length}
                  ${missingPricingModels.length === 1 ? "model" : "models"}:
                  ${missingPricingLabel}.
                </span>
              </p>
            </div>
          `
        : null}
    </div>
  `;
};

export const OverviewSection = ({
  summary = null,
  periodSummary,
  metric = "tokens",
  days = 30,
  overviewCanvasRef,
  onDaysChange = () => {},
  onMetricChange = () => {},
}) => {
  const overviewMetrics = getOverviewMetrics(summary);

  return html`
    <div class="space-y-4">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        <${SummaryCard}
          title="Today"
          tokens=${periodSummary.today.tokens}
          cost=${periodSummary.today.cost}
        />
        <${SummaryCard}
          title="Last 7 days"
          tokens=${periodSummary.week.tokens}
          cost=${periodSummary.week.cost}
        />
        <${SummaryCard}
          title="Last 30 days"
          tokens=${periodSummary.month.tokens}
          cost=${periodSummary.month.cost}
        />
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        <${MetricCard}
          title="Cache hit rate"
          value=${formatPercent(overviewMetrics.cacheHitRate)}
          valueClass=${getCacheHitRateValueClass(overviewMetrics.cacheHitRate)}
          detail=${`${formatCompactNumber(overviewMetrics.cacheReadTokens)} cached · ${formatCompactNumber(overviewMetrics.promptTokens)} prompt`}
        />
        <${MetricCard}
          title="Avg tokens per turn"
          value=${formatCompactNumber(overviewMetrics.avgTokensPerTurn)}
          valueSuffix="tokens"
          detail=${`${formatCountLabel(overviewMetrics.turnCount, "turn", "turns")} last ${days} days`}
        />
        <${MetricCard}
          title="Avg cost per turn"
          value=${formatUsd(overviewMetrics.avgCostPerTurn)}
          detail=${`${formatCountLabel(overviewMetrics.turnCount, "turn", "turns")} last ${days} days`}
        />
      </div>
      <div class="bg-surface border border-border rounded-xl p-4">
        <div
          class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3"
        >
          <h2 class="card-label text-xs">
            Daily ${metric === "tokens" ? "tokens" : "cost"} by model
          </h2>
          <div class="flex items-center gap-2">
            <${SegmentedControl}
              options=${kRangeOptions.map((option) => ({
                label: option.label,
                value: option.value,
              }))}
              value=${days}
              onChange=${onDaysChange}
            />
            <${SegmentedControl}
              options=${[
                { label: "tokens", value: "tokens" },
                { label: "cost", value: "cost" },
              ]}
              value=${metric}
              onChange=${onMetricChange}
            />
          </div>
        </div>
        <div style=${{ height: "280px" }}>
          <canvas ref=${overviewCanvasRef}></canvas>
        </div>
      </div>
      <${AgentCostDistribution} summary=${summary} />
    </div>
  `;
};
