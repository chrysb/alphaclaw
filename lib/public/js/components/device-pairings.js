import { h } from 'https://esm.sh/preact';
import { useState } from 'https://esm.sh/preact/hooks';
import htm from 'https://esm.sh/htm';
const html = htm.bind(h);

const kModeLabels = {
  webchat: 'Browser',
  cli: 'CLI',
};

const formatTitle = (d) => kModeLabels[d.clientMode] || d.clientId || 'Device';

const formatSubtitle = (d) => {
  const parts = [];
  if (d.platform) parts.push(d.platform);
  if (d.role) parts.push(d.role);
  return parts.join(' · ');
};

const DeviceRow = ({ d, onApprove, onReject }) => {
  const [busy, setBusy] = useState(null);

  const handle = async (action) => {
    setBusy(action);
    try {
      if (action === 'approve') await onApprove(d.id);
      else await onReject(d.id);
    } catch {
      setBusy(null);
    }
  };

  const title = formatTitle(d);
  const subtitle = formatSubtitle(d);

  if (busy === 'approve') {
    return html`
      <div class="bg-black/30 rounded-lg p-3 mb-2 flex items-center gap-2">
        <span class="text-green-400 text-sm">Approved</span>
        <span class="text-gray-500 text-xs">${title}</span>
      </div>`;
  }
  if (busy === 'reject') {
    return html`
      <div class="bg-black/30 rounded-lg p-3 mb-2 flex items-center gap-2">
        <span class="text-gray-400 text-sm">Rejected</span>
        <span class="text-gray-500 text-xs">${title}</span>
      </div>`;
  }

  return html`
    <div class="bg-black/30 rounded-lg p-3 mb-2">
      <div class="flex items-center gap-2 mb-2">
        <span class="font-medium text-sm">${title}</span>
        ${subtitle && html`<span class="text-xs text-gray-500">${subtitle}</span>`}
      </div>
      <div class="flex gap-2">
        <button onclick=${() => handle('approve')} class="bg-green-500 text-black text-xs font-medium px-3 py-1.5 rounded-lg hover:opacity-85">Approve</button>
        <button onclick=${() => handle('reject')} class="bg-gray-800 text-gray-300 text-xs px-3 py-1.5 rounded-lg hover:bg-gray-700">Reject</button>
      </div>
    </div>`;
};

export const DevicePairings = ({ pending, onApprove, onReject }) => {
  if (!pending || pending.length === 0) return null;

  return html`
    <div class="mt-3 pt-3 border-t border-border">
      <p class="text-xs text-gray-500 mb-2">Pending device pairings</p>
      ${pending.map((d) => html`<${DeviceRow} key=${d.id} d=${d} onApprove=${onApprove} onReject=${onReject} />`)}
    </div>`;
};
