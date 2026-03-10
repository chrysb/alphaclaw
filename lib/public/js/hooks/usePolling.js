import { useState, useEffect, useCallback, useRef } from 'https://esm.sh/preact/hooks';

export const usePolling = (fetcher, interval, { enabled = true } = {}) => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [pollingPaused, setPollingPaused] = useState(() => {
    try {
      return !!window.__alphaclawPollingPaused;
    } catch {
      return false;
    }
  });
  const fetcherRef = useRef(fetcher);
  const pollingPausedRef = useRef(pollingPaused);
  fetcherRef.current = fetcher;
  pollingPausedRef.current = pollingPaused;

  const refresh = useCallback(async () => {
    if (pollingPausedRef.current) {
      return null;
    }
    try {
      const result = await fetcherRef.current();
      setData(result);
      setError(null);
      return result;
    } catch (err) {
      setError(err);
      return null;
    }
  }, []);

  useEffect(() => {
    if (!enabled || pollingPaused) return;
    refresh();
    const id = setInterval(refresh, interval);
    return () => clearInterval(id);
  }, [enabled, interval, pollingPaused, refresh]);

  useEffect(() => {
    const handlePollingPauseChanged = (event) => {
      setPollingPaused(!!event?.detail?.paused);
    };
    window.addEventListener(
      "alphaclaw:polling-pause-changed",
      handlePollingPauseChanged,
    );
    return () => {
      window.removeEventListener(
        "alphaclaw:polling-pause-changed",
        handlePollingPauseChanged,
      );
    };
  }, []);

  return { data, error, refresh };
};
