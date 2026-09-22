/**
 * Client-side session helpers. The JWT is only *decoded* here (never
 * verified) — it drives UI decisions like which nav items/routes to show.
 * The API remains the source of truth for authorization.
 */

export const ROLES = {
  SUPER_ADMIN: 'Super Admin',
  ORG_ADMIN: 'Organization Admin',
  SALES_MANAGER: 'Sales Manager',
  SALES_REP: 'Sales Representative',
  DISTRIBUTOR: 'Distributor',
} as const;

export interface CurrentUser {
  id?: string;
  name: string;
  email: string;
  role: string;
  orgId?: string;
  platformAdmin: boolean;
}

const TOKEN_KEY = 'bharatsales_token';
const USER_KEY = 'user';

/** Decodes a JWT payload. Handles base64url (`-`/`_`, no padding) and UTF-8. */
export function decodeJwtPayload<T = Record<string, unknown>>(token: string): T {
  const segment = token.split('.')[1];
  if (!segment) throw new Error('Malformed token');
  const base64 = segment.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes)) as T;
}

/**
 * Reads the signed-in user from localStorage. Returns null when there is no
 * token or it cannot be decoded (the caller should send the user to /login).
 */
export function readCurrentUser(): CurrentUser | null {
  let token: string | null = null;
  try {
    token = localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
  if (!token) return null;

  try {
    const payload = decodeJwtPayload<{
      sub?: string;
      email?: string;
      role?: string;
      orgId?: string;
      platformAdmin?: boolean;
    }>(token);

    // The JWT only carries auth claims — display fields like the user's name
    // live in the `user` object AuthService stores next to the token.
    let stored: { id?: string; _id?: string; name?: string; email?: string; role?: string } | null = null;
    try {
      const raw = localStorage.getItem(USER_KEY);
      stored = raw ? JSON.parse(raw) : null;
    } catch {
      stored = null;
    }

    return {
      id: payload.sub || stored?.id || stored?._id,
      name: stored?.name || 'User',
      email: stored?.email || payload.email || '',
      role: payload.role || stored?.role || ROLES.SALES_REP,
      orgId: payload.orgId,
      platformAdmin: payload.platformAdmin === true,
    };
  } catch (e) {
    console.error('Failed to decode session token', e);
    return null;
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // storage unavailable — nothing to clear
  }
}

export function isPlatformAdmin(user: Pick<CurrentUser, 'role' | 'platformAdmin'>): boolean {
  return user.platformAdmin || user.role === ROLES.SUPER_ADMIN;
}

/** True when `user` may open a route restricted to `roles`. */
export function hasRouteAccess(user: CurrentUser, roles: readonly string[]): boolean {
  if (roles.includes(user.role)) return true;
  // Platform admins carry the `platformAdmin` claim even if their display
  // role differs; treat them as Super Admin for platform-only routes.
  return user.platformAdmin && roles.includes(ROLES.SUPER_ADMIN);
}
