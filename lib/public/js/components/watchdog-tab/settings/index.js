import { h } from "preact";
import { useState } from "preact/hooks";
import htm from "htm";
import { InfoTooltip } from "../../info-tooltip.js";
import { ToggleSwitch } from "../../toggle-switch.js";
import { showToast } from "../../toast.js";

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
      if (!data?.ok) {
        setTestResult(data);
        return;
      }

      const channels = data.result?.channels || data.result || {};
      const parts = [];
      for (const channel of ["telegram", "discord", "slack"]) {
        const ch = channels[channel];
        if (!ch || ch.skipped) continue;
        if (ch.sent > 0) parts.push(`${channel}: ${ch.sent} sent`);
        if (ch.failed > 0) parts.push(`${channel}: ${ch.failed} failed`);
      }

      if (parts.length === 0) {
        showToast("No channels configured", "warning");
        return;
      }

      const hasFailures = parts.some((part) => part.includes("failed"));
      showToast(
        hasFailures ? parts.join(", ") : `Test notification sent: ${parts.join(", ")}`,
        hasFailures ? "warning" : "success",
      );
    } catch (err) {
      setTestResult({ ok: false, error: err.message });
    } finally {
      setTesting(false);
    }
  };

  const formatResult = (result) => {
    if (!result) return null;
    return html`<span class="text-status-error-muted text-xs">
      ${result.error || "Failed"}
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
            class=${`text-xs px-2 py-1 rounded-lg ac-btn-ghost disabled:opacity-50 disabled:cursor-not-allowed ${
              settings.notificationsEnabled ? "" : "invisible pointer-events-none"
            }`}
            onClick=${handleTestNotification}
            disabled=${testing || savingSettings || !settings.notificationsEnabled}
            aria-hidden=${!settings.notificationsEnabled}
            tabIndex=${settings.notificationsEnabled ? 0 : -1}
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
