import { h } from "https://esm.sh/preact";
import htm from "https://esm.sh/htm";

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
      <img
        src="./img/logo.svg"
        alt="alphaclaw"
        class="mx-auto mb-3"
        width="32"
        height="33"
      />
      <h1 class="text-2xl font-semibold mb-2">Setup</h1>
      <p style="color: var(--text-muted)" class="text-sm">
        Let's get your agent running
      </p>
      <div class="mt-4 mb-2 flex items-center justify-center">
        <span
          class="text-[11px] px-2.5 py-1 rounded-full border border-border font-medium"
          style="background: rgba(0, 0, 0, 0.3); color: var(--text-muted)"
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
          ? "rgba(82, 94, 122, 0.45)"
          : isActive
            ? "rgba(99, 235, 255, 0.9)"
            : group.id === "pairing"
              ? isPairingComplete
                ? "rgba(99, 235, 255, 0.55)"
                : "rgba(82, 94, 122, 0.45)"
              : isComplete
                ? "rgba(99, 235, 255, 0.55)"
                : "rgba(82, 94, 122, 0.45)";
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
