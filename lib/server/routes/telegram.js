const fs = require("fs");
const { OPENCLAW_DIR } = require("../constants");
const { isDebugEnabled } = require("../helpers");
const topicRegistry = require("../topic-registry");
const { syncConfigForTelegram } = require("../telegram-workspace");

const parseBooleanValue = (value, fallbackValue = false) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes", "on"].includes(normalized)) return true;
    if (["false", "0", "no", "off", ""].includes(normalized)) return false;
  }
  return fallbackValue;
};
const resolveGroupId = (req) => {
  const body = req.body || {};
  const rawGroupId = body.groupId ?? body.chatId;
  return rawGroupId == null ? "" : String(rawGroupId).trim();
};
const resolveAllowUserId = async ({
  telegramApi,
  groupId,
  preferredUserId,
}) => {
  const normalizedPreferred = String(preferredUserId || "").trim();
  if (normalizedPreferred) return normalizedPreferred;
  const admins = await telegramApi.getChatAdministrators(groupId);
  const humanAdmins = admins.filter((entry) => !entry?.user?.is_bot);
  if (humanAdmins.length === 0) return "";
  const creator = humanAdmins.find((entry) => entry.status === "creator");
  const targetAdmin = creator || humanAdmins[0];
  return String(targetAdmin?.user?.id || "").trim();
};
const isMissingTopicError = (errorMessage) => {
  const message = String(errorMessage || "").toLowerCase();
  return [
    "topic_id_invalid",
    "message_thread_id_invalid",
    "message_thread_not_found",
    "topic_not_found",
    "message thread not found",
    "topic not found",
    "invalid thread id",
    "invalid topic id",
  ].some((token) => message.includes(token));
};

const normalizeGitSyncMessagePart = (value) =>
  String(value || "")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const quoteShellArg = (value) => `'${String(value || "").replace(/'/g, `'\"'\"'`)}'`;

const buildTelegramGitSyncCommand = (action, target = "") => {
  const safeAction = normalizeGitSyncMessagePart(action);
  const safeTarget = normalizeGitSyncMessagePart(target);
  const message = `telegram workspace: ${safeAction} ${safeTarget}`.trim();
  return `alphaclaw git-sync -m ${quoteShellArg(message)}`;
};

