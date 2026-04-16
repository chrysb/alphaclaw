import { h } from "preact";
import htm from "htm";
import { kAllAiAuthFields } from "../../lib/model-config.js";

const html = htm.bind(h);

export const kRepoModeNew = "new";
export const kRepoModeExisting = "existing";
export const kGithubFlowFresh = "fresh";
export const kGithubFlowImport = "import";
export const kGithubTargetRepoModeCreate = "create";
export const kGithubTargetRepoModeExistingEmpty = "existing-empty";

const hasValue = (value) => !!String(value || "").trim();

export const normalizeGithubRepoInput = (repoInput) =>
  String(repoInput || "")
    .trim()
    .replace(/^git@github\.com:/, "")
    .replace(/^https:\/\/github\.com\//, "")
    .replace(/\.git$/, "");

export const isValidGithubRepoInput = (repoInput) => {
  const cleaned = normalizeGithubRepoInput(repoInput);
  if (!cleaned) return false;
  const parts = cleaned.split("/").filter(Boolean);
  return parts.length === 2 && !parts.some((part) => /\s/.test(part));
};

const getGithubGroupError = (vals) => {
  const githubFlow = vals._GITHUB_FLOW || kGithubFlowFresh;
  if (!hasValue(vals.GITHUB_TOKEN)) {
    return "Enter a GitHub personal access token to continue.";
  }
  if (!hasValue(vals.GITHUB_WORKSPACE_REPO)) {
    return 'Enter the target repo as "owner/repo".';
  }
  if (!isValidGithubRepoInput(vals.GITHUB_WORKSPACE_REPO)) {
    return 'Target repo must be in "owner/repo" format.';
  }
  if (githubFlow === kGithubFlowImport) {
    if (!hasValue(vals._GITHUB_SOURCE_REPO)) {
      return 'Enter the source repo as "owner/repo".';
    }
    if (!isValidGithubRepoInput(vals._GITHUB_SOURCE_REPO)) {
      return 'Source repo must be in "owner/repo" format.';
    }
  }
  return "";
};

const getAiGroupError = (vals, ctx = {}) => {
  if (!hasValue(vals.MODEL_KEY) || !String(vals.MODEL_KEY).includes("/")) {
    return "Choose a model to continue.";
  }
  if (ctx.selectedProvider === "openai-codex" && ctx.codexLoading) {
    return "Checking Codex OAuth status. Try Next again in a moment.";
  }
  if (!ctx.hasAi) {
    return ctx.selectedProvider === "openai-codex"
      ? "Connect Codex OAuth to continue."
      : "Add credentials for the selected model provider to continue.";
  }
  return "";
};

const getChannelsGroupError = (vals) => {
  const hasTelegram = hasValue(vals.TELEGRAM_BOT_TOKEN);
  const hasDiscord = hasValue(vals.DISCORD_BOT_TOKEN);
  const hasSlackBot = hasValue(vals.SLACK_BOT_TOKEN);
  const hasSlackApp = hasValue(vals.SLACK_APP_TOKEN);

  if (hasSlackBot && !hasSlackApp) {
    return "Add the Slack app token to continue with Slack.";
  }
  if (!hasSlackBot && hasSlackApp) {
    return "Add the Slack bot token to continue with Slack.";
  }
  if (!hasTelegram && !hasDiscord && !(hasSlackBot && hasSlackApp)) {
    return "Add at least one channel to continue.";
  }
  return "";
};

export const getWelcomeGroupError = (groupId, vals, ctx = {}) => {
  switch (groupId) {
    case "github":
      return getGithubGroupError(vals);
    case "ai":
      return getAiGroupError(vals, ctx);
    case "channels":
      return getChannelsGroupError(vals);
    default:
      return "";
  }
};

export const kWelcomeGroups = [
  {
    id: "github",
    title: "GitHub",
    description: "Auto-backup your config and workspace",
    fields: [
      {
        key: "_GITHUB_SOURCE_REPO",
        label: "Source Repo",
        placeholder: "username/existing-openclaw",
        isText: true,
      },
      {
        key: "GITHUB_WORKSPACE_REPO",
        label: "New Workspace Repo",
        placeholder: "username/my-agent",
        isText: true,
      },
      {
        key: "GITHUB_TOKEN",
        label: "Personal Access Token",
        hint: html`Create a${" "}<a
            href="https://github.com/settings/tokens"
            target="_blank"
            class="hover:underline"
            style="color: var(--accent-link)"
            >classic PAT</a
          >${" "}with${" "}<code class="text-xs bg-field px-1 rounded"
            >repo</code
          >${" "}scope, or a${" "}<a
            href="https://github.com/settings/personal-access-tokens/new"
            target="_blank"
            class="hover:underline"
            style="color: var(--accent-link)"
            >fine-grained token</a
          >${" "}with Contents + Metadata access`,
        placeholder: "ghp_... or github_pat_...",
      },
    ],
    validate: (vals, ctx = {}) => !getWelcomeGroupError("github", vals, ctx),
  },
  {
    id: "ai",
    title: "Primary Agent Model",
    description: "Choose your main model and authenticate its provider",
    fields: kAllAiAuthFields,
    validate: (vals, ctx = {}) => !getWelcomeGroupError("ai", vals, ctx),
  },
  {
    id: "channels",
    title: "Channels",
    description: "At least one is required to talk to your agent",
    fields: [
      {
        key: "TELEGRAM_BOT_TOKEN",
        label: "Telegram Bot Token",
        hint: html`From${" "}<a
            href="https://t.me/BotFather"
            target="_blank"
            class="hover:underline"
            style="color: var(--accent-link)"
            >@BotFather</a
          >${" "}·${" "}<a
            href="https://docs.openclaw.ai/channels/telegram"
            target="_blank"
            class="hover:underline"
            style="color: var(--accent-link)"
            >full guide</a
          >`,
        placeholder: "123456789:AAH...",
      },
      {
        key: "DISCORD_BOT_TOKEN",
        label: "Discord Bot Token",
        hint: html`From${" "}<a
            href="https://discord.com/developers/applications"
            target="_blank"
            class="hover:underline"
            style="color: var(--accent-link)"
            >Developer Portal</a
          >${" "}·${" "}<a
            href="https://docs.openclaw.ai/channels/discord"
            target="_blank"
            class="hover:underline"
            style="color: var(--accent-link)"
            >full guide</a
          >`,
        placeholder: "MTQ3...",
      },
      {
        key: "SLACK_BOT_TOKEN",
        label: "Slack Bot Token",
        hint: html`From your Slack app's${" "}<a
            href="https://api.slack.com/apps"
            target="_blank"
            class="hover:underline"
            style="color: var(--accent-link)"
            >OAuth & Permissions</a
          >${" "}page${" "}·${" "}<a
            href="https://docs.openclaw.ai/channels/slack"
            target="_blank"
            class="hover:underline"
            style="color: var(--accent-link)"
            >full guide</a
          >`,
        placeholder: "xoxb-...",
      },
      {
        key: "SLACK_APP_TOKEN",
        label: "Slack App Token (Socket Mode)",
        hint: html`From${" "}<a
            href="https://api.slack.com/apps"
            target="_blank"
            class="hover:underline"
            style="color: var(--accent-link)"
            >Basic Information</a
          >${" "}→ App-Level Tokens (needs${" "}<code>connections:write</code>${" "}scope)`,
        placeholder: "xapp-...",
      },
    ],
    validate: (vals, ctx = {}) => !getWelcomeGroupError("channels", vals, ctx),
  },
  {
    id: "tools",
    title: "Tools (optional)",
    description: "Enable extra capabilities for your agent",
    fields: [
      {
        key: "BRAVE_API_KEY",
        label: "Brave Search API Key",
        hint: html`From${" "}<a
            href="https://brave.com/search/api/"
            target="_blank"
            class="hover:underline"
            style="color: var(--accent-link)"
            >brave.com/search/api</a
          >${" "}-${" "}free tier available`,
        placeholder: "BSA...",
      },
    ],
    validate: () => true,
  },
];

export const findFirstInvalidWelcomeGroup = (vals, ctx = {}) =>
  kWelcomeGroups.find((group) => getWelcomeGroupError(group.id, vals, ctx)) || null;
