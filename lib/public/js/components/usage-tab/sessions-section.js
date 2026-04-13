import { h } from "preact";
import htm from "htm";
import {
  formatDurationCompactMs,
  formatInteger,
  formatLocaleDateTimeWithTodayTime,
  formatUsd,
} from "../../lib/format.js";
import { kBadgeToneClass } from "./constants.js";

const html = htm.bind(h);

const formatCountLabel = (value, singular, plural) => {
  const count = Number(value || 0);
  const label = count === 1 ? singular : plural;
  return `${formatInteger(count)} ${label}`;
};

const SessionBadges = ({ session }) => {
  const labels = session?.labels;
  if (!Array.isArray(labels) || labels.length === 0) {
    const fallback = String(session?.sessionKey || session?.sessionId || "");
    return html`<span class="truncate">${fallback}</span>`;
  }
  return html`
    <span class="inline-flex items-center gap-1.5 flex-wrap">
      ${labels.map(
        (badge) => html`
          <span
            class=${`inline-flex items-center px-1.5 py-0.5 rounded border text-[11px] leading-tight ${kBadgeToneClass[badge.tone] || kBadgeToneClass.gray}`}
          >
            ${badge.label}
          </span>
        `,
      )}
    </span>
  `;
};

const SessionInlineDetail = ({
  item,
  expandedSessionIds,
  loadingDetailById,
  sessionDetailById,
}) => {
  const itemSessionId = String(item.sessionId || "");
  const isExpanded = expandedSessionIds.includes(itemSessionId);
  if (!isExpanded) return null;
  const detail = sessionDetailById[itemSessionId];
  const loadingDetail = !!loadingDetailById[itemSessionId];
  if (loadingDetail) {
    return html`
      <div class="ac-history-body">
        <p class="text-xs text-fg-muted">Loading session detail...</p>
      </div>
    `;
  }
  if (!detail) {
    return html`
      <div class="ac-history-body">
        <p class="text-xs text-fg-muted">Session detail not available.</p>
      </div>
    `;
  }
  const sessionKeyValue = String(
    detail.sessionKey || item.sessionKey || detail.sessionId || item.sessionId || "",
  ).trim();
  return html`
    <div class="ac-history-body space-y-3 border-0 pt-0 mt-0">
      <div>
        <p class="text-[11px] text-fg-muted mb-1">Session key</p>
        <p class="text-xs text-body font-mono break-all">${sessionKeyValue || "n/a"}</p>
      </div>
      <div class="mt-1.5">
        <p class="text-[11px] text-fg-muted mb-1">Model breakdown</p>
        ${(detail.modelBreakdown || []).length === 0
          ? html`<p class="text-xs text-fg-muted">No model usage recorded.</p>`
          : html`
              <div class="space-y-1.5">
                ${(detail.modelBreakdown || []).map(
                  (row) => html`
                    <div class="flex items-center justify-between gap-3 text-xs px-1 py-0.5 rounded hover:bg-surface transition-colors">
                      <span class="text-body truncate">${row.model || "unknown"}</span>
                      <span class="inline-flex items-center gap-3 text-fg-muted shrink-0">
                        <span>${formatInteger(row.totalTokens)} tok</span>
                        <span>${formatUsd(row.totalCost)}</span>
                        <span>${formatCountLabel(row.turnCount, "turn", "turns")}</span>
                      </span>
                    </div>
                  `,
                )}
              </div>
            `}
      </div>
      <div>
        <p class="text-[11px] text-fg-muted mb-1">Tool usage</p>
        ${(detail.toolUsage || []).length === 0
          ? html`<p class="text-xs text-fg-muted">No tool calls recorded.</p>`
          : html`
              <div class="space-y-1.5">
                ${(detail.toolUsage || []).map(
                  (row) => html`
                    <div class="flex items-center justify-between gap-3 text-xs px-1 py-0.5 rounded hover:bg-surface transition-colors">
                      <span class="text-body truncate">${row.toolName}</span>
                      <span class="inline-flex items-center gap-3 text-fg-muted shrink-0">
                        <span>${formatCountLabel(row.callCount, "call", "calls")}</span>
                        <span>${(Number(row.errorRate || 0) * 100).toFixed(1)}% err</span>
                        <span>${formatDurationCompactMs(row.avgDurationMs)}</span>
                      </span>
                    </div>
                  `,
                )}
              </div>
            `}
      </div>
    </div>
  `;
};

export const SessionsSection = ({
  sessions = [],
  loadingSessions = false,
  expandedSessionIds = [],
  loadingDetailById = {},
  sessionDetailById = {},
  onToggleSession = () => {},
}) => html`
  <div class="bg-surface border border-border rounded-xl p-4">
    <h2 class="card-label text-xs mb-3">Sessions</h2>
    <div class="ac-history-list">
      ${sessions.length === 0
        ? html`<p class="text-xs text-fg-muted">
            ${loadingSessions ? "Loading sessions..." : "No sessions recorded yet."}
          </p>`
        : sessions.map(
            (item) => html`
              <details
                class="ac-history-item"
                open=${expandedSessionIds.includes(String(item.sessionId || ""))}
                ontoggle=${(e) => {
                  const itemSessionId = String(item.sessionId || "");
                  const isOpen = !!e.currentTarget?.open;
                  onToggleSession(itemSessionId, isOpen);
                }}
              >
                <summary class="ac-history-summary hover:bg-surface transition-colors">
                  <div class="ac-history-summary-row">
                    <span class="inline-flex items-center gap-2 min-w-0">
                      <span class="ac-history-toggle shrink-0" aria-hidden="true">▸</span>
                      <${SessionBadges} session=${item} />
                    </span>
                    <span class="inline-flex items-center gap-3 shrink-0 text-xs text-fg-muted">
                      <span>${formatInteger(item.totalTokens)} tok</span>
                      <span>${formatUsd(item.totalCost)}</span>
                      <span>
                        ${formatLocaleDateTimeWithTodayTime(item.lastActivityMs, {
                          fallback: "n/a",
                          valueIsEpochMs: true,
                        })}
                      </span>
                    </span>
                  </div>
                </summary>
                <${SessionInlineDetail}
                  item=${item}
                  expandedSessionIds=${expandedSessionIds}
                  loadingDetailById=${loadingDetailById}
                  sessionDetailById=${sessionDetailById}
                />
              </details>
            `,
          )}
    </div>
  </div>
`;
