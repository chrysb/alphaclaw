import { h } from "https://esm.sh/preact";
import htm from "https://esm.sh/htm";
import { Badge } from "../badge.js";
import { ActionButton } from "../action-button.js";

const html = htm.bind(h);

const formatDateTime = (value) => {
  const parsed = Number.parseInt(String(value || ""), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return "n/a";
  try {
    return new Date(parsed).toLocaleString();
  } catch {
    return "n/a";
  }
};

const resolveWatchState = ({
  watchStatus,
  busy = false,
}) => {
  if (busy) return { label: "Starting", tone: "warning" };
  if (!watchStatus?.enabled) return { label: "Stopped", tone: "neutral" };
  if (watchStatus.enabled && !watchStatus.running) return { label: "Error", tone: "danger" };
  return { label: "Watching", tone: "success" };
};

export const GmailWatchToggle = ({
  account,
  watchStatus = null,
  busy = false,
  onEnable = () => {},
  onDisable = () => {},
  onOpenSetup = () => {},
}) => {
  const hasGmailReadScope = Array.isArray(account?.activeScopes)
    ? account.activeScopes.includes("gmail:read")
    : Array.isArray(account?.services)
      ? account.services.includes("gmail:read")
      : false;
  if (!hasGmailReadScope) {
    return html`
      <div class="rounded-lg border border-border bg-black/20 px-3 py-2">
        <div class="text-xs text-gray-500">
          Gmail watch requires <code>gmail:read</code>. Add it in permissions above, then update permissions.
        </div>
      </div>
    `;
  }

  const state = resolveWatchState({ watchStatus, busy });
  const enabled = Boolean(watchStatus?.enabled);
  return html`
    <div class="rounded-lg border border-border bg-black/20 px-3 py-2.5 space-y-2">
      <div class="flex items-center justify-between gap-2">
        <div class="text-sm font-medium">Gmail Watch</div>
        <div class="flex items-center gap-2">
          <${Badge} tone=${state.tone}>${state.label}</${Badge}>
          <button
            type="button"
            onclick=${onOpenSetup}
            class="text-xs px-2 py-1 rounded-lg ac-btn-ghost"
          >
            Setup
          </button>
        </div>
      </div>
      <div class="text-xs text-gray-500 space-y-1">
        <div>Expiration: ${formatDateTime(watchStatus?.expiration)}</div>
        <div>Last push: ${formatDateTime(watchStatus?.lastPushAt)}</div>
      </div>
      <div class="flex items-center gap-2">
        ${enabled
          ? html`<${ActionButton}
              onClick=${onDisable}
              disabled=${busy}
              loading=${busy}
              tone="secondary"
              size="sm"
              idleLabel="Disable Watch"
              loadingLabel="Stopping..."
            />`
          : html`<${ActionButton}
              onClick=${onEnable}
              disabled=${busy}
              loading=${busy}
              tone="primary"
              size="sm"
              idleLabel="Enable Watch"
              loadingLabel="Starting..."
            />`}
      </div>
    </div>
  `;
};
