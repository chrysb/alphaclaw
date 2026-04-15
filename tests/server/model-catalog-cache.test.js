const fs = require("fs");
const os = require("os");
const path = require("path");

const {
  createModelCatalogCache,
  kDefaultCachePath,
  kDefaultCacheReadPaths,
  kLegacyCachePath,
  kModelCatalogRefreshBackoffMs,
  normalizeCacheEntry,
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

const writeCacheFile = ({ cachePath, fetchedAt = 1000, models = [] }) => {
  fs.mkdirSync(path.dirname(cachePath), { recursive: true });
  fs.writeFileSync(
    cachePath,
    `${JSON.stringify({ version: 1, fetchedAt, models }, null, 2)}\n`,
    "utf8",
  );
};

describe("server/model-catalog-cache", () => {
  afterEach(() => {
    vi.useRealTimers();
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
    expect(written.models).toEqual(
      normalizeModels([{ key: "openai/gpt-fresh", name: "Fresh" }]),
    );
  });

  it("normalizes OpenClaw-shaped cache entries using provider/id keys", () => {
    const entry = normalizeCacheEntry({
      raw: {
        models: [{ provider: "openai", id: "gpt-cached", name: "Cached" }],
      },
      fallbackFetchedAt: 333,
      normalizeOnboardingModels: normalizeModels,
    });

    expect(entry).toEqual({
      version: 1,
      fetchedAt: 333,
      models: normalizeModels([{ key: "openai/gpt-cached", name: "Cached" }]),
    });
  });

  it("accepts raw array cache files using the file timestamp as fetchedAt", () => {
    const entry = normalizeCacheEntry({
      raw: [{ provider: "openai", id: "gpt-array", name: "Array" }],
      fallbackFetchedAt: 444,
      normalizeOnboardingModels: normalizeModels,
    });

    expect(entry).toEqual({
      version: 1,
      fetchedAt: 444,
      models: normalizeModels([{ key: "openai/gpt-array", name: "Array" }]),
    });
  });

  it("reads legacy cache files and writes refreshed data to the primary cache path", async () => {
    const tempRoot = fs.mkdtempSync(
      path.join(os.tmpdir(), "alphaclaw-model-catalog-legacy-"),
    );
    const primaryCachePath = path.join(
      tempRoot,
      ".openclaw",
      "cache",
      "model-catalog.json",
    );
    const legacyCachePath = path.join(tempRoot, "cache", "model-catalog.json");
    writeCacheFile({
      cachePath: legacyCachePath,
      fetchedAt: 555,
      models: [{ provider: "openai", id: "gpt-legacy", name: "Legacy" }],
    });

    const shellCmd = vi.fn().mockResolvedValue("{}");
    const parseJsonFromNoisyOutput = vi.fn(() => ({
      models: [{ key: "openai/gpt-primary", name: "Primary" }],
    }));
    const cache = createModelCatalogCache({
      cachePath: primaryCachePath,
      cacheReadPaths: [primaryCachePath, legacyCachePath],
      shellCmd,
      parseJsonFromNoisyOutput,
      normalizeOnboardingModels: normalizeModels,
    });

    const cached = await cache.getCatalogResponse();

    expect(cached).toEqual({
      ok: true,
      source: "cache",
      fetchedAt: 555,
      stale: true,
      refreshing: true,
      models: normalizeModels([{ key: "openai/gpt-legacy", name: "Legacy" }]),
    });

    await flushPromises();
    expect(fs.existsSync(primaryCachePath)).toBe(true);
    const written = JSON.parse(fs.readFileSync(primaryCachePath, "utf8"));
    expect(written.models).toEqual(
      normalizeModels([{ key: "openai/gpt-primary", name: "Primary" }]),
    );
  });

  it("keeps the default cache under .openclaw and reads the previous root cache path", () => {
    expect(kDefaultCachePath).toContain(
      `${path.sep}.openclaw${path.sep}cache${path.sep}model-catalog.json`,
    );
    expect(kDefaultCacheReadPaths).toContain(kDefaultCachePath);
    expect(kDefaultCacheReadPaths).toContain(kLegacyCachePath);
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

  it("returns fallback immediately on cold cache and refreshes in the background", async () => {
    const tempRoot = fs.mkdtempSync(
      path.join(os.tmpdir(), "alphaclaw-model-catalog-cold-"),
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
      models: [{ key: "openai/gpt-fresh", name: "Fresh" }],
    }));
    const cache = createModelCatalogCache({
      cachePath,
      shellCmd,
      parseJsonFromNoisyOutput,
      normalizeOnboardingModels: normalizeModels,
    });

    const response = await cache.getCatalogResponse();

    expect(response).toEqual({
      ok: true,
      source: "fallback",
      fetchedAt: null,
      stale: false,
      refreshing: true,
      models: kFallbackOnboardingModels,
    });
    expect(shellCmd).toHaveBeenCalledTimes(1);

    const secondResponse = await cache.getCatalogResponse();
    expect(secondResponse.source).toBe("fallback");
    expect(secondResponse.refreshing).toBe(true);
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
  });

  it("falls back when no cache exists and the CLI load fails", async () => {
    const tempRoot = fs.mkdtempSync(
      path.join(os.tmpdir(), "alphaclaw-model-catalog-fallback-"),
    );
    const cachePath = path.join(tempRoot, "cache", "model-catalog.json");
    const shellCmd = vi.fn().mockRejectedValue(new Error("boom"));
    const cache = createModelCatalogCache({
      cachePath,
      shellCmd,
      parseJsonFromNoisyOutput: vi.fn(() => ({})),
      normalizeOnboardingModels: normalizeModels,
    });

    const response = await cache.getCatalogResponse();

    expect(response).toEqual({
      ok: true,
      source: "fallback",
      fetchedAt: null,
      stale: false,
      refreshing: true,
      models: kFallbackOnboardingModels,
    });
    expect(shellCmd).toHaveBeenCalledTimes(1);

    await flushPromises();
  });
});
