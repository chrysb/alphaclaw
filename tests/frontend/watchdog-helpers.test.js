const loadWatchdogHelpers = async () =>
  import("../../lib/public/js/components/watchdog-tab/helpers.js");

describe("frontend/watchdog-helpers", () => {
  it("classifies error and warning log lines", async () => {
    const {
      getWatchdogLogLineTone,
      kWatchdogLogToneError,
      kWatchdogLogToneWarning,
    } = await loadWatchdogHelpers();

    expect(getWatchdogLogLineTone("[error] gateway failed")).toBe(
      kWatchdogLogToneError,
    );
    expect(getWatchdogLogLineTone("prefix [WARN] retrying")).toBe(
      kWatchdogLogToneWarning,
    );
    expect(getWatchdogLogLineTone("[warning] migration deferred")).toBe(
      kWatchdogLogToneWarning,
    );
    expect(getWatchdogLogLineTone("[info] gateway ready")).toBeNull();
  });

  it("gives error precedence when a log line contains both markers", async () => {
    const { getWatchdogLogLineTone, kWatchdogLogToneError } =
      await loadWatchdogHelpers();

    expect(getWatchdogLogLineTone("[warn] escalated to [error]")).toBe(
      kWatchdogLogToneError,
    );
  });

  it("formats a watchdog export with logs", async () => {
    const { formatWatchdogCopyAllText } = await loadWatchdogHelpers();

    const text = formatWatchdogCopyAllText({
      logs: "line 1\nline 2",
      generatedAt: new Date("2026-03-22T23:15:00.000Z"),
    });

    expect(text).toContain("# AlphaClaw Watchdog Export");
    expect(text).toContain("Generated at: 2026-03-22T23:15:00.000Z");
    expect(text).toContain("## Gateway Logs");
    expect(text).toContain("line 1\nline 2");
  });

  it("falls back to an empty-state label when logs are missing", async () => {
    const { formatWatchdogCopyAllText } = await loadWatchdogHelpers();

    const text = formatWatchdogCopyAllText({
      logs: "",
      generatedAt: new Date("2026-03-22T23:20:00.000Z"),
    });

    expect(text).toContain("## Gateway Logs");
    expect(text).toContain("No logs yet.");
  });
});
