import { createContext, useContext } from 'react';
import type { CurrentUser } from '../lib/auth';

export const CurrentUserContext = createContext<CurrentUser | null>(null);

/**
 * The signed-in user, decoded once by the dashboard layout. Only usable
 * inside `/dashboard/*` routes (the layout redirects to /login otherwise).
 */
export function useCurrentUser(): CurrentUser {
  const user = useContext(CurrentUserContext);
  if (!user) {
    throw new Error('useCurrentUser() must be used inside the dashboard layout');
  }
  return user;
}
