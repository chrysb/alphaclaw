import { h } from "preact";
import htm from "htm";

const html = htm.bind(h);

export const PageHeader = ({ title = "", actions = null, leading = null }) => html`
  <div class="flex items-center justify-between gap-3">
    <div>
      ${leading || html`<h2 class="font-semibold text-base">${title}</h2>`}
    </div>
    <div class="flex items-center gap-2">${actions}</div>
  </div>
`;
