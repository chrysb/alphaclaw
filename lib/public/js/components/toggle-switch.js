import { h } from "preact";
import htm from "htm";

const html = htm.bind(h);

export const ToggleSwitch = ({
  checked = false,
  disabled = false,
  onChange = () => {},
  label = "Enabled",
}) => html`
  <label class="ac-toggle">
    <input
      class="ac-toggle-input"
      type="checkbox"
      checked=${!!checked}
      disabled=${!!disabled}
      onchange=${(e) => onChange(!!e.target.checked)}
    />
    <span class="ac-toggle-track" aria-hidden="true">
      <span class="ac-toggle-thumb"></span>
    </span>
    ${label ? html`<span class="ac-toggle-label">${label}</span>` : null}
  </label>
`;
