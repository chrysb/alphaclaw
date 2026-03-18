import { h } from "preact";
import htm from "htm";
import { ActionButton } from "../action-button.js";
import { getDoctorWarningMessage, shouldShowDoctorWarning } from "./helpers.js";

const html = htm.bind(h);

export const GeneralDoctorWarning = ({
  doctorStatus = null,
  dismissedUntilMs = 0,
  onOpenDoctor = () => {},
  onDismiss = () => {},
}) => {
  if (!shouldShowDoctorWarning(doctorStatus, dismissedUntilMs)) return null;
  return html`
    <div class="bg-yellow-500/10 border border-yellow-500/35 rounded-xl p-4">
      <div class="flex flex-col gap-3">
        <div class="space-y-1">
          <h2 class="font-semibold text-sm text-yellow-300">Drift Doctor</h2>
          <p class="text-xs text-yellow-100/80">${getDoctorWarningMessage(doctorStatus)}</p>
        </div>
        <div class="flex flex-wrap gap-2">
          <${ActionButton}
            onClick=${onDismiss}
            tone="secondary"
            idleLabel="Dismiss for 1 week"
          />
          <${ActionButton}
            onClick=${onOpenDoctor}
            tone="warning"
            idleLabel="Open Drift Doctor"
          />
        </div>
      </div>
    </div>
  `;
};
