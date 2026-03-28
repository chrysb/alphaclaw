const { createSlackApi } = require("../../lib/server/slack-api");

const kOriginalFetch = global.fetch;

afterEach(() => {
  if (kOriginalFetch == null) {
    delete global.fetch;
  } else {
    global.fetch = kOriginalFetch;
  }
});

describe("server/slack-api", () => {
  it("createSlackApi returns API with all methods", () => {
    const api = createSlackApi(() => "test-token");

    expect(typeof api.authTest).toBe("function");
    expect(typeof api.postMessage).toBe("function");
    expect(typeof api.postMessageInThread).toBe("function");
    expect(typeof api.addReaction).toBe("function");
    expect(typeof api.removeReaction).toBe("function");
    expect(typeof api.uploadFile).toBe("function");
    expect(typeof api.uploadTextSnippet).toBe("function");
    expect(typeof api.updateMessage).toBe("function");
    expect(typeof api.deleteMessage).toBe("function");
    expect(typeof api.pinMessage).toBe("function");
    expect(typeof api.unpinMessage).toBe("function");
    expect(typeof api.getUserInfo).toBe("function");
    expect(typeof api.getChannelInfo).toBe("function");
  });

  it("postMessage requires token", async () => {
    const api = createSlackApi(() => null);

    await expect(api.postMessage("C123", "test")).rejects.toThrow(
      /SLACK_BOT_TOKEN is not set/,
    );
  });

  it("postMessage accepts threading options", async () => {
    let capturedPayload = null;

    global.fetch = async (url, options) => {
      capturedPayload = JSON.parse(options.body);
      return {
        ok: true,
        json: async () => ({ ok: true, ts: "1234.5678", channel: "C123" }),
      };
    };

    const api = createSlackApi(() => "test-token");
    await api.postMessage("C123", "Hello", {
      thread_ts: "1234.5678",
      reply_broadcast: true,
    });

    expect(capturedPayload.channel).toBe("C123");
    expect(capturedPayload.text).toBe("Hello");
    expect(capturedPayload.thread_ts).toBe("1234.5678");
    expect(capturedPayload.reply_broadcast).toBe(true);
    expect(capturedPayload.mrkdwn).toBe(true);
  });

  it("addReaction cleans emoji names", async () => {
    let capturedPayload = null;

    global.fetch = async (url, options) => {
      capturedPayload = JSON.parse(options.body);
      return {
        ok: true,
        json: async () => ({ ok: true }),
      };
    };

    const api = createSlackApi(() => "test-token");

    await api.addReaction("C123", "1234.5678", ":white_check_mark:");
    expect(capturedPayload.name).toBe("white_check_mark");

    await api.addReaction("C123", "1234.5678", "thumbsup");
    expect(capturedPayload.name).toBe("thumbsup");
  });

  it("uploadTextSnippet converts string to buffer", async () => {
    let uploadUrlCalled = false;
    let externalUploadCalled = false;
    let completeUploadCalled = false;

    global.fetch = async (url, options) => {
      if (url.includes("files.getUploadURLExternal")) {
        uploadUrlCalled = true;
        return {
          ok: true,
          json: async () => ({
            ok: true,
            upload_url: "https://files.slack.com/upload/v1/ABC123",
            file_id: "F123ABC",
          }),
        };
      }
      if (url.includes("files.slack.com/upload")) {
        externalUploadCalled = true;
        expect(Buffer.isBuffer(options.body)).toBe(true);
        return { ok: true };
      }
      if (url.includes("files.completeUploadExternal")) {
        completeUploadCalled = true;
        return {
          ok: true,
          json: async () => ({
            ok: true,
            files: [{ id: "F123ABC", title: "Test Code" }],
          }),
        };
      }

      return { ok: true, json: async () => ({ ok: true }) };
    };

    const api = createSlackApi(() => "test-token");

    const result = await api.uploadTextSnippet("C123", "console.log('test');", {
      filename: "test.js",
      title: "Test Code",
    });

    expect(uploadUrlCalled).toBe(true);
    expect(externalUploadCalled).toBe(true);
    expect(completeUploadCalled).toBe(true);

    expect(result.files[0].id).toBe("F123ABC");
  });

  it("handles API errors gracefully", async () => {
    global.fetch = async () => ({
      ok: true,
      json: async () => ({ ok: false, error: "invalid_channel" }),
    });

    const api = createSlackApi(() => "test-token");

    await expect(api.postMessage("INVALID", "test")).rejects.toThrow(/invalid_channel/);
  });

  it("updateMessage calls chat.update without mrkdwn field", async () => {
    let capturedPayload = null;

    global.fetch = async (url, options) => {
      capturedPayload = JSON.parse(options.body);
      return {
        ok: true,
        json: async () => ({
          ok: true,
          channel: "C123",
          ts: "1234.5678",
          text: "Updated text",
        }),
      };
    };

    const api = createSlackApi(() => "test-token");
    await api.updateMessage("C123", "1234.5678", "Updated text");

    expect(capturedPayload.channel).toBe("C123");
    expect(capturedPayload.ts).toBe("1234.5678");
    expect(capturedPayload.text).toBe("Updated text");
    expect(capturedPayload.mrkdwn).toBeUndefined();
  });

  it("deleteMessage calls chat.delete", async () => {
    let capturedPayload = null;

    global.fetch = async (url, options) => {
      capturedPayload = JSON.parse(options.body);
      return {
        ok: true,
        json: async () => ({ ok: true, channel: "C123", ts: "1234.5678" }),
      };
    };

    const api = createSlackApi(() => "test-token");
    await api.deleteMessage("C123", "1234.5678");

    expect(capturedPayload.channel).toBe("C123");
    expect(capturedPayload.ts).toBe("1234.5678");
  });

  it("pinMessage calls pins.add with channel and timestamp", async () => {
    let capturedPayload = null;

    global.fetch = async (url, options) => {
      capturedPayload = JSON.parse(options.body);
      return {
        ok: true,
        json: async () => ({ ok: true }),
      };
    };

    const api = createSlackApi(() => "test-token");
    await api.pinMessage("C123", "1234.5678");

    expect(capturedPayload.channel).toBe("C123");
    expect(capturedPayload.timestamp).toBe("1234.5678");
  });

  it("unpinMessage calls pins.remove with channel and timestamp", async () => {
    let capturedPayload = null;

    global.fetch = async (url, options) => {
      capturedPayload = JSON.parse(options.body);
      return {
        ok: true,
        json: async () => ({ ok: true }),
      };
    };

    const api = createSlackApi(() => "test-token");
    await api.unpinMessage("C123", "1234.5678");

    expect(capturedPayload.channel).toBe("C123");
    expect(capturedPayload.timestamp).toBe("1234.5678");
  });

  it("getUserInfo calls users.info with user ID", async () => {
    let capturedPayload = null;

    global.fetch = async (url, options) => {
      capturedPayload = JSON.parse(options.body);
      return {
        ok: true,
        json: async () => ({
          ok: true,
          user: { id: "U123", name: "testuser" },
        }),
      };
    };

    const api = createSlackApi(() => "test-token");
    const result = await api.getUserInfo("U123");

    expect(capturedPayload.user).toBe("U123");
    expect(result.user.id).toBe("U123");
    expect(result.user.name).toBe("testuser");
  });

  it("getChannelInfo calls conversations.info with channel ID", async () => {
    let capturedPayload = null;

    global.fetch = async (url, options) => {
      capturedPayload = JSON.parse(options.body);
      return {
        ok: true,
        json: async () => ({
          ok: true,
          channel: { id: "C123", name: "general" },
        }),
      };
    };

    const api = createSlackApi(() => "test-token");
    const result = await api.getChannelInfo("C123");

    expect(capturedPayload.channel).toBe("C123");
    expect(result.channel.id).toBe("C123");
    expect(result.channel.name).toBe("general");
  });
});
