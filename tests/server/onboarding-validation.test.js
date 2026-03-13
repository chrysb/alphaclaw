const { validateOnboardingInput } = require("../../lib/server/onboarding/validation");

const resolveModelProvider = (modelKey) => String(modelKey || "").split("/")[0];

describe("server/onboarding/validation", () => {
  it("accepts whatsapp owner number as the required channel credential", () => {
    const result = validateOnboardingInput({
      vars: [
        { key: "OPENAI_API_KEY", value: "sk-test-123" },
        { key: "GITHUB_TOKEN", value: "ghp_test_123" },
        { key: "GITHUB_WORKSPACE_REPO", value: "owner/repo" },
        { key: "WHATSAPP_OWNER_NUMBER", value: "+15551234567" },
      ],
      modelKey: "openai/gpt-5.1-codex",
      resolveModelProvider,
      hasCodexOauthProfile: () => false,
    });

    expect(result.ok).toBe(true);
  });

  it("rejects when no channel credentials are provided", () => {
    const result = validateOnboardingInput({
      vars: [
        { key: "OPENAI_API_KEY", value: "sk-test-123" },
        { key: "GITHUB_TOKEN", value: "ghp_test_123" },
        { key: "GITHUB_WORKSPACE_REPO", value: "owner/repo" },
      ],
      modelKey: "openai/gpt-5.1-codex",
      resolveModelProvider,
      hasCodexOauthProfile: () => false,
    });

    expect(result).toEqual({
      ok: false,
      status: 400,
      error: "At least one channel token is required",
    });
  });
});
