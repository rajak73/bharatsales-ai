import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useCurrentUser } from '../../contexts/CurrentUserContext';
import { hasRouteAccess } from '../../lib/auth';

interface RequireRoleProps {
  roles: readonly string[];
  children: ReactNode;
  /** Where to send users without access (defaults to the dashboard home). */
  redirectTo?: string;
}

/**
 * Route guard for dashboard pages. Uses the same role lists as the Sidebar
 * (see navConfig.ts), so typing the URL of a hidden page redirects instead
 * of rendering it.
 */
export function RequireRole({ roles, children, redirectTo = '/dashboard' }: RequireRoleProps) {
  const user = useCurrentUser();
  if (!hasRouteAccess(user, roles)) {
    return <Navigate to={redirectTo} replace />;
  }
  return <>{children}</>;
}
