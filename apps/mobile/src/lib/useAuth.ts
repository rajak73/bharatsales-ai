import { useCallback } from 'react';
import { AuthService } from '@bharatsales/api-client';
import { useSessionStore, isAllowedRole } from '../store/sessionStore';
import { secureTokenStorage } from '../storage/secureTokenStorage';

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
    // AuthService.logout() clears tokens and redirects to /login itself via
    // secureTokenStorage.clearTokens()/onUnauthenticated() — no need to
    // duplicate that here even if the server-side revoke call fails.
    await AuthService.logout();
  }, []);

  return { user, isAuthenticated: !!user, isInitializing, login, logout };
}
