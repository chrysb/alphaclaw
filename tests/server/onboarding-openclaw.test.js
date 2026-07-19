const fs = require("fs");
const os = require("os");
const path = require("path");

const {
  buildOnboardArgs,
  writeManagedImportOpenclawConfig,
  writeSanitizedOpenclawConfig,
} = require("../../lib/server/onboarding/openclaw");

const createTempOpenclawDir = () =>
  fs.mkdtempSync(path.join(os.tmpdir(), "alphaclaw-onboarding-openclaw-test-"));

describe("server/onboarding/openclaw", () => {
  it("builds onboarding args from submitted vars instead of stale process env auth", () => {
    process.env.ANTHROPIC_TOKEN = "sk-ant-oat01-stale-token";

    const args = buildOnboardArgs({
      varMap: {
        ANTHROPIC_API_KEY: "sk-ant-api-fresh-key",
        OPENCLAW_GATEWAY_TOKEN: "gw-token",
      },
      selectedProvider: "anthropic",
      hasCodexOauth: false,
      workspaceDir: "/tmp/workspace",
    });

    expect(args).toContain("--anthropic-api-key");
    expect(args).toContain("sk-ant-api-fresh-key");
    expect(args).not.toContain("--token");
    expect(args).not.toContain("sk-ant-oat01-stale-token");

    delete process.env.ANTHROPIC_TOKEN;
  });

  it("only scrubs exact secret string values in JSON", () => {
    const openclawDir = createTempOpenclawDir();
    const configPath = path.join(openclawDir, "openclaw.json");
    const pluginPath = "/app/node_modules/@chrysb/alphaclaw/lib/plugin/usage-tracker";
    fs.writeFileSync(
      configPath,
      JSON.stringify(
        {
          plugins: {
            allow: ["memory-core"],
            load: { paths: [pluginPath] },
            entries: {},
          },
          channels: {},
          notes: "alphaclaw",
        },
        null,
        2,
      ),
      "utf8",
    );

    writeSanitizedOpenclawConfig({
      fs,
      openclawDir,
      varMap: { GOG_KEYRING_PASSWORD: "alphaclaw" },
    });

    const next = JSON.parse(fs.readFileSync(configPath, "utf8"));
    expect(next.notes).toBe("${GOG_KEYRING_PASSWORD}");
    expect(next.plugins.allow).toEqual(["memory-core", "usage-tracker"]);
    expect(next.plugins.load.paths).toContain(pluginPath);
    expect(next.plugins.load.paths).not.toContain(
      "/app/node_modules/@chrysb/${GOG_KEYRING_PASSWORD}/lib/plugin/usage-tracker",
    );
  });

  it("creates plugins.allow when missing before adding usage-tracker", () => {
    const openclawDir = createTempOpenclawDir();
    const configPath = path.join(openclawDir, "openclaw.json");
    fs.writeFileSync(
      configPath,
      JSON.stringify(
        {
          plugins: { load: { paths: [] }, entries: {} },
          channels: {},
        },
        null,
        2,
      ),
      "utf8",
    );

    writeSanitizedOpenclawConfig({
      fs,
      openclawDir,
      varMap: {},
    });

    const next = JSON.parse(fs.readFileSync(configPath, "utf8"));
    expect(next.plugins.allow).toEqual(["usage-tracker"]);
    expect(next.plugins.entries["usage-tracker"]).toEqual({
      enabled: true,
      hooks: { allowConversationAccess: true },
    });
    expect(next.gateway.http).toBeUndefined();
  });

  it("keeps the Codex runtime usable when onboarding creates a plugin allowlist", () => {
    const openclawDir = createTempOpenclawDir();
    const configPath = path.join(openclawDir, "openclaw.json");
    fs.writeFileSync(
      configPath,
      JSON.stringify(
        {
          agents: {
            defaults: {
              model: { primary: "openai/gpt-5.6-sol" },
              models: { "openai/gpt-5.6-sol": {} },
            },
          },
          plugins: { entries: {} },
          channels: {},
        },
        null,
        2,
      ),
      "utf8",
    );

    writeSanitizedOpenclawConfig({ fs, openclawDir, varMap: {} });

    const next = JSON.parse(fs.readFileSync(configPath, "utf8"));
    expect(next.plugins.allow).toEqual(["usage-tracker", "codex"]);
    expect(next.plugins.entries.codex).toEqual({ enabled: true });
  });

  it("preserves existing gateway HTTP endpoint settings when API exposure is opted in", () => {
    const openclawDir = createTempOpenclawDir();
    const configPath = path.join(openclawDir, "openclaw.json");
    fs.writeFileSync(
      path.join(openclawDir, "alphaclaw.json"),
      JSON.stringify({ features: { openaiCompatApi: { enabled: true } } }),
      "utf8",
    );
    fs.writeFileSync(
      configPath,
      JSON.stringify(
        {
          plugins: { allow: [], load: { paths: [] }, entries: {} },
          channels: {},
          gateway: {
            http: {
              endpoints: {
                chatCompletions: {
                  maxBodyBytes: 1234,
                },
                responses: {
                  maxBodyBytes: 5678,
                },
              },
            },
          },
        },
        null,
        2,
      ),
      "utf8",
    );

    writeSanitizedOpenclawConfig({
      fs,
      openclawDir,
      varMap: {},
    });

    const next = JSON.parse(fs.readFileSync(configPath, "utf8"));
    expect(next.gateway.http.endpoints.chatCompletions).toEqual({
      enabled: true,
      maxBodyBytes: 1234,
    });
    expect(next.gateway.http.endpoints.responses).toEqual({
      enabled: true,
      maxBodyBytes: 5678,
    });
  });

  it("resets imported allowlist dmPolicy to pairing when re-enabling discord", () => {
    const openclawDir = createTempOpenclawDir();
    const configPath = path.join(openclawDir, "openclaw.json");
    fs.writeFileSync(
      configPath,
      JSON.stringify(
        {
          plugins: { allow: [], load: { paths: [] }, entries: {} },
          channels: {
            discord: {
              enabled: false,
              dmPolicy: "allowlist",
              allowFrom: [],
            },
          },
        },
        null,
        2,
      ),
      "utf8",
    );

    writeManagedImportOpenclawConfig({
      fs,
      openclawDir,
      varMap: { DISCORD_BOT_TOKEN: "discord-live-secret" },
    });

    const next = JSON.parse(fs.readFileSync(configPath, "utf8"));
    expect(next.channels.discord.enabled).toBe(true);
    expect(next.channels.discord.dmPolicy).toBe("pairing");
    expect(next.channels.discord.token).toBe("${DISCORD_BOT_TOKEN}");
  });
});

