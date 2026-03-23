const loadWatchdogHelpers = async () =>
  import("../../lib/public/js/components/watchdog-tab/helpers.js");

describe("frontend/watchdog-helpers", () => {
  it("formats a watchdog export with status, incidents, and logs", async () => {
    const { formatWatchdogCopyAllText } = await loadWatchdogHelpers();

    const text = formatWatchdogCopyAllText({
      watchdogStatus: {
        health: "degraded",
        lifecycle: "running",
      },
      events: [
        {
          createdAt: "2026-03-22T23:10:00.000Z",
          eventType: "health_check",
          status: "failed",
          source: "gateway",
          details: {
            check: "webhook",
            message: "HTTP 502",
          },
        },
      ],
      logs: "line 1\nline 2",
      generatedAt: new Date("2026-03-22T23:15:00.000Z"),
    });

    expect(text).toContain("# AlphaClaw Watchdog Export");
    expect(text).toContain("Generated at: 2026-03-22T23:15:00.000Z");
    expect(text).toContain("## Watchdog Status");
    expect(text).toContain('"health": "degraded"');
    expect(text).toContain("## Recent Incidents");
    expect(text).toContain("### Incident 1");
    expect(text).toContain("Type: health_check");
    expect(text).toContain('"message": "HTTP 502"');
    expect(text).toContain("## Gateway Logs");
    expect(text).toContain("line 1\nline 2");
  });

  it("falls back to empty-state labels when incidents and logs are missing", async () => {
    const { formatWatchdogCopyAllText } = await loadWatchdogHelpers();

    const text = formatWatchdogCopyAllText({
      watchdogStatus: null,
      events: [],
      logs: "",
      generatedAt: new Date("2026-03-22T23:20:00.000Z"),
    });

    expect(text).toContain("## Recent Incidents");
    expect(text).toContain("No incidents recorded.");
    expect(text).toContain("## Gateway Logs");
    expect(text).toContain("No logs yet.");
    expect(text).toContain("{}");
  });
});
