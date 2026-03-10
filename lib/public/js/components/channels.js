import { h } from 'https://esm.sh/preact';
import htm from 'https://esm.sh/htm';
import { Badge } from './badge.js';
const html = htm.bind(h);

const ALL_CHANNELS = ["telegram", "discord", "whatsapp"];
const kChannelMeta = {
  telegram: { label: "Telegram", iconSrc: "/assets/icons/telegram.svg" },
  discord: { label: "Discord", iconSrc: "/assets/icons/discord.svg" },
  whatsapp: { label: "WhatsApp", iconSrc: "" },
};

export function Channels({ channels, onSwitchTab, onNavigate }) {
  return html`
    <div class="bg-surface border border-border rounded-xl p-4">
      <h2 class="card-label mb-3">Channels</h2>
      <div class="space-y-2">
        ${channels ? ALL_CHANNELS.map(ch => {
          const info = channels[ch];
          const channelMeta = kChannelMeta[ch] || { label: ch.charAt(0).toUpperCase() + ch.slice(1), iconSrc: '' };
          const isClickable = ch === 'telegram' && info?.status === 'paired' && onNavigate;
          let badge;
          if (!info) {
            badge = html`<a
              href="#"
              onclick=${(e) => { e.preventDefault(); onSwitchTab?.('envars'); }}
              class="text-xs px-2 py-1 rounded-lg ac-btn-ghost"
            >Add token</a>`;
          } else if (info.status === 'paired') {
            const pairedCount = Number(info.paired || 0);
            badge = html`<${Badge} tone="success"
              >${ch === 'telegram' || pairedCount <= 1 ? 'Paired' : `Paired (${pairedCount})`}</${Badge
            }>`;
          } else {
            badge = html`<${Badge} tone="warning">Awaiting pairing</${Badge}>`;
          }
          return html`<div
            class="flex justify-between items-center py-1.5 ${isClickable ? 'cursor-pointer hover:bg-white/5 -mx-2 px-2 rounded-lg transition-colors' : ''}"
            onclick=${isClickable ? () => onNavigate('telegram') : undefined}
          >
            <span class="font-medium text-sm flex items-center gap-2">
              ${channelMeta.iconSrc
                ? html`<img src=${channelMeta.iconSrc} alt="" class="w-4 h-4 rounded-sm" aria-hidden="true" />`
                : null}
              ${channelMeta.label}
              ${isClickable && html`
                <span class="text-xs text-gray-500 ml-1">Workspace</span>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" class="text-gray-600">
                  <path
                    d="M6 3.5L10.5 8L6 12.5"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              `}
            </span>
            <span class="flex items-center gap-2">
              ${badge}
            </span>
          </div>`;
        }) : html`<div class="text-gray-500 text-sm text-center py-2">Loading...</div>`}
      </div>
    </div>`;
}

export { ALL_CHANNELS };
