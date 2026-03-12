const loadCalendarHelpers = async () =>
  import("../../lib/public/js/components/cron-tab/cron-calendar-helpers.js");

describe("frontend/cron-calendar-helpers", () => {
  it("classifies repeating jobs separately", async () => {
    const { classifyRepeatingJobs } = await loadCalendarHelpers();
    const { repeatingJobs, scheduledJobs } = classifyRepeatingJobs([
      { id: "job-every", schedule: { kind: "every", everyMs: 30 * 60 * 1000 } },
      { id: "job-cron-15m", schedule: { kind: "cron", expr: "*/15 * * * *" } },
      { id: "job-cron-25m-window", schedule: { kind: "cron", expr: "*/25 6-13 * * 1-5" } },
      { id: "job-cron", schedule: { kind: "cron", expr: "0 2 * * *" } },
    ]);
    expect(repeatingJobs.map((job) => job.id)).toEqual([
      "job-every",
      "job-cron-15m",
      "job-cron-25m-window",
    ]);
    expect(scheduledJobs.map((job) => job.id)).toEqual(["job-cron"]);
  });

  it("expands cron schedules into rolling slots", async () => {
    const { expandJobsToRollingSlots } = await loadCalendarHelpers();
    const nowMs = Date.UTC(2026, 2, 11, 10, 0, 0);
    const { range, slots } = expandJobsToRollingSlots({
      jobs: [{ id: "job-cron", name: "Daily 2am", schedule: { kind: "cron", expr: "0 2 * * *" } }],
      nowMs,
      pastDays: 1,
      futureDays: 1,
    });
    expect(range.dayCount).toBe(3);
    expect(slots.length).toBe(3);
    expect(slots.every((slot) => slot.hourOfDay === 2)).toBe(true);
  });

  it("maps explicit run statuses to past slots only", async () => {
    const { mapRunStatusesToSlots } = await loadCalendarHelpers();
    const nowMs = Date.UTC(2026, 2, 11, 10, 0, 0);
    const pastSlotMs = Date.UTC(2026, 2, 11, 8, 0, 0);
    const futureSlotMs = Date.UTC(2026, 2, 11, 12, 0, 0);
    const slots = [
      { key: "job-a:past", jobId: "job-a", scheduledAtMs: pastSlotMs },
      { key: "job-a:future", jobId: "job-a", scheduledAtMs: futureSlotMs },
    ];
    const statusBySlotKey = mapRunStatusesToSlots({
      slots,
      bulkRunsByJobId: {
        "job-a": {
          entries: [{ ts: pastSlotMs + 15 * 60 * 1000, status: "ok" }],
        },
      },
      nowMs,
    });
    expect(statusBySlotKey["job-a:past"]).toBe("ok");
    expect(statusBySlotKey["job-a:future"]).toBeUndefined();
  });

  it("returns upcoming slots within 24h window", async () => {
    const { getUpcomingSlots, buildSlotKey } = await loadCalendarHelpers();
    const nowMs = Date.UTC(2026, 2, 11, 10, 0, 0);
    const slots = [
      { key: buildSlotKey({ jobId: "a", scheduledAtMs: nowMs - 3600000 }), jobId: "a", scheduledAtMs: nowMs - 3600000 },
      { key: buildSlotKey({ jobId: "b", scheduledAtMs: nowMs + 3600000 }), jobId: "b", scheduledAtMs: nowMs + 3600000 },
      { key: buildSlotKey({ jobId: "c", scheduledAtMs: nowMs + 7200000 }), jobId: "c", scheduledAtMs: nowMs + 7200000 },
      { key: buildSlotKey({ jobId: "d", scheduledAtMs: nowMs + 25 * 3600000 }), jobId: "d", scheduledAtMs: nowMs + 25 * 3600000 },
    ];
    const result = getUpcomingSlots({ slots, nowMs });
    expect(result.length).toBe(2);
    expect(result[0].jobId).toBe("b");
    expect(result[1].jobId).toBe("c");
  });

  it("builds token tiers from usage averages", async () => {
    const { buildTokenTierByJobId } = await loadCalendarHelpers();
    const tierByJobId = buildTokenTierByJobId({
      jobs: [
        { id: "job-1", enabled: true },
        { id: "job-2", enabled: true },
        { id: "job-3", enabled: true },
        { id: "job-4", enabled: true },
        { id: "job-5", enabled: false },
        { id: "job-6", enabled: true },
      ],
      usageByJobId: {
        "job-1": { avgTokensPerRun: 10 },
        "job-2": { avgTokensPerRun: 200 },
        "job-3": { avgTokensPerRun: 400 },
        "job-4": { avgTokensPerRun: 900 },
      },
    });
    expect(tierByJobId["job-1"]).toBe("low");
    expect(tierByJobId["job-4"]).toBe("very-high");
    expect(tierByJobId["job-5"]).toBe("disabled");
    expect(tierByJobId["job-6"]).toBe("unknown");
  });
});
