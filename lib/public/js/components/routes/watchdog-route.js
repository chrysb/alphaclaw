import { h } from "preact";
import htm from "htm";
import { WatchdogTab } from "../watchdog-tab/index.js";

const html = htm.bind(h);

export const WatchdogRoute = ({
  statusData = null,
  watchdogStatus = null,
  onRefreshStatuses = () => {},
  restartingGateway = false,
  onRestartGateway = () => {},
  restartSignal = 0,
  openclawRestarting = false,
  openclawUpdateInProgress = false,
  onOpenclawVersionActionComplete = () => {},
  onOpenclawUpdate = () => {},
}) => html`
  <div class="pt-4">
    <${WatchdogTab}
      gatewayStatus=${statusData?.gateway || null}
      openclawVersion=${statusData?.openclawVersion || null}
      watchdogStatus=${watchdogStatus}
      onRefreshStatuses=${onRefreshStatuses}
      restartingGateway=${restartingGateway}
      onRestartGateway=${onRestartGateway}
      restartSignal=${restartSignal}
      openclawRestarting=${openclawRestarting}
      openclawUpdateInProgress=${openclawUpdateInProgress}
      onOpenclawVersionActionComplete=${onOpenclawVersionActionComplete}
      onOpenclawUpdate=${onOpenclawUpdate}
    />
  </div>
`;
