import { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import type { UILinkProps } from '@bharatsales/ui';

/**
 * Adapter so @bharatsales/ui components (breadcrumbs, menus, PageHeader
 * back links) navigate with react-router instead of full page loads.
 * External/absolute URLs fall back to a plain <a>.
 */
export const RouterLink = forwardRef<HTMLAnchorElement, UILinkProps>(function RouterLink({ href, ...rest }, ref) {
  if (/^(https?:|mailto:|tel:)/.test(href)) return <a ref={ref} href={href} {...rest} />;
  return <Link ref={ref} to={href} {...rest} />;
});
