import { useCallback, useState } from 'react';
import { SyncEngine } from '../sync/syncEngine';

/**
 * Pull-to-refresh for screens backed by the offline cache: pushes the sync
 * queue and re-downloads from the server (which then re-reads every local
 * query), instead of only re-reading what is already on the phone.
 * `alsoRefetch` runs afterwards for any non-cached (live) queries on the screen.
 */
export function useServerRefresh(alsoRefetch?: () => unknown) {
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await SyncEngine.refreshFromServer({ force: true });
    } catch (err) {
      console.warn('[Sync] pull-to-refresh failed', err);
    } finally {
      try {
        await alsoRefetch?.();
      } catch {
        /* the screen shows its own error state */
      }
      setRefreshing(false);
    }
  }, [alsoRefetch]);
  return { refreshing, onRefresh };
}
