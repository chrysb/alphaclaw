import { h } from "https://esm.sh/preact";
import htm from "https://esm.sh/htm";
import { Badge } from "../../badge.js";
import { formatLastReceived, healthClassName } from "../helpers.js";
import { useWebhookList } from "./use-webhook-list.js";

const html = htm.bind(h);

export const WebhookList = ({
  onSelectHook = () => {},
}) => {
  const { state, actions } = useWebhookList({ onSelectHook });

  const { webhooks, isListLoading } = state;

  return html`
    <div class="bg-surface border border-border rounded-xl p-4 space-y-4">
      ${isListLoading
        ? html`<p class="text-xs text-gray-500">Loading webhooks...</p>`
        : null}
      ${!isListLoading && webhooks.length === 0
        ? html`<p class="text-sm text-gray-500">
            No webhooks configured yet. Create one to get started.
          </p>`
        : null}
      ${webhooks.length > 0
        ? html`
            <div class="overflow-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="text-left text-xs text-gray-500 border-b border-border">
                    <th class="pb-2 pr-3">Path</th>
                    <th class="pb-2 pr-3">Last received</th>
                    <th class="pb-2 pr-3">Errors</th>
                    <th class="pb-2 pr-3">Health</th>
                    <th class="pb-2 pr-3">Type</th>
                  </tr>
                </thead>
                <tbody>
                  <tr aria-hidden="true">
                    <td class="h-2 p-0" colspan="5"></td>
                  </tr>
                  ${webhooks.map(
                    (item) => html`
                      <tr
                        class="group cursor-pointer"
                        onclick=${() => actions.handleSelectHook(item.name)}
                      >
                        <td
                          class="px-3 py-2.5 group-hover:bg-white/5 first:rounded-l-lg transition-colors"
                        >
                          <code>${item.path || `/hooks/${item.name}`}</code>
                        </td>
                        <td
                          class="px-3 py-2.5 text-xs text-gray-400 group-hover:bg-white/5 transition-colors"
                        >
                          ${formatLastReceived(item.lastReceived)}
                        </td>
                        <td
                          class="px-3 py-2.5 text-xs group-hover:bg-white/5 transition-colors"
                        >
                          ${item.errorCount || 0}
                        </td>
                        <td
                          class="px-3 py-2.5 group-hover:bg-white/5 last:rounded-r-lg transition-colors"
                        >
                          <span
                            class="inline-block w-2.5 h-2.5 rounded-full ${healthClassName(
                              item.health,
                            )}"
                            title=${item.health}
                          />
                        </td>
                        <td
                          class="px-3 py-2.5 text-xs text-gray-400 group-hover:bg-white/5 transition-colors"
                        >
                          ${item.managed
                            ? html`<span
                                class="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] bg-cyan-500/10 text-cyan-200"
                                >Managed</span
                              >`
                            : item.oauthCallbackEnabled
                              ? html`<${Badge} tone="neutral">OAuth</${Badge}>`
                              : html`<${Badge} tone="neutral">Custom</${Badge}>`}
                        </td>
                      </tr>
                    `,
                  )}
                </tbody>
              </table>
            </div>
          `
        : null}
    </div>
  `;
};
