import { h } from "preact";
import htm from "htm";
import { Badge } from "../badge.js";
import { ToggleSwitch } from "../toggle-switch.js";
import { InfoTooltip } from "../info-tooltip.js";

const html = htm.bind(h);

const resolveWatchState = ({ watchStatus, busy = false }) => {
  if (busy) {
    const label = watchStatus?.enabled ? "Stopping" : "Starting";
    return { label, tone: "warning" };
  }
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
  onOpenWebhook = () => {},
}) => {
  const hasGmailReadScope = Array.isArray(account?.activeScopes)
    ? account.activeScopes.includes("gmail:read")
    : Array.isArray(account?.services)
      ? account.services.includes("gmail:read")
      : false;
  if (!hasGmailReadScope) {
    return html`
      <div class="bg-field rounded-lg px-3 py-2">
        <div class="text-xs text-fg-muted">
          Gmail watch requires <code>gmail:read</code>. Add it in permissions
          above, then update permissions.
        </div>
      </div>
    `;
  }

  const state = resolveWatchState({ watchStatus, busy });
  const enabled = Boolean(watchStatus?.enabled);
  return html`
    <div
      class="flex items-center justify-between bg-field border border-transparent rounded-lg px-3 py-2 cursor-pointer hover:bg-field hover:border-white/20 transition-colors"
      role="button"
      tabindex="0"
      onClick=${() => onOpenWebhook?.()}
      onKeyDown=${(event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        onOpenWebhook?.();
      }}
    >
      <div class="flex items-center gap-1.5 text-sm">
        <span>🔔 Gmail</span>
        <${InfoTooltip}
          text="Watches this inbox for new email events and routes them to your agent via the Gmail hook."
          widthClass="w-72"
        />
      </div>
      <div
        class="flex items-center gap-2"
        onClick=${(event) => event.stopPropagation()}
        onKeyDown=${(event) => event.stopPropagation()}
      >
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
