import { h } from "https://esm.sh/preact";
import htm from "https://esm.sh/htm";
import { Badge } from "../badge.js";
import { ToggleSwitch } from "../toggle-switch.js";
import { InfoTooltip } from "../info-tooltip.js";

const html = htm.bind(h);

const resolveWatchState = ({ watchStatus, busy = false }) => {
  if (busy) return { label: "Starting", tone: "warning" };
  if (!watchStatus?.enabled) return { label: "Stopped", tone: "neutral" };
  if (watchStatus.enabled && !watchStatus.running)
    return { label: "Error", tone: "danger" };
  return { label: "Watching", tone: "success" };
};

export const GmailWatchToggle = ({
  account,
  watchStatus = null,
  busy = false,
  onEnable = () => {},
  onDisable = () => {},
}) => {
  const hasGmailReadScope = Array.isArray(account?.activeScopes)
    ? account.activeScopes.includes("gmail:read")
    : Array.isArray(account?.services)
      ? account.services.includes("gmail:read")
      : false;
  if (!hasGmailReadScope) {
    return html`
      <div class="bg-black/30 rounded-lg px-3 py-2">
        <div class="text-xs text-gray-500">
          Gmail watch requires <code>gmail:read</code>. Add it in permissions
          above, then update permissions.
        </div>
      </div>
    `;
  }

  const state = resolveWatchState({ watchStatus, busy });
  const enabled = Boolean(watchStatus?.enabled);
  return html`
    <div class="flex items-center justify-between bg-black/30 rounded-lg px-3 py-2">
      <div class="flex items-center gap-1.5 text-sm">
        <span>🔔 Gmail Watch</span>
        <${InfoTooltip}
          text="Watches this inbox for new email events and routes them to your agent via the Gmail hook."
          widthClass="w-72"
        />
      </div>
      <div class="flex items-center gap-2">
        <${Badge} tone=${state.tone}>${state.label}</${Badge}>
        <${ToggleSwitch}
          checked=${enabled}
          disabled=${busy}
          label=""
          onChange=${(nextChecked) => {
            if (busy) return;
            if (nextChecked) onEnable?.();
            else onDisable?.();
          }}
        />
      </div>
    </div>
  `;
};
