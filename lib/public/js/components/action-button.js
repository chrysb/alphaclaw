import { h } from "https://esm.sh/preact";
import htm from "https://esm.sh/htm";
import { LoadingSpinner } from "./loading-spinner.js";

const html = htm.bind(h);

const kStaticToneClassByTone = {
  primary: "ac-btn-cyan",
  secondary: "ac-btn-secondary",
  success: "ac-btn-green",
  danger: "ac-btn-danger",
  ghost: "ac-btn-ghost",
};

const getToneClass = (tone, isInteractive) => {
  if (tone === "subtle") {
    return isInteractive
      ? "border border-border text-gray-500 hover:text-gray-300 hover:border-gray-500"
      : "border border-border text-gray-500";
  }
  if (tone === "neutral") {
    return isInteractive
      ? "border border-border text-gray-500 hover:text-gray-300 hover:border-gray-500"
      : "border border-border text-gray-500";
  }
  if (tone === "warning") {
    return isInteractive
      ? "border border-yellow-500/35 text-yellow-400 bg-yellow-500/10 hover:border-yellow-400/60 hover:text-yellow-300 hover:bg-yellow-500/15"
      : "border border-yellow-500/35 text-yellow-400 bg-yellow-500/10";
  }
  return kStaticToneClassByTone[tone] || kStaticToneClassByTone.primary;
};

const kSizeClassBySize = {
  sm: "h-7 text-xs leading-none px-2.5 py-1 rounded-lg",
  md: "h-9 text-sm font-medium leading-none px-4 rounded-xl",
  lg: "h-10 text-sm font-medium leading-none px-5 rounded-lg",
};
const kIconOnlySizeClassBySize = {
  sm: "h-7 w-7 p-0 rounded-lg",
  md: "h-9 w-9 p-0 rounded-xl",
  lg: "h-10 w-10 p-0 rounded-lg",
};

export const ActionButton = ({
  onClick,
  type = "button",
  disabled = false,
  loading = false,
  tone = "primary",
  size = "sm",
  idleLabel = "Action",
  loadingLabel = "Working...",
  loadingMode = "replace",
  className = "",
  idleIcon = null,
  idleIconClassName = "h-3 w-3",
  iconOnly = false,
  title = "",
  ariaLabel = "",
}) => {
  const isDisabled = disabled || loading;
  const isInteractive = !isDisabled;
  const toneClass = getToneClass(tone, isInteractive);
  const sizeClass = iconOnly
    ? kIconOnlySizeClassBySize[size] || kIconOnlySizeClassBySize.sm
    : kSizeClassBySize[size] || kSizeClassBySize.sm;
  const loadingClass = loading
    ? `cursor-not-allowed ${
        tone === "warning"
          ? "opacity-90 animate-pulse shadow-[0_0_0_1px_rgba(234,179,8,0.22),0_0_18px_rgba(234,179,8,0.12)]"
          : "opacity-80"
      }`
    : "";
  const spinnerSizeClass =
    size === "md" || size === "lg" ? "h-4 w-4" : "h-3 w-3";
  const isInlineLoading = loadingMode === "inline";
  const IdleIcon = idleIcon;
  const idleContent =
    iconOnly && IdleIcon
      ? html`<${IdleIcon} className=${idleIconClassName} />`
      : IdleIcon
        ? html`
            <span class="inline-flex items-center gap-1.5 leading-none">
              <${IdleIcon} className=${idleIconClassName} />
              ${idleLabel}
            </span>
          `
        : idleLabel;
  const currentLabel = loading && !isInlineLoading ? loadingLabel : idleContent;

  return html`
    <button
      type=${type}
      onclick=${onClick}
      disabled=${isDisabled}
      title=${title}
      aria-label=${ariaLabel || null}
      class="inline-flex items-center justify-center transition-colors whitespace-nowrap ${sizeClass} ${toneClass} ${loadingClass} ${className}"
    >
      ${isInlineLoading
        ? html`
            <span
              class="relative inline-flex items-center justify-center leading-none"
            >
              <span class=${loading ? "invisible" : ""}>${currentLabel}</span>
              ${loading
                ? html`
                    <span
                      class="absolute inset-0 inline-flex items-center justify-center"
                    >
                      <${LoadingSpinner} className=${spinnerSizeClass} />
                    </span>
                  `
                : null}
            </span>
          `
        : loading
          ? html`
              <span class="inline-flex items-center gap-1.5 leading-none">
                <${LoadingSpinner} className=${spinnerSizeClass} />
                ${currentLabel}
              </span>
            `
          : currentLabel}
    </button>
  `;
};
