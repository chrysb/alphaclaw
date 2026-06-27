import { h } from "preact";
import htm from "htm";

const html = htm.bind(h);

const RowAccessoryChevron = () => html`
  <svg
    width="14"
    height="14"
    viewBox="0 0 16 16"
    fill="none"
    class="text-fg-dim"
    aria-hidden="true"
  >
    <path
      d="M3.5 6L8 10.5L12.5 6"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
`;

export const RowAccessorySelect = ({
  ariaLabel = "",
  title = "",
  value = "",
  disabled = false,
  onChange = () => {},
  children = null,
}) => html`
  <label
    class=${`relative inline-flex shrink-0 items-center justify-end max-w-[12rem] min-w-[5.5rem] ${disabled
      ? "opacity-50 cursor-not-allowed"
      : "cursor-pointer"}`}
  >
    <select
      aria-label=${ariaLabel}
      title=${title || ariaLabel}
      value=${value}
      disabled=${disabled}
      onInput=${(event) => onChange(String(event.currentTarget?.value ?? ""))}
      class="appearance-none bg-transparent border-0 py-0 pl-0 pr-5 w-full text-right text-xs text-fg-muted hover:text-body cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-border rounded disabled:cursor-not-allowed truncate"
    >
      ${children}
    </select>
    <span class="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2">
      <${RowAccessoryChevron} />
    </span>
  </label>
`;
