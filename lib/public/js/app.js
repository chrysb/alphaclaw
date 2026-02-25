import { h, render } from "https://esm.sh/preact";
import { useState, useEffect } from "https://esm.sh/preact/hooks";
import htm from "https://esm.sh/htm";
import {
  fetchStatus,
  fetchPairings,
  approvePairing,
  rejectPairing,
  fetchDevicePairings,
  approveDevice,
  rejectDevice,
  fetchOnboardStatus,
  fetchDashboardUrl,
  updateSyncCron,
} from "./lib/api.js";
import { usePolling } from "./hooks/usePolling.js";
import { Gateway } from "./components/gateway.js";
import { Channels, ALL_CHANNELS } from "./components/channels.js";
import { Pairings } from "./components/pairings.js";
import { DevicePairings } from "./components/device-pairings.js";
import { Google } from "./components/google.js";
import { Models } from "./components/models.js";
import { Welcome } from "./components/welcome.js";
import { Envars } from "./components/envars.js";
import { ToastContainer, showToast } from "./components/toast.js";
import { ChevronDownIcon } from "./components/icons.js";
const html = htm.bind(h);

const GeneralTab = ({ onSwitchTab }) => {
  const [googleKey, setGoogleKey] = useState(0);
  const [dashboardLoading, setDashboardLoading] = useState(false);

  const statusPoll = usePolling(fetchStatus, 15000);
  const status = statusPoll.data;
  const gatewayStatus = status?.gateway ?? null;
  const channels = status?.channels ?? null;
  const repo = status?.repo || null;
  const syncCron = status?.syncCron || null;
  const openclawVersion = status?.openclawVersion || null;
  const [syncCronEnabled, setSyncCronEnabled] = useState(true);
  const [syncCronSchedule, setSyncCronSchedule] = useState("0 * * * *");
  const [savingSyncCron, setSavingSyncCron] = useState(false);
  const [syncCronChoice, setSyncCronChoice] = useState("0 * * * *");

  const hasUnpaired = ALL_CHANNELS.some((ch) => {
    const info = channels?.[ch];
    return info && info.status !== "paired";
  });

  const pairingsPoll = usePolling(
    async () => {
      const d = await fetchPairings();
      return d.pending || [];
    },
    1000,
    { enabled: hasUnpaired && gatewayStatus === "running" },
  );
  const pending = pairingsPoll.data || [];

  // Poll status faster when gateway isn't running yet
  useEffect(() => {
    if (!gatewayStatus || gatewayStatus !== "running") {
      const id = setInterval(statusPoll.refresh, 3000);
      return () => clearInterval(id);
    }
  }, [gatewayStatus, statusPoll.refresh]);

  const refreshAfterAction = () => {
    setTimeout(pairingsPoll.refresh, 500);
    setTimeout(pairingsPoll.refresh, 2000);
    setTimeout(statusPoll.refresh, 3000);
  };

  const handleApprove = async (id, channel) => {
    await approvePairing(id, channel);
    refreshAfterAction();
  };

  const handleReject = async (id, channel) => {
    await rejectPairing(id, channel);
    refreshAfterAction();
  };

  const devicePoll = usePolling(
    async () => {
      const d = await fetchDevicePairings();
      return d.pending || [];
    },
    2000,
    { enabled: gatewayStatus === "running" },
  );
  const devicePending = devicePoll.data || [];

  const handleDeviceApprove = async (id) => {
    await approveDevice(id);
    setTimeout(devicePoll.refresh, 500);
    setTimeout(devicePoll.refresh, 2000);
  };

  const handleDeviceReject = async (id) => {
    await rejectDevice(id);
    setTimeout(devicePoll.refresh, 500);
    setTimeout(devicePoll.refresh, 2000);
  };

  const fullRefresh = () => {
    statusPoll.refresh();
    pairingsPoll.refresh();
    devicePoll.refresh();
    setGoogleKey((k) => k + 1);
  };

  useEffect(() => {
    if (!syncCron) return;
    setSyncCronEnabled(syncCron.enabled !== false);
    setSyncCronSchedule(syncCron.schedule || "0 * * * *");
    setSyncCronChoice(syncCron.enabled === false ? "disabled" : syncCron.schedule || "0 * * * *");
  }, [syncCron?.enabled, syncCron?.schedule]);

  const saveSyncCronSettings = async ({ enabled = syncCronEnabled, schedule = syncCronSchedule }) => {
    if (savingSyncCron) return;
    setSavingSyncCron(true);
    try {
      const data = await updateSyncCron({ enabled, schedule });
      if (!data.ok) throw new Error(data.error || "Could not save sync settings");
      showToast("Sync schedule updated", "success");
      statusPoll.refresh();
    } catch (err) {
      showToast(err.message || "Could not save sync settings", "error");
    }
    setSavingSyncCron(false);
  };

  const syncCronStatusText = syncCronEnabled ? "Enabled" : "Disabled";

  return html`
    <div class="space-y-4">
      <${Gateway} status=${gatewayStatus} openclawVersion=${openclawVersion} />
      <${Channels} channels=${channels} onSwitchTab=${onSwitchTab} />
      <${Pairings}
        pending=${pending}
        channels=${channels}
        visible=${hasUnpaired}
        onApprove=${handleApprove}
        onReject=${handleReject}
      />
      <${Google} key=${googleKey} gatewayStatus=${gatewayStatus} />

      ${repo && html`
        <div class="bg-surface border border-border rounded-xl p-4">
          <div class="flex items-center justify-between gap-3">
            <div class="flex items-center gap-2 min-w-0">
              <svg class="w-4 h-4 text-gray-400" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
              <a href="https://github.com/${repo}" target="_blank" class="text-sm text-gray-400 hover:text-gray-200 transition-colors truncate">${repo}</a>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <span class="text-xs text-gray-400">Auto-sync</span>
              <div class="relative">
                <select
                  value=${syncCronChoice}
                  onchange=${(e) => {
                    const nextChoice = e.target.value;
                    setSyncCronChoice(nextChoice);
                    const nextEnabled = nextChoice !== "disabled";
                    const nextSchedule = nextEnabled ? nextChoice : syncCronSchedule;
                    setSyncCronEnabled(nextEnabled);
                    setSyncCronSchedule(nextSchedule);
                    saveSyncCronSettings({
                      enabled: nextEnabled,
                      schedule: nextSchedule,
                    });
                  }}
                  disabled=${savingSyncCron}
                  class="appearance-none bg-black/30 border border-border rounded-lg pl-2.5 pr-9 py-1.5 text-xs text-gray-300 ${savingSyncCron
                    ? "opacity-50 cursor-not-allowed"
                    : ""}"
                  title=${syncCron?.installed === false ? "Not Installed Yet" : syncCronStatusText}
                >
                  <option value="disabled">Disabled</option>
                  <option value="*/30 * * * *">Every 30 min</option>
                  <option value="0 * * * *">Hourly</option>
                  <option value="0 0 * * *">Daily</option>
                </select>
                <${ChevronDownIcon}
                  className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500"
                />
              </div>
            </div>
          </div>
        </div>
      `}

      <div class="bg-surface border border-border rounded-xl p-4">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="font-semibold text-sm">Gateway Dashboard</h2>
          </div>
          <button
            onclick=${async () => {
              if (dashboardLoading) return;
              setDashboardLoading(true);
              try {
                const data = await fetchDashboardUrl();
                console.log('[dashboard] response:', JSON.stringify(data));
                window.open(data.url || '/openclaw', '_blank');
              } catch (err) {
                console.error('[dashboard] error:', err);
                window.open('/openclaw', '_blank');
              }
              setDashboardLoading(false);
            }}
            disabled=${dashboardLoading}
            class="text-xs px-2.5 py-1 rounded-lg border border-border text-gray-500 hover:text-gray-300 hover:border-gray-500 transition-colors ${dashboardLoading ? 'opacity-50 cursor-not-allowed' : ''}"
          >
            ${dashboardLoading ? 'Opening...' : 'Open'}
          </button>
        </div>
        <${DevicePairings}
          pending=${devicePending}
          onApprove=${handleDeviceApprove}
          onReject=${handleDeviceReject}
        />
      </div>

      <p class="text-center text-gray-600 text-xs">
        <a
          href="#"
          onclick=${(e) => {
            e.preventDefault();
            fullRefresh();
          }}
          class="text-gray-500 hover:text-gray-300"
          >Refresh all</a
        >
      </p>
    </div>
  `;
};

