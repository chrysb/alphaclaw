import { h } from "https://esm.sh/preact";
import htm from "https://esm.sh/htm";
import { AgentBindingsSection } from "./agents-tab/agent-bindings-section/index.js";
import { AgentPairingSection } from "./agents-tab/agent-pairing-section.js";

const html = htm.bind(h);

export const ChannelOperationsPanel = ({
  agent = null,
  agents = [],
  onSetLocation = () => {},
  channelsSection = null,
  pairingsSection = null,
}) => {
  if (agent) {
    return html`
      <div class="space-y-4">
        <${AgentBindingsSection}
          agent=${agent}
          agents=${agents}
          onSetLocation=${onSetLocation}
        />
        <${AgentPairingSection} agent=${agent} />
      </div>
    `;
  }
  return html`
    <div class="space-y-4">
      ${channelsSection}
      ${pairingsSection}
    </div>
  `;
};
