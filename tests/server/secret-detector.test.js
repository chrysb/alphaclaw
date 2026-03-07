const {
  detectSecrets,
  extractPreFillValues,
  isSensitiveKey,
  matchesValuePrefix,
  maskValue,
  parseEnvFileSecrets,
} = require("../../lib/server/onboarding/secret-detector");

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

    it("detects secrets by value prefix", () => {
      const cfg = {
        custom: { myField: "ghp_abcdef1234567890123456" },
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
      expect(ghp).toBeDefined();
      expect(ghp.confidence).toBe("high");
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