const registerTelegramRoutes = ({
  app,
  telegramApi,
  syncPromptFiles,
  shellCmd,
}) => {
  const repairGroupAllowFromIfMissing = async ({
    cfg,
    groupId,
    requireMention = false,
  }) => {
    const telegramConfig = cfg?.channels?.telegram || {};
    if (
      Array.isArray(telegramConfig.groupAllowFrom) &&
      telegramConfig.groupAllowFrom.length > 0
    ) {
      return { repaired: false, resolvedUserId: "", syncWarning: null };
    }
    const resolvedUserId = await resolveAllowUserId({
      telegramApi,
      groupId,
      preferredUserId: "",
    });
    syncConfigForTelegram({
      fs,
      openclawDir: OPENCLAW_DIR,
      topicRegistry,
      groupId,
      requireMention,
      resolvedUserId,
    });
    const syncWarning = await runTelegramGitSync(
      "repair-group-allow-from",
      groupId,
    );
    return { repaired: true, resolvedUserId, syncWarning };
  };

  const runTelegramGitSync = async (action, target = "") => {
    if (typeof shellCmd !== "function") return null;
    try {
      await shellCmd(buildTelegramGitSyncCommand(action, target), {
        timeout: 30000,
      });
      return null;
    } catch (err) {
      return err?.message || "alphaclaw git-sync failed";
    }
  };

  // Verify bot token
  app.get("/api/telegram/bot", async (req, res) => {
    try {
      const me = await telegramApi.getMe();
      res.json({ ok: true, bot: me });
    } catch (e) {
      res.json({ ok: false, error: e.message });
    }
  });

  // Verify group: checks bot membership, admin rights, topics enabled
  app.post("/api/telegram/groups/verify", async (req, res) => {
    const groupId = resolveGroupId(req);
    if (!groupId)
      return res.status(400).json({ ok: false, error: "groupId is required" });

    try {
      const chat = await telegramApi.getChat(groupId);
      const me = await telegramApi.getMe();
      const member = await telegramApi.getChatMember(groupId, me.id);
      const suggestedUserId = await resolveAllowUserId({
        telegramApi,
        groupId,
        preferredUserId: "",
      });

      const isAdmin =
        member.status === "administrator" || member.status === "creator";
      const isForum = !!chat.is_forum;

      res.json({
        ok: true,
        chat: {
          id: chat.id,
          title: chat.title,
          type: chat.type,
          isForum,
        },
        bot: {
          status: member.status,
          isAdmin,
          canManageTopics: isAdmin && member.can_manage_topics !== false,
        },
        suggestedUserId: suggestedUserId || null,
      });
    } catch (e) {
      res.json({ ok: false, error: e.message });
    }
  });

  // List topics from registry
  app.get("/api/telegram/groups/:groupId/topics", (req, res) => {
    const group = topicRegistry.getGroup(req.params.groupId);
    res.json({ ok: true, topics: group?.topics || {} });
  });

  // Create a topic via Telegram API + add to registry
  app.post("/api/telegram/groups/:groupId/topics", async (req, res) => {
    const { groupId } = req.params;
    const body = req.body || {};
    const name = String(body.name ?? "").trim();
    const rawIconColor = body.iconColor;
    const systemInstructions = String(
      body.systemInstructions ?? body.systemPrompt ?? "",
    ).trim();
    const iconColorValue =
      rawIconColor == null ? null : Number.parseInt(String(rawIconColor), 10);
    const iconColor = Number.isFinite(iconColorValue)
      ? iconColorValue
      : undefined;
    if (!name)
      return res.status(400).json({ ok: false, error: "name is required" });

    try {
      const result = await telegramApi.createForumTopic(groupId, name, {
        iconColor,
      });
      const threadId = result.message_thread_id;
      topicRegistry.addTopic(groupId, threadId, {
        name: result.name,
        iconColor: result.icon_color,
        ...(systemInstructions ? { systemInstructions } : {}),
      });
      syncConfigForTelegram({
        fs,
        openclawDir: OPENCLAW_DIR,
        topicRegistry,
        groupId,
        requireMention: false,
        resolvedUserId: "",
      });
      syncPromptFiles();
      const syncWarning = await runTelegramGitSync("create-topic", result.name);
      res.json({
        ok: true,
        topic: {
          threadId,
          name: result.name,
          iconColor: result.icon_color,
        },
        syncWarning,
      });
    } catch (e) {
      res.json({ ok: false, error: e.message });
    }
  });

  // Bulk-create topics
  app.post("/api/telegram/groups/:groupId/topics/bulk", async (req, res) => {
    const { groupId } = req.params;
    const body = req.body || {};
    const topics = Array.isArray(body.topics) ? body.topics : [];
    if (!Array.isArray(topics) || topics.length === 0) {
      return res
        .status(400)
        .json({ ok: false, error: "topics array is required" });
    }

    const results = [];
    for (const t of topics) {
      if (!t.name) {
        results.push({ name: t.name, ok: false, error: "name is required" });
        continue;
      }
      try {
        const result = await telegramApi.createForumTopic(groupId, t.name, {
          iconColor: t.iconColor || undefined,
        });
        const threadId = result.message_thread_id;
        const systemInstructions = String(
          t.systemInstructions ?? t.systemPrompt ?? "",
        ).trim();
        topicRegistry.addTopic(groupId, threadId, {
          name: result.name,
          iconColor: result.icon_color,
          ...(systemInstructions ? { systemInstructions } : {}),
        });
        results.push({ name: result.name, threadId, ok: true });
      } catch (e) {
        results.push({ name: t.name, ok: false, error: e.message });
      }
    }
    syncConfigForTelegram({
      fs,
      openclawDir: OPENCLAW_DIR,
      topicRegistry,
      groupId,
      requireMention: false,
      resolvedUserId: "",
    });
    syncPromptFiles();
    const syncWarning = await runTelegramGitSync("bulk-create-topics", groupId);
    res.json({ ok: true, results, syncWarning });
  });

  // Delete a topic
  app.delete(
    "/api/telegram/groups/:groupId/topics/:topicId",
    async (req, res) => {
      const { groupId, topicId } = req.params;
      try {
        await telegramApi.deleteForumTopic(groupId, parseInt(topicId, 10));
        topicRegistry.removeTopic(groupId, topicId);
        syncConfigForTelegram({
          fs,
          openclawDir: OPENCLAW_DIR,
          topicRegistry,
          groupId,
          requireMention: false,
          resolvedUserId: "",
        });
        syncPromptFiles();
        const syncWarning = await runTelegramGitSync("delete-topic", topicId);
        res.json({ ok: true, syncWarning });
      } catch (e) {
        if (!isMissingTopicError(e?.message)) {
          return res.json({ ok: false, error: e.message });
        }
        topicRegistry.removeTopic(groupId, topicId);
        syncConfigForTelegram({
          fs,
          openclawDir: OPENCLAW_DIR,
          topicRegistry,
          groupId,
          requireMention: false,
          resolvedUserId: "",
        });
        syncPromptFiles();
        const syncWarning = await runTelegramGitSync(
          "delete-stale-topic",
          topicId,
        );
        return res.json({
          ok: true,
          removedFromRegistryOnly: true,
          warning:
            "Topic no longer exists in Telegram; removed stale registry entry.",
          syncWarning,
        });
      }
    },
  );

  // Rename a topic
  app.put("/api/telegram/groups/:groupId/topics/:topicId", async (req, res) => {
    const { groupId, topicId } = req.params;
    const body = req.body || {};
    const name = String(body.name ?? "").trim();
    const hasSystemInstructions =
      Object.prototype.hasOwnProperty.call(body, "systemInstructions") ||
      Object.prototype.hasOwnProperty.call(body, "systemPrompt");
    const systemInstructions = String(
      body.systemInstructions ?? body.systemPrompt ?? "",
    ).trim();
    if (!name)
      return res.status(400).json({ ok: false, error: "name is required" });
    try {
      const threadId = Number.parseInt(String(topicId), 10);
      if (!Number.isFinite(threadId)) {
        return res
          .status(400)
          .json({ ok: false, error: "topicId must be numeric" });
      }
      const existingTopic =
        topicRegistry.getGroup(groupId)?.topics?.[String(threadId)] || {};
      const existingName = String(existingTopic.name || "").trim();
      const shouldRename = !existingName || existingName !== name;
      if (shouldRename) {
        try {
          await telegramApi.editForumTopic(groupId, threadId, { name });
        } catch (e) {
          // Telegram returns TOPIC_NOT_MODIFIED when the name is unchanged.
          if (!String(e.message || "").includes("TOPIC_NOT_MODIFIED")) {
            throw e;
          }
        }
      }
      topicRegistry.updateTopic(groupId, threadId, {
        ...existingTopic,
        name,
        ...(hasSystemInstructions ? { systemInstructions } : {}),
      });
      syncConfigForTelegram({
        fs,
        openclawDir: OPENCLAW_DIR,
        topicRegistry,
        groupId,
        requireMention: false,
        resolvedUserId: "",
      });
      syncPromptFiles();
      const syncWarning = await runTelegramGitSync("rename-topic", name);
      return res.json({
        ok: true,
        topic: {
          threadId,
          name,
          ...(hasSystemInstructions ? { systemInstructions } : {}),
        },
        syncWarning,
      });
    } catch (e) {
      return res.json({ ok: false, error: e.message });
    }
  });

  // Configure openclaw.json for a group
  app.post("/api/telegram/groups/:groupId/configure", async (req, res) => {
    const { groupId } = req.params;
    const body = req.body || {};
    const userId = body.userId ?? "";
    const groupName = body.groupName ?? "";
    const requireMention = parseBooleanValue(body.requireMention, false);
    try {
      const resolvedUserId = await resolveAllowUserId({
        telegramApi,
        groupId,
        preferredUserId: userId,
      });
      syncConfigForTelegram({
        fs,
        openclawDir: OPENCLAW_DIR,
        topicRegistry,
        groupId,
        requireMention,
        resolvedUserId,
      });

      // Save metadata in local topic registry only.
      if (groupName) {
        topicRegistry.setGroup(groupId, { name: groupName });
        syncPromptFiles();
      }
      const syncWarning = await runTelegramGitSync("configure-group", groupId);

      res.json({ ok: true, userId: resolvedUserId || null, syncWarning });
    } catch (e) {
      res.json({ ok: false, error: e.message });
    }
  });

  // Get full topic registry
  app.get("/api/telegram/topic-registry", (req, res) => {
    res.json({ ok: true, registry: topicRegistry.readRegistry() });
  });

  // Workspace bootstrap info (lets UI jump straight to management)
  app.get("/api/telegram/workspace", async (req, res) => {
    try {
      const debugEnabled = isDebugEnabled();
      const configPath = `${OPENCLAW_DIR}/openclaw.json`;
      let cfg = JSON.parse(fs.readFileSync(configPath, "utf8"));
      let telegramConfig = cfg.channels?.telegram || {};
      const configuredGroups = telegramConfig.groups || {};
      const groupIds = Object.keys(configuredGroups);
      if (groupIds.length === 0) {
        return res.json({ ok: true, configured: false, debugEnabled });
      }
      const groupId = String(groupIds[0]);
      const groupConfig = configuredGroups[groupId] || {};
      const repairResult = await repairGroupAllowFromIfMissing({
        cfg,
        groupId,
        requireMention: !!groupConfig.requireMention,
      });
      if (repairResult.repaired) {
        cfg = JSON.parse(fs.readFileSync(configPath, "utf8"));
        telegramConfig = cfg.channels?.telegram || {};
      }
      const registryGroup = topicRegistry.getGroup(groupId);
      let groupName = registryGroup?.name || groupId;
      try {
        const chat = await telegramApi.getChat(groupId);
        if (chat?.title) groupName = chat.title;
      } catch {}
      return res.json({
        ok: true,
        configured: true,
        groupId,
        groupName,
        topics: registryGroup?.topics || {},
        debugEnabled,
        concurrency: {
          agentMaxConcurrent: cfg.agents?.defaults?.maxConcurrent ?? null,
          subagentMaxConcurrent:
            cfg.agents?.defaults?.subagents?.maxConcurrent ?? null,
        },
        repairedGroupAllowFrom: !!repairResult.repaired,
        repairedUserId: repairResult.resolvedUserId || null,
        syncWarning: repairResult.syncWarning || null,
      });
    } catch (e) {
      return res.json({ ok: false, error: e.message });
    }
  });

  // Reset Telegram workspace onboarding state
  app.post("/api/telegram/workspace/reset", async (req, res) => {
    try {
      const configPath = `${OPENCLAW_DIR}/openclaw.json`;
      const cfg = JSON.parse(fs.readFileSync(configPath, "utf8"));
      const telegramGroups = Object.keys(cfg.channels?.telegram?.groups || {});
      if (cfg.channels?.telegram) {
        delete cfg.channels.telegram.groups;
        delete cfg.channels.telegram.groupAllowFrom;
      }
      fs.writeFileSync(configPath, JSON.stringify(cfg, null, 2));

      // Remove corresponding groups from topic registry
      const registry = topicRegistry.readRegistry();
      if (registry && registry.groups) {
        for (const groupId of telegramGroups) {
          delete registry.groups[groupId];
        }
        topicRegistry.writeRegistry(registry);
      }

      syncPromptFiles();
      const syncWarning = await runTelegramGitSync("reset-workspace", "telegram");
      return res.json({ ok: true, syncWarning });
    } catch (e) {
      return res.json({ ok: false, error: e.message });
    }
  });
};

module.exports = { registerTelegramRoutes, buildTelegramGitSyncCommand };
