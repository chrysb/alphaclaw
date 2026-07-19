const path = require("path");

const { createWatchdogNotifier } = require("../../lib/server/watchdog-notify");

const buildCredentialsFsMock = (entries = {}) => {
  const credentialsDir = "/tmp/openclaw/credentials";
  const files = new Map(
    Object.entries(entries).map(([fileName, allowFrom]) => [
      path.join(credentialsDir, fileName),
      JSON.stringify({ allowFrom }),
    ]),
  );

  return {
    existsSync: vi.fn((targetPath) => {
      const normalizedTargetPath = String(targetPath || "");
      return normalizedTargetPath === credentialsDir || files.has(normalizedTargetPath);
    }),
    readdirSync: vi.fn((targetPath) => {
      if (String(targetPath || "") !== credentialsDir) return [];
      return Array.from(files.keys()).map((filePath) => path.basename(filePath));
    }),
    readFileSync: vi.fn((targetPath) => {
      const normalizedTargetPath = String(targetPath || "");
      const value = files.get(normalizedTargetPath);
      if (value === undefined) {
        throw new Error(`Unexpected read: ${normalizedTargetPath}`);
      }
      return value;
    }),
  };
};

const buildSlackApiFactory = () => {
  const clientsByToken = new Map();
  const countersByToken = new Map();
  const createSlackApi = vi.fn((getToken) => {
    const token = typeof getToken === "function" ? getToken() : getToken;
    if (clientsByToken.has(token)) {
      return clientsByToken.get(token);
    }
    const client = {
      postMessage: vi.fn(async (_userId, _text, _opts = {}) => {
        const nextCount = Number(countersByToken.get(token) || 0) + 1;
        countersByToken.set(token, nextCount);
        return {
          ts: `${token}-ts-${nextCount}`,
          channel: `dm-${token}`,
        };
      }),
      addReaction: vi.fn(async () => ({ ok: true })),
    };
    clientsByToken.set(token, client);
    return client;
  });

  return {
    createSlackApi,
    clientsByToken,
  };
};

