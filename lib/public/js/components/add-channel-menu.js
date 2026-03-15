import { h } from "https://esm.sh/preact";
import htm from "https://esm.sh/htm";
import { ActionButton } from "./action-button.js";
import { AddLineIcon } from "./icons.js";
import { OverflowMenu, OverflowMenuItem } from "./overflow-menu.js";

const html = htm.bind(h);

export const AddChannelMenu = ({
  open = false,
  onClose = () => {},
  onToggle = () => {},
  triggerDisabled = false,
  channelIds = [],
  getChannelMeta = () => ({ label: "Channel", iconSrc: "" }),
  isChannelDisabled = () => false,
  onSelectChannel = () => {},
}) => html`
  <${OverflowMenu}
    open=${open}
    ariaLabel="Add channel"
    title="Add channel"
    onClose=${onClose}
    onToggle=${onToggle}
    renderTrigger=${({ onToggle: handleToggle, ariaLabel, title }) => html`
      <${ActionButton}
        onClick=${handleToggle}
        disabled=${triggerDisabled}
        loading=${false}
        loadingMode="inline"
        tone="subtle"
        size="sm"
        idleLabel="Add channel"
        loadingLabel="Opening..."
        idleIcon=${AddLineIcon}
        idleIconClassName="h-3.5 w-3.5"
        iconOnly=${true}
        title=${title}
        ariaLabel=${ariaLabel}
      />
    `}
  >
    ${channelIds.map((channelId) => {
      const channelMeta = getChannelMeta(channelId);
      const disabled = !!isChannelDisabled(channelId);
      return html`
        <${OverflowMenuItem}
          key=${channelId}
          iconSrc=${channelMeta.iconSrc}
          disabled=${disabled}
          onClick=${() => onSelectChannel(channelId)}
        >
          ${channelMeta.label}
        </${OverflowMenuItem}>
      `;
    })}
  </${OverflowMenu}>
`;

