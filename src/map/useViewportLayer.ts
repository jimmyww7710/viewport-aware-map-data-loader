import { useEffect, useRef, useState } from 'react';
import type { Bounds } from '../api/client';

export function useViewportLayer<T>(
  enabled: boolean,
  getViewport: () => { bounds: Bounds; zoom: number },
  load: (bounds: Bounds, zoom: number, signal: AbortSignal) => Promise<T[]>,
  onData: (data: T[]) => void,
  onStats: (stats: { request: boolean; aborted: boolean; stale: boolean; loading: boolean }) => void,
  debounceMs = 300,
  refreshKey = 0,
) {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const latest = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const controller = useRef<AbortController>();
  useEffect(() => {
    if (!enabled) {
      controller.current?.abort();
      onData([]);
      return;
    }
    const schedule = () => {
      clearTimeout(timer.current);
      timer.current = setTimeout(async () => {
        controller.current?.abort();
        const requestId = ++latest.current;
        const nextController = new AbortController();
        controller.current = nextController;
        setLoading(true);
        onStats({ request: true, aborted: false, stale: false, loading: true });
        const { bounds, zoom } = getViewport();
        try {
          const data = await load(bounds, zoom, nextController.signal);
          if (requestId !== latest.current) {
            onStats({ request: false, aborted: false, stale: true, loading: false });
            return;
          }
          onData(data);
          setError('');
        } catch (reason) {
          if (nextController.signal.aborted) {
            onStats({ request: false, aborted: true, stale: false, loading: false });
          } else {
            setError(reason instanceof Error ? reason.message : 'Request failed.');
          }
        } finally {
          if (requestId === latest.current) setLoading(false);
        }
      }, debounceMs);
    };
    schedule();
    return () => {
      clearTimeout(timer.current);
      controller.current?.abort();
    };
  }, [enabled, getViewport, load, onData, onStats, debounceMs, refreshKey]);
  return { error, loading };
}
