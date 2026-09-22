import { useCallback } from 'react';
import { Alert } from 'react-native';
import { AuthService } from '@bharatsales/api-client';
import { useSessionStore, isAllowedRole, getCurrentUserId } from '../store/sessionStore';
import { secureTokenStorage } from '../storage/secureTokenStorage';
import { getUnsyncedCount, clearSyncQueue } from '../db/syncQueue';
import { SyncEngine, refreshSyncStatus } from '../sync/syncEngine';

async function safeUnsyncedCount(): Promise<number> {
  try {
    return await getUnsyncedCount(getCurrentUserId());
  } catch (err) {
    console.error('[Auth] Could not read sync queue before logout', err);
    return 0;
  }
}

export function useAuth() {
  const user = useSessionStore((s) => s.user);
  const isInitializing = useSessionStore((s) => s.isInitializing);

  const login = useCallback(async (credentials: { email: string; password: string }) => {
    const data = await AuthService.login(credentials);
    if (!data?.access_token || !data?.user) {
      throw new Error('No token received');
    }

    if (!isAllowedRole(data.user.role)) {
      await secureTokenStorage.clearTokens();
      throw new Error(
        `This app is for Sales Representatives and Distributors only. Your role (${data.user.role}) should use the BharatSales AI web dashboard.`
      );
    }

    // AuthService.login already wrote tokens+user via getTokenStorage()
    // (secureTokenStorage once we register it at app start), which also
    // updates useSessionStore — nothing more to persist here.
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    // AuthService.logout() clears tokens (and the local SQLite cache, via
    // secureTokenStorage.clearTokens()) and redirects to /login itself, even
    // if the server-side revoke call fails.
    //
    // Unsynced queue items (PENDING/FAILED orders, payments, deliveries…)
    // would be orphaned or leak into the next user's session, so never log
    // out past them silently.
    const unsynced = await safeUnsyncedCount();
    if (unsynced === 0) {
      await AuthService.logout();
      return;
    }

    Alert.alert(
      'Unsynced data',
      `${unsynced} item(s) have not been sent to the server yet. Logging out now will permanently delete them from this device.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sync now',
          onPress: async () => {
            try {
              await SyncEngine.triggerSync();
            } catch (err) {
              console.warn('[Auth] Sync before logout failed', err);
            }
            const left = await safeUnsyncedCount();
            if (left === 0) {
              await AuthService.logout();
            } else {
              Alert.alert(
                'Still not synced',
                `${left} item(s) could not be synced yet. Check your connection, or review failed items under Profile > Sync before logging out.`
              );
            }
          },
        },
        {
          text: 'Log out anyway (discard)',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearSyncQueue(getCurrentUserId());
              await refreshSyncStatus();
            } catch (err) {
              console.error('[Auth] Failed to clear sync queue on logout', err);
            }
            await AuthService.logout();
          },
        },
      ]
    );
  }, []);

  return { user, isAuthenticated: !!user, isInitializing, login, logout };
}
