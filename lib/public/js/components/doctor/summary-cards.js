import { h } from "https://esm.sh/preact";
import htm from "https://esm.sh/htm";
import { buildDoctorPriorityCounts } from "./helpers.js";

const html = htm.bind(h);

const SummaryCard = ({ title = "", value = 0, toneClassName = "" }) => html`
  <div class="bg-surface border border-border rounded-xl p-4">
    <h3 class="card-label text-xs">${title}</h3>
    <div class=${`text-lg font-semibold mt-1 ${toneClassName}`}>${value}</div>
  </div>
`;

export const DoctorSummaryCards = ({ cards = [] }) => {
  const counts = buildDoctorPriorityCounts(cards);
  return html`
    <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
      <${SummaryCard} title="Open Findings" value=${cards.length} />
      <${SummaryCard} title="P0" value=${counts.P0} toneClassName="text-red-400" />
      <${SummaryCard} title="P1" value=${counts.P1} toneClassName="text-yellow-400" />
      <${SummaryCard} title="P2" value=${counts.P2} toneClassName="text-gray-300" />
    </div>
  `;
};
