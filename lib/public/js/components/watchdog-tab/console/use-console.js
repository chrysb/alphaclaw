import { useEffect, useRef, useState } from "preact/hooks";
import { fetchWatchdogLogs } from "../../../lib/api.js";
import { copyTextToClipboard } from "../../../lib/clipboard.js";
import { readUiSettings, writeUiSettings } from "../../../lib/ui-settings.js";
import { showToast } from "../../toast.js";
import {
  clampWatchdogLogsPanelHeight,
  formatWatchdogCopyAllText,
  kWatchdogConsoleTabLogs,
  kWatchdogConsoleTabTerminal,
  kWatchdogConsoleTabUiSettingKey,
  kWatchdogLogsPanelHeightUiSettingKey,
  normalizeWatchdogConsoleTab,
  readCssHeightPx,
} from "../helpers.js";
import { useWatchdogTerminal } from "../terminal/use-terminal.js";

export const useWatchdogConsole = ({
} = {}) => {
  const [logs, setLogs] = useState("");
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [copyingAll, setCopyingAll] = useState(false);
  const [stickToBottom, setStickToBottom] = useState(true);
  const [activeConsoleTab, setActiveConsoleTab] = useState(() => {
    const settings = readUiSettings();
    return normalizeWatchdogConsoleTab(settings?.[kWatchdogConsoleTabUiSettingKey]);
  });
  const [logsPanelHeightPx, setLogsPanelHeightPx] = useState(() => {
    const settings = readUiSettings();
    return clampWatchdogLogsPanelHeight(
      settings?.[kWatchdogLogsPanelHeightUiSettingKey],
    );
  });
  const logsRef = useRef(null);
  const terminalPanelRef = useRef(null);
  const terminalHostRef = useRef(null);
  const terminal = useWatchdogTerminal({
    active: activeConsoleTab === kWatchdogConsoleTabTerminal,
    panelRef: terminalPanelRef,
    hostRef: terminalHostRef,
  });

  useEffect(() => {
    const settings = readUiSettings();
    settings[kWatchdogConsoleTabUiSettingKey] =
      normalizeWatchdogConsoleTab(activeConsoleTab);
    writeUiSettings(settings);
  }, [activeConsoleTab]);

  useEffect(() => {
    let active = true;
    let timer = null;
    const pollLogs = async () => {
      try {
        const text = await fetchWatchdogLogs(65536);
        if (!active) return;
        setLogs(text || "");
        setLoadingLogs(false);
      } catch {
        if (!active) return;
        setLoadingLogs(false);
      }
      if (!active) return;
      timer = setTimeout(pollLogs, 3000);
    };
    pollLogs();
    return () => {
      active = false;
      if (timer) clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    const logsElement = logsRef.current;
    if (!logsElement || !stickToBottom) return;
    logsElement.scrollTop = logsElement.scrollHeight;
  }, [logs, stickToBottom]);

  useEffect(() => {
    const panelElement =
      activeConsoleTab === kWatchdogConsoleTabLogs
        ? logsRef.current
        : terminalPanelRef.current;
    if (!panelElement || typeof ResizeObserver === "undefined") return () => {};
    let saveTimer = null;
    const observer = new ResizeObserver((entries) => {
      const entry = entries?.[0];
      const nextHeight = clampWatchdogLogsPanelHeight(
        readCssHeightPx(entry?.target),
      );
      setLogsPanelHeightPx((currentValue) =>
        Math.abs(currentValue - nextHeight) >= 1 ? nextHeight : currentValue,
      );
      if (saveTimer) window.clearTimeout(saveTimer);
      saveTimer = window.setTimeout(() => {
        const settings = readUiSettings();
        settings[kWatchdogLogsPanelHeightUiSettingKey] = nextHeight;
        writeUiSettings(settings);
      }, 120);
      if (activeConsoleTab === kWatchdogConsoleTabTerminal) {
        window.requestAnimationFrame(() => {
          terminal.fitNow();
        });
      }
    });
    observer.observe(panelElement);
    return () => {
      observer.disconnect();
      if (saveTimer) window.clearTimeout(saveTimer);
    };
  }, [activeConsoleTab]);

  const handleSelectConsoleTab = (nextTab = kWatchdogConsoleTabLogs) => {
    const normalizedTab = normalizeWatchdogConsoleTab(nextTab);
    if (normalizedTab === kWatchdogConsoleTabTerminal) {
      terminal.prepareForActivate();
    } else {
      terminal.clearSettling();
    }
    setActiveConsoleTab(normalizedTab);
  };

  const onRestartTerminalSession = () => {
    terminal.restartSession();
    setActiveConsoleTab(kWatchdogConsoleTabTerminal);
  };

  const handleCopyAll = async () => {
    if (copyingAll) return;
    setCopyingAll(true);
    try {
      const text = formatWatchdogCopyAllText({
        logs,
      });
      const copied = await copyTextToClipboard(text);
      if (!copied) {
        throw new Error("Could not copy watchdog export");
      }
      showToast("Copied watchdog logs", "success");
    } catch (error) {
      showToast(error.message || "Could not copy watchdog export", "error");
    } finally {
      setCopyingAll(false);
    }
  };

  return {
    logs,
    loadingLogs,
    copyingAll,
    stickToBottom,
    setStickToBottom,
    activeConsoleTab,
    handleSelectConsoleTab,
    logsPanelHeightPx,
    logsRef,
    terminalPanelRef,
    terminalHostRef,
    onRestartTerminalSession,
    onCopyAll: handleCopyAll,
    ...terminal,
  };
};
