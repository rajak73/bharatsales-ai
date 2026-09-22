import { LoadingState } from '@bharatsales/ui';

/** Suspense fallback while a lazily-loaded page chunk downloads. */
export function PageLoader({ fullScreen = false }: { fullScreen?: boolean }) {
  return <LoadingState label="Loading…" className={fullScreen ? 'min-h-screen bg-background' : 'min-h-[60vh]'} />;
}
