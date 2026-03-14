import { useEffect, useState } from "https://esm.sh/preact/hooks";
import {
  fetchWatchdogSettings,
  triggerWatchdogRepair,
  updateWatchdogSettings,
} from "../../../lib/api.js";
import { showToast } from "../../toast.js";

export const useWatchdogSettings = ({
  watchdogStatus = null,
  onRefreshStatuses = () => {},
  onRefreshIncidents = () => {},
} = {}) => {
  const [settings, setSettings] = useState({
    autoRepair: false,
    notificationsEnabled: true,
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [repairing, setRepairing] = useState(false);
  const isRepairInProgress =
    repairing || !!(watchdogStatus || {})?.operationInProgress;

  useEffect(() => {
    let active = true;
    const loadSettings = async () => {
      try {
        const data = await fetchWatchdogSettings();
        if (!active) return;
        setSettings(
          data.settings || {
            autoRepair: false,
            notificationsEnabled: true,
          },
        );
      } catch (error) {
        if (!active) return;
        showToast(error.message || "Could not load watchdog settings", "error");
      }
    };
    loadSettings();
    return () => {
      active = false;
    };
  }, []);

  const onToggleAutoRepair = async (nextValue) => {
    if (savingSettings) return;
    setSavingSettings(true);
    try {
      const data = await updateWatchdogSettings({ autoRepair: !!nextValue });
      setSettings(
        data.settings || {
          ...settings,
          autoRepair: !!nextValue,
        },
      );
      onRefreshStatuses();
      showToast(`Auto-repair ${nextValue ? "enabled" : "disabled"}`, "success");
    } catch (error) {
      showToast(error.message || "Could not update auto-repair", "error");
    } finally {
      setSavingSettings(false);
    }
  };

  const onToggleNotifications = async (nextValue) => {
    if (savingSettings) return;
    setSavingSettings(true);
    try {
      const data = await updateWatchdogSettings({
        notificationsEnabled: !!nextValue,
      });
      setSettings(
        data.settings || {
          ...settings,
          notificationsEnabled: !!nextValue,
        },
      );
      onRefreshStatuses();
      showToast(
        `Notifications ${nextValue ? "enabled" : "disabled"}`,
        "success",
      );
    } catch (error) {
      showToast(error.message || "Could not update notifications", "error");
    } finally {
      setSavingSettings(false);
    }
  };

  const onRepair = async () => {
    if (isRepairInProgress) return;
    setRepairing(true);
    try {
      const data = await triggerWatchdogRepair();
      if (!data.ok) throw new Error(data.error || "Repair failed");
      showToast("Repair triggered", "success");
      setTimeout(() => {
        onRefreshStatuses();
        onRefreshIncidents();
      }, 800);
    } catch (error) {
      showToast(error.message || "Could not run repair", "error");
    } finally {
      setRepairing(false);
    }
  };

  return {
    settings,
    savingSettings,
    isRepairInProgress,
    onToggleAutoRepair,
    onToggleNotifications,
    onRepair,
  };
};
