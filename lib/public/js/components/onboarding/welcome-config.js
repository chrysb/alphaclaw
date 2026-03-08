import { h } from "https://esm.sh/preact";
import htm from "https://esm.sh/htm";
import { kAllAiAuthFields } from "../../lib/model-config.js";

const html = htm.bind(h);

export const kRepoModeNew = "new";
export const kRepoModeExisting = "existing";
export const kGithubFlowFresh = "fresh";
export const kGithubFlowImport = "import";
export const kGithubTargetRepoModeCreate = "create";
export const kGithubTargetRepoModeExistingEmpty = "existing-empty";

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
          >${" "}with${" "}<code class="text-xs bg-black/30 px-1 rounded"
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
    validate: (vals) => {
      const githubFlow = vals._GITHUB_FLOW || kGithubFlowFresh;
      const hasTarget = isValidGithubRepoInput(vals.GITHUB_WORKSPACE_REPO);
      const hasSource =
        githubFlow !== kGithubFlowImport ||
        isValidGithubRepoInput(vals._GITHUB_SOURCE_REPO);
      return !!(vals.GITHUB_TOKEN && hasTarget && hasSource);
    },
  },
  {
    id: "ai",
    title: "Primary Agent Model",
    description: "Choose your main model and authenticate its provider",
    fields: kAllAiAuthFields,
    validate: (vals, ctx = {}) => !!(vals.MODEL_KEY && ctx.hasAi),
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
    ],
    validate: (vals) => !!(vals.TELEGRAM_BOT_TOKEN || vals.DISCORD_BOT_TOKEN),
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
