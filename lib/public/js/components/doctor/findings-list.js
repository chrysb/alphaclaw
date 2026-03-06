import { h } from "https://esm.sh/preact";
import htm from "https://esm.sh/htm";
import { Badge } from "../badge.js";
import { ActionButton } from "../action-button.js";
import {
  formatDoctorCategory,
  getDoctorCategoryTone,
  getDoctorPriorityTone,
} from "./helpers.js";

const html = htm.bind(h);

const renderEvidenceLine = (item = {}) => {
  if (item?.path) return item.path;
  if (item?.text) return item.text;
  return JSON.stringify(item);
};

export const DoctorFindingsList = ({
  cards = [],
  busyCardId = 0,
  onAskAgentFix = () => {},
  onUpdateStatus = () => {},
  showRunMeta = false,
  hideEmptyState = false,
}) => {
  return html`
    <div class="space-y-4">
      ${cards.length
        ? html`
            <div class="space-y-3">
              ${cards.map(
                (card) => html`
                  <div class="bg-surface border border-border rounded-xl p-4 space-y-3">
                    <div class="space-y-2">
                      <div class="flex flex-wrap items-start justify-between gap-3">
                        <div class="space-y-2 min-w-0">
                          <div class="flex flex-wrap items-center gap-2">
                            <${Badge} tone=${getDoctorPriorityTone(card.priority)}>
                              ${card.priority}
                            </${Badge}>
                            <h3 class="text-sm font-semibold text-gray-100">
                              ${card.title}
                            </h3>
                          </div>
                          <div class="flex flex-wrap items-center gap-2">
                            <${Badge} tone=${getDoctorCategoryTone(card.category)}>
                              ${formatDoctorCategory(card.category)}
                            </${Badge}>
                            ${
                              showRunMeta
                                ? html`
                                    <span class="text-xs text-gray-600"
                                      >Run #${card.runId}</span
                                    >
                                  `
                                : null
                            }
                          </div>
                        </div>
                      </div>
                      ${
                        card.summary
                          ? html`<p
                              class="text-xs text-gray-300 leading-5 pt-1"
                            >
                              ${card.summary}
                            </p>`
                          : null
                      }
                    </div>
                    <details class="group rounded-lg border border-border bg-black/20">
                      <summary class="list-none cursor-pointer px-3 py-2.5 text-xs text-gray-400 group-open:border-b group-open:border-border">
                        <span class="inline-flex items-center gap-2">
                          <span
                            class="inline-block text-gray-500 transition-transform duration-200 group-open:rotate-90"
                            aria-hidden="true"
                            >▸</span
                          >
                          <span>Show recommendation and details</span>
                        </span>
                      </summary>
                      <div class="p-3 space-y-3">
                        <div>
                          <div class="ac-small-heading">
                            Recommendation
                          </div>
                          <p class="text-xs text-gray-200 mt-1 leading-5">
                            ${card.recommendation}
                          </p>
                        </div>
                        ${
                          Array.isArray(card.targetPaths) &&
                          card.targetPaths.length
                            ? html`
                                <div>
                                  <div class="ac-small-heading">
                                    Target paths
                                  </div>
                                  <div class="mt-1 flex flex-wrap gap-1.5">
                                    ${card.targetPaths.map(
                                      (targetPath) => html`
                                        <span
                                          class="text-[11px] px-2 py-1 rounded-md bg-black/30 border border-border font-mono text-gray-300"
                                        >
                                          ${targetPath}
                                        </span>
                                      `,
                                    )}
                                  </div>
                                </div>
                              `
                            : null
                        }
                        ${
                          Array.isArray(card.evidence) && card.evidence.length
                            ? html`
                                <div>
                                  <div class="ac-small-heading">Evidence</div>
                                  <div class="mt-1 space-y-1">
                                    ${card.evidence.map(
                                      (item) => html`
                                        <div class="text-xs text-gray-400">
                                          ${renderEvidenceLine(item)}
                                        </div>
                                      `,
                                    )}
                                  </div>
                                </div>
                              `
                            : null
                        }
                      </div>
                    </details>
                    <div class="flex flex-wrap gap-2">
                      <${ActionButton}
                        onClick=${() => onAskAgentFix(card)}
                        loading=${busyCardId === card.id}
                        tone="primary"
                        idleLabel="Ask agent to fix"
                        loadingLabel="Sending..."
                      />
                      ${
                        card.status !== "fixed"
                          ? html`
                              <${ActionButton}
                                onClick=${() => onUpdateStatus(card, "fixed")}
                                tone="secondary"
                                idleLabel="Mark fixed"
                              />
                            `
                          : html`
                              <${ActionButton}
                                onClick=${() => onUpdateStatus(card, "open")}
                                tone="secondary"
                                idleLabel="Reopen"
                              />
                            `
                      }
                      ${
                        card.status !== "dismissed"
                          ? html`
                              <${ActionButton}
                                onClick=${() =>
                                  onUpdateStatus(card, "dismissed")}
                                tone="ghost"
                                idleLabel="Dismiss"
                              />
                            `
                          : html`
                              <${ActionButton}
                                onClick=${() => onUpdateStatus(card, "open")}
                                tone="ghost"
                                idleLabel="Restore"
                              />
                            `
                      }
                    </div>
                  </div>
                `,
              )}
            </div>
          `
        : hideEmptyState
          ? null
          : html`
              <div class="ac-surface-inset rounded-xl p-4 space-y-1.5">
                <p class="text-xs text-gray-300 leading-5">
                  No findings currently for this selection.
                </p>
              </div>
            `}
    </div>
  `;
};
