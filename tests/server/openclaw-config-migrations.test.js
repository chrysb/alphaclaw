const {
  migrateLegacyTelegramStreamingConfig,
} = require("../../lib/server/openclaw-config-migrations");

describe("server/openclaw-config-migrations", () => {
  it("migrates legacy Telegram streaming fields to the OpenClaw 2026.6 shape", () => {
    const cfg = {
      channels: {
        telegram: {
          streaming: true,
          streamMode: "block",
          chunkMode: "newline",
          blockStreaming: true,
          blockStreamingCoalesce: { minChars: 200, maxChars: 800 },
          draftChunk: { minChars: 100, maxChars: 400 },
        },
      },
    };

    expect(migrateLegacyTelegramStreamingConfig(cfg)).toBe(true);
    expect(cfg.channels.telegram).toEqual({
      streaming: {
        mode: "partial",
        chunkMode: "newline",
        preview: { chunk: { minChars: 100, maxChars: 400 } },
        block: {
          enabled: true,
          coalesce: { minChars: 200, maxChars: 800 },
        },
      },
    });
  });

  it("migrates account-level config and maps disabled streaming to off", () => {
    const cfg = {
      channels: {
        telegram: {
          accounts: {
            personal: {
              streaming: false,
              draftChunk: { breakPreference: "sentence" },
            },
          },
        },
      },
    };

    expect(migrateLegacyTelegramStreamingConfig(cfg)).toBe(true);
    expect(cfg.channels.telegram.accounts.personal).toEqual({
      streaming: {
        mode: "off",
        preview: { chunk: { breakPreference: "sentence" } },
      },
    });
  });

  it("preserves explicit modern values while removing stale aliases", () => {
    const cfg = {
      channels: {
        telegram: {
          streaming: {
            mode: "progress",
            chunkMode: "length",
            block: { enabled: false },
          },
          streamMode: "partial",
          chunkMode: "newline",
          blockStreaming: true,
        },
      },
    };

    expect(migrateLegacyTelegramStreamingConfig(cfg)).toBe(true);
    expect(cfg.channels.telegram).toEqual({
      streaming: {
        mode: "progress",
        chunkMode: "length",
        block: { enabled: false },
      },
    });
  });

  it("is idempotent for already-modern config", () => {
    const cfg = {
      channels: { telegram: { streaming: { mode: "partial" } } },
    };

    expect(migrateLegacyTelegramStreamingConfig(cfg)).toBe(false);
    expect(migrateLegacyTelegramStreamingConfig(cfg)).toBe(false);
  });
});
