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

  it("accepts whatsapp owner number as the required channel credential", () => {
    const res = validateOnboardingInput({
      vars: [
        { key: "GITHUB_TOKEN", value: "ghp_test" },
        { key: "GITHUB_WORKSPACE_REPO", value: "owner/repo" },
        { key: "WHATSAPP_OWNER_NUMBER", value: "+15551234567" },
        { key: "OPENAI_API_KEY", value: "sk-test-123" },
      ],
      modelKey: "openai/gpt-5.1-codex",
      resolveModelProvider: kResolveProvider,
      hasCodexOauthProfile: () => false,
    });
    expect(res.ok).toBe(true);
  });

  it("accepts canonical GPT-5.5 with Codex OAuth and no OpenAI API key", () => {
    const res = validateOnboardingInput({
      vars: kBaseVars(),
      modelKey: "openai/gpt-5.5",
      resolveModelProvider: kResolveProvider,
      hasCodexOauthProfile: () => true,
    });

    expect(res.ok).toBe(true);
    expect(res.data.selectedProvider).toBe("openai-codex");
  });

  it("accepts canonical GPT-5.5 with an OpenAI API key and no Codex OAuth", () => {
    const res = validateOnboardingInput({
      vars: [...kBaseVars(), { key: "OPENAI_API_KEY", value: "sk-test-123" }],
      modelKey: "openai/gpt-5.5",
      resolveModelProvider: kResolveProvider,
      hasCodexOauthProfile: () => false,
    });

    expect(res.ok).toBe(true);
    expect(res.data.selectedProvider).toBe("openai-codex");
  });

  it("accepts GPT-5.6 Codex tiers with Codex OAuth", () => {
    for (const modelKey of [
      "openai/gpt-5.6-sol",
      "openai/gpt-5.6-terra",
      "openai/gpt-5.6-luna",
    ]) {
      const res = validateOnboardingInput({
        vars: kBaseVars(),
        modelKey,
        resolveModelProvider: kResolveProvider,
        hasCodexOauthProfile: () => true,
      });
      expect(res.ok).toBe(true);
      expect(res.data.selectedProvider).toBe("openai-codex");
    }
  });
});

describe("onboarding/validation edge cases", () => {
  const kResolve = (modelKey) => String(modelKey || "").split("/")[0] || "";
  const kBase = () => [
    { key: "GITHUB_TOKEN", value: "ghp_test" },
    { key: "GITHUB_WORKSPACE_REPO", value: "owner/repo" },
    { key: "TELEGRAM_BOT_TOKEN", value: "telegram_tok" },
  ];
  const run = (overrides = {}) =>
    validateOnboardingInput({
      vars: kBase(),
      modelKey: "openai/gpt-5.1-codex",
      resolveModelProvider: kResolve,
      hasCodexOauthProfile: () => false,
      ...overrides,
    });

  it("rejects anthropic api keys with the wrong prefix", () => {
    const res = run({
      vars: [...kBase(), { key: "ANTHROPIC_API_KEY", value: "not-an-api-key" }],
      modelKey: "anthropic/claude-opus-4-6",
    });
    expect(res.ok).toBe(false);
    expect(res.status).toBe(400);
    expect(res.error).toBe("ANTHROPIC_API_KEY must start with sk-ant-api");
  });

  it("rejects payloads with too many environment variables", () => {
    const vars = Array.from({ length: 65 }, (_, i) => ({
      key: `VAR_${i}`,
      value: "x",
    }));
    const res = run({ vars });
    expect(res.ok).toBe(false);
    expect(res.error).toBe("Too many environment variables (max 64)");
  });

  it("rejects variables that are missing a key", () => {
    const res = run({ vars: [...kBase(), { key: "", value: "x" }] });
    expect(res.ok).toBe(false);
    expect(res.error).toBe("Each variable must include a key");
  });

  it("rejects variable keys that are too long", () => {
    const longKey = "K".repeat(129);
    const res = run({ vars: [...kBase(), { key: longKey, value: "x" }] });
    expect(res.ok).toBe(false);
    expect(res.error).toBe(`Variable key is too long: ${longKey.slice(0, 32)}...`);
  });

  it("falls back to any AI credential for providers without a known env key", () => {
    const res = run({
      vars: [...kBase(), { key: "GEMINI_API_KEY", value: "AIza-test" }],
      modelKey: "customprovider/some-model",
    });
    expect(res.ok).toBe(true);
    expect(res.data.selectedProvider).toBe("customprovider");
  });

  it("rejects providers without a known env key when no AI credential exists", () => {
    const res = run({
      vars: kBase(),
      modelKey: "customprovider/some-model",
    });
    expect(res.ok).toBe(false);
    expect(res.error).toBe(
      'Missing credentials for selected provider "customprovider"',
    );
  });

  it("requires github token and workspace repo", () => {
    const res = run({
      vars: [
        { key: "OPENAI_API_KEY", value: "sk-test-123" },
        { key: "TELEGRAM_BOT_TOKEN", value: "telegram_tok" },
      ],
    });
    expect(res.ok).toBe(false);
    expect(res.error).toBe("GitHub token and workspace repo are required");
  });

  it("requires at least one channel token", () => {
    const res = run({
      vars: [
        { key: "OPENAI_API_KEY", value: "sk-test-123" },
        { key: "GITHUB_TOKEN", value: "ghp_test" },
        { key: "GITHUB_WORKSPACE_REPO", value: "owner/repo" },
      ],
    });
    expect(res.ok).toBe(false);
    expect(res.error).toBe("At least one channel token is required");
  });
});
