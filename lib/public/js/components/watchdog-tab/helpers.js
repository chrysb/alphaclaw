export const kWatchdogConsoleTabLogs = "logs";
export const kWatchdogConsoleTabTerminal = "terminal";
export const kWatchdogConsoleTabUiSettingKey = "watchdogConsoleTab";
export const kWatchdogLogsPanelHeightUiSettingKey = "watchdogLogsPanelHeightPx";
export const kWatchdogLogsPanelDefaultHeightPx = 320;
export const kWatchdogLogsPanelMinHeightPx = 160;
export const kXtermCssUrl = "/css/vendor/xterm.css";
export const kWatchdogTerminalWsPath = "/api/watchdog/terminal/ws";

let xtermModulesPromise = null;

export const loadXtermModules = () => {
  if (!xtermModulesPromise) {
    xtermModulesPromise = Promise.all([import("@xterm/xterm"), import("@xterm/addon-fit")]).then(
      ([xtermModule, fitAddonModule]) => {
        const Terminal =
          xtermModule?.Terminal || xtermModule?.default?.Terminal || null;
        const FitAddon =
          fitAddonModule?.FitAddon || fitAddonModule?.default?.FitAddon || null;
        if (typeof Terminal !== "function") {
          throw new Error("Xterm Terminal export not found");
        }
        if (typeof FitAddon !== "function") {
          throw new Error("Xterm FitAddon export not found");
        }
        return { Terminal, FitAddon };
      },
    );
  }
  return xtermModulesPromise;
};

export const ensureXtermStylesheet = () => {
  if (typeof document === "undefined") return;
  if (document.getElementById("ac-xterm-css")) return;
  const link = document.createElement("link");
  link.id = "ac-xterm-css";
  link.rel = "stylesheet";
  link.href = kXtermCssUrl;
  document.head.appendChild(link);
};

export const fitTerminalWhenVisible = ({
  panel = null,
  fitAddon = null,
  minWidthPx = 120,
  minHeightPx = 80,
} = {}) => {
  if (!panel || !fitAddon) return false;
  const panelWidth = Number(panel.clientWidth || 0);
  const panelHeight = Number(panel.clientHeight || 0);
  if (panelWidth < minWidthPx || panelHeight < minHeightPx) return false;
  fitAddon.fit();
  return true;
};

export const normalizeWatchdogConsoleTab = (value) =>
  value === kWatchdogConsoleTabTerminal
    ? kWatchdogConsoleTabTerminal
    : kWatchdogConsoleTabLogs;

export const clampWatchdogLogsPanelHeight = (value) => {
  const parsed = Number(value);
  const normalized = Number.isFinite(parsed)
    ? Math.round(parsed)
    : kWatchdogLogsPanelDefaultHeightPx;
  return Math.max(kWatchdogLogsPanelMinHeightPx, normalized);
};

export const readCssHeightPx = (element) => {
  if (!element) return 0;
  const computedHeight = Number.parseFloat(
    window.getComputedStyle(element).height || "0",
  );
  return Number.isFinite(computedHeight) ? computedHeight : 0;
};

export const formatBytes = (bytes) => {
  if (bytes == null) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(0)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

export const getIncidentStatusTone = (event) => {
  const eventType = String(event?.eventType || "")
    .trim()
    .toLowerCase();
  const status = String(event?.status || "")
    .trim()
    .toLowerCase();
  if (status === "failed") {
    return {
      dotClass: "bg-red-500/90",
      label: "Failed",
    };
  }
  if (status === "ok" && eventType === "health_check") {
    return {
      dotClass: "bg-green-500/90",
      label: "Healthy",
    };
  }
  if (status === "warn" || status === "warning") {
    return {
      dotClass: "bg-yellow-400/90",
      label: "Warning",
    };
  }
  return {
    dotClass: "bg-gray-500/70",
    label: "Unknown",
  };
};

export const formatWatchdogCopyAllText = ({
  logs = "",
  generatedAt = null,
} = {}) => {
  const sections = [];
  const generatedAtLabel =
    generatedAt instanceof Date && !Number.isNaN(generatedAt.getTime())
      ? generatedAt.toISOString()
      : new Date().toISOString();

  sections.push(`# AlphaClaw Watchdog Export`);
  sections.push(`Generated at: ${generatedAtLabel}`);

  sections.push(`## Gateway Logs`);
  sections.push(String(logs || "").trim() || "No logs yet.");

  return sections.join("\n\n").trim();
};
