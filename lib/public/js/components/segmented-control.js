import { h } from "https://esm.sh/preact";
import htm from "https://esm.sh/htm";

const html = htm.bind(h);

/**
 * Reusable segmented control (pill toggle).
 *
 * @param {Object}   props
 * @param {Array<{label:string, value:*}>} props.options
 * @param {*}        props.value        Currently selected value.
 * @param {Function} props.onChange      Called with the new value on click.
 * @param {string}   [props.className]  Extra classes on the wrapper.
 * @param {"sm"|"lg"} [props.size]      Visual size variant.
 * @param {boolean}  [props.fullWidth]  Stretch wrapper and options to 100%.
 */
export const SegmentedControl = ({
  options = [],
  value,
  onChange = () => {},
  className = "",
  size = "sm",
  fullWidth = false,
}) => html`
  <div
    class=${`ac-segmented-control ${size === "lg" ? "ac-segmented-control-lg" : ""} ${fullWidth ? "ac-segmented-control-full" : ""} ${className}`.trim()}
  >
    ${options.map(
      (option) => html`
        <button
          class=${`ac-segmented-control-button ${option.value === value ? "active" : ""}`}
          onclick=${() => onChange(option.value)}
        >
          ${option.label}
        </button>
      `,
    )}
  </div>
`;
