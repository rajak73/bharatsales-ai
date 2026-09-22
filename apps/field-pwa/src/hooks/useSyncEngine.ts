import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import type { SyncQueueItem } from '../database/db';
import { SyncEngine } from '../sync/syncEngine';
import { getCurrentUserId } from '../sync/ownership';

export type SyncIssue = SyncQueueItem & { foreign: boolean };

const NO_ISSUES: SyncIssue[] = [];

export function useSyncEngine() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const userId = getCurrentUserId();

  // Live queue counts for the logged-in user: pending = PENDING (incl.
  // backing off) + SYNCING; failed = their FAILED items plus anything another
  // user queued on this device.
  const counts = useLiveQuery(() => SyncEngine.countByStatus(userId), [userId]);
  const pendingCount = counts?.pendingCount ?? 0;
  const failedCount = counts?.failedCount ?? 0;

  // The items behind failedCount, for the Sync issues screen.
  const failedItems = useLiveQuery(() => SyncEngine.getFailed(userId), [userId]) ?? NO_ISSUES;

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Automatically trigger a sync when internet is restored
      SyncEngine.triggerSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check on mount
    if (navigator.onLine) {
      SyncEngine.triggerSync();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    isOnline,
    pendingCount,
    failedCount,
    failedItems,
    forceSync: () => SyncEngine.triggerSync(),
    retryFailed: (id: number) => SyncEngine.retryFailed(id),
    discardFailed: (id: number) => SyncEngine.discardFailed(id),
  };
}
