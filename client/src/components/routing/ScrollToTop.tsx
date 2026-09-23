import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/** Scrolls to the top on route change (the Next.js router did this for us). */
export function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}
