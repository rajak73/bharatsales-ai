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
    return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  },
  async getRefreshToken() {
    return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  },
  async setTokens(accessToken: string, refreshToken: string) {
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
  },
  async setUser(user: any) {
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
    useSessionStore.getState().setUser(user);
  },
  async clearTokens() {
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
    useSessionStore.getState().setUser(null);
  },
  onUnauthenticated() {
    router.replace('/login');
  },
};

// Called once at app startup (before any API call) to hydrate Zustand's
// in-memory session from whatever SecureStore already has on disk, since
// SecureStore itself is async and can't be read synchronously at import time.
export async function loadStoredUser(): Promise<any | null> {
  const raw = await SecureStore.getItemAsync(USER_KEY);
  const token = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  if (!raw || !token) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
