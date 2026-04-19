import { h } from "preact";
import htm from "htm";
import { NodesTab } from "../nodes-tab/index.js";

const html = htm.bind(h);

export const NodesRoute = ({ onRestartRequired = () => {} }) => html`
  <div class="pt-4 max-w-2xl w-full mx-auto">
    <${NodesTab} onRestartRequired=${onRestartRequired} />
  </div>
`;
