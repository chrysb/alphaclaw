const fs = require("fs");
const os = require("os");
const path = require("path");
const { DatabaseSync } = require("node:sqlite");

const loadWatchdogDb = () => {
  const modulePath = require.resolve("../../lib/server/db/watchdog");
  delete require.cache[modulePath];
  return require(modulePath);
};

const sleep = async (ms) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

describe("server/watchdog-db", () => {
  it("initializes watchdog.db under root db directory", () => {
    const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), "watchdog-db-init-"));
    const { initWatchdogDb } = loadWatchdogDb();

    const result = initWatchdogDb({ rootDir, pruneDays: 30 });

    expect(result.path).toBe(path.join(rootDir, "db", "watchdog.db"));
    expect(fs.existsSync(result.path)).toBe(true);
  });

  it("returns filtered events up to limit when routine checks are excluded", async () => {
    const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), "watchdog-db-filter-"));
    const { initWatchdogDb, insertWatchdogEvent, getRecentEvents } = loadWatchdogDb();
    initWatchdogDb({ rootDir, pruneDays: 30 });

    insertWatchdogEvent({
      eventType: "crash",
      source: "exit_event",
      status: "failed",
      details: { code: 1 },
    });
    await sleep(2);
    insertWatchdogEvent({
      eventType: "repair",
      source: "crash_loop",
      status: "ok",
      details: { started: true },
    });
    await sleep(2);
    insertWatchdogEvent({
      eventType: "health_check",
      source: "health_timer",
      status: "ok",
      details: { skipped: false },
    });
    await sleep(2);
    insertWatchdogEvent({
      eventType: "health_check",
      source: "health_timer",
      status: "ok",
      details: { skipped: false },
    });

    const filtered = getRecentEvents({ limit: 2, includeRoutine: false });
    const unfiltered = getRecentEvents({ limit: 2, includeRoutine: true });

    expect(filtered).toHaveLength(2);
    expect(filtered.every((event) => !(event.eventType === "health_check" && event.status === "ok")))
      .toBe(true);
    expect(unfiltered).toHaveLength(2);
    expect(
      unfiltered.every((event) => event.eventType === "health_check" && event.status === "ok"),
    ).toBe(true);
  });

  it("prunes old events based on retention days", () => {
    const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), "watchdog-db-prune-"));
    const { initWatchdogDb, pruneWatchdogEvents } = loadWatchdogDb();
    const { path: dbPath } = initWatchdogDb({ rootDir, pruneDays: 365 });

    const database = new DatabaseSync(dbPath);
    database
      .prepare(`
        INSERT INTO watchdog_events (
          event_type,
          source,
          status,
          details,
          correlation_id,
          created_at
        ) VALUES (
          $event_type,
          $source,
          $status,
          $details,
          $correlation_id,
          $created_at
        )
      `)
      .run({
        $event_type: "crash",
        $source: "exit_event",
        $status: "failed",
        $details: "{}",
        $correlation_id: "",
        $created_at: "2000-01-01T00:00:00.000Z",
      });
    database
      .prepare(`
        INSERT INTO watchdog_events (
          event_type,
          source,
          status,
          details,
          correlation_id,
          created_at
        ) VALUES (
          $event_type,
          $source,
          $status,
          $details,
          $correlation_id,
          $created_at
        )
      `)
      .run({
        $event_type: "health_check",
        $source: "health_timer",
        $status: "ok",
        $details: "{}",
        $correlation_id: "",
        $created_at: "2100-01-01T00:00:00.000Z",
      });

    const removed = pruneWatchdogEvents(30);
    const remaining = database
      .prepare("SELECT COUNT(*) AS count FROM watchdog_events")
      .get().count;

    expect(removed).toBe(1);
    expect(remaining).toBe(1);
  });
});
