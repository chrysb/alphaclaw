const fs = require("fs");
const path = require("path");
const { OPENCLAW_DIR } = require("./constants");
const { createSlackApi } = require("./slack-api");
const { quoteShellArg } = require("./utils/shell");

const kSlackBotEnvKey = "SLACK_BOT_TOKEN";
const kWhatsAppOwnerNumberEnvKey = "WHATSAPP_OWNER_NUMBER";

const normalizeAccountId = (value) =>
  String(value || "").trim().toLowerCase() || "default";

const resolveCredentialPairingAccountId = ({ channel, fileName }) => {
  const prefix = `${String(channel || "").trim().toLowerCase()}-`;
  const suffix = "-allowFrom.json";
  const rawFileName = String(fileName || "").trim();
  if (!rawFileName.startsWith(prefix) || !rawFileName.endsWith(suffix)) {
    return "";
  }
  return normalizeAccountId(rawFileName.slice(prefix.length, -suffix.length));
};

const deriveSlackBotEnvKey = (accountId = "default") => {
  const normalizedAccountId = normalizeAccountId(accountId);
  if (normalizedAccountId === "default") return kSlackBotEnvKey;
  return `${kSlackBotEnvKey}_${normalizedAccountId.replace(/-/g, "_").toUpperCase()}`;
};

const getPairedTargetsByAccount = ({
  channel,
  fsImpl = fs,
  openclawDir = OPENCLAW_DIR,
}) => {
  const safeChannel = String(channel || "").trim().toLowerCase();
  if (!safeChannel) return new Map();
  const credentialsDir = path.join(openclawDir, "credentials");
  if (!fsImpl.existsSync(credentialsDir)) return new Map();
  const idsByAccount = new Map();
  try {
    const files = fsImpl
      .readdirSync(credentialsDir)
      .filter(
        (fileName) =>
          fileName.startsWith(`${safeChannel}-`) && fileName.endsWith("-allowFrom.json"),
      );
    for (const fileName of files) {
      const accountId = resolveCredentialPairingAccountId({
        channel: safeChannel,
        fileName,
      });
      if (!accountId) continue;
      const filePath = path.join(credentialsDir, fileName);
      const raw = fsImpl.readFileSync(filePath, "utf8");
      const parsed = JSON.parse(raw);
      const allowFrom = Array.isArray(parsed?.allowFrom) ? parsed.allowFrom : [];
      const ids =
        idsByAccount.get(accountId) instanceof Set
          ? idsByAccount.get(accountId)
          : new Set();
      for (const id of allowFrom) {
        if (id == null) continue;
        const value = String(id).trim();
        if (!value) continue;
        ids.add(value);
      }
      idsByAccount.set(accountId, ids);
    }
  } catch (err) {
    console.error(`[watchdog] could not resolve ${safeChannel} allowFrom IDs: ${err.message}`);
  }
  return new Map(
    Array.from(idsByAccount.entries()).map(([accountId, ids]) => [
      accountId,
      Array.from(ids),
    ]),
  );
};

const getPairedIds = ({
  channel,
  fsImpl = fs,
  openclawDir = OPENCLAW_DIR,
}) => {
  const ids = new Set();
  const idsByAccount = getPairedTargetsByAccount({
    channel,
    fsImpl,
    openclawDir,
  });
  for (const accountIds of idsByAccount.values()) {
    for (const id of accountIds) {
      ids.add(id);
    }
  }
  return Array.from(ids);
};

const formatDiscordMessage = (message) =>
  String(message || "").replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, "**$1**");

/**
 * Track thread state for Slack notifications
 * Key: accountId:userId, Value: { threadTs, lastEvent }
 */
const slackThreads = new Map();

