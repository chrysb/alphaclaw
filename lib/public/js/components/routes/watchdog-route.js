import { h } from "https://esm.sh/preact";
import htm from "https://esm.sh/htm";
import { WatchdogTab } from "../watchdog-tab/index.js";

const html = htm.bind(h);

export const WatchdogRoute = ({
  statusData = null,
  watchdogStatus = null,
  onRefreshStatuses = () => {},
  restartingGateway = false,
  onRestartGateway = () => {},
  restartSignal = 0,
  openclawUpdateInProgress = false,
  onOpenclawVersionActionComplete = () => {},
  onOpenclawUpdate = () => {},
}) => html`
  <div class="pt-4">
    <${WatchdogTab}
      gatewayStatus=${statusData?.gateway || null}
      openclawVersion=${statusData?.openclawVersion || null}
      diagnostics=${statusData?.diagnostics || null}
      watchdogStatus=${watchdogStatus}
      onRefreshStatuses=${onRefreshStatuses}
      restartingGateway=${restartingGateway}
      onRestartGateway=${onRestartGateway}
      restartSignal=${restartSignal}
      openclawUpdateInProgress=${openclawUpdateInProgress}
      onOpenclawVersionActionComplete=${onOpenclawVersionActionComplete}
      onOpenclawUpdate=${onOpenclawUpdate}
    />
  </div>
`;
