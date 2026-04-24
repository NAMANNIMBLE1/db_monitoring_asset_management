import { useEffect, useRef, useState, useCallback } from 'react';

export default function usePolling(fetchFn, intervalMs = 60000, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const timer = useRef(null);

  const load = useCallback(async () => {
    try {
      const result = await fetchFn();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to fetch');
    } finally {
      setLoading(false);
    }
  }, [fetchFn]);

  useEffect(() => {
    setLoading(true);
    load();
    timer.current = setInterval(load, intervalMs);
    return () => clearInterval(timer.current);
  }, [load, intervalMs, ...deps]);

  return { data, loading, error, refresh: load };
}
