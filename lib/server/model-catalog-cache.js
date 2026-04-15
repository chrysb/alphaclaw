const fs = require("fs");
const path = require("path");
const {
  ALPHACLAW_DIR,
  OPENCLAW_DIR,
  kFallbackOnboardingModels,
} = require("./constants");

const kModelCatalogCacheVersion = 1;
const kModelCatalogRefreshBackoffMs = 30 * 1000;
const kDefaultCachePath = path.join(
  OPENCLAW_DIR,
  "cache",
  "model-catalog.json",
);
const kLegacyCachePath = path.join(ALPHACLAW_DIR, "cache", "model-catalog.json");

const uniquePaths = (items = []) => {
  const seen = new Set();
  return items
    .map((item) => String(item || "").trim())
    .filter((item) => {
      if (!item || seen.has(item)) return false;
      seen.add(item);
      return true;
    });
};

const kDefaultCacheReadPaths = uniquePaths([kDefaultCachePath, kLegacyCachePath]);

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
    (Array.isArray(models) ? models : []).map((model) => {
      const key = getCachedModelKey(model);
      return {
        key,
        name: model?.label || model?.name || key,
      };
    }),
  );

const getCachedModelKey = (model) => {
  const explicitKey = String(model?.key || model?.modelKey || "").trim();
  if (explicitKey) return explicitKey;
  const provider = String(model?.provider || "").trim();
  const id = String(model?.id || model?.model || "").trim();
  return provider && id ? `${provider}/${id}` : "";
};

const getRawCacheModels = (raw) => {
  if (Array.isArray(raw)) return raw;
  if (!raw || typeof raw !== "object") return [];
  if (Array.isArray(raw.models)) return raw.models;
  if (Array.isArray(raw.catalog)) return raw.catalog;
  if (Array.isArray(raw.entries)) return raw.entries;
  return [];
};

const normalizeCacheEntry = ({
  raw,
  fallbackFetchedAt = null,
  normalizeOnboardingModels = (items) => items,
} = {}) => {
  if (!raw || typeof raw !== "object") return null;
  const fetchedAt = Number(raw.fetchedAt || fallbackFetchedAt || 0);
  const models = normalizeCachedModels({
    models: getRawCacheModels(raw),
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

const createModelCatalogCache = (options = {}) => {
  const {
    fsModule = fs,
    pathModule = path,
    shellCmd,
    gatewayEnv = () => ({}),
    parseJsonFromNoisyOutput = () => ({}),
    normalizeOnboardingModels = (items) => items,
    fallbackModels = kFallbackOnboardingModels,
    cachePath = kDefaultCachePath,
    cacheReadPaths = options.cachePath ? [cachePath] : kDefaultCacheReadPaths,
    refreshBackoffMs = kModelCatalogRefreshBackoffMs,
    now = () => Date.now(),
    setTimeoutFn = setTimeout,
    clearTimeoutFn = clearTimeout,
    logger = console,
  } = options;

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

  const getCacheFileFetchedAt = (candidatePath) => {
    try {
      const stat = fsModule.statSync(candidatePath);
      const mtimeMs = Number(stat?.mtimeMs || 0);
      return Number.isFinite(mtimeMs) && mtimeMs > 0 ? mtimeMs : null;
    } catch {
      return null;
    }
  };

  const readDiskCache = () => {
    if (cacheLoaded) return memoryCache;
    cacheLoaded = true;
    for (const candidatePath of uniquePaths([cachePath, ...cacheReadPaths])) {
      try {
        const raw = JSON.parse(fsModule.readFileSync(candidatePath, "utf8"));
        const entry = normalizeCacheEntry({
          raw,
          fallbackFetchedAt: getCacheFileFetchedAt(candidatePath),
          normalizeOnboardingModels,
        });
        if (!entry) continue;
        memoryCache = entry;
        cacheIsStale = true;
        return memoryCache;
      } catch {
        // Try the next candidate. Older deployments used a different path, and
        // operators may also have created a CLI-shaped cache file by hand.
      }
    }
    memoryCache = null;
    cacheIsStale = false;
    return null;
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

  const startBackgroundRefresh = ({ allowEmptyCache = false } = {}) => {
    readDiskCache();
    if (!memoryCache && !allowEmptyCache) return null;
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
      startBackgroundRefresh({ allowEmptyCache: true });
      return createResponse({
        source: "fallback",
        fetchedAt: null,
        stale: false,
        refreshing: isRefreshPending(),
        models: fallbackModels,
      });
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
  kDefaultCacheReadPaths,
  kLegacyCachePath,
};
