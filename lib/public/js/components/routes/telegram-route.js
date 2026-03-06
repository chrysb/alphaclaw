import { h } from "https://esm.sh/preact";
import htm from "https://esm.sh/htm";
import { TelegramWorkspace } from "../telegram-workspace/index.js";

const html = htm.bind(h);

export const TelegramRoute = ({ onBack = () => {} }) => html`
  <div class="pt-4">
    <${TelegramWorkspace} onBack=${onBack} />
  </div>
`;
