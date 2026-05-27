import { h } from "preact";
import htm from "htm";
import {
  getSessionDisplayLabel,
  getSessionRowKey,
} from "../lib/session-keys.js";

const html = htm.bind(h);

export const SessionSelectField = ({
  label = "Send to session",
  sessions = [],
  selectedSessionKey = "",
  onChangeSessionKey = () => {},
  disabled = false,
  loading = false,
  error = "",
  allowNone = false,
  noneValue = "__none__",
  noneLabel = "None",
  emptyOptionLabel = "No sessions available",
  helperText = "",
  emptyStateText = "",
  loadingLabel = "Loading sessions...",
  containerClassName = "space-y-2",
  labelClassName = "text-xs text-fg-muted",
  selectClassName = "w-full bg-field border border-border rounded-lg px-3 py-2 text-xs text-body focus:border-fg-muted",
  helperClassName = "text-xs text-fg-muted",
  statusClassName = "text-xs text-fg-muted",
  errorClassName = "text-xs text-status-error-muted",
}) => {
  const resolvedValue = selectedSessionKey || (allowNone ? noneValue : "");
  const isDisabled = disabled || loading;
  return html`
    <div class=${containerClassName}>
      ${label
        ? html`<label class=${labelClassName}>${label}</label>`
        : null}
      <select
        value=${resolvedValue}
        onInput=${(event) => {
          const nextValue = String(event.currentTarget?.value || "");
          onChangeSessionKey(allowNone && nextValue === noneValue ? "" : nextValue);
        }}
        disabled=${isDisabled}
        class=${selectClassName}
      >
        ${loading
          ? html`<option value=${resolvedValue || ""}>${loadingLabel}</option>`
          : html`
              ${allowNone
                ? html`<option value=${noneValue}>${noneLabel}</option>`
                : null}
              ${!allowNone && sessions.length === 0
                ? html`<option value="">${emptyOptionLabel}</option>`
                : null}
              ${sessions.map(
                (sessionRow) => html`
                  <option value=${getSessionRowKey(sessionRow)}>
                    ${String(
                      getSessionDisplayLabel(sessionRow) ||
                        getSessionRowKey(sessionRow) ||
                        "Session",
                    )}
                  </option>
                `,
              )}
            `}
      </select>
      ${helperText
        ? html`<div class=${helperClassName}>${helperText}</div>`
        : null}
      ${error
        ? html`<div class=${errorClassName}>${error}</div>`
        : null}
      ${
        !loading && !error && emptyStateText && sessions.length === 0
          ? html`<div class=${statusClassName}>${emptyStateText}</div>`
          : null
      }
    </div>
  `;
};
