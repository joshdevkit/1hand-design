import { useCallback, useEffect, useRef, useState } from "react";

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Minimal data-fetching hook used by the feature hooks. Mirrors the
 * "query" semantics of Convex: fetch on mount, expose loading/error states,
 * and expose a `reload` for manual refreshes.
 */
export function useAsync<T>(
  fetcher: () => Promise<T>,
  deps: unknown[] = [],
): AsyncState<T> & { reload: () => void } {
  const [state, setState] = useState<AsyncState<T>>({ data: null, loading: true, error: null });
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const requestId = useRef(0);

  const load = useCallback(() => {
    const currentRequest = ++requestId.current;
    setState((prev) => ({ ...prev, loading: true, error: null }));
    fetcherRef
      .current()
      .then((data) => {
        if (currentRequest === requestId.current) {
          setState({ data, loading: false, error: null });
        }
      })
      .catch((error: unknown) => {
        if (currentRequest === requestId.current) {
          setState({ data: null, loading: false, error: error instanceof Error ? error : new Error(String(error)) });
        }
      });
  }, []);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { ...state, reload: load };
}
