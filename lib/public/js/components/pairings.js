import { h } from 'https://esm.sh/preact';
import { useState } from 'https://esm.sh/preact/hooks';
import htm from 'https://esm.sh/htm';
const html = htm.bind(h);

const PairingRow = ({ p, onApprove, onReject }) => {
  const [busy, setBusy] = useState(null);

  const handle = async (action) => {
    setBusy(action);
    try {
      if (action === "approve") await onApprove(p.id, p.channel);
      else await onReject(p.id, p.channel);
    } catch {
      setBusy(null);
    }
  };

  const label = (p.channel || 'unknown').charAt(0).toUpperCase() + (p.channel || '').slice(1);

  if (busy === "approve") {
    return html`
      <div class="bg-black/30 rounded-lg p-3 mb-2 flex items-center gap-2">
        <span class="text-green-400 text-sm">Approved</span>
        <span class="text-gray-500 text-xs">${label} · ${p.code || p.id || '?'}</span>
      </div>`;
  }
  if (busy === "reject") {
    return html`
      <div class="bg-black/30 rounded-lg p-3 mb-2 flex items-center gap-2">
        <span class="text-gray-400 text-sm">Rejected</span>
        <span class="text-gray-500 text-xs">${label} · ${p.code || p.id || '?'}</span>
      </div>`;
  }

  return html`
    <div class="bg-black/30 rounded-lg p-3 mb-2">
      <div class="font-medium text-sm mb-2">${label} · <code class="text-gray-400">${p.code || p.id || '?'}</code></div>
      <div class="flex gap-2">
        <button onclick=${() => handle("approve")} class="bg-green-500 text-black text-xs font-medium px-3 py-1.5 rounded-lg hover:opacity-85">Approve</button>
        <button onclick=${() => handle("reject")} class="bg-gray-800 text-gray-300 text-xs px-3 py-1.5 rounded-lg hover:bg-gray-700">Reject</button>
      </div>
    </div>`;
};

const ALL_CHANNELS = ['telegram', 'discord'];

const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export function Pairings({ pending, channels, visible, onApprove, onReject }) {
  if (!visible) return null;

  const unpaired = ALL_CHANNELS
    .filter((ch) => channels?.[ch] && channels[ch].status !== 'paired')
    .map(capitalize);

  const channelList = unpaired.length <= 2
    ? unpaired.join(' or ')
    : unpaired.slice(0, -1).join(', ') + ', or ' + unpaired[unpaired.length - 1];

  return html`
    <div class="bg-surface border border-border rounded-xl p-4">
      <h2 class="font-semibold mb-3">Pending Pairings</h2>
      ${pending.length > 0
        ? html`<div>
            ${pending.map(p => html`<${PairingRow} key=${p.id} p=${p} onApprove=${onApprove} onReject=${onReject} />`)}
          </div>`
        : html`<div class="text-center py-4 space-y-2">
            <div class="text-3xl">💬</div>
            <p class="text-gray-300 text-sm">Send a message to your bot on ${channelList}</p>
            <p class="text-gray-600 text-xs">The pairing request will appear here — it may take a few moments</p>
          </div>`}
    </div>`;
}
