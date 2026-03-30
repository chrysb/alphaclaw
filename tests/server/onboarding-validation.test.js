const { validateOnboardingInput } = require("../../lib/server/onboarding/validation");

const kBaseVars = () => [
  { key: "GITHUB_TOKEN", value: "ghp_test" },
  { key: "GITHUB_WORKSPACE_REPO", value: "owner/repo" },
  { key: "TELEGRAM_BOT_TOKEN", value: "telegram_tok" },
];

const kResolveProvider = (modelKey) => String(modelKey || "").split("/")[0] || "";

describe("onboarding/validation", () => {
  it("accepts OPENROUTER_API_KEY when the selected model uses the openrouter provider", () => {
    const res = validateOnboardingInput({
      vars: [...kBaseVars(), { key: "OPENROUTER_API_KEY", value: "sk-or-test" }],
      modelKey: "openrouter/nvidia/nemotron-3-nano",
      resolveModelProvider: kResolveProvider,
      hasCodexOauthProfile: () => false,
    });
    expect(res.ok).toBe(true);
  });

  it("accepts MOONSHOT_API_KEY when the selected model uses the moonshot provider", () => {
    const res = validateOnboardingInput({
      vars: [...kBaseVars(), { key: "MOONSHOT_API_KEY", value: "sk-moonshot" }],
      modelKey: "moonshot/kimi-k2-5",
      resolveModelProvider: kResolveProvider,
      hasCodexOauthProfile: () => false,
    });
    expect(res.ok).toBe(true);
  });

  it("rejects openrouter model when only unrelated API keys are present", () => {
    const res = validateOnboardingInput({
      vars: [...kBaseVars(), { key: "MOONSHOT_API_KEY", value: "sk-ms" }],
      modelKey: "openrouter/foo/bar",
      resolveModelProvider: kResolveProvider,
      hasCodexOauthProfile: () => false,
    });
    expect(res.ok).toBe(false);
    expect(res.error).toBe('Missing credentials for selected provider "openrouter"');
  });
});
