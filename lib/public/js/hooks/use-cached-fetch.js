import { useCallback, useEffect, useMemo, useState } from "preact/hooks";
import { cachedFetch, getCached } from "../lib/api-cache.js";

export const useCachedFetch = (
  key,
  fetcher,
  {
    enabled = true,
    maxAgeMs = 15000,
    staleWhileRevalidate = true,
  } = {},
) => {
  const normalizedKey = useMemo(() => String(key || ""), [key]);
  const initialCachedData = useMemo(() => getCached(normalizedKey), [normalizedKey]);
  const [data, setData] = useState(initialCachedData);
  const [loading, setLoading] = useState(initialCachedData === null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setData(getCached(normalizedKey));
  }, [normalizedKey]);

  const refresh = useCallback(
    async ({ force = false } = {}) => {
      if (!enabled) return getCached(normalizedKey);
      if (getCached(normalizedKey) === null) {
        setLoading(true);
      }
      try {
        const next = await cachedFetch(normalizedKey, fetcher, {
          maxAgeMs,
          force,
          staleWhileRevalidate,
          onRevalidate: (revalidatedData) => {
            setData(revalidatedData);
            setError(null);
          },
        });
        setData(next);
        setError(null);
        return next;
      } catch (err) {
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [enabled, fetcher, maxAgeMs, normalizedKey, staleWhileRevalidate],
  );

  useEffect(() => {
    if (!enabled) return;
    refresh().catch(() => {});
  }, [enabled, refresh]);

  return {
    data,
    error,
    loading,
    refresh,
  };
};
