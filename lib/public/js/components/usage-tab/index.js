import { h } from "https://esm.sh/preact";
import htm from "https://esm.sh/htm";
import { ActionButton } from "../action-button.js";
import { PageHeader } from "../page-header.js";
import { OverviewSection } from "./overview-section.js";
import { SessionsSection } from "./sessions-section.js";
import { useUsageTab } from "./use-usage-tab.js";

const html = htm.bind(h);

export const UsageTab = ({ sessionId = "" }) => {
  const { state, actions } = useUsageTab({ sessionId });

  const handleToggleSession = (itemSessionId, isOpen) => {
    if (isOpen) {
      actions.setExpandedSessionIds((currentValue) =>
        currentValue.includes(itemSessionId) ? currentValue : [...currentValue, itemSessionId],
      );
      if (!state.sessionDetailById[itemSessionId] && !state.loadingDetailById[itemSessionId]) {
        actions.loadSessionDetail(itemSessionId);
      }
      return;
    }
    actions.setExpandedSessionIds((currentValue) =>
      currentValue.filter((value) => value !== itemSessionId),
    );
  };

  return html`
    <div class="space-y-4">
      <${PageHeader}
        title="Usage"
        actions=${html`
          <${ActionButton}
            onClick=${actions.loadSummary}
            loading=${state.loadingSummary}
            tone="secondary"
            size="sm"
            idleLabel="Refresh"
            loadingMode="inline"
          />
        `}
      />
      ${state.error
        ? html`<div class="text-xs text-red-300 bg-red-950/30 border border-red-900 rounded px-3 py-2">
            ${state.error}
          </div>`
        : null}
      ${state.loadingSummary && !state.summary
        ? html`<div class="text-sm text-[var(--text-muted)]">Loading usage summary...</div>`
        : html`
            <${OverviewSection}
              summary=${state.summary}
              periodSummary=${state.periodSummary}
              metric=${state.metric}
              breakdown=${state.breakdown}
              days=${state.days}
              overviewCanvasRef=${state.overviewCanvasRef}
              onDaysChange=${actions.setDays}
              onMetricChange=${actions.setMetric}
              onBreakdownChange=${actions.setBreakdown}
            />
          `}
      <${SessionsSection}
        sessions=${state.sessions}
        loadingSessions=${state.loadingSessions}
        expandedSessionIds=${state.expandedSessionIds}
        loadingDetailById=${state.loadingDetailById}
        sessionDetailById=${state.sessionDetailById}
        onToggleSession=${handleToggleSession}
      />
    </div>
  `;
};
