import { h } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import htm from 'htm';
import { ActionButton } from './action-button.js';
import { LoadingSpinner } from './loading-spinner.js';
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
      <div class="bg-field rounded-lg p-3 mb-2 flex items-center gap-2">
        <span class="text-status-success text-sm">Approved</span>
        <span class="text-fg-muted text-xs">${label}${accountSuffix} · ${p.code || p.id || '?'}</span>
      </div>`;
  }
  if (busy === "reject") {
    return html`
      <div class="bg-field rounded-lg p-3 mb-2 flex items-center gap-2">
        <span class="text-fg-muted text-sm">Rejected</span>
        <span class="text-fg-muted text-xs">${label}${accountSuffix} · ${p.code || p.id || '?'}</span>
      </div>`;
  }

  return html`
    <div class="bg-field rounded-lg p-3 mb-2">
      <div class="font-medium text-sm mb-2">${label}${accountSuffix} · <code class="text-fg-muted">${p.code || p.id || '?'}</code></div>
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

const ALL_CHANNELS = ['telegram', 'discord', 'slack', 'whatsapp'];

const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

const getPairingKey = (p) => {
  const channel = String(p?.channel || "").trim().toLowerCase();
  const accountId = String(p?.accountId || "").trim() || "default";
  const id = String(p?.id || p?.code || "").trim();
  return channel && id ? `${channel}\u0000${accountId}\u0000${id}` : "";
};

export function Pairings({
  pending,
  channels,
  visible,
  onApprove,
  onReject,
  statusRefreshing = false,
  pollingInFlight = false,
}) {
  const [hiddenPairingKeys, setHiddenPairingKeys] = useState(() => new Set());
  const pendingList = Array.isArray(pending) ? pending : [];

  useEffect(() => {
    setHiddenPairingKeys((current) => {
      if (current.size === 0) return current;
      const pendingKeys = new Set(
        pendingList.map(getPairingKey).filter(Boolean),
      );
      const next = new Set();
      for (const key of current) {
        if (pendingKeys.has(key)) {
          next.add(key);
        }
      }
      return next.size === current.size ? current : next;
    });
  }, [pending]);

  const hidePairing = (p) => {
    const key = getPairingKey(p);
    if (!key) return;
    setHiddenPairingKeys((current) => {
      if (current.has(key)) return current;
      const next = new Set(current);
      next.add(key);
      return next;
    });
  };

  const handleApprove = async (p) => {
    await onApprove(p.id, p.channel, p.accountId);
    hidePairing(p);
  };

  const handleReject = async (p) => {
    await onReject(p.id, p.channel, p.accountId);
    hidePairing(p);
  };

  const visiblePending = pendingList.filter(
    (p) => !hiddenPairingKeys.has(getPairingKey(p)),
  );

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

  if (unpaired.length === 0 && visiblePending.length === 0) return null;

  return html`
    <div class="bg-surface border border-border rounded-xl p-4">
      <div class="flex items-center justify-between gap-3 mb-3">
        <h2 class="card-label">Pending Pairings</h2>
        ${pollingInFlight
          ? html`
              <div class="inline-flex items-center text-fg-muted" aria-label="Pairings refresh in progress">
                <${LoadingSpinner} className="h-3.5 w-3.5 text-fg-muted" />
              </div>
            `
          : null}
      </div>
      ${visiblePending.length > 0
        ? html`<div>
            ${visiblePending.map((p) => html`
              <${PairingRow}
                key=${getPairingKey(p) || p.id}
                p=${p}
                onApprove=${() => handleApprove(p)}
                onReject=${() => handleReject(p)}
              />
            `)}
          </div>`
        : statusRefreshing
        ? html`<div class="text-center py-4 space-y-2">
            <p class="text-body text-sm">Updating pairing status...</p>
          </div>`
        : html`<div class="text-center py-4 space-y-2">
            <div class="text-3xl">💬</div>
            <p class="text-body text-sm">Send a message to your bot on ${channelList}</p>
            <p class="text-fg-dim text-xs">The pairing request will appear here — it may take a few moments</p>
          </div>`}
    </div>`;
}
