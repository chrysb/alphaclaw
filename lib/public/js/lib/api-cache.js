const kApiCache = new Map();
const kInFlightByKey = new Map();

const nowMs = () => Date.now();

const isFresh = (entry, maxAgeMs) => {
  if (!entry) return false;
  return nowMs() - Number(entry.fetchedAt || 0) < Number(maxAgeMs || 0);
};

export const getCached = (key = "") => {
  const normalizedKey = String(key || "");
  if (!normalizedKey) return null;
  return kApiCache.get(normalizedKey)?.data ?? null;
};

export const setCached = (key = "", data = null) => {
  const normalizedKey = String(key || "");
  if (!normalizedKey) return data;
  kApiCache.set(normalizedKey, {
    data,
    fetchedAt: nowMs(),
  });
  return data;
};

export const invalidateCache = (key = "") => {
  const normalizedKey = String(key || "");
  if (!normalizedKey) return;
  kApiCache.delete(normalizedKey);
  kInFlightByKey.delete(normalizedKey);
};

export const cachedFetch = async (
  key,
  fetcher,
  {
    maxAgeMs = 15000,
    force = false,
    staleWhileRevalidate = true,
    onRevalidate = null,
  } = {},
) => {
  const normalizedKey = String(key || "");
  if (!normalizedKey || typeof fetcher !== "function") {
    return fetcher();
  }

  const entry = kApiCache.get(normalizedKey);
  if (!force && isFresh(entry, maxAgeMs)) {
    return entry.data;
  }

  if (!force && staleWhileRevalidate && entry) {
    if (!kInFlightByKey.has(normalizedKey)) {
      const backgroundPromise = Promise.resolve()
        .then(() => fetcher())
        .then((result) => {
          setCached(normalizedKey, result);
          if (typeof onRevalidate === "function") {
            onRevalidate(result);
          }
          return result;
        })
        .finally(() => {
          kInFlightByKey.delete(normalizedKey);
        });
      kInFlightByKey.set(normalizedKey, backgroundPromise);
    }
    return entry.data;
  }

  if (kInFlightByKey.has(normalizedKey)) {
    return kInFlightByKey.get(normalizedKey);
  }

  const requestPromise = Promise.resolve()
    .then(() => fetcher())
    .then((result) => {
      setCached(normalizedKey, result);
      return result;
    })
    .finally(() => {
      kInFlightByKey.delete(normalizedKey);
    });
  kInFlightByKey.set(normalizedKey, requestPromise);
  return requestPromise;
};
