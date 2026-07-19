const fs = require("fs");
const os = require("os");
const path = require("path");
const { DatabaseSync } = require("node:sqlite");

const shared = require("../../lib/server/db/usage/shared");
const pricing = require("../../lib/server/db/usage/pricing");

const loadUsageDb = () => {
  const modulePath = require.resolve("../../lib/server/db/usage");
  delete require.cache[modulePath];
  return require(modulePath);
};

let currentUsageDb = null;
let currentDatabase = null;
let currentRootDir = "";

const createUsageDbContext = (prefix) => {
  currentRootDir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  currentUsageDb = loadUsageDb();
  const { path: dbPath } = currentUsageDb.initUsageDb({ rootDir: currentRootDir });
  currentDatabase = new DatabaseSync(dbPath);
  return {
    ...currentUsageDb,
    database: currentDatabase,
    rootDir: currentRootDir,
  };
};

const insertUsageEventSql = `
  INSERT INTO usage_events (
    timestamp,
    session_id,
    session_key,
    run_id,
    provider,
    model,
    input_tokens,
    output_tokens,
    cache_read_tokens,
    cache_write_tokens,
    total_tokens
  ) VALUES (
    $timestamp,
    $session_id,
    $session_key,
    $run_id,
    $provider,
    $model,
    $input_tokens,
    $output_tokens,
    $cache_read_tokens,
    $cache_write_tokens,
    $total_tokens
  )
`;

const usageEventRow = (overrides = {}) => ({
  $timestamp: Date.now(),
  $session_id: "raw-session",
  $session_key: "session-key",
  $run_id: "run-1",
  $provider: "openai",
  $model: "gpt-4o",
  $input_tokens: 0,
  $output_tokens: 0,
  $cache_read_tokens: 0,
  $cache_write_tokens: 0,
  $total_tokens: 0,
  ...overrides,
});

afterEach(() => {
  if (currentDatabase) {
    currentDatabase.close();
    currentDatabase = null;
  }
  if (currentUsageDb?.closeUsageDb) {
    currentUsageDb.closeUsageDb();
    currentUsageDb = null;
  }
  if (currentRootDir) {
    fs.rmSync(currentRootDir, { recursive: true, force: true });
    currentRootDir = "";
  }
});

