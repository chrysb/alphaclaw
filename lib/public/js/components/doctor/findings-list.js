import { h } from "preact";
import { useState } from "preact/hooks";
import htm from "htm";
import { Badge } from "../badge.js";
import { ActionButton } from "../action-button.js";
import {
  formatDoctorCategory,
  getDoctorCategoryTone,
  getDoctorPriorityTone,
} from "./helpers.js";

const html = htm.bind(h);

const resolveTargetPath = (item) => {
  if (!item) return null;
  if (typeof item === "string") return { path: item };
  if (typeof item === "object" && item.path) return item;
  return null;
};

const formatPathLabel = (filePath, startLine, endLine) => {
  if (startLine && endLine && endLine > startLine)
    return `${filePath}:${startLine}-${endLine}`;
  if (startLine) return `${filePath}:${startLine}`;
  return filePath;
};

const buildLineOptions = (startLine, endLine) => {
  const options = {};
  if (startLine) options.line = startLine;
  if (endLine && endLine > startLine) options.lineEnd = endLine;
  return options;
};

const renderPathLink = (filePath, onOpenFile, { startLine, endLine } = {}) => {
  const label = formatPathLabel(filePath, startLine, endLine);
  return html`
    <button
      type="button"
      class="text-left font-mono ac-tip-link hover:underline cursor-pointer"
      onClick=${(e) => {
        e.preventDefault();
        onOpenFile(
          String(filePath || ""),
          buildLineOptions(startLine, endLine),
        );
      }}
    >
      ${label}
    </button>
  `;
};

const kSnippetCollapseThreshold = 7;

const SnippetBlock = ({ item, onOpenFile, isOutdated }) => {
  const snippet = item.snippet;
  const allLines = String(snippet.text || "").split("\n");
  const isCollapsible = allLines.length > kSnippetCollapseThreshold;
  const [expanded, setExpanded] = useState(!isCollapsible);
  const visibleLines = expanded
    ? allLines
    : allLines.slice(0, kSnippetCollapseThreshold);
  const gutterWidth = String(snippet.endLine || snippet.startLine || 1).length;
  return html`
    <div class="mt-1.5 rounded-lg border border-border overflow-hidden">
      <div
        class="flex items-center justify-between px-3 py-1.5 bg-field border-b border-border"
      >
        <button
          type="button"
          class="text-[11px] font-mono ac-tip-link hover:underline cursor-pointer"
          onClick=${(e) => {
            e.preventDefault();
            onOpenFile(
              String(item.path || ""),
              buildLineOptions(item.startLine, item.endLine),
            );
          }}
        >
          ${formatPathLabel(item.path, item.startLine, item.endLine)}
        </button>
        ${isOutdated
          ? html`<span class="text-[10px] text-status-warning-muted/80"
              >file changed since scan</span
            >`
          : html`<span class="text-[10px] text-fg-dim">snapshot</span>`}
      </div>
      <div class="relative">
        <div
          class="px-3 py-2 text-[11px] leading-[18px] font-mono text-body bg-field"
          style="white-space:pre-wrap;word-break:break-word"
        >
          ${visibleLines.map(
            (line, index) => html`
              <div class="flex">
                <span
                  class="text-fg-dim select-none shrink-0"
                  style="width:${gutterWidth +
                  1}ch;text-align:right;margin-right:1ch"
                  >${snippet.startLine + index}</span
                ><span>${line || " "}</span>
              </div>
            `,
          )}
          ${expanded && snippet.truncated
            ? html`<div class="text-fg-dim italic pl-1">... truncated</div>`
            : ""}
        </div>
        ${isCollapsible && !expanded
          ? html`
              <button
                type="button"
                class="absolute inset-x-0 bottom-0 flex items-end justify-center pb-2 pt-10 cursor-pointer snippet-collapse-fade"
                onClick=${() => setExpanded(true)}
              >
                <span
                  class="text-[10px] text-fg-muted hover:text-white flex items-center gap-1 transition-colors"
                >
                  <span
                    class="inline-block text-xs transition-transform"
                    aria-hidden="true"
                    >▾</span
                  >
                  ${allLines.length} lines
                </span>
              </button>
            `
          : null}
        ${isCollapsible && expanded
          ? html`
              <button
                type="button"
                class="w-full flex items-center justify-center py-1 cursor-pointer bg-field border-t border-border"
                onClick=${() => setExpanded(false)}
              >
                <span class="text-[10px] text-fg-muted flex items-center gap-1">
                  <span
                    class="inline-block transition-transform"
                    aria-hidden="true"
                    >▴</span
                  >
                  collapse
                </span>
              </button>
            `
          : null}
      </div>
    </div>
  `;
};

const renderEvidenceLine = (item = {}, onOpenFile, changedPathsSet) => {
  if (item?.path && item?.snippet) {
    const isOutdated = changedPathsSet.has(item.path);
    return html`<${SnippetBlock}
      item=${item}
      onOpenFile=${onOpenFile}
      isOutdated=${isOutdated}
    />`;
  }
  if (item?.path)
    return renderPathLink(item.path, onOpenFile, {
      startLine: item.startLine,
      endLine: item.endLine,
    });
  if (item?.text) return item.text;
  return JSON.stringify(item);
};

export const DoctorFindingsList = ({
  cards = [],
  busyCardId = 0,
  onAskAgentFix = () => {},
  onUpdateStatus = () => {},
  onOpenFile = () => {},
  changedPaths = [],
  showRunMeta = false,
  hideEmptyState = false,
}) => {
  const changedPathsSet = new Set(changedPaths);
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
                            <h3 class="text-sm font-semibold text-bright">
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
                                    <span class="text-xs text-fg-dim"
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
                              class="text-xs text-body leading-5 pt-1"
                            >
                              ${card.summary}
                            </p>`
                          : null
                      }
                    </div>
                    <details class="group rounded-lg border border-border bg-field">
                      <summary class="list-none cursor-pointer px-3 py-2.5 text-xs text-fg-muted group-open:border-b group-open:border-border">
                        <span class="inline-flex items-center gap-2">
                          <span
                            class="inline-block text-fg-muted transition-transform duration-200 group-open:rotate-90"
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
                          <p class="text-xs text-body mt-1 leading-5">
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
                                    ${card.targetPaths.map((rawItem) => {
                                      const resolved =
                                        resolveTargetPath(rawItem);
                                      if (!resolved) return null;
                                      const label = formatPathLabel(
                                        resolved.path,
                                        resolved.startLine,
                                        resolved.endLine,
                                      );
                                      return html`
                                        <button
                                          type="button"
                                          class="text-[11px] px-2 py-1 rounded-md bg-field border border-border font-mono text-body hover:text-white hover:border-fg-muted cursor-pointer transition-colors"
                                          onClick=${(e) => {
                                            e.preventDefault();
                                            onOpenFile(
                                              String(resolved.path || ""),
                                              buildLineOptions(
                                                resolved.startLine,
                                                resolved.endLine,
                                              ),
                                            );
                                          }}
                                        >
                                          ${label}
                                        </button>
                                      `;
                                    })}
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
                                  <div class="mt-1 space-y-2">
                                    ${card.evidence.map(
                                      (item) => html`
                                        <div class="text-xs text-fg-muted">
                                          ${renderEvidenceLine(
                                            item,
                                            onOpenFile,
                                            changedPathsSet,
                                          )}
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
                <p class="text-xs text-body leading-5">
                  No findings currently for this selection.
                </p>
              </div>
            `}
    </div>
  `;
};
