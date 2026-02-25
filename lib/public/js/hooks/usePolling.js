import { useState, useEffect, useCallback, useRef } from 'https://esm.sh/preact/hooks';

export const usePolling = (fetcher, interval, { enabled = true } = {}) => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const refresh = useCallback(async () => {
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
    if (!enabled) return;
    refresh();
    const id = setInterval(refresh, interval);
    return () => clearInterval(id);
  }, [enabled, interval, refresh]);

  return { data, error, refresh };
};
