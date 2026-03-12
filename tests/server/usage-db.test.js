const fs = require("fs");
const os = require("os");
const path = require("path");
const { DatabaseSync } = require("node:sqlite");

const loadUsageDb = () => {
  const modulePath = require.resolve("../../lib/server/db/usage");
  delete require.cache[modulePath];
  return require(modulePath);
};

describe("server/usage-db", () => {
  it("sums per-model costs for session detail totals", () => {
    const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), "usage-db-cost-"));
    const { initUsageDb, getSessionDetail } = loadUsageDb();
    const { path: dbPath } = initUsageDb({ rootDir });
    const database = new DatabaseSync(dbPath);

    const insertUsageEvent = database.prepare(`
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
    `);

    insertUsageEvent.run({
      $timestamp: Date.now() - 1000,
      $session_id: "raw-session-1",
      $session_key: "session-1",
      $run_id: "run-1",
      $provider: "openai",
      $model: "gpt-4o",
      $input_tokens: 1_000_000,
      $output_tokens: 0,
      $cache_read_tokens: 0,
      $cache_write_tokens: 0,
      $total_tokens: 1_000_000,
    });
    insertUsageEvent.run({
      $timestamp: Date.now(),
      $session_id: "raw-session-1",
      $session_key: "session-1",
      $run_id: "run-2",
      $provider: "anthropic",
      $model: "claude-opus-4-6",
      $input_tokens: 0,
      $output_tokens: 1_000_000,
      $cache_read_tokens: 0,
      $cache_write_tokens: 0,
      $total_tokens: 1_000_000,
    });

    const detail = getSessionDetail({ sessionId: "session-1" });
    const expectedCost = 2.5 + 37.5;
    const summedBreakdownCost = detail.modelBreakdown.reduce(
      (sum, row) => sum + Number(row.totalCost || 0),
      0,
    );

    expect(detail).toBeTruthy();
    expect(detail.totalCost).toBeCloseTo(expectedCost, 8);
    expect(detail.totalCost).toBeCloseTo(summedBreakdownCost, 8);

    fs.rmSync(rootDir, { recursive: true, force: true });
  });

  it("returns cost distribution by agent and source", () => {
    const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), "usage-db-agent-breakdown-"));
    const { initUsageDb, getDailySummary } = loadUsageDb();
    const { path: dbPath } = initUsageDb({ rootDir });
    const database = new DatabaseSync(dbPath);
    const now = Date.now();

    const insertUsageEvent = database.prepare(`
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
    `);

    insertUsageEvent.run({
      $timestamp: now - 2_000,
      $session_id: "raw-a",
      $session_key: "agent:main:telegram:direct:123",
      $run_id: "run-a",
      $provider: "openai",
      $model: "gpt-4o",
      $input_tokens: 1_000_000,
      $output_tokens: 0,
      $cache_read_tokens: 0,
      $cache_write_tokens: 0,
      $total_tokens: 1_000_000,
    });
    insertUsageEvent.run({
      $timestamp: now - 1_000,
      $session_id: "raw-b",
      $session_key: "agent:main:hook:gmail:abc123",
      $run_id: "run-b",
      $provider: "openai",
      $model: "gpt-4o",
      $input_tokens: 0,
      $output_tokens: 1_000_000,
      $cache_read_tokens: 0,
      $cache_write_tokens: 0,
      $total_tokens: 1_000_000,
    });
    insertUsageEvent.run({
      $timestamp: now - 500,
      $session_id: "raw-c",
      $session_key: "agent:ops:cron:nightly",
      $run_id: "run-c",
      $provider: "openai",
      $model: "gpt-4o",
      $input_tokens: 0,
      $output_tokens: 1_000_000,
      $cache_read_tokens: 0,
      $cache_write_tokens: 0,
      $total_tokens: 1_000_000,
    });

    const summary = getDailySummary({ days: 7, timeZone: "UTC" });

    expect(summary?.costByAgent).toBeTruthy();
    expect(Array.isArray(summary.costByAgent.agents)).toBe(true);

    const mainAgent = summary.costByAgent.agents.find((row) => row.agent === "main");
    const opsAgent = summary.costByAgent.agents.find((row) => row.agent === "ops");

    expect(mainAgent).toBeTruthy();
    expect(opsAgent).toBeTruthy();
    expect(mainAgent.totalCost).toBeCloseTo(12.5, 8);
    expect(opsAgent.totalCost).toBeCloseTo(10, 8);

    const mainChat = mainAgent.sourceBreakdown.find((row) => row.source === "chat");
    const mainHooks = mainAgent.sourceBreakdown.find((row) => row.source === "hooks");
    const mainCron = mainAgent.sourceBreakdown.find((row) => row.source === "cron");

    expect(mainChat.totalCost).toBeCloseTo(2.5, 8);
    expect(mainHooks.totalCost).toBeCloseTo(10, 8);
    expect(mainCron.totalCost).toBeCloseTo(0, 8);

    const opsCron = opsAgent.sourceBreakdown.find((row) => row.source === "cron");
    expect(opsCron.totalCost).toBeCloseTo(10, 8);

    expect(summary.costByAgent.totals.totalCost).toBeCloseTo(22.5, 8);

    fs.rmSync(rootDir, { recursive: true, force: true });
  });

  it("applies tiered pricing per event, not aggregated totals", () => {
    const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), "usage-db-tiered-event-"));
    const { initUsageDb, getSessionDetail } = loadUsageDb();
    const { path: dbPath } = initUsageDb({ rootDir });
    const database = new DatabaseSync(dbPath);
    const now = Date.now();

    const insertUsageEvent = database.prepare(`
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
    `);

    // Each event stays below the 200k threshold, so both should use 25/M output rate.
    insertUsageEvent.run({
      $timestamp: now - 1000,
      $session_id: "raw-tier-1",
      $session_key: "session-tier-1",
      $run_id: "run-tier-1",
      $provider: "anthropic",
      $model: "claude-opus-4-6",
      $input_tokens: 0,
      $output_tokens: 150_000,
      $cache_read_tokens: 0,
      $cache_write_tokens: 0,
      $total_tokens: 150_000,
    });
    insertUsageEvent.run({
      $timestamp: now,
      $session_id: "raw-tier-1",
      $session_key: "session-tier-1",
      $run_id: "run-tier-2",
      $provider: "anthropic",
      $model: "claude-opus-4-6",
      $input_tokens: 0,
      $output_tokens: 150_000,
      $cache_read_tokens: 0,
      $cache_write_tokens: 0,
      $total_tokens: 150_000,
    });

    const detail = getSessionDetail({ sessionId: "session-tier-1" });

    expect(detail).toBeTruthy();
    expect(detail.totalCost).toBeCloseTo(7.5, 8);

    fs.rmSync(rootDir, { recursive: true, force: true });
  });

  it("aggregates usage by session key pattern", () => {
    const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), "usage-db-pattern-"));
    const { initUsageDb, getSessionUsageByKeyPattern } = loadUsageDb();
    const { path: dbPath } = initUsageDb({ rootDir });
    const database = new DatabaseSync(dbPath);
    const now = Date.now();

    const insertUsageEvent = database.prepare(`
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
    `);

    insertUsageEvent.run({
      $timestamp: now - 1000,
      $session_id: "raw-1",
      $session_key: "agent:main:cron:job-123:run:1",
      $run_id: "run-1",
      $provider: "openai",
      $model: "gpt-4o",
      $input_tokens: 1_000_000,
      $output_tokens: 0,
      $cache_read_tokens: 0,
      $cache_write_tokens: 0,
      $total_tokens: 1_000_000,
    });
    insertUsageEvent.run({
      $timestamp: now,
      $session_id: "raw-2",
      $session_key: "agent:main:cron:job-123:run:2",
      $run_id: "run-2",
      $provider: "openai",
      $model: "gpt-4o",
      $input_tokens: 0,
      $output_tokens: 500_000,
      $cache_read_tokens: 0,
      $cache_write_tokens: 0,
      $total_tokens: 500_000,
    });
    insertUsageEvent.run({
      $timestamp: now,
      $session_id: "raw-3",
      $session_key: "agent:main:cron:job-999:run:1",
      $run_id: "run-x",
      $provider: "openai",
      $model: "gpt-4o",
      $input_tokens: 200_000,
      $output_tokens: 0,
      $cache_read_tokens: 0,
      $cache_write_tokens: 0,
      $total_tokens: 200_000,
    });

    const usage = getSessionUsageByKeyPattern({
      keyPattern: "%:cron:job-123%",
      sinceMs: now - 10_000,
    });

    expect(usage.totals.totalTokens).toBe(1_500_000);
    expect(usage.totals.runCount).toBe(2);
    expect(usage.totals.totalCost).toBeCloseTo(7.5, 8);
    expect(usage.modelBreakdown).toHaveLength(1);
    expect(usage.modelBreakdown[0].model).toBe("gpt-4o");

    fs.rmSync(rootDir, { recursive: true, force: true });
  });
});
