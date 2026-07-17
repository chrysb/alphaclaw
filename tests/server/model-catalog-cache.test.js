const fs = require("fs");
const os = require("os");
const path = require("path");

const {
  createModelCatalogCache,
  kModelCatalogBootstrapSource,
  kModelCatalogRefreshBackoffMs,
} = require("../../lib/server/model-catalog-cache");
const { kFallbackOnboardingModels } = require("../../lib/server/constants");

const flushPromises = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

const normalizeModels = (models = []) =>
  (Array.isArray(models) ? models : [])
    .filter((model) => model?.key)
    .map((model) => ({
      key: model.key,
      provider: String(model.key).split("/")[0] || "",
      label: model.name || model.label || model.key,
    }));

const writeCacheFile = ({
  cachePath,
  fetchedAt = 1000,
  openclawVersion = null,
  models = [],
}) => {
  fs.mkdirSync(path.dirname(cachePath), { recursive: true });
  fs.writeFileSync(
    cachePath,
    `${JSON.stringify(
      { version: 2, fetchedAt, openclawVersion, models },
      null,
      2,
    )}\n`,
    "utf8",
  );
};

describe("server/model-catalog-cache", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("ships a full bootstrap model catalog for cold starts", () => {
    expect(kFallbackOnboardingModels.length).toBeGreaterThan(100);
    expect(kFallbackOnboardingModels).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "anthropic/claude-opus-4-7",
          label: "Claude Opus 4.7",
        }),
      ]),
    );
  });

  it("returns cached models immediately and shares a single in-flight refresh", async () => {
    const tempRoot = fs.mkdtempSync(
      path.join(os.tmpdir(), "alphaclaw-model-catalog-cache-"),
    );
    const cachePath = path.join(tempRoot, "cache", "model-catalog.json");
    writeCacheFile({
      cachePath,
      fetchedAt: 111,
      models: normalizeModels([{ key: "openai/gpt-cached", label: "Cached" }]),
    });

    let resolveShell;
    const shellCmd = vi.fn(
      () =>
        new Promise((resolve) => {
          resolveShell = resolve;
        }),
    );
    const parseJsonFromNoisyOutput = vi.fn(() => ({
      models: [{ key: "openai/gpt-fresh", name: "Fresh" }],
    }));
    const cache = createModelCatalogCache({
      cachePath,
      shellCmd,
      gatewayEnv: () => ({ OPENCLAW_GATEWAY_TOKEN: "token" }),
      parseJsonFromNoisyOutput,
      normalizeOnboardingModels: normalizeModels,
      readOpenclawVersion: vi.fn(() => "2026.4.14"),
    });

    const first = await cache.getCatalogResponse();
    const second = await cache.getCatalogResponse();

    expect(first).toEqual({
      ok: true,
      source: "cache",
      fetchedAt: 111,
      stale: true,
      refreshing: true,
      models: normalizeModels([{ key: "openai/gpt-cached", label: "Cached" }]),
    });
    expect(second.source).toBe("cache");
    expect(second.refreshing).toBe(true);
    expect(shellCmd).toHaveBeenCalledTimes(1);

    resolveShell("{}");
    await flushPromises();

    const fresh = await cache.getCatalogResponse();
    expect(fresh).toEqual({
      ok: true,
      source: "openclaw",
      fetchedAt: expect.any(Number),
      stale: false,
      refreshing: false,
      models: normalizeModels([{ key: "openai/gpt-fresh", name: "Fresh" }]),
    });
    const written = JSON.parse(fs.readFileSync(cachePath, "utf8"));
    expect(written.openclawVersion).toBe("2026.4.14");
    expect(written.models).toEqual(
      normalizeModels([{ key: "openai/gpt-fresh", name: "Fresh" }]),
    );
  });

  it("bootstraps with the bundled catalog while the initial catalog loads in the background", async () => {
    const tempRoot = fs.mkdtempSync(
      path.join(os.tmpdir(), "alphaclaw-model-catalog-bootstrap-"),
    );
    const cachePath = path.join(tempRoot, "cache", "model-catalog.json");

    let resolveShell;
    const shellCmd = vi.fn(
      () =>
        new Promise((resolve) => {
          resolveShell = resolve;
        }),
    );
    const parseJsonFromNoisyOutput = vi.fn(() => ({
      models: [{ key: "anthropic/claude-opus-4-7", name: "Claude Opus 4.7" }],
    }));
    const cache = createModelCatalogCache({
      cachePath,
      shellCmd,
      parseJsonFromNoisyOutput,
      normalizeOnboardingModels: normalizeModels,
      readOpenclawVersion: vi.fn(() => "2026.4.15"),
    });

    const initial = await cache.getCatalogResponse();
    const repeated = await cache.getCatalogResponse();

    expect(initial).toEqual({
      ok: true,
      source: kModelCatalogBootstrapSource,
      fetchedAt: null,
      stale: true,
      refreshing: true,
      models: kFallbackOnboardingModels,
    });
    expect(repeated.source).toBe(kModelCatalogBootstrapSource);
    expect(repeated.refreshing).toBe(true);
    expect(shellCmd).toHaveBeenCalledTimes(1);

    resolveShell("{}");
    await flushPromises();

    const fresh = await cache.getCatalogResponse();
    expect(fresh).toEqual({
      ok: true,
      source: "openclaw",
      fetchedAt: expect.any(Number),
      stale: false,
      refreshing: false,
      models: normalizeModels([
        { key: "anthropic/claude-opus-4-7", name: "Claude Opus 4.7" },
      ]),
    });
  });

  it("serves the bundled catalog without refreshing when dynamic refresh is disabled", async () => {
    const tempRoot = fs.mkdtempSync(
      path.join(os.tmpdir(), "alphaclaw-model-catalog-bootstrap-only-"),
    );
    const cachePath = path.join(tempRoot, "cache", "model-catalog.json");
    const shellCmd = vi.fn().mockResolvedValue("{}");
    const cache = createModelCatalogCache({
      cachePath,
      shellCmd,
      normalizeOnboardingModels: normalizeModels,
      shouldStartDynamicRefresh: () => false,
    });

    const initial = await cache.getCatalogResponse();
    const repeated = await cache.getCatalogResponse();

    expect(initial).toEqual({
      ok: true,
      source: kModelCatalogBootstrapSource,
      fetchedAt: null,
      stale: true,
      refreshing: false,
      models: kFallbackOnboardingModels,
    });
    expect(repeated.refreshing).toBe(false);
    expect(shellCmd).not.toHaveBeenCalled();
  });

  it("serves stale disk cache without refreshing when dynamic refresh is disabled", async () => {
    const tempRoot = fs.mkdtempSync(
      path.join(os.tmpdir(), "alphaclaw-model-catalog-cache-only-"),
    );
    const cachePath = path.join(tempRoot, "cache", "model-catalog.json");
    writeCacheFile({
      cachePath,
      fetchedAt: 333,
      models: normalizeModels([{ key: "anthropic/claude-opus-4-7" }]),
    });
    const shellCmd = vi.fn().mockResolvedValue("{}");
    const cache = createModelCatalogCache({
      cachePath,
      shellCmd,
      normalizeOnboardingModels: normalizeModels,
      shouldStartDynamicRefresh: () => false,
    });

    const response = await cache.getCatalogResponse();

    expect(response).toEqual({
      ok: true,
      source: "cache",
      fetchedAt: 333,
      stale: true,
      refreshing: false,
      models: normalizeModels([{ key: "anthropic/claude-opus-4-7" }]),
    });
    expect(shellCmd).not.toHaveBeenCalled();
  });

  it("marks a fresh memory cache stale when the openclaw version changes", async () => {
    const tempRoot = fs.mkdtempSync(
      path.join(os.tmpdir(), "alphaclaw-model-catalog-version-bust-"),
    );
    const cachePath = path.join(tempRoot, "cache", "model-catalog.json");

    let currentVersion = "2026.4.14";
    let resolveRefresh;
    const shellCmd = vi
      .fn()
      .mockResolvedValueOnce("{}")
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveRefresh = resolve;
          }),
      );
    const parseJsonFromNoisyOutput = vi
      .fn()
      .mockReturnValueOnce({
        models: [{ key: "anthropic/claude-opus-4-6", name: "Claude Opus 4.6" }],
      })
      .mockReturnValueOnce({
        models: [{ key: "anthropic/claude-opus-4-7", name: "Claude Opus 4.7" }],
      });
    const readOpenclawVersion = vi.fn(({ refresh } = {}) =>
      refresh ? currentVersion : currentVersion,
    );
    const cache = createModelCatalogCache({
      cachePath,
      shellCmd,
      parseJsonFromNoisyOutput,
      normalizeOnboardingModels: normalizeModels,
      readOpenclawVersion,
    });

    const bootstrap = await cache.getCatalogResponse();
    expect(bootstrap).toEqual({
      ok: true,
      source: kModelCatalogBootstrapSource,
      fetchedAt: null,
      stale: true,
      refreshing: true,
      models: kFallbackOnboardingModels,
    });
    await flushPromises();

    const initial = await cache.getCatalogResponse();
    expect(initial).toEqual({
      ok: true,
      source: "openclaw",
      fetchedAt: expect.any(Number),
      stale: false,
      refreshing: false,
      models: normalizeModels([
        { key: "anthropic/claude-opus-4-6", name: "Claude Opus 4.6" },
      ]),
    });

    currentVersion = "2026.4.15";

    const stale = await cache.getCatalogResponse();
    expect(stale).toEqual({
      ok: true,
      source: "cache",
      fetchedAt: expect.any(Number),
      stale: true,
      refreshing: true,
      models: normalizeModels([
        { key: "anthropic/claude-opus-4-6", name: "Claude Opus 4.6" },
      ]),
    });
    expect(shellCmd).toHaveBeenCalledTimes(2);

    resolveRefresh("{}");
    await flushPromises();

    const refreshed = await cache.getCatalogResponse();
    expect(refreshed).toEqual({
      ok: true,
      source: "openclaw",
      fetchedAt: expect.any(Number),
      stale: false,
      refreshing: false,
      models: normalizeModels([
        { key: "anthropic/claude-opus-4-7", name: "Claude Opus 4.7" },
      ]),
    });

    const written = JSON.parse(fs.readFileSync(cachePath, "utf8"));
    expect(written.openclawVersion).toBe("2026.4.15");
  });

  it("keeps serving cache after refresh failures and retries after backoff", async () => {
    vi.useFakeTimers();
    const tempRoot = fs.mkdtempSync(
      path.join(os.tmpdir(), "alphaclaw-model-catalog-backoff-"),
    );
    const cachePath = path.join(tempRoot, "cache", "model-catalog.json");
    writeCacheFile({
      cachePath,
      fetchedAt: 222,
      openclawVersion: "2026.4.14",
      models: normalizeModels([{ key: "openai/gpt-cached", label: "Cached" }]),
    });

    const shellCmd = vi
      .fn()
      .mockRejectedValueOnce(new Error("boom"))
      .mockResolvedValueOnce("{}");
    const parseJsonFromNoisyOutput = vi.fn(() => ({
      models: [{ key: "openai/gpt-retried", name: "Retried" }],
    }));
    const cache = createModelCatalogCache({
      cachePath,
      shellCmd,
      parseJsonFromNoisyOutput,
      normalizeOnboardingModels: normalizeModels,
      readOpenclawVersion: vi.fn(() => "2026.4.14"),
      setTimeoutFn: setTimeout,
      clearTimeoutFn: clearTimeout,
    });

    const cached = await cache.getCatalogResponse();
    expect(cached.source).toBe("cache");
    expect(cached.refreshing).toBe(true);
    expect(shellCmd).toHaveBeenCalledTimes(1);

    await flushPromises();

    const afterFailure = await cache.getCatalogResponse();
    expect(afterFailure).toEqual({
      ok: true,
      source: "cache",
      fetchedAt: 222,
      stale: true,
      refreshing: true,
      models: normalizeModels([{ key: "openai/gpt-cached", label: "Cached" }]),
    });

    await vi.advanceTimersByTimeAsync(kModelCatalogRefreshBackoffMs - 1);
    expect(shellCmd).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(1);
    await flushPromises();
    expect(shellCmd).toHaveBeenCalledTimes(2);

    const fresh = await cache.getCatalogResponse();
    expect(fresh).toEqual({
      ok: true,
      source: "openclaw",
      fetchedAt: expect.any(Number),
      stale: false,
      refreshing: false,
      models: normalizeModels([{ key: "openai/gpt-retried", name: "Retried" }]),
    });
  });

  it("recovers model catalog JSON from failed command output", async () => {
    const tempRoot = fs.mkdtempSync(
      path.join(os.tmpdir(), "alphaclaw-model-catalog-recover-"),
    );
    const cachePath = path.join(tempRoot, "cache", "model-catalog.json");
    const err = new Error("plugin load failed");
    err.stdout =
      'prefix\n{"models":[{"key":"anthropic/claude-opus-4-7","name":"Claude Opus 4.7"}]}\n';
    err.stderr =
      '[plugins] google failed to load from /app/node_modules/openclaw/dist/extensions/google/index.js';
    const shellCmd = vi.fn().mockRejectedValue(err);
    const parseJsonFromNoisyOutput = vi.fn((raw) =>
      String(raw).includes('"models"')
        ? {
            models: [
              {
                key: "anthropic/claude-opus-4-7",
                name: "Claude Opus 4.7",
              },
            ],
          }
        : null,
    );
    const logger = { error: vi.fn(), warn: vi.fn() };
    const cache = createModelCatalogCache({
      cachePath,
      shellCmd,
      parseJsonFromNoisyOutput,
      normalizeOnboardingModels: normalizeModels,
      readOpenclawVersion: vi.fn(() => "2026.4.24"),
      logger,
    });

    const bootstrap = await cache.getCatalogResponse();
    expect(bootstrap).toEqual({
      ok: true,
      source: kModelCatalogBootstrapSource,
      fetchedAt: null,
      stale: true,
      refreshing: true,
      models: kFallbackOnboardingModels,
    });
    await flushPromises();

    const response = await cache.getCatalogResponse();

    expect(response).toEqual({
      ok: true,
      source: "openclaw",
      fetchedAt: expect.any(Number),
      stale: false,
      refreshing: false,
      models: normalizeModels([
        { key: "anthropic/claude-opus-4-7", name: "Claude Opus 4.7" },
      ]),
    });
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining("Recovered model catalog from failed command output"),
    );
  });

  it("serves the bundled catalog when no cache exists and retries after backoff", async () => {
    vi.useFakeTimers();
    const tempRoot = fs.mkdtempSync(
      path.join(os.tmpdir(), "alphaclaw-model-catalog-fallback-"),
    );
    const cachePath = path.join(tempRoot, "cache", "model-catalog.json");
    const shellCmd = vi
      .fn()
      .mockRejectedValueOnce(new Error("boom"))
      .mockResolvedValueOnce("{}");
    const parseJsonFromNoisyOutput = vi.fn(() => ({
      models: [{ key: "anthropic/claude-opus-4-7", name: "Claude Opus 4.7" }],
    }));
    const cache = createModelCatalogCache({
      cachePath,
      shellCmd,
      parseJsonFromNoisyOutput,
      normalizeOnboardingModels: normalizeModels,
      readOpenclawVersion: vi.fn(() => "2026.4.14"),
      setTimeoutFn: setTimeout,
      clearTimeoutFn: clearTimeout,
    });

    const response = await cache.getCatalogResponse();

    expect(response).toEqual({
      ok: true,
      source: kModelCatalogBootstrapSource,
      fetchedAt: null,
      stale: true,
      refreshing: true,
      models: kFallbackOnboardingModels,
    });
    expect(shellCmd).toHaveBeenCalledTimes(1);

    await flushPromises();

    await vi.advanceTimersByTimeAsync(kModelCatalogRefreshBackoffMs - 1);
    expect(shellCmd).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(1);
    await flushPromises();
    expect(shellCmd).toHaveBeenCalledTimes(2);

    const fresh = await cache.getCatalogResponse();
    expect(fresh).toEqual({
      ok: true,
      source: "openclaw",
      fetchedAt: expect.any(Number),
      stale: false,
      refreshing: false,
      models: normalizeModels([
        { key: "anthropic/claude-opus-4-7", name: "Claude Opus 4.7" },
      ]),
    });
  });
});
