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
 */
export const SegmentedControl = ({
  options = [],
  value,
  onChange = () => {},
  className = "",
}) => html`
  <div class=${`ac-segmented-control ${className}`}>
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
