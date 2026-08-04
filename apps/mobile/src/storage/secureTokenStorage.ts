import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import type { TokenStorage } from '@bharatsales/api-client';
import { useSessionStore } from '../store/sessionStore';

const ACCESS_TOKEN_KEY = 'bharatsales_token';
const REFRESH_TOKEN_KEY = 'bharatsales_refresh_token';
const USER_KEY = 'bharatsales_user';

// Mirrors packages/api-client's webTokenStorage contract exactly, but backed
// by expo-secure-store (encrypted, OS-keychain-backed) instead of
// localStorage, and redirects via expo-router instead of window.location.
export const secureTokenStorage: TokenStorage = {
  async getAccessToken() {
    try {
      return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
    } catch (err) {
      console.error('[SecureStore] getAccessToken failed', err);
      return null;
    }
  },
  async getRefreshToken() {
    try {
      return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    } catch (err) {
      console.error('[SecureStore] getRefreshToken failed', err);
      return null;
    }
  },
  async setTokens(accessToken: string, refreshToken: string) {
    // AuthService.login() awaits setTokens() BEFORE calling setUser() — if
    // a SecureStore write throws here (e.g. a device Keystore issue) and
    // this propagates uncaught, setUser() never runs at all, meaning the
    // in-memory session (which drives navigation) never updates either,
    // even though the login API call itself fully succeeded. Swallow so a
    // persistence failure only costs "stay logged in across restarts",
    // not the entire login flow.
    try {
      await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
    } catch (err) {
      console.error('[SecureStore] setTokens failed — session will not persist across app restarts', err);
    }
  },
  async setUser(user: any) {
    // Update the in-memory session first — this is what every screen's
    // navigation guard actually reads, so it must never be gated on the
    // SecureStore write (best-effort persistence) succeeding.
    useSessionStore.getState().setUser(user);
    try {
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
    } catch (err) {
      console.error('[SecureStore] setUser persistence failed', err);
    }
  },
  async clearTokens() {
    useSessionStore.getState().setUser(null);
    try {
      await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
      await SecureStore.deleteItemAsync(USER_KEY);
    } catch (err) {
      console.error('[SecureStore] clearTokens failed', err);
    }
  },
  onUnauthenticated() {
    router.replace('/login');
  },
};

// Called once at app startup (before any API call) to hydrate Zustand's
// in-memory session from whatever SecureStore already has on disk, since
// SecureStore itself is async and can't be read synchronously at import time.
export async function loadStoredUser(): Promise<any | null> {
  try {
    const raw = await SecureStore.getItemAsync(USER_KEY);
    const token = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
    if (!raw || !token) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.error('[SecureStore] loadStoredUser failed', err);
    return null;
  }
}
