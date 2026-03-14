import { h } from "https://esm.sh/preact";
import htm from "https://esm.sh/htm";
import { InfoTooltip } from "../../info-tooltip.js";
import { ToggleSwitch } from "../../toggle-switch.js";

const html = htm.bind(h);

export const WatchdogSettingsCard = ({
  settings = {},
  savingSettings = false,
  onToggleAutoRepair = () => {},
  onToggleNotifications = () => {},
}) => html`
  <div class="bg-surface border border-border rounded-xl p-4">
    <div class="flex items-center justify-between gap-3">
      <div class="inline-flex items-center gap-2 text-xs text-gray-400">
        <span>Auto-repair</span>
        <${InfoTooltip}
          text="Automatically runs OpenClaw doctor repair when watchdog detects gateway health failures or crash loops."
        />
      </div>
      <${ToggleSwitch}
        checked=${!!settings.autoRepair}
        disabled=${savingSettings}
        onChange=${onToggleAutoRepair}
        label=""
      />
    </div>
    <div class="flex items-center justify-between gap-3 mt-3">
      <div class="inline-flex items-center gap-2 text-xs text-gray-400">
        <span>Notifications</span>
        <${InfoTooltip}
          text="Sends channel notices for watchdog alerts and auto-repair outcomes."
        />
      </div>
      <${ToggleSwitch}
        checked=${!!settings.notificationsEnabled}
        disabled=${savingSettings}
        onChange=${onToggleNotifications}
        label=""
      />
    </div>
  </div>
`;
