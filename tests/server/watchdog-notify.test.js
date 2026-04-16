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

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
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
});
