import { h } from "https://esm.sh/preact";
import htm from "https://esm.sh/htm";
import { Models } from "../models-tab/index.js";

const html = htm.bind(h);

export const ModelsRoute = ({ onRestartRequired = () => {} }) => html`
  <div class="pt-4">
    <${Models} onRestartRequired=${onRestartRequired} />
  </div>
`;
