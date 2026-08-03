import { useEffect, useState } from 'react';
import { onSyncStatus } from '../sync/syncEngine';
import { getPendingCount } from '../db/syncQueue';

export function useSyncStatus() {
  const [status, setStatus] = useState({ isSyncing: false, pendingCount: 0 });

  useEffect(() => {
    getPendingCount().then((pendingCount) => setStatus((s) => ({ ...s, pendingCount })));
    return onSyncStatus(setStatus);
  }, []);

  return status;
}
