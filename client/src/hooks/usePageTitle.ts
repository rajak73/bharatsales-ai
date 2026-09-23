import { useEffect } from 'react';

export const APP_NAME = 'BharatSales AI';
export const DEFAULT_TITLE = 'BharatSales AI - Field Sales Automation & Distributor Management';

/** Sets `document.title` while the calling page is mounted. */
export function usePageTitle(title?: string) {
  useEffect(() => {
    const previous = document.title;
    document.title = title ? `${title} | ${APP_NAME}` : DEFAULT_TITLE;
    return () => {
      document.title = previous;
    };
  }, [title]);
}
