import { h } from "preact";
import htm from "htm";

const html = htm.bind(h);

export const LoadingSpinner = ({
  className = "h-4 w-4",
  ariaHidden = true,
  style = "",
}) => html`
  <svg
    class=${`ac-spinner ${className}`.trim()}
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden=${ariaHidden ? "true" : "false"}
    style=${style}
  >
    <circle
      class="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      stroke-width="4"
    />
    <path
      class="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
    />
  </svg>
`;
