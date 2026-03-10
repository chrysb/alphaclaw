import { h } from "https://esm.sh/preact";
import htm from "https://esm.sh/htm";

const html = htm.bind(h);

const VerticalDotsIcon = ({ className = "" }) => html`
  <svg class=${className} width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
    <circle cx="8" cy="3" r="1.5" />
    <circle cx="8" cy="8" r="1.5" />
    <circle cx="8" cy="13" r="1.5" />
  </svg>
`;

export const OverflowMenu = ({
  open = false,
  onToggle = () => {},
  ariaLabel = "Open menu",
  title = "",
  menuRef = null,
  renderTrigger = null,
  triggerDisabled = false,
  children = null,
}) => html`
  <div class="brand-menu" ref=${menuRef}>
    ${typeof renderTrigger === "function"
      ? renderTrigger({
          open,
          onToggle: (event) => {
            event.stopPropagation();
            onToggle(event);
          },
          ariaLabel,
          title: title || ariaLabel,
        })
      : html`
          <button
            type="button"
            class="brand-menu-trigger"
            aria-label=${ariaLabel}
            aria-expanded=${open ? "true" : "false"}
            title=${title || ariaLabel}
            disabled=${triggerDisabled}
            onclick=${(event) => {
              event.stopPropagation();
              onToggle(event);
            }}
          >
            <${VerticalDotsIcon} />
          </button>
        `}
    ${open
      ? html`
          <div class="brand-dropdown" onclick=${(event) => event.stopPropagation()}>
            ${children}
          </div>
        `
      : null}
  </div>
`;

export const OverflowMenuItem = ({
  children = null,
  onClick = () => {},
  className = "",
  iconSrc = "",
  disabled = false,
}) => html`
  <button
    type="button"
    class=${`brand-dropdown-item ${className} ${disabled
      ? "opacity-50 cursor-not-allowed"
      : ""}`.trim()}
    disabled=${disabled}
    onclick=${(event) => {
      event.stopPropagation();
      if (disabled) return;
      onClick(event);
    }}
  >
    ${iconSrc
      ? html`
          <span class="flex w-full items-center gap-2 leading-none">
            <img
              src=${iconSrc}
              alt=""
              class="block w-4 h-4 rounded-sm"
              aria-hidden="true"
            />
            <span>${children}</span>
          </span>
        `
      : children}
  </button>
`;
