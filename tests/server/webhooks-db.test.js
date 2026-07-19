const fs = require("fs");
const os = require("os");
const path = require("path");
const { DatabaseSync } = require("node:sqlite");

const loadWebhooksDb = () => {
  const modulePath = require.resolve("../../lib/server/db/webhooks");
  delete require.cache[modulePath];
  return require(modulePath);
};

let currentWebhooksDb = null;
let currentRootDir = "";
let currentDbPath = "";

const createWebhooksDbContext = (prefix, options = {}) => {
  currentRootDir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  currentWebhooksDb = loadWebhooksDb();
  const { path: dbPath } = currentWebhooksDb.initWebhooksDb({
    rootDir: currentRootDir,
    ...options,
  });
  currentDbPath = dbPath;
  return currentWebhooksDb;
};

describe("server/webhooks-db", () => {
  afterEach(() => {
    vi.useRealTimers();
    if (currentWebhooksDb?.closeWebhooksDb) {
      currentWebhooksDb.closeWebhooksDb();
      currentWebhooksDb = null;
    }
    if (currentRootDir) {
      fs.rmSync(currentRootDir, { recursive: true, force: true });
      currentRootDir = "";
    }
    currentDbPath = "";
  });

  it("creates, rotates, marks usage, and deletes oauth callbacks", () => {
    const {
      createOauthCallback,
      getOauthCallbackByHook,
      getOauthCallbackById,
      rotateOauthCallback,
      markOauthCallbackUsed,
      deleteOauthCallback,
    } = createWebhooksDbContext("webhooks-db-oauth-");

    const created = createOauthCallback({ hookName: "schwab-oauth" });
    expect(created).toBeTruthy();
    expect(created.hookName).toBe("schwab-oauth");
    expect(String(created.callbackId || "")).toHaveLength(32);

    const byHook = getOauthCallbackByHook("schwab-oauth");
    expect(byHook?.callbackId).toBe(created.callbackId);

    const byId = getOauthCallbackById(created.callbackId);
    expect(byId?.hookName).toBe("schwab-oauth");

    const rotated = rotateOauthCallback("schwab-oauth");
    expect(rotated).toBeTruthy();
    expect(rotated.callbackId).not.toBe(created.callbackId);
    expect(rotated.rotatedAt).toBeTruthy();
    expect(getOauthCallbackById(created.callbackId)).toBeNull();

    const markedRows = markOauthCallbackUsed(rotated.callbackId);
    expect(markedRows).toBe(1);
    const afterMarked = getOauthCallbackByHook("schwab-oauth");
    expect(afterMarked?.lastUsedAt).toBeTruthy();

    const deletedRows = deleteOauthCallback("schwab-oauth");
    expect(deletedRows).toBe(1);
    expect(getOauthCallbackByHook("schwab-oauth")).toBeNull();
  });

  it("tracks recent health counts separately from all-time totals", () => {
    const {
      insertRequest,
      getHookSummaries,
    } = createWebhooksDbContext("webhooks-db-health-");

    for (let index = 0; index < 30; index += 1) {
      insertRequest({
        hookName: "recent-health",
        method: "POST",
        headers: {},
        payload: `{"index":${index}}`,
        payloadTruncated: false,
        payloadSize: 12,
        sourceIp: "127.0.0.1",
        gatewayStatus: index < 5 ? 500 : 200,
        gatewayBody: "",
      });
    }

    const summary = getHookSummaries().find(
      (item) => item.hookName === "recent-health",
    );

    expect(summary).toBeTruthy();
    expect(summary.totalCount).toBe(30);
    expect(summary.errorCount).toBe(5);
    expect(summary.recentTotalCount).toBe(25);
    expect(summary.recentSuccessCount).toBe(25);
    expect(summary.recentErrorCount).toBe(0);
    expect(summary.healthWindowSize).toBe(25);
  });

  it("throws when used before initialization", () => {
    currentWebhooksDb = loadWebhooksDb();
    expect(() => currentWebhooksDb.getHookSummaries()).toThrow(
      /Webhooks DB not initialized/,
    );
    expect(() =>
      currentWebhooksDb.insertRequest({ hookName: "x" }),
    ).toThrow(/Webhooks DB not initialized/);
  });

  it("lists requests with status filters, paging, and model mapping", () => {
    const { insertRequest, getRequests, getRequestById } =
      createWebhooksDbContext("webhooks-db-requests-");

    const insertedIds = [];
    const rowsToInsert = [
      { gatewayStatus: 200 },
      { gatewayStatus: 204 },
      { gatewayStatus: 500 },
      { gatewayStatus: "not-a-number" },
    ];
    for (const [index, row] of rowsToInsert.entries()) {
      insertedIds.push(
        insertRequest({
          hookName: "filter-hook",
          method: "POST",
          headers: { "x-index": String(index) },
          payload: `{"index":${index}}`,
          payloadTruncated: index === 0,
          payloadSize: 12,
          sourceIp: "10.0.0.1",
          gatewayStatus: row.gatewayStatus,
          gatewayBody: `body-${index}`,
        }),
      );
    }
    expect(insertedIds.every((id) => id > 0)).toBe(true);

    const all = getRequests("filter-hook");
    expect(all).toHaveLength(4);
    const successRows = getRequests("filter-hook", { status: "success" });
    expect(successRows).toHaveLength(2);
    expect(successRows.every((row) => row.status === "success")).toBe(true);
    const errorRows = getRequests("filter-hook", { status: "error" });
    expect(errorRows).toHaveLength(2);
    expect(errorRows.some((row) => row.gatewayStatus === null)).toBe(true);
    const paged = getRequests("filter-hook", { limit: 2, offset: 1 });
    expect(paged).toHaveLength(2);
    expect(getRequests("filter-hook", { limit: 100000 })).toHaveLength(4);

    const byId = getRequestById("filter-hook", insertedIds[0]);
    expect(byId).toBeTruthy();
    expect(byId.headers).toEqual({ "x-index": "0" });
    expect(byId.payloadTruncated).toBe(true);
    expect(byId.method).toBe("POST");
    expect(byId.sourceIp).toBe("10.0.0.1");
    expect(getRequestById("filter-hook", 999999)).toBeNull();
    expect(getRequestById("filter-hook", "junk")).toBeNull();
  });

  it("falls back to empty headers for malformed stored header JSON", () => {
    const { getRequests } = createWebhooksDbContext("webhooks-db-bad-headers-");
    const database = new DatabaseSync(currentDbPath);
    try {
      database.exec(`
        INSERT INTO webhook_requests (hook_name, headers, payload, gateway_status)
        VALUES ('bad-headers', 'not json', '', 200);
      `);
      database.exec(`
        INSERT INTO webhook_requests (hook_name, headers, payload, gateway_status)
        VALUES ('bad-headers', NULL, NULL, 200);
      `);
    } finally {
      database.close();
    }

    const rows = getRequests("bad-headers");
    expect(rows).toHaveLength(2);
    expect(rows[0].headers).toEqual({});
    expect(rows[1].headers).toEqual({});
    expect(rows.every((row) => row.payload === "")).toBe(true);
  });

  it("deletes all requests for a hook", () => {
    const { insertRequest, deleteRequestsByHook, getRequests } =
      createWebhooksDbContext("webhooks-db-delete-");
    insertRequest({ hookName: "doomed", gatewayStatus: 200 });
    insertRequest({ hookName: "doomed", gatewayStatus: 200 });
    insertRequest({ hookName: "kept", gatewayStatus: 200 });

    expect(deleteRequestsByHook("doomed")).toBe(2);
    expect(getRequests("doomed")).toHaveLength(0);
    expect(getRequests("kept")).toHaveLength(1);
    expect(deleteRequestsByHook("")).toBe(0);
  });

  it("validates oauth callback inputs", () => {
    const {
      createOauthCallback,
      getOauthCallbackByHook,
      getOauthCallbackById,
      rotateOauthCallback,
      deleteOauthCallback,
      markOauthCallbackUsed,
    } = createWebhooksDbContext("webhooks-db-oauth-validate-");

    expect(() => createOauthCallback({ hookName: "  " })).toThrow(
      /hookName is required/,
    );
    expect(getOauthCallbackByHook("  ")).toBeNull();
    expect(getOauthCallbackById("  ")).toBeNull();
    expect(() => rotateOauthCallback("")).toThrow(/hookName is required/);
    expect(() => rotateOauthCallback("missing-hook")).toThrow(
      /OAuth callback not found/,
    );
    expect(deleteOauthCallback("")).toBe(0);
    expect(markOauthCallbackUsed("")).toBe(0);
  });

  it("prunes old requests immediately and on the recurring timer", () => {
    vi.useFakeTimers();
    const { pruneOldEntries, getRequests } = createWebhooksDbContext(
      "webhooks-db-prune-",
    );
    const database = new DatabaseSync(currentDbPath);
    try {
      database.exec(`
        INSERT INTO webhook_requests (hook_name, payload, gateway_status, created_at)
        VALUES ('prune-hook', '', 200, '2020-01-01T00:00:00.000Z');
      `);
    } finally {
      database.close();
    }
    expect(getRequests("prune-hook")).toHaveLength(1);

    expect(pruneOldEntries("junk")).toBe(1);
    expect(getRequests("prune-hook")).toHaveLength(0);

    // The recurring prune timer runs without error on a healthy database.
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.advanceTimersByTime(12 * 60 * 60 * 1000);
    expect(errorSpy).not.toHaveBeenCalled();

    // Breaking the schema behind the timer's back surfaces the prune error log.
    const saboteur = new DatabaseSync(currentDbPath);
    try {
      saboteur.exec("DROP TABLE webhook_requests;");
    } finally {
      saboteur.close();
    }
    vi.advanceTimersByTime(12 * 60 * 60 * 1000);
    expect(errorSpy).toHaveBeenCalledWith(
      "[webhooks-db] prune error:",
      expect.any(String),
    );
  });
});
