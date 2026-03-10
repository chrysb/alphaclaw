import { h } from "https://esm.sh/preact";
import htm from "https://esm.sh/htm";
import { Badge } from "../../badge.js";
import { ChannelAccountStatusBadge } from "../../channel-account-status-badge.js";
import { OverflowMenu, OverflowMenuItem } from "../../overflow-menu.js";

const html = htm.bind(h);

export const ChannelItemTrailing = ({
  item = {},
  menuOpenId = "",
  setMenuOpenId = () => {},
  openDeleteChannelDialog = () => {},
  openEditChannelModal = () => {},
  requestBindAccount = () => {},
  onSetLocation = () => {},
}) => {
  const {
    accountData = {},
    accountId = "",
    accountStatusInfo = {},
    canNavigateToOwnerAgent = false,
    channel = "",
    ownerAgentId = "",
    ownerAgentName = "",
    isAvailable = false,
    isOwned = false,
  } = item;

  let statusTrailing = null;
  if (isOwned) {
    statusTrailing =
      accountStatusInfo?.status === "paired"
        ? html`<${ChannelAccountStatusBadge}
            status=${accountStatusInfo?.status}
            ownerAgentName=${ownerAgentName}
            showAgentBadge=${true}
            channelId=${channel}
            pairedCount=${accountStatusInfo?.paired ?? 0}
          />`
        : html`<${ChannelAccountStatusBadge}
            status=${accountStatusInfo?.status}
            ownerAgentName=""
            showAgentBadge=${false}
            channelId=${channel}
            pairedCount=${accountStatusInfo?.paired ?? 0}
          />`;
  } else if (isAvailable) {
    statusTrailing = html`
      <button
        type="button"
        onclick=${(event) => {
          event.stopPropagation();
          requestBindAccount(accountData);
        }}
        class="text-xs px-2 py-1 rounded-lg ac-btn-ghost"
      >
        Bind
      </button>
    `;
  } else {
    statusTrailing = html`
      ${canNavigateToOwnerAgent
        ? html`
            <button
              type="button"
              class="inline-flex rounded-full transition-[filter] hover:brightness-125 focus:outline-none focus:ring-1 focus:ring-border"
              onclick=${(event) => {
                event.stopPropagation();
                onSetLocation(`/agents/${encodeURIComponent(ownerAgentId)}`);
              }}
              title=${`Open ${ownerAgentName}`}
              aria-label=${`Open ${ownerAgentName}`}
            >
              <${Badge} tone="neutral">${ownerAgentName}</${Badge}>
            </button>
          `
        : html`<${Badge} tone="neutral">${ownerAgentName || "Bound elsewhere"}</${Badge}>`}
    `;
  }

  const showBindAction = accountData.isBoundElsewhere;
  const canEditOrDelete = !accountData.isBoundElsewhere;

  return html`
    <div class="flex items-center gap-1.5">
      ${statusTrailing}
      <${OverflowMenu}
        open=${menuOpenId === `${channel}:${accountId}`}
        ariaLabel="Open channel actions"
        title="Open channel actions"
        onClose=${() => setMenuOpenId("")}
        onToggle=${() =>
          setMenuOpenId((current) =>
            current === `${channel}:${accountId}`
              ? ""
              : `${channel}:${accountId}`,
          )}
      >
        ${canEditOrDelete
          ? html`
              <${OverflowMenuItem}
                onClick=${() => openEditChannelModal(accountData)}
              >
                Edit
              </${OverflowMenuItem}>
            `
          : null}
        ${showBindAction
          ? html`
              <${OverflowMenuItem}
                onClick=${() => requestBindAccount(accountData)}
              >
                Bind
              </${OverflowMenuItem}>
            `
          : null}
        ${canEditOrDelete
          ? html`
              <${OverflowMenuItem}
                className="text-red-300 hover:text-red-200"
                onClick=${() => openDeleteChannelDialog(accountData)}
              >
                Delete
              </${OverflowMenuItem}>
            `
          : null}
      </${OverflowMenu}>
    </div>
  `;
};

export const ChannelCardItem = ({
  item = {},
  channelMeta = {},
  menuOpenId = "",
  setMenuOpenId = () => {},
  openDeleteChannelDialog = () => {},
  openEditChannelModal = () => {},
  requestBindAccount = () => {},
  onSetLocation = () => {},
}) => {
  const canOpenWorkspace = !!item?.canOpenWorkspace;
  const accountId = String(item?.accountId || "").trim() || "default";
  return html`
    <div
      key=${item.id || item.channel}
      class="flex justify-between items-center py-1.5 ${canOpenWorkspace
        ? "cursor-pointer hover:bg-white/5 -mx-2 px-2 rounded-lg transition-colors"
        : ""}"
      onclick=${canOpenWorkspace
        ? () => onSetLocation(`/telegram/${encodeURIComponent(accountId)}`)
        : undefined}
    >
      <span class="font-medium text-sm flex items-center gap-2 min-w-0">
        ${channelMeta?.iconSrc
          ? html`
              <img
                src=${channelMeta.iconSrc}
                alt=""
                class="w-4 h-4 rounded-sm"
                aria-hidden="true"
              />
            `
          : null}
        <span class="truncate ${item?.dimmedLabel ? "text-gray-500" : ""} ${item?.labelClassName || ""}">
          ${item?.label || channelMeta?.label || "Channel"}
        </span>
        ${canOpenWorkspace
          ? html`
              <span class="text-xs text-gray-500 ml-1 shrink-0">Workspace</span>
              <svg
                width="14"
                height="14"
                viewBox="0 0 16 16"
                fill="none"
                class="text-gray-600 shrink-0"
              >
                <path
                  d="M6 3.5L10.5 8L6 12.5"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            `
          : null}
      </span>
      <span class="flex items-center gap-2 shrink-0">
        <${ChannelItemTrailing}
          item=${item}
          menuOpenId=${menuOpenId}
          setMenuOpenId=${setMenuOpenId}
          openDeleteChannelDialog=${openDeleteChannelDialog}
          openEditChannelModal=${openEditChannelModal}
          requestBindAccount=${requestBindAccount}
          onSetLocation=${onSetLocation}
        />
      </span>
    </div>
  `;
};
