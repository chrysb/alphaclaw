const test = require("node:test");
const assert = require("node:assert/strict");
const { createSlackApi } = require("../../lib/server/slack-api");

test("slack-api: createSlackApi returns API with all methods", () => {
  const api = createSlackApi(() => "test-token");
  
  assert.ok(typeof api.authTest === "function", "authTest should be a function");
  assert.ok(typeof api.postMessage === "function", "postMessage should be a function");
  assert.ok(typeof api.postMessageInThread === "function", "postMessageInThread should be a function");
  assert.ok(typeof api.addReaction === "function", "addReaction should be a function");
  assert.ok(typeof api.removeReaction === "function", "removeReaction should be a function");
  assert.ok(typeof api.uploadFile === "function", "uploadFile should be a function");
  assert.ok(typeof api.uploadTextSnippet === "function", "uploadTextSnippet should be a function");
});

test("slack-api: postMessage requires token", async () => {
  const api = createSlackApi(() => null);
  
  await assert.rejects(
    async () => await api.postMessage("C123", "test"),
    /SLACK_BOT_TOKEN is not set/,
    "Should throw error when token is missing"
  );
});

test("slack-api: postMessage accepts threading options", async () => {
  let capturedPayload = null;
  
  // Mock fetch
  global.fetch = async (url, options) => {
    capturedPayload = JSON.parse(options.body);
    return {
      ok: true,
      json: async () => ({ ok: true, ts: "1234.5678", channel: "C123" })
    };
  };

  const api = createSlackApi(() => "test-token");
  await api.postMessage("C123", "Hello", {
    thread_ts: "1234.5678",
    reply_broadcast: true
  });

  assert.equal(capturedPayload.channel, "C123");
  assert.equal(capturedPayload.text, "Hello");
  assert.equal(capturedPayload.thread_ts, "1234.5678");
  assert.equal(capturedPayload.reply_broadcast, true);
  assert.equal(capturedPayload.mrkdwn, true);
});

test("slack-api: addReaction cleans emoji names", async () => {
  let capturedPayload = null;
  
  global.fetch = async (url, options) => {
    capturedPayload = JSON.parse(options.body);
    return {
      ok: true,
      json: async () => ({ ok: true })
    };
  };

  const api = createSlackApi(() => "test-token");
  
  // Test with colons
  await api.addReaction("C123", "1234.5678", ":white_check_mark:");
  assert.equal(capturedPayload.name, "white_check_mark", "Should remove colons");
  
  // Test without colons
  await api.addReaction("C123", "1234.5678", "thumbsup");
  assert.equal(capturedPayload.name, "thumbsup", "Should work without colons");
});

test("slack-api: uploadTextSnippet converts string to buffer", async () => {
  let uploadUrlCalled = false;
  let externalUploadCalled = false;
  let completeUploadCalled = false;

  // Mock fetch to handle 3-step upload flow
  global.fetch = async (url, options) => {
    if (url.includes("files.getUploadURLExternal")) {
      uploadUrlCalled = true;
      return {
        ok: true,
        json: async () => ({
          ok: true,
          upload_url: "https://files.slack.com/upload/v1/ABC123",
          file_id: "F123ABC"
        })
      };
    } else if (url.includes("files.slack.com/upload")) {
      // External upload (step 2)
      externalUploadCalled = true;
      assert.ok(Buffer.isBuffer(options.body), "Should upload buffer to external URL");
      return { ok: true };
    } else if (url.includes("files.completeUploadExternal")) {
      completeUploadCalled = true;
      return {
        ok: true,
        json: async () => ({
          ok: true,
          files: [{ id: "F123ABC", title: "Test Code" }]
        })
      };
    }
    
    return { ok: true, json: async () => ({ ok: true }) };
  };

  const api = createSlackApi(() => "test-token");
  
  const result = await api.uploadTextSnippet("C123", "console.log('test');", {
    filename: "test.js",
    title: "Test Code"
  });

  // Verify 3-step flow was executed
  assert.ok(uploadUrlCalled, "Should call getUploadURLExternal");
  assert.ok(externalUploadCalled, "Should upload to external URL");
  assert.ok(completeUploadCalled, "Should call completeUploadExternal");
  
  // Verify result
  assert.equal(result.files[0].id, "F123ABC");
});

test("slack-api: handles API errors gracefully", async () => {
  global.fetch = async () => ({
    ok: true,
    json: async () => ({ ok: false, error: "invalid_channel" })
  });

  const api = createSlackApi(() => "test-token");
  
  await assert.rejects(
    async () => await api.postMessage("INVALID", "test"),
    /invalid_channel/,
    "Should throw error with Slack API error message"
  );
});