describe("server/db/usage/shared", () => {
  it("re-exports pricing helpers from cost-utils", () => {
    expect(typeof pricing.deriveCostBreakdown).toBe("function");
  });

  it("coerces and clamps integers with fallbacks", () => {
    expect(shared.coerceInt("42")).toBe(42);
    expect(shared.coerceInt("nope", 7)).toBe(7);
    expect(shared.coerceInt(null)).toBe(0);
    expect(shared.clampInt(999, 1, 100, 50)).toBe(100);
    expect(shared.clampInt(-5, 1, 100, 50)).toBe(1);
    expect(shared.clampInt("junk", 1, 100, 50)).toBe(50);
  });

  it("formats day keys in a non-UTC time zone and caches formatters", () => {
    const timestamp = Date.UTC(2026, 0, 2, 1, 30, 0);
    const first = shared.toTimeZoneDayKey(timestamp, "America/New_York");
    const second = shared.toTimeZoneDayKey(timestamp, "America/New_York");
    // 01:30 UTC on Jan 2 is still Jan 1 in New York.
    expect(first).toBe("2026-01-01");
    expect(second).toBe(first);
    expect(shared.toDayKey(timestamp)).toBe("2026-01-02");
  });

  it("normalizes invalid and empty time zones to UTC in getPeriodRange", () => {
    const invalid = shared.getPeriodRange(30, "Not/AZone");
    expect(invalid.timeZone).toBe("UTC");
    const empty = shared.getPeriodRange(30, "   ");
    expect(empty.timeZone).toBe("UTC");
    const zoned = shared.getPeriodRange(30, "America/New_York");
    expect(zoned.timeZone).toBe("America/New_York");
    expect(zoned.startDay).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("falls back to summed tokens when total_tokens is missing", () => {
    const metrics = shared.getUsageMetricsFromEventRow({
      input_tokens: 1,
      output_tokens: 2,
      cache_read_tokens: 3,
      cache_write_tokens: 4,
      total_tokens: 0,
      provider: "openai",
      model: "gpt-4o",
    });
    expect(metrics.totalTokens).toBe(10);
  });

  it("parses agent and source from session refs", () => {
    expect(shared.parseAgentAndSourceFromSessionRef("")).toEqual({
      agent: "unknown",
      source: "chat",
    });
    expect(shared.parseAgentAndSourceFromSessionRef("agent::hook:x")).toEqual({
      agent: "unknown",
      source: "hooks",
    });
    expect(shared.parseAgentAndSourceFromSessionRef("agent:ops:cron:sync")).toEqual({
      agent: "ops",
      source: "cron",
    });
    expect(shared.parseAgentAndSourceFromSessionRef("plain-session")).toEqual({
      agent: "unknown",
      source: "chat",
    });
  });

  it("downsamples long point series and always keeps the last point", () => {
    const points = Array.from({ length: 30 }, (_, index) => ({
      timestamp: index + 1,
    }));
    const sampled = shared.downsamplePoints(points, 10);
    expect(sampled.length).toBeLessThanOrEqual(11);
    expect(sampled[0].timestamp).toBe(1);
    expect(sampled[sampled.length - 1].timestamp).toBe(30);

    // Stride lands exactly on the last point: no duplicate push.
    const eleven = Array.from({ length: 11 }, (_, index) => ({
      timestamp: index + 1,
    }));
    const evenSample = shared.downsamplePoints(eleven, 10);
    expect(evenSample[evenSample.length - 1].timestamp).toBe(11);
    expect(
      evenSample.filter((point) => point.timestamp === 11),
    ).toHaveLength(1);

    // Short series are returned untouched.
    expect(shared.downsamplePoints(points.slice(0, 5), 10)).toHaveLength(5);
  });
});

describe("server/db/usage/index extras", () => {
  it("throws when the usage DB has not been initialized", () => {
    const usageDb = loadUsageDb();
    expect(() => usageDb.getDailySummary()).toThrow(/Usage DB not initialized/);
  });

  it("returns empty totals for a blank key pattern", () => {
    const { getSessionUsageByKeyPattern } = createUsageDbContext("usage-db-empty-pattern-");
    const usage = getSessionUsageByKeyPattern({ keyPattern: "   " });
    expect(usage.totals.totalTokens).toBe(0);
    expect(usage.totals.runCount).toBe(0);
    expect(usage.modelBreakdown).toEqual([]);
    const defaulted = getSessionUsageByKeyPattern();
    expect(defaulted.modelBreakdown).toEqual([]);
  });
});

describe("server/db/usage/sessions", () => {
  it("lists sessions with per-session cost and dominant model", () => {
    const { database, getSessionsList } = createUsageDbContext("usage-db-sessions-list-");
    const now = Date.now();
    const insert = database.prepare(insertUsageEventSql);

    insert.run(usageEventRow({
      $timestamp: now - 5_000,
      $session_id: "raw-a",
      $session_key: "session-a",
      $model: "gpt-4o",
      $input_tokens: 1_000_000,
      $total_tokens: 1_000_000,
    }));
    insert.run(usageEventRow({
      $timestamp: now - 4_000,
      $session_id: "raw-a",
      $session_key: "session-a",
      $run_id: "run-2",
      $provider: "anthropic",
      $model: "claude-opus-4-6",
      $output_tokens: 10_000,
      $total_tokens: 10_000,
    }));
    // Session identified only by session_id (empty session_key).
    insert.run(usageEventRow({
      $timestamp: now - 3_000,
      $session_id: "raw-b",
      $session_key: "",
      $model: "",
      $provider: "",
      $input_tokens: 5,
      $total_tokens: 5,
    }));
    // Event with neither key nor id is excluded from listings.
    insert.run(usageEventRow({
      $timestamp: now - 2_000,
      $session_id: "",
      $session_key: "",
      $input_tokens: 1,
      $total_tokens: 1,
    }));

    const sessions = getSessionsList({ limit: 10 });
    expect(sessions).toHaveLength(2);
    const sessionA = sessions.find((row) => row.sessionId === "session-a");
    const sessionB = sessions.find((row) => row.sessionId === "raw-b");

    expect(sessionA).toBeTruthy();
    expect(sessionA.turnCount).toBe(2);
    expect(sessionA.totalTokens).toBe(1_010_000);
    expect(sessionA.dominantModel).toBe("gpt-4o");
    expect(sessionA.totalCost).toBeGreaterThan(0);
    expect(sessionA.durationMs).toBe(1_000);
    expect(sessionA.rawSessionId).toBe("raw-a");

    expect(sessionB).toBeTruthy();
    expect(sessionB.sessionKey).toBe("");
    expect(sessionB.totalTokens).toBe(5);
  });

  it("clamps the sessions list limit to a safe range", () => {
    const { database, getSessionsList } = createUsageDbContext("usage-db-sessions-limit-");
    const insert = database.prepare(insertUsageEventSql);
    insert.run(usageEventRow({ $session_key: "s-1", $input_tokens: 1, $total_tokens: 1 }));
    insert.run(usageEventRow({ $session_key: "s-2", $input_tokens: 1, $total_tokens: 1 }));

    expect(getSessionsList({ limit: 100000 })).toHaveLength(2);
    expect(getSessionsList({ limit: "junk" })).toHaveLength(2);
    expect(getSessionsList({ limit: 1 })).toHaveLength(1);
    expect(getSessionsList()).toHaveLength(2);
  });

  it("returns null for blank and unknown session detail lookups", () => {
    const { getSessionDetail } = createUsageDbContext("usage-db-detail-null-");
    expect(getSessionDetail({ sessionId: "   " })).toBeNull();
    expect(getSessionDetail({ sessionId: "no-such-session" })).toBeNull();
  });

  it("aggregates tool usage rows in session detail", () => {
    const { database, getSessionDetail } = createUsageDbContext("usage-db-detail-tools-");
    const now = Date.now();
    database.prepare(insertUsageEventSql).run(usageEventRow({
      $timestamp: now,
      $session_key: "session-tools",
      $provider: "",
      $model: "",
      $input_tokens: 10,
      $total_tokens: 10,
    }));

    const insertTool = database.prepare(`
      INSERT INTO tool_events (
        timestamp, session_id, session_key, tool_name, success, duration_ms
      ) VALUES ($timestamp, $session_id, $session_key, $tool_name, $success, $duration_ms)
    `);
    insertTool.run({
      $timestamp: now,
      $session_id: "raw",
      $session_key: "session-tools",
      $tool_name: "exec",
      $success: 1,
      $duration_ms: 100,
    });
    insertTool.run({
      $timestamp: now,
      $session_id: "raw",
      $session_key: "session-tools",
      $tool_name: "exec",
      $success: 0,
      $duration_ms: 300,
    });
    insertTool.run({
      $timestamp: now,
      $session_id: "raw",
      $session_key: "session-tools",
      $tool_name: "read",
      $success: 1,
      $duration_ms: null,
    });

    const detail = getSessionDetail({ sessionId: "session-tools" });
    expect(detail).toBeTruthy();
    // Empty provider/model fall back to "unknown" in the breakdown.
    expect(detail.modelBreakdown[0].provider).toBe("unknown");
    expect(detail.modelBreakdown[0].model).toBe("unknown");

    const execRow = detail.toolUsage.find((row) => row.toolName === "exec");
    const readRow = detail.toolUsage.find((row) => row.toolName === "read");
    expect(execRow.callCount).toBe(2);
    expect(execRow.successCount).toBe(1);
    expect(execRow.errorCount).toBe(1);
    expect(execRow.errorRate).toBeCloseTo(0.5, 8);
    expect(execRow.avgDurationMs).toBeCloseTo(200, 8);
    expect(execRow.minDurationMs).toBe(100);
    expect(execRow.maxDurationMs).toBe(300);
    expect(readRow.callCount).toBe(1);
    expect(readRow.errorCount).toBe(0);
    expect(readRow.avgDurationMs).toBe(0);
    expect(readRow.minDurationMs).toBe(0);
  });
});

describe("server/db/usage/timeseries", () => {
  it("returns an empty series for a blank session id", () => {
    const { getSessionTimeSeries } = createUsageDbContext("usage-db-ts-blank-");
    expect(getSessionTimeSeries({ sessionId: "   " })).toEqual({
      sessionId: "",
      points: [],
    });
  });

  it("builds cumulative token and cost series per session", () => {
    const { database, getSessionTimeSeries } = createUsageDbContext("usage-db-ts-series-");
    const now = Date.now();
    const insert = database.prepare(insertUsageEventSql);
    insert.run(usageEventRow({
      $timestamp: now - 2_000,
      $session_id: "raw-ts",
      $session_key: "",
      $model: "",
      $input_tokens: 100,
      $total_tokens: 100,
    }));
    insert.run(usageEventRow({
      $timestamp: now - 1_000,
      $session_id: "raw-ts",
      $session_key: "",
      $input_tokens: 1_000_000,
      $total_tokens: 1_000_000,
    }));

    const series = getSessionTimeSeries({ sessionId: "raw-ts" });
    expect(series.sessionId).toBe("raw-ts");
    expect(series.points).toHaveLength(2);
    expect(series.points[0].sessionKey).toBe("");
    expect(series.points[0].rawSessionId).toBe("raw-ts");
    expect(series.points[0].model).toBe("");
    expect(series.points[0].cumulativeTokens).toBe(100);
    expect(series.points[1].cumulativeTokens).toBe(1_000_100);
    expect(series.points[1].cumulativeCost).toBeGreaterThan(0);
  });

  it("downsamples the series when it exceeds maxPoints", () => {
    const { database, getSessionTimeSeries } = createUsageDbContext("usage-db-ts-downsample-");
    const now = Date.now();
    const insert = database.prepare(insertUsageEventSql);
    for (let index = 0; index < 30; index += 1) {
      insert.run(usageEventRow({
        $timestamp: now - 30_000 + index * 1_000,
        $session_key: "session-long",
        $input_tokens: 10,
        $total_tokens: 10,
      }));
    }

    const series = getSessionTimeSeries({ sessionId: "session-long", maxPoints: 10 });
    expect(series.points.length).toBeLessThan(30);
    expect(series.points[series.points.length - 1].cumulativeTokens).toBe(300);
  });
});

describe("server/db/usage/summary", () => {
  it("skips events older than the requested period start", () => {
    const { database, getDailySummary } = createUsageDbContext("usage-db-summary-old-");
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const insert = database.prepare(insertUsageEventSql);
    // Within the SQL lookback window (safeDays + 2) but before startDay.
    insert.run(usageEventRow({
      $timestamp: now - 2 * dayMs,
      $session_key: "agent:old:cron:x",
      $input_tokens: 500,
      $total_tokens: 500,
    }));
    insert.run(usageEventRow({
      $timestamp: now,
      $session_key: "agent:new:cron:x",
      $input_tokens: 100,
      $total_tokens: 100,
    }));

    const summary = getDailySummary({ days: 1 });
    expect(summary.totals.totalTokens).toBe(100);
    expect(
      summary.costByAgent.agents.find((row) => row.agent === "old"),
    ).toBeUndefined();
    expect(
      summary.costByAgent.agents.find((row) => row.agent === "new"),
    ).toBeTruthy();
  });

  it("buckets days using the requested non-UTC time zone", () => {
    const { database, getDailySummary } = createUsageDbContext("usage-db-summary-tz-");
    const now = Date.now();
    database.prepare(insertUsageEventSql).run(usageEventRow({
      $timestamp: now,
      $session_key: "agent:main:cron:x",
      $input_tokens: 10,
      $total_tokens: 10,
    }));

    const summary = getDailySummary({ days: 7, timeZone: "America/New_York" });
    expect(summary.timeZone).toBe("America/New_York");
    expect(summary.daily).toHaveLength(1);
    expect(summary.daily[0].date).toBe(
      shared.toTimeZoneDayKey(now, "America/New_York"),
    );
    expect(summary.totals.totalTokens).toBe(10);
  });

  it("orders models across dates and sources/agents within a date", () => {
    const { database, getDailySummary } = createUsageDbContext("usage-db-summary-order-");
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const insert = database.prepare(insertUsageEventSql);
    // Two models on the same (yesterday) date exercise the same-date tiebreak.
    insert.run(usageEventRow({
      $timestamp: now - dayMs,
      $session_key: "agent:alpha:hook:h",
      $model: "gpt-4o",
      $input_tokens: 100,
      $total_tokens: 100,
    }));
    insert.run(usageEventRow({
      $timestamp: now - dayMs,
      $session_key: "agent:beta:x",
      $provider: "anthropic",
      $model: "claude-opus-4-6",
      $input_tokens: 900,
      $total_tokens: 900,
    }));
    // A later date exercises the cross-date localeCompare ordering.
    insert.run(usageEventRow({
      $timestamp: now,
      $session_key: "agent:alpha:hook:h",
      $model: "gpt-4o",
      $input_tokens: 50,
      $total_tokens: 50,
    }));

    const summary = getDailySummary({ days: 7 });
    expect(summary.daily).toHaveLength(2);
    const [yesterday, today] = summary.daily;
    expect(yesterday.date < today.date).toBe(true);
    // Same-date model rows are ordered by descending tokens.
    expect(yesterday.models.map((row) => row.model)).toEqual([
      "claude-opus-4-6",
      "gpt-4o",
    ]);
    // Sources and agents within a date are ordered by descending tokens.
    expect(yesterday.sources.map((row) => row.source)).toEqual(["chat", "hooks"]);
    expect(yesterday.agents.map((row) => row.agent)).toEqual(["beta", "alpha"]);
  });

  it("breaks agent ordering ties by agent name", () => {
    const { database, getDailySummary } = createUsageDbContext("usage-db-summary-agent-tie-");
    const now = Date.now();
    const insert = database.prepare(insertUsageEventSql);
    // Two agents with identical token totals on the same day.
    insert.run(usageEventRow({
      $timestamp: now,
      $session_key: "agent:zed:cron:x",
      $input_tokens: 100,
      $total_tokens: 100,
    }));
    insert.run(usageEventRow({
      $timestamp: now,
      $session_key: "agent:amy:cron:y",
      $input_tokens: 100,
      $total_tokens: 100,
    }));

    const summary = getDailySummary({ days: 7 });
    expect(summary.daily).toHaveLength(1);
    expect(summary.daily[0].agents.map((row) => row.agent)).toEqual([
      "amy",
      "zed",
    ]);
  });
});
