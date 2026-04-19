const fs = require("fs");
const os = require("os");
const path = require("path");

const loadWebhooksDb = () => {
  const modulePath = require.resolve("../../lib/server/db/webhooks");
  delete require.cache[modulePath];
  return require(modulePath);
};

let currentWebhooksDb = null;
let currentRootDir = "";

const createWebhooksDbContext = (prefix) => {
  currentRootDir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  currentWebhooksDb = loadWebhooksDb();
  currentWebhooksDb.initWebhooksDb({ rootDir: currentRootDir });
  return currentWebhooksDb;
};

describe("server/webhooks-db", () => {
  afterEach(() => {
    if (currentWebhooksDb?.closeWebhooksDb) {
      currentWebhooksDb.closeWebhooksDb();
      currentWebhooksDb = null;
    }
    if (currentRootDir) {
      fs.rmSync(currentRootDir, { recursive: true, force: true });
      currentRootDir = "";
    }
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
});
