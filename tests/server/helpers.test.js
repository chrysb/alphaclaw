const fs = require("fs");
const crypto = require("crypto");

const {
  parseJsonFromNoisyOutput,
  parseJwtPayload,
  getCodexAccountId,
  getClientKey,
  resolveGithubRepoUrl,
  normalizeOnboardingModels,
  compareVersionParts,
  isDebugEnabled,
  createPkcePair,
  parseCodexAuthorizationInput,
  getBaseUrl,
  getApiEnableUrl,
  readGoogleCredentials,
  isSensitiveKey,
  buildSecretReplacements,
} = require("../../lib/server/helpers");
const {
  CODEX_JWT_CLAIM_PATH,
  gogClientCredentialsPath,
} = require("../../lib/server/constants");

const makeJwt = (payload) => {
  const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString(
    "base64url",
  );
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${header}.${body}.sig`;
};

describe("server/helpers", () => {
  it("parses JSON from noisy command output", () => {
    const value = parseJsonFromNoisyOutput('log line\n{"ok":true,"count":2}\nextra');
    expect(value).toEqual({ ok: true, count: 2 });
  });

  it("returns null when noisy output has no valid JSON", () => {
    expect(parseJsonFromNoisyOutput("no braces here")).toBeNull();
    expect(parseJsonFromNoisyOutput("start {bad json} end")).toBeNull();
  });

  it("normalizes GitHub repository URLs and shorthands", () => {
    expect(resolveGithubRepoUrl("owner/repo")).toBe("owner/repo");
    expect(resolveGithubRepoUrl("git@github.com:owner/repo.git")).toBe("owner/repo");
    expect(resolveGithubRepoUrl("https://github.com/owner/repo")).toBe("owner/repo");
  });

  it("throws when repo input is not owner/repo format", () => {
    expect(() => resolveGithubRepoUrl("just-owner")).toThrow(
      'GITHUB_WORKSPACE_REPO must be in "owner/repo" format.',
    );
  });

  it("parses JWT payload and extracts Codex account id", () => {
    const token = makeJwt({
      [CODEX_JWT_CLAIM_PATH]: { chatgpt_account_id: "acct_123" },
      sub: "abc",
    });

    const payload = parseJwtPayload(token);
    expect(payload.sub).toBe("abc");
    expect(getCodexAccountId(token)).toBe("acct_123");
  });

  it("returns null for invalid JWT payloads", () => {
    expect(parseJwtPayload("bad.token")).toBeNull();
    expect(getCodexAccountId("bad.token.value")).toBeNull();
  });

  it("does not use raw x-forwarded-for as the client key fallback", () => {
    const key = getClientKey({
      headers: { "x-forwarded-for": "203.0.113.10" },
      socket: { remoteAddress: "::ffff:127.0.0.1" },
    });

    expect(key).toBe("127.0.0.1");
  });

  it("normalizes onboarding models by filtering, deduping, and sorting", () => {
    const normalized = normalizeOnboardingModels([
      { key: "unknown/model-a", name: "Ignore me" },
      { key: "openai/gpt-5.1-codex", name: "OpenAI A" },
      { key: "codex/gpt-5.4-mini", name: "GPT-5.4-Mini" },
      { key: "anthropic/claude-opus-4-6", name: "Opus 4.6" },
      { key: "zai/glm-5", name: "GLM 5" },
      { key: "minimax/MiniMax-M2.5", name: "MiniMax M2.5" },
      { key: "openai/gpt-5.1-codex", name: "Duplicate" },
      { key: "google/gemini-3.1-pro-preview" },
      { bad: "shape" },
    ]);

    expect(normalized).toEqual([
      {
        key: "anthropic/claude-opus-4-6",
        provider: "anthropic",
        label: "Opus 4.6",
      },
      {
        key: "google/gemini-3.1-pro-preview",
        provider: "google",
        label: "google/gemini-3.1-pro-preview",
      },
      {
        key: "minimax/MiniMax-M2.5",
        provider: "minimax",
        label: "MiniMax M2.5",
      },
      {
        key: "openai/gpt-5.1-codex",
        provider: "openai",
        label: "OpenAI A",
      },
      {
        key: "openai/gpt-5.4-mini",
        provider: "openai",
        label: "GPT-5.4-Mini",
        agentRuntime: { id: "codex" },
      },
      {
        key: "zai/glm-5",
        provider: "zai",
        label: "GLM 5",
      },
    ]);
  });

  it("compares version parts including equal versions", () => {
    expect(compareVersionParts("1.2.3", "1.2.3")).toBe(0);
    expect(compareVersionParts("1.2", "1.2.0")).toBe(0);
    expect(compareVersionParts("1.3.0", "1.2.9")).toBe(1);
    expect(compareVersionParts("1.2.3", "1.10.0")).toBe(-1);
  });

  it("reads debug mode from environment flags", () => {
    const previousAlphaclawDebug = process.env.ALPHACLAW_DEBUG;
    const previousDebug = process.env.DEBUG;
    try {
      delete process.env.ALPHACLAW_DEBUG;
      delete process.env.DEBUG;
      expect(isDebugEnabled()).toBe(false);

      process.env.DEBUG = "1";
      expect(isDebugEnabled()).toBe(true);

      delete process.env.DEBUG;
      process.env.ALPHACLAW_DEBUG = "true";
      expect(isDebugEnabled()).toBe(true);
    } finally {
      if (previousAlphaclawDebug === undefined) {
        delete process.env.ALPHACLAW_DEBUG;
      } else {
        process.env.ALPHACLAW_DEBUG = previousAlphaclawDebug;
      }
      if (previousDebug === undefined) {
        delete process.env.DEBUG;
      } else {
        process.env.DEBUG = previousDebug;
      }
    }
  });

  it("creates a PKCE verifier/challenge pair", () => {
    const { verifier, challenge } = createPkcePair();

    expect(verifier).toMatch(/^[A-Za-z0-9_-]{64}$/);
    expect(challenge).toBe(
      crypto.createHash("sha256").update(verifier).digest("base64url"),
    );
  });

  it("parses Codex authorization input in every supported shape", () => {
    expect(parseCodexAuthorizationInput("")).toEqual({});
    expect(
      parseCodexAuthorizationInput(
        "https://auth.example.com/callback?code=abc&state=st1",
      ),
    ).toEqual({ code: "abc", state: "st1" });
    expect(parseCodexAuthorizationInput("code-part#state-part")).toEqual({
      code: "code-part",
      state: "state-part",
    });
    expect(parseCodexAuthorizationInput("code=abc&state=st2")).toEqual({
      code: "abc",
      state: "st2",
    });
    expect(parseCodexAuthorizationInput("raw-authorization-code")).toEqual({
      code: "raw-authorization-code",
      state: "",
    });
  });

  it("builds base URLs from forwarded headers with fallbacks", () => {
    expect(
      getBaseUrl({
        headers: {
          "x-forwarded-proto": "https",
          "x-forwarded-host": "app.example.com",
        },
      }),
    ).toBe("https://app.example.com");
    expect(
      getBaseUrl({ headers: { host: "localhost:3000" }, protocol: "http" }),
    ).toBe("http://localhost:3000");
  });

  it("builds Google API enable URLs", () => {
    expect(getApiEnableUrl("gmail", "my-proj")).toBe(
      "https://console.developers.google.com/apis/api/gmail.googleapis.com/overview?project=my-proj",
    );
    expect(getApiEnableUrl("unknown-service")).toBe(
      "https://console.developers.google.com/apis/api//overview",
    );
  });

  it("reads Google client credentials from disk", () => {
    vi.spyOn(fs, "readFileSync").mockReturnValueOnce(
      JSON.stringify({
        web: {
          client_id: "id-1",
          client_secret: "sec-1",
          project_id: "proj-1",
        },
      }),
    );

    expect(readGoogleCredentials("acme")).toEqual({
      clientId: "id-1",
      clientSecret: "sec-1",
      projectId: "proj-1",
      path: gogClientCredentialsPath("acme"),
      client: "acme",
    });
  });

  it("supports installed-style credentials and missing credential files", () => {
    const readSpy = vi
      .spyOn(fs, "readFileSync")
      .mockReturnValueOnce(
        JSON.stringify({
          installed: { client_id: "id-2", client_secret: "sec-2" },
        }),
      )
      .mockImplementationOnce(() => {
        throw new Error("ENOENT");
      });

    expect(readGoogleCredentials()).toEqual({
      clientId: "id-2",
      clientSecret: "sec-2",
      projectId: null,
      path: gogClientCredentialsPath("default"),
      client: "default",
    });
    expect(readGoogleCredentials("missing")).toEqual({
      clientId: null,
      clientSecret: null,
      projectId: null,
      path: gogClientCredentialsPath("missing"),
      client: "missing",
    });
    expect(readSpy).toHaveBeenCalledTimes(2);
  });

  it("detects sensitive environment keys", () => {
    expect(isSensitiveKey("GITHUB_TOKEN")).toBe(true);
    expect(isSensitiveKey("OPENAI_API_KEY")).toBe(true);
    expect(isSensitiveKey("DB_PASSWORD")).toBe(true);
    expect(isSensitiveKey("CLIENT_SECRET")).toBe(true);
    expect(isSensitiveKey("SIGNING_PRIVATE_KEY")).toBe(true);
    expect(isSensitiveKey("HOSTNAME")).toBe(false);
    expect(isSensitiveKey("")).toBe(false);
  });

  it("builds secret replacements sorted by value length with dedupe", () => {
    const replacements = buildSecretReplacements(
      {
        GITHUB_TOKEN: "tok-short",
        OPENAI_API_KEY: "sk-a-much-longer-secret-value",
        PLAIN_VALUE: "visible",
        EMPTY_TOKEN: "",
      },
      { DUPLICATE_TOKEN: "tok-short" },
      null,
    );

    expect(replacements).toEqual([
      ["sk-a-much-longer-secret-value", "${OPENAI_API_KEY}"],
      ["tok-short", "${GITHUB_TOKEN}"],
    ]);
  });
});
