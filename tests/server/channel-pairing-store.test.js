const fs = require("fs");
const os = require("os");
const path = require("path");
const { DatabaseSync } = require("node:sqlite");

const {
  readChannelAllowFromByAccount,
  readPendingChannelPairings,
  removePendingChannelPairing,
  removeChannelAccountPairingState,
  clearChannelPairingState,
} = require("../../lib/server/channel-pairing-store");

const createPairingDatabase = () => {
  const openclawDir = fs.mkdtempSync(path.join(os.tmpdir(), "alphaclaw-pairing-db-"));
  const stateDir = path.join(openclawDir, "state");
  fs.mkdirSync(stateDir, { recursive: true });
  const db = new DatabaseSync(path.join(stateDir, "openclaw.sqlite"));
  db.exec(`
    CREATE TABLE channel_pairing_allow_entries (
      channel_key TEXT NOT NULL,
      account_id TEXT NOT NULL,
      entry TEXT NOT NULL,
      sort_order INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      PRIMARY KEY (channel_key, account_id, entry)
    ) STRICT;
    CREATE TABLE channel_pairing_requests (
      channel_key TEXT NOT NULL,
      account_id TEXT NOT NULL,
      request_id TEXT NOT NULL,
      code TEXT NOT NULL,
      created_at TEXT NOT NULL,
      last_seen_at TEXT NOT NULL,
      meta_json TEXT,
      PRIMARY KEY (channel_key, account_id, request_id)
    ) STRICT;
  `);
  return { openclawDir, db };
};

describe("server/channel-pairing-store", () => {
  it("reads approved senders and pending requests from OpenClaw SQLite state", () => {
    const { openclawDir, db } = createPairingDatabase();
    db.prepare(
      "INSERT INTO channel_pairing_allow_entries VALUES (?, ?, ?, ?, ?)",
    ).run("telegram", "default", "1001", 0, Date.now());
    db.prepare(
      "INSERT INTO channel_pairing_allow_entries VALUES (?, ?, ?, ?, ?)",
    ).run("telegram", "alerts", "1002", 0, Date.now());
    const createdAt = new Date().toISOString();
    db.prepare(
      "INSERT INTO channel_pairing_requests VALUES (?, ?, ?, ?, ?, ?, ?)",
    ).run(
      "telegram",
      "alerts",
      "requester-1",
      "ABCD1234",
      createdAt,
      createdAt,
      JSON.stringify({ displayName: "Tester" }),
    );
    db.close();

    expect(readChannelAllowFromByAccount({ openclawDir, channel: "telegram" })).toEqual(
      new Map([
        ["alerts", ["1002"]],
        ["default", ["1001"]],
      ]),
    );
    expect(readPendingChannelPairings({ openclawDir, channel: "telegram" })).toEqual([
      {
        id: "requester-1",
        code: "ABCD1234",
        createdAt,
        lastSeenAt: createdAt,
        meta: { displayName: "Tester", accountId: "alerts" },
      },
    ]);
  });

  it("rejects pending requests and removes account-scoped pairing state", () => {
    const { openclawDir, db } = createPairingDatabase();
    const createdAt = new Date().toISOString();
    db.prepare(
      "INSERT INTO channel_pairing_requests VALUES (?, ?, ?, ?, ?, ?, ?)",
    ).run("slack", "default", "U1", "CODE1234", createdAt, createdAt, null);
    db.prepare(
      "INSERT INTO channel_pairing_allow_entries VALUES (?, ?, ?, ?, ?)",
    ).run("slack", "default", "U1", 0, Date.now());
    db.close();

    expect(
      removePendingChannelPairing({
        openclawDir,
        channel: "slack",
        accountId: "default",
        code: "code1234",
      }),
    ).toBe(true);
    expect(
      removeChannelAccountPairingState({
        openclawDir,
        channel: "slack",
        accountId: "default",
      }),
    ).toBe(true);
    expect(readChannelAllowFromByAccount({ openclawDir, channel: "slack" })).toEqual(
      new Map(),
    );
  });

  it("clears imported channel pairing state", () => {
    const { openclawDir, db } = createPairingDatabase();
    db.prepare(
      "INSERT INTO channel_pairing_allow_entries VALUES (?, ?, ?, ?, ?)",
    ).run("telegram", "default", "1001", 0, Date.now());
    db.close();

    expect(clearChannelPairingState({ openclawDir })).toBe(1);
    expect(readChannelAllowFromByAccount({ openclawDir, channel: "telegram" })).toEqual(
      new Map(),
    );
  });
});
