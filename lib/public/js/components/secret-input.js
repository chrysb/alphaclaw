import { h } from "preact";
import { useState } from "preact/hooks";
import htm from "htm";
import { LoadingSpinner } from "./loading-spinner.js";
const html = htm.bind(h);

/**
 * Reusable input with show/hide toggle for secret values.
 *
 * Props:
 *   value, onInput, placeholder, inputClass, disabled
 *   isSecret  – treat as password field (default true)
 */
export const SecretInput = ({
  value = "",
  onInput,
  onBlur,
  placeholder = "",
  inputClass = "",
  disabled = false,
  loading = false,
  isSecret = true,
}) => {
  const [visible, setVisible] = useState(false);
  const showToggle = isSecret;
  const isDisabled = disabled || loading;

  return html`
    <div class="flex-1 min-w-0 flex items-center gap-1">
      <input
        type=${isSecret && !visible ? "password" : "text"}
        value=${value}
        placeholder=${placeholder}
        onInput=${onInput}
        onBlur=${onBlur}
        disabled=${isDisabled}
        class=${inputClass}
        autocomplete="off"
      />
      ${loading
        ? html`<${LoadingSpinner} className="h-3 w-3 text-fg-muted shrink-0" />`
        : null}
      ${showToggle
        ? html`<button
            type="button"
            onclick=${() => setVisible((v) => !v)}
            disabled=${isDisabled}
            class="text-fg-muted hover:text-body px-1 text-xs shrink-0"
          >
            ${visible ? "Hide" : "Show"}
          </button>`
        : null}
    </div>
  `;
};
