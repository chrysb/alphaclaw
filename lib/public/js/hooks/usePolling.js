import { useState, useEffect, useCallback, useRef } from "https://esm.sh/preact/hooks";
import { getCached, setCached } from "../lib/api-cache.js";

export const usePolling = (
  fetcher,
  interval,
  {
    enabled = true,
    pauseWhenHidden = true,
    cacheKey = "",
  } = {},
) => {
  const normalizedCacheKey = String(cacheKey || "");
  const [data, setData] = useState(() =>
    normalizedCacheKey ? getCached(normalizedCacheKey) : null,
  );
  const [error, setError] = useState(null);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const refresh = useCallback(async () => {
    try {
      const result = await fetcherRef.current();
      if (normalizedCacheKey) {
        setCached(normalizedCacheKey, result);
      }
      setData(result);
      setError(null);
      return result;
    } catch (err) {
      setError(err);
      return null;
    }
  }, [normalizedCacheKey]);

  useEffect(() => {
    if (!normalizedCacheKey) return;
    const cached = getCached(normalizedCacheKey);
    if (cached !== null) {
      setData(cached);
    }
  }, [normalizedCacheKey]);

  useEffect(() => {
    if (!enabled) return;
    if (pauseWhenHidden && typeof document !== "undefined" && document.hidden) {
      return undefined;
    }
    refresh();
    const intervalId = setInterval(refresh, interval);
    return () => clearInterval(intervalId);
  }, [enabled, interval, pauseWhenHidden, refresh]);

  useEffect(() => {
    if (!enabled || !pauseWhenHidden || typeof document === "undefined") return;
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        refresh();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [enabled, pauseWhenHidden, refresh]);

  return { data, error, refresh };
};
