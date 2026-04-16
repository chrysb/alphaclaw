const fs = require("fs");
const path = require("path");
const { ALPHACLAW_DIR, kFallbackOnboardingModels } = require("./constants");

const kModelCatalogCacheVersion = 1;
const kModelCatalogRefreshBackoffMs = 30 * 1000;
const kDefaultCachePath = path.join(ALPHACLAW_DIR, "cache", "model-catalog.json");

const createResponse = ({
  source = "fallback",
  fetchedAt = null,
  stale = false,
  refreshing = false,
  models = [],
} = {}) => ({
  ok: true,
  source,
  fetchedAt,
  stale,
  refreshing,
  models,
});

const normalizeCachedModels = ({
  models,
  normalizeOnboardingModels = (items) => items,
} = {}) =>
  normalizeOnboardingModels(
    (Array.isArray(models) ? models : []).map((model) => ({
      key: model?.key,
      name: model?.label || model?.name || model?.key,
    })),
  );

const normalizeCacheEntry = ({
  raw,
  normalizeOnboardingModels = (items) => items,
} = {}) => {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const fetchedAt = Number(raw.fetchedAt || 0);
  const models = normalizeCachedModels({
    models: raw.models,
    normalizeOnboardingModels,
  });
  if (!Number.isFinite(fetchedAt) || fetchedAt <= 0 || models.length === 0) {
    return null;
  }
  return {
    version: kModelCatalogCacheVersion,
    fetchedAt,
    models,
  };
};

const createModelCatalogCache = ({
  fsModule = fs,
  pathModule = path,
  shellCmd,
  gatewayEnv = () => ({}),
  parseJsonFromNoisyOutput = () => ({}),
  normalizeOnboardingModels = (items) => items,
  fallbackModels = kFallbackOnboardingModels,
  cachePath = kDefaultCachePath,
  refreshBackoffMs = kModelCatalogRefreshBackoffMs,
  now = () => Date.now(),
  setTimeoutFn = setTimeout,
  clearTimeoutFn = clearTimeout,
  logger = console,
} = {}) => {
  let cacheLoaded = false;
  let memoryCache = null;
  let cacheIsStale = false;
  let refreshPromise = null;
  let retryTimer = null;
  let backoffUntilMs = 0;

  const clearRetryTimer = () => {
    if (!retryTimer) return;
    clearTimeoutFn(retryTimer);
    retryTimer = null;
  };

  const isRefreshPending = () => !!refreshPromise || !!retryTimer;

  const setCacheEntry = (entry, { fresh = false } = {}) => {
    memoryCache = entry;
    cacheLoaded = true;
    cacheIsStale = !fresh;
    backoffUntilMs = 0;
    clearRetryTimer();
    return memoryCache;
  };

  const readDiskCache = () => {
    if (cacheLoaded) return memoryCache;
    cacheLoaded = true;
    try {
      const raw = JSON.parse(fsModule.readFileSync(cachePath, "utf8"));
      const entry = normalizeCacheEntry({
        raw,
        normalizeOnboardingModels,
      });
      if (!entry) return null;
      memoryCache = entry;
      cacheIsStale = true;
      return memoryCache;
    } catch {
      memoryCache = null;
      cacheIsStale = false;
      return null;
    }
  };

  const writeDiskCache = (entry) => {
    fsModule.mkdirSync(pathModule.dirname(cachePath), { recursive: true });
    fsModule.writeFileSync(
      cachePath,
      `${JSON.stringify(entry, null, 2)}\n`,
      "utf8",
    );
  };

  const loadFreshCatalog = async () => {
    const output = await shellCmd("openclaw models list --all --json", {
      env: gatewayEnv(),
      timeout: 30000,
    });
    const parsed = parseJsonFromNoisyOutput(output);
    const models = normalizeOnboardingModels(parsed?.models || []);
    if (models.length === 0) {
      throw new Error("No models found");
    }
    const entry = {
      version: kModelCatalogCacheVersion,
      fetchedAt: now(),
      models,
    };
    writeDiskCache(entry);
    setCacheEntry(entry, { fresh: true });
    return entry;
  };

  const scheduleRetry = () => {
    if (!memoryCache || retryTimer) return;
    const delayMs = Math.max(backoffUntilMs - now(), 0);
    retryTimer = setTimeoutFn(() => {
      retryTimer = null;
      if (!memoryCache || !cacheIsStale || refreshPromise) return;
      void startBackgroundRefresh();
    }, delayMs);
    if (typeof retryTimer?.unref === "function") retryTimer.unref();
  };

  const handleRefreshFailure = (err) => {
    if (memoryCache) {
      cacheIsStale = true;
      backoffUntilMs = now() + refreshBackoffMs;
      scheduleRetry();
      logger.error?.(
        `[models] Failed to refresh cached models: ${err.message || String(err)}`,
      );
      return;
    }
    logger.error?.(
      `[models] Failed to load dynamic models: ${err.message || String(err)}`,
    );
  };

  const startBackgroundRefresh = () => {
    readDiskCache();
    if (!memoryCache) return null;
    if (refreshPromise) return refreshPromise;
    if (retryTimer) return null;
    if (backoffUntilMs > now()) {
      scheduleRetry();
      return null;
    }
    refreshPromise = Promise.resolve()
      .then(() => loadFreshCatalog())
      .catch((err) => {
        handleRefreshFailure(err);
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
    return refreshPromise;
  };

  return {
    async getCatalogResponse() {
      readDiskCache();
      if (memoryCache && !cacheIsStale) {
        return createResponse({
          source: "openclaw",
          fetchedAt: memoryCache.fetchedAt,
          stale: false,
          refreshing: false,
          models: memoryCache.models,
        });
      }
      if (memoryCache) {
        startBackgroundRefresh();
        return createResponse({
          source: "cache",
          fetchedAt: memoryCache.fetchedAt,
          stale: true,
          refreshing: isRefreshPending(),
          models: memoryCache.models,
        });
      }
      try {
        const freshEntry = await loadFreshCatalog();
        return createResponse({
          source: "openclaw",
          fetchedAt: freshEntry.fetchedAt,
          stale: false,
          refreshing: false,
          models: freshEntry.models,
        });
      } catch (err) {
        handleRefreshFailure(err);
        return createResponse({
          source: "fallback",
          fetchedAt: null,
          stale: false,
          refreshing: false,
          models: fallbackModels,
        });
      }
    },

    markStale() {
      readDiskCache();
      if (!memoryCache) return;
      cacheIsStale = true;
      backoffUntilMs = 0;
      clearRetryTimer();
    },
  };
};

module.exports = {
  createModelCatalogCache,
  createResponse,
  normalizeCachedModels,
  normalizeCacheEntry,
  kModelCatalogCacheVersion,
  kModelCatalogRefreshBackoffMs,
  kDefaultCachePath,
};
