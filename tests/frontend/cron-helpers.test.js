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

  it("builds optimization warnings for runtime failures", async () => {
    const { buildCronOptimizationWarnings } = await loadCronHelpers();
    const warnings = buildCronOptimizationWarnings(
      [
        {
          id: "job-1",
          name: "Direct Message",
          delivery: { mode: "none" },
          payload: { kind: "agentTurn", message: "Use message tool to send to telegram" },
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
    expect(warnings.some((warning) => warning.title.includes("Direct Message"))).toBe(false);
    expect(warnings.some((warning) => warning.title.includes("Erroring Job"))).toBe(true);
    expect(warnings.some((warning) => warning.title.includes("Heartbeat Delivery"))).toBe(false);
    expect(warnings.some((warning) => warning.title.includes("Needs Delivery"))).toBe(true);
    expect(warnings.some((warning) => warning.title.includes("Ok But Not Delivered"))).toBe(false);
  });

  it("reads cron prompts from systemEvent text or agentTurn message payloads", async () => {
    const { readCronJobPrompt } = await loadCronHelpers();
    expect(
      readCronJobPrompt({
        payload: { kind: "systemEvent", text: "main prompt" },
      }),
    ).toBe("main prompt");
    expect(
      readCronJobPrompt({
        payload: { kind: "agentTurn", message: "isolated prompt" },
      }),
    ).toBe("isolated prompt");
    expect(readCronJobPrompt({ payload: { text: "missing kind" } })).toBe("");
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
    expect(formatRelativeCompact(0, nowMs)).toBe("—");
    expect(formatRelativeCompact("junk", nowMs)).toBe("—");
    expect(formatRelativeCompact(nowMs + 90 * 1000, nowMs)).toBe("2m");
  });

  it("formats relative timestamps in both directions", async () => {
    const { formatRelativeMs } = await loadCronHelpers();
    const nowMs = Date.now();
    expect(formatRelativeMs(0, nowMs)).toBe("—");
    expect(formatRelativeMs(Number.NaN, nowMs)).toBe("—");
    expect(formatRelativeMs(nowMs + 10 * 1000, nowMs)).toBe("in <1m");
    expect(formatRelativeMs(nowMs - 10 * 1000, nowMs)).toBe("just now");
    expect(formatRelativeMs(nowMs + 5 * 60 * 1000, nowMs)).toBe("in 5m");
    expect(formatRelativeMs(nowMs - 5 * 60 * 1000, nowMs)).toBe("5m ago");
    expect(formatRelativeMs(nowMs + 3 * 60 * 60 * 1000, nowMs)).toBe("in 3h");
    expect(formatRelativeMs(nowMs - 3 * 60 * 60 * 1000, nowMs)).toBe("3h ago");
    expect(formatRelativeMs(nowMs + 2 * 24 * 60 * 60 * 1000, nowMs)).toBe("in 2d");
    expect(formatRelativeMs(nowMs - 2 * 24 * 60 * 60 * 1000, nowMs)).toBe("2d ago");
  });

  it("formats overdue next runs at hour and day granularity", async () => {
    const { formatNextRunRelativeMs } = await loadCronHelpers();
    const nowMs = Date.now();
    expect(formatNextRunRelativeMs(0, nowMs)).toBe("—");
    expect(formatNextRunRelativeMs(-5, nowMs)).toBe("—");
    expect(formatNextRunRelativeMs(nowMs - 3 * 60 * 60 * 1000, nowMs)).toBe("overdue by 3h");
    expect(formatNextRunRelativeMs(nowMs - 4 * 24 * 60 * 60 * 1000, nowMs)).toBe(
      "overdue by 4d",
    );
  });

  it("humanizes interval, daily, and edge-case cron expressions", async () => {
    const { formatCronScheduleLabel } = await loadCronHelpers();
    expect(formatCronScheduleLabel({ kind: "cron", expr: "*/5 * * * *" })).toBe("Every 5m");
    expect(formatCronScheduleLabel({ kind: "cron", expr: "0 */2 * * *" })).toBe("Every 2h");
    expect(formatCronScheduleLabel({ kind: "cron", expr: "30 18 * * *" })).toBe(
      "Daily at 6:30pm",
    );
    expect(formatCronScheduleLabel({ kind: "cron", expr: "0 0 * * *" })).toBe(
      "Daily at 12:00am",
    );
    expect(formatCronScheduleLabel({ kind: "cron", expr: "15 9 * * 0,6" })).toBe(
      "Every Sun, Sat at 9:15am",
    );
    // Non-humanizable expressions fall back to the raw expression.
    expect(formatCronScheduleLabel({ kind: "cron", expr: "0 8 15 6 *" })).toBe("0 8 15 6 *");
    expect(formatCronScheduleLabel({ kind: "cron", expr: "a b * * *" })).toBe("a b * * *");
    expect(formatCronScheduleLabel({ kind: "cron", expr: "0 8" })).toBe("0 8");
    // Day-of-month out of the 1-31 range is not humanized.
    expect(formatCronScheduleLabel({ kind: "cron", expr: "0 4 0 * *" })).toBe("0 4 0 * *");
    // Minute-step with a weekday hour range but broken minute field.
    expect(formatCronScheduleLabel({ kind: "cron", expr: "*/x 6-13 * * 1-5" })).toBe(
      "*/x 6-13 * * 1-5",
    );
  });

  it("covers remaining schedule label branches", async () => {
    const { formatCronScheduleLabel } = await loadCronHelpers();
    expect(formatCronScheduleLabel({ kind: "every" })).toBe("Every interval");
    expect(formatCronScheduleLabel({ kind: "cron" })).toBe("Cron");
    expect(formatCronScheduleLabel({ kind: "cron", expr: "   " })).toBe("Cron");
    expect(formatCronScheduleLabel({})).toBe("Unknown schedule");
    expect(formatCronScheduleLabel()).toBe("Unknown schedule");

    // includeTimeZone always appends the schedule tz.
    expect(
      formatCronScheduleLabel(
        { kind: "cron", expr: "0 9 * * *", tz: "UTC" },
        { includeTimeZone: true },
      ),
    ).toBe("Daily at 9:00am (UTC)");
    // Non-humanizable expr with tz appended.
    expect(
      formatCronScheduleLabel(
        { kind: "cron", expr: "0 8 15 6 *", tz: "UTC" },
        { includeTimeZone: true },
      ),
    ).toBe("0 8 15 6 * (UTC)");
    // No schedule tz -> nothing to append even when requested.
    expect(
      formatCronScheduleLabel(
        { kind: "cron", expr: "0 9 * * *" },
        { includeTimeZone: true, includeTimeZoneWhenDifferent: true },
      ),
    ).toBe("Daily at 9:00am");

    // Fallback path (no kind) via cronExpr/timezone aliases.
    expect(
      formatCronScheduleLabel(
        { cronExpr: "0 9 * * *", timezone: "UTC" },
        { includeTimeZone: true },
      ),
    ).toBe("Daily at 9:00am (UTC)");
    expect(
      formatCronScheduleLabel(
        { expr: "0 8 15 6 *", timezone: "UTC" },
        { includeTimeZone: true },
      ),
    ).toBe("0 8 15 6 * (UTC)");
    expect(formatCronScheduleLabel({ cron: "0 8 15 6 *" })).toBe("0 8 15 6 *");
  });

  it("resolves the client time zone from Intl when not provided", async () => {
    const { formatCronScheduleLabel } = await loadCronHelpers();
    const schedule = { kind: "cron", expr: "0 9 * * *", tz: "Etc/GMT+8" };
    const options = { includeTimeZoneWhenDifferent: true };
    try {
      // Client tz differs from schedule tz -> append.
      vi.stubGlobal("Intl", {
        DateTimeFormat: () => ({
          resolvedOptions: () => ({ timeZone: "America/New_York" }),
        }),
      });
      expect(formatCronScheduleLabel(schedule, options)).toBe(
        "Daily at 9:00am (Etc/GMT+8)",
      );

      // Client tz matches schedule tz -> no suffix.
      vi.stubGlobal("Intl", {
        DateTimeFormat: () => ({
          resolvedOptions: () => ({ timeZone: "etc/gmt+8" }),
        }),
      });
      expect(formatCronScheduleLabel(schedule, options)).toBe("Daily at 9:00am");

      // Intl blows up -> unknown client tz -> append defensively.
      vi.stubGlobal("Intl", {
        DateTimeFormat: () => {
          throw new Error("no intl");
        },
      });
      expect(formatCronScheduleLabel(schedule, options)).toBe(
        "Daily at 9:00am (Etc/GMT+8)",
      );

      // Intl reports no time zone -> append defensively.
      vi.stubGlobal("Intl", {
        DateTimeFormat: () => ({ resolvedOptions: () => ({}) }),
      });
      expect(formatCronScheduleLabel(schedule, options)).toBe(
        "Daily at 9:00am (Etc/GMT+8)",
      );
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("derives job health and health class names", async () => {
    const { getCronJobHealth, getCronJobHealthClassName } = await loadCronHelpers();
    expect(getCronJobHealth({ enabled: false })).toBe("disabled");
    expect(getCronJobHealth({ state: { runningAtMs: 123 } })).toBe("running");
    expect(getCronJobHealth({ state: { lastStatus: "ERROR" } })).toBe("error");
    expect(getCronJobHealth({ state: { lastRunStatus: "ok" } })).toBe("ok");
    expect(getCronJobHealth({ state: {} })).toBe("unknown");
    expect(getCronJobHealth()).toBe("unknown");

    expect(getCronJobHealthClassName("ok")).toBe("bg-green-500");
    expect(getCronJobHealthClassName("error")).toBe("bg-red-500");
    expect(getCronJobHealthClassName("running")).toBe("bg-yellow-400");
    expect(getCronJobHealthClassName("disabled")).toBe("bg-gray-500");
    expect(getCronJobHealthClassName()).toBe("bg-gray-500");
  });

  it("formats token counts and costs", async () => {
    const { formatTokenCount, formatCost } = await loadCronHelpers();
    expect(formatTokenCount(1234)).toBe("1,234");
    expect(formatTokenCount()).toBe("0");
    expect(formatCost(1.5)).toContain("1.5");
    expect(formatCost()).toBeTruthy();
  });

  it("computes run token totals from components and fallbacks", async () => {
    const { getCronRunTotalTokens } = await loadCronHelpers();
    expect(
      getCronRunTotalTokens({
        usage: {
          input_tokens: 10,
          outputTokens: 20,
          cache_read_tokens: 30,
          cacheWriteTokens: 40,
          inputTokens: -1,
          output_tokens: "junk",
        },
      }),
    ).toBe(100);
    expect(getCronRunTotalTokens({ usage: { total_tokens: 500 } })).toBe(500);
    expect(getCronRunTotalTokens({ usage: { totalTokens: 400 } })).toBe(400);
    expect(getCronRunTotalTokens({ total_tokens: 300 })).toBe(300);
    expect(getCronRunTotalTokens({ totalTokens: 200 })).toBe(200);
    expect(getCronRunTotalTokens({ usage: { total_tokens: -5 } })).toBe(0);
    expect(getCronRunTotalTokens({})).toBe(0);
    expect(getCronRunTotalTokens()).toBe(0);
  });

  it("reads estimated run costs from candidate fields", async () => {
    const { getCronRunEstimatedCost } = await loadCronHelpers();
    expect(getCronRunEstimatedCost({ estimatedCost: 0.25 })).toBe(0.25);
    expect(getCronRunEstimatedCost({ estimated_cost: 0.5 })).toBe(0.5);
    expect(getCronRunEstimatedCost({ usage: { estimatedCost: 0.75 } })).toBe(0.75);
    expect(getCronRunEstimatedCost({ usage: { totalCost: 1.25 } })).toBe(1.25);
    expect(getCronRunEstimatedCost({ usage: { cost: 0.05 } })).toBe(0.05);
    expect(getCronRunEstimatedCost({ estimatedCost: "junk", usage: { cost: -1 } })).toBeNull();
    expect(getCronRunEstimatedCost({})).toBeNull();
    expect(getCronRunEstimatedCost()).toBeNull();
  });

  it("covers heartbeat suppression and warning edge cases", async () => {
    const { buildCronOptimizationWarnings } = await loadCronHelpers();

    // Latest bulk run is picked by ts; HEARTBEAT_OK in nested summaries suppresses.
    const suppressedByLatest = buildCronOptimizationWarnings(
      [
        {
          id: "job-nested",
          name: "Nested Heartbeat",
          delivery: { mode: "announce" },
          payload: { kind: "agentTurn", message: "noop" },
          state: { lastDelivered: false, lastDeliveryStatus: "not-delivered" },
        },
      ],
      {
        "job-nested": {
          entries: [
            { ts: 100, summary: "older failure" },
            { ts: 300, result: { summary: "HEARTBEAT_OK nested" } },
            { ts: 200, summary: "middle" },
          ],
        },
      },
    );
    expect(suppressedByLatest).toHaveLength(0);

    // payload.summary candidate also suppresses.
    const suppressedByPayload = buildCronOptimizationWarnings(
      [
        {
          id: "job-payload",
          name: "Payload Heartbeat",
          delivery: { mode: "announce" },
          payload: { kind: "agentTurn", message: "noop" },
          state: { lastDelivered: false, lastDeliveryStatus: "not-delivered" },
        },
      ],
      {
        "job-payload": {
          entries: [{ ts: 100, payload: { summary: "heartbeat_ok lower case" } }],
        },
      },
    );
    expect(suppressedByPayload).toHaveLength(0);

    // Latest run status "ok" from bulk entries suppresses the warning too.
    const suppressedByStatus = buildCronOptimizationWarnings(
      [
        {
          id: "job-ok",
          name: "Latest Ok",
          delivery: { mode: "announce" },
          payload: { kind: "agentTurn", message: "noop" },
          state: { lastDelivered: false, lastDeliveryStatus: "not-delivered" },
        },
      ],
      { "job-ok": { entries: [{ ts: 100, status: "OK" }] } },
    );
    expect(suppressedByStatus).toHaveLength(0);

    // Circular job state makes JSON.stringify throw; warning still fires.
    const circularState = {
      lastDelivered: false,
      lastDeliveryStatus: "not-delivered",
    };
    circularState.self = circularState;
    const circularWarnings = buildCronOptimizationWarnings(
      [
        {
          id: "job-circular",
          delivery: { mode: "announce" },
          payload: { kind: "agentTurn", message: "noop" },
          state: circularState,
        },
      ],
      {},
    );
    expect(circularWarnings).toHaveLength(1);
    expect(circularWarnings[0].title).toContain("job-circular");

    // The delivery-mismatch warning was removed upstream (delivery.mode=none
    // with a message-tool prompt is valid); such jobs no longer warn.
    const mismatch = buildCronOptimizationWarnings(
      [
        {
          id: "job-mismatch",
          name: "Mismatch",
          delivery: { mode: "none" },
          payload: { kind: "agentTurn", message: "Please use the MESSAGE TOOL here" },
          state: {},
        },
      ],
      {},
    );
    expect(mismatch).toHaveLength(0);

    // A job without an id still evaluates safely.
    const anonymous = buildCronOptimizationWarnings(
      [
        {
          name: "Anonymous",
          delivery: { mode: "announce" },
          payload: {},
          state: {
            lastDelivered: false,
            lastDeliveryStatus: "not-delivered",
            consecutiveErrors: 2,
          },
        },
      ],
      {},
    );
    expect(anonymous).toHaveLength(2);

    // Warnings are capped at eight.
    const manyJobs = Array.from({ length: 12 }, (_, index) => ({
      id: `job-${index}`,
      name: `Job ${index}`,
      delivery: { mode: "announce" },
      payload: { kind: "agentTurn", message: "noop" },
      state: { consecutiveErrors: 5 },
    }));
    expect(buildCronOptimizationWarnings(manyJobs, {})).toHaveLength(8);
    expect(buildCronOptimizationWarnings()).toEqual([]);
  });

  it("finds the next scheduled run across enabled jobs", async () => {
    const { getNextScheduledRunAcrossJobs, kAllCronJobsRouteKey } = await loadCronHelpers();
    expect(kAllCronJobsRouteKey).toBe("__all__");
    expect(
      getNextScheduledRunAcrossJobs([
        { enabled: true, state: { nextRunAtMs: 2000 } },
        { enabled: false, state: { nextRunAtMs: 100 } },
        { enabled: true, state: { nextRunAtMs: 1000 } },
        { enabled: true, state: {} },
        { enabled: true, state: { nextRunAtMs: "junk" } },
      ]),
    ).toBe(1000);
    expect(getNextScheduledRunAcrossJobs([])).toBeNull();
    expect(getNextScheduledRunAcrossJobs()).toBeNull();
    expect(
      getNextScheduledRunAcrossJobs([{ enabled: false, state: { nextRunAtMs: 5 } }]),
    ).toBeNull();
  });

  it("handles non-object payloads when reading prompts", async () => {
    const { readCronJobPrompt } = await loadCronHelpers();
    expect(readCronJobPrompt({ payload: null })).toBe("");
    expect(readCronJobPrompt()).toBe("");
    expect(readCronJobPrompt({ payload: { kind: "systemEvent", text: 42 } })).toBe("");
    expect(readCronJobPrompt({ payload: { kind: "agentTurn", message: 42 } })).toBe("");
  });
});
