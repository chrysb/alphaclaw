const loadFormatModule = async () => import("../../lib/public/js/lib/format.js");

class ThrowingDate extends Date {
  getTime() {
    throw new Error("boom");
  }
}

describe("frontend/format", () => {
  it("formatInteger formats with grouping and defaults to zero", async () => {
    const { formatInteger } = await loadFormatModule();

    expect(formatInteger(1234567)).toBe("1,234,567");
    expect(formatInteger(undefined)).toBe("0");
  });

  it("formatCompactNumber handles small, large, and non-finite values", async () => {
    const { formatCompactNumber } = await loadFormatModule();

    expect(formatCompactNumber(999)).toBe("999");
    expect(formatCompactNumber(-999)).toBe("-999");
    expect(formatCompactNumber(1500)).toBe("1.5K");
    expect(formatCompactNumber(-2500000)).toBe("-2.5M");
    expect(formatCompactNumber(Infinity)).toBe("0");
    expect(formatCompactNumber(undefined)).toBe("0");
  });

  it("formatBytes scales through units with adaptive precision", async () => {
    const { formatBytes } = await loadFormatModule();

    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(-5)).toBe("0 B");
    expect(formatBytes(Infinity)).toBe("0 B");
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(2048)).toBe("2.00 KB");
    expect(formatBytes(15 * 1024)).toBe("15.0 KB");
    expect(formatBytes(200 * 1024)).toBe("200 KB");
    expect(formatBytes(5 * 1024 ** 3)).toBe("5.00 GB");
    expect(formatBytes(2000 * 1024 ** 4)).toBe("2000 TB");
  });

  it("formatUsd formats currency values", async () => {
    const { formatUsd } = await loadFormatModule();

    expect(formatUsd(1234.5)).toBe("$1,234.50");
    expect(formatUsd(0.005)).toBe("$0.005");
    expect(formatUsd(undefined)).toBe("$0.00");
  });

  it("formatLocaleDateTime converts supported value shapes", async () => {
    const { formatLocaleDateTime } = await loadFormatModule();
    const date = new Date(2026, 0, 2, 3, 4, 5);

    expect(formatLocaleDateTime(date)).toBe(date.toLocaleString());
    expect(formatLocaleDateTime(1700000000, { valueIsUnixSeconds: true })).toBe(
      new Date(1700000000 * 1000).toLocaleString(),
    );
    expect(formatLocaleDateTime(date.getTime(), { valueIsEpochMs: true })).toBe(
      date.toLocaleString(),
    );
    expect(formatLocaleDateTime("2026-01-02T03:04:05")).toBe(
      new Date("2026-01-02T03:04:05").toLocaleString(),
    );
  });

  it("formatLocaleDateTime falls back for empty, invalid, and throwing values", async () => {
    const { formatLocaleDateTime } = await loadFormatModule();

    expect(formatLocaleDateTime(null)).toBe("—");
    expect(formatLocaleDateTime("")).toBe("—");
    expect(formatLocaleDateTime("not-a-date")).toBe("—");
    expect(formatLocaleDateTime("not-a-date", { fallback: "n/a" })).toBe("n/a");
    expect(formatLocaleDateTime(new ThrowingDate())).toBe("—");
  });

  it("formatLocaleDateTimeWithTodayTime prints time only for today", async () => {
    const { formatLocaleDateTimeWithTodayTime } = await loadFormatModule();
    const now = new Date();
    const twoDaysAgo = new Date(Date.now() - 2 * 86400000);

    expect(formatLocaleDateTimeWithTodayTime(now)).toBe(now.toLocaleTimeString());
    expect(formatLocaleDateTimeWithTodayTime(twoDaysAgo)).toBe(
      twoDaysAgo.toLocaleString(),
    );
    expect(formatLocaleDateTimeWithTodayTime(null)).toBe("—");
    expect(formatLocaleDateTimeWithTodayTime("nope", { fallback: "x" })).toBe("x");
    expect(formatLocaleDateTimeWithTodayTime(new ThrowingDate())).toBe("—");
    expect(
      formatLocaleDateTimeWithTodayTime(1700000000, { valueIsUnixSeconds: true }),
    ).toBe(new Date(1700000000 * 1000).toLocaleString());
  });

  it("formatDurationCompactMs formats durations", async () => {
    const { formatDurationCompactMs } = await loadFormatModule();

    expect(formatDurationCompactMs(0)).toBe("0s");
    expect(formatDurationCompactMs(-10)).toBe("0s");
    expect(formatDurationCompactMs(Infinity)).toBe("0s");
    expect(formatDurationCompactMs(500)).toBe("500ms");
    expect(formatDurationCompactMs(5000)).toBe("5s");
    expect(formatDurationCompactMs(59_400)).toBe("59s");
    expect(formatDurationCompactMs(60_000)).toBe("1m 0s");
    expect(formatDurationCompactMs(125_000)).toBe("2m 5s");
  });

  it("formatChartBucketLabel formats day keys per range", async () => {
    const { formatChartBucketLabel } = await loadFormatModule();
    const date = new Date(2026, 6, 1);

    expect(
      formatChartBucketLabel("2026-07-01", { range: "7d", valueType: "day-key" }),
    ).toBe(
      date.toLocaleDateString([], {
        weekday: "short",
        month: "numeric",
        day: "numeric",
      }),
    );
    expect(
      formatChartBucketLabel("2026-07-01", { range: "30d", valueType: "day-key" }),
    ).toBe(date.toLocaleDateString([], { month: "numeric", day: "numeric" }));
    expect(formatChartBucketLabel("not-a-day", { valueType: "day-key" })).toBe(
      "not-a-day",
    );
    expect(formatChartBucketLabel(null, { valueType: "day-key" })).toBe("");
  });

  it("formatChartBucketLabel formats epoch and date values", async () => {
    const { formatChartBucketLabel } = await loadFormatModule();
    const date = new Date(2026, 6, 1, 13, 30);

    expect(formatChartBucketLabel(date.getTime(), { range: "24h" })).toBe(
      date.toLocaleTimeString([], { hour: "numeric" }),
    );
    expect(formatChartBucketLabel(date.getTime())).toBe(
      date.toLocaleDateString([], {
        weekday: "short",
        month: "numeric",
        day: "numeric",
      }),
    );
    expect(formatChartBucketLabel("abc", {})).toBe("abc");
    expect(formatChartBucketLabel(date, { range: "30d", valueType: "date" })).toBe(
      date.toLocaleDateString([], { month: "numeric", day: "numeric" }),
    );
    expect(formatChartBucketLabel("nope", { valueType: "date" })).toBe("nope");
  });
});
