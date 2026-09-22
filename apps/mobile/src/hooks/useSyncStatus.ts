import { useEffect, useState } from 'react';
import { onSyncStatus, getSyncStatus, type SyncStatus } from '../sync/syncEngine';

export function useSyncStatus(): SyncStatus {
  const [status, setStatus] = useState<SyncStatus>({ isSyncing: false, pendingCount: 0, failedCount: 0 });

  useEffect(() => {
    let active = true;
    getSyncStatus()
      .then((s) => { if (active) setStatus(s); })
      .catch(() => {});
    const unsubscribe = onSyncStatus(setStatus);
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  return status;
}
