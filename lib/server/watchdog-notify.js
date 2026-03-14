const fs = require("fs");
const path = require("path");
const { OPENCLAW_DIR } = require("./constants");

const getPairedIds = (channel) => {
  const safeChannel = String(channel || "").trim().toLowerCase();
  if (!safeChannel) return [];
  const credentialsDir = path.join(OPENCLAW_DIR, "credentials");
  if (!fs.existsSync(credentialsDir)) return [];
  const ids = new Set();
  try {
    const files = fs
      .readdirSync(credentialsDir)
      .filter(
        (fileName) =>
          fileName.startsWith(`${safeChannel}-`) && fileName.endsWith("-allowFrom.json"),
      );
    for (const fileName of files) {
      const filePath = path.join(credentialsDir, fileName);
      const raw = fs.readFileSync(filePath, "utf8");
      const parsed = JSON.parse(raw);
      const allowFrom = Array.isArray(parsed?.allowFrom) ? parsed.allowFrom : [];
      for (const id of allowFrom) {
        if (id == null) continue;
        const value = String(id).trim();
        if (!value) continue;
        ids.add(value);
      }
    }
  } catch (err) {
    console.error(`[watchdog] could not resolve ${safeChannel} allowFrom IDs: ${err.message}`);
  }
  return Array.from(ids);
};

const formatDiscordMessage = (message) =>
  String(message || "").replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, "**$1**");

const createWatchdogNotifier = ({ telegramApi, discordApi, slackApi, clawCmd }) => {
  const notify = async (message) => {
    const summary = {
      telegram: { sent: 0, failed: 0, skipped: false, targets: 0 },
      discord: { sent: 0, failed: 0, skipped: false, targets: 0 },
      slack: { sent: 0, failed: 0, skipped: false, targets: 0 },
      whatsapp: { sent: 0, failed: 0, skipped: false, targets: 0 },
    };
    const telegramTargets = getPairedIds("telegram");
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

    const discordTargets = getPairedIds("discord");
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

    const slackTargets = getPairedIds("slack");
    summary.slack.targets = slackTargets.length;
    if (!slackApi?.postMessage || !process.env.SLACK_BOT_TOKEN || slackTargets.length === 0) {
      summary.slack.skipped = true;
    } else {
      for (const userId of slackTargets) {
        try {
          await slackApi.postMessage(userId, String(message || ""));
          summary.slack.sent += 1;
        } catch (err) {
          summary.slack.failed += 1;
          console.error(`[watchdog] slack notification failed for ${userId}: ${err.message}`);
        }
      }
    }

    const whatsappTargets = getPairedIds("whatsapp");
    summary.whatsapp.targets = whatsappTargets.length;
    if (!clawCmd || !process.env.WHATSAPP_OWNER_NUMBER || whatsappTargets.length === 0) {
      summary.whatsapp.skipped = true;
    } else {
      for (const target of whatsappTargets) {
        try {
          await clawCmd(
            `message --channel whatsapp --target ${String(target || "").trim()} ${JSON.stringify(String(message || ""))}`,
            { quiet: true, timeoutMs: 30000 },
          );
          summary.whatsapp.sent += 1;
        } catch (err) {
          summary.whatsapp.failed += 1;
          console.error(`[watchdog] whatsapp notification failed for ${target}: ${err.message}`);
        }
      }
    }

    const sent = summary.telegram.sent + summary.discord.sent + summary.slack.sent + summary.whatsapp.sent;
    const failed = summary.telegram.failed + summary.discord.failed + summary.slack.failed + summary.whatsapp.failed;
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
