import { h } from "https://esm.sh/preact";
import htm from "https://esm.sh/htm";
import { Badge } from "./badge.js";

const html = htm.bind(h);

export const ChannelAccountStatusBadge = ({
  status = "configured",
  ownerAgentName = "",
  showAgentBadge = false,
  channelId = "",
  pairedCount = 0,
}) => {
  const normalizedStatus = String(status || "").trim();
  if (normalizedStatus !== "paired") {
    return html`<${Badge} tone="warning">Awaiting pairing</${Badge}>`;
  }
  if (showAgentBadge && ownerAgentName) {
    return html`
      <${Badge} tone="neutral">
        <span class="inline-flex items-center gap-1.5">
          <span class="h-1.5 w-1.5 rounded-full bg-green-400"></span>
          ${ownerAgentName}
        </span>
      </${Badge}>
    `;
  }
  return html`
    <${Badge} tone="success">
      ${channelId === "telegram" || Number(pairedCount) <= 1
        ? "Paired"
        : `Paired (${Number(pairedCount)})`}
    </${Badge}>
  `;
};
