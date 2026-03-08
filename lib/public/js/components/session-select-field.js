import { h } from "https://esm.sh/preact";
import htm from "https://esm.sh/htm";

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
  labelClassName = "text-xs text-gray-500",
  selectClassName = "w-full bg-black/30 border border-border rounded-lg px-3 py-2 text-xs text-gray-200 focus:border-gray-500",
  helperClassName = "text-xs text-gray-500",
  statusClassName = "text-xs text-gray-500",
  errorClassName = "text-xs text-red-400",
}) => {
  return html`
    <div class=${containerClassName}>
      ${label
        ? html`<label class=${labelClassName}>${label}</label>`
        : null}
      <select
        value=${selectedSessionKey || (allowNone ? noneValue : "")}
        onInput=${(event) => {
          const nextValue = String(event.currentTarget?.value || "");
          onChangeSessionKey(allowNone && nextValue === noneValue ? "" : nextValue);
        }}
        disabled=${disabled}
        class=${selectClassName}
      >
        ${allowNone
          ? html`<option value=${noneValue}>${noneLabel}</option>`
          : null}
        ${!allowNone && sessions.length === 0
          ? html`<option value="">${emptyOptionLabel}</option>`
          : null}
        ${sessions.map(
          (sessionRow) => html`
            <option value=${String(sessionRow?.key || "")}>
              ${String(sessionRow?.label || sessionRow?.key || "Session")}
            </option>
          `,
        )}
      </select>
      ${helperText
        ? html`<div class=${helperClassName}>${helperText}</div>`
        : null}
      ${loading
        ? html`<div class=${statusClassName}>${loadingLabel}</div>`
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
