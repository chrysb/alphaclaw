import { h } from "preact";
import htm from "htm";
import { UsageTab } from "../usage-tab/index.js";

const html = htm.bind(h);

export const UsageRoute = ({ sessionId = "", onSetLocation = () => {} }) => html`
  <div class="pt-4">
    <${UsageTab}
      sessionId=${sessionId}
      onSelectSession=${(id) => onSetLocation(`/usage/${encodeURIComponent(String(id || ""))}`)}
      onBackToSessions=${() => onSetLocation("/usage")}
    />
  </div>
`;
