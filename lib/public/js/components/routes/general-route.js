import { h } from "preact";
import htm from "htm";
import { GeneralTab } from "../general/index.js";

const html = htm.bind(h);

export const GeneralRoute = ({
  statusData = null,
  watchdogData = null,
  doctorStatusData = null,
  agents = [],
  doctorWarningDismissedUntilMs = 0,
  onRefreshStatuses = () => {},
  onSetLocation = () => {},
  onNavigate = () => {},
  restartingGateway = false,
  onRestartGateway = () => {},
  restartSignal = 0,
  onRestartRequired = () => {},
  onDismissDoctorWarning = () => {},
}) => html`
  <div class="pt-4">
    <${GeneralTab}
      statusData=${statusData}
      watchdogData=${watchdogData}
      doctorStatusData=${doctorStatusData}
      agents=${agents}
      doctorWarningDismissedUntilMs=${doctorWarningDismissedUntilMs}
      onRefreshStatuses=${onRefreshStatuses}
      onSwitchTab=${(nextTab) => onSetLocation(`/${nextTab}`)}
      onNavigate=${onNavigate}
      onOpenGmailWebhook=${() => onSetLocation("/webhooks/gmail")}
      isActive=${true}
      restartingGateway=${restartingGateway}
      onRestartGateway=${onRestartGateway}
      restartSignal=${restartSignal}
      onRestartRequired=${onRestartRequired}
      onDismissDoctorWarning=${onDismissDoctorWarning}
    />
  </div>
`;
