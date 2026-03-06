import { h } from "https://esm.sh/preact";
import htm from "https://esm.sh/htm";
import { Providers } from "../providers.js";

const html = htm.bind(h);

export const ProvidersRoute = ({ onRestartRequired = () => {} }) => html`
  <div class="pt-4">
    <${Providers} onRestartRequired=${onRestartRequired} />
  </div>
`;
