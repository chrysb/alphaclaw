import { h } from "https://esm.sh/preact";
import { useState } from "https://esm.sh/preact/hooks";
import htm from "https://esm.sh/htm";
import { Badge } from "../badge.js";

const html = htm.bind(h);

const kChannelMeta = {
  telegram: {
    label: "Telegram",
    iconSrc: "/assets/icons/telegram.svg",
  },
  discord: {
    label: "Discord",
    iconSrc: "/assets/icons/discord.svg",
  },
};

const PairingRow = ({ pairing, onApprove, onReject }) => {
  const [busyAction, setBusyAction] = useState("");

  const handleApprove = async () => {
    setBusyAction("approve");
    try {
      await onApprove(pairing.id, pairing.channel, pairing.accountId || "");
    } finally {
      setBusyAction("");
    }
  };

  const handleReject = async () => {
    setBusyAction("reject");
    try {
      await onReject(pairing.id, pairing.channel, pairing.accountId || "");
    } finally {
      setBusyAction("");
    }
  };

  return html`
    <div class="bg-black/30 rounded-lg p-3 mb-2">
      <div class="flex items-center justify-between gap-2 mb-2">
        <div class="font-medium text-sm">
          ${pairing.code || pairing.id || "Pending request"}
        </div>
        <span
          class="text-[11px] px-2 py-0.5 rounded-full border border-border text-gray-400"
        >
          Request
        </span>
      </div>
      <p class="text-xs text-gray-500 mb-3">
        Approve to connect this account and finish setup.
      </p>
      <div class="flex gap-2">
        <button
          onclick=${handleApprove}
          disabled=${!!busyAction}
          class="ac-btn-green text-xs font-medium px-3 py-1.5 rounded-lg ${busyAction
            ? "opacity-50 cursor-not-allowed"
            : ""}"
        >
          ${busyAction === "approve" ? "Approving..." : "Approve"}
        </button>
        <button
          onclick=${handleReject}
          disabled=${!!busyAction}
          class="ac-btn-secondary text-xs font-medium px-3 py-1.5 rounded-lg ${busyAction
            ? "opacity-50 cursor-not-allowed"
            : ""}"
        >
          ${busyAction === "reject" ? "Rejecting..." : "Reject"}
        </button>
      </div>
    </div>
  `;
};

export const WelcomePairingStep = ({
  channel,
  pairings,
  channels,
  loading,
  error,
  onApprove,
  onReject,
  canFinish,
  onContinue,
  onSkip,
}) => {
  const channelMeta = kChannelMeta[channel] || {
    label: channel
      ? channel.charAt(0).toUpperCase() + channel.slice(1)
      : "Channel",
    iconSrc: "",
  };
  const channelInfo = channels?.[channel];

  if (!channel) {
    return html`
      <div
        class="bg-red-900/30 border border-red-800 rounded-xl p-3 text-red-300 text-sm"
      >
        Missing channel configuration. Go back and add a Telegram or Discord bot
        token.
      </div>
    `;
  }

  if (canFinish) {
    return html`
      <div class="min-h-[300px] pb-6 px-6 flex flex-col">
        <div class="flex-1 flex items-center justify-center text-center">
          <div class="space-y-3 max-w-xl mx-auto">
            <p class="text-sm font-medium text-green-300 mb-12">
              🎉 Setup complete
            </p>
            <p class="text-xs text-gray-300">
              Your ${channelMeta.label} channel is connected. You can switch to
              ${channelMeta.label} and start using your agent now.
            </p>
            <p class="text-xs text-gray-500 font-normal opacity-85">
              Continue to the dashboard to explore extras like Google Workspace
              and additional integrations.
            </p>
          </div>
        </div>
        <button
          onclick=${onContinue}
          class="w-full max-w-xl mx-auto text-sm font-medium px-4 py-2.5 rounded-xl transition-all ac-btn-cyan mt-3"
        >
          Continue to dashboard
        </button>
      </div>
    `;
  }

  return html`
    <div class="min-h-[300px] pb-6 flex flex-col gap-3">
      <div class="flex items-center justify-end gap-2">
        <${Badge} tone="warning"
          >${
            loading
              ? "Checking..."
              : pairings.length > 0
                ? "Pairing request detected"
                : "Awaiting pairing"
          }</${Badge}
        >
      </div>

      ${
        pairings.length > 0
          ? html`<div class="flex-1 flex items-center">
              <div class="w-full">
                ${pairings.map(
                  (pairing) =>
                    html`<${PairingRow}
                      key=${pairing.id}
                      pairing=${pairing}
                      onApprove=${onApprove}
                      onReject=${onReject}
                    />`,
                )}
              </div>
            </div>`
          : html`<div
              class="flex-1 flex items-center justify-center text-center py-4"
            >
              <div class="space-y-4">
                ${channelMeta.iconSrc
                  ? html`<img
                      src=${channelMeta.iconSrc}
                      alt=${channelMeta.label}
                      class="w-8 h-8 mx-auto rounded-md"
                    />`
                  : null}
                <p class="text-gray-300 text-sm">
                  Send a message to your ${channelMeta.label} bot
                </p>
                <p class="text-gray-600 text-xs">
                  The pairing request will appear here in 5-10 seconds
                </p>
              </div>
            </div>`
      }

      ${
        error
          ? html`<div
              class="bg-red-900/30 border border-red-800 rounded-xl p-3 text-red-300 text-sm"
            >
              ${error}
            </div>`
          : null
      }
      ${
        pairings.length === 0
          ? html`<div class="pt-3 text-center">
              <button
                type="button"
                onclick=${onSkip}
                class="ac-tip-link text-xs font-medium"
              >
                Skip pairing for now
              </button>
            </div>`
          : null
      }
    </div>
  `;
};
