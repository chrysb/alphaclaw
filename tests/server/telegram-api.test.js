const { createTelegramApi } = require("../../lib/server/telegram-api");

describe("server/telegram-api", () => {
  const originalFetch = global.fetch;
  let fetchMock;

  beforeEach(() => {
    fetchMock = vi.fn(async () => ({
      json: async () => ({ ok: true, result: { id: 1 } }),
    }));
    global.fetch = fetchMock;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  const lastRequest = () => {
    const [url, options] = fetchMock.mock.calls.at(-1);
    return { url, options, body: JSON.parse(options.body) };
  };

  it("throws when no token is configured", async () => {
    const api = createTelegramApi(() => "");
    await expect(api.getMe()).rejects.toThrow("TELEGRAM_BOT_TOKEN is not set");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("accepts a plain string token and posts json to the bot endpoint", async () => {
    fetchMock.mockResolvedValueOnce({
      json: async () => ({ ok: true, result: { id: 42, username: "bot" } }),
    });
    const api = createTelegramApi("token-123");

    const me = await api.getMe();

    expect(me).toEqual({ id: 42, username: "bot" });
    const { url, options, body } = lastRequest();
    expect(url).toBe("https://api.telegram.org/bottoken-123/getMe");
    expect(options.method).toBe("POST");
    expect(options.headers).toEqual({ "Content-Type": "application/json" });
    expect(body).toEqual({});
  });

  it("resolves the token from a getter on every call", async () => {
    let token = "first";
    const api = createTelegramApi(() => token);
    await api.getMe();
    token = "second";
    await api.getMe();
    expect(fetchMock.mock.calls[0][0]).toContain("/botfirst/");
    expect(fetchMock.mock.calls[1][0]).toContain("/botsecond/");
  });

  it("throws a described error with telegram error code on failure", async () => {
    fetchMock.mockResolvedValueOnce({
      json: async () => ({
        ok: false,
        description: "Bad Request: chat not found",
        error_code: 400,
      }),
    });
    const api = createTelegramApi("t");
    const err = await api.getChat("-100").catch((e) => e);
    expect(err.message).toBe("Bad Request: chat not found");
    expect(err.telegramErrorCode).toBe(400);
  });

  it("falls back to a generic error message when description is missing", async () => {
    fetchMock.mockResolvedValueOnce({ json: async () => ({ ok: false }) });
    const api = createTelegramApi("t");
    await expect(api.getMe()).rejects.toThrow("Telegram API error: getMe");
  });

  it("sends chat_id for getChat", async () => {
    const api = createTelegramApi("t");
    await api.getChat("-1001");
    expect(lastRequest().body).toEqual({ chat_id: "-1001" });
  });

  it("sends chat and user ids for getChatMember", async () => {
    const api = createTelegramApi("t");
    await api.getChatMember("-1001", 7);
    expect(lastRequest().url).toContain("/getChatMember");
    expect(lastRequest().body).toEqual({ chat_id: "-1001", user_id: 7 });
  });

  it("sends chat_id for getChatAdministrators", async () => {
    const api = createTelegramApi("t");
    await api.getChatAdministrators("-1001");
    expect(lastRequest().url).toContain("/getChatAdministrators");
    expect(lastRequest().body).toEqual({ chat_id: "-1001" });
  });

  it("creates forum topics with optional icon fields", async () => {
    const api = createTelegramApi("t");

    await api.createForumTopic("-1001", "Topic A");
    expect(lastRequest().body).toEqual({ chat_id: "-1001", name: "Topic A" });

    await api.createForumTopic("-1001", "Topic B", {
      iconColor: 7322096,
      iconCustomEmojiId: "emoji-1",
    });
    expect(lastRequest().body).toEqual({
      chat_id: "-1001",
      name: "Topic B",
      icon_color: 7322096,
      icon_custom_emoji_id: "emoji-1",
    });
  });

  it("deletes forum topics by thread id", async () => {
    const api = createTelegramApi("t");
    await api.deleteForumTopic("-1001", 12);
    expect(lastRequest().url).toContain("/deleteForumTopic");
    expect(lastRequest().body).toEqual({
      chat_id: "-1001",
      message_thread_id: 12,
    });
  });

  it("edits forum topics with optional name and emoji", async () => {
    const api = createTelegramApi("t");

    await api.editForumTopic("-1001", 12);
    expect(lastRequest().body).toEqual({
      chat_id: "-1001",
      message_thread_id: 12,
    });

    await api.editForumTopic("-1001", 12, {
      name: "Renamed",
      iconCustomEmojiId: "emoji-2",
    });
    expect(lastRequest().body).toEqual({
      chat_id: "-1001",
      message_thread_id: 12,
      name: "Renamed",
      icon_custom_emoji_id: "emoji-2",
    });
  });

  it("sends messages with optional parse mode and preview flags", async () => {
    const api = createTelegramApi("t");

    await api.sendMessage("-1001", null);
    expect(lastRequest().body).toEqual({ chat_id: "-1001", text: "" });

    await api.sendMessage("-1001", "hello", {
      parseMode: "Markdown",
      disableWebPagePreview: true,
    });
    expect(lastRequest().body).toEqual({
      chat_id: "-1001",
      text: "hello",
      parse_mode: "Markdown",
      disable_web_page_preview: true,
    });
  });
});
