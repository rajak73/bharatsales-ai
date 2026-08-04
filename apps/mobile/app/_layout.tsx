import { useCallback, useEffect } from 'react';
import { Stack } from 'expo-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { setTokenStorage } from '@bharatsales/api-client';
import { secureTokenStorage, loadStoredUser } from '../src/storage/secureTokenStorage';
import { useSessionStore } from '../src/store/sessionStore';
import { useOrgStore } from '../src/store/orgStore';
import { queryClient } from '../src/lib/queryClient';
import { getDb } from '../src/db/client';
import { SyncEngine, startAutoSync } from '../src/sync/syncEngine';
import { registerForPushNotifications } from '../src/lib/registerPushNotifications';
import { FONTS_TO_LOAD } from '../src/theme/tokens';
import { ErrorBoundary } from '../src/components/ErrorBoundary';

// Registered once, before any screen renders or API call fires, so every
// apiClient request/response interceptor in @bharatsales/api-client reads
// tokens from expo-secure-store instead of the web default (localStorage).
setTokenStorage(secureTokenStorage);

// Keep the native splash screen up until fonts are loaded AND the stored
// session has been read — avoids a flash of unstyled (system-font) text or
// an unauthenticated flicker before redirecting into (rep)/(distributor).
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const user = useSessionStore((s) => s.user);
  const setUser = useSessionStore((s) => s.setUser);
  const isInitializing = useSessionStore((s) => s.isInitializing);
  const setInitializing = useSessionStore((s) => s.setInitializing);
  const loadOrgBranding = useOrgStore((s) => s.loadOrgBranding);
  const resetOrgBranding = useOrgStore((s) => s.reset);

  const [fontsLoaded, fontError] = useFonts(FONTS_TO_LOAD);
  const appReady = (fontsLoaded || !!fontError) && !isInitializing;

  useEffect(() => {
    getDb().catch((err) => console.error('[DB] Failed to open/migrate local database', err));
    loadStoredUser()
      .then(setUser)
      .finally(() => setInitializing(false));

    const unsubscribe = startAutoSync();
    return unsubscribe;
  }, [setUser, setInitializing]);

  useEffect(() => {
    if (user && (user.role === 'Sales Representative' || user.role === 'Distributor')) {
      SyncEngine.pullSync(user.role).catch((err) => console.error('[Sync] pullSync failed', err));
      SyncEngine.triggerSync().catch((err) => console.error('[Sync] triggerSync failed', err));
      loadOrgBranding().catch((err) => console.error('[Org] loadOrgBranding failed', err));
      registerForPushNotifications();
    } else {
      resetOrgBranding();
    }
  }, [user, loadOrgBranding, resetOrgBranding]);

  const onLayoutRootView = useCallback(async () => {
    if (appReady) {
      await SplashScreen.hideAsync().catch(() => {});
    }
  }, [appReady]);

  useEffect(() => {
    onLayoutRootView();
  }, [onLayoutRootView]);

  if (!appReady) {
    return null;
  }

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <QueryClientProvider client={queryClient}>
            <Stack screenOptions={{ headerShown: false }} />
          </QueryClientProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
