const loadCronHelpers = async () =>
  import("../../lib/public/js/components/cron-tab/cron-helpers.js");

describe("frontend/cron-helpers", () => {
  it("formats schedule labels", async () => {
    const { formatCronScheduleLabel } = await loadCronHelpers();
    expect(
      formatCronScheduleLabel({
        kind: "every",
        everyMs: 30 * 60 * 1000,
      }),
    ).toContain("Every");
    expect(
      formatCronScheduleLabel({
        kind: "cron",
        expr: "0 8 * * 1-5",
        tz: "America/Los_Angeles",
      }),
    ).toContain("Weekdays at");
    expect(
      formatCronScheduleLabel(
        {
          kind: "cron",
          expr: "0 8 * * 1-5",
          tz: "UTC",
        },
        {
          includeTimeZoneWhenDifferent: true,
          clientTimeZone: "America/Los_Angeles",
        },
      ),
    ).toContain("(UTC)");
    expect(
      formatCronScheduleLabel(
        {
          kind: "cron",
          expr: "0 8 * * 1-5",
          tz: "America/Los_Angeles",
        },
        {
          includeTimeZoneWhenDifferent: true,
          clientTimeZone: "America/Los_Angeles",
        },
      ),
    ).not.toContain("(");
    expect(
      formatCronScheduleLabel({
        kind: "cron",
        expr: "*/25 6-13 * * 1-5",
      }),
    ).toBe("Every 25m, 6am-1pm weekdays");
    expect(
      formatCronScheduleLabel({
        kind: "cron",
        expr: "0 4 1 * *",
      }),
    ).toBe("Monthly on day 1 at 4:00am");
    expect(
      formatCronScheduleLabel({
        cron: "0 10 * * 6",
      }),
    ).toBe("Every Sat at 10:00am");
    expect(
      formatCronScheduleLabel({
        kind: "at",
        at: "2026-03-11T08:00:00.000Z",
      }),
    ).toContain("At");
  });

  it("builds optimization warnings for risky jobs", async () => {
    const { buildCronOptimizationWarnings } = await loadCronHelpers();
    const warnings = buildCronOptimizationWarnings(
      [
        {
          id: "job-1",
          name: "Delivery Mismatch",
          delivery: { mode: "none" },
          payload: { message: "Use message tool to send to telegram" },
          state: { consecutiveErrors: 0 },
        },
        {
          id: "job-2",
          name: "Erroring Job",
          delivery: { mode: "announce" },
          payload: { message: "noop" },
          state: { consecutiveErrors: 3 },
        },
        {
          id: "job-3",
          name: "Heartbeat Delivery",
          delivery: { mode: "announce" },
          payload: { message: "noop" },
          state: {
            consecutiveErrors: 0,
            lastDelivered: false,
            lastDeliveryStatus: "not-delivered",
          },
        },
        {
          id: "job-4",
          name: "Needs Delivery",
          delivery: { mode: "announce" },
          payload: { message: "noop" },
          state: {
            consecutiveErrors: 0,
            lastDelivered: false,
            lastDeliveryStatus: "not-delivered",
            lastSummary: "Work complete.",
          },
        },
        {
          id: "job-5",
          name: "Ok But Not Delivered",
          delivery: { mode: "announce" },
          payload: { message: "noop" },
          state: {
            lastDelivered: false,
            lastDeliveryStatus: "not-delivered",
            lastStatus: "ok",
          },
        },
      ],
      {
        "job-3": {
          entries: [
            {
              ts: Date.now(),
              summary: "HEARTBEAT_OK (Note: refresher check only)",
            },
          ],
        },
      },
    );
    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings.some((warning) => warning.title.includes("Delivery Mismatch"))).toBe(true);
    expect(warnings.some((warning) => warning.title.includes("Erroring Job"))).toBe(true);
    expect(warnings.some((warning) => warning.title.includes("Heartbeat Delivery"))).toBe(false);
    expect(warnings.some((warning) => warning.title.includes("Needs Delivery"))).toBe(true);
    expect(warnings.some((warning) => warning.title.includes("Ok But Not Delivered"))).toBe(false);
  });

  it("formats next run as due/overdue when timestamp is in the past", async () => {
    const { formatNextRunRelativeMs } = await loadCronHelpers();
    const nowMs = Date.now();
    expect(formatNextRunRelativeMs(nowMs - 15 * 1000, nowMs)).toBe("due now");
    expect(formatNextRunRelativeMs(nowMs - 2 * 60 * 1000, nowMs)).toBe("overdue by 2m");
    expect(formatNextRunRelativeMs(nowMs + 2 * 60 * 1000, nowMs)).toBe("in 2m");
  });

  it("formats compact relative values in short suffix style", async () => {
    const { formatRelativeCompact } = await loadCronHelpers();
    const nowMs = Date.now();
    expect(formatRelativeCompact(nowMs - 10 * 1000, nowMs)).toBe("10s");
    expect(formatRelativeCompact(nowMs - 10 * 60 * 1000, nowMs)).toBe("10m");
    expect(formatRelativeCompact(nowMs - 10 * 60 * 60 * 1000, nowMs)).toBe("10h");
    expect(formatRelativeCompact(nowMs - 10 * 24 * 60 * 60 * 1000, nowMs)).toBe("10d");
    expect(formatRelativeCompact(nowMs - 30 * 24 * 60 * 60 * 1000, nowMs)).toBe("1mo");
  });
});
