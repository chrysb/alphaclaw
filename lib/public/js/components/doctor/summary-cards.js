import { h } from "preact";
import htm from "htm";
import { SummaryStatCard } from "../summary-stat-card.js";
import { buildDoctorPriorityCounts } from "./helpers.js";

const html = htm.bind(h);

export const DoctorSummaryCards = ({ cards = [] }) => {
  const counts = buildDoctorPriorityCounts(cards);
  return html`
    <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
      <${SummaryStatCard} title="Open Findings" value=${cards.length} />
      <${SummaryStatCard} title="P0" value=${counts.P0} toneClassName="text-status-error-muted" />
      <${SummaryStatCard} title="P1" value=${counts.P1} toneClassName="text-status-warning-muted" />
      <${SummaryStatCard} title="P2" value=${counts.P2} toneClassName="text-body" />
    </div>
  `;
};
