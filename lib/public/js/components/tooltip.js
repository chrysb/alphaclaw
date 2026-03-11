import { h } from "https://esm.sh/preact";
import { useEffect, useRef, useState } from "https://esm.sh/preact/hooks";
import { createPortal } from "https://esm.sh/preact/compat";
import htm from "https://esm.sh/htm";

const html = htm.bind(h);

const kViewportPadding = 8;
const kTooltipOffset = 8;
const kWarmWindowMs = 400;

let lastTooltipClosedAt = 0;

const isFocusVisibleWithin = (element) => {
  if (!element || typeof document === "undefined") return false;
  const active = document.activeElement;
  if (!active || !element.contains(active)) return false;
  return typeof active.matches === "function" && active.matches(":focus-visible");
};

const getTooltipPosition = (triggerEl, tooltipEl) => {
  if (!triggerEl) return null;
  const triggerRect = triggerEl.getBoundingClientRect();
  const tooltipRect = tooltipEl?.getBoundingClientRect?.() || {
    width: 0,
    height: 0,
  };
  const minLeft = kViewportPadding + tooltipRect.width / 2;
  const maxLeft = window.innerWidth - kViewportPadding - tooltipRect.width / 2;
  const centeredLeft = triggerRect.left + triggerRect.width / 2;
  const left = tooltipRect.width
    ? Math.min(Math.max(centeredLeft, minLeft), maxLeft)
    : centeredLeft;

  let top = triggerRect.bottom + kTooltipOffset;
  const canRenderAbove =
    triggerRect.top - kTooltipOffset - tooltipRect.height >= kViewportPadding;
  const wouldOverflowBelow =
    top + tooltipRect.height + kViewportPadding > window.innerHeight;
  if (wouldOverflowBelow && canRenderAbove) {
    top = triggerRect.top - kTooltipOffset - tooltipRect.height;
  }

  return {
    left: `${left}px`,
    top: `${Math.max(kViewportPadding, top)}px`,
  };
};

export const Tooltip = ({
  text = "",
  widthClass = "w-64",
  tooltipClassName = "",
  children = null,
  disabled = false,
  delay = 0,
}) => {
  const triggerRef = useRef(null);
  const tooltipRef = useRef(null);
  const delayTimerRef = useRef(null);
  const suppressFocusOpenRef = useRef(false);
  const [open, setOpen] = useState(false);
  const [positionStyle, setPositionStyle] = useState(null);

  useEffect(() => {
    if (!open || disabled || !text) return undefined;

    const updatePosition = () => {
      const nextStyle = getTooltipPosition(triggerRef.current, tooltipRef.current);
      if (nextStyle) setPositionStyle(nextStyle);
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, disabled, text]);

  const handleOpen = () => {
    if (disabled || !text) return;
    const warm = Date.now() - lastTooltipClosedAt < kWarmWindowMs;
    const shouldOpenNow = () =>
      triggerRef.current?.matches?.(":hover") ||
      isFocusVisibleWithin(triggerRef.current);
    if (delay > 0 && !warm) {
      clearTimeout(delayTimerRef.current);
      delayTimerRef.current = setTimeout(() => {
        if (!shouldOpenNow()) return;
        setOpen(true);
      }, delay);
    } else {
      if (!shouldOpenNow()) return;
      setOpen(true);
    }
  };

  const handleClose = () => {
    clearTimeout(delayTimerRef.current);
    if (open) lastTooltipClosedAt = Date.now();
    setOpen(false);
  };

  return html`
    <span
      ref=${triggerRef}
      class="inline-flex"
      onPointerDown=${() => {
        suppressFocusOpenRef.current = true;
        clearTimeout(delayTimerRef.current);
      }}
      onPointerUp=${() => {
        suppressFocusOpenRef.current = false;
      }}
      onPointerCancel=${() => {
        suppressFocusOpenRef.current = false;
      }}
      onMouseEnter=${handleOpen}
      onMouseLeave=${handleClose}
      onFocusIn=${() => {
        if (suppressFocusOpenRef.current) return;
        if (!isFocusVisibleWithin(triggerRef.current)) return;
        handleOpen();
      }}
      onFocusOut=${(event) => {
        suppressFocusOpenRef.current = false;
        if (event.currentTarget.contains(event.relatedTarget)) return;
        handleClose();
      }}
    >
      ${children}
      ${open && !disabled && text && typeof document !== "undefined"
        ? createPortal(
            html`
              <span
                ref=${tooltipRef}
                role="tooltip"
                class=${`pointer-events-none fixed left-0 top-0 z-[80] -translate-x-1/2 rounded-md border border-border bg-modal px-2 py-1 text-[11px] text-gray-300 shadow-lg ${widthClass} ${tooltipClassName}`.trim()}
                style=${positionStyle || { visibility: "hidden" }}
              >
                ${text}
              </span>
            `,
            document.body,
          )
        : null}
    </span>
  `;
};
