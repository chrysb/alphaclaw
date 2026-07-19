import { describe, expect, it } from "vitest";
import {
  buildSlotKey,
  buildTokenTierByJobId,
  classifyRepeatingJobs,
  expandJobsToRollingSlots,
  getRollingRange,
  mapRunStatusesToSlots,
} from "../../lib/public/js/components/cron-tab/cron-calendar-helpers.js";

const kMinuteMs = 60 * 1000;
const kHourMs = 60 * kMinuteMs;
const kDayMs = 24 * kHourMs;
// Local-time noon so day boundaries are stable regardless of timezone.
const kNowMs = new Date(2026, 5, 15, 12, 0, 0, 0).getTime();

describe("frontend/cron-calendar-helpers (extended)", () => {
  it("classifies schedule kinds and malformed cron expressions", () => {
    const jobs = [
      { id: "every", schedule: { kind: "every", everyMs: kMinuteMs } },
      { id: "at", schedule: { kind: "at", at: kNowMs } },
      { id: "short-cron", schedule: { kind: "cron", expr: "* *" } },
      { id: "step", schedule: { kind: "cron", expr: "*/15 * * * *" } },
      { id: "zero-step", schedule: { kind: "cron", expr: "*/0 * * * *" } },
      {
        id: "dense-list",
        schedule: { kind: "cron", expr: "0,15,30 6-13 * * 1-5" },
      },
      { id: "narrow-step", schedule: { kind: "cron", expr: "*/15 8 * * *" } },
      { id: "daily", schedule: { kind: "cron", expr: "0 9 * * *" } },
    ];

    const { repeatingJobs, scheduledJobs } = classifyRepeatingJobs(jobs);
    expect(repeatingJobs.map((job) => job.id)).toEqual([
      "every",
      "step",
      "dense-list",
    ]);
    expect(scheduledJobs.map((job) => job.id)).toEqual([
      "at",
      "short-cron",
      "zero-step",
      "narrow-step",
      "daily",
    ]);
  });

  it("discards out-of-range, inverted, overflowing, and junk cron tokens", () => {
    const hugeDigits = "9".repeat(400);
    const jobs = [
      // minute 99 out of range, hour range inverted after clamping.
      { id: "bad-values", schedule: { kind: "cron", expr: "99 30-10 * * *" } },
      // parseInt overflows to Infinity for absurdly long digit runs.
      {
        id: "huge-range",
        schedule: { kind: "cron", expr: `${hugeDigits}-${hugeDigits} * * * *` },
      },
      { id: "junk-token", schedule: { kind: "cron", expr: "abc 1,2 * * *" } },
    ];
    // Empty minute/hour sets fall back to "match everything", so none of
    // these are dense enough to be repeating.
    const { repeatingJobs, scheduledJobs } = classifyRepeatingJobs(jobs);
    expect(repeatingJobs).toEqual([]);
    expect(scheduledJobs).toHaveLength(3);
  });

  it("expands at and cron jobs into rolling slots", () => {
    const atInsideMs = kNowMs + kHourMs;
    const result = expandJobsToRollingSlots({
      jobs: [
        { id: "every", schedule: { kind: "every", everyMs: kMinuteMs } },
        { id: "at-in", name: "At In", schedule: { kind: "at", at: atInsideMs } },
        { id: "at-out", schedule: { kind: "at", at: kNowMs + 40 * kDayMs } },
        { id: "bad-cron", schedule: { kind: "cron", expr: "* *" } },
        { id: "daily", schedule: { kind: "cron", expr: "30 9 * * *" } },
      ],
      nowMs: kNowMs,
    });

    expect(result.range.dayCount).toBe(7);
    expect(result.days).toHaveLength(7);
    expect(result.days[0].dayKey).toBe("2026-06-12");

    const atSlots = result.slots.filter((slot) => slot.jobId === "at-in");
    expect(atSlots).toHaveLength(1);
    expect(atSlots[0]).toMatchObject({
      key: buildSlotKey({ jobId: "at-in", scheduledAtMs: atInsideMs }),
      jobName: "At In",
      scheduledAtMs: atInsideMs,
      dayKey: "2026-06-15",
      hourOfDay: 13,
    });

    const dailySlots = result.slots.filter((slot) => slot.jobId === "daily");
    expect(dailySlots).toHaveLength(7);
    expect(new Date(dailySlots[0].scheduledAtMs).getHours()).toBe(9);
    expect(new Date(dailySlots[0].scheduledAtMs).getMinutes()).toBe(30);

    expect(
      result.slots.some((slot) =>
        ["every", "at-out", "bad-cron"].includes(slot.jobId),
      ),
    ).toBe(false);

    // Slots are sorted by time.
    const times = result.slots.map((slot) => slot.scheduledAtMs);
    expect([...times].sort((left, right) => left - right)).toEqual(times);
  });

  it("expands day-of-week cron fields including the Sunday alias", () => {
    // June 14 2026 is a Sunday; day-of-week 7 must match it too.
    const result = expandJobsToRollingSlots({
      jobs: [{ id: "sunday", schedule: { kind: "cron", expr: "0 6 * * 7" } }],
      nowMs: kNowMs,
    });
    expect(result.slots).toHaveLength(1);
    expect(new Date(result.slots[0].scheduledAtMs).getDay()).toBe(0);
  });

  it("maps run statuses onto slots with tolerance and consumption", () => {
    const baseMs = kNowMs - 6 * kHourMs;
    const slots = [
      { key: "job:1", jobId: "job", scheduledAtMs: baseMs },
      { key: "job:2", jobId: "job", scheduledAtMs: baseMs + kMinuteMs },
      { key: "job:3", jobId: "job", scheduledAtMs: baseMs + 2 * kMinuteMs },
      { key: "far:1", jobId: "far", scheduledAtMs: baseMs },
      { key: "none:1", jobId: "none", scheduledAtMs: baseMs },
      { key: "future:1", jobId: "job", scheduledAtMs: kNowMs + kHourMs },
    ];
    const statusBySlotKey = mapRunStatusesToSlots({
      slots,
      bulkRunsByJobId: {
        job: {
          entries: [
            { ts: baseMs + 10 * kMinuteMs, status: "ERROR" },
            { ts: baseMs, status: "ok" },
            { ts: 0, status: "ok" },
            { ts: baseMs + 20 * kMinuteMs, status: "bogus-status" },
          ],
        },
        far: {
          entries: [{ ts: baseMs + 3 * kHourMs, status: "skipped" }],
        },
        empty: { entries: "not-an-array" },
      },
      nowMs: kNowMs,
    });

    expect(statusBySlotKey).toEqual({
      "job:1": "ok",
      "job:2": "error",
    });
    // job:3 finds every entry consumed, far:1 only has an out-of-tolerance
    // run, none:1 has no runs, and future:1 is skipped entirely.
    expect(statusBySlotKey["job:3"]).toBeUndefined();
    expect(statusBySlotKey["far:1"]).toBeUndefined();
    expect(statusBySlotKey["none:1"]).toBeUndefined();
    expect(statusBySlotKey["future:1"]).toBeUndefined();
  });

  it("marks every job unknown or disabled when no usage exists", () => {
    expect(
      buildTokenTierByJobId({
        jobs: [{ id: "a" }, { id: "b", enabled: false }],
        usageByJobId: {},
      }),
    ).toEqual({ a: "unknown", b: "disabled" });
    expect(buildTokenTierByJobId()).toEqual({});
  });

  it("falls back to defaults for junk rolling range inputs", () => {
    const range = getRollingRange({
      nowMs: "not-a-number",
      pastDays: "junk",
      futureDays: "junk",
    });
    expect(range.dayCount).toBe(7);
    expect(range.rangeEndMs).toBeGreaterThan(range.rangeStartMs);
  });
});
