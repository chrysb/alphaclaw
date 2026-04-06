import { h } from "preact";
import htm from "htm";
import { Gateway } from "../gateway.js";
import { Channels } from "../channels.js";
import { ChannelOperationsPanel } from "../channel-operations-panel.js";
import { Pairings } from "../pairings.js";
import { DevicePairings } from "../device-pairings.js";
import { Google } from "../google/index.js";
import { Features } from "../features.js";
import { GeneralDoctorWarning } from "../doctor/general-warning.js";
import { ChevronDownIcon } from "../icons.js";
import { UpdateActionButton } from "../update-action-button.js";
import { useGeneralTab } from "./use-general-tab.js";

const html = htm.bind(h);

export const GeneralTab = ({
  statusData = null,
  watchdogData = null,
  doctorStatusData = null,
  agents = [],
  doctorWarningDismissedUntilMs = 0,
  onRefreshStatuses = () => {},
  onSwitchTab = () => {},
  onNavigate = () => {},
  onOpenGmailWebhook = () => {},
  isActive = false,
  restartingGateway = false,
  onRestartGateway = () => {},
  restartSignal = 0,
  openclawRestarting = false,
  openclawUpdateInProgress = false,
  onOpenclawVersionActionComplete = () => {},
  onOpenclawUpdate = () => {},
  onRestartRequired = () => {},
  onDismissDoctorWarning = () => {},
}) => {
  const { state, actions } = useGeneralTab({
    statusData,
    watchdogData,
    doctorStatusData,
    onRefreshStatuses,
    isActive,
    restartSignal,
  });

  return html`
    <div class="space-y-4">
      <${Gateway}
        status=${state.gatewayStatus}
        openclawVersion=${state.openclawVersion}
        restarting=${restartingGateway}
        onRestart=${onRestartGateway}
        watchdogStatus=${state.watchdogStatus}
        onOpenWatchdog=${() => onSwitchTab("watchdog")}
        onRepair=${actions.handleWatchdogRepair}
        repairing=${state.repairingWatchdog}
        openclawRestarting=${openclawRestarting}
        openclawUpdateInProgress=${openclawUpdateInProgress}
        onOpenclawVersionActionComplete=${onOpenclawVersionActionComplete}
        onOpenclawUpdate=${onOpenclawUpdate}
      />
      <${GeneralDoctorWarning}
        doctorStatus=${state.doctorStatus}
        dismissedUntilMs=${doctorWarningDismissedUntilMs}
        onOpenDoctor=${() => onSwitchTab("doctor")}
        onDismiss=${onDismissDoctorWarning}
      />
      <${ChannelOperationsPanel}
        channelsSection=${html`
          <${Channels}
            channels=${state.channels}
            agents=${agents}
            onNavigate=${onNavigate}
            onRefreshStatuses=${onRefreshStatuses}
          />
        `}
        pairingsSection=${html`
          <${Pairings}
            pending=${state.pending}
            channels=${state.channels}
            visible=${state.hasUnpaired}
            statusRefreshing=${state.pairingStatusRefreshing}
            onApprove=${actions.handleApprove}
            onReject=${actions.handleReject}
          />
        `}
      />
      <${Features} onSwitchTab=${onSwitchTab} />
      <${Google}
        gatewayStatus=${state.gatewayStatus}
        onRestartRequired=${onRestartRequired}
        onOpenGmailWebhook=${onOpenGmailWebhook}
      />

      ${state.repo &&
      html`
        <div class="bg-surface border border-border rounded-xl p-4">
          <div class="flex items-center justify-between gap-3">
            <div class="flex items-center gap-2 min-w-0">
              <svg
                class="w-4 h-4 text-fg-muted"
                viewBox="0 0 16 16"
                fill="currentColor"
              >
                <path
                  d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"
                />
              </svg>
              <a
                href="https://github.com/${state.repo}"
                target="_blank"
                class="text-sm text-fg-muted hover:text-body transition-colors truncate"
                >${state.repo}</a
              >
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <span class="text-xs text-fg-muted">Auto-sync</span>
              <div class="relative">
                <select
                  value=${state.syncCronChoice}
                  onchange=${(event) =>
                    actions.handleSyncCronChoiceChange(event.target.value)}
                  disabled=${state.savingSyncCron}
                  class="appearance-none bg-field border border-border rounded-lg pl-2.5 pr-9 py-1.5 text-xs text-body ${state.savingSyncCron
                    ? "opacity-50 cursor-not-allowed"
                    : ""}"
                  title=${state.syncCron?.installed === false
                    ? "Not Installed Yet"
                    : state.syncCronStatusText}
                >
                  <option value="disabled">Disabled</option>
                  <option value="*/30 * * * *">Every 30 min</option>
                  <option value="0 * * * *">Hourly</option>
                  <option value="0 0 * * *">Daily</option>
                </select>
                <${ChevronDownIcon}
                  className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-fg-muted"
                />
              </div>
            </div>
          </div>
        </div>
      `}

      <div class="bg-surface border border-border rounded-xl p-4">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="font-semibold text-sm">OpenClaw Gateway Dashboard</h2>
          </div>
          <${UpdateActionButton}
            onClick=${actions.handleOpenDashboard}
            loading=${state.dashboardLoading}
            warning=${false}
            idleLabel="Open"
            loadingLabel="Opening..."
          />
        </div>
        <${DevicePairings}
          pending=${state.devicePending}
          onApprove=${actions.handleDeviceApprove}
          onReject=${actions.handleDeviceReject}
        />
      </div>
    </div>
  `;
};
