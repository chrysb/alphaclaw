const {
  detectSecrets,
  extractPreFillValues,
  isSensitiveKey,
  matchesValuePrefix,
  maskValue,
  parseEnvFileSecrets,
} = require("../../lib/server/onboarding/import/secret-detector");

const createMockFs = (files = {}) => ({
  readFileSync: (p) => {
    if (files[p] !== undefined) return files[p];
    throw Object.assign(new Error("ENOENT"), { code: "ENOENT" });
  },
  existsSync: (p) => files[p] !== undefined,
});

describe("secret-detector", () => {
  describe("isSensitiveKey", () => {
    it("matches token keys", () => {
      expect(isSensitiveKey("botToken")).toBe(true);
      expect(isSensitiveKey("TELEGRAM_BOT_TOKEN")).toBe(true);
      expect(isSensitiveKey("accessToken")).toBe(true);
    });

    it("matches apiKey keys", () => {
      expect(isSensitiveKey("apiKey")).toBe(true);
      expect(isSensitiveKey("OPENAI_API_KEY")).toBe(true);
    });

    it("matches secret/password keys", () => {
      expect(isSensitiveKey("clientSecret")).toBe(true);
      expect(isSensitiveKey("dbPassword")).toBe(true);
    });

    it("excludes safe keys", () => {
      expect(isSensitiveKey("authDir")).toBe(false);
      expect(isSensitiveKey("authStore")).toBe(false);
      expect(isSensitiveKey("publicKey")).toBe(false);
    });

    it("does not match normal keys", () => {
      expect(isSensitiveKey("enabled")).toBe(false);
      expect(isSensitiveKey("model")).toBe(false);
      expect(isSensitiveKey("channelId")).toBe(false);
    });
  });

  describe("matchesValuePrefix", () => {
    it("detects known token prefixes", () => {
      expect(matchesValuePrefix("sk-ant-abc123").matched).toBe(true);
      expect(matchesValuePrefix("ghp_abc123def456").matched).toBe(true);
      expect(matchesValuePrefix("github_pat_abc123").matched).toBe(true);
      expect(matchesValuePrefix("xoxb-123-456").matched).toBe(true);
      expect(matchesValuePrefix("AIzaSyAbc123").matched).toBe(true);
      expect(matchesValuePrefix("ntn_abc123").matched).toBe(true);
    });

    it("does not match normal values", () => {
      expect(matchesValuePrefix("hello-world").matched).toBe(false);
      expect(matchesValuePrefix("anthropic/claude-3").matched).toBe(false);
      expect(matchesValuePrefix("true").matched).toBe(false);
    });
  });

  describe("maskValue", () => {
    it("masks short values fully", () => {
      expect(maskValue("abc")).toBe("****");
    });

    it("masks long values with prefix/suffix", () => {
      const masked = maskValue("sk-ant-abcdefghijklmnop");
      expect(masked).toMatch(/^sk-a\*{4}mnop$/);
    });
  });

  describe("detectSecrets", () => {
    it("detects secrets by config path mapping", () => {
      const cfg = {
        channels: {
          telegram: { botToken: "123456:AAHBOT" },
        },
        models: {
          providers: {
            anthropic: { apiKey: "sk-ant-secret123456" },
          },
        },
      };
      const fs = createMockFs({
        "/base/openclaw.json": JSON.stringify(cfg),
      });
      const secrets = detectSecrets({
        fs,
        baseDir: "/base",
        configFiles: ["openclaw.json"],
        envFiles: [],
      });
      expect(secrets.length).toBeGreaterThanOrEqual(2);
      const telegram = secrets.find(
        (s) => s.suggestedEnvVar === "TELEGRAM_BOT_TOKEN",
      );
      expect(telegram).toBeDefined();
      expect(telegram.confidence).toBe("high");

      const anthropic = secrets.find(
        (s) => s.suggestedEnvVar === "ANTHROPIC_API_KEY",
      );
      expect(anthropic).toBeDefined();
    });

    it("uses documented explicit env names for known providers", () => {
      const cfg = {
        models: {
          providers: {
            zai: { apiKey: "zai-secret-value-12345" },
            xai: { apiKey: "xai-secret-value-12345" },
            minimax: { apiKey: "minimax-secret-value-12345" },
            moonshot: { apiKey: "moonshot-secret-value-12345" },
            "kimi-coding": { apiKey: "kimi-secret-value-12345" },
            "vercel-ai-gateway": { apiKey: "gateway-secret-value-12345" },
            volcengine: { apiKey: "volcengine-secret-value-12345" },
          },
        },
      };
      const fs = createMockFs({
        "/base/openclaw.json": JSON.stringify(cfg),
      });
      const secrets = detectSecrets({
        fs,
        baseDir: "/base",
        configFiles: ["openclaw.json"],
        envFiles: [],
      });
      expect(
        secrets.find((s) => s.configPath === "models.providers.zai.apiKey")
          ?.suggestedEnvVar,
      ).toBe("ZAI_API_KEY");
      expect(
        secrets.find((s) => s.configPath === "models.providers.xai.apiKey")
          ?.suggestedEnvVar,
      ).toBe("XAI_API_KEY");
      expect(
        secrets.find((s) => s.configPath === "models.providers.minimax.apiKey")
          ?.suggestedEnvVar,
      ).toBe("MINIMAX_API_KEY");
      expect(
        secrets.find((s) => s.configPath === "models.providers.moonshot.apiKey")
          ?.suggestedEnvVar,
      ).toBe("MOONSHOT_API_KEY");
      expect(
        secrets.find(
          (s) => s.configPath === "models.providers.kimi-coding.apiKey",
        )?.suggestedEnvVar,
      ).toBe("KIMI_API_KEY");
      expect(
        secrets.find(
          (s) => s.configPath === "models.providers.vercel-ai-gateway.apiKey",
        )?.suggestedEnvVar,
      ).toBe("AI_GATEWAY_API_KEY");
      expect(
        secrets.find(
          (s) => s.configPath === "models.providers.volcengine.apiKey",
        )?.suggestedEnvVar,
      ).toBe("VOLCANO_ENGINE_API_KEY");
    });

    it("falls back to provider-scoped env names for unmapped model providers", () => {
      const cfg = {
        models: {
          providers: {
            "kimi-code": { apiKey: "kimi-secret-value-12345" },
            customproxy: { apiKey: "custom-secret-value-12345" },
          },
        },
      };
      const fs = createMockFs({
        "/base/openclaw.json": JSON.stringify(cfg),
      });
      const secrets = detectSecrets({
        fs,
        baseDir: "/base",
        configFiles: ["openclaw.json"],
        envFiles: [],
      });
      const kimi = secrets.find(
        (s) => s.configPath === "models.providers.kimi-code.apiKey",
      );
      const customproxy = secrets.find(
        (s) => s.configPath === "models.providers.customproxy.apiKey",
      );
      expect(kimi?.suggestedEnvVar).toBe("KIMI_CODE_API_KEY");
      expect(customproxy?.suggestedEnvVar).toBe("CUSTOMPROXY_API_KEY");
    });

    it("detects secrets by value prefix", () => {
      const cfg = {
        custom: { myField: "ghp_abcdef1234567890123456" },
        models: {
          providers: {
            xai: { apiKey: "xai-abcdef1234567890" },
          },
        },
      };
      const fs = createMockFs({
        "/base/openclaw.json": JSON.stringify(cfg),
      });
      const secrets = detectSecrets({
        fs,
        baseDir: "/base",
        configFiles: ["openclaw.json"],
        envFiles: [],
      });
      const ghp = secrets.find((s) => s.source === "value-prefix");
      const xai = secrets.find(
        (s) => s.configPath === "models.providers.xai.apiKey",
      );
      expect(ghp).toBeDefined();
      expect(ghp.confidence).toBe("high");
      expect(xai?.suggestedEnvVar).toBe("XAI_API_KEY");
    });

    it("skips values that are already env var references", () => {
      const cfg = {
        channels: {
          telegram: { botToken: "${TELEGRAM_BOT_TOKEN}" },
        },
      };
      const fs = createMockFs({
        "/base/openclaw.json": JSON.stringify(cfg),
      });
      const secrets = detectSecrets({
        fs,
        baseDir: "/base",
        configFiles: ["openclaw.json"],
        envFiles: [],
      });
      expect(secrets.length).toBe(0);
    });

    it("parses .env files", () => {
      const fs = createMockFs({
        "/base/.env": "ANTHROPIC_API_KEY=sk-ant-abc123\nMODEL=claude-3\n",
      });
      const secrets = detectSecrets({
        fs,
        baseDir: "/base",
        configFiles: [],
        envFiles: [".env"],
      });
      expect(secrets.length).toBe(2);
      expect(secrets[0].suggestedEnvVar).toBe("ANTHROPIC_API_KEY");
      expect(secrets[0].source).toBe("env-file");
    });

    it("detects duplicates across config and env", () => {
      const cfg = {
        models: {
          providers: {
            anthropic: { apiKey: "sk-ant-shared-value" },
          },
        },
      };
      const fs = createMockFs({
        "/base/openclaw.json": JSON.stringify(cfg),
        "/base/.env": "ANTHROPIC_API_KEY=sk-ant-shared-value\n",
      });
      const secrets = detectSecrets({
        fs,
        baseDir: "/base",
        configFiles: ["openclaw.json"],
        envFiles: [".env"],
      });
      const anthropic = secrets.find(
        (s) => s.suggestedEnvVar === "ANTHROPIC_API_KEY",
      );
      expect(anthropic).toBeDefined();
      expect(anthropic.duplicateIn).toBe(".env");
    });

    it("drops gateway.auth.token", () => {
      const cfg = {
        gateway: { auth: { token: "some-gateway-token-value" } },
      };
      const fs = createMockFs({
        "/base/openclaw.json": JSON.stringify(cfg),
      });
      const secrets = detectSecrets({
        fs,
        baseDir: "/base",
        configFiles: ["openclaw.json"],
        envFiles: [],
      });
      const gw = secrets.find((s) => s.configPath === "gateway.auth.token");
      expect(gw).toBeUndefined();
    });

    it("drops hooks.token because import normalizes it to WEBHOOK_TOKEN", () => {
      const cfg = {
        hooks: { token: "some-webhook-token-value" },
      };
      const fs = createMockFs({
        "/base/openclaw.json": JSON.stringify(cfg),
      });
      const secrets = detectSecrets({
        fs,
        baseDir: "/base",
        configFiles: ["openclaw.json"],
        envFiles: [],
      });
      const webhook = secrets.find((s) => s.configPath === "hooks.token");
      expect(webhook).toBeUndefined();
    });
  });

  describe("extractPreFillValues", () => {
    it("extracts model, channel tokens, and provider keys", () => {
      const cfg = {
        models: {
          active: "anthropic/claude-sonnet-4-20250514",
          providers: {
            anthropic: { apiKey: "sk-ant-abc" },
          },
        },
        channels: {
          telegram: { botToken: "123:AAH" },
          discord: { token: "MTQ3xyz" },
        },
        tools: {
          web: { search: { apiKey: "BSAabc" } },
        },
      };
      const fs = createMockFs({
        "/base/openclaw.json": JSON.stringify(cfg),
      });
      const preFill = extractPreFillValues({
        fs,
        baseDir: "/base",
        configFiles: ["openclaw.json"],
      });
      expect(preFill.MODEL_KEY).toBe("anthropic/claude-sonnet-4-20250514");
      expect(preFill.ANTHROPIC_API_KEY).toBe("sk-ant-abc");
      expect(preFill.TELEGRAM_BOT_TOKEN).toBe("123:AAH");
      expect(preFill.DISCORD_BOT_TOKEN).toBe("MTQ3xyz");
      expect(preFill.BRAVE_API_KEY).toBe("BSAabc");
    });

    it("skips values that are env var references", () => {
      const cfg = {
        channels: {
          telegram: { botToken: "${TELEGRAM_BOT_TOKEN}" },
        },
      };
      const fs = createMockFs({
        "/base/openclaw.json": JSON.stringify(cfg),
      });
      const preFill = extractPreFillValues({
        fs,
        baseDir: "/base",
        configFiles: ["openclaw.json"],
      });
      expect(preFill.TELEGRAM_BOT_TOKEN).toBeUndefined();
    });

    it("reads channel prefill values from standalone channel config files", () => {
      const fs = createMockFs({
        "/base/channels.json": JSON.stringify({
          discord: { token: "MTQ3xyz" },
        }),
      });
      const preFill = extractPreFillValues({
        fs,
        baseDir: "/base",
        configFiles: ["channels.json"],
      });
      expect(preFill.DISCORD_BOT_TOKEN).toBe("MTQ3xyz");
    });
  });

  describe("parseEnvFileSecrets", () => {
    it("parses key=value lines", () => {
      const content = "FOO=bar\n# comment\nBAZ=qux\n";
      const secrets = parseEnvFileSecrets(content, ".env");
      expect(secrets.length).toBe(2);
      expect(secrets[0].key).toBe("FOO");
      expect(secrets[0].value).toBe("bar");
      expect(secrets[1].key).toBe("BAZ");
    });

    it("skips empty lines and comments", () => {
      const content = "\n# header\n\nKEY=value\n";
      const secrets = parseEnvFileSecrets(content, ".env");
      expect(secrets.length).toBe(1);
    });
  });
});
