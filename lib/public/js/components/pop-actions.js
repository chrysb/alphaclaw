import { h } from "https://esm.sh/preact";
import { useState, useEffect, useRef } from "https://esm.sh/preact/hooks";
import htm from "https://esm.sh/htm";

const html = htm.bind(h);

const kEnterDurationMs = 260;
const kExitDurationMs = 200;

/**
 * Wrapper that pop-animates children in/out based on `visible`.
 * Use for header save/cancel actions or any contextual action group.
 *
 * @param {boolean}  props.visible   Whether the actions should be shown.
 * @param {string}   [props.className] Extra classes on the container.
 * @param {preact.ComponentChildren} props.children
 */
export const PopActions = ({ visible = false, className = "", children }) => {
  const [phase, setPhase] = useState(visible ? "visible" : "hidden");
  const enterTimerRef = useRef(null);
  const exitTimerRef = useRef(null);

  useEffect(() => {
    clearTimeout(enterTimerRef.current);
    clearTimeout(exitTimerRef.current);
    if (visible) {
      if (phase !== "visible") {
        setPhase("entering");
        enterTimerRef.current = setTimeout(
          () => setPhase("visible"),
          kEnterDurationMs,
        );
      }
    } else if (phase !== "hidden") {
      setPhase("exiting");
      exitTimerRef.current = setTimeout(() => setPhase("hidden"), kExitDurationMs);
    }
    return () => {
      clearTimeout(enterTimerRef.current);
      clearTimeout(exitTimerRef.current);
    };
  }, [visible, phase]);

  const phaseClass =
    phase === "entering"
      ? "ac-pop-actions-in"
      : phase === "exiting"
        ? "ac-pop-actions-out"
        : phase === "visible"
          ? "ac-pop-actions-visible"
        : "ac-pop-actions-hidden";

  return html`
    <div class=${`ac-pop-actions ${phaseClass} ${className}`.trim()}>
      ${children}
    </div>
  `;
};
