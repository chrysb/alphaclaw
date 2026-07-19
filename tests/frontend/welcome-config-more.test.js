import { describe, expect, it } from "vitest";
import {
  findFirstInvalidWelcomeGroup,
  getWelcomeGroupError,
  isValidGithubRepoInput,
  kGithubFlowImport,
  kWelcomeGroups,
  normalizeGithubRepoInput,
} from "../../lib/public/js/components/onboarding/welcome-config.js";

const groupById = Object.fromEntries(
  kWelcomeGroups.map((group) => [group.id, group]),
);

const kValidVals = {
  GITHUB_TOKEN: "ghp_123",
  GITHUB_WORKSPACE_REPO: "owner/repo",
  MODEL_KEY: "anthropic/claude-opus-4-6",
  TELEGRAM_BOT_TOKEN: "123:token",
};
const kValidCtx = { selectedProvider: "anthropic", hasAi: true };

describe("frontend/welcome-config (extended)", () => {
  it("normalizes GitHub repo input formats", () => {
    expect(normalizeGithubRepoInput("git@github.com:owner/repo.git")).toBe(
      "owner/repo",
    );
    expect(normalizeGithubRepoInput("https://github.com/owner/repo")).toBe(
      "owner/repo",
    );
    expect(normalizeGithubRepoInput("  owner/repo  ")).toBe("owner/repo");
    expect(normalizeGithubRepoInput(null)).toBe("");
  });

  it("validates GitHub repo inputs", () => {
    expect(isValidGithubRepoInput("")).toBe(false);
    expect(isValidGithubRepoInput("owner-only")).toBe(false);
    expect(isValidGithubRepoInput("ow ner/repo")).toBe(false);
    expect(isValidGithubRepoInput("owner/repo")).toBe(true);
  });

  it("walks the GitHub group error states in order", () => {
    expect(getWelcomeGroupError("github", {})).toBe(
      "Enter a GitHub personal access token to continue.",
    );
    expect(getWelcomeGroupError("github", { GITHUB_TOKEN: "ghp_1" })).toBe(
      'Enter the target repo as "owner/repo".',
    );
    expect(
      getWelcomeGroupError("github", {
        _GITHUB_FLOW: kGithubFlowImport,
        GITHUB_TOKEN: "ghp_1",
        GITHUB_WORKSPACE_REPO: "owner/repo",
        _GITHUB_SOURCE_REPO: "not-a-repo",
      }),
    ).toBe('Source repo must be in "owner/repo" format.');
    expect(
      getWelcomeGroupError("github", {
        _GITHUB_FLOW: kGithubFlowImport,
        GITHUB_TOKEN: "ghp_1",
        GITHUB_WORKSPACE_REPO: "owner/repo",
        _GITHUB_SOURCE_REPO: "source/repo",
      }),
    ).toBe("");
  });

  it("walks the AI group error states", () => {
    expect(getWelcomeGroupError("ai", {})).toBe("Choose a model to continue.");
    expect(getWelcomeGroupError("ai", { MODEL_KEY: "no-slash" })).toBe(
      "Choose a model to continue.",
    );
    expect(
      getWelcomeGroupError(
        "ai",
        { MODEL_KEY: "openai-codex/gpt-5.5" },
        { selectedProvider: "openai-codex", codexLoading: true, hasAi: false },
      ),
    ).toBe("Checking Codex OAuth status. Try Next again in a moment.");
    expect(
      getWelcomeGroupError(
        "ai",
        { MODEL_KEY: "anthropic/claude-opus-4-6" },
        { selectedProvider: "anthropic", hasAi: false },
      ),
    ).toBe("Add credentials for the selected model provider to continue.");
    expect(
      getWelcomeGroupError(
        "ai",
        { MODEL_KEY: "anthropic/claude-opus-4-6" },
        kValidCtx,
      ),
    ).toBe("");
  });

  it("walks the channels group error states", () => {
    expect(getWelcomeGroupError("channels", {})).toBe(
      "Add at least one channel to continue.",
    );
    expect(
      getWelcomeGroupError("channels", { SLACK_APP_TOKEN: "xapp-1" }),
    ).toBe("Add the Slack bot token to continue with Slack.");
    expect(
      getWelcomeGroupError("channels", {
        SLACK_BOT_TOKEN: "xoxb-1",
        SLACK_APP_TOKEN: "xapp-1",
      }),
    ).toBe("");
    expect(
      getWelcomeGroupError("channels", { TELEGRAM_BOT_TOKEN: "1:t" }),
    ).toBe("");
    expect(
      getWelcomeGroupError("channels", { DISCORD_BOT_TOKEN: "MTQ3" }),
    ).toBe("");
  });

  it("returns no error for unknown groups", () => {
    expect(getWelcomeGroupError("nonexistent", {})).toBe("");
    expect(getWelcomeGroupError("tools", {})).toBe("");
  });

  it("exposes working validate functions on each group", () => {
    expect(groupById.github.validate(kValidVals)).toBe(true);
    expect(groupById.github.validate({})).toBe(false);
    expect(groupById.ai.validate(kValidVals, kValidCtx)).toBe(true);
    expect(groupById.ai.validate({}, {})).toBe(false);
    expect(groupById.channels.validate(kValidVals)).toBe(true);
    expect(groupById.channels.validate({})).toBe(false);
    expect(groupById.tools.validate()).toBe(true);
  });

  it("returns null when every welcome group is valid", () => {
    expect(findFirstInvalidWelcomeGroup(kValidVals, kValidCtx)).toBe(null);
    expect(findFirstInvalidWelcomeGroup({}, {})?.id).toBe("github");
  });
});
