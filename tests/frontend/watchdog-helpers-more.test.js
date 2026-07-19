import { afterEach, describe, expect, it, vi } from "vitest";
import {
  clampWatchdogLogsPanelHeight,
  ensureXtermStylesheet,
  fitTerminalWhenVisible,
  formatBytes,
  formatWatchdogCopyAllText,
  getIncidentStatusTone,
  kWatchdogConsoleTabLogs,
  kWatchdogConsoleTabTerminal,
  kWatchdogLogsPanelDefaultHeightPx,
  kWatchdogLogsPanelMinHeightPx,
  kXtermCssUrl,
  loadXtermModules,
  normalizeWatchdogConsoleTab,
  readCssHeightPx,
} from "../../lib/public/js/components/watchdog-tab/helpers.js";

describe("frontend/watchdog-helpers (extended)", () => {
  afterEach(() => {
    delete global.document;
    delete global.window;
  });

  it("loads xterm modules and memoizes the promise", async () => {
    const hadSelf = "self" in globalThis;
    if (!hadSelf) globalThis.self = globalThis;
    try {
      const first = await loadXtermModules();
      expect(typeof first.Terminal).toBe("function");
      expect(typeof first.FitAddon).toBe("function");
      const second = await loadXtermModules();
      expect(second).toBe(first);
    } finally {
      if (!hadSelf) delete globalThis.self;
    }
  });

  it("skips stylesheet injection without a document", () => {
    expect(typeof document).toBe("undefined");
    expect(ensureXtermStylesheet()).toBeUndefined();
  });

  it("injects the xterm stylesheet exactly once", () => {
    const appended = [];
    let existing = null;
    global.document = {
      getElementById: vi.fn(() => existing),
      createElement: vi.fn(() => ({})),
      head: {
        appendChild: vi.fn((element) => {
          appended.push(element);
          existing = element;
        }),
      },
    };

    ensureXtermStylesheet();
    expect(appended).toHaveLength(1);
    expect(appended[0]).toMatchObject({
      id: "ac-xterm-css",
      rel: "stylesheet",
      href: kXtermCssUrl,
    });

    ensureXtermStylesheet();
    expect(appended).toHaveLength(1);
  });

  it("fits the terminal only when the panel is visibly sized", () => {
    expect(fitTerminalWhenVisible()).toBe(false);
    expect(fitTerminalWhenVisible({ panel: { clientWidth: 500 } })).toBe(false);

    const fitAddon = { fit: vi.fn() };
    expect(
      fitTerminalWhenVisible({
        panel: { clientWidth: 20, clientHeight: 500 },
        fitAddon,
      }),
    ).toBe(false);
    expect(
      fitTerminalWhenVisible({
        panel: { clientWidth: 500, clientHeight: 20 },
        fitAddon,
      }),
    ).toBe(false);
    expect(fitAddon.fit).not.toHaveBeenCalled();

    expect(
      fitTerminalWhenVisible({
        panel: { clientWidth: 500, clientHeight: 300 },
        fitAddon,
      }),
    ).toBe(true);
    expect(fitAddon.fit).toHaveBeenCalledTimes(1);
  });

  it("normalizes console tab values", () => {
    expect(normalizeWatchdogConsoleTab(kWatchdogConsoleTabTerminal)).toBe(
      kWatchdogConsoleTabTerminal,
    );
    expect(normalizeWatchdogConsoleTab("bogus")).toBe(kWatchdogConsoleTabLogs);
    expect(normalizeWatchdogConsoleTab(undefined)).toBe(
      kWatchdogConsoleTabLogs,
    );
  });

  it("clamps the logs panel height", () => {
    expect(clampWatchdogLogsPanelHeight(400.4)).toBe(400);
    expect(clampWatchdogLogsPanelHeight(10)).toBe(kWatchdogLogsPanelMinHeightPx);
    expect(clampWatchdogLogsPanelHeight("not-a-number")).toBe(
      kWatchdogLogsPanelDefaultHeightPx,
    );
  });

  it("reads computed CSS heights defensively", () => {
    expect(readCssHeightPx(null)).toBe(0);

    global.window = {
      getComputedStyle: vi.fn(() => ({ height: "240px" })),
    };
    expect(readCssHeightPx({})).toBe(240);

    global.window.getComputedStyle = vi.fn(() => ({ height: "auto" }));
    expect(readCssHeightPx({})).toBe(0);

    global.window.getComputedStyle = vi.fn(() => ({ height: "" }));
    expect(readCssHeightPx({})).toBe(0);
  });

  it("formats byte counts across unit boundaries", () => {
    expect(formatBytes(null)).toBe("—");
    expect(formatBytes(undefined)).toBe("—");
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(2048)).toBe("2 KB");
    expect(formatBytes(3 * 1024 * 1024)).toBe("3 MB");
    expect(formatBytes(5.5 * 1024 * 1024 * 1024)).toBe("5.5 GB");
  });

  it("maps incident events to status tones", () => {
    expect(getIncidentStatusTone({ status: "FAILED" })).toEqual({
      dotClass: "bg-red-500/90",
      label: "Failed",
    });
    expect(
      getIncidentStatusTone({ status: "ok", eventType: "HEALTH_CHECK" }),
    ).toEqual({
      dotClass: "bg-green-500/90",
      label: "Healthy",
    });
    expect(getIncidentStatusTone({ status: "warn" }).label).toBe("Warning");
    expect(getIncidentStatusTone({ status: "warning" }).label).toBe("Warning");
    expect(getIncidentStatusTone({ status: "ok", eventType: "restart" })).toEqual({
      dotClass: "bg-gray-500/70",
      label: "Unknown",
    });
    expect(getIncidentStatusTone(null).label).toBe("Unknown");
  });

  it("falls back to the current time for invalid export dates", () => {
    const text = formatWatchdogCopyAllText({
      logs: "",
      generatedAt: new Date("not-a-date"),
    });
    expect(text).toContain("Generated at: ");
    expect(text).toContain("No logs yet.");

    const defaulted = formatWatchdogCopyAllText();
    expect(defaulted).toContain("# AlphaClaw Watchdog Export");
  });
});
