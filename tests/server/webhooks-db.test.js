const fs = require("fs");
const os = require("os");
const path = require("path");

const loadWebhooksDb = () => {
  const modulePath = require.resolve("../../lib/server/db/webhooks");
  delete require.cache[modulePath];
  return require(modulePath);
};

describe("server/webhooks-db", () => {
  it("creates, rotates, marks usage, and deletes oauth callbacks", () => {
    const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), "webhooks-db-oauth-"));
    const {
      initWebhooksDb,
      createOauthCallback,
      getOauthCallbackByHook,
      getOauthCallbackById,
      rotateOauthCallback,
      markOauthCallbackUsed,
      deleteOauthCallback,
    } = loadWebhooksDb();

    initWebhooksDb({ rootDir });

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

    fs.rmSync(rootDir, { recursive: true, force: true });
  });
});
