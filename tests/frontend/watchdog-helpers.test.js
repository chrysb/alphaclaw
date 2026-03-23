const loadWatchdogHelpers = async () =>
  import("../../lib/public/js/components/watchdog-tab/helpers.js");

describe("frontend/watchdog-helpers", () => {
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
