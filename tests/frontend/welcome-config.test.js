const loadWelcomeConfig = async () =>
  import("../../lib/public/js/components/onboarding/welcome-config.js");

describe("frontend/welcome-config", () => {
  it("reports a target repo format error for invalid GitHub input", async () => {
    const welcomeConfig = await loadWelcomeConfig();

    expect(
      welcomeConfig.getWelcomeGroupError("github", {
        GITHUB_TOKEN: "ghp_123",
        GITHUB_WORKSPACE_REPO: "owner-only",
      }),
    ).toBe('Target repo must be in "owner/repo" format.');
  });

  it("requires a source repo when import mode is selected", async () => {
    const welcomeConfig = await loadWelcomeConfig();

    expect(
      welcomeConfig.getWelcomeGroupError("github", {
        _GITHUB_FLOW: welcomeConfig.kGithubFlowImport,
        GITHUB_TOKEN: "ghp_123",
        GITHUB_WORKSPACE_REPO: "owner/target-repo",
        _GITHUB_SOURCE_REPO: "",
      }),
    ).toBe('Enter the source repo as "owner/repo".');
  });

  it("returns a Codex-specific auth message for the AI step", async () => {
    const welcomeConfig = await loadWelcomeConfig();

    expect(
      welcomeConfig.getWelcomeGroupError(
        "ai",
        { MODEL_KEY: "openai-codex/gpt-5.4" },
        {
          selectedProvider: "openai-codex",
          hasAi: false,
          codexLoading: false,
        },
      ),
    ).toBe("Connect Codex OAuth to continue.");
  });

  it("requires both Slack tokens before the channels step can pass", async () => {
    const welcomeConfig = await loadWelcomeConfig();

    expect(
      welcomeConfig.getWelcomeGroupError("channels", {
        SLACK_BOT_TOKEN: "xoxb-123",
        SLACK_APP_TOKEN: "",
      }),
    ).toBe("Add the Slack app token to continue with Slack.");
  });

  it("finds the first invalid step in welcome order", async () => {
    const welcomeConfig = await loadWelcomeConfig();

    const invalidGroup = welcomeConfig.findFirstInvalidWelcomeGroup(
      {
        GITHUB_TOKEN: "ghp_123",
        GITHUB_WORKSPACE_REPO: "owner/target-repo",
        MODEL_KEY: "openai-codex/gpt-5.4",
      },
      {
        selectedProvider: "openai-codex",
        hasAi: false,
        codexLoading: false,
      },
    );

    expect(invalidGroup?.id).toBe("ai");
  });
});
