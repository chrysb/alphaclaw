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

  it("returns no safe-mode banner model when the gateway is not in safe mode", async () => {
    const { buildSafeModeBannerModel } = await loadWatchdogHelpers();

    expect(buildSafeModeBannerModel(null)).toBeNull();
    expect(buildSafeModeBannerModel({})).toBeNull();
    expect(buildSafeModeBannerModel({ safeMode: false })).toBeNull();
  });

  it("builds a safe-mode banner model listing suppressed channels", async () => {
    const { buildSafeModeBannerModel } = await loadWatchdogHelpers();

    const model = buildSafeModeBannerModel({
      safeMode: true,
      suppressedChannels: ["telegram", " discord ", "", null],
    });

    expect(model.title).toBe("Gateway is in safe mode");
    expect(model.channels).toEqual(["telegram", "discord"]);
    expect(model.body).toContain("Suppressed: telegram, discord");
    expect(model.body).toContain("not delivering messages");
  });

  it("builds a safe-mode banner model without a channel list when none reported", async () => {
    const { buildSafeModeBannerModel } = await loadWatchdogHelpers();

    const model = buildSafeModeBannerModel({
      safeMode: true,
      suppressedChannels: "not-an-array",
    });

    expect(model.channels).toEqual([]);
    expect(model.body).toContain("crash-loop breaker");
    expect(model.body).not.toContain("Suppressed:");
  });
});
