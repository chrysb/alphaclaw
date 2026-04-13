import { h } from "preact";
import htm from "htm";

const html = htm.bind(h);

export const WelcomeHeader = ({
  groups,
  step,
  isPreStep,
  isSetupStep,
  isPairingStep,
  stepNumber,
  activeStepLabel,
}) => {
  const progressSteps = [
    ...groups,
    { id: "setup", title: "Initializing" },
    { id: "pairing", title: "Pairing" },
  ];

  return html`
    <div class="text-center mb-1">
      <span
        class="ac-logo-mark block mx-auto mb-3"
        style="--ac-logo-width: 32px; --ac-logo-height: 33px;"
        aria-hidden="true"
      ></span>
      <h1 class="text-2xl font-semibold mb-2">Setup</h1>
      <p style="color: var(--text-muted)" class="text-sm">
        Let's get your agent running
      </p>
      <div class="mt-4 mb-2 flex items-center justify-center">
        <span
          class="text-[11px] px-2.5 py-1 rounded-full border border-border font-medium"
          style="background: var(--field-bg-contrast); color: var(--text-muted)"
        >
          ${isPreStep
            ? "Choose your destiny"
            : `Step ${stepNumber} of ${progressSteps.length} - ${activeStepLabel}`}
        </span>
      </div>
    </div>

    <div class="flex items-center gap-2">
      ${progressSteps.map((group, idx) => {
        const isActive = idx === step;
        const isComplete =
          idx < step || (isSetupStep && group.id === "setup");
        const isPairingComplete =
          idx < step || (isPairingStep && group.id === "pairing");
        const bg = isPreStep
          ? "var(--border-strong)"
          : isActive
            ? "var(--accent)"
            : group.id === "pairing"
              ? isPairingComplete
                ? "var(--accent-dim)"
                : "var(--border-strong)"
              : isComplete
                ? "var(--accent-dim)"
                : "var(--border-strong)";
        return html`
          <div
            class="h-1 flex-1 rounded-full transition-colors ${isActive ? "ac-step-pill-pulse" : ""}"
            style=${{ background: bg }}
            title=${group.title}
          ></div>
        `;
      })}
    </div>
  `;
};