function App() {
  const [onboarded, setOnboarded] = useState(null);
  const [tab, setTab] = useState("general");

  useEffect(() => {
    fetchOnboardStatus()
      .then((data) => setOnboarded(data.onboarded))
      .catch(() => setOnboarded(false));
  }, []);

  // Still loading onboard status
  if (onboarded === null) {
    return html`
      <div class="max-w-lg w-full flex items-center justify-center py-20">
        <svg
          class="animate-spin h-6 w-6 text-gray-500"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          />
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      </div>
      <${ToastContainer} />
    `;
  }

  if (!onboarded) {
    return html`
      <${Welcome} onComplete=${() => setOnboarded(true)} />
      <${ToastContainer} />
    `;
  }

  return html`
    <div class="max-w-lg w-full">
      <div class="sticky top-0 z-10 bg-[#0a0a0a] pb-3">
        <div class="flex items-center gap-3 pb-3">
          <div class="text-4xl">🦞</div>
          <div>
            <h1 class="text-2xl font-semibold">OpenClaw Setup</h1>
            <p class="text-gray-500 text-sm">This should be easy, right?</p>
          </div>
        </div>

        <div class="flex gap-1 border-b border-border">
          ${["general", "models", "envars"].map(
            (t) => html`
              <button
                onclick=${() => setTab(t)}
                class="px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab ===
                t
                  ? "border-white text-white"
                  : "border-transparent text-gray-500 hover:text-gray-300"}"
              >
                ${t === "general" ? "General" : t === "models" ? "Models" : "Envars"}
              </button>
            `,
          )}
        </div>
      </div>

      <div class="space-y-4 pt-4">
        ${tab === "general"
          ? html`<${GeneralTab} onSwitchTab=${setTab} />`
          : tab === "models"
          ? html`<${Models} />`
          : html`<${Envars} />`}
      </div>
    </div>
    <${ToastContainer} />
  `;
}

render(html`<${App} />`, document.getElementById("app"));
