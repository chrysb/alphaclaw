import { h } from "https://esm.sh/preact";
import htm from "https://esm.sh/htm";
import { SummaryStatCard } from "../summary-stat-card.js";
import { buildDoctorPriorityCounts } from "./helpers.js";

const html = htm.bind(h);

export const DoctorSummaryCards = ({ cards = [] }) => {
  const counts = buildDoctorPriorityCounts(cards);
  return html`
    <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
      <${SummaryStatCard} title="Open Findings" value=${cards.length} />
      <${SummaryStatCard} title="P0" value=${counts.P0} toneClassName="text-red-400" />
      <${SummaryStatCard} title="P1" value=${counts.P1} toneClassName="text-yellow-400" />
      <${SummaryStatCard} title="P2" value=${counts.P2} toneClassName="text-gray-300" />
    </div>
  `;
};
