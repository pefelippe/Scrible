// Reactive data fetch: re-runs fn on mount and whenever deps change.
// reload() triggers an immediate re-run without clearing data (e.g. after a
// mutation). fn is always the latest version via ref so only the values that
// should trigger a refetch need to be included in deps.
import { DependencyList, useCallback, useEffect, useRef, useState } from 'react';
import { errorMessage } from '@lib/format';

export function useAsync<T>(
  fn: () => Promise<T>,
  fallback: string,
  deps: DependencyList,
): { data: T | null; error: string | null; reload: () => void } {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fnRef = useRef(fn);
  // Always keep fnRef current so useCallback below never goes stale.
  // eslint-disable-next-line react-hooks/refs
  fnRef.current = fn;

   
  const reload = useCallback(() => {
    setError(null);
    fnRef.current()
      .then(setData)
      .catch((err: unknown) => setError(errorMessage(err, fallback)));
  // eslint-disable-next-line react-hooks/use-memo, react-hooks/exhaustive-deps
  }, deps);

  // On dep changes: clear stale data then fetch. Manual reload() skips
  // clearing so existing data stays visible while refreshing.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setData(null);
    reload();
  }, [reload]);

  return { data, error, reload };
}
