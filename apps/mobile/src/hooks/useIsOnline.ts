import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';

// Lets a screen choose ErrorState's `offline` variant vs a genuine retry-able
// error — SyncEngine already uses the same NetInfo check internally
// (src/sync/syncEngine.ts's isOnline()); this just exposes it reactively for
// UI, not for the sync engine's own online/offline decisions.
export function useIsOnline(): boolean {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    NetInfo.fetch().then((state) => setIsOnline(!!state.isConnected && state.isInternetReachable !== false));
    return NetInfo.addEventListener((state) => {
      setIsOnline(!!state.isConnected && state.isInternetReachable !== false);
    });
  }, []);

  return isOnline;
}
