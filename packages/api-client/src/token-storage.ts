export interface TokenStorage {
  getAccessToken(): Promise<string | null>;
  getRefreshToken(): Promise<string | null>;
  setTokens(accessToken: string, refreshToken: string): Promise<void>;
  setUser(user: any): Promise<void>;
  clearTokens(): Promise<void>;
  // Called when a session is unauthenticated and cannot be refreshed (no
  // refresh token, or the refresh call itself failed). Web redirects to
  // /login; React Native instead resets in-app navigation state.
  onUnauthenticated(): void;
}

// Preserves the exact pre-existing web/PWA behavior: localStorage-backed,
// guarded by `typeof window !== 'undefined'` for SSR safety, redirecting via
// `window.location.href` on an unrecoverable 401.
export const webTokenStorage: TokenStorage = {
  async getAccessToken() {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('bharatsales_token');
  },
  async getRefreshToken() {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('bharatsales_refresh_token');
  },
  async setTokens(accessToken: string, refreshToken: string) {
    if (typeof window === 'undefined') return;
    localStorage.setItem('bharatsales_token', accessToken);
    localStorage.setItem('bharatsales_refresh_token', refreshToken);
  },
  async setUser(user: any) {
    if (typeof window === 'undefined') return;
    localStorage.setItem('user', JSON.stringify(user));
  },
  async clearTokens() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('bharatsales_token');
    localStorage.removeItem('bharatsales_refresh_token');
    localStorage.removeItem('user');
  },
  onUnauthenticated() {
    if (typeof window === 'undefined') return;
    window.location.href = '/login';
  },
};

let currentStorage: TokenStorage = webTokenStorage;

// Called once at app startup by a non-web consumer (e.g. the React Native
// app) to swap in a platform-appropriate implementation (e.g. backed by
// expo-secure-store). Web and field-pwa never call this — they keep the
// default `webTokenStorage` behavior untouched.
export function setTokenStorage(storage: TokenStorage): void {
  currentStorage = storage;
}

export function getTokenStorage(): TokenStorage {
  return currentStorage;
}
