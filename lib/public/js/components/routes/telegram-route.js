import { h } from "https://esm.sh/preact";
import htm from "https://esm.sh/htm";
import { TelegramWorkspace } from "../telegram-workspace/index.js";

const html = htm.bind(h);

export const TelegramRoute = ({ accountId = "default", onBack = () => {} }) => html`
  <div class="pt-4">
    <${TelegramWorkspace} key=${accountId} accountId=${accountId} onBack=${onBack} />
  </div>
`;
