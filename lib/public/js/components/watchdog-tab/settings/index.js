import { h } from "preact";
import { useState } from "preact/hooks";
import htm from "htm";
import { InfoTooltip } from "../../info-tooltip.js";
import { ToggleSwitch } from "../../toggle-switch.js";

const html = htm.bind(h);

export const WatchdogSettingsCard = ({
  settings = {},
  savingSettings = false,
  onToggleAutoRepair = () => {},
  onToggleNotifications = () => {},
}) => {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const handleTestNotification = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/watchdog/test-notification", { method: "POST" });
      const data = await res.json();
      setTestResult(data);
    } catch (err) {
      setTestResult({ ok: false, error: err.message });
    } finally {
      setTesting(false);
    }
  };

  const formatResult = (result) => {
    if (!result) return null;
    if (!result.ok) {
      return html`<span class="text-status-error-muted text-xs">
        ${result.error || "Failed"}
      </span>`;
    }

    const channels = result.result?.channels || result.result || {};
    const parts = [];
    for (const channel of ["telegram", "discord", "slack"]) {
      const ch = channels[channel];
      if (!ch || ch.skipped) continue;
      if (ch.sent > 0) parts.push(`${channel}: ${ch.sent} sent`);
      if (ch.failed > 0) parts.push(`${channel}: ${ch.failed} failed`);
    }

    if (parts.length === 0) {
      return html`<span class="text-status-warning text-xs">No channels configured</span>`;
    }

    const allSent = !parts.some((part) => part.includes("failed"));
    return html`<span class="text-xs ${allSent ? "text-status-success" : "text-status-warning"}">
      ${parts.join(", ")}
    </span>`;
  };

  return html`
    <div class="bg-surface border border-border rounded-xl p-4">
      <div class="flex items-center justify-between gap-3">
        <div class="inline-flex items-center gap-2 text-xs text-fg-muted">
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
        <div class="inline-flex items-center gap-2 text-xs text-fg-muted">
          <span>Notifications</span>
          <${InfoTooltip}
            text="Sends channel notices for watchdog alerts and auto-repair outcomes."
          />
        </div>
        <div class="flex items-center gap-2">
          <button
            class="text-xs px-2 py-0.5 rounded border border-border text-fg-muted hover:text-body hover:border-fg-muted transition-colors disabled:opacity-50"
            onClick=${handleTestNotification}
            disabled=${testing || savingSettings}
          >
            ${testing ? "Sending..." : "Test"}
          </button>
          <${ToggleSwitch}
            checked=${!!settings.notificationsEnabled}
            disabled=${savingSettings}
            onChange=${onToggleNotifications}
            label=""
          />
        </div>
      </div>
      ${testResult
        ? html`<div class="mt-2">${formatResult(testResult)}</div>`
        : null}
    </div>
  `;
};