describe("server/onboarding/openclaw buildOnboardArgs branches", () => {
  const build = (overrides = {}) =>
    buildOnboardArgs({
      varMap: {},
      selectedProvider: "",
      hasCodexOauth: false,
      workspaceDir: "/tmp/workspace",
      ...overrides,
    });

  it("uses the OpenAI API key for openai-codex when provided", () => {
    const args = build({
      selectedProvider: "openai-codex",
      varMap: { OPENAI_API_KEY: "sk-openai-key" },
    });
    expect(args).toContain("--openai-api-key");
    expect(args).toContain("sk-openai-key");
  });

  it("skips auth for openai-codex with oauth and no API key", () => {
    const args = build({
      selectedProvider: "openai-codex",
      hasCodexOauth: true,
    });
    expect(args).toContain("--auth-choice");
    expect(args).toContain("skip");
  });

  it("uses the anthropic setup token for the anthropic provider", () => {
    const args = build({
      selectedProvider: "anthropic",
      varMap: { ANTHROPIC_TOKEN: "sk-ant-oat01-token" },
    });
    expect(args).toContain("--token-provider");
    expect(args).toContain("anthropic");
    expect(args).toContain("sk-ant-oat01-token");
  });

  it("uses the OpenAI API key for the openai provider", () => {
    const args = build({
      selectedProvider: "openai",
      varMap: { OPENAI_API_KEY: "sk-openai-key" },
    });
    expect(args).toContain("--openai-api-key");
  });

  it("uses the gemini API key for the google provider", () => {
    const args = build({
      selectedProvider: "google",
      varMap: { GEMINI_API_KEY: "AIza-gemini-key" },
    });
    expect(args).toContain("--gemini-api-key");
    expect(args).toContain("AIza-gemini-key");
  });

  it("falls back to the anthropic token for unmatched providers", () => {
    const args = build({
      selectedProvider: "mistral",
      varMap: { ANTHROPIC_TOKEN: "sk-ant-oat01-token" },
    });
    expect(args).toContain("--token");
    expect(args).toContain("sk-ant-oat01-token");
  });

  it("falls back to the anthropic API key for unmatched providers", () => {
    const args = build({
      selectedProvider: "mistral",
      varMap: { ANTHROPIC_API_KEY: "sk-ant-api-key" },
    });
    expect(args).toContain("--anthropic-api-key");
    expect(args).toContain("sk-ant-api-key");
  });

  it("falls back to the OpenAI API key for unmatched providers", () => {
    const args = build({
      selectedProvider: "mistral",
      varMap: { OPENAI_API_KEY: "sk-openai-key" },
    });
    expect(args).toContain("--openai-api-key");
    expect(args).toContain("sk-openai-key");
  });

  it("falls back to the gemini API key for unmatched providers", () => {
    const args = build({
      selectedProvider: "mistral",
      varMap: { GEMINI_API_KEY: "AIza-gemini-key" },
    });
    expect(args).toContain("--gemini-api-key");
    expect(args).toContain("AIza-gemini-key");
  });

  it("falls back to codex oauth skip for unmatched providers with no keys", () => {
    const args = build({
      selectedProvider: "mistral",
      hasCodexOauth: true,
    });
    expect(args).toContain("--auth-choice");
    expect(args).toContain("skip");
  });
});

