import { h } from "preact";
import { useEffect, useState } from "preact/hooks";
import htm from "htm";
import { LoadingSpinner } from "./loading-spinner.js";
const html = htm.bind(h);
export const kSecretInputMask = "************";

export const shouldConcealSecretInput = ({
  isSecret = true,
  visible = false,
  editingMasked = false,
  value = "",
} = {}) => Boolean(isSecret && !visible && !editingMasked && value);

export const getSecretInputValue = ({
  isSecret = true,
  visible = false,
  editingMasked = false,
  value = "",
  draftValue = "",
  mask = kSecretInputMask,
} = {}) => {
  if (!isSecret || visible) return value || "";
  if (editingMasked) return draftValue || "";
  return value ? mask : "";
};

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
  onReveal,
  onRevealError,
  placeholder = "",
  inputClass = "",
  disabled = false,
  loading = false,
  isSecret = true,
}) => {
  const [visible, setVisible] = useState(false);
  const [editingMasked, setEditingMasked] = useState(false);
  const [draftValue, setDraftValue] = useState("");
  const [revealing, setRevealing] = useState(false);
  const [revealedValue, setRevealedValue] = useState(null);
  const showToggle = isSecret;
  const isDisabled = disabled || loading || revealing;
  const effectiveValue =
    revealedValue === null || revealedValue === undefined ? value : revealedValue;
  const concealed = shouldConcealSecretInput({
    isSecret,
    visible,
    editingMasked,
    value: effectiveValue,
  });
  const displayValue = getSecretInputValue({
    isSecret,
    visible,
    editingMasked,
    value: effectiveValue,
    draftValue,
  });

  useEffect(() => {
    setRevealedValue(null);
  }, [value]);

  const clearMaskedDraft = () => {
    setEditingMasked(false);
    setDraftValue("");
  };

  const handleFocus = () => {
    if (!concealed) return;
    setEditingMasked(true);
    setDraftValue("");
  };

  const handleInput = (event) => {
    if (visible && revealedValue !== null && revealedValue !== undefined) {
      setRevealedValue(event?.target?.value || "");
    }
    if (isSecret && !visible) {
      setEditingMasked(true);
      setDraftValue(event?.target?.value || "");
    }
    onInput?.(event);
  };

  const handleBlur = (event) => {
    if (isSecret && !visible) clearMaskedDraft();
    onBlur?.(event);
  };

  const handleToggleVisible = async () => {
    clearMaskedDraft();
    if (visible) {
      setVisible(false);
      setRevealedValue(null);
      return;
    }
    if (typeof onReveal === "function") {
      setRevealing(true);
      try {
        const revealed = await onReveal();
        setRevealedValue(String(revealed || ""));
        setVisible(true);
      } catch (err) {
        onRevealError?.(err);
      } finally {
        setRevealing(false);
      }
      return;
    }
    setVisible(true);
  };

  return html`
    <div class="flex-1 min-w-0 flex items-center gap-1">
      <input
        type=${isSecret && !visible ? "password" : "text"}
        value=${displayValue}
        placeholder=${placeholder}
        onFocus=${handleFocus}
        onInput=${handleInput}
        onBlur=${handleBlur}
        disabled=${isDisabled}
        class=${inputClass}
        autocomplete="off"
      />
      ${loading || revealing
        ? html`<${LoadingSpinner} className="h-3 w-3 text-fg-muted shrink-0" />`
        : null}
      ${showToggle
        ? html`<button
            type="button"
            onclick=${handleToggleVisible}
            disabled=${isDisabled}
            class="text-fg-muted hover:text-body px-1 text-xs shrink-0"
          >
            ${visible ? "Hide" : revealing ? "..." : "Show"}
          </button>`
        : null}
    </div>
  `;
};
