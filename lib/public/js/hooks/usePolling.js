import { useState, useEffect, useCallback, useRef } from "preact/hooks";
import { getCached, setCached } from "../lib/api-cache.js";

export const usePolling = (
  fetcher,
  interval,
  {
    enabled = true,
    pauseWhenHidden = true,
    cacheKey = "",
    dedupeInFlight = false,
  } = {},
) => {
  const normalizedCacheKey = String(cacheKey || "");
  const [data, setData] = useState(() =>
    normalizedCacheKey ? getCached(normalizedCacheKey) : null,
  );
  const [error, setError] = useState(null);
  const [isPolling, setIsPolling] = useState(false);
  const fetcherRef = useRef(fetcher);
  const inFlightRefreshRef = useRef(null);
  const activeRefreshCountRef = useRef(0);
  const nextRefreshIdRef = useRef(0);
  const latestRefreshIdRef = useRef(0);
  fetcherRef.current = fetcher;

  const refresh = useCallback(async ({ force = false } = {}) => {
    if (dedupeInFlight && inFlightRefreshRef.current && !force) {
      return inFlightRefreshRef.current;
    }
    const refreshId = nextRefreshIdRef.current + 1;
    nextRefreshIdRef.current = refreshId;
    latestRefreshIdRef.current = refreshId;
    activeRefreshCountRef.current += 1;
    setIsPolling(true);
    const refreshPromise = Promise.resolve().then(async () => {
      try {
        const result = await fetcherRef.current();
        if (latestRefreshIdRef.current === refreshId) {
          if (normalizedCacheKey) {
            setCached(normalizedCacheKey, result);
          }
          setData(result);
          setError(null);
        }
        return result;
      } catch (err) {
        if (latestRefreshIdRef.current === refreshId) {
          setError(err);
        }
        return null;
      } finally {
        activeRefreshCountRef.current = Math.max(
          0,
          activeRefreshCountRef.current - 1,
        );
        setIsPolling(activeRefreshCountRef.current > 0);
        if (inFlightRefreshRef.current === refreshPromise) {
          inFlightRefreshRef.current = null;
        }
      }
    });
    if (dedupeInFlight) {
      inFlightRefreshRef.current = refreshPromise;
    }
    return refreshPromise;
  }, [dedupeInFlight, normalizedCacheKey]);

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

  return { data, error, refresh, isPolling };
};
