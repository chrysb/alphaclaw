const fs = require("fs");
const path = require("path");
const {
  ALPHACLAW_DIR,
  kClawRuntime,
  kFallbackOnboardingModels,
} = require("./constants");
const { getCommandOutputCandidates } = require("./utils/command-output");

const kModelCatalogCacheVersion = 1;
const kModelCatalogRefreshBackoffMs = 30 * 1000;
const kModelCatalogLoadTimeoutMs = 120 * 1000;
const kModelCatalogBootstrapSource = "bootstrap";
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

const normalizeOpenclawVersion = (value) => {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized || null;
};

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
    openclawVersion: normalizeOpenclawVersion(raw.openclawVersion),
    models,
  };
};

const parseCatalogModelsFromOutput = ({
  rawOutput,
  parseJsonFromNoisyOutput = () => ({}),
  normalizeOnboardingModels = (items) => items,
} = {}) => {
  const parsed = parseJsonFromNoisyOutput(rawOutput);
  return normalizeOnboardingModels(parsed?.models || []);
};

const createModelCatalogCache = ({
  fsModule = fs,
  pathModule = path,
  shellCmd,
  gatewayEnv = () => ({}),
  parseJsonFromNoisyOutput = () => ({}),
  normalizeOnboardingModels = (items) => items,
  readOpenclawVersion = () => null,
  shouldStartDynamicRefresh = () => true,
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

  const readCurrentOpenclawVersion = ({ refresh = false } = {}) => {
    try {
      return normalizeOpenclawVersion(readOpenclawVersion({ refresh }));
    } catch {
      return null;
    }
  };

  const isCompatibleWithCurrentOpenclaw = ({
    entry,
    currentOpenclawVersion,
  } = {}) => {
    if (!entry) return false;
    if (!currentOpenclawVersion) return true;
    return entry.openclawVersion === currentOpenclawVersion;
  };

  const clearRetryTimer = () => {
    if (!retryTimer) return;
    clearTimeoutFn(retryTimer);
    retryTimer = null;
  };

  const isRefreshPending = () => !!refreshPromise || !!retryTimer;

  const canStartDynamicRefresh = () => {
    try {
      return shouldStartDynamicRefresh() !== false;
    } catch {
      return false;
    }
  };

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
    const openclawVersion = readCurrentOpenclawVersion({ refresh: true });
    let models = [];
    let recoveredFromCommandError = false;
    try {
      const output = await shellCmd(
        kClawRuntime.buildCommand("models list --all --json"),
        {
          env: gatewayEnv(),
          timeout: kModelCatalogLoadTimeoutMs,
        },
      );
      models = parseCatalogModelsFromOutput({
        rawOutput: output,
        parseJsonFromNoisyOutput,
        normalizeOnboardingModels,
      });
    } catch (err) {
      for (const rawOutput of getCommandOutputCandidates(err)) {
        models = parseCatalogModelsFromOutput({
          rawOutput,
          parseJsonFromNoisyOutput,
          normalizeOnboardingModels,
        });
        if (models.length > 0) {
          recoveredFromCommandError = true;
          logger.warn?.(
            `[models] Recovered model catalog from failed command output: ${err.message || String(err)}`,
          );
          break;
        }
      }
      if (models.length === 0) throw err;
    }
    if (models.length === 0) {
      throw new Error("No models found");
    }
    const entry = {
      version: kModelCatalogCacheVersion,
      fetchedAt: now(),
      openclawVersion,
      models,
    };
    writeDiskCache(entry);
    setCacheEntry(entry, { fresh: true });
    if (recoveredFromCommandError) {
      backoffUntilMs = 0;
      clearRetryTimer();
    }
    return entry;
  };

  const scheduleRetry = () => {
    if (!canStartDynamicRefresh()) {
      clearRetryTimer();
      return;
    }
    if (retryTimer) return;
    const delayMs = Math.max(backoffUntilMs - now(), 0);
    retryTimer = setTimeoutFn(() => {
      retryTimer = null;
      if (!canStartDynamicRefresh()) return;
      if (refreshPromise) return;
      if (memoryCache && !cacheIsStale) return;
      void startBackgroundRefresh();
    }, delayMs);
    if (typeof retryTimer?.unref === "function") retryTimer.unref();
  };

  const handleRefreshFailure = (err) => {
    backoffUntilMs = now() + refreshBackoffMs;
    scheduleRetry();
    if (memoryCache) {
      cacheIsStale = true;
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
    if (!canStartDynamicRefresh()) {
      clearRetryTimer();
      return null;
    }
    readDiskCache();
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
        const currentOpenclawVersion = readCurrentOpenclawVersion({
          refresh: true,
        });
        if (
          !isCompatibleWithCurrentOpenclaw({
            entry: memoryCache,
            currentOpenclawVersion,
          })
        ) {
          cacheIsStale = true;
          backoffUntilMs = 0;
          clearRetryTimer();
        }
      }
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
        const didStartRefresh = !!startBackgroundRefresh();
        return createResponse({
          source: "cache",
          fetchedAt: memoryCache.fetchedAt,
          stale: true,
          refreshing:
            canStartDynamicRefresh() && (didStartRefresh || isRefreshPending()),
          models: memoryCache.models,
        });
      }
      const didStartRefresh = !!startBackgroundRefresh();
      return createResponse({
        source: kModelCatalogBootstrapSource,
        fetchedAt: null,
        stale: true,
        refreshing:
          canStartDynamicRefresh() && (didStartRefresh || isRefreshPending()),
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
  kModelCatalogLoadTimeoutMs,
  kModelCatalogBootstrapSource,
  kDefaultCachePath,
};
