const fs = require("fs");
const os = require("os");
const path = require("path");
const { DatabaseSync } = require("node:sqlite");

const loadUsageDb = () => {
  const modulePath = require.resolve("../../lib/server/usage-db");
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
    const expectedCost = 2.5 + 75;
    const summedBreakdownCost = detail.modelBreakdown.reduce(
      (sum, row) => sum + Number(row.totalCost || 0),
      0,
    );

    expect(detail).toBeTruthy();
    expect(detail.totalCost).toBeCloseTo(expectedCost, 8);
    expect(detail.totalCost).toBeCloseTo(summedBreakdownCost, 8);

    fs.rmSync(rootDir, { recursive: true, force: true });
  });
});
