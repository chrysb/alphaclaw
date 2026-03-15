import { h } from "https://esm.sh/preact";
import htm from "https://esm.sh/htm";

const html = htm.bind(h);

export const SummaryStatCard = ({
  title = "",
  value = "—",
  toneClassName = "",
  valueClassName = "text-lg font-semibold text-gray-200",
  monospace = false,
} = {}) => html`
  <div class="bg-surface border border-border rounded-xl p-4">
    <h3 class="card-label text-xs">${title}</h3>
    <div class=${`${valueClassName} mt-2 ${monospace ? "font-mono" : ""} ${toneClassName}`}>${value}</div>
  </div>
`;
