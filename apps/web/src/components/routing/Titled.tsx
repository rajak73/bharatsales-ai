import type { ReactNode } from 'react';
import { usePageTitle } from '../../hooks/usePageTitle';

/** Sets the document title for a route (replaces Next.js `metadata`). */
export function Titled({ title, children }: { title?: string; children: ReactNode }) {
  usePageTitle(title);
  return <>{children}</>;
}
