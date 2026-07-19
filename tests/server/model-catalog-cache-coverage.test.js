const fs = require("fs");
const os = require("os");
const path = require("path");

const {
  createModelCatalogCache,
  normalizeCachedModels,
  normalizeCacheEntry,
  kModelCatalogCacheVersion,
} = require("../../lib/server/model-catalog-cache");

const flushPromises = async () => {
  for (let i = 0; i < 8; i += 1) {
    await Promise.resolve();
  }
};

const makeTempCachePath = () =>
  path.join(
    fs.mkdtempSync(path.join(os.tmpdir(), "alphaclaw-model-cache-cov-")),
    "cache",
    "model-catalog.json",
  );

const writeCacheFile = ({
  cachePath,
  fetchedAt = 1000,
  openclawVersion = null,
  models = [],
}) => {
  fs.mkdirSync(path.dirname(cachePath), { recursive: true });
  fs.writeFileSync(
    cachePath,
    `${JSON.stringify({ version: 2, fetchedAt, openclawVersion, models })}\n`,
    "utf8",
  );
};

describe("server/model-catalog-cache coverage", () => {
  it("normalizes cached models with the default normalizer", () => {
    expect(normalizeCachedModels()).toEqual([]);
    expect(
      normalizeCachedModels({ models: [{ key: "openai/gpt", label: "GPT" }] }),
    ).toEqual([{ key: "openai/gpt", label: "GPT", name: "GPT" }]);
  });

  it("normalizes cache entries with the default normalizer and rejects invalid entries", () => {
    expect(normalizeCacheEntry()).toBeNull();
    expect(normalizeCacheEntry({ raw: [] })).toBeNull();
    expect(
      normalizeCacheEntry({ raw: { fetchedAt: 0, models: [{ key: "a" }] } }),
    ).toBeNull();
    expect(normalizeCacheEntry({ raw: { fetchedAt: 12, models: [] } })).toBeNull();
    expect(
      normalizeCacheEntry({
        raw: {
          fetchedAt: 12,
          openclawVersion: " 1.2.3 ",
          models: [{ key: "a", name: "A" }],
        },
      }),
    ).toEqual({
      version: kModelCatalogCacheVersion,
      fetchedAt: 12,
      openclawVersion: "1.2.3",
      models: [{ key: "a", name: "A" }],
    });
    expect(
      normalizeCacheEntry({
        raw: { fetchedAt: 12, openclawVersion: 42, models: [{ key: "a" }] },
      }).openclawVersion,
    ).toBeNull();
  });

  it("uses default parser hooks and logs when no models are found", async () => {
    const cachePath = makeTempCachePath();
    const logger = { error: vi.fn(), warn: vi.fn() };
    const cache = createModelCatalogCache({
      cachePath,
      shellCmd: async () => "{}",
      logger,
      setTimeoutFn: vi.fn(() => ({})),
      clearTimeoutFn: vi.fn(),
    });

    const response = await cache.getCatalogResponse();

    expect(response.source).toBe("bootstrap");
    await flushPromises();
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining("No models found"),
    );
  });

  it("treats openclaw version read failures as an unknown version", async () => {
    const cachePath = makeTempCachePath();
    const cache = createModelCatalogCache({
      cachePath,
      shellCmd: async () => "{}",
      parseJsonFromNoisyOutput: () => ({ models: [{ key: "openai/gpt" }] }),
      readOpenclawVersion: () => {
        throw new Error("no version");
      },
      setTimeoutFn: vi.fn(() => ({})),
      clearTimeoutFn: vi.fn(),
    });

    await cache.getCatalogResponse();
    await flushPromises();
    const fresh = await cache.getCatalogResponse();

    expect(fresh.source).toBe("openclaw");
    const written = JSON.parse(fs.readFileSync(cachePath, "utf8"));
    expect(written.openclawVersion).toBeNull();
  });

  it("clears pending retry timers when marked stale", async () => {
    const cachePath = makeTempCachePath();
    writeCacheFile({
      cachePath,
      fetchedAt: 50,
      openclawVersion: "1.0.0",
      models: [{ key: "openai/gpt", name: "GPT" }],
    });
    const timerHandle = { unref: vi.fn() };
    const setTimeoutFn = vi.fn(() => timerHandle);
    const clearTimeoutFn = vi.fn();
    const cache = createModelCatalogCache({
      cachePath,
      shellCmd: async () => {
        throw new Error("refresh failed");
      },
      readOpenclawVersion: () => "1.0.0",
      setTimeoutFn,
      clearTimeoutFn,
      logger: { error: vi.fn(), warn: vi.fn() },
    });

    const first = await cache.getCatalogResponse();
    expect(first.source).toBe("cache");
    await flushPromises();
    expect(setTimeoutFn).toHaveBeenCalledTimes(1);
    expect(timerHandle.unref).toHaveBeenCalled();

    cache.markStale();
    expect(clearTimeoutFn).toHaveBeenCalledWith(timerHandle);
  });

  it("treats shouldStartDynamicRefresh failures as not-onboarded", async () => {
    const cachePath = makeTempCachePath();
    const shellCmd = vi.fn();
    const cache = createModelCatalogCache({
      cachePath,
      shellCmd,
      shouldStartDynamicRefresh: () => {
        throw new Error("boom");
      },
    });

    const response = await cache.getCatalogResponse();

    expect(response.source).toBe("bootstrap");
    expect(response.refreshing).toBe(false);
    expect(shellCmd).not.toHaveBeenCalled();
  });

  it("skips retry scheduling when onboarding turns off mid-refresh and backs off later requests", async () => {
    const cachePath = makeTempCachePath();
    let canStart = true;
    const setTimeoutFn = vi.fn(() => ({}));
    const clearTimeoutFn = vi.fn();
    const cache = createModelCatalogCache({
      cachePath,
      shellCmd: async () => {
        throw new Error("refresh failed");
      },
      shouldStartDynamicRefresh: () => canStart,
      setTimeoutFn,
      clearTimeoutFn,
      logger: { error: vi.fn(), warn: vi.fn() },
    });

    await cache.getCatalogResponse();
    canStart = false;
    await flushPromises();
    // The failed refresh could not schedule a retry while onboarding was off.
    expect(setTimeoutFn).not.toHaveBeenCalled();

    canStart = true;
    const backedOff = await cache.getCatalogResponse();

    // Backoff window is still active, so a retry timer is scheduled instead
    // of an immediate refresh.
    expect(setTimeoutFn).toHaveBeenCalledTimes(1);
    expect(backedOff.source).toBe("bootstrap");
    expect(backedOff.refreshing).toBe(true);
  });
});
