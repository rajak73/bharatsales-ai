import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../database/db';
import { SyncEngine } from '../sync/syncEngine';

export function useSyncEngine() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // Real-time count of items waiting to be synced
  const pendingCount = useLiveQuery(
    () => db.syncQueue.where('status').equals('PENDING').count(),
    []
  ) ?? 0;

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
    forceSync: () => SyncEngine.triggerSync()
  };
}