describe("server/onboarding/openclaw channel configuration", () => {
  it("configures discord, slack, and whatsapp channels for fresh onboarding", () => {
    const openclawDir = createTempOpenclawDir();
    const configPath = path.join(openclawDir, "openclaw.json");
    fs.writeFileSync(configPath, "{}", "utf8");

    writeSanitizedOpenclawConfig({
      fs,
      openclawDir,
      varMap: {
        TELEGRAM_BOT_TOKEN: "tg-token-123",
        DISCORD_BOT_TOKEN: "discord-token-123",
        SLACK_BOT_TOKEN: "xoxb-slack-bot",
        SLACK_APP_TOKEN: "xapp-slack-app",
        WHATSAPP_OWNER_NUMBER: "+15551234567",
      },
    });

    const next = JSON.parse(fs.readFileSync(configPath, "utf8"));
    expect(next.channels.telegram).toMatchObject({
      enabled: true,
      botToken: "${TELEGRAM_BOT_TOKEN}",
      dmPolicy: "pairing",
    });
    expect(next.channels.discord).toMatchObject({
      enabled: true,
      token: "${DISCORD_BOT_TOKEN}",
      dmPolicy: "pairing",
      groupPolicy: "allowlist",
    });
    expect(next.channels.slack).toMatchObject({
      enabled: true,
      botToken: "${SLACK_BOT_TOKEN}",
      appToken: "${SLACK_APP_TOKEN}",
      mode: "socket",
      groupPolicy: "open",
    });
    expect(next.channels.whatsapp).toMatchObject({
      enabled: true,
      allowFrom: ["+15551234567"],
      groupAllowFrom: ["+15551234567"],
      dmPolicy: "allowlist",
      selfChatMode: true,
    });
    expect(next.plugins.entries.discord).toEqual({ enabled: true });
    expect(next.plugins.entries.slack).toEqual({ enabled: true });
    expect(next.plugins.entries.whatsapp).toEqual({ enabled: true });
  });

  it("re-enables slack with imported settings during managed import", () => {
    const openclawDir = createTempOpenclawDir();
    const configPath = path.join(openclawDir, "openclaw.json");
    fs.writeFileSync(
      configPath,
      JSON.stringify({
        channels: {
          slack: {
            enabled: false,
            mode: "http",
            dmPolicy: "open",
            groupPolicy: "allowlist",
          },
        },
      }),
      "utf8",
    );

    writeManagedImportOpenclawConfig({
      fs,
      openclawDir,
      varMap: {
        SLACK_BOT_TOKEN: "xoxb-slack-bot",
        SLACK_APP_TOKEN: "xapp-slack-app",
      },
    });

    const next = JSON.parse(fs.readFileSync(configPath, "utf8"));
    expect(next.channels.slack).toMatchObject({
      enabled: true,
      botToken: "${SLACK_BOT_TOKEN}",
      appToken: "${SLACK_APP_TOKEN}",
      mode: "http",
      dmPolicy: "open",
      groupPolicy: "allowlist",
    });
    expect(next.plugins.entries.slack).toMatchObject({ enabled: true });
    expect(next.plugins.allow).toContain("slack");
  });

  it("merges the whatsapp owner into existing allowFrom during managed import", () => {
    const openclawDir = createTempOpenclawDir();
    const configPath = path.join(openclawDir, "openclaw.json");
    fs.writeFileSync(
      configPath,
      JSON.stringify({
        channels: {
          whatsapp: {
            enabled: false,
            allowFrom: ["+15550001111"],
          },
        },
      }),
      "utf8",
    );

    writeManagedImportOpenclawConfig({
      fs,
      openclawDir,
      varMap: { WHATSAPP_OWNER_NUMBER: "+15551234567" },
    });

    const next = JSON.parse(fs.readFileSync(configPath, "utf8"));
    expect(next.channels.whatsapp).toMatchObject({
      enabled: true,
      allowFrom: ["+15550001111", "${WHATSAPP_OWNER_NUMBER}"],
      groupAllowFrom: ["+15550001111", "${WHATSAPP_OWNER_NUMBER}"],
      dmPolicy: "allowlist",
      groupPolicy: "allowlist",
      selfChatMode: true,
    });
    expect(next.plugins.entries.whatsapp).toMatchObject({ enabled: true });
  });

  it("keeps existing whatsapp allowFrom when the owner ref is already present", () => {
    const openclawDir = createTempOpenclawDir();
    const configPath = path.join(openclawDir, "openclaw.json");
    fs.writeFileSync(
      configPath,
      JSON.stringify({
        channels: {
          whatsapp: {
            allowFrom: ["${WHATSAPP_OWNER_NUMBER}"],
          },
        },
      }),
      "utf8",
    );

    writeManagedImportOpenclawConfig({
      fs,
      openclawDir,
      varMap: { WHATSAPP_OWNER_NUMBER: "+15551234567" },
    });

    const next = JSON.parse(fs.readFileSync(configPath, "utf8"));
    expect(next.channels.whatsapp.allowFrom).toEqual(["${WHATSAPP_OWNER_NUMBER}"]);
    expect(next.channels.whatsapp.groupAllowFrom).toEqual([
      "${WHATSAPP_OWNER_NUMBER}",
    ]);
  });
});