describe("server/watchdog-notify", () => {
  let consoleErrorSpy = null;
  const kManagedEnvKeys = [
    "TELEGRAM_BOT_TOKEN",
    "DISCORD_BOT_TOKEN",
    "SLACK_BOT_TOKEN",
    "WHATSAPP_OWNER_NUMBER",
  ];
  const kOriginalEnv = new Map(
    kManagedEnvKeys.map((key) => [key, process.env[key]]),
  );

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    for (const key of kManagedEnvKeys) {
      const original = kOriginalEnv.get(key);
      if (original === undefined) delete process.env[key];
      else process.env[key] = original;
    }
  });

  it("sends Slack watchdog notifications across default and named accounts with isolated threads", async () => {
    const fsMock = buildCredentialsFsMock({
      "slack-default-allowFrom.json": ["U_SHARED_THREAD"],
      "slack-alerts-allowFrom.json": ["U_SHARED_THREAD"],
    });
    const { createSlackApi, clientsByToken } = buildSlackApiFactory();
    const notifier = createWatchdogNotifier({
      fsImpl: fsMock,
      openclawDir: "/tmp/openclaw",
      readEnvFile: () => [
        { key: "SLACK_BOT_TOKEN", value: "xoxb-default" },
        { key: "SLACK_BOT_TOKEN_ALERTS", value: "xoxb-alerts" },
      ],
      createSlackApi,
    });

    const crashResult = await notifier.notify("Crash detected", {
      eventType: "crash",
    });
    const recoveryResult = await notifier.notify("Recovered", {
      eventType: "recovery",
    });

    expect(crashResult.channels.slack).toEqual({
      sent: 2,
      failed: 0,
      skipped: false,
      targets: 2,
    });
    expect(recoveryResult.channels.slack).toEqual({
      sent: 2,
      failed: 0,
      skipped: false,
      targets: 2,
    });

    const defaultClient = clientsByToken.get("xoxb-default");
    const alertsClient = clientsByToken.get("xoxb-alerts");
    expect(defaultClient.postMessage.mock.calls[0][2]).toEqual({
      thread_ts: null,
      mrkdwn: true,
    });
    expect(defaultClient.postMessage.mock.calls[1][2]).toEqual({
      thread_ts: "xoxb-default-ts-1",
      mrkdwn: true,
    });
    expect(alertsClient.postMessage.mock.calls[0][2]).toEqual({
      thread_ts: null,
      mrkdwn: true,
    });
    expect(alertsClient.postMessage.mock.calls[1][2]).toEqual({
      thread_ts: "xoxb-alerts-ts-1",
      mrkdwn: true,
    });
  });

  it("reports partial Slack delivery failure when one account is missing a bot token", async () => {
    const fsMock = buildCredentialsFsMock({
      "slack-default-allowFrom.json": ["U_DEFAULT_OK"],
      "slack-alerts-allowFrom.json": ["U_ALERTS_MISSING"],
    });
    const { createSlackApi, clientsByToken } = buildSlackApiFactory();
    const notifier = createWatchdogNotifier({
      fsImpl: fsMock,
      openclawDir: "/tmp/openclaw",
      readEnvFile: () => [{ key: "SLACK_BOT_TOKEN", value: "xoxb-default" }],
      createSlackApi,
    });

    const result = await notifier.notify("Health check", {
      eventType: "health",
    });

    expect(result.channels.slack).toEqual({
      sent: 1,
      failed: 1,
      skipped: false,
      targets: 2,
    });
    expect(createSlackApi).toHaveBeenCalledTimes(1);
    expect(Array.from(clientsByToken.keys())).toEqual(["xoxb-default"]);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "[watchdog] slack notification failed for alerts/U_ALERTS_MISSING: missing SLACK_BOT_TOKEN_ALERTS",
    );
  });

  it("delivers whatsapp watchdog notices via clawCmd message send for owner self chat", async () => {
    const clawCmd = vi.fn(async () => ({ ok: true, stdout: "sent", stderr: "" }));
    const notifier = createWatchdogNotifier({
      clawCmd,
      readEnvFile: () => [
        { key: "WHATSAPP_OWNER_NUMBER", value: "+15551234567" },
      ],
    });

    const result = await notifier.notify("Gateway healthy again");

    expect(result.ok).toBe(true);
    expect(result.sent).toBe(1);
    expect(result.channels.whatsapp).toEqual({
      sent: 1,
      failed: 0,
      skipped: false,
      targets: 1,
    });
    expect(clawCmd).toHaveBeenCalledWith(
      expect.stringContaining("message send --channel whatsapp"),
      expect.objectContaining({ quiet: true, timeoutMs: 30000 }),
    );
    expect(clawCmd).toHaveBeenCalledWith(
      expect.stringContaining(
        '--target "+15551234567" --message "Gateway healthy again"',
      ),
      expect.any(Object),
    );
  });

  it("counts whatsapp watchdog notices as failed when clawCmd returns ok false", async () => {
    const clawCmd = vi.fn(async () => ({
      ok: false,
      stdout: "",
      stderr: "No active WhatsApp Web listener",
      code: 1,
    }));
    const notifier = createWatchdogNotifier({
      clawCmd,
      readEnvFile: () => [
        { key: "WHATSAPP_OWNER_NUMBER", value: "+15551234567" },
      ],
    });

    const result = await notifier.notify("Gateway healthy again");

    expect(result.ok).toBe(false);
    expect(result.sent).toBe(0);
    expect(result.failed).toBe(1);
    expect(result.channels.whatsapp).toEqual({
      sent: 0,
      failed: 1,
      skipped: false,
      targets: 1,
    });
  });

  it("sends telegram notifications to paired chats and counts per-chat failures", async () => {
    process.env.TELEGRAM_BOT_TOKEN = "tg-token";
    const fsMock = buildCredentialsFsMock({
      "telegram-default-allowFrom.json": ["100", null, "  ", "200"],
    });
    const telegramApi = {
      sendMessage: vi.fn(async (chatId) => {
        if (chatId === "200") throw new Error("blocked by user");
        return { ok: true };
      }),
    };
    const notifier = createWatchdogNotifier({
      telegramApi,
      fsImpl: fsMock,
      openclawDir: "/tmp/openclaw",
    });

    const result = await notifier.notify("*Gateway crashed*");

    expect(result.channels.telegram).toEqual({
      sent: 1,
      failed: 1,
      skipped: false,
      targets: 2,
    });
    expect(telegramApi.sendMessage).toHaveBeenCalledWith(
      "100",
      "*Gateway crashed*",
      { parseMode: "Markdown" },
    );
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "[watchdog] telegram notification failed for 200: blocked by user",
    );
  });

  it("sends discord DMs with bold markdown conversion and counts failures", async () => {
    process.env.DISCORD_BOT_TOKEN = "dc-token";
    const fsMock = buildCredentialsFsMock({
      "discord-default-allowFrom.json": ["D1", "D2"],
    });
    const discordApi = {
      sendDirectMessage: vi.fn(async (userId) => {
        if (userId === "D2") throw new Error("cannot DM");
        return { ok: true };
      }),
    };
    const notifier = createWatchdogNotifier({
      discordApi,
      fsImpl: fsMock,
      openclawDir: "/tmp/openclaw",
    });

    const result = await notifier.notify("*Gateway healthy* again");

    expect(result.channels.discord).toEqual({
      sent: 1,
      failed: 1,
      skipped: false,
      targets: 2,
    });
    expect(discordApi.sendDirectMessage).toHaveBeenCalledWith(
      "D1",
      "**Gateway healthy** again",
    );
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "[watchdog] discord notification failed for D2: cannot DM",
    );
  });

  it("reuses the ambient slack client for the default account token", async () => {
    process.env.SLACK_BOT_TOKEN = "xoxb-ambient";
    const fsMock = buildCredentialsFsMock({
      "slack-default-allowFrom.json": ["U_AMBIENT"],
    });
    const slackApi = {
      postMessage: vi.fn(async () => ({ ts: "ambient-ts", channel: "dm-ambient" })),
      addReaction: vi.fn(async () => ({ ok: true })),
    };
    const { createSlackApi } = buildSlackApiFactory();
    const notifier = createWatchdogNotifier({
      slackApi,
      fsImpl: fsMock,
      openclawDir: "/tmp/openclaw",
      readEnvFile: () => [{ key: "SLACK_BOT_TOKEN", value: "xoxb-ambient" }],
      createSlackApi,
    });

    const result = await notifier.notify("Crash detected", { eventType: "crash" });

    expect(result.channels.slack).toEqual({
      sent: 1,
      failed: 0,
      skipped: false,
      targets: 1,
    });
    expect(createSlackApi).not.toHaveBeenCalled();
    expect(slackApi.postMessage).toHaveBeenCalledTimes(1);
    expect(slackApi.addReaction).toHaveBeenCalledWith("dm-ambient", "ambient-ts", "x");
  });

  it("tolerates slack post and reaction failures and accounts without targets", async () => {
    const fsMock = buildCredentialsFsMock({
      "slack-default-allowFrom.json": ["U_OK", "U_POST_FAIL", "U_NO_TS"],
      "slack-empty-allowFrom.json": [],
    });
    const slackClient = {
      postMessage: vi.fn(async (userId) => {
        if (userId === "U_POST_FAIL") throw new Error("channel_not_found");
        if (userId === "U_NO_TS") return {};
        return { ts: `ts-${userId}`, channel: `dm-${userId}` };
      }),
      addReaction: vi.fn(async () => {
        throw new Error("reaction rejected");
      }),
    };
    const createSlackApi = vi.fn(() => slackClient);
    const notifier = createWatchdogNotifier({
      fsImpl: fsMock,
      openclawDir: "/tmp/openclaw",
      readEnvFile: () => [{ key: "SLACK_BOT_TOKEN", value: "xoxb-default" }],
      createSlackApi,
    });

    const result = await notifier.notify("Recovered", { eventType: "recovery" });

    expect(result.channels.slack).toEqual({
      sent: 2,
      failed: 1,
      skipped: false,
      targets: 3,
    });
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "[watchdog] slack notification failed for default/U_POST_FAIL: channel_not_found",
    );
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "[watchdog] slack reaction failed for default/U_OK: reaction rejected",
    );
  });

  it("adds a heart reaction for health notifications", async () => {
    const fsMock = buildCredentialsFsMock({
      "slack-default-allowFrom.json": ["U_HEALTH"],
    });
    const slackClient = {
      postMessage: vi.fn(async () => ({ ts: "ts-h", channel: "dm-h" })),
      addReaction: vi.fn(async () => ({ ok: true })),
    };
    const notifier = createWatchdogNotifier({
      fsImpl: fsMock,
      openclawDir: "/tmp/openclaw",
      readEnvFile: () => [{ key: "SLACK_BOT_TOKEN", value: "xoxb-default" }],
      createSlackApi: () => slackClient,
    });

    await notifier.notify("Health check ok", { eventType: "health" });

    expect(slackClient.addReaction).toHaveBeenCalledWith("dm-h", "ts-h", "heart");
  });

  it("logs credential read failures and reports no delivered channels", async () => {
    const credentialsDir = path.join("/tmp/openclaw", "credentials");
    const fsMock = {
      existsSync: vi.fn((targetPath) => String(targetPath) === credentialsDir),
      readdirSync: vi.fn(() => ["telegram-default-allowFrom.json"]),
      readFileSync: vi.fn(() => {
        throw new Error("EACCES: permission denied");
      }),
    };
    const notifier = createWatchdogNotifier({
      telegramApi: { sendMessage: vi.fn() },
      fsImpl: fsMock,
      openclawDir: "/tmp/openclaw",
    });

    const result = await notifier.notify("hello");

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("could not resolve telegram allowFrom IDs"),
    );
    expect(result).toEqual(
      expect.objectContaining({
        ok: false,
        sent: 0,
        reason: "no_channels_delivered",
      }),
    );
  });

  it("skips every channel when nothing is paired or configured", async () => {
    const fsMock = {
      existsSync: vi.fn(() => false),
      readdirSync: vi.fn(() => []),
      readFileSync: vi.fn(() => {
        throw new Error("unexpected read");
      }),
    };
    const notifier = createWatchdogNotifier({
      fsImpl: fsMock,
      openclawDir: "/tmp/openclaw",
      readEnvFile: null,
    });

    const result = await notifier.notify("hello");

    expect(result).toEqual({
      ok: false,
      sent: 0,
      failed: 0,
      reason: "no_channels_delivered",
      channels: {
        telegram: { sent: 0, failed: 0, skipped: true, targets: 0 },
        discord: { sent: 0, failed: 0, skipped: true, targets: 0 },
        slack: { sent: 0, failed: 0, skipped: true, targets: 0 },
        whatsapp: { sent: 0, failed: 0, skipped: true, targets: 0 },
      },
    });
  });

  it("resolves the whatsapp owner number from process env", async () => {
    process.env.WHATSAPP_OWNER_NUMBER = "+15550001111";
    const fsMock = {
      existsSync: vi.fn(() => false),
      readdirSync: vi.fn(() => []),
      readFileSync: vi.fn(() => {
        throw new Error("unexpected read");
      }),
    };
    const clawCmd = vi.fn(async () => ({ ok: true, stdout: "sent" }));
    const notifier = createWatchdogNotifier({
      clawCmd,
      fsImpl: fsMock,
      openclawDir: "/tmp/openclaw",
    });

    const result = await notifier.notify("Ping");

    expect(result.channels.whatsapp).toEqual({
      sent: 1,
      failed: 0,
      skipped: false,
      targets: 1,
    });
    expect(clawCmd).toHaveBeenCalledWith(
      expect.stringContaining('--target "+15550001111"'),
      expect.any(Object),
    );
  });
});
