import { h } from 'https://esm.sh/preact';
import { useState } from 'https://esm.sh/preact/hooks';
import htm from 'https://esm.sh/htm';
import { ActionButton } from './action-button.js';
const html = htm.bind(h);

export const PairingRow = ({ p, onApprove, onReject }) => {
  const [busy, setBusy] = useState(null);

  const handle = async (action) => {
    setBusy(action);
    try {
      if (action === "approve") await onApprove(p.id, p.channel, p.accountId);
      else await onReject(p.id, p.channel, p.accountId);
    } catch {
      setBusy(null);
    }
  };

  const label = (p.channel || 'unknown').charAt(0).toUpperCase() + (p.channel || '').slice(1);
  const accountId = String(p.accountId || "").trim();
  const accountName = String(p.accountName || "").trim();
  const accountSuffix =
    accountId && accountId !== "default"
      ? ` · ${accountName || accountId}`
      : "";

  if (busy === "approve") {
    return html`
      <div class="bg-black/30 rounded-lg p-3 mb-2 flex items-center gap-2">
        <span class="text-green-400 text-sm">Approved</span>
        <span class="text-gray-500 text-xs">${label}${accountSuffix} · ${p.code || p.id || '?'}</span>
      </div>`;
  }
  if (busy === "reject") {
    return html`
      <div class="bg-black/30 rounded-lg p-3 mb-2 flex items-center gap-2">
        <span class="text-gray-400 text-sm">Rejected</span>
        <span class="text-gray-500 text-xs">${label}${accountSuffix} · ${p.code || p.id || '?'}</span>
      </div>`;
  }

  return html`
    <div class="bg-black/30 rounded-lg p-3 mb-2">
      <div class="font-medium text-sm mb-2">${label}${accountSuffix} · <code class="text-gray-400">${p.code || p.id || '?'}</code></div>
      <div class="flex gap-2">
        <${ActionButton}
          onClick=${() => handle("approve")}
          tone="success"
          size="sm"
          idleLabel="Approve"
          className="font-medium px-3 py-1.5"
        />
        <${ActionButton}
          onClick=${() => handle("reject")}
          tone="secondary"
          size="sm"
          idleLabel="Reject"
          className="font-medium px-3 py-1.5"
        />
      </div>
    </div>`;
};

const ALL_CHANNELS = ['telegram', 'discord', 'slack'];

const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export function Pairings({
  pending,
  channels,
  visible,
  onApprove,
  onReject,
  statusRefreshing = false,
}) {
  if (!visible) return null;

  const unpaired = ALL_CHANNELS
    .filter((ch) => {
      const info = channels?.[ch];
      if (!info) return false;
      const accounts =
        info.accounts && typeof info.accounts === "object" ? info.accounts : {};
      if (Object.keys(accounts).length > 0) {
        return Object.values(accounts).some(
          (acc) => acc && acc.status !== "paired",
        );
      }
      return info.status !== "paired";
    })
    .map(capitalize);

  const channelList = unpaired.length <= 2
    ? unpaired.join(' or ')
    : unpaired.slice(0, -1).join(', ') + ', or ' + unpaired[unpaired.length - 1];

  return html`
    <div class="bg-surface border border-border rounded-xl p-4">
      <h2 class="card-label mb-3">Pending Pairings</h2>
      ${pending.length > 0
        ? html`<div>
            ${pending.map(p => html`<${PairingRow} key=${p.id} p=${p} onApprove=${onApprove} onReject=${onReject} />`)}
          </div>`
        : statusRefreshing
        ? html`<div class="text-center py-4 space-y-2">
            <p class="text-gray-300 text-sm">Updating pairing status...</p>
          </div>`
        : html`<div class="text-center py-4 space-y-2">
            <div class="text-3xl">💬</div>
            <p class="text-gray-300 text-sm">Send a message to your bot on ${channelList}</p>
            <p class="text-gray-600 text-xs">The pairing request will appear here — it may take a few moments</p>
          </div>`}
    </div>`;
}