const createWatchdogNotifier = ({
  telegramApi,
  discordApi,
  slackApi,
  clawCmd = null,
  readEnvFile = () => [],
  createSlackApi: createSlackApiFactory = createSlackApi,
  fsImpl = fs,
  openclawDir = OPENCLAW_DIR,
}) => {
  const notify = async (message, opts = {}) => {
    const summary = {
      telegram: { sent: 0, failed: 0, skipped: false, targets: 0 },
      discord: { sent: 0, failed: 0, skipped: false, targets: 0 },
      slack: { sent: 0, failed: 0, skipped: false, targets: 0 },
      whatsapp: { sent: 0, failed: 0, skipped: false, targets: 0 },
    };
    const envVars = typeof readEnvFile === "function" ? readEnvFile() : [];
    const envMap = new Map(
      (Array.isArray(envVars) ? envVars : [])
        .map((entry) => [
          String(entry?.key || "").trim(),
          String(entry?.value || "").trim(),
        ])
        .filter(([key]) => key),
    );
    const telegramTargets = getPairedIds({
      channel: "telegram",
      fsImpl,
      openclawDir,
    });
    summary.telegram.targets = telegramTargets.length;
    if (!telegramApi?.sendMessage || !process.env.TELEGRAM_BOT_TOKEN || telegramTargets.length === 0) {
      summary.telegram.skipped = true;
    } else {
      for (const chatId of telegramTargets) {
        try {
          await telegramApi.sendMessage(chatId, String(message || ""), {
            parseMode: "Markdown",
          });
          summary.telegram.sent += 1;
        } catch (err) {
          summary.telegram.failed += 1;
          console.error(`[watchdog] telegram notification failed for ${chatId}: ${err.message}`);
        }
      }
    }

    const discordTargets = getPairedIds({
      channel: "discord",
      fsImpl,
      openclawDir,
    });
    summary.discord.targets = discordTargets.length;
    if (!discordApi?.sendDirectMessage || !process.env.DISCORD_BOT_TOKEN || discordTargets.length === 0) {
      summary.discord.skipped = true;
    } else {
      const discordMessage = formatDiscordMessage(message);
      for (const userId of discordTargets) {
        try {
          await discordApi.sendDirectMessage(userId, discordMessage);
          summary.discord.sent += 1;
        } catch (err) {
          summary.discord.failed += 1;
          console.error(`[watchdog] discord notification failed for ${userId}: ${err.message}`);
        }
      }
    }

    // Enhanced Slack notifications with threading and reactions
    const slackTargetsByAccount = getPairedTargetsByAccount({
      channel: "slack",
      fsImpl,
      openclawDir,
    });
    summary.slack.targets = Array.from(slackTargetsByAccount.values()).reduce(
      (total, targets) => total + targets.length,
      0,
    );
    if (summary.slack.targets === 0) {
      summary.slack.skipped = true;
    } else {
      const eventType = opts.eventType || "info"; // crash, recovery, health, info
      for (const [accountId, slackTargets] of slackTargetsByAccount.entries()) {
        if (!slackTargets.length) continue;
        const envKey = deriveSlackBotEnvKey(accountId);
        const botToken = String(envMap.get(envKey) || process.env[envKey] || "").trim();
        if (!botToken) {
          summary.slack.failed += slackTargets.length;
          for (const userId of slackTargets) {
            console.error(
              `[watchdog] slack notification failed for ${accountId}/${userId}: missing ${envKey}`,
            );
          }
          continue;
        }

        const accountSlackApi =
          accountId === "default" &&
          slackApi?.postMessage &&
          botToken === String(process.env.SLACK_BOT_TOKEN || "").trim()
            ? slackApi
            : createSlackApiFactory(() => botToken);

        for (const userId of slackTargets) {
          try {
            let threadTs = null;
            let shouldCreateNewThread = true;
            const threadKey = `${accountId}:${userId}`;

            const existingThread = slackThreads.get(threadKey);
            if (existingThread && existingThread.lastEvent === "crash" && eventType === "recovery") {
              threadTs = existingThread.threadTs;
              shouldCreateNewThread = false;
            }

            const result = await accountSlackApi.postMessage(userId, String(message || ""), {
              thread_ts: threadTs,
              mrkdwn: true,
            });

            if (shouldCreateNewThread && result.ts) {
              slackThreads.set(threadKey, {
                threadTs: result.ts,
                lastEvent: eventType,
              });
            }

            if (result.ts && result.channel && accountSlackApi.addReaction) {
              try {
                if (eventType === "crash") {
                  await accountSlackApi.addReaction(result.channel, result.ts, "x");
                } else if (eventType === "recovery") {
                  await accountSlackApi.addReaction(
                    result.channel,
                    result.ts,
                    "white_check_mark",
                  );
                } else if (eventType === "health") {
                  await accountSlackApi.addReaction(result.channel, result.ts, "heart");
                }
              } catch (reactionErr) {
                console.error(
                  `[watchdog] slack reaction failed for ${accountId}/${userId}: ${reactionErr.message}`,
                );
              }
            }

            summary.slack.sent += 1;
          } catch (err) {
            summary.slack.failed += 1;
            console.error(
              `[watchdog] slack notification failed for ${accountId}/${userId}: ${err.message}`,
            );
          }
        }
      }
    }

    const whatsAppOwnerNumber = String(
      envMap.get(kWhatsAppOwnerNumberEnvKey) ||
        process.env[kWhatsAppOwnerNumberEnvKey] ||
        "",
    ).trim();
    const whatsappTargets = whatsAppOwnerNumber ? [whatsAppOwnerNumber] : [];
    summary.whatsapp.targets = whatsappTargets.length;
    if (!clawCmd || whatsappTargets.length === 0) {
      summary.whatsapp.skipped = true;
    } else {
      for (const target of whatsappTargets) {
        try {
          const result = await clawCmd(
            `message send --channel whatsapp --target ${quoteShellArg(
              String(target || "").trim(),
            )} --message ${quoteShellArg(String(message || ""))}`,
            { quiet: true, timeoutMs: 30000 },
          );
          if (!result?.ok) {
            throw new Error(
              String(result?.stderr || result?.stdout || "WhatsApp send failed"),
            );
          }
          summary.whatsapp.sent += 1;
        } catch (err) {
          summary.whatsapp.failed += 1;
          console.error(`[watchdog] whatsapp notification failed for ${target}: ${err.message}`);
        }
      }
    }

    const sent =
      summary.telegram.sent +
      summary.discord.sent +
      summary.slack.sent +
      summary.whatsapp.sent;
    const failed =
      summary.telegram.failed +
      summary.discord.failed +
      summary.slack.failed +
      summary.whatsapp.failed;
    return {
      ok: sent > 0,
      sent,
      failed,
      channels: summary,
      ...(sent === 0 ? { reason: "no_channels_delivered" } : {}),
    };
  };

  return { notify };
};

module.exports = { createWatchdogNotifier };
