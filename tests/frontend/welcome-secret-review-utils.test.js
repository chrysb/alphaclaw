const loadWelcomeSecretReviewUtils = async () =>
  import(
    "../../lib/public/js/components/onboarding/welcome-secret-review-utils.js"
  );

describe("frontend/welcome secret review utils", () => {
  it("builds default approved secrets from high-confidence findings", async () => {
    const utils = await loadWelcomeSecretReviewUtils();
    const secrets = [
      {
        configPath: "channels.discord.token",
        confidence: "high",
        suggestedEnvVar: "DISCORD_BOT_TOKEN",
      },
      {
        configPath: "models.providers.custom.apiKey",
        confidence: "medium",
        suggestedEnvVar: "CUSTOM_API_KEY",
      },
    ];

    expect(utils.buildApprovedImportSecrets(secrets)).toEqual([
      {
        configPath: "channels.discord.token",
        confidence: "high",
        suggestedEnvVar: "DISCORD_BOT_TOKEN",
      },
    ]);
  });

  it("builds onboarding vals from approved extracted secrets", async () => {
    const utils = await loadWelcomeSecretReviewUtils();
    const approvedSecrets = [
      {
        suggestedEnvVar: "DISCORD_BOT_TOKEN",
        value: "discord-secret",
      },
      {
        suggestedEnvVar: "BRAVE_API_KEY",
        value: "brave-secret",
      },
      {
        suggestedEnvVar: "",
        value: "ignored",
      },
    ];

    expect(utils.buildApprovedImportVals(approvedSecrets)).toEqual({
      DISCORD_BOT_TOKEN: "discord-secret",
      BRAVE_API_KEY: "brave-secret",
    });
  });
});
